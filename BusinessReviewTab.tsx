
import React, { useState } from 'react';
import { Client, BusinessReview, ActionItem, TeamMember } from '../types';
import { PlusIcon, TrashIcon, CheckSquareIcon, SparklesIcon, LoaderIcon, DownloadIcon, FilePenIcon } from './Icons';
import { FollowUpEmailModal } from './FollowUpEmailModal';
import { api } from './services/api';

interface BusinessReviewTabProps {
    client: Client;
    onSave: (updatedClient: Client) => void;
    currentUser: TeamMember;
}

const initialSessionState: Omit<BusinessReview, 'id'> = {
    sessionDate: new Date().toISOString().split('T')[0],
    summary: '',
    leaderActions: [],
    clientActions: []
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

const handleApiError = (error: unknown, featureName: string) => {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    alert(`An error occurred while ${featureName}: ${errorMessage}`);
};

export const BusinessReviewTab: React.FC<BusinessReviewTabProps> = ({ client, onSave, currentUser }) => {
    const [showForm, setShowForm] = useState(false);
    const [newSession, setNewSession] = useState<Omit<BusinessReview, 'id'>>(initialSessionState);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [emailModalData, setEmailModalData] = useState<{ session: BusinessReview, draft: { subject: string, body: string } } | null>(null);

    const downloadEmlFile = (session: BusinessReview, client: Client, leader: TeamMember) => {
        const formattedDate = new Date(session.sessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const subject = `Business Review Summary - ${client.name} - ${formattedDate}`;

        const formatActions = (actions: ActionItem[]): string => {
            if (actions.length === 0) return '<li>No action items.</li>';
            return actions.map(a => `<li>${a.completed ? '✅' : '☐'} ${a.text}</li>`).join('');
        };

        const htmlBody = `
            <html>
                <body style="font-family: sans-serif; line-height: 1.6;">
                    <h2 style="color: #333;">Business Review Summary</h2>
                    <p><strong>Client:</strong> ${client.name}</p>
                    <p><strong>Leader:</strong> ${leader.name}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <hr>
                    <h3>Summary</h3>
                    <p>${session.summary.replace(/\n/g, '<br>')}</p>
                    <h3>Action Items</h3>
                    <strong>Our Actions:</strong>
                    <ul>${formatActions(session.leaderActions)}</ul>
                    <strong>Client Actions:</strong>
                    <ul>${formatActions(session.clientActions)}</ul>
                </body>
            </html>
        `;

        const emlContent = [
            `From: ${leader.email}`,
            `To: ${client.contactInfo.email}`,
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
        a.download = `BR_${client.name.replace(' ', '_')}_${session.sessionDate}.eml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleActionChange = (type: 'leaderActions' | 'clientActions', action: 'add' | 'toggle' | 'delete', payload: string) => {
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

        const sessionToSave: BusinessReview = {
            ...newSession,
            id: `br-session-${Date.now()}`
        };

        const updatedClient: Client = {
            ...client,
            businessReviews: [...(client.businessReviews || []), sessionToSave]
        };
        onSave(updatedClient);
        setShowForm(false);
        setNewSession(initialSessionState);
    };
    
    const handleAiSuggestActions = async () => {
        if (!newSession.summary) {
            alert("Please provide a session summary first to get AI suggestions.");
            return;
        }
        setIsAiLoading(true);
        try {
            const data = await api.suggestReviewActions(newSession.summary, client.name);
            
            if (data.leaderActions && Array.isArray(data.leaderActions)) {
                const newLeaderActions = data.leaderActions.map((text: string) => ({ id: `action-l-${Date.now()}-${Math.random()}`, text, completed: false }));
                setNewSession(prev => ({...prev, leaderActions: [...prev.leaderActions, ...newLeaderActions] }));
            }
            if (data.clientActions && Array.isArray(data.clientActions)) {
                const newClientActions = data.clientActions.map((text: string) => ({ id: `action-c-${Date.now()}-${Math.random()}`, text, completed: false }));
                 setNewSession(prev => {
                    const existingActions = new Set(prev.clientActions.map(a => a.text));
                    const uniqueNewActions = newClientActions.filter(a => !existingActions.has(a.text));
                    return {...prev, clientActions: [...prev.clientActions, ...uniqueNewActions] };
                });
            }

        } catch (error) {
            handleApiError(error, "suggesting actions");
        } finally {
            setIsAiLoading(false);
        }
    };
    
     const handleDraftFollowup = async (session: BusinessReview) => {
        setIsAiLoading(true);
        try {
             const draft = await api.draftFollowUpEmail(
                 {
                    summary: session.summary,
                    leaderActions: session.leaderActions,
                    clientActions: session.clientActions,
                    sessionDate: session.sessionDate
                }, 
                client.name, 
                currentUser.name
             );
            setEmailModalData({ session, draft });

        } catch (error) {
            handleApiError(error, "drafting email");
        } finally {
            setIsAiLoading(false);
        }
     }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Business Reviews</h3>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors hover:bg-indigo-700">
                        <PlusIcon className="w-5 h-5" />
                        Add New Review
                    </button>
                )}
            </div>
    
            {showForm && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                    <h4 className="font-semibold text-white">New Review Details</h4>
                    <div>
                        <label htmlFor="sessionDate" className="block text-sm font-medium text-slate-300 mb-1">Review Date</label>
                        <input type="date" id="sessionDate" value={newSession.sessionDate} onChange={e => setNewSession(p => ({...p, sessionDate: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white"/>
                    </div>
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-slate-300 mb-1">Review Summary</label>
                        <div className="relative">
                            <textarea id="summary" value={newSession.summary} onChange={e => setNewSession(p => ({...p, summary: e.target.value}))} rows={3} className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-white"/>
                            <div className="absolute bottom-2 right-2">
                                <button type="button" onClick={handleAiSuggestActions} disabled={isAiLoading || !newSession.summary}
                                    className="flex items-center gap-1 text-xs bg-purple-600/50 hover:bg-purple-600 text-white font-semibold py-1 px-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait">
                                    {isAiLoading ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                                    Suggest
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Our Action Items</label>
                        <ActionItemInput 
                            actions={newSession.leaderActions}
                            onAdd={(text) => handleActionChange('leaderActions', 'add', text)}
                            onToggle={(id) => handleActionChange('leaderActions', 'toggle', id)}
                            onDelete={(id) => handleActionChange('leaderActions', 'delete', id)}
                            placeholder="Add a new action item..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Client Action Items</label>
                        <ActionItemInput 
                            actions={newSession.clientActions}
                            onAdd={(text) => handleActionChange('clientActions', 'add', text)}
                            onToggle={(id) => handleActionChange('clientActions', 'toggle', id)}
                            onDelete={(id) => handleActionChange('clientActions', 'delete', id)}
                            placeholder="Add a client action item..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setShowForm(false)} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-md">Cancel</button>
                        <button onClick={handleSaveSession} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md">Save Review</button>
                    </div>
                </div>
            )}
    
            <div className="space-y-4">
                {(client.businessReviews || []).slice().reverse().map(session => (
                    <div key={session.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold text-white">Review on {new Date(session.sessionDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDraftFollowup(session)} disabled={isAiLoading} title="Draft Follow-up Email" className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50">
                                    {isAiLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <FilePenIcon className="w-5 h-5" />}
                                </button>
                                <button onClick={() => downloadEmlFile(session, client, currentUser)} title="Download .eml" className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 my-2">{session.summary}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Our Actions</h5>
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
                                <h5 className="text-xs font-bold text-slate-400 uppercase">Client Actions</h5>
                                 <ul className="mt-1 space-y-1">
                                    {session.clientActions.map(action => (
                                        <li key={action.id} className={`flex items-center gap-2 text-sm ${action.completed ? 'text-slate-500' : 'text-slate-300'}`}>
                                            <CheckSquareIcon className={`w-4 h-4 ${action.completed ? 'text-green-500' : 'text-slate-600'}`} />
                                            {action.text}
                                        </li>
                                    ))}
                                    {session.clientActions.length === 0 && <li className="text-slate-500 text-xs italic">None</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
                {!client.businessReviews || client.businessReviews.length === 0 && !showForm ? (
                    <p className="text-center text-slate-500 py-6">No business reviews logged yet.</p>
                ) : null}
            </div>

            {emailModalData && (
                <FollowUpEmailModal
                    isOpen={!!emailModalData}
                    onClose={() => setEmailModalData(null)}
                    client={client}
                    leader={currentUser}
                    session={emailModalData.session}
                    initialDraft={emailModalData.draft}
                />
            )}
        </div>
    );
};
