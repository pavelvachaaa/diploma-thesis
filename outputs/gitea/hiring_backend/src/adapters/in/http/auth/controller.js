const AuthSession = require('@core/auth/domain/AuthSession');
const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ authService }) => {
    const isProduction = process.env.NODE_ENV === 'production';

    const setAuthCookie = (res, token) => {
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
    };

    const login = handle(async (req, res) => {
        const { token, user, roles, redirect } = await authService.handleLocalLogin(req.body);
        setAuthCookie(res, token);

        return sendResult(res, {
            success: true,
            user: AuthSession.toLoginUser(user, roles),
            redirect
        });
    });

    const oauth2Cisco = handle(async (req, res) => {
        const result = await authService.handleCiscoOAuth(req.body?.ciscoToken);
        return sendResult(res, { token: result.token });
    });

    const me = handle(async (req, res) => {
        const token = req.cookies?.auth_token;
        if (!token) {
            return sendResult(res, { error: 'No token provided' }, 401);
        }

        const user = await authService.getCurrentUser(token);
        return sendResult(res, user);
    });

    const logout = handle(async (req, res) => {
        const token = req.cookies?.auth_token;
        let principal = req.user || null;

        if (!principal && token) {
            try {
                principal = await authService.getUserFromAuthToken(token);
            } catch (_error) {
                // Stale or invalid cookie — proceed with anonymous logout.
            }
        }

        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/'
        });

        authService.recordLogout({
            userId: principal?.id || null,
            email: principal?.email || null,
            organizationId: principal?.organization_id || null,
            roles: principal?.roles || []
        });

        return sendResult(res, {
            success: true,
            message: 'Byl jste úspěšně odhlášen'
        });
    });

    const exchangeOAuthToken = handle(async (req, res) => {
        const { code, codeVerifier, redirectUri } = req.body || {};
        const tokenData = await authService.exchangeOAuthToken({
            code,
            codeVerifier,
            redirectUri
        });

        return sendResult(res, tokenData);
    });

    const ucpLogin = handle(async (req, res) => {
        const { idToken, accessToken } = req.body || {};
        const authResult = await authService.handleOAuthLogin(idToken, accessToken);
        const { user: localUser, roles, redirect, fallbackUsed, ucpError, token } = authResult;

        setAuthCookie(res, token);

        res.cookie('id_token', idToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        return sendResult(res, {
            success: true,
            user: AuthSession.toLoginUser(localUser, roles),
            redirect,
            fallbackUsed,
            ucpError
        });
    });

    const changePassword = handle(async (req, res) => {
        const { currentPassword, newPassword } = req.body || {};
        await authService.changeUserPassword(req.user.id, currentPassword, newPassword);

        return sendResult(res, {
            success: true,
            message: 'Heslo bylo úspěšně změněno'
        });
    });

    return {
        changePassword,
        exchangeOAuthToken,
        login,
        logout,
        me,
        oauth2Cisco,
        ucpLogin
    };
};
