

import React, { useState, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, AccountFilter, TaskFilter } from '../types';
import { ArrowDownIcon, ChecklistIcon } from './Icons';
import { formatISODate } from './utils/time';

type SortKey = 'title' | 'assignee' | 'client' | 'dueDate' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

interface TaskListViewProps {
    tasks: Task[];
    onSelectTask: (task: Task) => void;
    navigateToClient: (filter: Partial<AccountFilter>, clientId?: string) => void;
    navigateToTeamMember: (memberId: string) => void;
}

const priorityOrder: Record<TaskPriority, number> = {
  [TaskPriority.Urgent]: 4,
  [TaskPriority.High]: 3,
  [TaskPriority.Medium]: 2,
  [TaskPriority.Low]: 1,
};

const statusOrder: Record<TaskStatus, number> = {
  [TaskStatus.Overdue]: 4,
  [TaskStatus.Pending]: 3,
  [TaskStatus.InProgress]: 2,
  [TaskStatus.Completed]: 1,
};

const statusColors: Record<TaskStatus, string> = {
    [TaskStatus.Pending]: 'text-orange-400 bg-orange-500/10',
    [TaskStatus.InProgress]: 'text-blue-400 bg-blue-500/10',
    [TaskStatus.Overdue]: 'text-red-400 bg-red-500/10',
    [TaskStatus.Completed]: 'text-green-400 bg-green-500/10',
};

const priorityColors: Record<TaskPriority, string> = {
    [TaskPriority.Urgent]: 'text-red-400',
    [TaskPriority.High]: 'text-orange-400',
    [TaskPriority.Medium]: 'text-yellow-400',
    [TaskPriority.Low]: 'text-slate-400',
};

const SortableHeader: React.FC<{
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}> = ({ label, sortKey, currentSort, direction, onSort }) => (
    <th onClick={() => onSort(sortKey)} className="px-4 py-3 text-left text-xs font-medium text-core-text-secondary uppercase tracking-wider cursor-pointer hover:bg-core-bg-soft">
        <div className="flex items-center">
            {label}
            {currentSort === sortKey && <ArrowDownIcon className={`w-4 h-4 ml-2 transition-transform ${direction === 'asc' ? 'rotate-180' : ''}`} />}
        </div>
    </th>
);

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onSelectTask, navigateToClient, navigateToTeamMember }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'dueDate', direction: 'asc' });

    const sortedTasks = useMemo(() => {
        let sortableItems = [...tasks];
        sortableItems.sort((a, b) => {
            let comparison = 0;

            switch (sortConfig.key) {
                case 'dueDate':
                    comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    break;
                case 'priority':
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'status':
                    comparison = statusOrder[a.status] - statusOrder[b.status];
                    break;
                case 'assignee':
                    comparison = (a.assignee?.name || '').localeCompare(b.assignee?.name || '');
                    break;
                case 'client':
                    comparison = (a.client?.name || '').localeCompare(b.client?.name || '');
                    break;
                default:
                    comparison = String(a.title).localeCompare(String(b.title));
                    break;
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
        return sortableItems;
    }, [tasks, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="bg-core-bg-soft rounded-xl border border-core-border overflow-x-auto">
            <table className="min-w-full divide-y divide-core-border">
                <thead className="bg-core-bg">
                    <tr>
                        <SortableHeader label="Task" sortKey="title" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={requestSort} />
                        <SortableHeader label="Assignee" sortKey="assignee" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={requestSort} />
                        <SortableHeader label="Client" sortKey="client" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={requestSort} />
                        <SortableHeader label="Due Date" sortKey="dueDate" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={requestSort} />
                        <SortableHeader label="Priority" sortKey="priority" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={requestSort} />
                        <SortableHeader label="Status" sortKey="status" currentSort={sortConfig.key} direction={sortConfig.direction} onSort={requestSort} />
                    </tr>
                </thead>
                <tbody className="bg-core-bg-soft divide-y divide-core-border">
                    {sortedTasks.map(task => (
                        <tr key={task.id} className="hover:bg-core-bg-soft/50 cursor-pointer" onClick={() => onSelectTask(task)}>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <p className="text-sm font-medium text-core-text-primary">{task.title}</p>
                                {task.subTasks && task.subTasks.length > 0 ? (
                                    <p className="text-xs text-core-text-secondary flex items-center">
                                        <ChecklistIcon className="w-3 h-3 mr-1" />
                                        {task.subTasks.filter(st => st.completed).length} of {task.subTasks.length} done
                                    </p>
                                ) : (
                                    <p className="text-xs text-core-text-secondary truncate max-w-xs">{task.description}</p>
                                )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-core-text-secondary">
                                <span className="hover:underline" onClick={(e) => { e.stopPropagation(); task.assignee && navigateToTeamMember(task.assignee.id)}}>{task.assignee?.name || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-core-text-secondary">
                                <span className="hover:underline" onClick={(e) => { e.stopPropagation(); task.client && navigateToClient({}, task.client.id)}}>{task.client?.name || 'Internal'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-core-text-secondary">{formatISODate(task.dueDate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`text-sm font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[task.status]}`}>
                                    {task.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};