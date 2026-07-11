/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

interface AIChatBotProps {
  isArabic: boolean;
}

export default function AIChatBot({ isArabic }: AIChatBotProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      id: "init",
      sender: "ai",
      text: isArabic 
        ? "السلام عليكم ورحمة الله وبركاته. أنا المستشار الأكاديمي الذكي لأكاديمية أبو قانتة. كيف يمكنني مساعدتكم اليوم في طلب العلم الشرعي؟"
        : "As-salamu alaykum wa rahmatullahi wa barakatuh. I am the Abu Qoonitah Academic AI Advisor. Ask me anything about Arabic grammar, Hadith, Fiqh, Tajweed, or our Madrasah tracks!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const presetQuestions = isArabic 
    ? [
        "ما هو علم الصرف وكيف أدرسه؟",
        "وضح أحكام النون الساكنة باختصار",
        "ما شروط صحة الصلاة؟",
        "كيف أتسجل في المستوى المتوسط؟"
      ]
    : [
        "What is the difference between Nahw and Sarf?",
        "Explain the basic rules of Noon Sakinah.",
        "What are the pillars of Salah?",
        "How can I study intermediate level tracks?"
      ];

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setErrorMsg("");

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: textToSend })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Service unavailable. Please verify GEMINI_API_KEY environment variable is configured in settings.");
        }
        return res.json();
      })
      .then((data) => {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("AI chat error:", err);
        setErrorMsg(err.message);
        setIsLoading(false);
      });
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "init",
        sender: "ai",
        text: isArabic 
          ? "السلام عليكم ورحمة الله وبركاته. تم إعادة تهيئة المستشار الأكاديمي. كيف أخدمكم اليوم؟"
          : "As-salamu alaykum. Advisor memory refreshed. Ask me any question!",
        timestamp: new Date()
      }
    ]);
    setErrorMsg("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      
      {/* Title */}
      <div className="text-center space-y-3 mb-8">
        <span className="text-xs font-bold text-natural-gold tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-natural-gold animate-pulse" />
          <span>{isArabic ? "مستشار الذكاء الاصطناعي الشرعي" : "AI Academic Advisor & Scholar GPT"}</span>
        </span>
        <h1 className="text-3xl font-serif font-light text-natural-green dark:text-white">
          {isArabic ? "المساعد الأكاديمي الذكي لعلوم الشريعة" : "Madrasah Advisor Chatbot"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-emerald-300 max-w-xl mx-auto font-sans leading-relaxed">
          {isArabic 
            ? "اسأل الذكاء الاصطناعي مستنبطًا من الكتب والعلوم المعتمدة في التجويد، والنحو، والحديث، والعقيدة لمراجعة دروسك وتوجيهك أين تبدأ."
            : "Query the Academic chatbot on Islamic grammar, classical texts, or Tajweed formulations to assist your active Madrasah study loops."}
        </p>
        <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />
      </div>

      {/* Main Chat Interface Grid */}
      <div className="bg-white dark:bg-natural-dark rounded-3xl border border-emerald-50 dark:border-emerald-900/40 shadow-sm overflow-hidden flex flex-col min-h-[500px] max-h-[600px]">
        
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-natural-green to-natural-dark p-4 border-b border-emerald-900/10 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-natural-gold text-natural-dark flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xs sm:text-sm text-amber-100">Abu Qoonitah Academy AI</h3>
              <p className="text-[10px] text-natural-sage font-mono">Online Madrasah Advisor</p>
            </div>
          </div>
          <button
            onClick={handleResetChat}
            className="p-1.5 hover:bg-natural-dark/65 rounded-full text-natural-sage hover:text-white transition-all border-none cursor-pointer"
            title="Refresh memory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Body Scroll */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-natural-sage/5 dark:bg-natural-green/5 max-h-[400px]">
          {messages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs max-w-xl ${isAI ? "self-start" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] ${
                  isAI ? "bg-natural-gold text-white" : "bg-natural-green text-white"
                }`}>
                  {isAI ? "AI" : "U"}
                </div>
                
                {/* Content */}
                <div className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  isAI 
                    ? "bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/30 text-natural-green dark:text-emerald-100" 
                    : "bg-natural-green text-white"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-xs self-start items-center">
              <div className="w-8 h-8 rounded-full bg-natural-gold text-white flex items-center justify-center font-bold animate-pulse">
                AI
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/30 text-natural-green dark:text-white flex items-center gap-2 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-natural-gold" />
                <span>Consulting classical books...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-semibold flex items-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p>{errorMsg}</p>
                <p className="text-[10px] mt-1 font-normal text-red-600">Ensure the platform secrets panel holds your credentials.</p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Preset Prompt Selectors */}
        <div className="p-3 bg-natural-sage/10 dark:bg-natural-green/20 border-t border-emerald-50 dark:border-emerald-900/30 flex flex-wrap gap-2 justify-center">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-white dark:bg-natural-dark hover:bg-natural-sage/20 text-[10px] font-semibold text-natural-green dark:text-amber-200 border border-emerald-50 dark:border-emerald-900/35 rounded-full transition-all cursor-pointer"
            >
              ✦ {q}
            </button>
          ))}
        </div>

        {/* Input Message Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="p-4 border-t border-emerald-50 dark:border-emerald-900/30 flex gap-2 bg-white dark:bg-natural-dark"
        >
          <input
            type="text"
            placeholder={isArabic ? "اسأل عن الصرف، النحو، العقيدة..." : "Ask your Madrasah academic inquiry..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            required
            className="w-full bg-natural-sage/10 dark:bg-natural-green/20 border border-emerald-50 dark:border-emerald-900/30 rounded-full p-2.5 text-xs text-natural-green dark:text-white placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-natural-gold"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-natural-green hover:bg-natural-dark disabled:bg-slate-300 text-white font-bold rounded-full transition-all border-none cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
