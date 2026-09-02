import React, { useState } from 'react';
import { PersonaCard, PersonaFolder } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import { Plus, Pencil, Trash2, User, FolderPlus, Folder as FolderIcon } from 'lucide-react';

interface PersonaPanelProps {
  personas: PersonaCard[];
  onAdd: () => void;
  onEdit: (persona: PersonaCard) => void;
  onDelete: (personaId: string) => void;
  isDisabled: boolean;
  folders?: PersonaFolder[];
  setFolders?: (folders: PersonaFolder[]) => void;
}

// Generate premium gradients based on persona name
export const getAvatarGradient = (name: string): string => {
  const gradients = [
    'from-gray-300 to-gray-500 shadow-gray-400/10 text-gray-900',
    'from-slate-400 to-slate-600 shadow-slate-500/10 text-white',
    'from-zinc-300 to-zinc-500 shadow-zinc-400/10 text-zinc-900',
    'from-neutral-400 to-neutral-600 shadow-neutral-500/10 text-white',
    'from-stone-300 to-stone-500 shadow-stone-400/10 text-stone-900',
    'from-gray-500 to-gray-700 shadow-gray-500/10 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export const getInitials = (name: string): string => {
  const cleanName = name.replace(/\(Emulation\)/gi, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
};

const PersonaPanel: React.FC<PersonaPanelProps> = ({ personas, onAdd, onEdit, onDelete, isDisabled, folders = [], setFolders }) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim() && setFolders) {
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim()
      };
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const personasByFolder = folders.map(folder => ({
    ...folder,
    personas: personas.filter(p => (p.folderId || 'default') === folder.id)
  }));

  // Add any unassigned personas to default
  const assignedPersonaIds = new Set(personasByFolder.flatMap(f => f.personas.map(p => p.id)));
  const unassigned = personas.filter(p => !assignedPersonaIds.has(p.id));
  if (unassigned.length > 0) {
    const defaultFolder = personasByFolder.find(f => f.id === 'default');
    if (defaultFolder) {
      defaultFolder.personas = [...defaultFolder.personas, ...unassigned];
    } else {
      personasByFolder.push({ id: 'default', name: 'General', personas: unassigned });
    }
  }

  return (
    <fieldset disabled={isDisabled} className="h-full flex flex-col disabled:opacity-60 transition-opacity">
      <div className="p-4 flex-shrink-0 flex items-center space-x-2">
          <Button onClick={onAdd} size="md" className="flex-grow h-11">
              <Plus className="w-4 h-4 mr-2" />
              <span>New Persona</span>
          </Button>
          <Button onClick={() => setIsCreatingFolder(!isCreatingFolder)} size="md" variant="secondary" className="h-11 px-3">
              <FolderPlus className="w-4 h-4" />
          </Button>
      </div>

      {isCreatingFolder && (
        <div className="px-4 pb-4 flex items-center space-x-2">
          <input 
            type="text" 
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="flex-grow bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-light focus:border-brand-primary outline-none"
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
          />
          <Button onClick={handleCreateFolder} size="sm" variant="primary">Add</Button>
        </div>
      )}

      <div className="space-y-6 flex-grow overflow-y-auto px-4 pb-6">
        {personasByFolder.map(folder => {
          if (folder.personas.length === 0) return null;
          
          return (
            <div key={folder.id} className="space-y-3">
              <div className="flex items-center space-x-2 text-brand-text-dark">
                <FolderIcon className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">{folder.name}</h4>
              </div>
              
              <div className="space-y-3.5">
                {folder.personas.map(p => {
                  const initials = getInitials(p.display_name);
                  const gradient = getAvatarGradient(p.display_name);

                  return (
                    <Card key={p.id} className="p-4 bg-brand-surface/40 hover:bg-brand-surface/90 border border-brand-border/60 hover:border-brand-primary/30 transition-all duration-300 shadow-md">
                      <div className="flex items-start space-x-3.5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} shadow-md flex items-center justify-center font-bold text-sm tracking-wider flex-shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-brand-text-light text-sm truncate">{p.display_name}</h3>
                            <div className="flex space-x-1 flex-shrink-0 ml-2">
                               <button 
                                 onClick={() => onEdit(p)} 
                                 className="text-brand-text-dark hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200"
                                 title="Edit Persona"
                               >
                                  <Pencil className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if (deletingId === p.id) {
                                     onDelete(p.id);
                                     setDeletingId(null);
                                   } else {
                                     setDeletingId(p.id);
                                   }
                                 }}
                                 className={`${deletingId === p.id ? 'text-red-500 bg-red-500/10' : 'text-brand-text-dark hover:text-red-400 hover:bg-white/5'} p-1.5 rounded-lg transition-all duration-200`}
                                 title={deletingId === p.id ? "Click again to confirm" : "Delete Persona"}
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                          </div>
                          <p className="text-xs text-brand-text-dark mt-1.5 leading-relaxed line-clamp-2" title={p.voice.bio}>
                            {p.voice.bio}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-brand-bg text-brand-secondary border border-brand-border/20">
                              {p.knowledge_mode.basis.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-brand-bg text-brand-text-dark border border-brand-border/20">
                              {p.style.tone.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
        {personas.length === 0 && (
          <div className="text-center py-12 bg-brand-surface/20 border border-dashed border-brand-border rounded-xl px-4">
            <User className="w-10 h-10 mx-auto text-brand-border mb-3" />
            <p className="font-bold text-brand-text-light text-sm">No personas found</p>
            <p className="text-xs text-brand-text-dark mt-1 leading-relaxed">Create a custom character first to let them join the conversation.</p>
          </div>
        )}
      </div>
    </fieldset>
  );
};

export default PersonaPanel;
