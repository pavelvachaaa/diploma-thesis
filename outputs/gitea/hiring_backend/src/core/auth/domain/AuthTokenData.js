const Email = require('./email');

const empty = () => Object.freeze({
    email: null,
    name: null,
    given_name: null,
    family_name: null,
    phone: null
});

const fromClaims = (claims) => {
    if (!claims || typeof claims !== 'object') {
        return empty();
    }

    return Object.freeze({
        email: Email.normalize(claims.email) || null,
        name: claims.name || claims.given_name || null,
        given_name: claims.given_name || null,
        family_name: claims.family_name || null,
        phone: claims.phone_number || claims.phone || null
    });
};

module.exports = {
    empty,
    fromClaims
};
