
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
    EditIcon, MessageSquareIcon, ClockIcon, PlusIcon, BookOpenIcon, HomeIcon
} from './Icons';
import { timeAgo } from './utils/time';
import { api } from './services/api';

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

const KnowledgeCenterHome: React.FC<{ 
    onSearch: (term: string) => void,
    onNewArticle: () => void,
}> = ({ onSearch, onNewArticle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-800/30">
            <BookOpenIcon className="w-20 h-20 mb-4 text-indigo-400" />
            <h2 className="text-4xl font-bold text-white">Knowledge Center</h2>
            <p className="mt-2 text-slate-400 max-w-xl">
                Your team's central hub for processes and workflows.
                Ask a question or search for an article to get started.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); onSearch(searchTerm);}} className="relative w-full max-w-lg mt-8">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </form>
             <button onClick={onNewArticle} className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">
                Or, create a new article
            </button>
        </div>
    );
};

const ArticleTreeView: React.FC<{
    node: CategoryNode,
    selectedCategoryPath: string,
    onSelectCategory: (path: string) => void,
    level?: number
}> = ({ node, selectedCategoryPath, onSelectCategory, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);

    useEffect(() => {
        // Expand parent categories if a child is selected
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
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                     <div className="w-5 flex justify-center">
                        {hasChildren && (
                            <ChevronDownIcon 
                                className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? '' : '-rotate-90'}`} 
                                onClick={(e) => {e.stopPropagation(); setIsExpanded(!isExpanded)}} 
                            />
                        )}
                    </div>
                    <FolderIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{node.name}</span>
                </div>
                <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded-full flex-shrink-0">{node.articles.length}</span>
            </div>
            {hasChildren && isExpanded && (
                <div className="mt-1 pl-3 border-l border-slate-700/50">
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
    const [selectedCategoryPath, setSelectedCategoryPath] = useState('');

    const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'history' | 'comments'>('content');

    const articleContentRef = useRef<HTMLDivElement>(null);
    
    const categoryTree = useMemo(() => buildCategoryTree(articles), [articles]);
    
    const articlesToList = useMemo(() => {
        let list: Article[] = [];
        if (aiAnswer) { // Show AI search sources
            list = aiAnswer.sourceIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as Article[];
        } else if (searchTerm) { // Regular text search
            const lowerSearchTerm = searchTerm.toLowerCase();
            list = articles.filter(article => article.title.toLowerCase().includes(lowerSearchTerm) || article.content.toLowerCase().includes(lowerSearchTerm));
        } else { // Category browsing
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
    }, [articles, selectedCategoryPath, searchTerm, categoryTree, aiAnswer]);

    const selectedArticle = useMemo(() => articles.find(a => a.id === selectedArticleId), [selectedArticleId, articles]);

    const backlinks = useMemo(() => {
        if (!selectedArticle) return [];
        const regex = new RegExp(`\\[\\[${selectedArticle.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]\\]`, 'gi');
        return allArticles.filter(art => art.id !== selectedArticle.id && regex.test(art.content));
    }, [selectedArticle, allArticles]);

    const createRenderer = () => {
        const renderer = new Renderer();
        (renderer.heading as any) = (text: string, level: number, raw: string) => {
             const id = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
             return `<h${level} id="${id}">${text}</h${level}>`;
        };
        (renderer.link as any) = (href: string, title: string | null, text: string): string => {
            if (href && href.startsWith('!article!')) {
                const articleTitle = href.substring(10);
                const linkedArticle = allArticles.find(a => a.title.toLowerCase() === articleTitle.toLowerCase());
                if(linkedArticle) {
                    return `<a href="#" data-article-id="${linkedArticle.id}" title="Go to article: ${linkedArticle.title}" class="internal-link">${text}</a>`;
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
        if (target.matches('a.internal-link')) {
            e.preventDefault();
            const articleId = target.getAttribute('data-article-id');
            if (articleId) {
                setSelectedArticleId(articleId);
            }
        }
    }, []);

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
            setAiAnswer({ answer: errorMessage, sourceIds: [] });
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleSelectCategory = (path: string) => {
        setSelectedCategoryPath(path);
        setSearchTerm('');
        setAiAnswer(null);
        // Optionally select first article in category
        const node = findNodeByPath(categoryTree, path);
        if (node && node.articles.length > 0) {
            setSelectedArticleId(node.articles[0].id);
        } else {
            setSelectedArticleId(null);
        }
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
            <div className="flex items-center text-sm text-slate-400">
                <button onClick={() => handleSelectCategory('')} className="hover:text-white">
                    <HomeIcon className="w-4 h-4"/>
                </button>
                {pathParts.map((part, index) => {
                    cumulativePath += (cumulativePath ? '/' : '') + part;
                    const path = cumulativePath;
                    return (
                         <React.Fragment key={path}>
                             <ChevronRightIcon className="w-4 h-4 mx-1" />
                             <button onClick={() => handleSelectCategory(path)} className="hover:text-white">{part}</button>
                         </React.Fragment>
                    )
                })}
            </div>
        )
    }
    
    return (
        <>
            <div className="flex h-full bg-slate-900">
                {/* Left Pane: Categories */}
                <aside className="w-[320px] h-full flex flex-col border-r border-slate-700 flex-shrink-0 bg-slate-800/50">
                    <header className="p-4 border-b border-slate-700 flex-shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchTerm)}}>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                <input
                                    type="search"
                                    placeholder="Ask a question..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </form>
                    </header>
                    <div className="flex-1 overflow-y-auto p-2">
                        <ArticleTreeView node={categoryTree} selectedCategoryPath={selectedCategoryPath} onSelectCategory={handleSelectCategory} />
                    </div>
                     <div className="p-2 border-t border-slate-700">
                         <button onClick={() => setTemplatePickerOpen(true)} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                            <PlusIcon className="w-4 h-4"/> New Article
                         </button>
                    </div>
                </aside>

                {/* Middle Pane: Article List */}
                <aside className="w-[400px] h-full flex flex-col border-r border-slate-700 flex-shrink-0">
                     <header className="p-4 border-b border-slate-700 flex-shrink-0 h-[69px] flex items-center">
                        <h3 className="font-semibold text-white truncate">
                            {aiAnswer ? "AI Search Results" : searchTerm ? "Search Results" : findNodeByPath(categoryTree, selectedCategoryPath)?.name || "All Articles"}
                        </h3>
                     </header>
                     <div className="flex-1 overflow-y-auto p-3 space-y-2">
                         {isSearching ? (
                            <div className="flex items-center justify-center h-full text-slate-400"><LoaderIcon className="w-8 h-8 animate-spin"/></div>
                         ) : (
                             <>
                                {aiAnswer && (
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-indigo-500/30 text-sm text-slate-300 mb-3">
                                        <div className="flex items-start gap-2 font-semibold text-indigo-400 mb-2">
                                            <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <p>AI Answer</p>
                                        </div>
                                        {aiAnswer.answer}
                                    </div>
                                )}
                                {articlesToList.map(article => (
                                    <ArticleListItem
                                        key={article.id}
                                        article={article}
                                        onSelect={() => handleSelectArticle(article.id)}
                                        isSelected={selectedArticleId === article.id}
                                    />
                                ))}
                             </>
                         )}
                         {!isSearching && articlesToList.length === 0 && (
                            <div className="text-center pt-20 text-slate-500">
                                <FolderIcon className="w-12 h-12 mx-auto mb-2"/>
                                <p>No articles found.</p>
                            </div>
                         )}
                     </div>
                </aside>

                {/* Right Pane: Main Content */}
                <main className="flex-1 h-full overflow-hidden">
                    {!selectedArticle ? (
                       <KnowledgeCenterHome onSearch={handleSearchSubmit} onNewArticle={() => setTemplatePickerOpen(true)} />
                    ) : (
                        <div className="h-full flex">
                            <div className="flex-1 flex flex-col h-full">
                                <header className="p-6 border-b border-slate-700 flex-shrink-0">
                                    <Breadcrumbs />
                                    <div className="flex justify-between items-start mt-2">
                                        <h2 className="text-3xl font-bold text-white">{selectedArticle.title}</h2>
                                        <button onClick={() => handleEditArticle(selectedArticle)} className="flex items-center bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"><EditIcon className="w-4 h-4 mr-2" />Edit</button>
                                    </div>
                                    <nav className="mt-4 flex items-center justify-between">
                                         <div className="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                                            <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><BookOpenIcon className="w-4 h-4"/>Content</button>
                                            <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><ClockIcon className="w-4 h-4"/>History<span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{selectedArticle.history.length}</span></button>
                                            <button onClick={() => setActiveTab('comments')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'comments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><MessageSquareIcon className="w-4 h-4"/>Comments<span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{selectedArticle.comments.length}</span></button>
                                        </div>
                                    </nav>
                                </header>
                                <div className="flex-1 overflow-y-auto article-content-area" ref={articleContentRef}>
                                    {activeTab === 'content' && <div className="p-6 prose prose-lg prose-invert max-w-4xl mx-auto prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-headings:text-white prose-h1:text-4xl" dangerouslySetInnerHTML={{ __html: parseContent(selectedArticle.content)}} />}
                                    {activeTab === 'history' && <div className="max-w-4xl mx-auto"><ArticleHistoryView article={selectedArticle} onRestore={onRestoreVersion} /></div>}
                                    {activeTab === 'comments' && <div className="max-w-4xl mx-auto"><CommentsSection article={selectedArticle} currentUser={currentUser} onSaveComment={onSaveComment}/></div>}
                                </div>
                            </div>
                            <TableOfContents content={selectedArticle.content} backlinks={backlinks} onBacklinkClick={(id) => handleSelectArticle(id)}/>
                        </div>
                    )}
                </main>
            </div>
            
            <ArticleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} article={editingArticle} currentUser={currentUser} />
            <TemplatePickerModal isOpen={isTemplatePickerOpen} onClose={() => setTemplatePickerOpen(false)} onSelect={handleAddNewArticle} />
        </>
    );
};
