

import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { 
    ClockIcon, ChecklistIcon
} from './Icons';
import { GOALS_CONFIG } from '../constants';
import { formatShortDate } from './utils/time';

interface TaskCardProps {
    task: Task;
    onSelect: () => void;
    onDragStart: (e: React.DragEvent) => void;
    navigateToClient: (filter: any, clientId: string) => void;
    navigateToTeamMember: (memberId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, onDragStart, navigateToClient, navigateToTeamMember }) => {
    const goal = task.weeklyGoalCategory ? GOALS_CONFIG.find(g => g.id === task.weeklyGoalCategory) : null;
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Completed;

    const priorityColors: Record<TaskPriority, string> = {
        [TaskPriority.Urgent]: "border-red-500",
        [TaskPriority.High]: "border-orange-500",
        [TaskPriority.Medium]: "border-yellow-500",
        [TaskPriority.Low]: "border-slate-500",
    }

    return (
        <div 
            draggable
            onDragStart={onDragStart}
            onClick={onSelect}
            className={`bg-core-bg-soft rounded-lg p-3.5 flex flex-col space-y-3 border border-core-border hover:border-core-accent/50 transition-all duration-200 group cursor-pointer active:cursor-grabbing border-l-4 ${priorityColors[task.priority]}`}
        >
            <div className='flex items-start gap-3'>
                <h4 className="font-bold text-core-text-primary leading-snug flex-1">{task.title}</h4>
            </div>
            
            {goal && (
                <div className="flex items-center text-xs" style={{color: goal.color}}>
                    <goal.icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span className="font-semibold">{goal.label}</span>
                </div>
            )}
            
            <p className="text-sm text-core-text-secondary cursor-pointer hover:underline" onClick={(e) => {
                e.stopPropagation();
                if (task.client?.id) navigateToClient({}, task.client.id);
            }}>
                {task.client?.name || 'Internal'}
            </p>

            <div className="border-t border-core-border pt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {task.assignee && (
                        <div onClick={(e) => { e.stopPropagation(); navigateToTeamMember(task.assignee!.id)}} className="w-6 h-6 rounded-full bg-core-accent flex items-center justify-center text-core-accent-foreground text-xs font-bold cursor-pointer hover:ring-2 hover:ring-white" title={task.assignee.name}>
                            {task.assignee.avatarInitials}
                        </div>
                    )}
                     {task.subTasks && task.subTasks.length > 0 && (
                        <div className="flex items-center text-xs text-core-text-secondary" title={`${task.subTasks.filter(st => st.completed).length} of ${task.subTasks.length} sub-tasks completed`}>
                            <ChecklistIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span>
                                {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`flex items-center text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-core-text-secondary'}`}>
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>{formatShortDate(task.dueDate)}</span>
                </div>
            </div>
        </div>
    );
};