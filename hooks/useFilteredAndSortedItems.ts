

import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

interface UseFilteredAndSortedItemsOptions<T> {
  initialSortKey: keyof T;
  initialSortDirection?: SortDirection;
  searchKeys: (keyof T)[];
  searchTerm: string;
}

export const useFilteredAndSortedItems = <T extends { [key: string]: any }>(
  items: T[],
  {
    initialSortKey,
    initialSortDirection = 'asc',
    searchKeys = [],
    searchTerm = '',
  }: Partial<UseFilteredAndSortedItemsOptions<T>> & { initialSortKey: keyof T }
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initialSortKey,
    direction: initialSortDirection,
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filteredAndSortedItems = useMemo(() => {
    let sortableItems = [...items];

    // Filter logic
    const activeFilters = Object.entries(filters).filter(([, value]) => 
      value && value !== 'all' && (!Array.isArray(value) || value.length > 0)
    );
    
    if (activeFilters.length > 0) {
        sortableItems = sortableItems.filter(item => {
            return activeFilters.every(([key, filterValue]) => {
                const itemValue = item[key as keyof T];

                if (Array.isArray(filterValue)) { // Multi-select filter (e.g., tags)
                    if (Array.isArray(itemValue)) { // Item property is also an array
                      return filterValue.some(v => itemValue.includes(v));
                    }
                    return false;
                }
      
                if (Array.isArray(itemValue)) {
                    return itemValue.includes(filterValue);
                }
      
                return itemValue === filterValue;
            });
        });
    }

    // Search logic
    if (searchTerm && searchKeys?.length) {
      const lowercasedFilter = searchTerm.toLowerCase();
      sortableItems = sortableItems.filter(item => {
        return searchKeys.some(key => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowercasedFilter);
          }
          if(Array.isArray(value)) {
            return value.some(val => String(val).toLowerCase().includes(lowercasedFilter));
          }
          return false;
        });
      });
    }

    // Sort logic
    sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA === undefined || valB === undefined) return 0;

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
        } else if(typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
        } else {
            comparison = String(valA).localeCompare(String(valB));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sortableItems;
  }, [items, searchTerm, sortConfig, filters, searchKeys]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  return {
    filteredAndSortedItems,
    sortConfig,
    requestSort,
    filters,
    setFilters
  };
};
