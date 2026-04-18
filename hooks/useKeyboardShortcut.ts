import { useEffect } from 'react';

type KeyCombination = {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
};

export function useKeyboardShortcut(shortcuts: { combo: KeyCombination, callback: () => void }[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore shortcuts if the user is typing in an input or textarea
            const target = event.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            
            for (const { combo, callback } of shortcuts) {
                const isKeyMatch = event.key.toLowerCase() === combo.key.toLowerCase();
                const isCtrlMatch = !!combo.ctrl === (event.ctrlKey || event.metaKey);
                const isShiftMatch = !!combo.shift === event.shiftKey;
                const isAltMatch = !!combo.alt === event.altKey;

                if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch) {
                    // Only allow Ctrl/Meta shortcuts globally; single keys are blocked if in input
                    if (isInput && !combo.ctrl && !combo.meta) {
                        continue;
                    }
                    
                    event.preventDefault();
                    callback();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}
