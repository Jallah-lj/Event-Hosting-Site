import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Button } from './Button';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Event } from '../types';

interface AIChatBotProps {
  events: Event[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm Kweku, your LiberiaConnect guide. Looking for an event, chief? Ask me anything!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initialize Chat Session with System Instruction containing Event Data
  const initChat = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    
    // Create a summarized context of events to save tokens
    const eventContext = events.map(e => 
      `- ${e.title} (${e.category}): ${new Date(e.date).toLocaleDateString()} at ${e.location}. Price: $${e.price}. Status: ${e.status}. Desc: ${e.description.substring(0, 100)}...`
    ).join('\n');

    const systemInstruction = `
      You are Kweku, a helpful, energetic, and polite AI concierge for "LiberiaConnect", an event platform.
      
      Your Persona:
      - You speak English with a warm Liberian touch. Occasionally use friendly Liberian colloquialisms like "Chief", "My pekin", "No wahala", "I dey for you", "Boss".
      - You are professional but informal and welcoming.
      
      Your Task:
      - Help users find events based on their queries (e.g., "Any music events?", "What's happening in Monrovia?").
      - Provide details about dates, prices, and locations using the context provided below.
      - If a user asks about something unrelated to events, strictly but politely guide them back to LiberiaConnect topics.
      
      Current Events Data:
      ${eventContext}
      
      Keep responses concise (under 50 words unless detailed info is requested).
    `;

    try {
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
            },
        });
    } catch (e) {
        console.error("Failed to init chat", e);
    }
  };

  // Re-initialize chat if events change or on first open
  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
        initChat();
    }
  }, [isOpen, events]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsLoading(true);

    try {
        if (!chatSessionRef.current) await initChat();
        
        if (chatSessionRef.current) {
            const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMsg });
            const responseText = result.text || "Sorry chief, I didn't catch that. Please try again.";
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } else {
            setMessages(prev => [...prev, { role: 'model', text: "System error: AI service unavailable. Please check API Key." }]);
        }
    } catch (error) {
        console.error("Chat error:", error);
        setMessages(prev => [...prev, { role: 'model', text: "Small trouble connecting to the server. Try again, boss!" }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-liberia-blue animate-bounce-slow'}`}
      >
        {isOpen ? <X className="text-white w-6 h-6" /> : <MessageCircle className="text-white w-7 h-7" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-liberia-blue p-4 flex items-center justify-between shadow-md pattern-bg relative">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>
           <div className="flex items-center relative z-10">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 border-2 border-blue-300 shadow-sm">
                   <Sparkles className="text-liberia-red w-5 h-5" />
               </div>
               <div>
                   <h3 className="text-white font-bold font-serif">Concierge Kweku</h3>
                   <p className="text-blue-200 text-xs flex items-center"><span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span> Online</p>
               </div>
           </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-liberia-blue text-white rounded-br-none' 
                            : 'bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                        }`}
                    >
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-liberia-blue" />
                        <span className="text-xs text-gray-500">Kweku is thinking...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about events..."
                className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-liberia-blue outline-none"
            />
            <button 
                type="submit" 
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 bg-liberia-red hover:bg-red-700 text-white rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
      </div>
    </>
  );
};