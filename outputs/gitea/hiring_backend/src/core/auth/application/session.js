const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const AuthSession = require('@core/auth/domain/AuthSession');
const PasswordChangeCommand = require('@core/auth/domain/PasswordChangeCommand');
const AuthEvents = require('@core/auth/domain/events');
const { ensureRoles } = require('@core/auth/domain/roles');

module.exports = ({
    authUserStorePort,
    authTokenPort,
    authPasswordHasherPort,
    authAuditPort
}) => {
    const getUserFromAuthToken = async (token) => {
        const decoded = await authTokenPort.verifyToken(token);
        const subject = typeof decoded?.sub === 'string' ? decoded.sub : null;
        if (!subject) {
            throw new ApplicationError('Invalid auth token', {
                code: ErrorCode.UNAUTHORIZED,
                details: { reason: 'missing_subject' }
            });
        }
        const user = await authUserStorePort.getUserWithRoles(subject);
        if (!user) {
            throw new ApplicationError('User not found', {
                code: ErrorCode.UNAUTHORIZED,
                details: { reason: 'user_not_found' }
            });
        }
        return user;
    };

    const getCurrentUser = async (token) => AuthSession.toCurrentUser(
        await getUserFromAuthToken(token)
    );

    const changeUserPassword = async (userId, currentPassword, newPassword) => {
        const command = PasswordChangeCommand.create({
            userId,
            currentPassword,
            newPassword
        });

        try {
            const user = await authUserStorePort.findById(command.userId);
            if (!user) {
                throw new ApplicationError('Uživatel nenalezen', {
                    code: ErrorCode.NOT_FOUND,
                    details: { reason: 'user_not_found' }
                });
            }

            if (user.password_hash && command.currentPassword) {
                const isCurrentValid = await authPasswordHasherPort.compare(
                    command.currentPassword,
                    user.password_hash
                );
                if (!isCurrentValid) {
                    throw new ApplicationError('Současné heslo je nesprávné', {
                        code: ErrorCode.VALIDATION_ERROR,
                        details: { reason: 'invalid_current_password' }
                    });
                }
            }

            const newPasswordHash = await authPasswordHasherPort.hash(command.newPassword);
            const updatedUser = await authUserStorePort.updateUserPassword(command.userId, newPasswordHash);

            authAuditPort.emitAuthEvent(AuthEvents.passwordChangeSucceeded({
                userId: command.userId,
                user
            }));

            return updatedUser;
        } catch (error) {
            authAuditPort.emitAuthEvent(AuthEvents.passwordChangeFailed({
                userId: command.userId,
                error
            }));
            throw error;
        }
    };

    const recordLogout = ({ userId = null, email = null, organizationId = null, roles = [] } = {}) => {
        authAuditPort.emitAuthEvent(AuthEvents.logoutRecorded({
            userId,
            email,
            organizationId,
            roles: ensureRoles(roles)
        }));
    };

    return {
        changeUserPassword,
        getCurrentUser,
        getUserFromAuthToken,
        recordLogout
    };
};
