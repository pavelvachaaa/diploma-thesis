const AuthTokenData = require('@core/auth/domain/AuthTokenData');
const CiscoOAuthCommand = require('@core/auth/domain/CiscoOAuthCommand');
const OAuthTokenExchangeCommand = require('@core/auth/domain/OAuthTokenExchangeCommand');
const OAuthUserData = require('@core/auth/domain/OAuthUserData');
const UcpLoginCommand = require('@core/auth/domain/UcpLoginCommand');
const AuthSession = require('@core/auth/domain/AuthSession');
const AuthEvents = require('@core/auth/domain/events');
const { ensureRoles, getRedirectForRoles } = require('@core/auth/domain/roles');

module.exports = ({
    authUserStorePort,
    authTokenPort,
    authIdentityProviderPort,
    authAuditPort,
    authMembershipSyncPort,
    authUnitOfWorkPort,
    seatLocationOrganizationLookupPort,
    logger
}) => {
    const resolveOrganizationByLocation = async (seatLocation) => {
        if (!seatLocation) {
            return null;
        }

        const org = await seatLocationOrganizationLookupPort.getOrganizationBySeatLocation(seatLocation);
        if (!org) {
            return null;
        }

        return {
            organization_id: org.id,
            organization: org.name
        };
    };

    const upsertOAuthUser = async ({ userData, allowUpdate = true }) => {
        const existingUser = await authUserStorePort.findByEmailAndProvider(userData.email);

        if (!existingUser) {
            const newUser = await authUnitOfWorkPort.runInTransaction(async (client) => {
                const { user, membership } = await authUserStorePort.createOAuthUser(userData, { client });
                if (membership) {
                    await authMembershipSyncPort.queueMembershipSync({ membership }, { client });
                }
                return user;
            }, { label: 'auth.oauth.upsert' });

            return {
                user: newUser,
                created: true
            };
        }

        const localUser = allowUpdate
            ? await authUserStorePort.updateUserFromOAuth(existingUser.id, userData)
            : existingUser;

        return {
            user: localUser,
            created: false
        };
    };

    const extractTokenData = async (idToken) => {
        const claims = await authIdentityProviderPort.decodeIdTokenClaims(idToken);
        if (!claims) {
            logger?.warn?.('Could not decode ID token for fallback');
        }
        return AuthTokenData.fromClaims(claims);
    };

    const prepareOAuthUserData = async ({ employeeData, tokenData }) => {
        if (employeeData) {
            const ucpData = employeeData.data || employeeData;
            const orgData = await resolveOrganizationByLocation(ucpData.seatLocation);
            return OAuthUserData.fromUcp({
                employeeData,
                tokenData,
                organization: orgData
            });
        }

        return OAuthUserData.fromTokenFallback(tokenData);
    };

    const exchangeOAuthToken = async (input = {}) => {
        const command = OAuthTokenExchangeCommand.create(input);

        try {
            const tokens = await authIdentityProviderPort.exchangeAuthorizationCode(command);
            authAuditPort.emitAuthEvent(AuthEvents.oauthTokenExchangeSucceeded({
                redirectUri: command.redirectUri
            }));
            return tokens;
        } catch (error) {
            authAuditPort.emitAuthEvent(AuthEvents.oauthTokenExchangeFailed({
                redirectUri: command.redirectUri,
                error
            }));
            throw error;
        }
    };

    const handleOAuthLogin = async (idToken, accessToken) => {
        const command = UcpLoginCommand.create(idToken, accessToken);
        const tokenData = await extractTokenData(command.idToken);
        let employeeData = null;
        let ucpError = null;

        try {
            employeeData = await authIdentityProviderPort.fetchUcpUserInfo({ idToken: command.idToken });
        } catch (error) {
            ucpError = error.message;
            logger?.warn?.('UCP API fetch failed, using fallback', {
                error: error.message,
                code: error.code || null
            });
        }

        try {
            const userData = await prepareOAuthUserData({
                employeeData,
                tokenData
            });

            const { user: localUser } = await upsertOAuthUser({
                userData,
                allowUpdate: Boolean(employeeData)
            });

            const roles = ensureRoles(await authUserStorePort.getUserRoles(localUser.id));
            const token = await authTokenPort.signToken(AuthSession.toTokenPayload(localUser));
            const fallbackUsed = !employeeData;

            authAuditPort.emitAuthEvent(AuthEvents.ucpLoginSucceeded({
                user: localUser,
                roles,
                fallbackUsed,
                accessToken: command.accessToken
            }));

            return {
                token,
                user: localUser,
                roles,
                redirect: getRedirectForRoles(roles),
                fallbackUsed,
                ucpError
            };
        } catch (error) {
            authAuditPort.emitAuthEvent(AuthEvents.ucpLoginFailed({
                tokenData,
                employeeData,
                ucpError,
                error
            }));
            throw error;
        }
    };

    const handleCiscoOAuth = async (ciscoToken) => {
        const command = CiscoOAuthCommand.create(ciscoToken);

        try {
            const claims = await authIdentityProviderPort.verifyCiscoToken({
                token: command.ciscoToken
            });
            const userData = OAuthUserData.fromCiscoClaims(claims);

            const { user: localUser } = await upsertOAuthUser({
                userData,
                allowUpdate: true
            });

            const roles = ensureRoles(await authUserStorePort.getUserRoles(localUser.id));
            const token = await authTokenPort.signToken(AuthSession.toTokenPayload(localUser));

            authAuditPort.emitAuthEvent(AuthEvents.ciscoLoginSucceeded({
                user: localUser,
                roles,
                claims
            }));

            return {
                token,
                user: localUser,
                roles,
                redirect: getRedirectForRoles(roles)
            };
        } catch (error) {
            authAuditPort.emitAuthEvent(AuthEvents.ciscoLoginFailed({ error }));
            throw error;
        }
    };

    return {
        exchangeOAuthToken,
        extractTokenData,
        handleCiscoOAuth,
        handleOAuthLogin
    };
};
