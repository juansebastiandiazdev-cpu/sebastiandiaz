

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AccountManagement } from './components/ClientManagement';
import { TeamManagement } from './components/TeamManagement';
import { TaskBoard } from './components/TaskBoard';
import { Leaderboard } from './components/Leaderboard';
import { MyWeek } from './components/MyWeek';
import { Login } from './components/Login';
import { PerformanceHub } from './components/PerformanceHub';
import { KnowledgeCenter } from './components/KnowledgeCenter';
import { Reports } from './components/Reports';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AIAssistant } from './components/AIAssistant';
import { ClientModal } from './components/ClientModal';
import { TaskModal } from './components/TaskModal';
import { TeamMemberModal } from './components/TeamMemberModal';
import { ToastContainer } from './components/ToastContainer';
import { SearchIcon, BellIcon, SparklesIcon, XIcon, LoaderCircleIcon, AlertTriangleIcon, InfoIcon, CheckCircleIcon } from './components/Icons';
import { useDataContext } from './contexts/DataContext';
import { TeamMember, View, Client, Task, AIInsight } from './types';
import { PublicDashboardPage } from './components/PublicDashboardPage';
import { useToasts } from './hooks/useToasts';
import { DataManagement } from './components/DataManagement';
import { api, setApiKeyErrorHandler } from './services/api';
import { QuickAddMenu } from './components/QuickAddMenu';
import { ApiKeyWarningBanner } from './components/ApiKeyWarningBanner';
import { ThemeSwitcher } from './components/ui/ThemeSwitcher';

type ModalState = {
  type: 'task' | 'account' | 'team' | null;
  data: any | null;
}

