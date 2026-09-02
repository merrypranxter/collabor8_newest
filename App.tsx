import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArenaSession, PersonaCard, ConversationTurn, PersonaFolder, SessionRecipe } from './types';
import { INITIAL_PERSONAS, DEBATE_STYLES, OUTPUT_MODES, MODES } from './constants';
import { generateDebateTurnStream } from './services/geminiService';

import PersonaPanel from './components/PersonaPanel';
import SessionConfigPanel from './components/SessionConfigPanel';
import ConversationPanel from './components/ConversationPanel';
import PersonaBuilder from './components/PersonaBuilder';
import PersonaCreationChoiceModal from './components/PersonaCreationChoiceModal';
import PersonaGeneratorModal from './components/PersonaGeneratorModal';
import { Sparkles, SlidersHorizontal, Users } from 'lucide-react';

type ActiveTab = 'config' | 'personas';

const App: React.FC = () => {
    // State for personas, including user-created ones
    const [personas, setPersonas] = useState<PersonaCard[]>(() => {
        try {
            const saved = localStorage.getItem('collabor8_personas');
            if (saved) {
                const parsed = JSON.parse(saved);
                const uniquePersonas = [];
                const seen = new Set();
                for (const p of parsed) {
                    if (!seen.has(p.id)) {
                        uniquePersonas.push(p);
                        seen.add(p.id);
                    }
                }
                return uniquePersonas;
            }
        } catch (e) {
            console.error('Failed to load personas', e);
        }
        return INITIAL_PERSONAS;
    });

    const [folders, setFolders] = useState<PersonaFolder[]>(() => {
        try {
            const saved = localStorage.getItem('collabor8_folders');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load folders', e);
        }
        return [{ id: 'default', name: 'General' }];
    });

    const [recipes, setRecipes] = useState<SessionRecipe[]>(() => {
        try {
            const saved = localStorage.getItem('collabor8_recipes');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load recipes', e);
        }
        return [];
    });
    
    // State for the session configuration form
    const [sessionConfig, setSessionConfig] = useState<ArenaSession>(() => {
        try {
            const saved = localStorage.getItem('collabor8_sessionConfig');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load session config', e);
        }
        return {
            topic: 'Should humanity prioritize colonizing Mars or solving Earth\'s problems?',
            instructions: 'Focus on the ethical, economic, and technological implications. Each persona should argue from their core principles.',
            personas: [INITIAL_PERSONAS[0].id, INITIAL_PERSONAS[2].id],
            debate_style: 'Socratic Drill',
            output_mode: 'consensus_report',
            mode: 'Normal',
        };
    });

    useEffect(() => {
        localStorage.setItem('collabor8_personas', JSON.stringify(personas));
    }, [personas]);

    useEffect(() => {
        localStorage.setItem('collabor8_folders', JSON.stringify(folders));
    }, [folders]);

    useEffect(() => {
        localStorage.setItem('collabor8_recipes', JSON.stringify(recipes));
    }, [recipes]);

    useEffect(() => {
        localStorage.setItem('collabor8_sessionConfig', JSON.stringify(sessionConfig));
    }, [sessionConfig]);

    // State for the live conversation
    const [conversation, setConversation] = useState<ConversationTurn[]>(() => {
        try {
            const saved = localStorage.getItem('collabor8_conversation');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load conversation', e);
        }
        return [];
    });
    const [currentTurn, setCurrentTurn] = useState<ConversationTurn | null>(null);
    
    // Application view state ('configuring', 'running', 'finished')
    const [appState, setAppState] = useState<'configuring' | 'running'>(() => {
        return (localStorage.getItem('collabor8_appState') as 'configuring' | 'running') || 'configuring';
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAutoPlay, setIsAutoPlay] = useState<boolean>(() => {
        const saved = localStorage.getItem('collabor8_isAutoPlay');
        return saved ? saved === 'true' : true;
    });
    const [nextPersonaIndex, setNextPersonaIndex] = useState<number>(() => {
        const saved = localStorage.getItem('collabor8_nextPersonaIndex');
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        localStorage.setItem('collabor8_conversation', JSON.stringify(conversation));
    }, [conversation]);

    useEffect(() => {
        localStorage.setItem('collabor8_appState', appState);
    }, [appState]);

    useEffect(() => {
        localStorage.setItem('collabor8_isAutoPlay', isAutoPlay.toString());
    }, [isAutoPlay]);

    useEffect(() => {
        localStorage.setItem('collabor8_nextPersonaIndex', nextPersonaIndex.toString());
    }, [nextPersonaIndex]);
    const abortControllerRef = useRef<AbortController | null>(null);

    // State to manage which modal is open
    const [modalState, setModalState] = useState<'closed' | 'choice' | 'manual' | 'generate'>('closed');
    const [editingPersona, setEditingPersona] = useState<PersonaCard | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('config');

    // Derived state to get the config for the current mode (Normal, Unhinged, etc.)
    const currentModeConfig = MODES.find(m => m.name === sessionConfig.mode);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
    }, []);

    const generateNextAITurn = useCallback(async (currentHistory: ConversationTurn[], nextIndex: number) => {
        if (sessionConfig.personas.length === 0) return;
        setIsLoading(true);
        setError(null);
        
        abortControllerRef.current = new AbortController();

        const personaId = sessionConfig.personas[nextIndex % sessionConfig.personas.length];
        const persona = personas.find(p => p.id === personaId);

        if (!persona) {
            setIsLoading(false);
            return;
        }
        
        const currentPersonaTurn: ConversationTurn = {
            personaId: persona.id,
            personaName: persona.display_name,
            message: '',
        };
        setCurrentTurn(currentPersonaTurn);

        try {
            const stream = generateDebateTurnStream(
                sessionConfig,
                persona,
                personas.filter(p => sessionConfig.personas.includes(p.id)),
                currentHistory,
                currentModeConfig
            );
            
            let fullMessage = '';
            for await (const chunk of stream) {
                if (abortControllerRef.current?.signal.aborted) break;
                fullMessage += chunk;
                setCurrentTurn({ ...currentPersonaTurn, message: fullMessage });
            }

            if (fullMessage.trim()) {
                const finalTurn = { ...currentPersonaTurn, message: fullMessage };
                setConversation(prev => [...prev, finalTurn]);
                if (!abortControllerRef.current?.signal.aborted) {
                    setNextPersonaIndex((nextIndex + 1) % sessionConfig.personas.length);
                }
            }

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || "An error occurred during the debate.");
            }
        } finally {
            setCurrentTurn(null);
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [sessionConfig, personas, currentModeConfig]);

    useEffect(() => {
        if (appState === 'running' && isAutoPlay && !isLoading && !currentTurn) {
            // Trigger next turn after a short delay for natural feel
            const timer = setTimeout(() => {
                generateNextAITurn(conversation, nextPersonaIndex);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [appState, isAutoPlay, isLoading, currentTurn, conversation, nextPersonaIndex, generateNextAITurn]);

    const handleStartSession = () => {
        if (sessionConfig.personas.length < 1) {
            setError("Please select at least one persona to start the session.");
            return;
        }
        
        // Force cleanup of any stuck state
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setCurrentTurn(null);
        setIsLoading(false);
        setError(null);
        
        setAppState('running');
        setConversation([]);
        setNextPersonaIndex(0);
        setIsAutoPlay(true);
    };

    const handleEndSession = () => {
        stopGeneration();
        setAppState('configuring');
    };

    const handleUserMessage = (message: string, files?: any[]) => {
        stopGeneration(); // Pause any ongoing AI turn to let user speak immediately
        const userTurn: ConversationTurn = {
            personaId: 'user',
            personaName: 'You',
            message,
            files
        };
        const newHistory = [...conversation, userTurn];
        setConversation(newHistory);
        
        // If autoplay is off, we might want to turn it on, or just trigger the next turn
        // Let's just generate the next AI turn in response
        setTimeout(() => {
            generateNextAITurn(newHistory, nextPersonaIndex);
        }, 500);
    };

    const handleReturnToConfig = () => {
        stopGeneration();
        setError(null);
        setAppState('configuring');
    };

    // Persona CRUD Handlers
    const handleAddPersona = () => {
        setEditingPersona(null);
        setModalState('choice');
    };
    
    const handleEditPersona = (persona: PersonaCard) => {
        setEditingPersona(persona);
        setModalState('manual');
    };

    const handleDeletePersona = (personaId: string) => {
        setPersonas(personas.filter(p => p.id !== personaId));
        setSessionConfig(prev => ({
            ...prev,
            personas: prev.personas.filter(id => id !== personaId)
        }));
    };

    const handleSavePersona = (personaData: PersonaCard | Omit<PersonaCard, 'id'>) => {
        if ('id' in personaData && personaData.id) {
            setPersonas(personas.map(p => p.id === personaData.id ? personaData : p));
        } else {
            const newPersona: PersonaCard = {
                ...personaData,
                id: `${personaData.display_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            };
            setPersonas([...personas, newPersona]);
        }
        setModalState('closed');
        setEditingPersona(null);
    };

    const isSessionActive = appState !== 'configuring';

    const TabButton: React.FC<{tabName: ActiveTab, currentTab: ActiveTab, onClick: () => void, icon: React.ReactNode, children: React.ReactNode}> = ({ tabName, currentTab, onClick, icon, children }) => {
        const isActive = currentTab === tabName;
        return (
            <button
                onClick={onClick}
                className={`relative py-4 text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center space-x-2 transition-all duration-300 w-1/2 ${
                    isActive
                    ? 'text-white'
                    : 'text-brand-text-dark hover:text-white'
                }`}
            >
                {icon}
                <span>{children}</span>
                {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-silver-gradient shadow-[0_1px_8px_rgba(168,176,192,0.5)]"></span>
                )}
            </button>
        );
    };

    return (
        <div className="bg-chrome-gradient min-h-screen font-sans text-brand-text-light flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-brand-border/60 flex-shrink-0 bg-brand-surface/75 backdrop-blur-md shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-silver-gradient flex items-center justify-center shadow-glow">
                        <Sparkles className="w-5 h-5 text-brand-bg-start" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-silver-gradient">Collabor8 AI</h1>
                        <p className="text-[10px] font-mono text-brand-text-dark uppercase tracking-widest mt-0.5">Generative Mind Gym</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-surface border border-brand-border text-brand-text-light">
                        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-brand-primary animate-pulse"></span>
                        {sessionConfig.model === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro Engine' : 'Gemini 2.5 Flash Engine'}
                    </span>
                </div>
            </header>

            <main className="flex-grow max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden">
                {/* Left Panel: Main Content (Conversation) */}
                <div className="lg:col-span-7 xl:col-span-8 overflow-hidden flex flex-col h-[78vh] lg:h-[82vh]">
                   <ConversationPanel
                        session={sessionConfig}
                        conversation={currentTurn ? [...conversation, currentTurn] : conversation}
                        personas={personas}
                        isLoading={isLoading}
                        error={error}
                        isSessionActive={isSessionActive}
                        onStopGeneration={stopGeneration}
                        onReturnToConfig={handleReturnToConfig}
                        onUserMessage={handleUserMessage}
                        isAutoPlay={isAutoPlay}
                        setIsAutoPlay={setIsAutoPlay}
                        onNextTurn={() => generateNextAITurn(conversation, nextPersonaIndex)}
                    />
                </div>

                {/* Right Panel: Tabbed Config and Personas */}
                <div className="lg:col-span-5 xl:col-span-4 bg-brand-surface border border-brand-border rounded-xl overflow-hidden flex flex-col h-[78vh] lg:h-[82vh] shadow-xl">
                    <div className="flex border-b border-brand-border flex-shrink-0 bg-brand-surface/30">
                        <TabButton tabName="config" currentTab={activeTab} onClick={() => setActiveTab('config')} icon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
                            Controls
                        </TabButton>
                        <TabButton tabName="personas" currentTab={activeTab} onClick={() => setActiveTab('personas')} icon={<Users className="w-3.5 h-3.5" />}>
                            Cast Profiles
                        </TabButton>
                    </div>
                    <div className="flex-grow overflow-hidden bg-brand-surface/20">
                        {activeTab === 'config' && (
                            <SessionConfigPanel
                                config={sessionConfig}
                                setConfig={setSessionConfig}
                                personas={personas}
                                isLoading={isLoading}
                                onStart={handleStartSession}
                                debateStyles={DEBATE_STYLES}
                                outputModes={OUTPUT_MODES}
                                modes={MODES}
                                isDisabled={isSessionActive}
                                recipes={recipes}
                                setRecipes={setRecipes}
                                hasActiveSession={conversation.length > 0}
                                onResumeSession={() => {
                                    setIsAutoPlay(false);
                                    setAppState('running');
                                }}
                            />
                        )}
                        {activeTab === 'personas' && (
                            <PersonaPanel
                                personas={personas}
                                onAdd={handleAddPersona}
                                onEdit={handleEditPersona}
                                onDelete={handleDeletePersona}
                                isDisabled={isSessionActive}
                                folders={folders}
                                setFolders={setFolders}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Modals for Persona Creation/Editing */}
            {modalState === 'choice' && (
                <PersonaCreationChoiceModal
                    onClose={() => setModalState('closed')}
                    onChooseManual={() => setModalState('manual')}
                    onChooseGenerate={() => setModalState('generate')}
                />
            )}

            {modalState === 'manual' && (
                <PersonaBuilder
                    persona={editingPersona}
                    onSave={handleSavePersona}
                    onClose={() => { setModalState('closed'); setEditingPersona(null); }}
                    folders={folders}
                />
            )}
            
            {modalState === 'generate' && (
                <PersonaGeneratorModal
                    onSave={handleSavePersona}
                    onClose={() => setModalState('closed')}
                />
            )}
        </div>
    );
};

export default App;
