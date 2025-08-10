
import React, { useRef, useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useToasts } from '../hooks/useToasts';
import { UploadIcon, DownloadIcon, DatabaseIcon, AlertTriangleIcon } from './Icons';
import { PageHeader } from './ui/PageHeader';

export const DataManagement: React.FC = () => {
    const { handleExportAllData, handleImportAllData } = useDataContext();
    const { addToast } = useToasts();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [lastExported, setLastExported] = useState<Date | null>(null);

    const onImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileSelected = (file: File | null) => {
        if (file) {
            if (file.type === 'application/json') {
                try {
                    handleImportAllData(file);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "An unknown error occurred during import.";
                    addToast(message, 'error');
                }
            } else {
                 addToast('Invalid file type. Please upload a .json file.', 'error');
            }
        }
    };

    const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelected(event.target.files?.[0] || null);
        // Reset file input to allow re-importing the same file
        if(event.target) {
            event.target.value = '';
        }
    };
    
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelected(e.dataTransfer.files?.[0] || null);
        e.dataTransfer.clearData();
    };
    
    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(true);
    };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    };
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
    };

    const handleExportClick = () => {
        handleExportAllData();
        setLastExported(new Date());
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Data Management"
                description="Manage your workspace data, import/export backups, and reset to mock data."
                icon={<DatabaseIcon className="w-6 h-6"/>}
            />

            <div className="mt-6 p-6 bg-core-bg-soft rounded-xl border border-core-border max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Section */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                            <DownloadIcon className="w-6 h-6 text-core-accent" />
                            <h3 className="text-xl font-bold text-core-text-primary">Export Workspace</h3>
                        </div>
                        <p className="text-core-text-secondary text-sm mb-4 flex-grow">
                            Download a complete snapshot of your teams, accounts, tasks, and knowledge base articles. Keep it somewhere safe!
                        </p>
                        {lastExported && (
                            <p className="text-xs text-core-text-secondary/70 mb-4">Last exported: {lastExported.toLocaleString()}</p>
                        )}
                        <button
                            onClick={handleExportClick}
                            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg transition-colors bg-core-bg hover:bg-core-border text-core-text-primary border border-core-border"
                        >
                           <DownloadIcon className="w-5 h-5"/> Export All Data
                        </button>
                    </div>

                    {/* Import Section */}
                     <div className="flex flex-col">
                         <div className="flex items-center gap-3 mb-3">
                            <UploadIcon className="w-6 h-6 text-red-400" />
                            <h3 className="text-xl font-bold text-core-text-primary">Import Workspace</h3>
                        </div>
                        <div
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            className={`flex-grow flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-core-accent bg-core-accent/10' : 'border-core-border bg-core-bg/50'}`}
                        >
                            <DatabaseIcon className="w-12 h-12 text-core-text-secondary/50 mb-2"/>
                            <p className="font-semibold text-core-text-primary">Drag & drop your .json file here</p>
                            <p className="text-core-text-secondary text-sm">or</p>
                             <button
                                onClick={onImportClick}
                                className="mt-2 text-sm font-semibold text-core-accent hover:text-core-accent-hover"
                            >
                                browse to select a file
                            </button>
                        </div>
                        <div className="mt-4 text-xs text-red-800 dark:text-red-300 bg-red-500/10 p-2 rounded-md border border-red-500/20 flex items-start gap-2">
                            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                            <span><span className="font-bold">WARNING:</span> Importing a file will overwrite all current data. An automatic backup will be created first.</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={onFileInputChange}
            />
        </div>
    );
};