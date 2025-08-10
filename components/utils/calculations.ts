
import { TeamMember, KpiGroup, KpiProgress } from '../../types';

export const calculatePerformanceScore = (
    memberId: string, 
    kpiGroups: KpiGroup[], 
    kpiProgress: KpiProgress[], 
    teamMembers: TeamMember[]
): number => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member || !member.kpiGroupId) return 0;

    const group = kpiGroups.find(g => g.id === member.kpiGroupId);
    if (!group || group.kpis.length === 0) return 0;

    const totalPossiblePoints = group.kpis.reduce((sum, kpi) => sum + kpi.points, 0);
    if (totalPossiblePoints === 0) return 0;

    const pointsEarned = group.kpis.reduce((sum, kpiDef) => {
        const progress = kpiProgress.find(p => p.teamMemberId === memberId && p.kpiDefinitionId === kpiDef.id);
        const actual = progress ? progress.actual : 0;
        const goal = kpiDef.goal;

        if (goal === 0) {
            return actual === 0 ? sum + kpiDef.points : sum;
        }
        
        const lowerIsBetter = kpiDef.name.toLowerCase().includes('cancel');
        let achievementRatio = 0;

        if (lowerIsBetter) {
            achievementRatio = Math.max(0, 1 - (actual / goal));
        } else {
            achievementRatio = Math.min(actual / goal, 1);
        }
        
        return sum + (achievementRatio * kpiDef.points);
    }, 0);

    return Math.round((pointsEarned / totalPossiblePoints) * 100);
};
