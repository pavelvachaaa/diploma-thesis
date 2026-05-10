"use client"
import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RedirectAuthenticatedUser from '@/components/RedirectAuthenticatedUser';

const OAUTH_STORAGE_KEYS = {
    state: 'oauth_state',
    verifier: 'pkce_verifier',
    email: 'oauth_email'
} as const;

const base64URLEncode = (str) => {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const generateSecureRandomString = (byteLength = 32) => {
    const randomBytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(randomBytes);
    return base64URLEncode(String.fromCharCode(...randomBytes));
};

const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return hash;
};

const generateCodeChallenge = async (verifier) => {
    const hashed = await sha256(verifier);
    const base64String = base64URLEncode(String.fromCharCode(...new Uint8Array(hashed)));
    return base64String;
};

// Updated constants with your Duo SSO configuration
const CONSTANTS = {
    clientId: 'DIWRW4L6A401A2WNYBRL',
    redirectUri: process.env.NODE_ENV === "production" 
        ? (process.env.NEXT_PUBLIC_REDIRECT_URI_PROD || "https://kz-iristst.kzcr.eu/onboarding/oauth/callback")
        : (process.env.NEXT_PUBLIC_REDIRECT_URI_DEV || "https://kz-iristst.kzcr.eu/onboarding/oauth/callback"),
    authUrl: 'https://sso-1ee95bf1.sso.duosecurity.com/oidc/DIWRW4L6A401A2WNYBRL/authorize'
};

