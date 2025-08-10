
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { marked, Renderer } from 'marked';
import { Article, TeamMember, AIAnswer, Comment, ArticleVersion } from '../types';
import { ArticleModal } from './ArticleModal';
import { TemplatePickerModal } from './TemplatePickerModal';
import { TableOfContents } from './TableOfContents';
import { CommentsSection } from './CommentsSection';
import { ArticleHistoryView } from './ArticleHistoryView';
import { ArticleListItem } from './ArticleListItem';
import { 
    SearchIcon, SparklesIcon, LoaderIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon,
    EditIcon, MessageSquareIcon, ClockIcon, PlusIcon, BookOpenIcon, HomeIcon, UserIcon, ArrowLeftIcon
} from './Icons';
import { timeAgo } from './utils/time';
import { api } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

interface KnowledgeCenterProps {
    articles: Article[];
    allArticles: Article[];
    currentUser: TeamMember;
    onSaveArticle: (article: Article) => void;
    onDeleteArticle: (articleId: string) => void;
    onSaveComment: (articleId: string, commentContent: string) => void;
    onRestoreVersion: (articleId: string, version: ArticleVersion) => void;
}

interface CategoryNode {
    name: string;
    path: string;
    children: CategoryNode[];
    articles: Article[];
}

const buildCategoryTree = (articles: Article[]): CategoryNode => {
    const root: CategoryNode = { name: 'All Categories', path: '', children: [], articles: [] };
    const nodeMap: Record<string, CategoryNode> = { '': root };

    articles.forEach(article => {
        const pathParts = article.category.split('/').filter(p => p);
        let currentPath = '';
        let parentNode = root;

        pathParts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            let childNode = nodeMap[currentPath];
            if (!childNode) {
                childNode = { name: part, path: currentPath, children: [], articles: [] };
                parentNode.children.push(childNode);
                nodeMap[currentPath] = childNode;
            }
            parentNode = childNode;
        });
        nodeMap[currentPath]?.articles.push(article);
    });

    const addArticlesToParentNodes = (node: CategoryNode): Article[] => {
        const childArticles = node.children.flatMap(addArticlesToParentNodes);
        const allArticles = [...node.articles, ...childArticles];
        node.articles = [...new Map(allArticles.map(item => [item.id, item])).values()];
        return node.articles;
    };

    addArticlesToParentNodes(root);
    return root;
};

