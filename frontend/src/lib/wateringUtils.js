export const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());

  if (typeof value === 'object' && value.seconds != null) {
    const secondsDate = new Date(Number(value.seconds) * 1000);
    return Number.isNaN(secondsDate.getTime()) ? null : secondsDate;
  }

  if (typeof value === 'number') {
    const numberDate = new Date(value);
    return Number.isNaN(numberDate.getTime()) ? null : numberDate;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00` : trimmed;
    const stringDate = new Date(normalized);
    return Number.isNaN(stringDate.getTime()) ? null : stringDate;
  }

  return null;
};

export const toISODateString = (value) => {
  const date = parseDateValue(value);
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeWateringHistory = (wateringHistory) => {
  if (!Array.isArray(wateringHistory)) return [];

  const uniqueDates = new Set();
  wateringHistory.forEach((entry) => {
    const dateKey = toISODateString(entry);
    if (dateKey) uniqueDates.add(dateKey);
  });

  return Array.from(uniqueDates).sort((a, b) => a.localeCompare(b));
};

export const getLatestWateringDate = (wateringHistory, fallbackLastWateringDate = null) => {
  const normalizedHistory = normalizeWateringHistory(wateringHistory);
  if (normalizedHistory.length > 0) return normalizedHistory[normalizedHistory.length - 1];
  return toISODateString(fallbackLastWateringDate);
};

export const buildUpcomingWateringDates = (lastWateringDate, wateringScheduleDays, horizonDays = 365) => {
  const schedule = Number(wateringScheduleDays);
  if (!Number.isFinite(schedule) || schedule <= 0) return [];

  const anchor = parseDateValue(lastWateringDate);
  if (!anchor) return [];

  const plannedDates = [];
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(endDate.getDate() + horizonDays);

  const cursor = new Date(anchor);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    cursor.setDate(cursor.getDate() + schedule);
    if (cursor <= endDate) {
      const dateKey = toISODateString(cursor);
      if (dateKey) plannedDates.push(dateKey);
    }
  }

  return plannedDates;
};

export const formatDate = (timestamp) => {
  const date = parseDateValue(timestamp);
  if (!date) return '—';
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getWateringStatus = (wateringHistory, wateringScheduleDays, lastWateringDate = null) => {
  const schedule = Number(wateringScheduleDays);
  const latestWateringKey = getLatestWateringDate(wateringHistory, lastWateringDate);
  const latestWateringDate = parseDateValue(latestWateringKey);

  if (!Number.isFinite(schedule) || schedule <= 0) {
    return { status: 'Период не выбран', isDue: false, daysLeft: null, lastWatered: latestWateringDate };
  }

  if (!latestWateringDate) {
    return { status: 'Отметьте первый полив', isDue: false, daysLeft: null, lastWatered: null };
  }

  const nextWatering = new Date(latestWateringDate);
  nextWatering.setHours(0, 0, 0, 0);
  nextWatering.setDate(nextWatering.getDate() + schedule);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = nextWatering.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { status: 'Пора полить!', isDue: true, daysLeft: 0, lastWatered: latestWateringDate };
  }

  return { status: `Полить через ${diffDays} дн.`, isDue: false, daysLeft: diffDays, lastWatered: latestWateringDate };
};

