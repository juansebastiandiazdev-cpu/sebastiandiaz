import React, { useState, useMemo, useEffect } from 'react';
import { 
    CalendarDaysIcon,
    LoaderIcon,
    SparklesIcon
} from './Icons';
import { Task, TaskStatus, TaskFilter, TeamMember, ScheduledTask, ApiScheduledTaskInfo, ScheduleResponse, TaskPriority } from '../types';
import { AIWeeklyBriefing } from './AIWeeklyBriefing';
import { ScheduleView } from './ScheduleView';
import { TaskDetailPanel } from './TaskDetailPanel';
import { DraggableTaskCard } from './DraggableTaskCard';
import { WeeklyFocusWidget } from './WeeklyFocusWidget';
import { api } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { useToasts } from '../hooks/useToasts';


interface MyWeekProps {
    user: TeamMember;
    navigateToTasks: (filter: Partial<TaskFilter>) => void;
    tasks: Task[];
    onOpenModal: (type: 'task', data: Task | null) => void;
}


export const MyWeek: React.FC<MyWeekProps> = ({ user, navigateToTasks, tasks, onOpenModal }) => {
    const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
    const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [draggedTaskInfo, setDraggedTaskInfo] = useState<{ id: string, origin: 'scheduled' | 'unscheduled' } | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const { addToast } = useToasts();
    
    const myWeeklyTasks = useMemo(() => {
        return tasks.filter(t => (t.weeklyGoalCategory || t.taskType === 'event') && t.assignedTo === user.id);
    }, [tasks, user.id]);

    useEffect(() => {
        if (initialLoad) {
            setUnscheduledTasks(myWeeklyTasks.filter(t => t.status !== TaskStatus.Completed));
            setInitialLoad(false);
        }
    }, [myWeeklyTasks, initialLoad]);
    
    const handleDragStart = (e: React.DragEvent, taskId: string, origin: 'scheduled' | 'unscheduled') => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
        setDraggedTaskInfo({ id: taskId, origin });
    };

    const handleDrop = (e: React.DragEvent, dayIndex: number, hour: number, minutes: number) => {
        e.preventDefault();
        if (!draggedTaskInfo) return;

        const taskId = e.dataTransfer.getData('text/plain');
        const startMinutes = hour * 60 + minutes;

        if (draggedTaskInfo.origin === 'unscheduled') {
            const taskToSchedule = unscheduledTasks.find(t => t.id === taskId);
            if (!taskToSchedule) return;

            const newScheduledTask: ScheduledTask = {
                ...taskToSchedule,
                day: dayIndex,
                startMinutes: startMinutes,
                durationMinutes: 60 // default duration
            };

            setScheduledTasks(prev => [...prev, newScheduledTask]);
            setUnscheduledTasks(prev => prev.filter(t => t.id !== taskId));
        } else { // 'scheduled'
            setScheduledTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    return { ...t, day: dayIndex, startMinutes };
                }
                return t;
            }));
        }
        setDraggedTaskInfo(null);
    };
    
    const handleDropOnUnscheduled = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedTaskInfo || draggedTaskInfo.origin !== 'scheduled') return;

        const taskId = e.dataTransfer.getData('text/plain');
        const taskToUnschedule = scheduledTasks.find(t => t.id === taskId);
        if (!taskToUnschedule) return;

        const { day, startMinutes, durationMinutes, ...rest } = taskToUnschedule;
        setUnscheduledTasks(prev => [...prev, rest]);
        setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
        setDraggedTaskInfo(null);
    };

    const handleQuickAddTask = (day: number, startMinutes: number) => {
        console.log(`Quick add for day ${day} at ${startMinutes} minutes`);
        // In a real app, this would open the TaskModal with pre-filled date/time
        // For now, let's create a placeholder event
        const newEvent: ScheduledTask = {
            id: `event-${Date.now()}`,
            title: 'New Event',
            description: '',
            status: TaskStatus.Completed,
            dueDate: new Date().toISOString(),
            assignedTo: user.id,
            clientId: null,
            priority: TaskPriority.Medium,
            elapsedTimeSeconds: 0,
            taskType: 'event',
            weeklyGoalCategory: 'event',
            day,
            startMinutes,
            durationMinutes: 60,
        };
        setScheduledTasks(prev => [...prev, newEvent]);
        addToast("Event added to schedule!", "success");
    };

    const handleAiReschedule = async () => {
        if (unscheduledTasks.length === 0) {
            addToast("No tasks to schedule!", "info");
            return;
        }

        setIsScheduling(true);
        try {
            const tasksToSchedule = unscheduledTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority }));
            const existingSchedule = scheduledTasks;
            
            const response = await api.generateWeeklySchedule(tasksToSchedule, existingSchedule);

            const newlyScheduled: ScheduledTask[] = [];
            const stillUnscheduled: Task[] = [];
            const scheduledIds = new Set(response.scheduledTasks.map(st => st.taskId));

            response.scheduledTasks.forEach(apiTask => {
                const originalTask = unscheduledTasks.find(t => t.id === apiTask.taskId);
                if(originalTask) {
                    newlyScheduled.push({
                        ...originalTask,
                        day: apiTask.dayIndex,
                        startMinutes: apiTask.startMinutes,
                        durationMinutes: apiTask.durationMinutes
                    });
                }
            });

            unscheduledTasks.forEach(task => {
                if(!scheduledIds.has(task.id)) {
                    stillUnscheduled.push(task);
                }
            });

            setScheduledTasks(prev => [...prev, ...newlyScheduled]);
            setUnscheduledTasks(stillUnscheduled);
            addToast(`${newlyScheduled.length} tasks scheduled by AI.`, 'success');

        } catch (error) {
            addToast(error instanceof Error ? error.message : 'AI scheduling failed.', 'error');
        } finally {
            setIsScheduling(false);
        }
    };
    
    if (selectedTask) {
        return (
            <TaskDetailPanel
                isFullPage={true}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onEdit={(task) => onOpenModal('task', task)}
            />
        );
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <PageHeader 
                title="My Week Mission Control"
                description="Your dynamic planner to conquer the week's goals."
                icon={<CalendarDaysIcon className="w-6 h-6"/>}
            />

            <div className="flex-grow mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                {/* Left Panel */}
                <aside className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto">
                    <WeeklyFocusWidget weeklyTasks={myWeeklyTasks} />
                    
                    <div className="flex flex-col flex-grow bg-core-bg-soft p-4 rounded-xl border border-core-border">
                         <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-core-text-primary">Unscheduled</h3>
                            <button onClick={handleAiReschedule} disabled={isScheduling} className="flex items-center gap-2 bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                                {isScheduling ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                Auto-Schedule
                            </button>
                         </div>
                        <div 
                            className="flex-grow space-y-2 overflow-y-auto -mr-2 pr-2"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDropOnUnscheduled}
                        >
                            {unscheduledTasks.map(task => (
                                <DraggableTaskCard key={task.id} task={task} onDragStart={(e) => handleDragStart(e, task.id, 'unscheduled')} onClick={() => setSelectedTask(task)} />
                            ))}
                            {unscheduledTasks.length === 0 && <p className="text-center text-sm text-core-text-secondary pt-10">All tasks are scheduled!</p>}
                        </div>
                    </div>
                </aside>

                {/* Right Panel: Schedule */}
                <main className="lg:col-span-3 flex flex-col overflow-hidden">
                    <ScheduleView 
                        scheduledTasks={scheduledTasks}
                        onDragStart={handleDragStart}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onTaskClick={setSelectedTask}
                        onQuickAddTask={handleQuickAddTask}
                    />
                </main>
            </div>
        </div>
    );
};