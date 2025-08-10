

import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Client, Task, TeamMember, View, TaskStatus, TaskPriority, Article, PulseLogEntry, ClientStatus } from '../types';
import { XIcon, SendIcon, SparklesIcon, LoaderIcon, ArrowRightIcon } from './Icons';
import { api } from '../services/api';
import { useDataContext } from '../contexts/DataContext';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View, filter: any, itemId?: string) => void;
}

const suggestionChips = [
    "List all critical accounts",
    "Who has the most overdue tasks?",
    "Update notes for Endredy Enterprises",
    "Mark 'Finalize Q3 hiring plan' as Completed",
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onNavigate }) => {
    const { 
        currentUser, accounts: clients, tasks, teamMembers, articles,
        handleSaveTask, handleSaveAccount, handleSaveTeamMember, 
        handleAddShoutOut, handleSaveComment, handleTaskStatusChange
    } = useDataContext();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { role: 'model', text: `Hello ${currentUser?.name.split(' ')[0]}! How can I help you today? I can now create tasks, update clients, and more.` }
            ]);
        }
    }, [isOpen, currentUser, messages.length]);
    
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading || !currentUser) return;

        const newUserMessage: ChatMessage = { role: 'user', text: messageText };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const slimClients = clients.map(({id, name, status, poc, assignedTeamMembers, notes}) => ({id, name, status, poc, assignedTeamMembers, notes}));
            const slimTasks = tasks.map(({id, title, status, dueDate, assignedTo, clientId, priority}) => ({id, title, status, dueDate, assignedTo, clientId, priority}));
            const slimTeam = teamMembers.map(({id, name, role}) => ({id, name, role}));
            const slimArticles = articles.map(({id, title, category, tags}) => ({id, title, category, tags}));

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
                    teamMembers: slimTeam,
                    articles: slimArticles,
                }
            });

            if (data.type === 'tool_call') {
                const { name, args } = data.call;
                let modelResponseText = "I'm not sure how to handle that action.";

                switch (name) {
                    case 'create_task': {
                        const assignee = teamMembers.find(m => m.name.toLowerCase().includes(args.assigneeName.toLowerCase()));
                        if (!assignee) {
                            modelResponseText = `Sorry, I couldn't find a team member named "${args.assigneeName}".`;
                            break;
                        }
                        const client = args.clientName ? clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase())) : undefined;
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        const newTask: Task = {
                            id: `task-${Date.now()}`,
                            title: args.title,
                            description: args.description || '',
                            status: TaskStatus.Pending,
                            assignedTo: assignee.id,
                            clientId: client?.id || null,
                            dueDate: args.dueDate ? new Date(args.dueDate).toISOString() : tomorrow.toISOString(),
                            priority: args.priority || TaskPriority.Medium,
                            elapsedTimeSeconds: 0,
                            subTasks: [],
                            assignee,
                            client
                        };
                        handleSaveTask(newTask);
                        modelResponseText = `I've created the task: "${newTask.title}". ACTION_LINK[View Task|tasks|{}|${newTask.id}]`;
                        break;
                    }
                     case 'update_task_status': {
                        const taskToUpdate = tasks.find(t => t.id === args.taskId);
                        if (taskToUpdate) {
                            handleTaskStatusChange(args.taskId, args.newStatus as TaskStatus);
                            modelResponseText = `I've updated the status for "${taskToUpdate.title}" to ${args.newStatus}. ACTION_LINK[View Task|tasks|{}|${taskToUpdate.id}]`;
                        } else {
                            modelResponseText = `Sorry, I couldn't find a task with ID "${args.taskId}".`;
                        }
                        break;
                    }
                    case 'update_client_status': {
                        const clientToUpdate = clients.find(c => c.id === args.clientId);
                        if(clientToUpdate) {
                            const updatedClient = { ...clientToUpdate, status: args.newStatus as ClientStatus };
                            handleSaveAccount(updatedClient);
                            modelResponseText = `I've updated the status for ${clientToUpdate.name} to ${args.newStatus}. ACTION_LINK[View Account|accounts|{}|${clientToUpdate.id}]`;
                        } else {
                             modelResponseText = `Sorry, I couldn't find a client with ID "${args.clientId}".`;
                        }
                        break;
                    }
                    case 'update_client_notes': {
                        const client = clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
                        if (client) {
                            const updatedClient = { ...client, notes: args.newNotes };
                            handleSaveAccount(updatedClient);
                            modelResponseText = `I've updated the notes for ${client.name}. ACTION_LINK[View Account|accounts|{}|${client.id}]`;
                        } else {
                            modelResponseText = `I couldn't find a client named "${args.clientName}".`;
                        }
                        break;
                    }
                    case 'add_client_pulse_log': {
                        const client = clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
                        if (client) {
                            const newPulseLog: PulseLogEntry = {
                                id: `pulse-${Date.now()}`,
                                date: new Date().toISOString(),
                                type: args.pulseType,
                                notes: args.pulseNotes
                            };
                            const updatedClient = { ...client, pulseLog: [...client.pulseLog, newPulseLog] };
                            handleSaveAccount(updatedClient);
                             modelResponseText = `I've added a new pulse log entry for ${client.name}. ACTION_LINK[View Account|accounts|{}|${client.id}]`;
                        } else {
                            modelResponseText = `I couldn't find a client named "${args.clientName}".`;
                        }
                        break;
                    }
                    case 'update_team_member_notes': {
                        const member = teamMembers.find(m => m.name.toLowerCase().includes(args.teamMemberName.toLowerCase()));
                        if(member) {
                            const updatedMember = { ...member, homeOffice: { ...member.homeOffice, notes: args.newNotes }};
                            handleSaveTeamMember(updatedMember);
                            modelResponseText = `I've updated the administrative notes for ${member.name}. ACTION_LINK[View Team Member|team|{}|${member.id}]`;
                        } else {
                            modelResponseText = `I couldn't find a team member named "${args.teamMemberName}".`;
                        }
                        break;
                    }
                    case 'send_shout_out': {
                        const member = teamMembers.find(m => m.name.toLowerCase().includes(args.toTeamMemberName.toLowerCase()));
                        if(member) {
                            handleAddShoutOut({
                                from: { name: currentUser.name, avatarInitials: currentUser.avatarInitials },
                                to: { name: member.name, avatarInitials: member.avatarInitials },
                                message: args.message,
                                date: new Date().toISOString()
                            });
                            modelResponseText = `I've sent a shout-out to ${member.name}!`;
                        } else {
                            modelResponseText = `I couldn't find a team member named "${args.toTeamMemberName}".`;
                        }
                        break;
                    }
                    case 'add_comment_to_article': {
                        const article = articles.find(a => a.title.toLowerCase() === args.articleTitle.toLowerCase());
                        if(article) {
                            handleSaveComment(article.id, args.commentContent);
                            modelResponseText = `I've added your comment to the article "${article.title}".`;
                        } else {
                            modelResponseText = `I couldn't find an article titled "${args.articleTitle}".`;
                        }
                        break;
                    }
                    default:
                        modelResponseText = "Sorry, I recognized an action but don't know how to perform it yet.";
                        break;
                }
                setMessages(prev => [...prev, { role: 'model', text: modelResponseText }]);

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
            const match = part.match(/ACTION_LINK\[(.*?)\]\|(.*?)\|(.*?)\|(.*?)\]/);
            if (match) {
                const [, buttonText, view, filterJson, itemId] = match;
                try {
                    const filter = JSON.parse(filterJson);
                    return (
                        <button
                            key={index}
                            onClick={() => { onNavigate(view as View, filter, itemId); onClose(); }}
                            className="my-2 inline-flex items-center gap-2 bg-core-accent/20 hover:bg-core-accent/30 text-core-accent font-semibold py-1.5 px-3 rounded-md text-sm transition-colors"
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
            <div className={`w-full max-w-lg h-full bg-core-bg-soft/90 backdrop-blur-lg shadow-2xl border-l border-core-border flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-core-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-core-text-primary flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-core-accent" />
                        AI Assistant
                    </h2>
                    <button onClick={onClose} className="text-core-text-secondary hover:text-core-text-primary"><XIcon className="w-5 h-5" /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'items-start'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-core-accent flex items-center justify-center text-core-accent-foreground font-bold flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-md p-3 rounded-xl prose prose-sm prose-p:my-0 prose-p:text-inherit prose-strong:text-inherit text-core-text-primary dark:prose-invert ${msg.role === 'user' ? 'bg-core-accent text-core-accent-foreground rounded-br-none' : 'bg-core-bg text-core-text-primary rounded-bl-none'}`}>
                                 {parseAndRenderText(msg.text)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                       <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-core-accent flex items-center justify-center text-core-accent-foreground font-bold flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                            <div className="max-w-md p-3 rounded-xl bg-core-bg text-core-text-secondary rounded-bl-none flex items-center gap-2">
                                <LoaderIcon className="w-5 h-5 animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-4 border-t border-core-border flex-shrink-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {suggestionChips.map(chip => (
                            <button key={chip} onClick={() => handleSendMessage(chip)} className="px-3 py-1 bg-core-bg hover:bg-core-border text-core-text-secondary rounded-full text-xs transition-colors">
                                {chip}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex items-center gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything or give a command..." className="w-full bg-core-bg border border-core-border rounded-lg py-2.5 px-4 text-core-text-primary placeholder-core-text-secondary focus:outline-none focus:ring-2 focus:ring-core-accent" />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-core-accent rounded-lg text-white hover:bg-core-accent-hover disabled:opacity-50">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};