


import React from 'react';
import { AlertTriangleIcon } from './Icons';

export const ApiKeyWarningBanner: React.FC = () => {
    return (
        <div className="bg-red-900/50 border-y border-red-500/60 text-red-300 p-3 text-sm flex items-center gap-3 flex-shrink-0">
            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 text-red-400" />
            <div className="font-medium">
                <span className="font-bold">Configuration Error:</span> Gemini API key is missing or invalid. All AI features will be disabled. Please set a valid `API_KEY` in the <code className="bg-red-800/50 text-red-200 px-1 py-0.5 rounded text-xs">functions/local.settings.json</code> file.
            </div>
        </div>
    );
};
