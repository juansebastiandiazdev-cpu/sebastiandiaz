

import React, { useState, useMemo, useEffect } from 'react';
import { 
    AlertTriangleIcon, ArrowRightIcon,
    LayoutGridIcon, CalendarDaysIcon, CheckCircleIcon, BriefcaseIcon,
    SparklesIcon, LoaderIcon
} from './Icons';
import { DonutChart } from './DonutChart';
import { Task, TaskStatus, TaskFilter, TaskPriority, TeamMember, ScheduledTask, ApiScheduledTaskInfo, ScheduleResponse } from '../types';
import { GOALS_CONFIG } from '../constants';
import { AIWeeklyBriefing } from './AIWeeklyBriefing';
import { ScheduleView } from './ScheduleView';
import { TaskDetailPanel } from './TaskDetailPanel';
import { api } from '../services/api';

// Local types and constants for this component
interface MyWeekProps {
    user: TeamMember;
    navigateToTasks: (filter: Partial<TaskFilter>) => void;
    tasks: Task[];
    onOpenModal: (type: 'task', data: Task | null) => void;
}

// --- Goal Overview Components ---

const GoalCard: React.FC<{
    goal: typeof GOALS_CONFIG[0],
    tasks: Task[],
    onViewTasks: () => void
}> = ({ goal, tasks, onViewTasks }) => {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const chartData = [
        { value: completedTasks, color: goal.color },
        { value: totalTasks - completedTasks, color: '#374151' } // bg-gray-700
    ];

    const pendingTasks = tasks.filter(t => t.status !== TaskStatus.Completed).slice(0, 3);
    
    return (
        <div className={`bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col h-full`}>
            <div className="flex items-start gap-4 mb-4">
                <DonutChart data={chartData} size={60} strokeWidth={8} centerText={
                    <span className="text-lg font-bold" style={{color: goal.color}}>{Math.round(progress)}%</span>
                }/>
                <div>
                    <h3 className="text-lg font-semibold text-white">{goal.label}</h3>
                    <p className="text-sm text-gray-400">{completedTasks} of {totalTasks} tasks completed</p>
                </div>
            </div>
            
            <div className="space-y-2 flex-grow mb-4 min-h-[100px]">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Next Up:</h4>
                {pendingTasks.length > 0 ? (
                    pendingTasks.map(task => (
                        <div key={task.id} className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded-md truncate" title={task.title}>
                           {task.title}
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-gray-500 italic text-center flex items-center justify-center h-full">All tasks done! 🎉</div>
                )}
            </div>

            <button onClick={onViewTasks} className="mt-auto w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-md transition-colors">
                View All {goal.label} Tasks
                <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
        </div>
    );
};

const GoalOverview: React.FC<{
    navigateToTasks: (filter: Partial<TaskFilter>) => void;
    weeklyTasks: Task[];
}> = ({ navigateToTasks, weeklyTasks }) => {

    const tasksByGoal = useMemo(() => {
        const grouped: { [key: string]: Task[] } = {};
        for(const goal of GOALS_CONFIG) {
            grouped[goal.id] = weeklyTasks.filter(t => t.weeklyGoalCategory === goal.id);
        }
        return grouped;
    }, [weeklyTasks]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GOALS_CONFIG.map(goal => (
                <GoalCard 
                    key={goal.id}
                    goal={goal}
                    tasks={tasksByGoal[goal.id] || []}
                    onViewTasks={() => navigateToTasks({ weeklyGoalCategory: goal.id })}
                />
            ))}
        </div>
    );
};


// --- MAIN MyWeek COMPONENT ---
export const MyWeek: React.FC<MyWeekProps> = ({ user, navigateToTasks, tasks, onOpenModal }) => {
    const [view, setView] = useState<'schedule' | 'overview'>('overview');
    const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
    const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [draggedTaskInfo, setDraggedTaskInfo] = useState<{ id: string, origin: 'scheduled' | 'unscheduled' } | null>(null);
    const [isScheduling, setIsScheduling] = useState(true);
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const myWeeklyTasks = useMemo(() => {
        return tasks.filter(t => t.weeklyGoalCategory && t.assignedTo === user.id);
    }, [tasks, user.id]);

    const myOpenWeeklyTasks = useMemo(() => {
        return myWeeklyTasks.filter(t => t.status !== TaskStatus.Completed);
    }, [myWeeklyTasks]);

    useEffect(() => {
        const calculateScheduleFromAPI = async () => {
            if (myOpenWeeklyTasks.length === 0) {
                setScheduledTasks([]);
                setUnscheduledTasks([]);
                setIsScheduling(false);
                setScheduleError(null);
                return;
            }

            setIsScheduling(true);
            setScheduleError(null);
            try {
                const tasksForApi = myOpenWeeklyTasks.map((t: Task) => ({
                    taskId: t.id,
                    title: t.title,
                    priority: t.priority,
                }));

                const { scheduledTasks: apiScheduled, overflowTasks: apiOverflow }: ScheduleResponse = await api.generateWeeklySchedule(tasksForApi);
                
                const scheduledTaskMap = new Map(apiScheduled.map((st: ApiScheduledTaskInfo) => [st.taskId, st]));
                
                const newScheduledTasks: ScheduledTask[] = [];
                const newUnscheduledTasks: Task[] = [];
                
                myOpenWeeklyTasks.forEach(task => {
                    const scheduleInfo = scheduledTaskMap.get(task.id);
                    if(scheduleInfo){
                         newScheduledTasks.push({
                            ...task,
                            day: scheduleInfo.dayIndex,
                            startMinutes: scheduleInfo.startMinutes,
                            durationMinutes: scheduleInfo.durationMinutes
                        });
                    } else {
                        newUnscheduledTasks.push(task);
                    }
                });

                setScheduledTasks(newScheduledTasks);
                setUnscheduledTasks(newUnscheduledTasks);

            } catch (error) {
                console.error("Error generating schedule from API, using fallback.", error);
                const errorMessage = error instanceof Error ? error.message : "Could not generate AI schedule.";
                setScheduleError(errorMessage);
                setUnscheduledTasks(myOpenWeeklyTasks);
                setScheduledTasks([]);
            } finally {
                setIsScheduling(false);
            }
        };

        calculateScheduleFromAPI();
    }, [myOpenWeeklyTasks]);
    

    const handleDragStart = (e: React.DragEvent, taskId: string, origin: 'scheduled' | 'unscheduled') => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
        setDraggedTaskInfo({ id: taskId, origin });
    };

    const handleDrop = (e: React.DragEvent, target: 'schedule' | 'unscheduled_panel', dayIndex?: number, hour?: number) => {
        console.log("Manual rescheduling is disabled when using AI scheduling.");
    };

    const { totalTasks, completedTasks } = useMemo(() => {
        return {
            totalTasks: myWeeklyTasks.length,
            completedTasks: myWeeklyTasks.filter(t => t.status === TaskStatus.Completed).length,
        };
    }, [myWeeklyTasks]);

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
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
        <div className="p-6 space-y-6 relative">
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-white">My Week Mission Control</h2>
                    <p className="text-gray-400 mt-1">Your dynamic planner to conquer the week's goals.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
                        <button onClick={() => setView('overview')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md ${view === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Goal Overview">
                            <LayoutGridIcon className="w-5 h-5"/>
                            <span>Overview</span>
                        </button>
                        <button onClick={() => setView('schedule')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md ${view === 'schedule' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Weekly Schedule">
                            <CalendarDaysIcon className="w-5 h-5"/>
                            <span>Schedule</span>
                        </button>
                    </div>
                 </div>
            </header>

            <AIWeeklyBriefing tasks={myWeeklyTasks} />
            
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">Overall Weekly Progress</h3>
                    <span className="text-xl font-bold text-blue-400">{completionPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${completionPercentage}%` }}>
                    </div>
                </div>
                 <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-500"/>
                    {completedTasks} of {totalTasks} key tasks completed this week. Keep up the great work!
                </p>
            </div>

            {view === 'overview' ? (
                <GoalOverview navigateToTasks={navigateToTasks} weeklyTasks={myWeeklyTasks} />
            ) : (
                <div className="relative">
                    {isScheduling && (
                        <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                            <LoaderIcon className="w-12 h-12 animate-spin text-indigo-400" />
                            <p className="mt-4 text-slate-300">AI is generating your optimal schedule...</p>
                        </div>
                    )}
                    {scheduleError && (
                         <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl text-center p-4">
                            <AlertTriangleIcon className="w-12 h-12 text-red-400" />
                            <p className="mt-4 text-red-300 font-semibold">{scheduleError}</p>
                            <p className="text-sm text-slate-400">All tasks have been moved to the unscheduled panel.</p>
                        </div>
                    )}
                    <ScheduleView
                        scheduledTasks={scheduledTasks}
                        unscheduledTasks={unscheduledTasks}
                        onDragStart={handleDragStart}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onTaskClick={setSelectedTask}
                    />
                </div>
            )}
        </div>
    );
};
