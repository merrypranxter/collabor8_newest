
export interface PersonaCard {
  id: string;
  display_name: string;
  folderId?: string;
  gender?: 'male' | 'female' | 'neutral';
  voice: {
    bio: string;
    mannerisms: string;
    lexicon: string[];
  };
  knowledge_mode: {
    basis: "original" | "fictional" | "public_figure_emulation";
    sources_allowed: string[];
    citation_style: "none" | "inline" | "footnote";
  };
  constraints: {
    avoid_claims: string[];
    disallowed_topics: string[];
  };
  style: {
    tone: string;
    formatting: string;
    temperature_bias: number;
  };
  goals: string[];
  tool_prefs: {
    use_web: boolean;
    use_code: boolean;
    use_math: boolean;
    plugins: string[];
  };
  memory_file: string; // Not used in this implementation
}

export type DebateStyle = "Design Studio" | "Socratic Drill" | "Red Team vs Blue Team" | "Research Court" | "Braintrust Jam";
export type OutputMode = "consensus_report" | "options_menu" | "research_plan" | "prompt_pack" | "transcript";
export type AppMode = "Normal" | "Unhinged" | "ShootTheShit";

export interface ModeConfig {
  name: AppMode;
  temperature: number;
  guardrails_profile: "strict" | "fiction_sandbox";
  shadow_referee: boolean;
  prefix_tag: string | null;
  disclaimer: string | null;
  max_rounds: number;
  visuals: string;
}

export interface FileAttachment {
  url: string; // Blob URL for preview
  mimeType: string;
  name: string;
  geminiUri?: string; // Set after backend upload
}

export interface ArenaSession {
  topic: string;
  instructions: string;
  personas: string[]; // array of persona IDs
  debate_style: DebateStyle;
  output_mode: OutputMode;
  mode: AppMode;
  useWebSearch?: boolean;
  files?: FileAttachment[];
  model?: string;
}

export interface ConversationTurn {
  personaId: string;
  personaName: string;
  message: string;
  files?: FileAttachment[];
}

export interface PersonaFolder {
  id: string;
  name: string;
}

export interface SessionRecipe {
  id: string;
  name: string;
  config: ArenaSession;
}
