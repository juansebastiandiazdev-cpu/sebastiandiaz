
import React, { useState } from 'react';
import { Task, TaskPriority, TeamMember, TaskStatus, Client, SubTask } from '../types';
import { RocketIcon, LoaderIcon, CheckCircleIcon, SparklesIcon, PlusIcon, TrashIcon } from './Icons';
import { useToasts } from '../hooks/useToasts';
import { api } from '../services/api';
import { Modal } from './ui/Modal';

interface AIProjectPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveTasks: (tasks: Task[]) => void;
    currentUser: TeamMember;
    clients: Client[];
    teamMembers: TeamMember[];
}

const EditableTaskCard: React.FC<{
    task: Task;
    index: number;
    onUpdate: (index: number, updatedField: Partial<Task>) => void;
    onToggle: (index: number) => void;
    onDelete: (index: number) => void;
    isSelected: boolean;
    teamMembers: TeamMember[];
}> = ({ task, index, onUpdate, onToggle, onDelete, isSelected, teamMembers }) => {

    return (
        <div className={`p-3 rounded-lg flex items-start gap-3 border transition-colors ${isSelected ? 'bg-core-accent/10 border-core-accent' : 'bg-core-bg-soft border-core-border hover:bg-core-bg'}`}>
            <div className="pt-1.5 flex flex-col items-center gap-2">
                <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(index)}
                    className="h-5 w-5 rounded-md border-core-border text-core-accent bg-core-bg-soft focus:ring-core-accent cursor-pointer"
                />
                 <button onClick={() => onDelete(index)} className="text-core-text-secondary hover:text-red-400">
                    <TrashIcon className="w-4 h-4"/>
                </button>
            </div>
            <div className="flex-1 space-y-2">
                <input 
                    type="text" 
                    value={task.title}
                    onChange={e => onUpdate(index, { title: e.target.value })}
                    className="w-full bg-transparent font-medium text-core-text-primary focus:outline-none focus:bg-core-bg rounded p-1 -m-1"
                />
                <textarea 
                    value={task.description}
                    onChange={e => onUpdate(index, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-transparent text-xs text-core-text-secondary focus:outline-none focus:bg-core-bg rounded p-1 -m-1"
                />
                 {task.subTasks && task.subTasks.length > 0 && (
                    <div className="pt-2">
                        <h4 className="text-xs font-semibold text-core-text-secondary">Sub-tasks:</h4>
                        <ul className="list-disc list-inside text-xs text-core-text-secondary">
                            {task.subTasks.map(sub => <li key={sub.id}>{sub.text}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};


export const AIProjectPlannerModal: React.FC<AIProjectPlannerModalProps> = ({ isOpen, onClose, onSaveTasks, currentUser, clients, teamMembers }) => {
    const [goal, setGoal] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | 'none'>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
    const [selectedTaskIndexes, setSelectedTaskIndexes] = useState<Set<number>>(new Set());
    const { addToast } = useToasts();
    
    const handlePlanProject = async () => {
        if (!goal.trim()) return;
        setIsLoading(true);
        setSuggestedTasks([]);
        setSelectedTaskIndexes(new Set());
        try {
            const client = selectedClientId !== 'none' ? clients.find(c => c.id === selectedClientId) : undefined;
            const data = await api.planProject(goal, client, teamMembers, endDate);
            
            if(data.tasks && Array.isArray(data.tasks)) {
                 const newSuggestedTasks: Task[] = data.tasks.map((t: Partial<Task>) => ({
                    id: `temp-${Date.now()}-${Math.random()}`,
                    title: t.title ?? 'Untitled AI Task',
                    description: t.description ?? '',
                    status: TaskStatus.Pending,
                    dueDate: t.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedTo: t.assignedTo ?? currentUser.id,
                    clientId: t.clientId ?? (client?.id || null),
                    priority: t.priority ?? TaskPriority.Medium,
                    elapsedTimeSeconds: 0,
                    subTasks: t.subTasks || [],
                    assignee: teamMembers.find(m => m.id === (t.assignedTo ?? currentUser.id)),
                    client: client || (t.clientId ? clients.find(c => c.id === t.clientId) : undefined),
                    weeklyGoalCategory: t.weeklyGoalCategory,
                }));
                setSuggestedTasks(newSuggestedTasks);
                setSelectedTaskIndexes(new Set(newSuggestedTasks.map((_, index) => index)));
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
        const tasksToCreate = suggestedTasks.filter((_, index) => selectedTaskIndexes.has(index));
        onSaveTasks(tasksToCreate);
        addToast(`${tasksToCreate.length} tasks added to your board!`, 'success');
        onClose();
    };

    const updateTask = (index: number, updatedField: Partial<Task>) => {
        setSuggestedTasks(prev => prev.map((task, i) => i === index ? { ...task, ...updatedField } : task));
    };
    
    const deleteTask = (index: number) => {
        setSuggestedTasks(prev => prev.filter((_, i) => i !== index));
        setSelectedTaskIndexes(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };

    const modalFooter = (
         <>
            <button onClick={onClose} className="bg-core-bg hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button onClick={handleCreateTasks} disabled={selectedTaskIndexes.size === 0} className="flex items-center gap-2 bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                <PlusIcon className="w-5 h-5"/> Create {selectedTaskIndexes.size} Tasks
            </button>
        </>
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Project Planner"
            icon={<RocketIcon className="w-6 h-6 text-core-accent" />}
            size="4xl"
            footer={modalFooter}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Inputs */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-core-text-secondary mb-1">What's the project goal?</label>
                        <textarea id="goal" value={goal} onChange={e => setGoal(e.target.value)} rows={3} placeholder="e.g., Onboard new client 'Apollo Beach' with a dedicated scheduler and marketer." className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="client-context" className="block text-sm font-medium text-core-text-secondary mb-1">For Client (Optional)</label>
                            <select id="client-context" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent">
                                <option value="none">None</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-core-text-secondary mb-1">End Date (Optional)</label>
                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-core-bg border border-core-border rounded-lg py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent"/>
                        </div>
                    </div>
                    <button onClick={handlePlanProject} disabled={isLoading || !goal.trim()} className="w-full flex items-center justify-center gap-2 bg-core-accent hover:bg-core-accent-hover text-white font-bold py-2 rounded-lg disabled:opacity-50">
                        {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                        {isLoading ? 'Planning...' : 'Generate Plan'}
                    </button>
                </div>
                {/* Right: Outputs */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-core-text-primary">Suggested Tasks ({selectedTaskIndexes.size}/{suggestedTasks.length} selected)</h3>
                    <div className="h-[400px] overflow-y-auto space-y-2 pr-2 border-t border-core-border pt-2">
                        {suggestedTasks.length > 0 ? (
                            suggestedTasks.map((task, index) => (
                                <EditableTaskCard 
                                    key={task.id} 
                                    task={task} 
                                    index={index}
                                    onUpdate={updateTask}
                                    onToggle={handleToggleTaskSelection}
                                    onDelete={deleteTask}
                                    isSelected={selectedTaskIndexes.has(index)}
                                    teamMembers={teamMembers}
                                />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-core-text-secondary/60">
                                {isLoading ? <LoaderIcon className="w-8 h-8 animate-spin"/> : 'AI-generated tasks will appear here...'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
