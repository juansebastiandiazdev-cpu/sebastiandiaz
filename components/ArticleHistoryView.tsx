
import React from 'react';
import { Article, ArticleVersion } from '../types';
import { timeAgo } from './utils/time';
import { UserIcon } from './Icons';

interface ArticleHistoryViewProps {
    article: Article;
    onRestore: (articleId: string, version: ArticleVersion) => void;
}

export const ArticleHistoryView: React.FC<ArticleHistoryViewProps> = ({ article, onRestore }) => {
    const history = article.history || [];

    const handleRestoreClick = (version: ArticleVersion) => {
        if(window.confirm('Are you sure you want to restore this version? The current content will be saved as a new version in the history.')) {
            onRestore(article.id, version);
        }
    }

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-core-text-primary mb-4">Version History</h3>
            <div className="space-y-4">
                {/* Current Version */}
                <div className="bg-core-bg-soft p-4 rounded-lg border border-core-accent/50">
                    <p className="font-semibold text-core-text-primary">Current Version</p>
                    <div className="flex items-center gap-4 text-xs text-core-text-secondary mt-1">
                        <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" />Edited by {article.authorName}</span>
                        <span>{timeAgo(article.updatedAt)}</span>
                    </div>
                </div>
                
                {history.slice().reverse().map((version, index) => (
                    <div key={index} className="bg-core-bg p-4 rounded-lg border border-core-border group">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-core-text-primary">Version from {new Date(version.updatedAt).toLocaleString()}</p>
                                 <div className="flex items-center gap-4 text-xs text-core-text-secondary mt-1">
                                    <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" />Edited by {version.authorName}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRestoreClick(version)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-1 px-3 rounded-md text-sm">
                                Restore
                            </button>
                        </div>
                    </div>
                ))}

                 {history.length === 0 && (
                     <div className="text-center text-core-text-secondary py-8">
                         No previous versions found.
                     </div>
                 )}
            </div>
        </div>
    );
};