const LoginPage = () => {
    const router = useRouter();
    const { setAuthenticatedUser } = useAuth();
    const [step, setStep] = useState<any>('email-check');
    const [loading, setLoading] = useState<any>(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState<any>('');
    const [password, setPassword] = useState<any>('');
    const [isKzcrEmail, setIsKzcrEmail] = useState<any>(false);

    const clearOAuthSessionData = () => {
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.state);
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.verifier);
        sessionStorage.removeItem(OAUTH_STORAGE_KEYS.email);
    };

    // Check for OAuth callback on component mount.
    useEffect(() => {
        // Check if we're returning from OAuth redirect
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
            // Handle OAuth error
            console.error('OAuth error:', error, errorDescription);
            setError(`OAuth Error: ${errorDescription || error}`);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (code && state) {
            // We have an authorization code, handle the callback
            const storedVerifier = sessionStorage.getItem(OAUTH_STORAGE_KEYS.verifier);
            const storedState = sessionStorage.getItem(OAUTH_STORAGE_KEYS.state);
            const storedEmail = sessionStorage.getItem(OAUTH_STORAGE_KEYS.email);

            if (!storedVerifier || !storedState) {
                setError('OAuth session expired. Please try again.');
                clearOAuthSessionData();
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            if (storedEmail) {
                setEmail(storedEmail);
                setIsKzcrEmail(true);
            }

            // Verify state parameter
            if (state !== storedState) {
                setError('Invalid OAuth state. Possible security issue.');
                clearOAuthSessionData();
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            // If we're in a popup, send message to parent
            if (window.opener && window.opener !== window) {
                window.opener.postMessage({
                    type: 'duo-oauth-callback',
                    code: code,
                    state: state
                }, window.location.origin);
                window.close();
                return;
            }

            // If we're not in a popup, handle the redirect directly
            exchangeCodeForTokens(code, storedVerifier);

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

    }, []);

    // Check if email is @kzcr.eu domain
    const checkEmailDomain = (email) => {
        return email.toLowerCase().endsWith('@kzcr.eu');
    };

    // Handle email submission
    const handleEmailSubmit = () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        const isKzcr = checkEmailDomain(email);
        setIsKzcrEmail(isKzcr);

        if (isKzcr) {
            // Proceed with OAuth for @kzcr.eu emails
            initializeOAuth();
        } else {
            // Show regular login form for other emails
            setStep('regular-login');
        }
    };

    const handleRegularLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await api<any>("/auth/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                })
            })

            if (data.success) {
                setAuthenticatedUser(data.user);
                router.replace(data.redirect);
            } else {
                throw new Error('Přihlášení selhalo');
            }

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    // Initialize OAuth flow with Duo SSO
    const initializeOAuth = async () => {
        try {
            setLoading(true);
            setError(null);

            // Generate PKCE parameters
            const verifier = generateSecureRandomString(32);
            const challenge = await generateCodeChallenge(verifier);
            const state = generateSecureRandomString(32);

            // Store verifier in sessionStorage for the redirect callback
            sessionStorage.setItem(OAUTH_STORAGE_KEYS.verifier, verifier);
            sessionStorage.setItem(OAUTH_STORAGE_KEYS.state, state);
            sessionStorage.setItem(OAUTH_STORAGE_KEYS.email, email);

            // Build authorization URL with Duo SSO parameters
            const authParams = new URLSearchParams({
                client_id: CONSTANTS.clientId,
                response_type: 'code',
                redirect_uri: CONSTANTS.redirectUri,
                scope: 'openid email profile offline_access calendar:write',
                code_challenge: challenge,
                code_challenge_method: 'S256',
                state
            });

            const authUrl = `${CONSTANTS.authUrl}?${authParams.toString()}`;

            setStep('oauth');

            // Open popup window for OAuth
            const popup = window.open(
                authUrl,
                'duo-sso-popup',
                'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
            );

            if (!popup) {
                throw new Error('Popup was blocked. Please allow popups for this site and try again.');
            }

            // Monitor popup for redirect
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    setLoading(false);
                    setError('Authentication was cancelled or popup was closed');
                    clearOAuthSessionData();
                    setStep('email-check');
                }
            }, 1000);

            // Listen for message from popup (redirect page will send this)
            const handleMessage = (event) => {
                // Verify origin for security
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'duo-oauth-callback') {
                    clearInterval(checkClosed);
                    popup.close();
                    window.removeEventListener('message', handleMessage);

                    if (event.data.error) {
                        setError(`OAuth Error: ${event.data.error_description || event.data.error}`);
                        setStep('email-check');
                        clearOAuthSessionData();
                        setLoading(false);
                        return;
                    }

                    if (event.data.code && event.data.state) {
                        const storedVerifier = sessionStorage.getItem(OAUTH_STORAGE_KEYS.verifier);
                        const storedState = sessionStorage.getItem(OAUTH_STORAGE_KEYS.state);

                        if (storedVerifier && storedState && event.data.state === storedState) {
                            exchangeCodeForTokens(event.data.code, storedVerifier);
                        } else {
                            setError('Invalid state parameter. Possible security issue.');
                            setStep('email-check');
                            clearOAuthSessionData();
                            setLoading(false);
                        }
                    } else {
                        setError('Authorization failed - no code received');
                        setStep('email-check');
                        clearOAuthSessionData();
                        setLoading(false);
                    }
                }
            };

            window.addEventListener('message', handleMessage);

            // Cleanup function
            const cleanup = () => {
                window.removeEventListener('message', handleMessage);
                clearInterval(checkClosed);
                if (popup && !popup.closed) {
                    popup.close();
                }
            };

            // Set timeout for OAuth process (5 minutes)
            setTimeout(() => {
                cleanup();
                setError('OAuth process timed out. Please try again.');
                clearOAuthSessionData();
                setStep('email-check');
                setLoading(false);
            }, 5 * 60 * 1000);

        } catch (err) {
            setError((err as any).message);
            setLoading(false);
            clearOAuthSessionData();
            setStep('email-check');
        }
    };

    // Exchange authorization code for tokens
    const exchangeCodeForTokens = async (code, verifier) => {
        try {
            setStep('token-exchange');
            setLoading(true);

            // Use backend endpoint to avoid CORS issues
            const backendUrl = process.env.NODE_ENV === "production" 
                ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://kz-iristst.kzcr.eu/hrbackend/api/v1')
                : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');

            const response = await fetch(`${backendUrl}/auth/oauth/token-exchange`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    code: code,
                    codeVerifier: verifier,
                    redirectUri: CONSTANTS.redirectUri
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Token exchange error:', errorData);
                throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
            }

            const tokenData = await response.json();

            if (tokenData.error) {
                throw new Error(`Token Error: ${tokenData.error_description || tokenData.error}`);
            }

            const tokenInfo = {
                idToken: tokenData.idToken,
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                tokenType: tokenData.tokenType || 'Bearer',
                expiresIn: tokenData.expiresIn
            };


            // Clean up stored OAuth data
            clearOAuthSessionData();

            // Proceed to UCP login
            await loginToUCP(tokenInfo);

        } catch (err) {
            clearOAuthSessionData();
            console.error('Token exchange failed:', err);
            setError(`Token exchange failed: ${(err as any).message}`);
            setLoading(false);
            setStep('email-check');
        }
    };

    // Login to UCP system
    const loginToUCP = async (tokenInfo) => {
        try {

            setStep('ucp-login');

            // Use backend endpoint to avoid CORS issues
            const backendUrl = process.env.NODE_ENV === "production" 
                ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://kz-iristst.kzcr.eu/hrbackend/api/v1')
                : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');

            const response = await fetch(`${backendUrl}/auth/oauth/ucp-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    idToken: tokenInfo.idToken,
                    accessToken: tokenInfo.accessToken
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('UCP login error:', errorData);
                
                // Handle maintenance mode specifically
                if (errorData.maintenanceMode) {
                    throw new Error(errorData.error || 'UCP systém je momentálně v údržbě');
                }
                
                throw new Error(`UCP login failed: ${errorData.error || 'Unknown error'}`);
            }

            const userData = await response.json();

            // Store user data and redirect
            setUser(userData.user);
            setStep('complete');
            setLoading(false);

            // Redirect to appropriate dashboard
            if (userData.redirect) {
                setAuthenticatedUser(userData.user);
                setTimeout(() => {
                    router.replace(userData.redirect);
                }, 2000);
            }

        } catch (err: any) {
            console.error('UCP login failed:', err);
            setError(`UCP login failed: ${err.message}`);
            setLoading(false);
            setStep('email-check');
        }
    };

    // Reset flow
    const resetFlow = () => {
        setStep('email-check');
        setError(null);
        clearOAuthSessionData();
        setUser(null);
        setEmail('');
        setPassword('');
        setIsKzcrEmail(false);
        setLoading(false);
    };

    // Go back to email check
    const goBackToEmailCheck = () => {
        setStep('email-check');
        setError(null);
        clearOAuthSessionData();
        setIsKzcrEmail(false);
    };

    // Handle Enter key press for email form
    const handleEmailKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading && email) {
            e.preventDefault();
            handleEmailSubmit();
        }
    };

    // Handle Enter key press for login form
    const handleLoginKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading && email && password) {
            e.preventDefault();
            handleRegularLogin();
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'email-check':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Přihlášení</h2>
                            <p className="text-gray-600">Zadejte svůj email pro pokračování</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    E-mail
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={handleEmailKeyPress}
                                        placeholder="j.novak@example.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleEmailSubmit}
                                disabled={loading || !email}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>Pokračovat</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Zaměstnanci s @kzcr.eu budou přesměrováni na Duo SSO přihlášení
                            </p>
                        </div>
                    </div>
                );

            case 'regular-login':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <KeyRound className="w-8 h-8 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Přihlášení</h2>
                            <p className="text-gray-600">Zadejte své přihlašovací údaje</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    E-mail
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={handleLoginKeyPress}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Heslo
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleLoginKeyPress}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleRegularLogin}
                                disabled={loading || !email || !password}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {loading ? 'Přihlašování...' : 'Přihlásit se'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={goBackToEmailCheck}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                ← Zpět na zadání emailu
                            </button>
                        </div>
                    </div>
                );

            case 'oauth':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Shield className="w-8 h-8 text-yellow-600 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Duo SSO Přihlášení</h2>
                            <p className="text-gray-600">Inicializace Duo Security SSO</p>
                            <p className="text-sm text-blue-600 mt-2">@kzcr.eu účet detekován</p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                Popup okno bylo otevřeno pro Duo SSO přihlášení. Pokud nevidíte popup okno, zkontrolujte nastavení prohlížeče a povolte vyskakovací okna.
                            </p>
                            <div className="mt-2 text-xs text-yellow-700">
                                <p><strong>Server:</strong> sso-1ee95bf1.sso.duosecurity.com</p>
                                <p><strong>Redirect URI:</strong> {CONSTANTS.redirectUri}</p>
                            </div>
                        </div>
                        <button
                            onClick={goBackToEmailCheck}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            ← Zpět na zadání emailu
                        </button>
                    </div>
                );

            case 'token-exchange':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                            <KeyRound className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Výměna tokenů</h2>
                            <p className="text-gray-600">Bezpečně vyměňujeme autorizační kód za přístupové tokeny</p>
                            <p className="text-sm text-purple-600 mt-2">Duo SSO Token Exchange</p>
                        </div>
                    </div>
                );

            case 'ucp-login':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-green-600 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Přihlašování do UCP</h2>
                            <p className="text-gray-600">Dokončujeme přihlášení do UCP systému</p>
                            <p className="text-sm text-green-600 mt-2">Používá se Duo SSO token</p>
                        </div>
                    </div>
                );

            case 'complete':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Přihlášení úspěšné!</h2>
                            <p className="text-gray-600">
                                {isKzcrEmail ?
                                    'Byli jste úspěšně autentizováni přes Duo SSO' :
                                    'Byli jste úspěšně přihlášeni do UCP systému'
                                }
                            </p>
                        </div>
                        {user && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                                <h3 className="font-semibold text-green-900 mb-2">Informace o uživateli:</h3>
                                <div className="text-sm text-green-800 space-y-1">
                                    <p><strong>Email:</strong> {email}</p>
                                    <p><strong>Typ přihlášení:</strong> {isKzcrEmail ? 'Duo SSO OAuth' : 'UCP Direct'}</p>
                                    {isKzcrEmail && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                            <p className="text-xs text-blue-800">
                                                <strong>SSO Server:</strong> sso-1ee95bf1.sso.duosecurity.com
                                            </p>
                                            <p className="text-xs text-blue-800">
                                                <strong>Client ID:</strong> {CONSTANTS.clientId}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={resetFlow}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Nové přihlášení
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <RedirectAuthenticatedUser />
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">{error}</p>
                            <button
                                onClick={resetFlow}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Zkusit znovu
                            </button>
                        </div>
                    )}

                    {renderStep()}

                    {loading && (
                        <div className="mt-6 flex justify-center">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        {step === 'email-check' ? 'Krok 1 z 5' :
                            step === 'regular-login' ? 'Krok 2 z 3' :
                                step === 'oauth' ? 'Krok 2 z 5' :
                                    step === 'token-exchange' ? 'Krok 3 z 5' :
                                        step === 'ucp-login' ? 'Krok 4 z 5' : 'Dokončeno'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
