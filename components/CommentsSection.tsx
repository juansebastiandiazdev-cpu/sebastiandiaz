
import React, { useState } from 'react';
import { Article, TeamMember } from '../types';
import { SendIcon } from './Icons';
import { timeAgo } from './utils/time';

interface CommentsSectionProps {
    article: Article;
    currentUser: TeamMember;
    onSaveComment: (articleId: string, commentContent: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ article, currentUser, onSaveComment }) => {
    const [newComment, setNewComment] = useState('');
    const comments = article.comments || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(newComment.trim()) {
            onSaveComment(article.id, newComment.trim());
            setNewComment('');
        }
    };

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-core-text-primary mb-4">Comments ({comments.length})</h3>
            <div className="space-y-4">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-core-accent flex-shrink-0 flex items-center justify-center font-bold text-core-accent-foreground">
                            {comment.authorAvatarInitials}
                        </div>
                        <div className="flex-1 bg-core-bg-soft p-3 rounded-lg border border-core-border">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-core-text-primary">{comment.authorName}</p>
                                <p className="text-xs text-core-text-secondary/70">{timeAgo(comment.createdAt)}</p>
                            </div>
                            <p className="text-sm text-core-text-secondary mt-1">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex items-start gap-3 pt-6 border-t border-core-border">
                <div className="w-10 h-10 rounded-full bg-core-bg-soft flex-shrink-0 flex items-center justify-center font-bold text-core-text-primary border border-core-border">
                    {currentUser.avatarInitials}
                </div>
                <div className="flex-1">
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                    />
                    <div className="text-right mt-2">
                         <button type="submit" disabled={!newComment.trim()} className="flex items-center justify-center gap-2 bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                            <SendIcon className="w-4 h-4"/>
                            <span>Post Comment</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
