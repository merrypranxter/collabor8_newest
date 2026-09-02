import React from 'react';
import Modal from './ui/Modal';
import { Sparkles, FileText } from 'lucide-react';

interface PersonaCreationChoiceModalProps {
  onClose: () => void;
  onChooseManual: () => void;
  onChooseGenerate: () => void;
}

const PersonaCreationChoiceModal: React.FC<PersonaCreationChoiceModalProps> = ({
  onClose,
  onChooseManual,
  onChooseGenerate,
}) => {
  return (
    <Modal title="Create a New Persona" onClose={onClose}>
      <p className="text-brand-text-dark mb-6 text-sm">How would you like to create your new persona? Select an approach below to get started.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <button 
          onClick={onChooseManual} 
          className="group flex flex-col items-center justify-center p-8 bg-brand-surface border border-brand-border hover:border-brand-primary/40 rounded-xl transition-all duration-300 text-center focus:outline-none focus:ring-2 focus:ring-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/5 hover:-translate-y-1"
        >
          <div className="p-4 bg-brand-bg rounded-full border border-brand-border group-hover:border-brand-primary/30 group-hover:bg-brand-primary/10 transition-colors duration-300 mb-4">
            <FileText className="w-8 h-8 text-brand-primary group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-white text-lg transition-colors group-hover:text-brand-primary">Create Manually</h3>
          <p className="text-sm text-brand-text-dark mt-2 text-center leading-relaxed">Fill out a detailed profile form to define every aspect of your custom AI persona.</p>
        </button>

        <button 
          onClick={onChooseGenerate} 
          className="group flex flex-col items-center justify-center p-8 bg-brand-surface border border-brand-border hover:border-brand-secondary/40 rounded-xl transition-all duration-300 text-center focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 hover:shadow-lg hover:shadow-brand-secondary/5 hover:-translate-y-1"
        >
          <div className="p-4 bg-brand-bg rounded-full border border-brand-border group-hover:border-brand-secondary/30 group-hover:bg-brand-secondary/10 transition-colors duration-300 mb-4">
            <Sparkles className="w-8 h-8 text-brand-secondary group-hover:text-white transition-colors" />
          </div>
          <h3 className="font-bold text-white text-lg transition-colors group-hover:text-brand-secondary">Generate with AI</h3>
          <p className="text-sm text-brand-text-dark mt-2 text-center leading-relaxed">Describe the persona you want in simple words, and let AI automatically build the profile.</p>
        </button>

      </div>
    </Modal>
  );
};

export default PersonaCreationChoiceModal;
