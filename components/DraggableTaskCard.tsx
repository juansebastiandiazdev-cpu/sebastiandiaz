import React from 'react';
import { Task, TaskPriority } from '../types';
import { GripVerticalIcon } from './Icons';
import { GOALS_CONFIG } from '../constants';

interface DraggableTaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
    onClick: () => void;
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, onDragStart, onClick }) => {
    const goal = GOALS_CONFIG.find(g => g.id === task.weeklyGoalCategory);
    const color = task.taskType === 'event' 
        ? GOALS_CONFIG.find(g => g.id === 'event')?.color || '#64748b' 
        : goal?.color || '#6b7280';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={onClick}
            className="bg-core-bg-soft p-2.5 rounded-lg border border-core-border cursor-grab active:cursor-grabbing flex items-center gap-3 group"
        >
            <GripVerticalIcon className="w-5 h-5 text-core-text-secondary/50 group-hover:text-core-text-secondary flex-shrink-0" />
            <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm text-core-text-primary truncate font-medium" title={task.title}>{task.title}</p>
                <p className="text-xs text-core-text-secondary truncate" title={task.client?.name}>{task.client?.name || 'Internal'}</p>
            </div>
        </div>
    );
};
