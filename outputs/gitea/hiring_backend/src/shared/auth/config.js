module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
    jwtExpiresIn: '7d'
};
