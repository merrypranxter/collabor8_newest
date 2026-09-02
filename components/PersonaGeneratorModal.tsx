import React, { useState } from 'react';
import { PersonaCard } from '../types';
import Modal from './ui/Modal';
import Textarea from './ui/Textarea';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { generatePersonaFromPrompt } from '../services/geminiService';
import { Sparkles, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface PersonaGeneratorModalProps {
  onSave: (persona: Omit<PersonaCard, 'id'>) => void;
  onClose: () => void;
}

const PersonaGeneratorModal: React.FC<PersonaGeneratorModalProps> = ({ onSave, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedPersona, setGeneratedPersona] = useState<Omit<PersonaCard, 'id'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedPersona(null);
    try {
      const personaData = await generatePersonaFromPrompt(prompt);
      setGeneratedPersona(personaData);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedPersona) {
      onSave(generatedPersona);
    }
  };
  
  const handleTryAgain = () => {
    setGeneratedPersona(null);
    setError(null);
  }

  return (
    <Modal title="Generate Persona with AI" onClose={onClose}>
      <div className="space-y-5">
        {!generatedPersona && (
          <div className="space-y-4">
            <Textarea
              label="Describe the persona you want to create"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., A cynical noir detective from the 1940s who has seen it all, but still has a soft spot for the truth."
              rows={4}
              disabled={isLoading}
            />
            <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full h-11">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Spinner />
                  <span>Crafting profile details...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Persona Profile</span>
                </div>
              )}
            </Button>
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-red-950/40 border border-red-900/40 rounded-xl text-sm text-red-200">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {generatedPersona && !isLoading && (
          <div className="space-y-4">
            <div className="p-5 bg-brand-bg border border-brand-border rounded-xl max-h-[45vh] overflow-y-auto space-y-4 shadow-inner">
              <div className="border-b border-brand-border/40 pb-3">
                <span className="text-xs uppercase tracking-widest text-brand-secondary font-mono">Generated Identity</span>
                <h3 className="text-xl font-bold text-white mt-1">{generatedPersona.display_name}</h3>
              </div>
              <div className="space-y-3.5 text-sm">
                <div>
                  <h4 className="font-semibold text-brand-text-dark text-xs uppercase tracking-wider font-mono">Biography</h4>
                  <p className="text-brand-text-light mt-1 leading-relaxed">{generatedPersona.voice.bio}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-text-dark text-xs uppercase tracking-wider font-mono">Speech Mannerisms</h4>
                  <p className="text-brand-text-light mt-1 leading-relaxed">{generatedPersona.voice.mannerisms}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <h4 className="font-semibold text-brand-text-dark text-xs uppercase tracking-wider font-mono">Tone style</h4>
                    <p className="text-brand-text-light mt-1">{generatedPersona.style.tone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-text-dark text-xs uppercase tracking-wider font-mono">Lexicon keywords</h4>
                    <p className="text-brand-text-light mt-1 font-mono text-xs truncate" title={generatedPersona.voice.lexicon.join(', ')}>
                      {generatedPersona.voice.lexicon.join(', ')}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-text-dark text-xs uppercase tracking-wider font-mono">Core Debate Goals</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-brand-text-light">
                    {generatedPersona.goals.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-3 border-t border-brand-border/40 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {generatedPersona && (
          <>
            <Button variant="secondary" onClick={handleTryAgain} className="flex items-center space-x-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            <Button onClick={handleSave} className="flex items-center space-x-1.5">
              <Check className="w-4 h-4" />
              <span>Save Persona</span>
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PersonaGeneratorModal;