const ArticleTreeView: React.FC<{
    node: CategoryNode,
    selectedCategoryPath: string,
    onSelectCategory: (path: string) => void,
    level?: number
}> = ({ node, selectedCategoryPath, onSelectCategory, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);

    useEffect(() => {
        if (selectedCategoryPath.startsWith(node.path) && node.path !== selectedCategoryPath) {
            setIsExpanded(true);
        }
    }, [selectedCategoryPath, node.path]);

    const isSelected = selectedCategoryPath === node.path;
    const hasChildren = node.children.length > 0;

    return (
        <div style={{ paddingLeft: level > 0 ? '0.75rem' : '0' }}>
            <div
                onClick={() => onSelectCategory(node.path)}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-core-accent-light text-core-accent' : 'text-core-text-secondary hover:bg-core-bg-soft hover:text-core-text-primary'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                     <div className="w-5 flex justify-center">
                        {hasChildren && (
                            <ChevronRightIcon 
                                className={`w-4 h-4 text-core-text-secondary/50 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
                                onClick={(e) => {e.stopPropagation(); setIsExpanded(!isExpanded)}} 
                            />
                        )}
                    </div>
                    <FolderIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{node.name}</span>
                </div>
                <span className="text-xs text-core-text-secondary bg-core-bg px-1.5 py-0.5 rounded-full flex-shrink-0">{node.articles.length}</span>
            </div>
            {hasChildren && isExpanded && (
                <div className="mt-1 pl-4 border-l border-core-border/50">
                    {node.children.map(child => (
                        <ArticleTreeView key={child.path} node={child} selectedCategoryPath={selectedCategoryPath} onSelectCategory={onSelectCategory} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const KnowledgeCenter: React.FC<KnowledgeCenterProps> = (props) => {
    const { articles, allArticles, currentUser, onSaveArticle, onDeleteArticle, onSaveComment, onRestoreVersion } = props;
    
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTemplatePickerOpen, setTemplatePickerOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState('');

    const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'history' | 'comments'>('content');

    const articleContentRef = useRef<HTMLDivElement>(null);
    
    const categoryTree = useMemo(() => buildCategoryTree(articles), [articles]);
    
    const articlesToList = useMemo(() => {
        let list: Article[] = [];
        if (aiAnswer) {
            list = aiAnswer.sourceIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as Article[];
        } else if (debouncedSearchTerm) {
            const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
            list = articles.filter(article => article.title.toLowerCase().includes(lowerSearchTerm) || article.content.toLowerCase().includes(lowerSearchTerm));
        } else {
            const findNode = (node: CategoryNode, path: string): CategoryNode | null => {
                if (node.path === path) return node;
                for(const child of node.children) {
                    const found = findNode(child, path);
                    if (found) return found;
                }
                return null;
            }
            const activeNode = findNode(categoryTree, selectedCategoryPath);
            list = activeNode ? activeNode.articles : [];
        }

        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [articles, selectedCategoryPath, debouncedSearchTerm, categoryTree, aiAnswer]);

    const selectedArticle = useMemo(() => articles.find(a => a.id === selectedArticleId), [selectedArticleId, articles]);

    const backlinks = useMemo(() => {
        if (!selectedArticle) return [];
        const regex = new RegExp(`\\[\\[${selectedArticle.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]\\]`, 'gi');
        return allArticles.filter(art => art.id !== selectedArticle.id && regex.test(art.content));
    }, [selectedArticle, allArticles]);

    const createRenderer = () => {
        const renderer = new Renderer();
        (renderer.heading as any) = (text: string, level: number, raw: string) => {
             const id = (raw || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
             return `<h${level} id="${id}" class="scroll-mt-20">${text}</h${level}>`;
        };
        (renderer.link as any) = (href: string, title: string | null, text: string): string => {
            if (href && href.startsWith('!article!')) {
                const articleTitle = href.substring(10);
                const linkedArticle = allArticles.find(a => a.title.toLowerCase() === articleTitle.toLowerCase());
                if(linkedArticle) {
                    return `<button type="button" data-article-id="${linkedArticle.id}" title="Go to article: ${linkedArticle.title}" class="internal-link">${text}</button>`;
                }
            }
            return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
        return renderer;
    }

    const parseContent = (content: string) => {
        const linkProcessedContent = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => `[${p1}](!article!${p1})`);
        return marked(linkProcessedContent, { renderer: createRenderer(), breaks: true, gfm: true });
    };
    
    const handleContentClick = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.matches('button.internal-link')) {
            e.preventDefault();
            const articleId = target.getAttribute('data-article-id');
            if (articleId) {
                setSelectedArticleId(articleId);
            }
        }
    }, [allArticles]);

    useEffect(() => {
        const contentDiv = articleContentRef.current;
        if (contentDiv) {
            contentDiv.addEventListener('click', handleContentClick);
            return () => contentDiv.removeEventListener('click', handleContentClick);
        }
    }, [selectedArticle, activeTab, handleContentClick]);

    const handleSearchSubmit = async (query: string) => {
        if(!query.trim()) return;
        setSelectedArticleId(null);
        setSelectedCategoryPath('');
        setSearchTerm(query);
        setIsSearching(true);
        setAiAnswer(null);

        try {
            const articlesForSearch = articles.map(a => ({ id: a.id, title: a.title, category: a.category, content: a.content }));
            const data = await api.askKnowledgeBase(query, articlesForSearch);
            setAiAnswer({ answer: data.answer, sourceIds: data.sourceIds });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setAiAnswer({ answer: `Search failed: ${errorMessage}`, sourceIds: [] });
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleSelectCategory = (path: string) => {
        setSelectedCategoryPath(path);
        setSearchTerm('');
        setAiAnswer(null);
        setSelectedArticleId(null);
    };

    const findNodeByPath = (node: CategoryNode, path: string): CategoryNode | null => {
        if (node.path === path) return node;
        for (const child of node.children) {
            const found = findNodeByPath(child, path);
            if (found) return found;
        }
        return null;
    };

    const handleEditArticle = (article: Article) => {
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleAddNewArticle = (templateContent: string = '') => {
        setEditingArticle(null);
        if (templateContent) {
           const tempArticle: Article = { 
               id: '', title: '', content: templateContent, authorId: currentUser.id, authorName: currentUser.name, 
               category: selectedCategoryPath || '', tags: [], createdAt: '', updatedAt: '', history: [], comments: [] 
            };
            setEditingArticle(tempArticle);
        }
        setIsModalOpen(true);
    };
    
    const handleSave = (article: Article) => {
        onSaveArticle(article);
        setIsModalOpen(false);
        setEditingArticle(null);
        setSelectedArticleId(article.id);
    };

    const handleSelectArticle = (id: string) => {
        setSelectedArticleId(id);
        setActiveTab('content');
    }

    const Breadcrumbs = () => {
        if (!selectedArticle) return null;
        const pathParts = selectedArticle.category.split('/').filter(Boolean);
        let cumulativePath = '';
        return (
            <div className="flex items-center text-sm text-core-text-secondary">
                <button onClick={() => handleSelectCategory('')} className="hover:text-core-text-primary">
                    All Articles
                </button>
                {pathParts.map((part) => {
                    cumulativePath += (cumulativePath ? '/' : '') + part;
                    const path = cumulativePath;
                    return (
                         <React.Fragment key={path}>
                             <ChevronRightIcon className="w-4 h-4 mx-1" />
                             <button onClick={() => handleSelectCategory(path)} className="hover:text-core-text-primary">{part}</button>
                         </React.Fragment>
                    )
                })}
            </div>
        )
    }
    
    return (
        <>
            <div className="flex h-full bg-core-bg">
                {/* Left Pane: Categories & Search */}
                <aside className="w-[320px] h-full flex flex-col border-r border-core-border flex-shrink-0 bg-core-bg-soft">
                    <header className="p-4 border-b border-core-border flex-shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchTerm)}}>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary pointer-events-none" />
                                <input
                                    type="search"
                                    placeholder="Search articles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-core-bg border border-core-border rounded-lg py-2 pl-10 pr-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                                />
                            </div>
                        </form>
                    </header>
                    <div className="flex-1 overflow-y-auto p-2">
                        <ArticleTreeView node={categoryTree} selectedCategoryPath={selectedCategoryPath} onSelectCategory={handleSelectCategory} />
                    </div>
                     <div className="p-2 border-t border-core-border">
                         <button onClick={() => setTemplatePickerOpen(true)} className="w-full flex items-center justify-center gap-2 bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                            <PlusIcon className="w-4 h-4"/> New Article
                         </button>
                    </div>
                </aside>
                
                {/* Main Content Pane */}
                <main className="flex-1 h-full flex overflow-hidden">
                    {!selectedArticleId ? (
                        <div className="flex-1 overflow-y-auto">
                            <header className="p-6 border-b border-core-border">
                                <h2 className="text-2xl font-bold text-core-text-primary">
                                    {aiAnswer ? "AI Search Results" : debouncedSearchTerm ? "Search Results" : findNodeByPath(categoryTree, selectedCategoryPath)?.name || "All Articles"}
                                </h2>
                                <p className="text-core-text-secondary">{articlesToList.length} article(s) found</p>
                            </header>
                            <div className="p-6">
                                {isSearching ? (
                                    <div className="flex items-center justify-center h-64 text-core-text-secondary"><LoaderIcon className="w-8 h-8 animate-spin"/></div>
                                ) : (
                                    <>
                                        {aiAnswer && (
                                            <div className="bg-core-accent-light p-4 rounded-lg border border-core-accent/30 text-core-text-primary mb-6">
                                                <div className="flex items-start gap-3 font-semibold text-core-accent mb-2">
                                                    <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                    <p className="text-lg">AI Answer</p>
                                                </div>
                                                <p className="text-base text-core-text-secondary">{aiAnswer.answer}</p>
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            {articlesToList.map(article => (
                                                <ArticleListItem key={article.id} article={article} onSelect={() => handleSelectArticle(article.id)} isSelected={false}/>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {!isSearching && articlesToList.length === 0 && (
                                    <div className="text-center pt-20 text-core-text-secondary">
                                        <FolderIcon className="w-16 h-16 mx-auto mb-4"/>
                                        <p className="text-lg">No articles found.</p>
                                        <p>Try selecting another category or searching again.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                        <div className="flex-1 flex flex-col h-full overflow-y-auto" ref={articleContentRef}>
                            <header className="p-6 border-b border-core-border flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <button onClick={() => setSelectedArticleId(null)} className="flex items-center gap-2 text-sm text-core-text-secondary hover:text-core-text-primary">
                                        <ArrowLeftIcon className="w-4 h-4"/>
                                        Back to list
                                    </button>
                                     <span className="text-sm text-core-text-secondary/70">Article #{selectedArticle.id.replace('article-', '')}</span>
                                </div>
                                
                                <div className="mt-4">
                                    <Breadcrumbs />
                                    <h1 className="text-4xl font-extrabold text-core-text-primary mt-2">{selectedArticle.title}</h1>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-core-text-secondary">
                                            <UserIcon className="w-4 h-4"/>
                                            <span>{selectedArticle.authorName}</span>
                                            <span className="text-core-text-secondary/50">&bull;</span>
                                            <ClockIcon className="w-4 h-4"/>
                                            <span>Updated {timeAgo(selectedArticle.updatedAt)}</span>
                                        </div>
                                         <button onClick={() => handleEditArticle(selectedArticle)} className="flex items-center bg-core-bg-soft hover:bg-core-border text-core-text-primary font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"><EditIcon className="w-4 h-4 mr-2" />Edit</button>
                                    </div>
                                </div>
                                
                                 <nav className="mt-6">
                                     <div className="flex items-center space-x-1 bg-core-bg p-1 rounded-lg border border-core-border w-min">
                                        <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'content' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-bg-soft'}`}><BookOpenIcon className="w-4 h-4"/>Content</button>
                                        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'history' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-bg-soft'}`}><ClockIcon className="w-4 h-4"/>History<span className="text-xs px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 ml-1">{selectedArticle.history.length}</span></button>
                                        <button onClick={() => setActiveTab('comments')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'comments' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-bg-soft'}`}><MessageSquareIcon className="w-4 h-4"/>Comments<span className="text-xs px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 ml-1">{selectedArticle.comments.length}</span></button>
                                    </div>
                                </nav>
                            </header>
                             <div className="p-6 prose dark:prose-invert prose-lg max-w-none prose-a:text-core-accent hover:prose-a:text-core-accent-hover prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-h2:border-b prose-h2:border-core-border prose-h2:pb-2">
                                {activeTab === 'content' && <div dangerouslySetInnerHTML={{ __html: parseContent(selectedArticle.content)}} />}
                                {activeTab === 'history' && <ArticleHistoryView article={selectedArticle} onRestore={onRestoreVersion} />}
                                {activeTab === 'comments' && <CommentsSection article={selectedArticle} currentUser={currentUser} onSaveComment={onSaveComment}/>}
                            </div>
                        </div>
                        <TableOfContents content={selectedArticle.content} backlinks={backlinks} onBacklinkClick={(id) => handleSelectArticle(id)}/>
                        </>
                    )}
                </main>
            </div>
            
            <ArticleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} article={editingArticle} currentUser={currentUser} />
            <TemplatePickerModal isOpen={isTemplatePickerOpen} onClose={() => setTemplatePickerOpen(false)} onSelect={handleAddNewArticle} />
        </>
    );
};
