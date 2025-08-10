
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority, TaskFilter, TeamMember, Client, AccountFilter } from '../types';
import { 
    PlusIcon,
    KanbanSquareIcon, ListViewIcon,
    SearchIcon, RocketIcon, ListIcon
} from './Icons';
import { TaskDetailPanel } from './TaskDetailPanel';
import { TaskCard } from './TaskCard';
import { TaskListView } from './TaskListView';
import { AIProjectPlannerModal } from './AIProjectPlannerModal';
import { api } from '../services/api';
import { PageHeader } from './ui/PageHeader';

const KANBAN_COLUMNS: TaskStatus[] = [TaskStatus.Pending, TaskStatus.InProgress, TaskStatus.Overdue, TaskStatus.Completed];
const KANBAN_COLUMN_STYLES: Record<TaskStatus, { title: string, headerColor: string }> = {
    [TaskStatus.Pending]: { title: 'Pending', headerColor: 'bg-orange-500/10 text-orange-400' },
    [TaskStatus.InProgress]: { title: 'In Progress', headerColor: 'bg-blue-500/10 text-blue-400' },
    [TaskStatus.Overdue]: { title: 'Overdue', headerColor: 'bg-red-500/10 text-red-400' },
    [TaskStatus.Completed]: { title: 'Completed', headerColor: 'bg-green-500/10 text-green-400' },
}

interface TaskBoardProps {
    user: TeamMember;
    initialFilter: TaskFilter | null;
    clearFilter: () => void;
    tasks: Task[];
    clients: Client[];
    teamMembers: TeamMember[];
    onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onGenerateBulkTasks: (type: 'monthly-reports' | 'kpi-dashboards') => void;
    navigateToClient: (filter: Partial<AccountFilter>, clientId?: string) => void;
    navigateToTeamMember: (memberId: string) => void;
    preselectedTaskId: string | null;
    clearPreselectedTask: () => void;
    onOpenModal: (type: 'task', data: Task | null) => void;
    onSaveTask: (task: Task) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = (props) => {
    const { 
      user, initialFilter, clearFilter, tasks, clients, teamMembers, onTaskStatusChange,
      onGenerateBulkTasks, navigateToClient, navigateToTeamMember, preselectedTaskId, 
      clearPreselectedTask, onOpenModal, onSaveTask 
    } = props;
    
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isAIGenModalOpen, setIsAIGenModalOpen] = useState(false);
    const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);

    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<TaskFilter>(initialFilter || {});

    useEffect(() => {
        if (preselectedTaskId) {
          const taskToSelect = tasks.find(t => t.id === preselectedTaskId);
          if (taskToSelect) setSelectedTask(taskToSelect);
          clearPreselectedTask();
        }
    }, [preselectedTaskId, tasks, clearPreselectedTask]);

    useEffect(() => {
        if (initialFilter) {
            setFilters(initialFilter);
            clearFilter();
        }
    }, [initialFilter, clearFilter]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const searchMatch = searchTerm ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            const statusMatch = filters.status ? (filters.status === 'Overdue' ? (new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Completed) : task.status === filters.status) : true;
            const priorityMatch = filters.priority ? task.priority === filters.priority : true;
            const assigneeMatch = filters.assigneeId ? task.assignedTo === filters.assigneeId : true;

            return searchMatch && statusMatch && priorityMatch && assigneeMatch;
        });
    }, [tasks, searchTerm, filters]);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
        const taskId = e.dataTransfer.getData("taskId");
        onTaskStatusChange(taskId, newStatus);
    };

    const handleSavePlannerTasks = (newTasks: Task[]) => {
      newTasks.forEach(onSaveTask);
    }
    
    const renderKanbanView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map(status => (
                <div key={status} 
                    className={`p-1 rounded-lg bg-core-bg`}
                    onDrop={(e) => handleDrop(e, status)} 
                    onDragOver={(e) => e.preventDefault()}
                >
                    <h3 className={`font-semibold text-lg p-3 rounded-t-lg ${KANBAN_COLUMN_STYLES[status].headerColor}`}>
                        {KANBAN_COLUMN_STYLES[status].title}
                        <span className="ml-2 text-sm font-normal text-core-text-secondary">{filteredTasks.filter(t => t.status === status).length}</span>
                    </h3>
                    <div className="p-2 space-y-3 h-[calc(100vh-320px)] overflow-y-auto">
                        {filteredTasks.filter(t => t.status === status).map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                onSelect={() => setSelectedTask(task)} 
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                navigateToClient={navigateToClient}
                                navigateToTeamMember={navigateToTeamMember}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 h-full flex flex-col">
            <PageHeader
                title="Task Board"
                description="Manage your team's workload with a Kanban or List view."
                icon={<ListIcon className="w-6 h-6"/>}
                actions={
                    <>
                        <button onClick={() => setIsPlannerModalOpen(true)} className="flex items-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-core-accent/20">
                            <RocketIcon className="w-5 h-5 mr-2"/> AI Project Planner
                        </button>
                        <button onClick={() => onOpenModal('task', null)} className="flex items-center bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-core-accent/20">
                            <PlusIcon className="w-5 h-5 mr-2"/> Add Task
                        </button>
                    </>
                }
            />

            {/* Controls */}
            <div className="flex items-center justify-between my-6 gap-4 bg-core-bg-soft p-3 rounded-xl border border-core-border flex-shrink-0">
                <div className="relative flex-grow">
                     <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-core-text-secondary" />
                     <input type="search" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-core-bg border border-core-border rounded-lg py-2 pl-10 pr-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent"/>
                </div>
                 <div className="flex items-center gap-2">
                    {/* View switcher */}
                     <div className="flex bg-core-bg rounded-lg p-1 border border-core-border">
                        <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md ${viewMode === 'kanban' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-border'}`} title="Kanban View"><KanbanSquareIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-core-accent text-white' : 'text-core-text-secondary hover:bg-core-border'}`} title="List View"><ListViewIcon className="w-5 h-5"/></button>
                    </div>
                 </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow overflow-y-auto -mr-6 -ml-6 px-6">
              {viewMode === 'kanban' && renderKanbanView()}
              {viewMode === 'list' && (
                  <TaskListView 
                      tasks={filteredTasks} 
                      onSelectTask={setSelectedTask} 
                      navigateToClient={navigateToClient} 
                      navigateToTeamMember={navigateToTeamMember}
                  />
              )}
            </div>

            {selectedTask && (
                <TaskDetailPanel
                  isFullPage={false} // It's a panel, not a full page view here.
                  task={selectedTask}
                  onClose={() => setSelectedTask(null)}
                  onEdit={(task) => onOpenModal('task', task)}
                />
            )}
             <AIProjectPlannerModal 
                isOpen={isPlannerModalOpen}
                onClose={() => setIsPlannerModalOpen(false)}
                onSaveTasks={handleSavePlannerTasks}
                currentUser={user}
                clients={clients}
                teamMembers={teamMembers}
            />
        </div>
    );
};