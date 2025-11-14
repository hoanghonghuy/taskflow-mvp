'use client'

import React, { useState } from 'react';
import { Comment } from '../../types';
import { useUser } from '../../hooks/useUser';
import Avatar from '../ui/Avatar';
import { PaperAirplaneIcon, ChatBubbleOvalLeftEllipsisIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (content: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment }) => {
    const { user: currentUser, allUsers } = useUser();
    const { t } = useTranslation();
    const [newComment, setNewComment] = useState('');

    const timeAgo = (date: string): string => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return t('timeAgo.year', { count: Math.floor(interval) });
        interval = seconds / 2592000;
        if (interval > 1) return t('timeAgo.month', { count: Math.floor(interval) });
        interval = seconds / 86400;
        if (interval > 1) return t('timeAgo.day', { count: Math.floor(interval) });
        interval = seconds / 3600;
        if (interval > 1) return t('timeAgo.hour', { count: Math.floor(interval) });
        interval = seconds / 60;
        if (interval > 1) return t('timeAgo.minute', { count: Math.floor(interval) });
        return t('timeAgo.now');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    return (
        <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                {t('comments.title')}
            </h3>
            <div className="space-y-4">
                {comments.length > 0 ? (
                    comments.map(comment => {
                        const commenter = allUsers.find(u => u.id === comment.userId);
                        return (
                            <div key={comment.id} className="flex items-start gap-3">
                                <Avatar user={commenter || null} className="w-8 h-8 flex-shrink-0" />
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-sm">{commenter?.name || t('comments.unknownUser')}</span>
                                        <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-sm bg-secondary p-2 rounded-lg mt-1">{comment.content}</p>
                                </div>
                            </div>
                        );
                    }).reverse()
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">{t('comments.empty')}</p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex items-start gap-3">
                <Avatar user={currentUser} className="w-8 h-8 flex-shrink-0" />
                <div className="relative flex-grow">
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={t('comments.placeholder')}
                        rows={1}
                        className="w-full p-2 pr-10 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-primary hover:bg-primary/10 disabled:opacity-50" disabled={!newComment.trim()}>
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentSection;
