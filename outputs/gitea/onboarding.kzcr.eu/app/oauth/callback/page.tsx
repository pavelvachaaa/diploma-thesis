"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleOAuthCallback = () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const error = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                if (error) {
                    setStatus('error');
                    setMessage(`OAuth Error: ${errorDescription || error}`);

                    // Send error to parent window if in popup
                    if (window.opener && window.opener !== window) {
                        window.opener.postMessage({
                            type: 'duo-oauth-callback',
                            error: error,
                            error_description: errorDescription
                        }, window.location.origin);
                        window.close();
                    }
                    return;
                }

                if (code && state) {
                    setStatus('success');
                    setMessage('Úspěšně přesměrováno z Duo SSO. Dokončujeme přihlášení...');

                    // Send success data to parent window if in popup
                    if (window.opener && window.opener !== window) {
                        window.opener.postMessage({
                            type: 'duo-oauth-callback',
                            code: code,
                            state: state
                        }, window.location.origin);

                        // Close popup after short delay
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    } else {
                        // If not in popup, redirect to login page with the code
                        const loginUrl = new URL('/login', window.location.origin);
                        loginUrl.searchParams.set('code', code);
                        loginUrl.searchParams.set('state', state);
                        window.location.href = loginUrl.toString();
                    }
                } else {
                    setStatus('error');
                    setMessage('Chybějící parametry OAuth odpovědi');

                    if (window.opener && window.opener !== window) {
                        window.opener.postMessage({
                            type: 'duo-oauth-callback',
                            error: 'missing_parameters'
                        }, window.location.origin);
                        window.close();
                    }
                }
            } catch (err) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setMessage('Chyba při zpracování OAuth odpovědi');

                if (window.opener && window.opener !== window) {
                    window.opener.postMessage({
                        type: 'duo-oauth-callback',
                        error: 'callback_processing_error'
                    }, window.location.origin);
                    window.close();
                }
            }
        };

        handleOAuthCallback();
    }, [searchParams]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Zpracovávání přihlášení</h2>
                            <p className="text-gray-600">Zpracováváme odpověď z Duo SSO...</p>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Přihlášení úspěšné</h2>
                            <p className="text-gray-600">{message}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {window.opener ? 'Zavírání okna...' : 'Přesměrování...'}
                            </p>
                        </div>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chyba přihlášení</h2>
                            <p className="text-gray-600">{message}</p>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Zpět na přihlášení
                            </button>
                            {window.opener && (
                                <button
                                    onClick={() => window.close()}
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    Zavřít okno
                                </button>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {renderContent()}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        OAuth Callback - Duo SSO
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {window.location.hostname}
                    </p>
                </div>
            </div>
        </div>
    );
}