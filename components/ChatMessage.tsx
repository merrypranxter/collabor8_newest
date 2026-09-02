/**
 * @file ChatMessage.tsx
 * A presentational component responsible for rendering a single turn in a conversation.
 * It displays the persona's avatar icon, their display name, and the message content.
 * It also shows a loading indicator for messages that are currently being generated.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ConversationTurn, PersonaCard } from '../types';
import { getAvatarGradient, getInitials } from './PersonaPanel';
import { Volume2, Square } from 'lucide-react';

interface ChatMessageProps {
  turn: ConversationTurn;
  persona: PersonaCard | undefined;
  isGenerating?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ turn, persona, isGenerating = false }) => {
  const name = persona?.display_name || turn.personaName;
  const initials = getInitials(name);
  const gradient = turn.personaId === 'user' ? 'from-slate-600 to-slate-800 text-white' : getAvatarGradient(name);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!turn.message) return;

    const utterance = new SpeechSynthesisUtterance(turn.message);
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a voice that matches the gender
    let preferredVoice = null;
    if (persona?.gender === 'female') {
      preferredVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'));
    } else if (persona?.gender === 'male') {
      preferredVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex'));
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Set up events
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex items-start space-x-3.5 mb-1.5 ${turn.personaId === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-xs shadow-md border border-white/10 ${isGenerating ? 'animate-pulse ring-2 ring-brand-primary/30' : ''}`}>
        {initials}
      </div>
      <div className={`flex-grow bg-brand-surface/40 backdrop-blur-sm p-4 rounded-xl border border-brand-border/60 shadow-md ${turn.personaId === 'user' ? 'bg-brand-primary/10 border-brand-primary/20' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm text-white tracking-wide">{name}</p>
          <div className="flex items-center space-x-2">
            {persona?.style?.tone && (
              <span className="text-[10px] font-mono text-brand-text-dark px-2 py-0.5 rounded-full bg-brand-bg/50 border border-brand-border/20">
                {persona.style.tone.split(',')[0]}
              </span>
            )}
            {!isGenerating && turn.message && (
              <button 
                onClick={toggleSpeech}
                className={`p-1 rounded-full transition-colors ${isPlaying ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-dark hover:text-white hover:bg-white/5'}`}
                title="Read aloud"
              >
                {isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        
        {/* Render Files */}
        {turn.files && turn.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
             {turn.files.map((file, idx) => {
                 if (file.mimeType.startsWith('image/')) {
                     return <img key={idx} src={file.url} alt={file.name} className="max-w-[200px] max-h-[200px] rounded-lg border border-brand-border object-cover" />;
                 }
                 if (file.mimeType.startsWith('video/')) {
                     return <video key={idx} src={file.url} controls className="max-w-[300px] max-h-[200px] rounded-lg border border-brand-border" />;
                 }
                 return (
                     <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2 bg-brand-bg border border-brand-border rounded-lg hover:border-brand-primary transition-all">
                         <span className="text-xs text-brand-text-light">{file.name}</span>
                     </a>
                 );
             })}
          </div>
        )}

        <div className="text-brand-text-light text-sm whitespace-pre-wrap mt-2 leading-relaxed font-sans prose prose-invert max-w-none">
          {turn.message ? (
             <p>{turn.message}</p>
          ) : (
            <div className="flex space-x-1.5 items-center py-1">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
