
import React, { useState } from 'react';
import { PersonaCard, PersonaFolder } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Button from './ui/Button';
import Select from './ui/Select';

interface PersonaBuilderProps {
  persona: PersonaCard | null;
  onSave: (persona: PersonaCard) => void;
  onClose: () => void;
  folders: PersonaFolder[];
}

const BLANK_PERSONA: Omit<PersonaCard, 'id'> = {
  display_name: '',
  folderId: 'default',
  gender: 'neutral',
  voice: { bio: '', mannerisms: '', lexicon: [] },
  knowledge_mode: { basis: 'original', sources_allowed: [], citation_style: 'none' },
  constraints: { avoid_claims: [], disallowed_topics: [] },
  style: { tone: '', formatting: 'Standard prose', temperature_bias: 0.0 },
  goals: [],
  tool_prefs: { use_web: false, use_code: false, use_math: false, plugins: [] },
  memory_file: '',
};

const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ persona, onSave, onClose, folders }) => {
  const [formData, setFormData] = useState<PersonaCard | Omit<PersonaCard, 'id'>>(persona || BLANK_PERSONA);

  const handleChange = <T,>(section: keyof PersonaCard, field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value,
      },
    }));
  };

  const handleTopLevelChange = (field: keyof PersonaCard, value: any) => {
     setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = () => {
    // Basic validation
    if (!formData.display_name) {
        alert("Display name is required.");
        return;
    }
    onSave(formData as PersonaCard);
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="bg-brand-bg border border-brand-border/40 p-5 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-widest font-mono border-b border-brand-border/20 pb-2">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <Modal title={persona ? 'Edit Persona Profile' : 'Create Custom Persona'} onClose={onClose}>
      <div className="space-y-5 max-h-[68vh] overflow-y-auto pr-2 pb-1">
        <p className="text-brand-text-dark text-xs leading-relaxed -mt-2">Define your AI actor's voice, constraints, and knowledge structure to shape how they converse.</p>
        {renderSection('Core Identity', (
          <div className="space-y-4">
            <Input label="Display Name" value={formData.display_name} onChange={e => handleTopLevelChange('display_name', e.target.value)} placeholder="e.g., Ada Lovelace" required/>
            
            <div className="grid grid-cols-2 gap-4">
              <Select label="Folder" value={formData.folderId || 'default'} onChange={e => handleTopLevelChange('folderId', e.target.value)}>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
              <Select label="Gender (for read aloud)" value={formData.gender || 'neutral'} onChange={e => handleTopLevelChange('gender', e.target.value)}>
                <option value="neutral">Neutral / Unspecified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </Select>
            </div>

            <Textarea label="Biography / Background" value={formData.voice.bio} onChange={e => handleChange<PersonaCard['voice']>('voice', 'bio', e.target.value)} rows={3} placeholder="A short biography outlining their history, expertise, and mindset."/>
          </div>
        ))}

        {renderSection('Voice & Mannerisms', (
          <div className="space-y-4">
            <Textarea label="Speech Mannerisms" value={formData.voice.mannerisms} onChange={e => handleChange<PersonaCard['voice']>('voice', 'mannerisms', e.target.value)} rows={2} placeholder="Speech patterns, common opening lines, or stylistic eccentricities."/>
            <Input label="Lexicon (comma-separated keywords)" value={formData.voice.lexicon.join(', ')} onChange={e => handleChange<PersonaCard['voice']>('voice', 'lexicon', e.target.value.split(',').map(s => s.trim()))} placeholder="quantum, spacetime, perspective"/>
            <Input label="Tone" value={formData.style.tone} onChange={e => handleChange<PersonaCard['style']>('style', 'tone', e.target.value)} placeholder="e.g., Contemplative, sarcastic, highly analytical"/>
          </div>
        ))}

        {renderSection('Knowledge & Rules', (
          <div className="space-y-4">
            <Select label="Knowledge Basis" value={formData.knowledge_mode.basis} onChange={e => handleChange<PersonaCard['knowledge_mode']>('knowledge_mode', 'basis', e.target.value)}>
                <option value="original">Original Mindset (General AI Wisdom)</option>
                <option value="fictional">Fictional Character (Imagination Sandbox)</option>
                <option value="public_figure_emulation">Public Figure Emulation (Historical Accuracy)</option>
            </Select>
            <Input label="Avoid Claims on (comma-separated)" value={formData.constraints.avoid_claims.join(', ')} onChange={e => handleChange<PersonaCard['constraints']>('constraints', 'avoid_claims', e.target.value.split(',').map(s => s.trim()))} placeholder="e.g., financial advice, medical claims" />
            <Input label="Disallowed Topics (comma-separated)" value={formData.constraints.disallowed_topics.join(', ')} onChange={e => handleChange<PersonaCard['constraints']>('constraints', 'disallowed_topics', e.target.value.split(',').map(s => s.trim()))} placeholder="e.g., sports, celebrity drama" />
          </div>
        ))}

         {renderSection('Core Motivation & Goals', (
            <div>
              <Textarea label="Objectives (one per line)" value={formData.goals.join('\n')} onChange={e => handleTopLevelChange('goals', e.target.value.split('\n'))} rows={3} placeholder="What does this persona strive to achieve or highlight during a debate?"/>
            </div>
         ))}
      </div>

      <div className="mt-6 flex justify-end space-x-3 border-t border-brand-border/40 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Profile</Button>
      </div>
    </Modal>
  );
};

export default PersonaBuilder;