export const App: React.FC = () => {
    const context = useDataContext();
    const { addToast } = useToasts();
    const {
        currentUser, appReady, isLoadingApp, activeView, setActiveView,
        handleLogin, tasks, accounts, teamMembers, isApiKeyInvalid, setIsApiKeyInvalid
    } = context;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNotificationOpen, setNotificationOpen] = useState(false);
    const [isAIAssistantOpen, setAIAssistantOpen] = useState(false);
    const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
    const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
    const [hasFetchedInsights, setHasFetchedInsights] = useState(false);
    const [publicPageInfo, setPublicPageInfo] = useState<{page: string, id: string} | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    useEffect(() => {
        setApiKeyErrorHandler(() => {
            setIsApiKeyInvalid(true);
        });
    }, [setIsApiKeyInvalid]);

     useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        const id = urlParams.get('id');
        if (page === 'public-dashboard' && id) {
            setPublicPageInfo({ page, id });
        }
    }, []);

    useEffect(() => {
        if (!currentUser || isLoadingApp || activeView !== 'dashboard' || hasFetchedInsights || publicPageInfo) {
            return;
        }

        const fetchAIInsights = async () => {
            try {
                const data = await api.generateDashboardInsights({ currentUser, teamMembers, clients: accounts, tasks });

                if (data.insights && Array.isArray(data.insights)) {
                    const insights: AIInsight[] = data.insights.map((insight: any, index: number) => ({
                        ...insight,
                        id: `insight-${index}-${Date.now()}`,
                    }));
                    setAIInsights(insights);
                    setHasFetchedInsights(true);

                    // Proactive notifications for high-urgency insights
                    insights.forEach(insight => {
                        if (insight.urgency === 'high') {
                            const toastType = insight.type === 'risk' ? 'error' : insight.type === 'opportunity' ? 'success' : 'info';
                            addToast(`[AI Insight] ${insight.text}`, toastType, 8000);
                        }
                    });
                }
            } catch (error) {
                console.error("Error fetching AI insights:", error);
                if (error instanceof Error) {
                    addToast(error.message, 'error');
                }
            }
        };

        const timer = setTimeout(() => {
            fetchAIInsights();
        }, 500);

        return () => clearTimeout(timer);
    }, [activeView, currentUser, isLoadingApp, hasFetchedInsights, accounts, teamMembers, tasks, publicPageInfo, addToast]);
    
    const handleAICommand = (command: any) => {
        if(!command) {
            addToast("Sorry, I couldn't process that request.", "error");
            return;
        }
        const { action, view, filter, itemId, text } = command;
        switch(action) {
            case 'navigate':
                if (view === 'tasks') context.navigateToTasks(filter || {}, itemId);
                else if (view === 'accounts') context.navigateToAccounts(filter || {}, itemId);
                else if (view === 'team' && itemId) context.navigateToTeamMember(itemId);
                else if (view) context.setActiveView(view);
                break;
            case 'answer':
            case 'clarify':
                addToast(text, 'info');
                break;
            default:
                addToast("Sorry, I didn't understand that command.", "error");
        }
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsAiSearching(true);
        try {
            const { command } = await api.conversationalSearch(
                searchQuery,
                { clients: accounts, tasks, teamMembers }
            );
            handleAICommand(command);
        } catch (error) {
            if(error instanceof Error) {
                 addToast(error.message, 'error');
            }
        } finally {
            setIsAiSearching(false);
        }
    };

    const handleOpenModal = (type: 'task' | 'account' | 'team', data: any) => {
        setModalState({ type, data });
    };

    const handleCloseModal = () => {
        setModalState({ type: null, data: null });
    };

    const renderView = () => {
        if (!currentUser) return null;
        switch (activeView) {
            case 'dashboard':
                return <Dashboard 
                    user={currentUser}
                    tasks={tasks}
                    clients={accounts}
                    teamMembers={teamMembers}
                    shoutOuts={context.shoutOuts}
                    setActiveView={setActiveView}
                    navigateToTasks={context.navigateToTasks}
                    navigateToClients={context.navigateToAccounts}
                    navigateToTeamMember={context.navigateToTeamMember}
                    isLoading={isLoadingApp}
                    aiInsights={aiInsights}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                />;
            case 'accounts':
                return <AccountManagement 
                    currentUser={currentUser}
                    accounts={accounts}
                    teamMembers={teamMembers}
                    tasks={tasks}
                    onSaveAccount={context.handleSaveAccount}
                    onDeleteAccount={context.handleDeleteAccount}
                    navigateToTeamMember={context.navigateToTeamMember}
                    navigateToTask={context.navigateToTasks}
                    preselectedAccountId={context.preselectedAccountId}
                    clearPreselectedAccount={() => context.setPreselectedAccountId(null)}
                    accountFilter={context.accountFilter}
                    clearAccountFilter={() => context.setAccountFilter(null)}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                    weeklySnapshots={context.weeklySnapshots}
                    onOpenModal={handleOpenModal}
                />;
            case 'team':
                return <TeamManagement
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    tasks={tasks}
                    clients={accounts}
                    onSaveTeamMember={context.handleSaveTeamMember}
                    onDeleteTeamMember={context.handleDeleteTeamMember}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                    weeklySnapshots={context.weeklySnapshots}
                    onUpdateKpiProgress={context.handleUpdateKpiProgress}
                    onSaveHistoricalSnapshot={context.handleSaveHistoricalSnapshot}
                    navigateToClient={context.navigateToAccounts}
                    navigateToTask={context.navigateToTasks}
                    preselectedTeamMemberId={context.preselectedTeamMemberId}
                    clearPreselectedTeamMember={() => context.setPreselectedTeamMemberId(null)}
                    onOpenModal={handleOpenModal}
                />;
            case 'tasks':
                return <TaskBoard
                    user={currentUser}
                    initialFilter={context.taskFilter}
                    clearFilter={() => context.setTaskFilter(null)}
                    tasks={tasks}
                    clients={accounts}
                    teamMembers={teamMembers}
                    onTaskStatusChange={context.handleTaskStatusChange}
                    onGenerateBulkTasks={context.handleGenerateBulkTasks}
                    navigateToClient={context.navigateToAccounts}
                    navigateToTeamMember={context.navigateToTeamMember}
                    preselectedTaskId={context.preselectedTaskId}
                    clearPreselectedTask={() => context.setPreselectedTaskId(null)}
                    onOpenModal={handleOpenModal}
                    onSaveTask={context.handleSaveTask}
                />;
            case 'leaderboard':
                return <Leaderboard
                    user={currentUser}
                    teamMembers={teamMembers}
                    shoutOuts={context.shoutOuts}
                    departmentalRankings={context.departmentalRankings}
                    onAddShoutOut={context.handleAddShoutOut}
                    onSaveTeamMember={context.handleSaveTeamMember}
                    tasks={tasks}
                    clients={accounts}
                    weeklySnapshots={context.weeklySnapshots}
                    navigateToTeamMember={context.navigateToTeamMember}
                    navigateToClient={context.navigateToAccounts}
                    navigateToTask={context.navigateToTasks}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                    onUpdateKpiProgress={context.handleUpdateKpiProgress}
                    onSaveHistoricalSnapshot={context.handleSaveHistoricalSnapshot}
                />;
            case 'my-week':
                return <MyWeek
                    user={currentUser}
                    navigateToTasks={context.navigateToTasks}
                    tasks={tasks}
                    onOpenModal={handleOpenModal}
                />;
            case 'knowledge-center':
                return <KnowledgeCenter
                    articles={context.articles}
                    allArticles={context.articles}
                    currentUser={currentUser}
                    onSaveArticle={context.handleSaveArticle}
                    onDeleteArticle={context.handleDeleteArticle}
                    onSaveComment={context.handleSaveComment}
                    onRestoreVersion={context.handleRestoreArticleVersion}
                />;
            case 'performance':
                return <PerformanceHub
                    teamMembers={teamMembers}
                    weeklySnapshots={context.weeklySnapshots}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                    onEndWeek={context.handleEndWeek}
                    onSaveKpiGroup={context.handleSaveKpiGroup}
                    onDeleteKpiGroup={context.handleDeleteKpiGroup}
                    navigateToTeamMember={context.navigateToTeamMember}
                />;
            case 'reports':
                return <Reports
                    clients={accounts}
                    tasks={tasks}
                    teamMembers={teamMembers}
                    weeklySnapshots={context.weeklySnapshots}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                />;
            case 'datamanagement':
                return <DataManagement />;
            default:
                return <div>Not implemented</div>;
        }
    };

    if (publicPageInfo?.page === 'public-dashboard') {
        return <PublicDashboardPage clientId={publicPageInfo.id} />;
    }
    
    if (!appReady || isLoadingApp) {
        return <LoadingOverlay />;
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-core-bg font-sans">
            <ToastContainer />
            <Sidebar 
                user={currentUser}
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed} 
                setCollapsed={setIsSidebarCollapsed} 
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-8 bg-core-bg/80 backdrop-blur-md border-b border-core-border flex-shrink-0">
                    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Ask AI to navigate or answer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-core-bg-soft border border-core-border rounded-lg py-2 pl-12 pr-10 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"
                        />
                        {isAiSearching && <LoaderCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary animate-spin" />}
                    </form>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setAIAssistantOpen(true)} className="group relative flex items-center gap-2 text-core-text-primary bg-core-bg-soft px-4 py-2 rounded-lg text-sm border border-core-border hover:border-core-accent transition-colors">
                            <SparklesIcon className="w-5 h-5 text-core-accent"/>
                            AI Assistant
                        </button>
                        <button onClick={() => setNotificationOpen(prev => !prev)} className="relative text-core-text-secondary hover:text-core-text-primary transition-colors">
                            <BellIcon className="w-6 h-6"/>
                            {context.notifications.filter(n => !n.read).length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-core-bg"></span></span>}
                        </button>
                        <ThemeSwitcher />
                         <div className="w-px h-6 bg-core-border"></div>
                         <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-core-text-primary">{currentUser.name}</p>
                                <p className="text-xs text-core-text-secondary">{currentUser.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-core-accent flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                               {currentUser.avatarInitials}
                           </div>
                        </div>
                    </div>
                </header>
                {isApiKeyInvalid && <ApiKeyWarningBanner />}
                <div className="flex-1 overflow-y-auto">
                    {renderView()}
                </div>
            </main>

            <div className="fixed bottom-8 right-8 z-20 flex items-center gap-4">
                 <QuickAddMenu onSelect={(type) => handleOpenModal(type, null)} />
            </div>

            <AIAssistant 
                isOpen={isAIAssistantOpen} 
                onClose={() => setAIAssistantOpen(false)}
                onNavigate={(view, filter, itemId) => {
                    if (view === 'tasks') context.navigateToTasks(filter, itemId);
                    else if (view === 'accounts') context.navigateToAccounts(filter, itemId);
                    else if (view === 'team' && itemId) context.navigateToTeamMember(itemId);
                    else context.setActiveView(view);
                }}
            />
            
            {isNotificationOpen && (
                 <div className="absolute top-20 right-8 w-80 bg-core-bg-soft/95 backdrop-blur-xl border border-core-border rounded-lg shadow-2xl z-20 animate-fade-in-down origin-top-right">
                    <div className="p-3 border-b border-core-border flex justify-between items-center">
                        <h4 className="font-semibold text-core-text-primary">Notifications</h4>
                        <button onClick={() => setNotificationOpen(false)} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                        {context.notifications.length > 0 ? context.notifications.map(notif => {
                            let icon, containerClass;
                            switch(notif.type) {
                                case 'alert':
                                    icon = <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400"/>;
                                    containerClass = "bg-red-500/10 text-red-700 dark:text-red-300";
                                    break;
                                case 'success':
                                    icon = <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500 dark:text-green-400"/>;
                                    containerClass = "bg-green-500/10 text-green-700 dark:text-green-300";
                                    break;
                                case 'info':
                                default:
                                    icon = <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400"/>;
                                    containerClass = "bg-blue-500/10 text-blue-700 dark:text-blue-300";
                            }

                            return (
                                <div key={notif.id} className={`p-2.5 rounded-md mb-1 text-sm flex items-start gap-2.5 ${containerClass}`}>
                                    {icon}
                                    <span>{notif.message}</span>
                                </div>
                            );
                        }) : <p className="text-sm text-core-text-secondary text-center p-4">No new notifications.</p>}
                    </div>
                </div>
            )}
            
            {modalState.type && (
                <>
                    {modalState.type === 'task' && <TaskModal 
                        isOpen={modalState.type === 'task'} 
                        onClose={handleCloseModal} 
                        task={modalState.data as Task | null}
                        onSave={context.handleSaveTask}
                        onDelete={context.handleDeleteTask}
                        clients={accounts}
                        teamMembers={teamMembers}
                    />}
                    {modalState.type === 'account' && <ClientModal 
                        isOpen={modalState.type === 'account'} 
                        onClose={handleCloseModal} 
                        client={modalState.data as Client | null}
                        onSave={context.handleSaveAccount}
                        teamMembers={teamMembers}
                    />}
                    {modalState.type === 'team' && <TeamMemberModal 
                        isOpen={modalState.type === 'team'} 
                        onClose={handleCloseModal} 
                        member={modalState.data as TeamMember | null}
                        onSave={context.handleSaveTeamMember}
                    />}
                </>
            )}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
