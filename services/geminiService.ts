
import { GoogleGenAI, Type } from "@google/genai";

// Initialize using a named parameter and exclusively using process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHostTopic = async (): Promise<{ topic: string, category: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a unique and specific secret topic and its category for a social deduction game. Avoid common topics like 'The Moon'. Think of something interesting like 'A Disco Ball', 'The Titanic', or 'Quicksand'. Return as JSON with keys 'topic' and 'category'.",
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 400 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["topic", "category"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to generate host topic", error);
    return { topic: "The Moon", category: "Space" };
  }
};

export const generateGameTopic = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a single, interesting, specific noun or short phrase suitable for a game of 'Imposter'. Examples: 'The Eiffel Tower', 'Sushi', 'Mars Landing'. Return ONLY the phrase, no quotes.",
      config: {
        maxOutputTokens: 20,
        thinkingConfig: { thinkingBudget: 200 },
        temperature: 1.0,
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Failed to generate topic", error);
    return "The Ocean"; // Fallback
  }
};

export const generateClue = async (role: 'INNOCENT' | 'IMPOSTER', topic: string, category: string): Promise<string> => {
    try {
        const prompt = role === 'INNOCENT' 
            ? `You are playing 'Imposter'. Topic: '${topic}', Category: '${category}'. Think carefully: Give a subtle one-word or very short phrase clue that proves you know the topic without giving it away to the Imposter. Do not use the word '${topic}'.`
            : `You are playing 'Imposter'. You DON'T know the topic, only Category: '${category}'. Think carefully: Give a vague but confident one-word clue related to '${category}' to blend in with others.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                maxOutputTokens: 15,
                thinkingConfig: { thinkingBudget: 300 },
                temperature: 0.8,
            }
        });

        return response.text.trim().replace(/['"().]/g, '');
    } catch (error) {
        console.error("Failed to generate bot clue", error);
        return "Broadly speaking...";
    }
};

export const generateImposterGuess = async (category: string, clues: string[]): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are the Imposter. Category: '${category}'. Clues given by others: ${clues.join(', ')}. Analyze these clues carefully to deduce the secret topic. Return only the deduced topic name.`,
            config: { 
                maxOutputTokens: 15,
                thinkingConfig: { thinkingBudget: 500 }
            }
        });
        return response.text.trim();
    } catch (error) {
        return "I'm not sure";
    }
};
