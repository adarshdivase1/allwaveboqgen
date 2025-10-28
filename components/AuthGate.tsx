
import React from 'react';

interface AuthGateProps {
    children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
    // The guidelines state to assume process.env.API_KEY is pre-configured and valid.
    // This component can act as a failsafe check in a development environment.
    if (!process.env.API_KEY) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="text-center p-8 bg-slate-800 rounded-lg shadow-xl">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h1>
                    <p className="text-slate-300">
                        The Gemini API key is not configured.
                    </p>
                    <p className="text-slate-400 mt-2 text-sm">
                        Please set the <code className="bg-slate-700 px-1 py-0.5 rounded">API_KEY</code> environment variable.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthGate;
