import { PersonaCard, ArenaSession, ConversationTurn, ModeConfig } from '../types';

export const generateDebateTurnStream = async function* (
    session: ArenaSession,
    persona: PersonaCard,
    allPersonas: PersonaCard[],
    conversation: ConversationTurn[],
    modeConfig: ModeConfig | undefined,
) {
    const response = await fetch('/api/generate-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, persona, allPersonas, conversation, modeConfig }),
    });

    if (!response.ok) {
        let errorMsg = 'Failed to get response from the server.';
        try {
            const errData = await response.json();
            if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    if (!response.body) {
        throw new Error('No response body stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                if (dataStr === '[DONE]') {
                    return;
                }
                
                try {
                    const data = JSON.parse(dataStr);
                    if (data.error) throw new Error(data.error);
                    if (data.text) yield data.text;
                } catch (e: any) {
                    if (dataStr.includes('"error"')) {
                       throw e; // Bubble up explicit server errors
                    }
                    console.error('Error parsing stream data:', e);
                }
            }
        }
    }
};

export const generatePersonaFromPrompt = async (prompt: string): Promise<Omit<PersonaCard, 'id'>> => {
    const response = await fetch('/api/generate-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        let errorMsg = 'Failed to generate a new persona.';
        try {
            const errData = await response.json();
            if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    return await response.json();
};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        let errorMsg = 'File upload failed.';
        try {
            const errData = await response.json();
            if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    return await response.json();
};

