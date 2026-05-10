const CITY_SEAT_LOCATION_MATCHES = Object.freeze([
    { pattern: 'usti nad labem', seatLocation: 'UL' },
    { pattern: 'teplice', seatLocation: 'TP' },
    { pattern: 'decin', seatLocation: 'DC' },
    { pattern: 'chomutov', seatLocation: 'CV' },
    { pattern: 'most', seatLocation: 'MO' },
    { pattern: 'litomerice', seatLocation: 'LT' },
    { pattern: 'rumburk', seatLocation: 'RB' }
]);

const normalizeCity = (city) => String(city || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

const create = ({ city } = {}) => {
    const normalizedCity = normalizeCity(city);
    const match = CITY_SEAT_LOCATION_MATCHES.find(({ pattern }) => normalizedCity.includes(pattern));

    return Object.freeze({
        city: normalizedCity || null,
        seatLocation: match?.seatLocation || null
    });
};

module.exports = {
    create
};
