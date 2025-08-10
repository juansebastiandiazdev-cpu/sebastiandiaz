import React, { useEffect, useState, useRef } from 'react';
import { ScheduledTask, Task } from '../types';
import { GOALS_CONFIG } from '../constants';
import { useToasts } from '../hooks/useToasts';

const WORK_HOURS_START = 8;
const WORK_HOURS_END = 18;
const TOTAL_HOURS = WORK_HOURS_END - WORK_HOURS_START;
const HOUR_HEIGHT = 80; // pixels

const getTaskColor = (task: Task) => {
    const category = task.taskType === 'event' ? 'event' : task.weeklyGoalCategory;
    const goal = GOALS_CONFIG.find(g => g.id === category);
    return goal ? goal.color : '#6b7280'; // gray-500
};

interface ScheduleViewProps {
    scheduledTasks: ScheduledTask[];
    onDragStart: (e: React.DragEvent, taskId: string, origin: 'scheduled') => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, dayIndex: number, hour: number, minutes: number) => void;
    onTaskClick: (task: Task) => void;
    onQuickAddTask: (day: number, startMinutes: number) => void;
}

const CurrentTimeIndicator: React.FC = () => {
    const [top, setTop] = useState(0);
    const indicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const hours = now.getHours() + now.getMinutes() / 60;
            const newTop = (hours - WORK_HOURS_START) * HOUR_HEIGHT;
            setTop(newTop);
        };

        updatePosition();
        const intervalId = setInterval(updatePosition, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, []);

    if (top < 0 || top > TOTAL_HOURS * HOUR_HEIGHT) return null;

    return (
        <div ref={indicatorRef} className="absolute left-0 right-0 h-0.5 bg-red-500 z-10" style={{ top: `${top}px` }}>
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
        </div>
    );
};


export const ScheduleView: React.FC<ScheduleViewProps> = ({ scheduledTasks, onDragStart, onDragOver, onDrop, onTaskClick, onQuickAddTask }) => {
    const { addToast } = useToasts();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeLabels = Array.from({ length: TOTAL_HOURS }, (_, i) => {
        const hour = WORK_HOURS_START + i;
        return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`;
    });

    return (
        <div className="flex-1 bg-core-bg-soft rounded-xl border border-core-border overflow-auto relative">
            <div className="flex" style={{ minWidth: '900px' }}>
                {/* Time Ruler */}
                <div className="w-20 flex-shrink-0">
                    <div className="h-10"></div> {/* Spacer for day names */}
                    {timeLabels.map((time) => (
                        <div key={time} className="h-20 flex items-start justify-end pr-2 text-xs text-core-text-secondary -mt-2 pt-2">
                           {time}
                        </div>
                    ))}
                </div>
                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-5 bg-core-border">
                    {days.map((day, dayIndex) => (
                        <div key={day} className="bg-core-bg-soft relative border-r border-core-border" onDragOver={onDragOver}>
                            <div className="h-10 text-center font-semibold text-core-text-primary sticky top-0 bg-core-bg-soft/80 backdrop-blur-sm py-2 border-b border-core-border z-20">{day}</div>
                             <div className="relative">
                                {/* Hour cells for dropping and clicking */}
                                {Array.from({ length: TOTAL_HOURS * 4 }).map((_, i) => {
                                    const hour = Math.floor(i / 4) + WORK_HOURS_START;
                                    const minutes = (i % 4) * 15;
                                    return (
                                        <div
                                            key={i}
                                            className="h-5 border-b border-dashed border-core-border/30 hover:bg-core-accent/5"
                                            onDrop={(e) => onDrop(e, dayIndex, hour, minutes)}
                                            onClick={() => onQuickAddTask(dayIndex, (hour * 60) + minutes)}
                                        />
                                    );
                                })}
                                {dayIndex === 0 && <CurrentTimeIndicator />}
                             </div>
                            {/* Scheduled Tasks */}
                            {scheduledTasks
                                .filter(task => task.day === dayIndex)
                                .map(task => {
                                    const top = ((task.startMinutes / 60) - WORK_HOURS_START) * HOUR_HEIGHT;
                                    const height = (task.durationMinutes / 60) * HOUR_HEIGHT;
                                    const color = getTaskColor(task);
                                    const isEvent = task.taskType === 'event';

                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task.id, 'scheduled')}
                                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                            className={`absolute left-1 right-1 p-2 rounded-lg text-white shadow-lg overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-white z-20`}
                                            style={{
                                                top: `${top}px`,
                                                height: `${height - 2}px`,
                                                backgroundColor: isEvent ? `${color}40` : `${color}`,
                                                borderLeft: `4px solid ${color}`
                                            }}
                                            title={task.title}
                                        >
                                            <p className="font-bold text-xs leading-tight">{task.title}</p>
                                            {!isEvent && <p className="text-xs opacity-80 leading-snug truncate">{task.description}</p>}
                                        </div>
                                    )
                                })
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
