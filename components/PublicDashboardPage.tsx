import React from 'react';
import { useDataContext } from '../contexts/DataContext';
import { PublicDashboard } from './PublicDashboard';
import { LoadingOverlay } from './LoadingOverlay';

export const PublicDashboardPage: React.FC<{ clientId: string | null }> = ({ clientId }) => {
    const { accounts, teamMembers, kpiGroups, kpiProgress, isLoadingApp } = useDataContext();

    if (isLoadingApp) {
        return <LoadingOverlay />;
    }

    const client = accounts.find(c => c.id === clientId);

    return <PublicDashboard client={client || null} teamMembers={teamMembers} kpiGroups={kpiGroups} kpiProgress={kpiProgress} />;
};
