import React, { useMemo } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { DonutChart } from './DonutChart';
import { GOALS_CONFIG } from '../constants';
import { AlertTriangleIcon } from './Icons';

interface WeeklyFocusWidgetProps {
    weeklyTasks: Task[];
}

export const WeeklyFocusWidget: React.FC<WeeklyFocusWidgetProps> = ({ weeklyTasks }) => {
    
    const { totalTasks, completedTasks, tasksByGoal, highPriorityUnscheduled } = useMemo(() => {
        const actionableTasks = weeklyTasks.filter(t => t.taskType !== 'event');
        const total = actionableTasks.length;
        const completed = actionableTasks.filter(t => t.status === TaskStatus.Completed).length;
        const unscheduled = actionableTasks.filter(t => t.status !== TaskStatus.Completed);

        const highPriority = unscheduled
            .filter(t => t.priority === TaskPriority.High || t.priority === TaskPriority.Urgent)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 3);

        const byGoal: { [key: string]: number } = {};
        GOALS_CONFIG.forEach(g => {
            byGoal[g.id] = weeklyTasks.filter(t => t.weeklyGoalCategory === g.id).length;
        });

        return {
            totalTasks: total,
            completedTasks: completed,
            tasksByGoal: byGoal,
            highPriorityUnscheduled: highPriority
        };
    }, [weeklyTasks]);

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const chartData = [
        { value: completedTasks, color: 'var(--color-core-accent)' },
    ];

    return (
        <div className="bg-core-bg-soft p-5 rounded-xl border border-core-border space-y-5">
            <h3 className="text-lg font-bold text-core-text-primary">Weekly Focus</h3>
            
            <div className="flex items-center gap-4">
                <DonutChart 
                    data={chartData} 
                    size={80} 
                    strokeWidth={10} 
                    totalValue={totalTasks > 0 ? totalTasks : 1}
                    centerText={
                        <div className="text-center">
                            <p className="text-2xl font-bold text-core-text-primary">{Math.round(completionPercentage)}%</p>
                        </div>
                    }
                />
                <div>
                    <p className="text-sm text-core-text-secondary">Overall Progress</p>
                    <p className="text-lg font-semibold text-core-text-primary">{completedTasks} of {totalTasks} tasks completed</p>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-core-text-secondary mb-2">Goal Breakdown</h4>
                <div className="space-y-2">
                    {GOALS_CONFIG.filter(g => tasksByGoal[g.id] > 0).map(goal => (
                        <div key={goal.id} className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.color }}></div>
                             <div className="flex-1">
                                <p className="text-sm font-medium text-core-text-primary">{goal.label}</p>
                            </div>
                            <p className="text-sm font-semibold text-core-text-secondary">{tasksByGoal[goal.id]}</p>
                        </div>
                    ))}
                </div>
            </div>

            {highPriorityUnscheduled.length > 0 && (
                <div className="border-t border-core-border pt-4">
                    <h4 className="text-sm font-semibold text-core-text-secondary mb-2 flex items-center gap-2">
                        <AlertTriangleIcon className="w-5 h-5 text-red-400" />
                        Priority Tasks To Schedule
                    </h4>
                    <div className="space-y-2">
                        {highPriorityUnscheduled.map(task => (
                            <div key={task.id} className="bg-core-bg p-2 rounded-md text-sm text-core-text-primary truncate" title={task.title}>
                                {task.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
