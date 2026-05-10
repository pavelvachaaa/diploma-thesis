const make = (type, payload = {}) => Object.freeze({
    type,
    ...payload
});

const localLoginSucceeded = ({ user, roles }) => make('Auth.LocalLoginSucceeded', {
    userId: user.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRoles: roles,
    organizationId: user.organization_id || null,
    loginMethod: 'password'
});

const localLoginFailed = ({ email = null, error }) => make('Auth.LocalLoginFailed', {
    actorEmail: email || null,
    errorMessage: error?.message || null,
    errorCode: error?.code || null,
    loginMethod: 'password'
});

const oauthTokenExchangeSucceeded = ({ redirectUri }) => make('Auth.OAuthTokenExchangeSucceeded', {
    redirectUri
});

const oauthTokenExchangeFailed = ({ redirectUri, error }) => make('Auth.OAuthTokenExchangeFailed', {
    redirectUri,
    errorMessage: error?.message || null,
    errorCode: error?.code || null
});

const ucpLoginSucceeded = ({ user, roles, fallbackUsed, accessToken }) => make('Auth.UcpLoginSucceeded', {
    userId: user.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRoles: roles,
    organizationId: user.organization_id || null,
    fallbackUsed,
    hasAccessToken: Boolean(accessToken)
});

const ucpLoginFailed = ({ tokenData, employeeData, ucpError, error }) => make('Auth.UcpLoginFailed', {
    actorEmail: tokenData?.email || null,
    fallbackUsed: !employeeData,
    ucpError,
    errorMessage: error?.message || null,
    errorCode: error?.code || null
});

const ciscoLoginSucceeded = ({ user, roles, claims }) => make('Auth.CiscoLoginSucceeded', {
    userId: user.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRoles: roles,
    organizationId: user.organization_id || null,
    issuer: claims?.iss || null,
    subject: claims?.sub || null
});

const ciscoLoginFailed = ({ error }) => make('Auth.CiscoLoginFailed', {
    errorMessage: error?.message || null,
    errorCode: error?.code || null
});

const passwordChangeSucceeded = ({ userId, user }) => make('Auth.PasswordChangeSucceeded', {
    userId,
    actorUserId: userId,
    actorEmail: user?.email || null,
    organizationId: user?.organization_id || null
});

const passwordChangeFailed = ({ userId, error }) => make('Auth.PasswordChangeFailed', {
    userId: userId || null,
    actorUserId: userId || null,
    errorMessage: error?.message || null,
    errorCode: error?.code || null
});

const logoutRecorded = ({ userId = null, email = null, organizationId = null, roles = [] } = {}) =>
    make('Auth.LogoutRecorded', {
        userId,
        actorUserId: userId,
        actorEmail: email,
        actorRoles: roles || [],
        organizationId: organizationId || null
    });

module.exports = {
    ciscoLoginFailed,
    ciscoLoginSucceeded,
    localLoginFailed,
    localLoginSucceeded,
    logoutRecorded,
    oauthTokenExchangeFailed,
    oauthTokenExchangeSucceeded,
    passwordChangeFailed,
    passwordChangeSucceeded,
    ucpLoginFailed,
    ucpLoginSucceeded
};
