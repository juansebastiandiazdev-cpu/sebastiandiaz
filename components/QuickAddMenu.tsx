


import React, { useState } from 'react';
import { PlusIcon, ListIcon, UsersIcon, UserPlusIcon } from './Icons';

export const QuickAddMenu: React.FC<{onSelect: (type: 'task' | 'account' | 'team') => void}> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const options = [
        { type: 'task', label: 'New Task', icon: <ListIcon size={20}/> },
        { type: 'account', label: 'New Account', icon: <UsersIcon size={20}/> },
        { type: 'team', label: 'New Team Member', icon: <UserPlusIcon size={20}/> },
    ];

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(prev => !prev)} 
                className="w-14 h-14 flex items-center justify-center bg-core-accent rounded-full text-white shadow-lg shadow-core-accent/20 hover:bg-core-accent-hover hover:scale-110 hover:shadow-core-accent/40 transition-all duration-300"
                title="Quick Add"
            >
                <PlusIcon className={`w-7 h-7 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}/>
            </button>
            {isOpen && (
                <div className="absolute right-0 bottom-16 w-56 bg-core-bg-soft/80 backdrop-blur-lg border border-core-border rounded-lg shadow-2xl z-20 animate-fade-in-up">
                    <div className="p-2">
                        {options.map(opt => (
                            <button 
                                key={opt.type}
                                onClick={() => { onSelect(opt.type as any); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 p-2.5 rounded-md text-sm text-core-text-primary hover:bg-core-bg transition-colors"
                            >
                                <span className="text-core-text-secondary">{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
