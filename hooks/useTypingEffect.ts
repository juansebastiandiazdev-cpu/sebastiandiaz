
import { useState, useEffect } from 'react';

export const useTypingEffect = (textToType: string, speed = 20): string => {
    const [typedText, setTypedText] = useState('');

    useEffect(() => {
        if (!textToType) {
            setTypedText('');
            return;
        }
        setTypedText(''); // Reset before starting
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < textToType.length) {
                setTypedText(prev => prev + textToType.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, speed);

        return () => clearInterval(typingInterval);
    }, [textToType, speed]);

    return typedText;
};
