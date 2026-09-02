import express from "express";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';

let currentDir = '';
try {
  currentDir = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {
  currentDir = __dirname;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Setup Multer for file uploads
  const uploadDir = path.join(currentDir, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const upload = multer({ dest: uploadDir });

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Upload file to Gemini route
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const mimeType = req.file.mimetype;
      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const displayName = req.file.originalname.substring(0, 50);

      // We use the new @google/genai File API:
      const uploadResult = await ai.files.upload({
        file: filePath,
        config: {
          mimeType: mimeType,
          displayName: displayName
        }
      });
      
      // Delete local file after upload
      fs.unlinkSync(filePath);

      // Return the URI needed for generation
      res.json({ uri: uploadResult.uri, name: uploadResult.name, originalName, mimeType });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ error: error.message || 'File upload failed' });
    }
  });

  // Generate turn stream route
  app.post('/api/generate-turn', async (req, res) => {
    try {
      const { session, persona, allPersonas, conversation, modeConfig } = req.body;

      const personaList = allPersonas.map((p: any) => `- ${p.display_name}`).join('\n');

      const systemInstruction = `
You are an AI actor playing the role of a specific persona in a multi-round debate/conversation.
Your goal is to embody this persona as faithfully as possible and contribute according to the rules.

**SESSION TOPIC:** ${session.topic}
**SESSION INSTRUCTIONS:** ${session.instructions}
**DEBATE STYLE:** ${session.debate_style}
**YOUR PERSONA:** ${persona.display_name}

--- PERSONA DETAILS ---
**BIO:** ${persona.voice.bio}
**MANNERISMS & SPEECH PATTERNS:** ${persona.voice.mannerisms}
**LEXICON (Keywords to use):** ${persona.voice.lexicon.join(', ')}
**TONE:** ${persona.style.tone}
**GOALS IN THIS DEBATE:** ${persona.goals.join(', ')}
**CONSTRAINTS (What to avoid):**
- Avoid claims: ${persona.constraints.avoid_claims.join(', ')}
- Disallowed topics: ${persona.constraints.disallowed_topics.join(', ')}
--- END PERSONA DETAILS ---

**DEBATE PARTICIPANTS:**
${personaList}

**RULES:**
1.  **Stay in character.** Your response MUST be from the perspective of ${persona.display_name}. Do not break character. Do not refer to yourself as an AI.
2.  **Address the topic and others.** Your contribution must be relevant to the ongoing discussion. Address what other participants (including the user) have said or provided.
3.  **React to files.** The user may upload files. Incorporate what you observe in the conversation history about these files.
4.  **Be concise but thorough.** Each turn should be conversational and natural.
5.  **Engage with others.** Refer to and build upon the points made by other participants.
${modeConfig?.prefix_tag ? `\n**MODE:** This is a special mode. Your response will be prefixed with "${modeConfig.prefix_tag}". Embody the spirit of "${modeConfig.name}" mode.` : ''}

Your output should ONLY be the message content, without any preamble, title, or your persona's name.
`.trim();

      const formatHistoryForGemini = (history: any[]) => {
          let parts: any[] = [];
          
          if (session.files && session.files.length > 0) {
              parts.push({ text: `[Session Attachments Provided by User]` });
              session.files.forEach((file: any) => {
                  if (file.geminiUri) {
                      parts.push({
                          fileData: {
                              fileUri: file.geminiUri,
                              mimeType: file.mimeType
                          }
                      });
                      parts.push({ text: `[Attached: ${file.name}]` });
                  }
              });
              parts.push({ text: `\n` });
          }

          if (history.length === 0) {
              parts.push({ text: "The debate is just beginning. As your persona, please provide the opening statement." });
              return parts;
          }
          
          history.forEach((turn: any) => {
             let turnText = `**${turn.personaName}:**\n${turn.message}`;
             parts.push({ text: turnText });
             
             if (turn.files && turn.files.length > 0) {
                 turn.files.forEach((file: any) => {
                     if (file.geminiUri) {
                         parts.push({
                             fileData: {
                                 fileUri: file.geminiUri,
                                 mimeType: file.mimeType
                             }
                         });
                         parts.push({ text: `[${turn.personaName} attached a file: ${file.name}]` });
                     }
                 });
             }
          });
          
          parts.push({ text: `\n\n---\n\n**YOUR TURN:**\nNow, as ${persona.display_name}, provide your response.` });
          
          return parts;
      }

      const contents = formatHistoryForGemini(conversation);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const config: any = {
          systemInstruction,
          temperature: modeConfig?.temperature ?? 0.7,
      };

      if (session.useWebSearch) {
          config.tools = [{ googleSearch: {} }];
      }

      let model = session.model || 'gemini-2.5-flash';
      
      // Fallback for previously saved invalid models in localStorage
      if (model.includes('3.1-flash') || model.includes('3.6-flash')) {
          model = 'gemini-2.5-flash';
      }

      const responseStream = await ai.models.generateContentStream({
          model: model,
          contents: contents,
          config,
      });

      for await (const chunk of responseStream) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      
      res.write(`data: [DONE]\n\n`);
      res.end();

    } catch (error: any) {
      if (error.message?.includes('API key not valid')) {
          console.warn("Invalid API key used for turn generation.");
          res.write(`data: ${JSON.stringify({ error: 'Your Gemini API key is invalid or missing. Please check your AI Studio settings.' })}\n\n`);
      } else {
          console.error('Generate turn error:', error);
          res.write(`data: ${JSON.stringify({ error: error.message || 'Generation failed' })}\n\n`);
      }
      res.end();
    }
  });

  app.post('/api/generate-persona', async (req, res) => {
    try {
        const { prompt } = req.body;
        const generationPrompt = `
        Based on the user's request, create a detailed PersonaCard object in JSON format.
        The user wants a persona described as: "${prompt}".

        Flesh this out into a complete persona. Be creative and specific.
        - The display_name should be catchy and descriptive.
        - Set gender to 'male', 'female', or 'neutral' depending on the described character.
        - The bio should be a rich, third-person description.
        - Mannerisms should include specific example phrases.
        - Lexicon should be a list of relevant keywords.
        - Tone should be a few descriptive adjectives.
        - Goals should be a list of objectives for this persona in a debate.
        - Knowledge basis should be 'original', 'fictional', or 'public_figure_emulation'.
        - Fill out constraints, and tool_prefs reasonably. temperature_bias should be between -0.5 and 0.5.

        Your output MUST be a single, valid JSON object that conforms to the Omit<PersonaCard, 'id'> type structure provided below.
        Do not include any other text, explanations, or markdown formatting like \`\`\`json.
        `;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                display_name: { type: Type.STRING },
                gender: { type: Type.STRING, enum: ['male', 'female', 'neutral'] },
                voice: {
                    type: Type.OBJECT,
                    properties: {
                        bio: { type: Type.STRING },
                        mannerisms: { type: Type.STRING },
                        lexicon: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['bio', 'mannerisms', 'lexicon'],
                },
                knowledge_mode: {
                    type: Type.OBJECT,
                    properties: {
                        basis: { type: Type.STRING, enum: ['original', 'fictional', 'public_figure_emulation'] },
                        sources_allowed: { type: Type.ARRAY, items: { type: Type.STRING } },
                        citation_style: { type: Type.STRING, enum: ['none', 'inline', 'footnote'] },
                    },
                    required: ['basis', 'sources_allowed', 'citation_style'],
                },
                constraints: {
                    type: Type.OBJECT,
                    properties: {
                        avoid_claims: { type: Type.ARRAY, items: { type: Type.STRING } },
                        disallowed_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['avoid_claims', 'disallowed_topics'],
                },
                style: {
                    type: Type.OBJECT,
                    properties: {
                        tone: { type: Type.STRING },
                        formatting: { type: Type.STRING },
                        temperature_bias: { type: Type.NUMBER },
                    },
                    required: ['tone', 'formatting', 'temperature_bias'],
                },
                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                tool_prefs: {
                    type: Type.OBJECT,
                    properties: {
                        use_web: { type: Type.BOOLEAN },
                        use_code: { type: Type.BOOLEAN },
                        use_math: { type: Type.BOOLEAN },
                        plugins: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['use_web', 'use_code', 'use_math', 'plugins'],
                },
                memory_file: { type: Type.STRING },
            },
            required: ['display_name', 'voice', 'knowledge_mode', 'constraints', 'style', 'goals', 'tool_prefs', 'memory_file'],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: generationPrompt,
            config: {
                temperature: 0.5,
                responseMimeType: "application/json",
                responseSchema
            },
        });
        
        const jsonText = response.text!.trim();
        const newPersona = JSON.parse(jsonText);
        res.json(newPersona);
    } catch (error: any) {
        if (error.message?.includes('API key not valid')) {
            console.warn("Invalid API key used for persona generation.");
            res.status(500).json({ error: error.message || 'Generation failed' });
        } else {
            console.error("Error generating persona:", error);
            res.status(500).json({ error: 'Failed to generate a new persona.' });
        }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
