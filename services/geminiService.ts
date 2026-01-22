
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  // Safe environment check
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    console.warn("API Key missing or process.env unavailable. AI features will fallback to mock responses.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEventDescription = async (title: string, category: string, location: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Join us for an unforgettable experience celebrating culture and community. (AI Unavailable)";

  try {
    const prompt = `
      Write a captivating, culturally rich description (approx 80-100 words) for an event in Liberia (or Liberian-themed).
      
      Event Title: ${title}
      Category: ${category}
      Location: ${location}
      
      Tone: Welcoming, vibrant, professional, with a touch of Liberian warmth. 
      Do not include the title in the description, just the body text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again.";
  }
};

export const generateMarketingTagline = async (title: string): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "Experience the culture.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short, punchy 5-7 word marketing tagline for an event named "${title}".`,
      });
  
      return response.text?.trim() || "Experience the culture.";
    } catch (error) {
      return "Experience the culture.";
    }
};

export const generateSocialCaptions = async (title: string, date: string, location: string): Promise<string[]> => {
  const ai = getAIClient();
  if (!ai) return [
      "Join us for an amazing event! #LiberiaConnect",
      "Don't miss out! Get your tickets now.",
      "See you there! 🇱🇷"
  ];

  try {
    const prompt = `
      Generate 3 distinct social media captions (Instagram/Facebook style) for an event.
      Event: ${title}
      Date: ${date}
      Location: ${location}
      
      1. One short and punchy (under 15 words).
      2. One engaging with emojis and questions.
      3. One focused on urgency (FOMO).
      
      Return ONLY the 3 captions separated by "|||". Do not number them.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || "";
    return text.split("|||").map(s => s.trim()).filter(s => s.length > 0);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [
      "Join us for an amazing event! #LiberiaConnect",
      "Don't miss out! Get your tickets now.",
      "See you there! 🇱🇷"
    ];
  }
};

export const generateBroadcastContent = async (eventTitle: string, purpose: string): Promise<{ subject: string; body: string }> => {
  const ai = getAIClient();
  const fallback = { subject: `Update: ${eventTitle}`, body: `Dear Attendees,\n\nWe have an update regarding ${eventTitle}.\n\nBest,\nThe Team` };
  
  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a professional email for attendees of the event "${eventTitle}". 
      Context/Purpose: ${purpose}. 
      Keep it concise, clear, and polite. 
      Return JSON with 'subject' and 'body'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return fallback;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return fallback;
  }
};

export const generateEventImage = async (prompt: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A professional, vibrant, high-quality event poster or cover image for: ${prompt}. No text overlays.` },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};
