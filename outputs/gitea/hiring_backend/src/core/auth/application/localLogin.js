const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const LocalLoginCommand = require('@core/auth/domain/LocalLoginCommand');
const AuthSession = require('@core/auth/domain/AuthSession');
const AuthEvents = require('@core/auth/domain/events');
const { ensureRoles, getRedirectForRoles } = require('@core/auth/domain/roles');

module.exports = ({
    authUserStorePort,
    authPasswordHasherPort,
    authTokenPort,
    authAuditPort
}) => async (data = {}) => {
    const command = LocalLoginCommand.create(data);

    try {
        const user = await authUserStorePort.findByEmailAndProvider(command.email);

        if (!user || !user.password_hash) {
            throw new ApplicationError('Neplatné přihlašovací údaje', {
                code: ErrorCode.UNAUTHORIZED,
                details: { reason: 'invalid_credentials' }
            });
        }

        const isMatch = await authPasswordHasherPort.compare(command.password, user.password_hash);
        if (!isMatch) {
            throw new ApplicationError('Neplatné přihlašovací údaje', {
                code: ErrorCode.UNAUTHORIZED,
                details: { reason: 'invalid_credentials' }
            });
        }

        const roles = ensureRoles(await authUserStorePort.getUserRoles(user.id));
        const token = await authTokenPort.signToken(AuthSession.toTokenPayload(user));

        authAuditPort.emitAuthEvent(AuthEvents.localLoginSucceeded({ user, roles }));

        return {
            token,
            user,
            roles,
            redirect: getRedirectForRoles(roles)
        };
    } catch (error) {
        authAuditPort.emitAuthEvent(AuthEvents.localLoginFailed({
            email: command.email,
            error
        }));
        throw error;
    }
};
