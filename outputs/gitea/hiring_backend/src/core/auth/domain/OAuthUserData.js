const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const Email = require('./email');

const OAUTH_DEFAULT_ROLE = 'hr';

const fromUcp = ({ employeeData, tokenData, organization } = {}) => {
    const ucpData = employeeData?.data || employeeData || {};
    return Object.freeze({
        email: Email.normalize(ucpData.email || tokenData?.email) || null,
        name: ucpData.name || ucpData.firstName || tokenData?.name,
        surname: ucpData.surname || ucpData.lastName || '',
        phone: ucpData.phone || null,
        organization_id: organization?.organization_id || null,
        organization: organization?.organization || null,
        defaultRole: OAUTH_DEFAULT_ROLE
    });
};

const fromTokenFallback = (tokenData = {}) => {
    if (!tokenData.email) {
        throw new ApplicationError(
            'Nemůžeme získat informace o uživateli z UCP ani z OAuth tokenu',
            {
                code: ErrorCode.VALIDATION_ERROR,
                details: { reason: 'ucp_fallback_failed' }
            }
        );
    }

    return Object.freeze({
        email: Email.normalize(tokenData.email) || null,
        name: tokenData.given_name || tokenData.name || 'OAuth User',
        surname: tokenData.family_name || '',
        phone: tokenData.phone || null,
        organization_id: null,
        organization: null,
        defaultRole: OAUTH_DEFAULT_ROLE
    });
};

const fromCiscoClaims = (claims = {}) => {
    const email = Email.normalize(claims.email || claims.upn || claims.preferred_username || null);
    if (!email) {
        throw new ApplicationError('Cisco token does not contain an email claim', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'cisco_email_missing' }
        });
    }

    return Object.freeze({
        email,
        name: claims.given_name || claims.name || 'OAuth User',
        surname: claims.family_name || '',
        phone: claims.phone_number || null,
        organization_id: claims.organization_id || claims.organizationId || claims.org_id || null,
        organization: null,
        defaultRole: OAUTH_DEFAULT_ROLE
    });
};

module.exports = {
    OAUTH_DEFAULT_ROLE,
    fromCiscoClaims,
    fromTokenFallback,
    fromUcp
};
