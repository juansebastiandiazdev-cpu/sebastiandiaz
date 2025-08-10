
import { useState, useEffect, useCallback } from 'react';
import { View, TaskFilter, Task, TaskStatus, Client, ShoutOut, DepartmentalRanking, Article, Comment, ArticleVersion, WeeklyPerformanceSnapshot, KpiGroup, KpiProgress, TeamMember, AccountFilter, TaskPriority, Notification, Kpi } from '../types';
import { mockTasks, mockAccounts, mockTeamMembers, mockShoutOuts, departmentalRankings as mockDepartmentalRankings, mockArticles, mockKpiGroups, mockKpiProgress, mockWeeklySnapshots, mockKpis } from '../constants';
import { useToasts } from './useToasts';
import { useLocalStorage } from './useLocalStorage';
import { calculatePerformanceScore } from '../components/utils/calculations';

const getRegisteredUsers = (): TeamMember[] => {
    try {
        const users = localStorage.getItem('solvo-core-users');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
};

export const useAppData = () => {
    const { addToast } = useToasts();
    
    // --- UI & Auth State ---
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isLoadingApp, setIsLoadingApp] = useState(true);
    const [appReady, setAppReady] = useState(false);
    const [isApiKeyInvalid, setIsApiKeyInvalid] = useState(false);

    const isMock = !currentUser || mockTeamMembers.some(m => m.id === currentUser?.id);
    const userId = currentUser?.id || 'public';

    // --- Core Data State using useLocalStorage hook ---
    const [tasks, setTasks] = useLocalStorage<Task[]>(`solvo-core-tasks-${userId}`, isMock ? mockTasks : []);
    const [accounts, setAccounts] = useLocalStorage<Client[]>(`solvo-core-accounts-${userId}`, isMock ? mockAccounts : []);
    const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>(`solvo-core-team-${userId}`, isMock ? mockTeamMembers : []);
    const [kpiGroups, setKpiGroups] = useLocalStorage<KpiGroup[]>(`solvo-core-kpigroups-${userId}`, isMock ? mockKpiGroups : []);
    const [kpiProgress, setKpiProgress] = useLocalStorage<KpiProgress[]>(`solvo-core-kpiprogress-${userId}`, isMock ? mockKpiProgress : []);
    const [shoutOuts, setShoutOuts] = useLocalStorage<ShoutOut[]>(`solvo-core-shoutouts-${userId}`, isMock ? mockShoutOuts : []);
    const [departmentalRankings, setDepartmentalRankings] = useLocalStorage<DepartmentalRanking[]>(`solvo-core-rankings-${userId}`, isMock ? mockDepartmentalRankings : []);
    const [articles, setArticles] = useLocalStorage<Article[]>(`solvo-core-articles-${userId}`, isMock ? mockArticles : []);
    const [weeklySnapshots, setWeeklySnapshots] = useLocalStorage<WeeklyPerformanceSnapshot[]>(`solvo-core-snapshots-${userId}`, isMock ? mockWeeklySnapshots : []);
    const [allKpis, setAllKpis] = useLocalStorage<Kpi[]>(`solvo-core-kpis-${userId}`, isMock ? mockKpis : []);
    
    // --- Notifications ---
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // --- Global Navigation ---
    const [taskFilter, setTaskFilter] = useState<TaskFilter | null>(null);
    const [accountFilter, setAccountFilter] = useState<AccountFilter | null>(null);
    const [preselectedTaskId, setPreselectedTaskId] = useState<string | null>(null);
    const [preselectedAccountId, setPreselectedAccountId] = useState<string | null>(null);
    const [preselectedTeamMemberId, setPreselectedTeamMemberId] = useState<string | null>(null);
    
    // --- App startup logic ---
    useEffect(() => {
        const handleAuth = () => {
            setIsLoadingApp(true);
            const lastUserId = localStorage.getItem('solvo-core-last-user');
            if (lastUserId) {
                const allUsers = [...mockTeamMembers, ...getRegisteredUsers()];
                const user = allUsers.find(u => u.id === lastUserId);
                if (user) {
                    setCurrentUser(user);
                }
            }
            setAppReady(true);
            setIsLoadingApp(false);
        };
        handleAuth();
    }, []);

    // Recalculate performance scores when dependencies change
    useEffect(() => {
        if (!teamMembers.length || !kpiGroups.length) return;
        setTeamMembers(prevMembers => prevMembers.map(m => ({
            ...m,
            performanceScore: calculatePerformanceScore(m.id, kpiGroups, kpiProgress, prevMembers)
        })));
    }, [kpiProgress, kpiGroups]);


    // Notification generation
    useEffect(() => {
        if (!currentUser) return;
        
        const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
        const newNotifs: Notification[] = [];
        const overdueTasks = myTasks.filter(t => t.status !== TaskStatus.Completed && new Date(t.dueDate) < new Date());
        if(overdueTasks.length > 0) {
            newNotifs.push({
                id: `notif-overdue-${Date.now()}`, type: 'alert', message: `You have ${overdueTasks.length} overdue task(s).`,
                timestamp: new Date().toISOString(), read: false, link: { view: 'tasks', itemId: TaskStatus.Overdue }
            });
        }
        setNotifications(newNotifs);
    }, [tasks, shoutOuts, currentUser]);

    useEffect(() => {
        if (activeView !== 'tasks') setTaskFilter(null);
        if (activeView !== 'accounts') setAccountFilter(null);
    }, [activeView]);
  
    // --- Navigation Handlers ---
    const navigateToTasks = useCallback((filter: Partial<TaskFilter>, taskId?: string) => {
        setTaskFilter(filter);
        setPreselectedTaskId(taskId || null);
        setActiveView('tasks');
    }, []);

    const navigateToAccounts = useCallback((filter: Partial<AccountFilter>, accountId?: string) => {
        setAccountFilter(filter);
        setPreselectedAccountId(accountId || null);
        setActiveView('accounts');
    }, []);
  
    const navigateToTeamMember = useCallback((memberId: string) => {
        setPreselectedTeamMemberId(memberId);
        setActiveView('team');
    }, []);

    // --- CRUD & Logic Handlers ---
    const handleLogin = useCallback((user: TeamMember) => {
        setIsLoadingApp(true);
        setCurrentUser(user);
        localStorage.setItem('solvo-core-last-user', user.id);
        setActiveView('dashboard');
        setTimeout(() => setIsLoadingApp(false), 500);
    }, []);

    const handleSaveTask = useCallback((taskToSave: Task) => {
        setTasks(prevTasks => {
            const taskExists = prevTasks.some(t => t.id === taskToSave.id);
            if (taskExists) {
                return prevTasks.map(t => t.id === taskToSave.id ? taskToSave : t);
            } else {
                return [...prevTasks, taskToSave];
            }
        });
        addToast("Task saved successfully!", 'success');
    }, [addToast, setTasks]);
  
    const handleDeleteTask = useCallback((taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        addToast("Task deleted.", 'info');
    }, [addToast, setTasks]);

    const handleSaveAccount = useCallback((accountToSave: Client) => {
        setAccounts(prevAccounts => {
            const accountExists = prevAccounts.some(c => c.id === accountToSave.id);
            if (accountExists) {
                return prevAccounts.map(c => c.id === accountToSave.id ? accountToSave : c);
            } else {
                return [...prevAccounts, accountToSave];
            }
        });
        addToast("Account saved successfully!", 'success');
    }, [addToast, setAccounts]);

    const handleDeleteAccount = useCallback((accountId: string) => {
        setAccounts(prevAccounts => prevAccounts.filter(c => c.id !== accountId));
        setTasks(prevTasks => prevTasks.filter(t => t.clientId !== accountId));
        addToast("Account deleted.", 'info');
    }, [addToast, setAccounts, setTasks]);

    const handleSaveTeamMember = useCallback((memberToSave: TeamMember) => {
        setTeamMembers(prevMembers => {
            const memberExists = prevMembers.some(m => m.id === memberToSave.id);
            if (memberExists) {
                return prevMembers.map(m => m.id === memberToSave.id ? { ...m, ...memberToSave } : m);
            } else {
                return [...prevMembers, memberToSave];
            }
        });
        addToast("Team member saved successfully!", 'success');
    }, [addToast, setTeamMembers]);

    const handleDeleteTeamMember = useCallback((memberId: string) => {
        setTeamMembers(prevMembers => prevMembers.filter(m => m.id !== memberId));
        setTasks(prevTasks => prevTasks.map(t => (t.assignedTo === memberId ? { ...t, assignee: undefined } : t)));
        setKpiProgress(prev => prev.filter(p => p.teamMemberId !== memberId));
        addToast("Team member deleted.", 'info');
    }, [addToast, setTeamMembers, setTasks, setKpiProgress]);

    const handleTaskStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }, [setTasks]);
  
    const handleAddShoutOut = useCallback((shoutOut: Omit<ShoutOut, 'id'>) => {
        const newShoutOut: ShoutOut = { ...shoutOut, id: `so-${Date.now()}` };
        setShoutOuts(prev => [newShoutOut, ...prev]);
        addToast("Shout-out sent!", 'success');
    }, [addToast, setShoutOuts]);

    const handleSaveArticle = useCallback((articleToSave: Article) => {
        setArticles(prevArticles => {
            const existingArticle = prevArticles.find(a => a.id === articleToSave.id);
            let finalArticle = { ...articleToSave };
            if (existingArticle && existingArticle.content !== articleToSave.content) {
                const version: ArticleVersion = { content: existingArticle.content, updatedAt: existingArticle.updatedAt, authorId: existingArticle.authorId, authorName: existingArticle.authorName };
                finalArticle.history = [...(existingArticle.history || []), version];
            }
            const exists = prevArticles.some(a => a.id === finalArticle.id);
            if (exists) {
                return prevArticles.map(a => a.id === finalArticle.id ? finalArticle : a);
            }
            return [finalArticle, ...prevArticles];
        });
        addToast("Article saved.", 'success');
    }, [addToast, setArticles]);
  
    const handleDeleteArticle = useCallback((articleId: string) => {
        setArticles(prev => prev.filter(a => a.id !== articleId));
        addToast("Article deleted.", 'info');
    }, [addToast, setArticles]);

    const handleRestoreArticleVersion = useCallback((articleId: string, versionToRestore: ArticleVersion) => {
        if (!currentUser) return;
        setArticles(prevArticles => prevArticles.map(article => {
            if (article.id === articleId) {
                const currentVersion: ArticleVersion = { content: article.content, updatedAt: article.updatedAt, authorId: currentUser.id, authorName: currentUser.name };
                return { ...article, content: versionToRestore.content, updatedAt: new Date().toISOString(), authorId: currentUser.id, authorName: currentUser.name, history: [...article.history, currentVersion] };
            }
            return article;
        }));
        addToast("Article version restored.", 'success');
    }, [currentUser, addToast, setArticles]);
  
    const handleSaveComment = useCallback((articleId: string, commentContent: string) => {
        if (!currentUser) return;
        const newComment: Comment = { id: `comment-${Date.now()}`, content: commentContent, authorId: currentUser.id, authorName: currentUser.name, authorAvatarInitials: currentUser.avatarInitials, createdAt: new Date().toISOString() };
        setArticles(prevArticles => prevArticles.map(article => (article.id === articleId ? { ...article, comments: [...(article.comments || []), newComment] } : article)));
        addToast("Comment posted.", 'success');
    }, [currentUser, addToast, setArticles]);

    const handleSaveKpiGroup = useCallback((groupToSave: KpiGroup) => {
        setKpiGroups(prev => {
            const groupExists = prev.some(g => g.id === groupToSave.id);
            if (groupExists) return prev.map(g => g.id === groupToSave.id ? groupToSave : g);
            return [...prev, groupToSave];
        });
        addToast("KPI Group saved.", 'success');
    }, [addToast, setKpiGroups]);
    
    const handleDeleteKpiGroup = useCallback((groupId: string) => {
        setKpiGroups(prev => prev.filter(g => g.id !== groupId));
        const group = kpiGroups.find(g => g.id === groupId);
        if(group) {
            const kpiDefIds = new Set(group.kpis.map(k => k.id));
            setKpiProgress(prev => prev.filter(p => !kpiDefIds.has(p.kpiDefinitionId)));
            setTeamMembers(prev => prev.map(m => m.kpiGroupId === groupId ? {...m, kpiGroupId: null} : m));
        }
        addToast("KPI Group deleted.", 'info');
    }, [kpiGroups, addToast, setKpiGroups, setKpiProgress, setTeamMembers]);

    const handleUpdateKpiProgress = useCallback((progressId: string, actual: number) => {
        setKpiProgress(prevProgress => prevProgress.map(p => p.id === progressId ? { ...p, actual } : p));
        addToast("KPI progress updated.", 'success');
    }, [addToast, setKpiProgress]);

    const handleEndWeek = useCallback(() => {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0];

        const newSnapshots = teamMembers.map(member => ({
            teamMemberId: member.id,
            weekOf: startOfWeek,
            performanceScore: member.performanceScore,
            kpiSnapshots: kpiGroups.find(g => g.id === member.kpiGroupId)?.kpis.map(kpiDef => ({
                name: kpiDef.name, type: kpiDef.type, goal: kpiDef.goal, points: kpiDef.points,
                actual: kpiProgress.find(p => p.teamMemberId === member.id && p.kpiDefinitionId === kpiDef.id)?.actual || 0
            })) || []
        }));
        setWeeklySnapshots(prev => [...prev, ...newSnapshots]);
        
        const rankedMembers = [...teamMembers].sort((a,b) => b.performanceScore - a.performanceScore).map((m,i) => ({...m, rank: i+1}));
        
        setTeamMembers(prev => prev.map(member => {
            const rankedVersion = rankedMembers.find(rm => rm.id === member.id);
            return {
                ...member, previousPerformanceScore: member.performanceScore,
                previousRank: rankedVersion?.rank || member.rank,
                rankHistory: [...(member.rankHistory || []).slice(-9), rankedVersion?.rank || member.rank]
            };
        }));
        
        const resetProgress = kpiProgress.map(p => ({ ...p, actual: 0 }));
        setKpiProgress(resetProgress);
        addToast("Current week archived! A snapshot has been saved.", 'success');
    }, [teamMembers, kpiGroups, kpiProgress, addToast, setWeeklySnapshots, setTeamMembers, setKpiProgress]);

    const handleSaveHistoricalSnapshot = useCallback((memberId: string, weekOf: string, kpis: {kpiDefId: string, actual: number}[]) => {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return;
        const group = kpiGroups.find(g => g.id === member.kpiGroupId);
        if (!group) return;

        const tempKpiProgress: KpiProgress[] = kpis.map(k => ({ id: `temp_${memberId}_${k.kpiDefId}`, teamMemberId: memberId, kpiDefinitionId: k.kpiDefId, actual: k.actual }));
        const historicalScore = calculatePerformanceScore(memberId, kpiGroups, tempKpiProgress, teamMembers);
        
        const newSnapshot: WeeklyPerformanceSnapshot = {
            teamMemberId: memberId, weekOf: weekOf, performanceScore: historicalScore,
            kpiSnapshots: group.kpis.map(kpiDef => {
                const progress = tempKpiProgress.find(p => p.kpiDefinitionId === kpiDef.id);
                return { name: kpiDef.name, type: kpiDef.type, goal: kpiDef.goal, points: kpiDef.points, actual: progress?.actual || 0 };
            })
        };

        setWeeklySnapshots(prev => {
            const existingIndex = prev.findIndex(s => s.teamMemberId === memberId && s.weekOf === weekOf);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newSnapshot;
                return updated;
            }
            return [...prev, newSnapshot];
        });
        addToast("Historical snapshot saved.", 'success');
    }, [teamMembers, kpiGroups, addToast, setWeeklySnapshots]);
  
    const handleGenerateBulkTasks = useCallback((type: 'monthly-reports' | 'kpi-dashboards') => {
        if (!currentUser) return;
        let newTasks: Task[] = [];
        const now = new Date();
        const dueDate = new Date(new Date().setDate(now.getDate() + 5)).toISOString();
        const manager = teamMembers.find(m => m.role.includes('Supervisor') || m.role.includes('Manager')) || currentUser;

        switch (type) {
            case 'monthly-reports':
                newTasks = accounts.map(client => ({
                    id: `task_mr_${client.id}_${Date.now()}`, title: `Send ${now.toLocaleString('default', { month: 'long' })} Performance Closure Email to ${client.name}`,
                    description: `Draft and send an email to ${client.name} summarizing their performance.`, status: TaskStatus.Pending, dueDate, assignedTo: manager?.id || '',
                    clientId: client.id, priority: TaskPriority.Medium, elapsedTimeSeconds: 0, subTasks: [], assignee: manager, client,
                }));
                break;
            case 'kpi-dashboards':
                newTasks = accounts.map(client => ({
                    id: `task_kd_${client.id}_${Date.now()}`, title: `Create KPI Dashboard for ${client.name}`, description: `Design and implement a new KPI dashboard for ${client.name}.`,
                    status: TaskStatus.Pending, dueDate, assignedTo: manager?.id || '', clientId: client.id, priority: TaskPriority.Medium, elapsedTimeSeconds: 0, subTasks: [], assignee: manager, client,
                }));
                break;
        }
        setTasks(prev => [...prev, ...newTasks]);
        addToast(`${newTasks.length} ${type} tasks generated!`, 'success');
    }, [accounts, currentUser, teamMembers, addToast, setTasks]);

    const handleExportAllData = useCallback((fileName?: string) => {
        const allData = {
            tasks, accounts, teamMembers, shoutOuts, departmentalRankings,
            articles, weeklySnapshots, kpiGroups, kpiProgress, allKpis,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(allData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = fileName || `solvo_core_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        if (!fileName) {
            addToast("Data exported successfully!", 'success');
        }
    }, [tasks, accounts, teamMembers, shoutOuts, departmentalRankings, articles, weeklySnapshots, kpiGroups, kpiProgress, allKpis, addToast]);

    const handleImportAllData = useCallback((file: File) => {
        if(!window.confirm("Importing a new file will overwrite all current data. An automatic backup of your current data will be downloaded first. Do you want to continue?")) {
            return;
        }
        
        addToast("Creating a pre-import backup...", 'info');
        handleExportAllData(`solvo_core_auto_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (
                    !data.tasks || !data.accounts || !data.teamMembers || 
                    !data.shoutOuts || !data.departmentalRankings || !data.articles || 
                    !data.weeklySnapshots || !data.kpiGroups || !data.kpiProgress || !data.allKpis
                ) {
                    throw new Error("Invalid or incomplete data file.");
                }
                setTasks(data.tasks);
                setAccounts(data.accounts);
                setTeamMembers(data.teamMembers);
                setShoutOuts(data.shoutOuts);
                setDepartmentalRankings(data.departmentalRankings);
                setArticles(data.articles);
                setWeeklySnapshots(data.weeklySnapshots);
                setKpiGroups(data.kpiGroups);
                setKpiProgress(data.kpiProgress);
                setAllKpis(data.allKpis);
                addToast("All data imported successfully! The application will now reload.", 'success');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error("Error importing data:", error);
                addToast(error instanceof Error ? error.message : "Error parsing JSON file.", 'error');
            }
        };
        reader.readAsText(file);
    }, [addToast, handleExportAllData, setTasks, setAccounts, setTeamMembers, setShoutOuts, setDepartmentalRankings, setArticles, setWeeklySnapshots, setKpiGroups, setKpiProgress, setAllKpis]);

    return {
        // State
        tasks, accounts, teamMembers, shoutOuts, departmentalRankings, articles, weeklySnapshots, kpiGroups, kpiProgress, allKpis,
        currentUser, activeView, isLoadingApp, appReady, notifications,
        isApiKeyInvalid, 
        taskFilter, setTaskFilter, accountFilter, setAccountFilter, 
        preselectedTaskId, setPreselectedTaskId, preselectedAccountId, setPreselectedAccountId, preselectedTeamMemberId, setPreselectedTeamMemberId,
        // Setters
        setActiveView,
        setIsApiKeyInvalid,
        // Handlers
        handleLogin, handleSaveTask, handleDeleteTask, handleSaveAccount, handleDeleteAccount, handleSaveTeamMember, handleDeleteTeamMember, handleTaskStatusChange,
        handleAddShoutOut, handleSaveArticle, handleDeleteArticle, handleRestoreArticleVersion, handleSaveComment, handleSaveKpiGroup, handleDeleteKpiGroup,
        handleUpdateKpiProgress, handleEndWeek, handleSaveHistoricalSnapshot, handleGenerateBulkTasks,
        handleExportAllData, handleImportAllData,
        // Navigation
        navigateToTasks, navigateToAccounts, navigateToTeamMember,
    };
};
