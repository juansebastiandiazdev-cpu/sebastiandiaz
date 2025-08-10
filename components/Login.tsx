

import React, { useState } from 'react';
import { TeamMember } from '../types';
import { mockTeamMembers } from '../constants';
import { LoaderCircleIcon, SolvoLogoIcon } from './Icons';

interface LoginProps {
    onLogin: (user: TeamMember) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            const user = mockTeamMembers.find(m => m.id === username);
            if (user) {
                onLogin(user);
            } else {
                setError('Invalid username. Please use a mock user ID.');
                setIsLoading(false);
            }
        }, 500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-core-bg text-core-text-secondary p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-core-bg-soft/50 rounded-2xl shadow-2xl shadow-black/20 border border-core-border">
                <div className="text-center">
                    <SolvoLogoIcon className="w-16 h-16 text-core-accent mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-core-text-primary">Solvo Core</h1>
                    <p className="text-core-text-secondary">Please sign in to continue</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="sr-only">Username/Email</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-core-border bg-core-bg text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent focus:border-core-accent focus:z-10 sm:text-sm rounded-lg"
                                placeholder="Enter a mock user ID (e.g., juan.belalcazar)"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-center text-sm text-red-400 py-2">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-core-accent hover:bg-core-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-core-accent focus:ring-offset-core-bg-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-core-accent/20"
                        >
                            {isLoading && <LoaderCircleIcon className="animate-spin h-5 w-5 mr-3" />}
                            {isLoading ? 'Processing...' : 'Sign in'}
                        </button>
                    </div>
                </form>
                 <div className="text-xs text-center text-core-text-secondary/50">
                     Available users: juan.belalcazar, emilio.alvear, solaj418, etc. (no password needed)
                </div>
            </div>
        </div>
    );
};
