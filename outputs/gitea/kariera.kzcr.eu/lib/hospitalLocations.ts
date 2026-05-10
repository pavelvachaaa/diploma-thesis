export const HOSPITAL_SEAT_LOCATION_MAP: Record<string, string> = {
  usti: 'UL',
  decin: 'DC',
  teplice: 'TP',
  most: 'MO',
  chomutov: 'CV',
  litomerice: 'LT',
  rumburk: 'RB',
};

const SEAT_LOCATION_REGEX = /^[A-Z0-9]{2,3}$/;

export function normalizeSeatLocation(value?: string | null): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function isSeatLocation(value?: string | null): boolean {
  const normalized = normalizeSeatLocation(value);
  return normalized !== null && SEAT_LOCATION_REGEX.test(normalized);
}

export function getSeatLocationByHospitalSlug(slug?: string | null): string | null {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const normalizedSlug = slug.trim().toLowerCase();
  return HOSPITAL_SEAT_LOCATION_MAP[normalizedSlug] || null;
}
