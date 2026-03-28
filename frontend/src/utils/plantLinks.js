const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeBase = (value) => String(value || '').trim().replace(/\/+$/, '');

const normalizePath = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
};

export const slugifyPlantName = (name) => {
  if (!name) return 'plant';

  const normalized = String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'plant';
};

export const getPlantPath = (plantOrId, plantName = '') => {
  const hasObjectPayload = plantOrId && typeof plantOrId === 'object';
  const plantIdRaw = hasObjectPayload ? plantOrId.id : plantOrId;
  const plantId = Number(plantIdRaw);
  if (!Number.isFinite(plantId) || plantId <= 0) {
    return '/plant/unknown';
  }

  const resolvedName = hasObjectPayload
    ? plantOrId.plant_name || plantOrId.name || plantOrId.latin || ''
    : plantName;
  const slug = slugifyPlantName(resolvedName);
  return `/plant/${plantId}-${slug}`;
};

export const parsePlantIdFromPath = (pathname) => {
  const match = normalizePath(pathname).match(/^\/plant\/(\d+)(?:-[^/]+)?$/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export const getSiteBaseUrl = () => {
  const envBase = normalizeBase(import.meta.env.VITE_SITE_URL);
  if (envBase) return envBase;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeBase(window.location.origin);
  }

  return '';
};

export const isProdShareBase = (baseUrl = getSiteBaseUrl()) => {
  try {
    const parsed = new URL(baseUrl);
    return parsed.protocol === 'https:' && !LOCAL_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
  }
};

export const getPlantShareUrl = (plantOrId, plantName = '') => {
  const baseUrl = getSiteBaseUrl();
  const path = getPlantPath(plantOrId, plantName);
  return `${baseUrl}${path}`;
};
