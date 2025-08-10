
import React, { useState } from 'react';
import { TeamMember, CoachingFeedForward, ActionItem, Client, Task } from '../types';
import { PlusIcon, TrashIcon, CheckSquareIcon, SparklesIcon, LoaderIcon, DownloadIcon, FilePenIcon, LightbulbIcon } from './Icons';
import { api } from './services/api';

interface CoachingTabProps {
    member: TeamMember;
    onSave: (updatedMember: TeamMember) => void;
    currentUser: TeamMember;
    tasks: Task[];
    clients: Client[];
}

type TalkingPoints = {
    praise: string[];
    growth: string[];
} | null;

const initialSessionState: Omit<CoachingFeedForward, 'id'> = {
    sessionDate: new Date().toISOString().split('T')[0],
    summary: '',
    leaderActions: [],
    employeeActions: []
};

const ActionItemInput: React.FC<{
    actions: ActionItem[];
    onAdd: (text: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    placeholder: string;
}> = ({ actions, onAdd, onToggle, onDelete, placeholder }) => {
    const [text, setText] = useState('');

    const handleAdd = () => {
        if(text.trim()){
            onAdd(text.trim());
            setText('');
        }
    };
    
    return (
        <div className="space-y-2">
            {actions.map(action => (
                <div key={action.id} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-md group">
                    <input type="checkbox" checked={action.completed} onChange={() => onToggle(action.id)} className="h-4 w-4 rounded border-slate-500 text-blue-500 bg-slate-700 focus:ring-blue-600 cursor-pointer" />
                    <span className={`flex-1 text-sm ${action.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{action.text}</span>
                     <button type="button" onClick={() => onDelete(action.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            ))}
             <div className="flex items-center gap-2">
                <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} className="flex-grow bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                <button type="button" onClick={handleAdd} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md">
                     <PlusIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

const handleApiError = (error: unknown) => {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`An error occurred: ${errorMessage}`);
};

export const CoachingTab: React.FC<CoachingTabProps> = ({ member, onSave, currentUser, tasks, clients }) => {
    const [showForm, setShowForm] = useState(false);
    const [newSession, setNewSession] = useState<Omit<CoachingFeedForward, 'id'>>(initialSessionState);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isDraftingSummary, setIsDraftingSummary] = useState(false);
    const [talkingPoints, setTalkingPoints] = useState<TalkingPoints>(null);

    const downloadEmlFile = (session: CoachingFeedForward, member: TeamMember, leader: TeamMember) => {
        const formattedDate = new Date(session.sessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const subject = `1-on-1 Session Summary - ${formattedDate}`;

        const formatActions = (actions: ActionItem[]): string => {
            if (actions.length === 0) return '<li>No action items.</li>';
            return actions.map(a => `<li>${a.completed ? '✅' : '☐'} ${a.text}</li>`).join('');
        };

        const htmlBody = `
            <html>
                <body style="font-family: sans-serif; line-height: 1.6;">
                    <h2 style="color: #333;">1-on-1 Session Summary</h2>
                    <p><strong>Team Member:</strong> ${member.name}</p>
                    <p><strong>Leader:</strong> ${leader.name}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <hr>
                    <h3>Summary</h3>
                    <p>${session.summary.replace(/\n/g, '<br>')}</p>
                    <h3>Action Items</h3>
                    <strong>Leader Actions:</strong>
                    <ul>${formatActions(session.leaderActions)}</ul>
                    <strong>Employee Actions:</strong>
                    <ul>${formatActions(session.employeeActions)}</ul>
                </body>
            </html>
        `;

        const emlContent = [
            `From: ${leader.email}`,
            `To: ${member.email}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            'Content-Disposition: inline',
            '',
            htmlBody
        ].join('\n');

        const blob = new Blob([emlContent], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `1-on-1_${member.name.replace(' ', '_')}_${session.sessionDate}.eml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleSuggestTalkingPoints = async () => {
        setIsAiLoading(true);
        try {
            const memberTasks = tasks.filter(t => t.assignedTo === member.id);
            const memberClients = clients.filter(c => c.assignedTeamMembers.includes(member.id));
            const data = await api.suggestTalkingPoints(member, memberTasks, memberClients);

            if (data.praise && data.growth) {
                setTalkingPoints(data);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiDraftSession = async () => {
        setIsDraftingSummary(true);
        setShowForm(true); // Show the form to put the summary in
        setNewSession(initialSessionState); // Reset form state
        try {
            const memberTasks = tasks.filter(t => t.assignedTo === member.id);
            const memberClients = clients.filter(c => c.assignedTeamMembers.includes(member.id));
            const data = await api.suggestCoachingSummary(member, memberTasks, memberClients);
            
            setNewSession(prev => ({ ...prev, summary: data.summary }));
            
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsDraftingSummary(false);
        }
    };

    const handleActionChange = (type: 'leaderActions' | 'employeeActions', action: 'add' | 'toggle' | 'delete', payload: string) => {
        setNewSession(prev => {
            const currentActions = prev[type];
            let updatedActions;
            
            if (action === 'add') {
                updatedActions = [...currentActions, { id: `action-${Date.now()}`, text: payload, completed: false }];
            } else if (action === 'toggle') {
                updatedActions = currentActions.map(a => a.id === payload ? {...a, completed: !a.completed} : a);
            } else { // delete
                updatedActions = currentActions.filter(a => a.id !== payload);
            }
            return {...prev, [type]: updatedActions};
        });
    };
    
    const handleSaveSession = () => {
        if(!newSession.summary){
            alert('Please provide a summary for the session.');
            return;
        }

        const sessionToSave: CoachingFeedForward = {
            ...newSession,
            id: `session-${Date.now()}`
        };

        const updatedMember: TeamMember = {
            ...member,
            coachingSessions: [...(member.coachingSessions || []), sessionToSave]
        };
        onSave(updatedMember);
        setShowForm(false);
        setNewSession(initialSessionState);
        setTalkingPoints(null);
    };
    
    const handleAiSuggestActions = async () => {
        if (!newSession.summary) {
            alert("Please provide a session summary first to get AI suggestions.");
            return;
        }
        setIsAiLoading(true);
        try {
            const data = await api.suggestCoachingActions(newSession.summary, member.role);
            
            if (data.leaderActions && Array.isArray(data.leaderActions)) {
                const newLeaderActions = data.leaderActions.map((text: string) => ({ id: `action-l-${Date.now()}-${Math.random()}`, text, completed: false }));
                setNewSession(prev => ({...prev, leaderActions: [...prev.leaderActions, ...newLeaderActions] }));
            }
            if (data.employeeActions && Array.isArray(data.employeeActions)) {
                const newEmployeeActions = data.employeeActions.map((text: string) => ({ id: `action-e-${Date.now()}-${Math.random()}`, text, completed: false }));
                 setNewSession(prev => {
                    const existingActions = new Set(prev.employeeActions.map(a => a.text));
                    const uniqueNewActions = newEmployeeActions.filter((a: any) => !existingActions.has(a.text));
                    return {...prev, employeeActions: [...prev.employeeActions, ...uniqueNewActions] };
                });
            }

        } catch (error) {
            handleApiError(error);
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleStartNewSession = () => {
        setShowForm(true);
        setNewSession(initialSessionState);
        setTalkingPoints(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Coaching Feedforward Sessions</h3>
                {!showForm && (
                     <div className="flex gap-2">
                        <button onClick={handleSuggestTalkingPoints} disabled={isAiLoading} className="flex items-center gap-2 bg-purple-600/80 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors hover:bg-purple-700/80 disabled:opacity-50">
                             {isAiLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <LightbulbIcon className="w-5 h-5" />}
                            Suggest Talking Points
                        </button>
                        <button onClick={handleStartNewSession} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors hover:bg-indigo-700">
                            <PlusIcon className="w-5 h-5" />
                            Log New Session
                        </button>
                    </div>
                )}
            </div>

            {talkingPoints && !showForm && (
                 <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                     <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-white">Suggested Talking Points</h4>
                        <button onClick={() => setTalkingPoints(null)} className="text-slate-500 hover:text-white">&times;</button>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h5 className="text-sm font-bold text-green-400 mb-2">Praise & Recognition</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {talkingPoints.praise.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h5 className="text-sm font-bold text-yellow-400 mb-2">Growth & Opportunities</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {talkingPoints.growth.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                     </div>
                 </div>
            )}
    
            {showForm && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-white">New Session Details</h4>
                        <button onClick={handleAiDraftSession} disabled={isDraftingSummary} className="flex items-center gap-2 bg-purple-600/50 hover:bg-purple-600 text-white text-xs font-semibold py-1 px-2 rounded-md">
                           {isDraftingSummary ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                            {isDraftingSummary ? 'Drafting...' : 'AI Draft Summary'}
                        </button>
                    </div>
                    {isDraftingSummary && !newSession.summary && (
                        <div className="flex items-center gap-2 text-purple-300">
                            <LoaderIcon className="w-4 h-4 animate-spin"/>
                            <span>AI is drafting the summary...</span>
                        </div>
                    )}
                    <div>
                        <label htmlFor="sessionDate" className="block text-sm font-medium text-slate-300 mb-1">Session Date</label>
                        <input type="date" id="sessionDate" value={newSession.sessionDate} onChange={e => setNewSession(p => ({...p, sessionDate: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white"/>
                    </div>
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-slate-300 mb-1">Session Summary</label>
                        <div className="relative">
                            <textarea id="summary" value={newSession.summary} onChange={e => setNewSession(p => ({...p, summary: e.target.value}))} rows={3} className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white"/>
                            <div className="absolute bottom-2 right-2">
                                <button type="button" onClick={handleAiSuggestActions} disabled={isAiLoading || !newSession.summary}
                                    className="flex items-center gap-1 text-xs bg-purple-600/50 hover:bg-purple-600 text-white font-semibold py-1 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait">
                                    {isAiLoading ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                                    Suggest Actions
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Leader Action Items</label>
                        <ActionItemInput 
                            actions={newSession.leaderActions}
                            onAdd={(text) => handleActionChange('leaderActions', 'add', text)}
                            onToggle={(id) => handleActionChange('leaderActions', 'toggle', id)}
                            onDelete={(id) => handleActionChange('leaderActions', 'delete', id)}
                            placeholder="Add a new action item..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Employee Action Items</label>
                        <ActionItemInput 
                            actions={newSession.employeeActions}
                            onAdd={(text) => handleActionChange('employeeActions', 'add', text)}
                            onToggle={(id) => handleActionChange('employeeActions', 'toggle', id)}
                            onDelete={(id) => handleActionChange('employeeActions', 'delete', id)}
                            placeholder="Add an employee action item..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => {setShowForm(false); setTalkingPoints(null);}} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-md">Cancel</button>
                        <button onClick={handleSaveSession} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md">Save Session</button>
                    </div>
                </div>
            )}
    
            <div className="space-y-4">
                {(member.coachingSessions || []).slice().reverse().map(session => (
                    <div key={session.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold text-white">Session on {new Date(session.sessionDate).toLocaleDateString()}</p>
                            <button onClick={() => downloadEmlFile(session, member, currentUser)} title="Download .eml" className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-300 my-2">{session.summary}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Leader Actions</h5>
                                <ul className="mt-1 space-y-1">
                                    {session.leaderActions.map(action => (
                                        <li key={action.id} className={`flex items-center gap-2 text-sm ${action.completed ? 'text-slate-500' : 'text-slate-300'}`}>
                                            <CheckSquareIcon className={`w-4 h-4 ${action.completed ? 'text-green-500' : 'text-slate-600'}`} />
                                            {action.text}
                                        </li>
                                    ))}
                                    {session.leaderActions.length === 0 && <li className="text-slate-500 text-xs italic">None</li>}
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Employee Actions</h5>
                                 <ul className="mt-1 space-y-1">
                                    {session.employeeActions.map(action => (
                                        <li key={action.id} className={`flex items-center gap-2 text-sm ${action.completed ? 'text-slate-500' : 'text-slate-300'}`}>
                                            <CheckSquareIcon className={`w-4 h-4 ${action.completed ? 'text-green-500' : 'text-slate-600'}`} />
                                            {action.text}
                                        </li>
                                    ))}
                                    {session.employeeActions.length === 0 && <li className="text-slate-500 text-xs italic">None</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
                {!member.coachingSessions || member.coachingSessions.length === 0 && !showForm ? (
                    <p className="text-center text-slate-500 py-6">No coaching sessions logged yet.</p>
                ) : null}
            </div>
        </div>
    );
};
