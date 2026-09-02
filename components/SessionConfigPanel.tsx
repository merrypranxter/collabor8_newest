import React, { useState, useRef } from 'react';
import { ArenaSession, PersonaCard, DebateStyle, OutputMode, AppMode, ModeConfig, SessionRecipe } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import { Sparkles, HelpCircle, Flame, Swords, Compass, Save, Download, Paperclip, Play } from 'lucide-react';
import Spinner from './ui/Spinner';
import { uploadFile } from '../services/geminiService';

interface SessionConfigPanelProps {
  config: ArenaSession;
  setConfig: React.Dispatch<React.SetStateAction<ArenaSession>>;
  personas: PersonaCard[];
  isLoading: boolean;
  onStart: () => void;
  debateStyles: DebateStyle[];
  outputModes: OutputMode[];
  modes: ModeConfig[];
  isDisabled: boolean;
  recipes?: SessionRecipe[];
  setRecipes?: (recipes: SessionRecipe[]) => void;
  hasActiveSession?: boolean;
  onResumeSession?: () => void;
}

const SessionConfigPanel: React.FC<SessionConfigPanelProps> = ({
  config,
  setConfig,
  personas,
  isLoading,
  onStart,
  debateStyles,
  outputModes,
  modes,
  isDisabled,
  recipes = [],
  setRecipes,
  hasActiveSession,
  onResumeSession
}) => {
  const [recipeName, setRecipeName] = useState('');
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isConfirmingNew, setIsConfirmingNew] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          try {
              let newFiles = config.files || [];
              for (const file of Array.from(e.target.files)) {
                  const res = await uploadFile(file);
                  newFiles = [...newFiles, {
                      url: URL.createObjectURL(file),
                      name: res.originalName,
                      mimeType: res.mimeType,
                      geminiUri: res.uri
                  }];
              }
              setConfig({ ...config, files: newFiles });
          } catch (err) {
              console.error("Upload error", err);
          } finally {
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const handleSaveRecipe = () => {
    if (recipeName.trim() && setRecipes) {
      const newRecipe: SessionRecipe = {
        id: `recipe-${Date.now()}`,
        name: recipeName.trim(),
        config: { ...config }
      };
      setRecipes([...recipes, newRecipe]);
      setRecipeName('');
      setIsSavingRecipe(false);
    }
  };

  const handleLoadRecipe = (recipeId: string) => {
    if (recipeId) {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        setConfig(recipe.config);
      }
    }
  };

  const handlePersonaToggle = (personaId: string) => {
    const newPersonas = config.personas.includes(personaId)
      ? config.personas.filter(id => id !== personaId)
      : [...config.personas, personaId];
    setConfig({ ...config, personas: newPersonas });
  };

  const selectedMode = modes.find(m => m.name === config.mode);

  return (
    <fieldset disabled={isDisabled} className="h-full flex flex-col disabled:opacity-50 transition-all duration-300">
        <div className="p-5 space-y-5 overflow-y-auto flex-grow">
          {/* Recipes Section */}
          <div className="flex flex-col space-y-2 bg-brand-surface/40 p-3 rounded-lg border border-brand-border/40">
             <div className="flex justify-between items-center">
                 <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark font-mono">Session Recipes</label>
                 <button onClick={() => setIsSavingRecipe(!isSavingRecipe)} className="text-brand-primary hover:text-white transition-colors" title="Save current config as recipe">
                     <Save className="w-4 h-4" />
                 </button>
             </div>
             {isSavingRecipe && (
                 <div className="flex items-center space-x-2 mt-2">
                     <input 
                         type="text" 
                         value={recipeName}
                         onChange={e => setRecipeName(e.target.value)}
                         placeholder="Recipe name..."
                         className="flex-grow bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-xs text-brand-text-light focus:border-brand-primary outline-none"
                     />
                     <Button onClick={handleSaveRecipe} size="sm" variant="primary" className="py-1.5 px-3 text-xs">Save</Button>
                 </div>
             )}
             <select 
                 className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm text-brand-text-light focus:border-brand-primary outline-none"
                 onChange={e => handleLoadRecipe(e.target.value)}
                 value=""
             >
                 <option value="" disabled>Load a saved recipe...</option>
                 {recipes.map(r => (
                     <option key={r.id} value={r.id}>{r.name}</option>
                 ))}
             </select>
          </div>

          <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-1.5 font-mono">Debate Topic</label>
              <Input
                value={config.topic}
                onChange={e => setConfig({ ...config, topic: e.target.value })}
                placeholder="What should the AI participants discuss?"
              />
          </div>
          <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-1.5 font-mono">Context & Directives</label>
              <Textarea
                value={config.instructions}
                onChange={e => setConfig({ ...config, instructions: e.target.value })}
                placeholder="Direct specific constraints, focus areas, or expected goals for the participants..."
                rows={3}
              />
          </div>
          <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-1.5 font-mono flex justify-between items-center">
                  <span>Session Attachments</span>
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-brand-primary hover:text-white flex items-center space-x-1.5 transition-colors disabled:opacity-50">
                      {isUploading ? <Spinner className="w-3 h-3 border-brand-primary" /> : <Paperclip className="w-3 h-3" />}
                      <span className="text-[10px]">Add File</span>
                  </button>
              </label>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
              {(config.files && config.files.length > 0) ? (
                  <div className="flex flex-col gap-2 mt-2">
                      {config.files.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-brand-text-light">
                              <span className="truncate max-w-[200px]">{f.name}</span>
                              <button 
                                  onClick={() => setConfig({ ...config, files: config.files!.filter((_, index) => index !== i) })}
                                  className="text-brand-text-dark hover:text-red-400 transition-colors"
                              >
                                  ×
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-[11px] text-brand-text-dark leading-relaxed">No files attached to this session.</p>
              )}
          </div>
          <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark font-mono">Participating Personas</label>
                <span className="text-[10px] font-mono font-semibold bg-brand-border/40 text-brand-text-light px-2 py-0.5 rounded-full">
                  {config.personas.length} Selected
                </span>
              </div>
              <p className="text-[11px] text-brand-text-dark mb-2.5 leading-relaxed">Select characters to engage in this brainstorm/discussion.</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
              {personas.map(p => {
                const isSelected = config.personas.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePersonaToggle(p.id)}
                    className={`text-xs px-3 py-2.5 rounded-xl transition-all duration-300 border text-left flex flex-col justify-between ${
                      isSelected
                      ? 'bg-brand-primary/10 border-brand-primary text-white font-bold shadow-md shadow-brand-primary/5'
                      : 'bg-brand-surface hover:bg-brand-surface/80 border-brand-border text-brand-text-dark hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.display_name}</span>
                    <span className={`text-[9px] font-mono mt-1 font-semibold ${isSelected ? 'text-brand-secondary' : 'text-brand-text-dark/60'}`}>
                      {isSelected ? '✓ Active' : '+ Join'}
                    </span>
                  </button>
                );
              })}
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-1.5 font-mono">Debate Style</label>
                  <Select
                    value={config.debate_style}
                    onChange={e => setConfig({ ...config, debate_style: e.target.value as DebateStyle })}
                  >
                    {debateStyles.map(style => <option key={style} value={style}>{style}</option>)}
                  </Select>
              </div>
              <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-1.5 font-mono">Output Mode</label>
                  <Select
                    value={config.output_mode}
                    onChange={e => setConfig({ ...config, output_mode: e.target.value as OutputMode })}
                  >
                    {outputModes.map(mode => <option key={mode} value={mode}>{mode.replace(/_/g, ' ')}</option>)}
                  </Select>
              </div>
          </div>
          <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-1.5 font-mono mt-1">AI Model</label>
              <Select
                value={(config.model && (config.model.includes('3.1-flash') || config.model.includes('3.6-flash'))) ? 'gemini-2.5-flash' : (config.model || 'gemini-2.5-flash')}
                onChange={e => setConfig({ ...config, model: e.target.value })}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Cheap, Default)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Advanced, More Expensive)</option>
              </Select>
          </div>
          <div className="border-t border-brand-border/40 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-dark mb-2.5 font-mono">Engine Temperature Mode</label>
              <div className="grid grid-cols-3 gap-2">
              {modes.map(mode => {
                const isSelected = config.mode === mode.name;
                return (
                  <button
                    key={mode.name}
                    onClick={() => setConfig({ ...config, mode: mode.name })}
                    className={`px-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border-2 ${
                      isSelected
                      ? `${mode.visuals === 'border-brand-primary' ? 'border-brand-primary bg-brand-primary/10' : mode.visuals === 'border-brand-secondary' ? 'border-brand-secondary bg-brand-secondary/10' : 'border-emerald-500 bg-emerald-500/10'} text-white shadow-md`
                      : 'border-transparent bg-brand-surface/40 hover:bg-brand-surface text-brand-text-dark hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {mode.name === 'Normal' && <Compass className="w-4 h-4" />}
                      {mode.name === 'Unhinged' && <Flame className="w-4 h-4" />}
                      {mode.name === 'ShootTheShit' && <Swords className="w-4 h-4" />}
                      <span>{mode.name}</span>
                    </div>
                  </button>
                );
              })}
              </div>
              {selectedMode?.disclaimer && (
                <div className="text-xs text-brand-text-dark mt-3 p-3 bg-brand-bg/60 border border-brand-border/50 rounded-xl leading-relaxed flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5" />
                  <span>{selectedMode.disclaimer}</span>
                </div>
              )}
          </div>
          <div className="border-t border-brand-border/40 pt-4 mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                      type="checkbox"
                      checked={config.useWebSearch || false}
                      onChange={(e) => setConfig({ ...config, useWebSearch: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-brand-primary bg-brand-bg border-brand-border rounded focus:ring-brand-primary"
                  />
                  <span className="text-sm font-bold tracking-wider text-brand-text-light font-mono uppercase">Enable Web Search</span>
              </label>
              <p className="text-xs text-brand-text-dark mt-1.5 ml-8">Allow personas to search the web for real-time information (e.g. GitHub links, current events).</p>
          </div>
        </div>
        <div className="p-4 mt-auto border-t border-brand-border/60 bg-brand-surface/30 space-y-3">
            {hasActiveSession && (
                <Button onClick={onResumeSession} variant="secondary" className="w-full h-12 border-emerald-500/50 hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-400">
                    <Play className="w-5 h-5 mr-2" />
                    <span className="text-sm font-bold tracking-wider">Resume Previous Session</span>
                </Button>
            )}
            <Button onClick={() => {
                if (hasActiveSession && !isConfirmingNew) {
                    setIsConfirmingNew(true);
                    return;
                }
                setIsConfirmingNew(false);
                onStart();
            }} disabled={isLoading || config.personas.length < 1} className={`w-full h-12 shadow-glow ${hasActiveSession ? 'bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50' : ''}`}>
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                <span className="text-sm font-bold tracking-wider">
                    {isLoading ? 'Engaging Engine...' : (isConfirmingNew ? 'Click Again to Confirm (Overwrites Session)' : hasActiveSession ? 'Start New Simulation' : 'Launch Simulation')}
                </span>
            </Button>
        </div>
    </fieldset>
  );
};

export default SessionConfigPanel;
