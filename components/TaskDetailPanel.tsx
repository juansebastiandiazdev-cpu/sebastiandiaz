
import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import {
    XIcon, EditIcon, ClockIcon, UserIcon, BriefcaseIcon, AlertTriangleIcon, ChecklistIcon, CheckCircleIcon
} from './Icons';
import { GOALS_CONFIG } from '../constants';

const statusStyles: Record<TaskStatus, { text: string; bg: string; icon: React.ReactNode }> = {
    [TaskStatus.Pending]: { text: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', icon: <ClockIcon className="w-4 h-4"/> },
    [TaskStatus.InProgress]: { text: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', icon: <ClockIcon className="w-4 h-4 animate-spin" /> },
    [TaskStatus.Overdue]: { text: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', icon: <AlertTriangleIcon className="w-4 h-4" /> },
    [TaskStatus.Completed]: { text: 'text-green-500 dark:text-green-400', bg: 'bg-green-500/10', icon: <CheckCircleIcon className="w-4 h-4" /> },
};

const priorityStyles: Record<TaskPriority, { text: string; label: string }> = {
    [TaskPriority.Low]: { text: 'text-slate-500 dark:text-slate-400', label: 'Low Priority' },
    [TaskPriority.Medium]: { text: 'text-yellow-500 dark:text-yellow-400', label: 'Medium Priority' },
    [TaskPriority.High]: { text: 'text-orange-500 dark:text-orange-400', label: 'High Priority' },
    [TaskPriority.Urgent]: { text: 'text-red-500 dark:text-red-400', label: 'Urgent' },
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-center text-sm">
        <div className="w-8 flex-shrink-0 text-core-text-secondary">{icon}</div>
        <div>
            <p className="text-xs text-core-text-secondary uppercase">{label}</p>
            <div className="text-core-text-primary font-semibold">{value}</div>
        </div>
    </div>
);

export const TaskDetailPanel: React.FC<{
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  isFullPage?: boolean;
}> = ({ task, onClose, onEdit, isFullPage = false }) => {
    if (!task) {
        return null;
    }

    const statusStyle = statusStyles[task.status];
    const priorityStyle = priorityStyles[task.priority];
    const goal = task.weeklyGoalCategory ? GOALS_CONFIG.find(g => g.id === task.weeklyGoalCategory) : null;
    const completedSubTasks = task.subTasks?.filter(st => st.completed).length || 0;
    const totalSubTasks = task.subTasks?.length || 0;
    
    const containerClasses = isFullPage
       ? `flex flex-col h-full bg-core-bg`
       : `fixed top-0 right-0 h-full w-[640px] bg-core-bg/95 backdrop-blur-lg border-l border-core-border shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${task ? 'translate-x-0' : 'translate-x-full'}`;

    return (
        <div className={containerClasses}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-5 border-b border-core-border flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-core-text-primary pr-8">{task.title}</h2>
                        <button onClick={onClose} className="text-core-text-secondary hover:text-core-text-primary">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                     <div className="mt-3 flex items-center space-x-4">
                        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.icon}
                            <span className="ml-1.5">{task.status}</span>
                        </span>
                        <span className={`flex items-center text-xs font-semibold ${priorityStyle.text}`}>
                            {priorityStyle.label}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-core-accent uppercase tracking-wider">Description</h3>
                        <p className="text-sm text-core-text-secondary leading-relaxed">{task.description || 'No description provided.'}</p>
                    </div>
                    
                    {/* Details */}
                    <div className="bg-core-bg-soft p-4 rounded-lg border border-core-border grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem icon={<ClockIcon className="w-5 h-5"/>} label="Due Date" value={new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                        <DetailItem icon={<UserIcon className="w-5 h-5"/>} label="Assignee" value={task.assignee?.name || 'Unassigned'} />
                        {task.client && (
                            <DetailItem icon={<BriefcaseIcon className="w-5 h-5"/>} label="Client" value={task.client.name} />
                        )}
                        {goal && (
                            <DetailItem icon={<goal.icon className="w-5 h-5" style={{color: goal.color}}/>} label="Goal Category" value={<span style={{color: goal.color}}>{goal.label}</span>} />
                        )}
                    </div>
                    
                    {/* Sub-tasks */}
                    {task.subTasks && totalSubTasks > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-core-accent uppercase tracking-wider">Checklist ({completedSubTasks}/{totalSubTasks})</h3>
                            <div className="w-full bg-core-border rounded-full h-2">
                                <div className="bg-core-accent h-2 rounded-full" style={{ width: `${(completedSubTasks/totalSubTasks) * 100}%`}}></div>
                            </div>
                            <div className="space-y-2 pt-2">
                                {task.subTasks.map(subtask => (
                                    <div key={subtask.id} className="flex items-center gap-3 bg-core-bg-soft p-2 rounded-md">
                                        <input type="checkbox" readOnly checked={subtask.completed} className="h-4 w-4 rounded border-core-border text-core-accent bg-core-bg focus:ring-0 cursor-not-allowed"/>
                                        <span className={`flex-grow text-sm ${subtask.completed ? 'text-core-text-secondary line-through' : 'text-core-text-primary'}`}>{subtask.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 mt-auto border-t border-core-border flex-shrink-0 bg-core-bg/70 backdrop-blur-sm">
                    <button onClick={() => onEdit(task)} className="w-full flex items-center justify-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2.5 px-4 rounded-md transition-colors">
                        <EditIcon className="w-5 h-5 mr-2" />
                        Edit Task
                    </button>
                </div>
            </div>
        </div>
    );
};
