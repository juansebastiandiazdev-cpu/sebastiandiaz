import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, SubTask, Client, TeamMember } from '../types';
import { TrashIcon, SparklesIcon, PlusIcon, LoaderCircleIcon, LoaderIcon } from './Icons';
import { GOALS_CONFIG } from '../constants';
import { api } from '../services/api';
import { Modal } from './ui/Modal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  task: Task | null;
  clients: Client[];
  teamMembers: TeamMember[];
}

const initialTaskState: Omit<Task, 'id' | 'assignee' | 'client' | 'subTasks'> = {
    title: '',
    description: '',
    status: TaskStatus.Pending,
    priority: TaskPriority.Medium,
    dueDate: '',
    assignedTo: '',
    clientId: null,
    elapsedTimeSeconds: 0,
    weeklyGoalCategory: undefined,
    taskType: 'task',
};

const handleApiError = (error: unknown, featureName: string) => {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`Failed to get AI ${featureName}: ${errorMessage}`);
};

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, task, clients, teamMembers }) => {
  const [formData, setFormData] = useState(initialTaskState);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [isTitleAiLoading, setIsTitleAiLoading] = useState(false);
  const [isSubtaskAiLoading, setIsSubtaskAiLoading] = useState(false);


  useEffect(() => {
    if (isOpen) {
        if (task) {
          setFormData({
            ...initialTaskState,
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          });
          setSubTasks(task.subTasks || []);
        } else {
          setFormData({...initialTaskState, dueDate: new Date().toISOString().split('T')[0]});
          setSubTasks([]);
        }
    }
  }, [task, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddSubTask = () => {
    if (newSubTask.trim()) {
        setSubTasks([...subTasks, { id: `sub-${Date.now()}`, text: newSubTask.trim(), completed: false }]);
        setNewSubTask('');
    }
  };

  const handleToggleSubTask = (id: string) => {
    setSubTasks(subTasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };
  
  const handleRemoveSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const handleImproveTitle = async () => {
    if (!formData.title) return;
    setIsTitleAiLoading(true);
    try {
        const data = await api.suggestTaskTitle(formData.title);
        setFormData(prev => ({ ...prev, title: data.newTitle }));
    } catch (error) {
        handleApiError(error, 'title suggestion');
    } finally {
        setIsTitleAiLoading(false);
    }
  };

  const handleAISuggestions = async () => {
      if (!formData.title) return;
      setIsSubtaskAiLoading(true);
      try {
          const data = await api.suggestSubtasks(formData.title, formData.description);

          if (data.subtasks && Array.isArray(data.subtasks)) {
              const newSubtasks = data.subtasks.map((st: {text: string}) => ({ id: `sub-${Date.now()}-${Math.random()}`, text: st.text, completed: false }));
              setSubTasks(prev => [...prev, ...newSubtasks]);
          }
      } catch (error) {
          handleApiError(error, 'subtask suggestions');
      } finally {
          setIsSubtaskAiLoading(false);
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assignedTo) {
        alert('Please assign the task to a team member.');
        return;
    }
    const taskToSave: Task = {
        ...formData,
        id: task ? task.id : `task-${Date.now()}`,
        dueDate: new Date(formData.dueDate).toISOString(),
        subTasks: subTasks,
        weeklyGoalCategory: formData.taskType === 'event' ? 'event' : formData.weeklyGoalCategory,
        assignee: teamMembers.find(m => m.id === formData.assignedTo),
        client: clients.find(c => c.id === formData.clientId) || undefined,
    };
    onSave(taskToSave);
    onClose();
  };
  
  const handleDeleteClick = () => {
      if(task) {
          onDelete(task.id);
          onClose();
      }
  }

  const modalFooter = (
    <div className="flex justify-between items-center w-full">
        {task ? <button type="button" onClick={handleDeleteClick} className="text-red-500 hover:text-red-400 p-2 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20" title="Delete Task"><TrashIcon size={20}/></button> : <div></div>}
        <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
                    className="bg-core-bg-soft hover:bg-core-border text-core-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button type="submit"
                    onClick={handleSubmit}
                    className="bg-core-accent hover:bg-core-accent-hover text-core-accent-foreground font-bold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-core-accent/20">
                {task ? 'Save Changes' : 'Create Task'}
            </button>
        </div>
    </div>
  );

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={task ? 'Edit Task' : 'Add New Task'}
        footer={modalFooter}
    >
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-core-text-secondary mb-1">Task Type</label>
                 <div className="flex items-center gap-2 bg-core-bg p-1 rounded-lg border border-core-border">
                    <button type="button" onClick={() => setFormData(p => ({...p, taskType: 'task'}))} className={`flex-1 text-center py-1.5 rounded-md text-sm font-medium transition-colors ${formData.taskType === 'task' ? 'bg-core-accent text-white' : 'text-core-text-primary hover:bg-core-bg-soft'}`}>Task</button>
                    <button type="button" onClick={() => setFormData(p => ({...p, taskType: 'event'}))} className={`flex-1 text-center py-1.5 rounded-md text-sm font-medium transition-colors ${formData.taskType === 'event' ? 'bg-core-accent text-white' : 'text-core-text-primary hover:bg-core-bg-soft'}`}>Event</button>
                 </div>
            </div>

            <div>
                <label htmlFor="title" className="block text-sm font-medium text-core-text-secondary">Title</label>
                <div className="flex items-center gap-2 mt-1">
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required
                           className="flex-grow bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm"/>
                    {formData.taskType === 'task' && (
                        <button type="button" onClick={handleImproveTitle} disabled={isTitleAiLoading || isSubtaskAiLoading || !formData.title}
                                className="p-2 bg-core-accent/20 hover:bg-core-accent/30 text-core-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait">
                            {isTitleAiLoading ? <LoaderCircleIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                        </button>
                    )}
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-core-text-secondary">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3}
                          className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm"/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-core-text-secondary">Assignee</label>
                    <select name="assignedTo" id="assignedTo" value={formData.assignedTo} onChange={handleChange} required
                            className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm">
                        <option value="">Select Member</option>
                        {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-core-text-secondary">Client (Optional)</label>
                    <select name="clientId" id="clientId" value={formData.clientId || ''} onChange={handleChange}
                            className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm">
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-core-text-secondary">Due Date</label>
                    <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required
                           className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm"/>
                </div>
                {formData.taskType === 'task' && (
                     <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-core-text-secondary">Priority</label>
                        <select name="priority" id="priority" value={formData.priority} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm">
                            {Object.values(TaskPriority).filter(p => p !== TaskPriority.Urgent).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {formData.taskType === 'task' && (
                   <div>
                        <label htmlFor="status" className="block text-sm font-medium text-core-text-secondary">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm">
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
               )}
                {formData.taskType === 'task' && (
                    <div>
                        <label htmlFor="weeklyGoalCategory" className="block text-sm font-medium text-core-text-secondary">Weekly Goal Category</label>
                        <select name="weeklyGoalCategory" id="weeklyGoalCategory" value={formData.weeklyGoalCategory || ''} onChange={handleChange}
                                className="mt-1 block w-full bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm">
                            <option value="">None</option>
                            {GOALS_CONFIG.filter(g => g.id !== 'event').map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                    </div>
                )}
            </div>
            
            {formData.taskType === 'task' && (
                 <div>
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-core-text-secondary mb-1">Sub-tasks</label>
                        <button type="button" onClick={handleAISuggestions} disabled={isTitleAiLoading || isSubtaskAiLoading || !formData.title}
                                className="flex items-center gap-1 text-xs text-core-accent hover:text-core-accent-hover disabled:opacity-50 disabled:cursor-wait">
                            {isSubtaskAiLoading ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                            Suggest
                        </button>
                    </div>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                        {subTasks.map((st) => (
                            <div key={st.id} className="flex items-center gap-2 group bg-core-bg p-2 rounded-md">
                                <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubTask(st.id)}
                                       className="h-4 w-4 rounded border-core-border text-core-accent bg-core-bg-soft focus:ring-core-accent cursor-pointer"/>
                                <span className={`flex-grow text-sm ${st.completed ? 'text-core-text-secondary line-through' : 'text-core-text-primary'}`}>{st.text}</span>
                                <button type="button" onClick={() => handleRemoveSubTask(st.id)} className="text-core-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100">
                                    <TrashIcon size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                         <input type="text" value={newSubTask} onChange={(e) => setNewSubTask(e.target.value)} placeholder="Add a new sub-task"
                               className="flex-grow bg-core-bg border border-core-border rounded-md shadow-sm py-2 px-3 text-core-text-primary focus:outline-none focus:ring-2 focus:ring-core-accent sm:text-sm"/>
                        <button type="button" onClick={handleAddSubTask} className="p-2 bg-core-bg-soft hover:bg-core-border text-core-text-primary rounded-md">
                             <PlusIcon size={20}/>
                        </button>
                    </div>
                </div>
            )}
        </form>
    </Modal>
  );
};