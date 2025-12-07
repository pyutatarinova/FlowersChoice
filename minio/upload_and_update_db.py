#!/usr/bin/env python3
"""
Upload images from a directory to Minio and update `plants.features.photo` in Postgres.

Usage example:
  python upload_and_update_db.py --dir C:/photos --minio-endpoint http://localhost:9000 \
    --minio-access minioadmin --minio-secret minioadmin --bucket plants \
    --db-host localhost --db-port 5432 --db-name mydb --db-user myuser --db-pass mypass

Environment variables supported (used if CLI args omitted):
  MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_ENDPOINT
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

Behavior:
 - For every file in the directory whose filename (without extension) is an integer id,
   the script attempts to find a plant with that id in the `plants` table.
 - If found, uploads the file to the bucket (created if necessary) with key `<id><ext>`
   and sets a public read policy on the bucket.
 - Updates `plants.features` JSONB to set/replace the `photo` field with a permanent URL
   of the form `http://<minio-host>:<port>/<bucket>/<object>`.
 - Prints a JSON mapping id -> url for uploaded items and logs skipped files.

Dependencies: `boto3`, `psycopg2-binary`
"""

import argparse
import os
import sys
import json
import logging
from urllib.parse import urlparse
from dotenv import load_dotenv

import boto3
from botocore.client import Config
import psycopg2
import mimetypes

load_dotenv()

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.heic'}


def parse_args():
    p = argparse.ArgumentParser(description="Upload images to Minio and update plants.features.photo")
    p.add_argument('--dir', required=True, help='Directory with photos')
    p.add_argument('--minio-endpoint', default=os.environ.get('MINIO_ENDPOINT', 'http://localhost:9000'))
    p.add_argument('--minio-access', default=os.environ.get('MINIO_ROOT_USER'))
    p.add_argument('--minio-secret', default=os.environ.get('MINIO_ROOT_PASSWORD'))
    p.add_argument('--bucket', default='plants')

    p.add_argument('--db-host', default=os.environ.get('DB_HOST', 'localhost'))
    p.add_argument('--db-port', default=os.environ.get('DB_PORT', 5432), type=int)
    p.add_argument('--db-name', default=os.environ.get('DB_NAME'))
    p.add_argument('--db-user', default=os.environ.get('DB_USER'))
    # Support both DB_PASSWORD and DB_PASS (docker-compose uses DB_PASS)
    p.add_argument('--db-pass', default=(os.environ.get('DB_PASSWORD') or os.environ.get('DB_PASS')))

    return p.parse_args()


def ensure_bucket(s3, bucket_name, endpoint_url, access_key, secret_key):
    existing = False
    try:
        s3.head_bucket(Bucket=bucket_name)
        existing = True
    except Exception:
        existing = False

    if not existing:
        logging.info('Creating bucket "%s"', bucket_name)
        # For Minio, set LocationConstraint is optional; boto3 can create bucket without it
        s3.create_bucket(Bucket=bucket_name)

    # Make bucket public by applying a simple read-only policy for GetObject
    parsed = urlparse(endpoint_url)
    host = parsed.hostname or 'localhost'
    port = parsed.port
    scheme = parsed.scheme or 'http'

    # Build base host (without port) for policy condition not necessary; we'll use ARN
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
            }
        ]
    }

    try:
        s3.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))
        logging.info('Applied public read policy to bucket "%s"', bucket_name)
    except Exception as e:
        logging.warning('Could not apply bucket policy: %s', e)


def build_public_url(endpoint_url, bucket, object_key):
    # For Minio path-style access, construct: <scheme>://<host>:<port>/<bucket>/<object>
    parsed = urlparse(endpoint_url)
    scheme = parsed.scheme or 'http'
    netloc = parsed.netloc
    return f"{scheme}://{netloc}/{bucket}/{object_key}"


def connect_db(host, port, dbname, user, password):
    if not all([dbname, user, password]):
        raise RuntimeError('DB connection details missing. Provide DB_NAME, DB_USER, DB_PASSWORD.')
    conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password)
    conn.autocommit = False
    return conn


