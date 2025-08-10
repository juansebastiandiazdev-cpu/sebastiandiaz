
import React, { useState } from 'react';
import { Task, TaskPriority, TeamMember, TaskStatus } from '../types';
import { RocketIcon, LoaderIcon, CheckCircleIcon, SparklesIcon, PlusIcon, XIcon } from './Icons';
import { useToasts } from '../hooks/useToasts';
import { api } from './services/api';

type SuggestedTask = Omit<Task, 'id' | 'status' | 'assignedTo' | 'clientId' | 'elapsedTimeSeconds' | 'assignee' | 'client' | 'dueDate' | 'subTasks'> & { dueDate?: string };

interface AIProjectPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveTasks: (tasks: Task[]) => void;
    currentUser: TeamMember;
}

export const AIProjectPlannerModal: React.FC<AIProjectPlannerModalProps> = ({ isOpen, onClose, onSaveTasks, currentUser }) => {
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
    const [selectedTaskIndexes, setSelectedTaskIndexes] = useState<Set<number>>(new Set());
    const { addToast } = useToasts();
    
    if (!isOpen) return null;

    const handlePlanProject = async () => {
        if (!goal.trim()) return;
        setIsLoading(true);
        setSuggestedTasks([]);
        setSelectedTaskIndexes(new Set());
        try {
            const data = await api.planProject(goal);
            if(data.tasks && Array.isArray(data.tasks)) {
                const newSuggestedTasks: SuggestedTask[] = data.tasks.map(t => ({
                    title: t.title ?? 'Untitled Task',
                    description: t.description ?? '',
                    priority: t.priority ?? TaskPriority.Medium,
                    dueDate: t.dueDate,
                    weeklyGoalCategory: t.weeklyGoalCategory,
                }));
                setSuggestedTasks(newSuggestedTasks);
                setSelectedTaskIndexes(new Set(newSuggestedTasks.map((_: any, index: number) => index)));
            }
        } catch (error) {
            console.error("Error planning project:", error);
            addToast(error instanceof Error ? error.message : "An unknown error occurred.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTaskSelection = (index: number) => {
        setSelectedTaskIndexes(prev => {
            const newSet = new Set(prev);
            if(newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        })
    };

    const handleCreateTasks = () => {
        const tasksToCreate: Task[] = suggestedTasks
            .filter((_, index) => selectedTaskIndexes.has(index))
            .map(st => {
                const now = new Date();
                return {
                    ...st,
                    id: `task-${Date.now()}-${Math.random()}`,
                    status: TaskStatus.Pending,
                    assignedTo: currentUser.id,
                    clientId: null,
                    elapsedTimeSeconds: 0,
                    dueDate: st.dueDate ? new Date(st.dueDate).toISOString() : new Date(now.setDate(now.getDate() + 7)).toISOString(),
                    subTasks: []
                };
            });
        
        onSaveTasks(tasksToCreate);
        addToast(`${tasksToCreate.length} tasks added to your board!`, 'success');
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl shadow-xl w-full max-w-2xl border border-slate-700 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><RocketIcon className="w-5 h-5"/> AI Project Planner</h2>
                     <button onClick={onClose} className="text-slate-400 hover:text-white"><XIcon className="w-5 h-5"/></button>
                </header>

                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-1">What's the project goal?</label>
                        <textarea id="goal" value={goal} onChange={e => setGoal(e.target.value)} rows={3} placeholder="e.g., Onboard new client 'Apollo Beach' with a dedicated scheduler and marketer." className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        <button onClick={handlePlanProject} disabled={isLoading || !goal.trim()} className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                            {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                            {isLoading ? 'Planning...' : 'Generate Plan'}
                        </button>
                    </div>

                    {suggestedTasks.length > 0 && (
                        <div className="border-t border-slate-700 pt-4">
                            <h3 className="font-semibold text-white">Suggested Tasks ({selectedTaskIndexes.size}/{suggestedTasks.length} selected)</h3>
                             <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-2">
                                {suggestedTasks.map((task, index) => (
                                    <div key={index} onClick={() => handleToggleTaskSelection(index)} className={`p-3 rounded-lg flex items-start gap-3 cursor-pointer border transition-colors ${selectedTaskIndexes.has(index) ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-700/50'}`}>
                                        <div className="pt-0.5">
                                            {selectedTaskIndexes.has(index) ? <CheckCircleIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" /> }
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{task.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.priority === TaskPriority.High ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{task.priority}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-slate-700 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleCreateTasks} disabled={selectedTaskIndexes.size === 0} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                        <PlusIcon className="w-5 h-5"/> Create {selectedTaskIndexes.size} Tasks
                    </button>
                </footer>
            </div>
        </div>
    );
};
