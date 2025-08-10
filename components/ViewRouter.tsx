import React from 'react';
import { Dashboard } from './Dashboard';
import { AccountManagement } from './ClientManagement';
import { TeamManagement } from './TeamManagement';
import { TaskBoard } from './TaskBoard';
import { Leaderboard } from './Leaderboard';
import { MyWeek } from './MyWeek';
import { KnowledgeCenter } from './KnowledgeCenter';
import { PerformanceHub } from './PerformanceHub';
import { Reports } from './Reports';
import { DataManagement } from './DataManagement';
import { useDataContext } from '../contexts/DataContext';
import { View, AIInsight, Client, Task, TeamMember } from '../types';

interface ViewRouterProps {
    activeView: View;
    aiInsights: AIInsight[];
    handleOpenModal: (type: 'task' | 'account' | 'team', data: Task | Client | TeamMember | null) => void;
    setActiveView: (view: View) => void;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({ activeView, aiInsights, handleOpenModal, setActiveView }) => {
    const context = useDataContext();
    const { currentUser, tasks, accounts, teamMembers, isLoadingApp } = context;

    if (!currentUser) return null;

    switch (activeView) {
        case 'dashboard':
            return (
                <Dashboard
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
                />
            );
        case 'accounts':
            return (
                <AccountManagement
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
                />
            );
        case 'team':
            return (
                <TeamManagement
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
                />
            );
        case 'tasks':
            return (
                <TaskBoard
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
                />
            );
        case 'leaderboard':
            return (
                <Leaderboard
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
                />
            );
        case 'my-week':
            return (
                <MyWeek
                    user={currentUser}
                    navigateToTasks={context.navigateToTasks}
                    tasks={tasks}
                    onOpenModal={handleOpenModal}
                />
            );
        case 'knowledge-center':
            return (
                <KnowledgeCenter
                    articles={context.articles}
                    allArticles={context.articles}
                    currentUser={currentUser}
                    onSaveArticle={context.handleSaveArticle}
                    onDeleteArticle={context.handleDeleteArticle}
                    onSaveComment={context.handleSaveComment}
                    onRestoreVersion={context.handleRestoreArticleVersion}
                />
            );
        case 'performance':
            return (
                <PerformanceHub
                    teamMembers={teamMembers}
                    weeklySnapshots={context.weeklySnapshots}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                    onEndWeek={context.handleEndWeek}
                    onSaveKpiGroup={context.handleSaveKpiGroup}
                    onDeleteKpiGroup={context.handleDeleteKpiGroup}
                    navigateToTeamMember={context.navigateToTeamMember}
                />
            );
        case 'reports':
            return (
                <Reports
                    clients={accounts}
                    tasks={tasks}
                    teamMembers={teamMembers}
                    weeklySnapshots={context.weeklySnapshots}
                    kpiGroups={context.kpiGroups}
                    kpiProgress={context.kpiProgress}
                />
            );
        case 'datamanagement':
            return <DataManagement />;
        default:
            return <div>Not implemented</div>;
    }
};

