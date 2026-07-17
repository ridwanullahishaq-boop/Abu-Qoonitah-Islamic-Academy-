/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GlobalAIAssistant.tsx
 * A persistent, floating AI Assistant widget accessible from everywhere on the platform.
 * Specially trained to teach Students, Teachers, and Visitors/Strangers on how to use
 * the Abu Qoonitah Islamic Academy website, while answering academic and functional questions.
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles, X, Send, ArrowRightLeft, Shield, Play } from "lucide-react";

interface GlobalAIAssistantProps {
  isArabic: boolean;
}

export default function GlobalAIAssistant({ isArabic }: GlobalAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: "g-init",
      sender: "ai",
      text: isArabic
        ? "السلام عليكم ورحمة الله وبركاته! أنا مساعد الأكاديمية الذكي. كيف يمكنني إرشادك اليوم؟\n\nلقد تم تدريبي لمساعدة:\n• الطلاب (كيفية التسجيل وحل الواجبات والتسميع الصوتي)\n• المعلمين (إدارة الحلقات والدروس وتصحيح التلاوات)\n• الزوار الكرام (تصفح ديوان الشعر، المكتبة، والتبرع للمدرسة)"
        : "As-salamu alaykum wa rahmatullahi wa barakatuh! I am your Global Academy AI Assistant. How can I guide you today?\n\nI can teach you how to use this platform:\n• Students (how to enroll, submit worksheets, or record audio recitations)\n• Teachers (how to manage lessons, add calendar events, or grade assignments)\n• Visitors (how to browse free courses, classical libraries, or make donations)",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"student" | "teacher" | "stranger">("student");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Preset context-sensitive questions designed to teach users how to use the website
  const tutorGuides = {
    student: {
      label: isArabic ? "👨‍🎓 للطلاب" : "👨‍🎓 For Students",
      questions: isArabic
        ? [
            { q: "كيف أسجل في حلقة أو دورة دراسية؟", text: "كيف يمكنني كطالب التسجيل في دورات الأكاديمية والمدرسة الرقمية والولوج لبوابتي؟" },
            { q: "كيف أسلم واجباتي المدرسية وأرفع التلاوة الصوتية؟", text: "اشرح لي كيفية تسليم ورقة الواجب الصوتي أو الكتابي والتسجيل الصوتي المباشر للتلاوة من بوابتي كطالب؟" },
            { q: "أين أجد الدورات المجانية وقصيدة اللامية؟", text: "كيف أصل للدورات المجانية والاستماع لتلاوة متن اللامية لابن تيمية في الموقع؟" }
          ]
        : [
            { q: "How do I register & access my student portal?", text: "Explain step-by-step how a student can register an account, log in, and access their private Student Portal." },
            { q: "How do I submit worksheets & audio recitations?", text: "Explain how a student can complete worksheets, upload assignments up to 150MB, or record their voice recitation live on the platform." },
            { q: "Where can I find free courses & audio poems?", text: "Where are the free courses located, and how can I play the audio recitation of Ibn Taymiyyah's Laamiyyatu poem?" }
          ]
    },
    teacher: {
      label: isArabic ? "👨‍🏫 للمعلمين" : "👨‍🏫 For Teachers",
      questions: isArabic
        ? [
            { q: "كيف أقوم بإنشاء درس وإدارة المقررات؟", text: "كيف يمكن للمعلم إضافة دورة دراسية جديدة، رفع المنهج الدراسي بصيغة PDF، وإضافة بث دروس للتلفزيون الإسلامي؟" },
            { q: "كيف أصحح واجبات الطلاب الصوتية وأقيمها؟", text: "اشرح لي كمعلم كيف أقوم بمراجعة واجبات الطلاب والاستماع لتسجيلات تلاوتهم الصوتية ووضع الدرجات والملحوظات؟" },
            { q: "كيف أضيف حدثاً لجدول المواعيد المدرسي؟", text: "أرشدني كأستاذ إلى طريقة إضافة موعد أو محاضرة عامة في تقويم الأحداث المدرسي بالأكاديمية؟" }
          ]
        : [
            { q: "How do I manage courses & upload PDFs?", text: "How can teachers create courses, publish curriculum books (PDFs up to 150MB), or add sermon media to the platform?" },
            { q: "How do I grade student audio recitations?", text: "Explain how a teacher reviews worksheets, listens to student-recorded recitation audios, and inputs grades and text feedback." },
            { q: "How do I add events to the Madrasah calendar?", text: "How can a teacher schedule dynamic dates, classes, or public lectures on the global academic school calendar?" }
          ]
    },
    stranger: {
      label: isArabic ? "🌐 للزوار" : "🌐 For Visitors",
      questions: isArabic
        ? [
            { q: "ما هي أكاديمية أبو قانتة وما منهجها؟", text: "أعطني نبذة تعريفية كاملة عن أكاديمية أبو قانتة الإسلامية، وأهدافها ورؤيتها ومنهجها التعليمي؟" },
            { q: "كيف أتصفح المكتبة الإسلامية وديوان الشعر؟", text: "كيف يمكنني كزائر تصفح ديوان الشعر العربي وقراءة الكتب وتنزيل مصنفات الحديث والفقه المتوفرة؟" },
            { q: "كيف أدعم الأكاديمية وأتبرع للمدرسة؟", text: "أرشدني لطريقة التبرع لدعم برامج التعليم المجاني بالأكاديمية عبر بطاقة الائتمان أو رفع إيصال التحويل المصرفي؟" }
          ]
        : [
            { q: "What is Abu Qoonitah Academy's mission?", text: "Provide a comprehensive introduction to Abu Qoonitah Islamic Academy, its mission, curricula, and courses." },
            { q: "How do I browse the libraries and download books?", text: "How can a guest search the Islamic Library or Poetry Library, read classical works, and download them?" },
            { q: "How can I donate and support free education?", text: "Explain how a visitor can support the Madrasah via the 'Donate Now' page, using cards or uploading transfer receipt files." }
          ]
    }
  };

  const handleSendMessage = (textToSend: string, displayLabel?: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `g-user-${Date.now()}`,
      sender: "user",
      text: displayLabel || textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setErrorMsg("");

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: textToSend,
        history: messages.map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          content: m.text
        }))
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to connect to Gemini AI services. Verify API key settings.");
        }
        return res.json();
      })
      .then((data) => {
        const aiMsg = {
          id: `g-ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Global chatbot error:", err);
        setErrorMsg(err.message);
        setIsLoading(false);
      });
  };

  return (
    <>
      {/* PERSISTENT FLOATING AI BUTTON - Bottom Left (z-50) */}
      <button
        id="global-ai-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-full shadow-[0_8px_30px_rgb(217,119,6,0.3)] hover:shadow-[0_8px_30px_rgb(217,119,6,0.5)] transition-all duration-300 border border-amber-400 group cursor-pointer"
        title={isArabic ? "مستشار الذكاء الاصطناعي الأكاديمي" : "Academic AI Tutor & Guide"}
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-spin-once" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border border-white rounded-full animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border border-white rounded-full" />
          </div>
        )}

        {/* Hover label */}
        <span className="absolute left-16 scale-0 group-hover:scale-100 bg-natural-dark text-amber-100 text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl transition-all duration-200 border border-emerald-800/40">
          {isArabic ? "✦ اسأل مرشد الأكاديمية الذكي" : "✦ Ask Academic AI Guide"}
        </span>
      </button>

      {/* COMPACT AI CHAT PANEL - Sliding Drawer from bottom left */}
      {isOpen && (
        <div
          id="global-ai-panel"
          className="fixed bottom-24 left-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[80vh] bg-white dark:bg-natural-dark rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-natural-green to-emerald-800 p-4 border-b border-emerald-900/10 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xs sm:text-sm text-amber-100 flex items-center gap-1">
                  <span>{isArabic ? "مرشد الأكاديمية الذكي" : "Academy AI Guide"}</span>
                  <span className="px-1.5 py-0.5 bg-amber-500 text-[7px] text-white rounded uppercase font-mono tracking-widest font-bold">2.5</span>
                </h3>
                <p className="text-[9px] text-emerald-200 font-sans">
                  {isArabic ? "تعليم كيفية تصفح واستخدام الموقع" : "How-To-Use Platform Instructor"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full text-emerald-100 hover:text-white transition-all cursor-pointer border-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Role Tabs Selector */}
          <div className="bg-natural-sage/20 dark:bg-natural-green/20 border-b border-emerald-50 dark:border-emerald-950 p-2 flex gap-1 shrink-0">
            {(["student", "teacher", "stranger"] as const).map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none ${
                    isSelected
                      ? "bg-amber-500 text-white shadow-sm scale-102"
                      : "bg-white/40 dark:bg-natural-dark/40 hover:bg-amber-500/10 text-emerald-800 dark:text-emerald-200"
                  }`}
                >
                  {tutorGuides[tab].label}
                </button>
              );
            })}
          </div>

          {/* Chat Logs Scrollable */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-natural-dark/10 max-h-[290px]">
            {messages.map((msg) => {
              const isAI = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 text-xs ${isAI ? "self-start" : "ml-auto flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] ${
                      isAI ? "bg-amber-500 text-white" : "bg-natural-green text-white"
                    }`}
                  >
                    {isAI ? "AI" : "U"}
                  </div>
                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap text-[11px] border shadow-sm max-w-[80%] ${
                      isAI
                        ? "bg-white dark:bg-natural-dark border-emerald-50/60 dark:border-emerald-900/30 text-natural-green dark:text-emerald-100"
                        : "bg-natural-green text-white border-transparent"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 text-xs self-start items-center">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold animate-pulse">
                  AI
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-natural-dark border border-emerald-50/60 dark:border-emerald-900/30 text-natural-green dark:text-white flex items-center gap-1.5 font-semibold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>{isArabic ? "جاري تجميع الإجابة الصحيحة..." : "Formulating correct instructions..."}</span>
                </div>
              </div>
            )}

            {/* Error logs */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-[10px] font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Context Tutorial Prompts Grid */}
          <div className="p-3 bg-natural-sage/10 dark:bg-natural-green/10 border-t border-emerald-50 dark:border-emerald-950 shrink-0">
            <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-bold mb-1.5 uppercase tracking-wider">
              {isArabic ? "✦ تبيان فوري وموجه لكيفية استخدام الموقع:" : "✦ Click to learn how to use this feature:"}
            </span>
            <div className="flex flex-col gap-1.5">
              {tutorGuides[activeTab].questions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.text, item.q)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-white dark:bg-natural-dark hover:bg-amber-500/5 hover:border-amber-400 dark:hover:border-amber-500 text-left text-[10px] font-semibold text-natural-green dark:text-emerald-200 border border-emerald-100/60 dark:border-emerald-900/30 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-2.5 h-2.5 text-amber-500 flex-shrink-0 fill-amber-500" />
                  <span className="truncate">{item.q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-emerald-50 dark:border-emerald-950 flex gap-2 bg-white dark:bg-natural-dark shrink-0"
          >
            <input
              type="text"
              placeholder={isArabic ? "اسألني كيف تستخدم بوابات الطلاب والمعلمين..." : "Ask how to use students/teachers views..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              required
              className="w-full bg-natural-sage/15 dark:bg-natural-green/15 border border-emerald-50 dark:border-emerald-900/40 rounded-full px-3 py-2 text-xs text-natural-green dark:text-white placeholder-emerald-400/80 focus:outline-none focus:ring-1 focus:ring-amber-500 text-[11px]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-full transition-all border-none cursor-pointer flex items-center justify-center shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
