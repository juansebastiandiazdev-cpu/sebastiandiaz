
import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { ListIcon, LinkIcon } from './Icons';

interface TocItem {
    level: number;
    text: string;
    id: string;
}

interface TableOfContentsProps {
    content: string;
    backlinks: Article[];
    onBacklinkClick: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content, backlinks, onBacklinkClick }) => {
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState('');
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const headers = content.match(/^#{1,3}\s.*$/gm) || [];
        
        const items = headers.map(header => {
            const level = header.match(/^#+/)?.[0].length || 1;
            const text = header.replace(/^#+\s*/, '');
            const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            return { level, text, id };
        });
        setTocItems(items);

    }, [content]);

     useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        const contentArea = document.querySelector('.prose');
        if (!contentArea) return;

        observer.current = new IntersectionObserver(
            (entries) => {
                const intersectingEntries = entries.filter(entry => entry.isIntersecting);
                if (intersectingEntries.length > 0) {
                     // Get the one that's highest on the page
                    intersectingEntries.sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
                    setActiveId(intersectingEntries[0].target.id);
                }
            },
            { rootMargin: `0px 0px -80% 0px`, threshold: 0.1 }
        );

        const elements = contentArea.querySelectorAll('h1, h2, h3');
        elements.forEach((elem) => observer.current?.observe(elem));

        return () => observer.current?.disconnect();
    }, [tocItems]);
    
    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const contentArea = document.querySelector('.article-content-area'); // Target the scrollable container
        if(!contentArea) return;

        const headerElement = contentArea.querySelector(`[id="${targetId}"]`);
        if(headerElement) {
            headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    if (tocItems.length === 0 && backlinks.length === 0) {
        return null;
    }

    return (
        <aside className="w-72 h-full border-l border-core-border bg-core-bg-soft/50 p-6 flex-shrink-0 overflow-y-auto hidden xl:block">
            <div className="sticky top-6">
                {tocItems.length > 0 && (
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-core-text-secondary uppercase tracking-wider mb-3">
                            <ListIcon className="w-5 h-5" />
                            On this page
                        </h3>
                        <ul className="space-y-1 text-sm border-l-2 border-core-border">
                            {tocItems.map((item) => (
                                <li key={item.id}>
                                    <a
                                        href={`#${item.id}`}
                                        onClick={(e) => handleScrollTo(e, item.id)}
                                        className={`block border-l-2 transition-colors duration-200 py-1 -ml-0.5 ${activeId === item.id ? 'text-core-accent border-core-accent' : 'text-core-text-secondary border-transparent hover:text-core-text-primary hover:border-core-text-secondary'}`}
                                        style={{ paddingLeft: `${(item.level - 1) * 1 + 1}rem` }}
                                    >
                                        {item.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {backlinks.length > 0 && (
                    <div className={`${tocItems.length > 0 ? 'mt-8 pt-8 border-t border-core-border' : ''}`}>
                         <h3 className="flex items-center gap-2 text-sm font-semibold text-core-text-secondary uppercase tracking-wider mb-3">
                            <LinkIcon className="w-5 h-5" />
                            Linked Here
                        </h3>
                         <ul className="space-y-2 text-sm">
                            {backlinks.map((link) => (
                               <li key={link.id}>
                                   <button onClick={() => onBacklinkClick(link.id)} className="text-left text-core-text-secondary hover:text-core-text-primary transition-colors hover:underline">
                                       {link.title}
                                   </button>
                               </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </aside>
    );
};
