
import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Client, Task, TeamMember, View, TaskStatus, TaskPriority } from '../types';
import { XIcon, SendIcon, SparklesIcon, LoaderIcon, ArrowRightIcon } from './Icons';
import { api } from './services/api';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    tasks: Task[];
    teamMembers: TeamMember[];
    currentUser: TeamMember;
    onSaveTask: (task: Task) => void;
    onNavigate: (view: View, filter: any, itemId?: string) => void;
}

const suggestionChips = [
    "List all critical accounts",
    "Who has the most overdue tasks?",
    "Summarize the status of Synergy Homecare of South Austin",
    "Create a task for me to review Q3 KPIs",
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, clients, tasks, teamMembers, currentUser, onSaveTask, onNavigate }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { role: 'model', text: `Hello ${currentUser.name.split(' ')[0]}! How can I help you today? I can now create tasks for you.` }
            ]);
        }
    }, [isOpen, currentUser, messages.length]);
    
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: messageText };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const slimClients = clients.map(({id, name, status, poc, assignedTeamMembers, notes}) => ({id, name, status, poc, assignedTeamMembers, notes}));
            const slimTasks = tasks.map(({id, title, status, dueDate, assignedTo, clientId, priority}) => ({id, title, status, dueDate, assignedTo, clientId, priority}));
            const slimTeam = teamMembers.map(({id, name, role}) => ({id, name, role}));
            
            const chatHistory = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const data = await api.aiAssistant({
                prompt: messageText,
                history: chatHistory,
                context: {
                    currentUser,
                    clients: slimClients,
                    tasks: slimTasks,
                    teamMembers: slimTeam
                }
            });

            if (data.type === 'tool_call' && data.call.name === 'create_task') {
                const args = data.call.args;
                const assigneeName = args.assigneeName as string;
                const clientName = args.clientName as string | undefined;
                const assignee = teamMembers.find((m: any) => m.name.toLowerCase().includes(assigneeName.toLowerCase()));
                if (!assignee) {
                    setMessages(prev => [...prev, { role: 'model', text: `Sorry, I couldn't find a team member named "${assigneeName}".` }]);
                    return;
                }
                const client = clientName ? clients.find((c: any) => c.name.toLowerCase().includes(clientName.toLowerCase())) : undefined;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dueDateString = args.dueDate as string | undefined;

                const newTask = {
                    id: `task-${Date.now()}`,
                    title: args.title as string,
                    description: (args.description as string) || '',
                    status: TaskStatus.Pending,
                    assignedTo: assignee.id,
                    clientId: client?.id || null,
                    dueDate: dueDateString ? new Date(dueDateString).toISOString() : tomorrow.toISOString(),
                    priority: (args.priority as TaskPriority) || TaskPriority.Medium,
                    elapsedTimeSeconds: 0,
                    subTasks: [],
                    assignee,
                    client
                };
                
                onSaveTask(newTask);
                setMessages(prev => [...prev, { role: 'model', text: `I've created the task: "${newTask.title}".` }]);
            } else if (data.type === 'text') {
                 setMessages(prev => [...prev, { role: 'model', text: data.text }]);
            } else {
                throw new Error('Unexpected response type from AI assistant');
            }

        } catch (e) {
            console.error("Error communicating with AI assistant:", e);
            const displayMessage = e instanceof Error ? e.message : "Sorry, I'm having trouble connecting right now.";
            setMessages(prev => [...prev, { role: 'model', text: displayMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const parseAndRenderText = (text: string) => {
        const parts = text.split(/(ACTION_LINK\[.*?\])/g);
        return parts.map((part, index) => {
            const match = part.match(/ACTION_LINK\[(.*?)\|(.*?)\|(.*?)\]/);
            if (match) {
                const [, buttonText, view, filterJson] = match;
                try {
                    const filter = JSON.parse(filterJson);
                    return (
                        <button
                            key={index}
                            onClick={() => onNavigate(view as View, filter)}
                            className="my-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors"
                        >
                            {buttonText} <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    );
                } catch (e) {
                    console.error("Failed to parse action link filter:", e);
                    return <span key={index}>{part}</span>;
                }
            }
            return <span key={index} dangerouslySetInnerHTML={{ __html: marked.parse(part, {breaks: true}) as string }} />;
        });
    };
    
    return (
        <div className={`fixed inset-0 bg-black/60 z-40 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className={`w-full max-w-lg h-full bg-slate-800/90 backdrop-blur-lg shadow-2xl border-l border-slate-700 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        AI Assistant
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700/50 text-slate-300 rounded-bl-none'}`}>
                                <div className="prose prose-sm prose-invert max-w-none prose-p:my-0">{parseAndRenderText(msg.text)}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                       <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                            <div className="max-w-md p-3 rounded-xl bg-slate-700/50 text-slate-300 rounded-bl-none">
                                <LoaderIcon className="w-5 h-5 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-4 border-t border-slate-700 flex-shrink-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {suggestionChips.map(chip => (
                            <button key={chip} onClick={() => handleSendMessage(chip)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full text-xs transition-colors">
                                {chip}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex items-center gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 disabled:opacity-50">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};
