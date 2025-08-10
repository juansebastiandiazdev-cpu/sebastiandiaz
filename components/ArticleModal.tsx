
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Article, TeamMember } from '../types';
import { BookOpenIcon, SparklesIcon, LoaderIcon, EditIcon, FilePenIcon } from './Icons';
import { api } from '../services/api';
import { Modal } from './ui/Modal';

interface ArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (article: Article) => void;
    article: Article | null;
    currentUser: TeamMember;
}

const getInitialState = (user: TeamMember): Omit<Article, 'id'> => ({
    title: '',
    content: '',
    category: '',
    tags: [],
    authorId: user.id,
    authorName: user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    comments: [],
});

const handleApiError = (error: unknown, featureName: string) => {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`AI ${featureName} failed: ${errorMessage}`);
};

export const ArticleModal: React.FC<ArticleModalProps> = ({ isOpen, onClose, onSave, article, currentUser }) => {
    const [formData, setFormData] = useState(getInitialState(currentUser));
    const [tagsString, setTagsString] = useState('');
    const [isAiLoading, setIsAiLoading] = useState<null | 'suggest_tags' | 'improve' | 'draft_article'>(null);
    const [activeTab, setActiveTab] = useState<'write' | 'ai_draft'>('write');
    const [aiDraftPrompt, setAiDraftPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (article) {
                setFormData({ ...getInitialState(currentUser), ...article });
                setTagsString(article.tags.join(', '));
            } else {
                setFormData(getInitialState(currentUser));
                setTagsString('');
            }
            setActiveTab('write');
            setAiDraftPrompt('');
        }
    }, [article, isOpen, currentUser]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAiAssist = async (command: 'suggest_tags' | 'improve' | 'draft_article') => {
        const textForCommand = command === 'draft_article' ? aiDraftPrompt : formData.content;
        if (!textForCommand) return;

        setIsAiLoading(command);
        try {
            const data = await api.aiWriter(command, textForCommand, formData.title);

            switch (command) {
                case 'suggest_tags':
                    if (data.suggestions) {
                        setFormData(prev => ({ ...prev, category: data.suggestions.category }));
                        setTagsString(data.suggestions.tags.join(', '));
                    }
                    break;
                case 'improve':
                    setFormData(prev => ({ ...prev, content: data.improvedText }));
                    break;
                case 'draft_article':
                     setFormData(prev => ({
                        ...prev,
                        title: formData.title || aiDraftPrompt,
                        content: data.improvedText
                    }));
                    setActiveTab('write'); // Switch back to editor after drafting
                    break;
            }

        } catch (error) {
            handleApiError(error, command);
        } finally {
            setIsAiLoading(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
        onSave({
            ...formData,
            id: article?.id && article.id !== '' ? article.id : `article-${Date.now()}`,
            tags: finalTags,
            updatedAt: new Date().toISOString(),
        });
    };

    const parsedPreviewHTML = { __html: marked.parse(formData.content || '_Markdown preview will appear here._', { breaks: true, gfm: true }) as string };

    const AiButton = ({command, label, children}: {command: 'suggest_tags' | 'improve', label: string, children?: React.ReactNode}) => (
        <button type="button" onClick={() => handleAiAssist(command)} disabled={!!isAiLoading}
                className="flex items-center justify-center gap-2 text-xs bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait">
            {isAiLoading === command ? <LoaderIcon className="w-4 h-4 animate-spin" /> : children}
            {label}
        </button>
    );
    
    const TabButton = ({label, value, icon}: {label:string, value: 'write' | 'ai_draft', icon: React.ReactNode}) => (
        <button type="button" onClick={() => setActiveTab(value)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-medium ${activeTab === value ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-bg-soft'}`}>
           {icon} {label}
        </button>
    );
    
    const footer = (
        <>
            <button type="button" onClick={onClose} className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
            <button type="submit" form="article-form" className="bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg transition-all">{article?.id ? 'Save Changes' : 'Create Article'}</button>
        </>
    )

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title={article?.id ? 'Edit Article' : 'Create New Article'}
            icon={<BookOpenIcon className="w-6 h-6 text-core-accent" />}
            size="6xl"
            footer={footer}
        >
                <form id="article-form" onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                    <header className="px-6 pb-4 border-b border-core-border">
                        <div className="flex items-center space-x-1 bg-core-bg p-1 rounded-lg border border-core-border w-min">
                            <TabButton label="Write Manually" value="write" icon={<EditIcon className="w-4 h-4" />} />
                            <TabButton label="Draft with AI" value="ai_draft" icon={<FilePenIcon className="w-4 h-4" />} />
                        </div>
                    </header>
                    
                    {activeTab === 'write' ? (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                            {/* Editor Side */}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-core-text-secondary mb-1">Title</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-core-text-secondary mb-1">Category</label>
                                        <input type="text" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g., Policies/HR" className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                                    </div>
                                    <div>
                                        <label htmlFor="tags" className="block text-sm font-medium text-core-text-secondary mb-1">Tags (comma-separated)</label>
                                        <input type="text" name="tags" value={tagsString} onChange={e => setTagsString(e.target.value)} placeholder="hr, vacation" className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="content" className="block text-sm font-medium text-core-text-secondary">Content (Markdown)</label>
                                        <div className="flex items-center gap-2">
                                            <AiButton command="suggest_tags" label="Suggest Category & Tags"><SparklesIcon className="w-4 h-4 text-core-accent" /></AiButton>
                                            <AiButton command="improve" label="Improve Writing"><SparklesIcon className="w-4 h-4 text-core-accent" /></AiButton>
                                        </div>
                                    </div>
                                    <textarea name="content" value={formData.content} onChange={handleChange} required rows={12} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent font-mono text-sm"></textarea>
                                </div>
                            </div>

                            {/* Preview Side */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-core-text-secondary mb-1">Preview</label>
                                <div className="bg-core-bg p-4 rounded-lg border border-core-border h-full overflow-y-auto">
                                    <div className="prose dark:prose-invert prose-sm max-w-none prose-h2:text-xl prose-h3:text-lg prose-h3:text-core-accent prose-headings:mb-2 prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-a:text-core-accent" dangerouslySetInnerHTML={parsedPreviewHTML} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
                           <FilePenIcon className="w-16 h-16 text-core-accent mb-4" />
                           <h3 className="text-2xl font-bold text-core-text-primary">Draft with AI</h3>
                           <p className="text-core-text-secondary mt-2 max-w-lg">Describe the article you want to create. Be as specific as possible for the best results. The AI will generate a draft which you can then edit.</p>
                           <div className="w-full max-w-lg mt-6">
                                <textarea name="ai_draft_prompt" value={aiDraftPrompt} onChange={(e) => setAiDraftPrompt(e.target.value)}
                                          placeholder="e.g., An article explaining the company's policy on remote work, including eligibility, equipment, and communication expectations."
                                          rows={4} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                                <button type="button" onClick={() => handleAiAssist('draft_article')} disabled={!!isAiLoading || !aiDraftPrompt}
                                        className="mt-3 w-full flex items-center justify-center gap-2 bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50">
                                    {isAiLoading === 'draft_article' ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                    Generate Draft
                                </button>
                           </div>
                        </div>
                    )}
                </form>
        </Modal>
    );
};
