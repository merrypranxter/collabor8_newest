import React, { useState, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';

interface DictationButtonProps {
    onTranscript: (text: string) => void;
    className?: string;
}

const DictationButton: React.FC<DictationButtonProps> = ({ onTranscript, className = '' }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = false; // only final results for simplicity, or true for real-time
            
            rec.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    onTranscript(finalTranscript + ' ');
                }
            };

            rec.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            setRecognition(rec);
        }
    }, [onTranscript]);

    const toggleListening = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!recognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            setIsListening(true);
        }
    }, [recognition, isListening]);

    if (!recognition) return null;

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`p-1.5 rounded-md transition-colors ${
                isListening 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse' 
                    : 'text-brand-text-dark hover:text-brand-primary hover:bg-brand-surface/80'
            } ${className}`}
            title={isListening ? "Stop dictation" : "Start dictation"}
        >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
    );
};

export default DictationButton;