def upload_and_update(args):
    # Configure S3 client for Minio
    s3 = boto3.client(
        's3',
        endpoint_url=args.minio_endpoint,
        aws_access_key_id=args.minio_access,
        aws_secret_access_key=args.minio_secret,
        config=Config(signature_version='s3v4'),
    )

    ensure_bucket(s3, args.bucket, args.minio_endpoint, args.minio_access, args.minio_secret)

    conn = connect_db(args.db_host, args.db_port, args.db_name, args.db_user, args.db_pass)
    cur = conn.cursor()

    results = {}

    # Iterate files
    for entry in os.listdir(args.dir):
        full = os.path.join(args.dir, entry)
        if not os.path.isfile(full):
            continue
        name, ext = os.path.splitext(entry)
        ext = ext.lower()
        if ext not in IMAGE_EXTS:
            logging.info('Skipping non-image file: %s', entry)
            continue

        try:
            plant_id = int(name)
        except Exception:
            logging.info('Skipping file with non-integer name: %s', entry)
            continue

        # Check if plant exists
        cur.execute('SELECT id FROM plants WHERE id = %s', (plant_id,))
        row = cur.fetchone()
        if not row:
            logging.info('No plant with id=%s found in DB - skipping', plant_id)
            continue

        object_key = f"{plant_id}{ext}"
        logging.info('Uploading %s -> %s/%s', entry, args.bucket, object_key)
        try:
            mime_type, _ = mimetypes.guess_type(full)
            if not mime_type:
                # Fallback for unknown types; browsers may still try to download unknown types
                mime_type = 'application/octet-stream'
            extra_args = {'ContentType': mime_type}
            # Recommend cache long-term; optional
            extra_args['CacheControl'] = 'public, max-age=31536000'
            # Ensure browser tries to render inline instead of forcing download
            extra_args['ContentDisposition'] = 'inline'
            with open(full, 'rb') as f:
                data = f.read()
                # use put_object to ensure headers (ContentType/ContentDisposition) are set explicitly
                s3.put_object(
                    Bucket=args.bucket,
                    Key=object_key,
                    Body=data,
                    ContentType=extra_args.get('ContentType'),
                    CacheControl=extra_args.get('CacheControl'),
                    ContentDisposition=extra_args.get('ContentDisposition')
                )
            # Verify stored metadata
            try:
                meta = s3.head_object(Bucket=args.bucket, Key=object_key)
                logging.info('Stored object metadata: ContentType=%s, ContentDisposition=%s', meta.get('ContentType'), meta.get('ContentDisposition'))
            except Exception as e:
                logging.warning('Could not read object metadata: %s', e)
        except Exception as e:
            logging.error('Failed to upload %s: %s', entry, e)
            continue

        public_url = build_public_url(args.minio_endpoint, args.bucket, object_key)

        # Update features JSONB: set photo field
        try:
            # coalesce features to {} if null
            sql = (
                "UPDATE plants SET features = jsonb_set(coalesce(features, '{}'::jsonb), '{photo}', to_jsonb(%s::text), true) "
                "WHERE id = %s"
            )
            cur.execute(sql, (public_url, plant_id))
            conn.commit()
            results[str(plant_id)] = public_url
            logging.info('Updated DB for id=%s with photo=%s', plant_id, public_url)
        except Exception as e:
            conn.rollback()
            logging.error('Failed to update DB for id=%s: %s', plant_id, e)

    cur.close()
    conn.close()

    print(json.dumps(results, ensure_ascii=False, indent=2))


def main():
    args = parse_args()

    # Basic validation
    if not os.path.isdir(args.dir):
        logging.error('Directory not found: %s', args.dir)
        sys.exit(2)

    if not args.minio_access or not args.minio_secret:
        logging.error('Minio credentials missing. Provide --minio-access and --minio-secret or env vars.')
        sys.exit(2)

    try:
        upload_and_update(args)
    except Exception as e:
        logging.exception('Fatal error: %s', e)
        sys.exit(1)


if __name__ == '__main__':
    main()
