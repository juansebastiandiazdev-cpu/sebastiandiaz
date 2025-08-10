
import React from 'react';
import { Article } from '../types';
import { timeAgo } from './utils/time';
import { UserIcon, ClockIcon } from './Icons';

interface ArticleListItemProps {
    article: Article;
    onSelect: () => void;
    isSelected: boolean;
}

export const ArticleListItem: React.FC<ArticleListItemProps> = ({ article, onSelect, isSelected }) => {
    const excerpt = article.content.replace(/#+\s/g, '').replace(/(\r\n|\n|\r)/gm," ").substring(0, 100) + '...';

    return (
        <button 
            onClick={onSelect} 
            className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-2 ${isSelected ? 'bg-core-accent-light border-core-accent' : 'bg-core-bg border-core-border hover:border-core-border/[.65] hover:bg-core-bg-soft'}`}
        >
            <h3 className="font-bold text-core-text-primary text-lg">{article.title}</h3>
            <p className="text-sm text-core-text-secondary mt-2 leading-relaxed">
                {excerpt}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-core-border/50 text-xs text-core-text-secondary/80">
                <div className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4"/>
                    <span>{article.authorName}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4"/>
                    <span>Updated {timeAgo(article.updatedAt)}</span>
                </div>
            </div>
        </button>
    );
};
