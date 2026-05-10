const jwt = require('jsonwebtoken');
const config = require('./config');

const signToken = (user) => {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            name: user.full_name,
            org: {
                id: user.organization_id,
                name: user.organization_name
            }
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
};

module.exports = {
    signToken,
    verifyToken
};
