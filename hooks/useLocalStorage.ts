
import { useState, useEffect } from 'react';

function getValueFromLocalStorage<T>(key: string, initialValue: T | (() => T)): T {
    try {
        const item = window.localStorage.getItem(key);
        if(item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
    }
    
    return initialValue instanceof Function ? initialValue() : initialValue;
}

export const useLocalStorage = <T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        return getValueFromLocalStorage(key, initialValue);
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};
