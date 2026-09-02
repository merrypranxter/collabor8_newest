import React, { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion } from 'motion/react';
import { ArenaSession, ConversationTurn, PersonaCard } from '../types';
import ChatMessage from './ChatMessage';
import Spinner from './ui/Spinner';
import Button from './ui/Button';
import { Share2, Copy, Download, Sparkles, StopCircle, ArrowLeft, Check, Terminal, FileText, Send, Paperclip, Play, Pause, FastForward } from 'lucide-react';
import { getAvatarGradient, getInitials } from './PersonaPanel';
import { uploadFile } from '../services/geminiService';
import DictationButton from './ui/DictationButton';

interface ConversationPanelProps {
  session: ArenaSession;
  conversation: ConversationTurn[];
  personas: PersonaCard[];
  isLoading: boolean;
  error: string | null;
  isSessionActive: boolean;
  onStopGeneration: () => void;
  onReturnToConfig: () => void;
  onUserMessage: (message: string, files?: any[]) => void;
  isAutoPlay: boolean;
  setIsAutoPlay: (val: boolean) => void;
  onNextTurn: () => void;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  session,
  conversation,
  personas,
  isLoading,
  error,
  isSessionActive,
  onStopGeneration,
  onReturnToConfig,
  onUserMessage,
  isAutoPlay,
  setIsAutoPlay,
  onNextTurn
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Copy Transcript');
  const [userText, setUserText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  const getPersonaById = (id: string) => personas.find(p => p.id === id);

  const formatTranscript = () => {
    let text = `Topic: ${session.topic}\n\n`;
    text += conversation.map(turn => `${turn.personaName}:\n${turn.message}`).join('\n\n---\n\n');
    return text;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formatTranscript()).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy Transcript'), 2000);
    });
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([formatTranscript()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collabor8-session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica');
    doc.setFontSize(16);
    doc.text(`Topic: ${session.topic}`, 10, 10);
    doc.setFontSize(11);
    const transcript = conversation.map(turn => `${turn.personaName}:\n${turn.message}`);
    const splitText = doc.splitTextToSize(transcript.join('\n\n---\n\n'), 180);
    doc.text(splitText, 10, 20);
    doc.save(`collabor8-session-${Date.now()}.pdf`);
    setIsExportMenuOpen(false);
  };

  if (!isSessionActive) {
    const activePersonas = personas.filter(p => session.personas.includes(p.id));

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-brand-surface/30 border border-brand-border/60 rounded-xl relative overflow-hidden min-h-[450px]">
          {/* Subtle glowing core design in standby */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative text-center max-w-md mx-auto space-y-5 flex flex-col items-center">
            <div className="p-4 bg-brand-surface/80 border border-brand-border rounded-2xl shadow-glow">
              <Sparkles className="w-10 h-10 text-brand-secondary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-wide">Ready for Discussion</h2>
              <p className="text-sm text-brand-text-dark leading-relaxed">
                Click <strong className="text-white">Launch Simulation</strong> in the side panel to begin the collaborative brainstorm session.
              </p>
            </div>

            {/* Selected Personas overview in standby */}
            {activePersonas.length > 0 && (
              <div className="bg-brand-surface/40 border border-brand-border/50 rounded-xl p-4 w-full text-left space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-dark font-mono block">Active Cast ({activePersonas.length})</span>
                <div className="flex flex-wrap gap-2">
                  {activePersonas.map(p => {
                    const gradient = getAvatarGradient(p.display_name);
                    const initials = getInitials(p.display_name);
                    return (
                      <div key={p.id} className="flex items-center space-x-1.5 bg-brand-bg/80 border border-brand-border/40 px-2.5 py-1 rounded-lg">
                        <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-[8px] font-bold`}>
                          {initials}
                        </div>
                        <span className="text-xs text-white font-medium truncate max-w-[120px]">{p.display_name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-brand-surface/90 border border-brand-border/80 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-brand-border/60 bg-brand-surface/30 backdrop-blur-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">Live Simulation</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white truncate" title={session.topic}>{session.topic}</h3>
          <p className="text-xs text-brand-text-dark line-clamp-1">{session.instructions}</p>
        </div>
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {isAutoPlay ? (
            <Button variant="secondary" size="sm" onClick={() => setIsAutoPlay(false)} className="border-red-500/30 hover:bg-red-950/20 hover:border-red-500 text-red-200">
              <StopCircle className="w-4 h-4 mr-1.5 text-red-400" />
              <span>Stop Auto-Play</span>
            </Button>
          ) : isLoading ? (
            <Button variant="secondary" size="sm" onClick={onStopGeneration} className="border-orange-500/30 hover:bg-orange-950/20 hover:border-orange-500 text-orange-200">
              <StopCircle className="w-4 h-4 mr-1.5 text-orange-400" />
              <span>Abort Turn</span>
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onReturnToConfig} className="hover:border-brand-primary/30">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Close</span>
          </Button>
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="p-2 rounded-lg bg-brand-surface border border-brand-border/60 hover:border-brand-primary/30 text-brand-text-dark hover:text-white transition-all duration-300 shadow-md"
              aria-label="Export conversation"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-52 bg-brand-surface border border-brand-border rounded-xl shadow-2xl z-50 p-1.5">
                  <button onClick={handleCopyToClipboard} className="w-full text-left px-3 py-2 text-xs text-brand-text-light hover:text-white hover:bg-white/5 rounded-lg flex items-center space-x-2 transition-all">
                    {copyStatus === 'Copied!' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copyStatus}</span>
                  </button>
                  <button onClick={handleDownloadTxt} className="w-full text-left px-3 py-2 text-xs text-brand-text-light hover:text-white hover:bg-white/5 rounded-lg flex items-center space-x-2 transition-all">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download TXT Transcript</span>
                  </button>
                  <button onClick={handleDownloadPdf} className="w-full text-left px-3 py-2 text-xs text-brand-text-light hover:text-white hover:bg-white/5 rounded-lg flex items-center space-x-2 transition-all">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Download PDF Report</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Body */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-5 space-y-4">
        {conversation.map((turn, index) => {
          const isLatestLoading = isLoading && index === conversation.length - 1 && !turn.message;
          return (
            <ChatMessage 
              key={index} 
              turn={turn} 
              persona={getPersonaById(turn.personaId)} 
              isGenerating={isLatestLoading}
            />
          );
        })}
        {isLoading && (
          <div className="flex items-center space-x-3 p-4 bg-brand-surface/20 border border-dashed border-brand-border/40 rounded-xl">
            <Spinner />
            <p className="text-xs text-brand-text-dark italic font-medium">Awaiting next persona formulation...</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-950/30 border border-red-900/40 text-red-200 rounded-xl text-sm flex items-start space-x-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
            <div>
              <p className="font-bold">Execution Error</p>
              <p className="text-xs text-red-300/85 mt-0.5">{error}</p>
            </div>
          </div>
        )}
        {!isLoading && !error && conversation.length > 0 && (
          <div className="text-center text-xs font-mono uppercase tracking-widest text-brand-text-dark/40 py-6 border-t border-brand-border/10">
            -- End of turn --
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-brand-surface/80 border-t border-brand-border/60">
          <div className="flex items-center space-x-2 mb-2">
             <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAutoPlay ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-surface border border-brand-border text-brand-text-dark hover:text-white'}`}
             >
                {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoPlay ? 'Auto-Play ON' : 'Auto-Play OFF'}</span>
             </button>
             {!isAutoPlay && !isLoading && (
                 <button onClick={onNextTurn} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/20 text-brand-primary text-xs font-bold hover:bg-brand-primary/30 transition-all">
                     <FastForward className="w-3.5 h-3.5" />
                     <span>Next Turn</span>
                 </button>
             )}
          </div>
          
          {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                  {attachedFiles.map((f, i) => (
                      <div key={i} className="text-[10px] bg-brand-primary/10 border border-brand-primary/30 px-2 py-1 rounded text-brand-primary">
                          {f.name}
                      </div>
                  ))}
              </div>
          )}
          
          <div className="flex items-end space-x-2">
              <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  multiple 
                  onChange={(e) => {
                      if (e.target.files) {
                          setAttachedFiles(Array.from(e.target.files));
                      }
                  }} 
              />
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-brand-surface border border-brand-border rounded-xl text-brand-text-dark hover:text-brand-primary hover:border-brand-primary transition-all"
              >
                  <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-grow relative">
                  <textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      onKeyDown={async (e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (!userText.trim() && attachedFiles.length === 0) return;
                              
                              let finalFiles: any[] = [];
                              if (attachedFiles.length > 0) {
                                  setIsUploading(true);
                                  try {
                                      for (const file of attachedFiles) {
                                          const res = await uploadFile(file);
                                          finalFiles.push({
                                              url: URL.createObjectURL(file), // for local preview
                                              name: res.originalName,
                                              mimeType: res.mimeType,
                                              geminiUri: res.uri
                                          });
                                      }
                                  } catch (err) {
                                      console.error("Upload error", err);
                                  } finally {
                                      setIsUploading(false);
                                  }
                              }

                              onUserMessage(userText, finalFiles.length > 0 ? finalFiles : undefined);
                              setUserText('');
                              setAttachedFiles([]);
                          }
                      }}
                      placeholder="Interject..."
                      className="w-full bg-brand-bg border border-brand-border rounded-xl pl-3 pr-10 py-3 text-sm text-brand-text-light placeholder-brand-text-dark/50 focus:outline-none focus:border-brand-primary resize-none min-h-[48px] max-h-32"
                      rows={1}
                  />
                  <div className="absolute right-1.5 top-2">
                      <DictationButton onTranscript={(text) => setUserText(prev => prev + (!prev.endsWith(' ') && !prev.endsWith('\n') && prev ? ' ' : '') + text.trim())} />
                  </div>
              </div>
              <button 
                  onClick={async () => {
                      if (!userText.trim() && attachedFiles.length === 0) return;
                      let finalFiles: any[] = [];
                      if (attachedFiles.length > 0) {
                          setIsUploading(true);
                          try {
                              for (const file of attachedFiles) {
                                  const res = await uploadFile(file);
                                  finalFiles.push({
                                      url: URL.createObjectURL(file),
                                      name: res.originalName,
                                      mimeType: res.mimeType,
                                      geminiUri: res.uri
                                  });
                              }
                          } catch (err) {
                              console.error("Upload error", err);
                          } finally {
                              setIsUploading(false);
                          }
                      }
                      onUserMessage(userText, finalFiles.length > 0 ? finalFiles : undefined);
                      setUserText('');
                      setAttachedFiles([]);
                  }}
                  disabled={isUploading || (!userText.trim() && attachedFiles.length === 0)}
                  className="p-3 bg-silver-gradient rounded-xl text-brand-bg-start transition-all disabled:opacity-50"
              >
                  {isUploading ? <Spinner /> : <Send className="w-5 h-5" />}
              </button>
          </div>
      </div>
    </div>
  );
};

export default ConversationPanel;