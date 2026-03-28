from __future__ import annotations

import os
import smtplib
import ssl
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple


def _to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def _smtp_settings() -> dict:
    port_raw = os.getenv("SMTP_PORT", "1127")
    try:
        smtp_port = int(str(port_raw).strip())
    except (TypeError, ValueError):
        smtp_port = 1127

    return {
        "host": os.getenv("SMTP_HOST", "").strip(),
        "port": smtp_port,
        "login": os.getenv("SMTP_LOGIN", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "").strip(),
        "use_ssl": _to_bool(os.getenv("SMTP_USE_SSL"), default=(smtp_port == 1127)),
        "use_starttls": _to_bool(os.getenv("SMTP_USE_STARTTLS"), default=(smtp_port == 1126)),
        "mail_from": os.getenv("MAIL_FROM", "").strip(),
        "site_url": os.getenv("SITE_URL", "https://flowers-choice.ru").strip(),
    }


def is_email_configured() -> bool:
    settings = _smtp_settings()
    return all([settings["host"], settings["port"], settings["login"], settings["password"], settings["mail_from"]])


def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    if not to_email:
        return False

    settings = _smtp_settings()
    if not all([settings["host"], settings["port"], settings["login"], settings["password"], settings["mail_from"]]):
        print("Email config is incomplete, skipping send_email")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings["mail_from"]
    msg["To"] = to_email

    plain = text_body.strip() or "Flowers'Choice notification"
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if settings["use_ssl"]:
            with smtplib.SMTP_SSL(settings["host"], settings["port"], timeout=30) as server:
                server.login(settings["login"], settings["password"])
                server.sendmail(settings["mail_from"], [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings["host"], settings["port"], timeout=30) as server:
                if settings["use_starttls"]:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                server.login(settings["login"], settings["password"])
                server.sendmail(settings["mail_from"], [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"Email send error to {to_email}: {e}")
        return False


def build_watering_reminder_email(user_name: str, plant_name: str, due_date: date) -> Tuple[str, str, str]:
    settings = _smtp_settings()
    site_url = settings["site_url"]
    safe_user = user_name.strip() if isinstance(user_name, str) and user_name.strip() else "друг"
    safe_plant = plant_name.strip() if isinstance(plant_name, str) and plant_name.strip() else "ваше растение"
    due_date_human = due_date.strftime("%d.%m.%Y")
    subject = f"Пора полить {safe_plant} - Flowers'Choice"

    html = f"""
    <div style="margin:0;padding:24px;background:linear-gradient(135deg,#e6fffa,#f5ffe8);font-family:Arial,sans-serif;color:#134e4a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(16,185,129,.18);">
        <div style="background:linear-gradient(135deg,#10b981,#84cc16);padding:20px 24px;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;line-height:1.2;">Flowers'Choice</h1>
          <p style="margin:8px 0 0 0;font-size:14px;opacity:.95;">Напоминание о поливе</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 14px 0;font-size:16px;">Привет, {safe_user}!</p>
          <p style="margin:0 0 12px 0;font-size:16px;">Сегодня <b>{due_date_human}</b> день полива для растения <b>{safe_plant}</b>.</p>
          <p style="margin:0 0 22px 0;font-size:15px;color:#166534;">Не забудьте полить его, чтобы оно радовало вас здоровым ростом.</p>
          <a href="{site_url}" style="display:inline-block;padding:11px 18px;border-radius:10px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;">Открыть Flowers'Choice</a>
        </div>
      </div>
    </div>
    """
    text = (
        f"Привет, {safe_user}!\n"
        f"Сегодня {due_date_human} пора полить растение: {safe_plant}.\n"
        f"Открыть Flowers'Choice: {site_url}"
    )
    return subject, html, text


def build_watering_congrats_email(user_name: str, plant_name: str) -> Tuple[str, str, str]:
    settings = _smtp_settings()
    site_url = settings["site_url"]
    safe_user = user_name.strip() if isinstance(user_name, str) and user_name.strip() else "друг"
    safe_plant = plant_name.strip() if isinstance(plant_name, str) and plant_name.strip() else "растение"
    subject = f"Отлично! {safe_plant} полито - Flowers'Choice"

    html = f"""
    <div style="margin:0;padding:24px;background:linear-gradient(135deg,#ecfdf5,#f0fdf4);font-family:Arial,sans-serif;color:#134e4a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(16,185,129,.14);">
        <div style="background:linear-gradient(135deg,#059669,#84cc16);padding:20px 24px;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;line-height:1.2;">Flowers'Choice</h1>
          <p style="margin:8px 0 0 0;font-size:14px;opacity:.95;">Спасибо за заботу о растении</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 14px 0;font-size:16px;">{safe_user}, поздравляем!</p>
          <p style="margin:0 0 12px 0;font-size:16px;">Вы отметили полив растения <b>{safe_plant}</b>. Отличная забота.</p>
          <p style="margin:0 0 22px 0;font-size:15px;color:#166534;">Хотите подобрать ещё красивые растения? На Flowers'Choice есть новые варианты под ваши условия.</p>
          <a href="{site_url}" style="display:inline-block;padding:11px 18px;border-radius:10px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;">Подобрать ещё растения</a>
        </div>
      </div>
    </div>
    """
    text = (
        f"{safe_user}, поздравляем! Вы отметили полив растения {safe_plant}.\n"
        f"Хотите подобрать ещё растения? {site_url}"
    )
    return subject, html, text
