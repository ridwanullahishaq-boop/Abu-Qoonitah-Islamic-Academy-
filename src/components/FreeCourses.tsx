/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Volume2, Play, Pause, AlertCircle, RefreshCw, FileText, ImageIcon, Check, Award, Send, Trash2, X } from "lucide-react";

interface FreeCourseData {
  title: string;
  description: string;
  imageUrl: string;
  poemArabicText: string[];
  poemTranslationText: string[];
  audioFiles: { id: string; title: string; url: string; description: string; }[];
}

interface FreeCoursesProps {
  isArabic: boolean;
}

export default function FreeCourses({ isArabic }: FreeCoursesProps) {
  const [data, setData] = useState<FreeCourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Progressive learning student states
  const [studentSession, setStudentSession] = useState<any | null>(null);
  const [regName, setRegName] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // CBT Exam states
  const [showExam, setShowExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);
  const [examFeedback, setExamFeedback] = useState("");

  const examQuestions = [
    {
      id: 1,
      question: "Who is the noble author of the classical Al-Laamiyyah poem?",
      options: [
        "Shaykh al-Islam Ibn Taimiyyah",
        "Imam Al-Ghazali",
        "Ibn Al-Qayyim",
        "Imam Al-Shafi'i"
      ],
      correctIndex: 0
    },
    {
      id: 2,
      question: "What primary Islamic discipline is Al-Laamiyyah centered on?",
      options: [
        "Arabic Rhetoric and Grammar",
        "Aqeedah (Islamic Creed) & Student Manners",
        "Fiqh of Inheritance",
        "Detailed Seerah of the Prophet"
      ],
      correctIndex: 1
    },
    {
      id: 3,
      question: "How many verses are contained in the classical Laamiyyatu Ibn Taimiyyah poem?",
      options: [
        "100 verses",
        "50 verses",
        "16 verses",
        "30 verses"
      ],
      correctIndex: 2
    },
    {
      id: 4,
      question: "What does the linguistic title 'Laamiyyah' signify?",
      options: [
        "It was written in the holy month of Ramadan",
        "Every single verse terminates with the Arabic letter Lam (ل)",
        "It was dedicated to his student named Lam",
        "It was penned in the ancient town of Laam"
      ],
      correctIndex: 1
    },
    {
      id: 5,
      question: "What is the correct Islamic creed regarding the noble Companions of the Prophet as outlined in the poem?",
      options: [
        "Complete love, respect, asking Allah to be pleased with them, and silent defense",
        "Excessive praise raising them above prophets",
        "Complete disregard of their ranks",
        "Categorical rejection of their historic narratives"
      ],
      correctIndex: 0
    }
  ];

  // Load course details and check for local session
  useEffect(() => {
    fetch("/api/public/free-course")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load free course details.");
        return res.json();
      })
      .then((courseData) => {
        setData(courseData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Load registered free session if it exists
    const stored = localStorage.getItem("fc_student_session");
    if (stored) {
      try {
        setStudentSession(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, []);

  const handlePlayPause = (fileId: string, url: string) => {
    if (playingId === fileId) {
      if (currentAudio) {
        currentAudio.pause();
        setPlayingId(null);
      }
    } else {
      if (currentAudio) {
        currentAudio.pause();
      }
      const audio = new Audio(url);
      audio.play()
        .then(() => {
          setCurrentAudio(audio);
          setPlayingId(fileId);
          audio.onended = () => setPlayingId(null);
        })
        .catch((err) => {
          alert("Unable to stream this audio file. Please check your internet connection.");
          console.error(err);
        });
    }
  };

  // Register free student
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regWhatsapp.trim()) {
      alert("Please fill in both your Name and WhatsApp number.");
      return;
    }

    setRegLoading(true);
    fetch("/api/public/free-course/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: regName.trim(),
        whatsapp: regWhatsapp.trim()
      })
    })
      .then((res) => res.json())
      .then((resData) => {
        setRegLoading(false);
        if (resData.success && resData.student) {
          setStudentSession(resData.student);
          localStorage.setItem("fc_student_session", JSON.stringify(resData.student));
          alert(`As-salamu alaykum, ${resData.student.name}! Your free progressive learning session has begun.`);
        } else {
          alert(resData.error || "Failed to register. Please try again.");
        }
      })
      .catch((err) => {
        setRegLoading(false);
        console.error(err);
        alert("Network error during free course registration.");
      });
  };

  // Logout/Clear free session
  const handleClearSession = () => {
    if (window.confirm("Are you sure you want to exit your free course progressive learning session? Your local progress will be logged out.")) {
      setStudentSession(null);
      localStorage.removeItem("fc_student_session");
      setExamAnswers({});
      setExamSubmitted(false);
      setExamScore(null);
      setShowExam(false);
    }
  };

  // Mark audio track as completed
  const toggleTrackCompletion = (fileId: string) => {
    if (!studentSession) return;

    let updatedCompleted = [...(studentSession.completedAudios || [])];
    if (updatedCompleted.includes(fileId)) {
      updatedCompleted = updatedCompleted.filter(id => id !== fileId);
    } else {
      updatedCompleted.push(fileId);
    }

    // Update locally first for instantaneous feedback
    const totalTracks = data?.audioFiles?.length || 1;
    const progressPercent = Math.min(100, Math.round((updatedCompleted.length / totalTracks) * 100));
    
    const updatedSession = {
      ...studentSession,
      completedAudios: updatedCompleted,
      progress: progressPercent
    };

    setStudentSession(updatedSession);
    localStorage.setItem("fc_student_session", JSON.stringify(updatedSession));

    // Sync to database
    fetch("/api/public/free-course/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: studentSession.id,
        completedAudios: updatedCompleted
      })
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.student) {
          // Keep synchronized
          const synced = {
            ...updatedSession,
            progress: resData.student.progress,
            completedAudios: resData.student.completedAudios
          };
          setStudentSession(synced);
          localStorage.setItem("fc_student_session", JSON.stringify(synced));
        }
      })
      .catch(err => console.error("Error syncing progress:", err));
  };

  // Submit CBT Exam
  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(examAnswers).length < examQuestions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let score = 0;
    examQuestions.forEach((q, index) => {
      if (examAnswers[index] === q.correctIndex) {
        score++;
      }
    });

    setExamScore(score);
    setExamSubmitted(true);

    if (score >= 4) {
      setExamFeedback("🎉 MABRUK! You passed the CBT Exam! You scored " + score + "/5. You are now fully certified to receive your Certificate of Completion!");
      
      // Update session locally
      const updatedSession = {
        ...studentSession,
        examScore: score,
        completed: true,
        progress: 100
      };
      setStudentSession(updatedSession);
      localStorage.setItem("fc_student_session", JSON.stringify(updatedSession));

      // Sync passing score & status to server
      fetch("/api/public/free-course/submit-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: studentSession.id,
          score: score
        })
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.student) {
            const synced = {
              ...updatedSession,
              completed: resData.student.completed,
              examScore: resData.student.examScore
            };
            setStudentSession(synced);
            localStorage.setItem("fc_student_session", JSON.stringify(synced));
          }
        })
        .catch(err => console.error("Error syncing exam completion:", err));
    } else {
      setExamFeedback("❌ Try Again! You scored " + score + "/5. You need at least 4/5 correct answers to pass and receive your certificate. Revise the classical verses or audio files and try again!");
    }
  };

  // Dynamic Image Generation using HTML5 Canvas (Bulletproof, doesn't print blank!)
  const handleDownloadPNG = () => {
    if (!studentSession) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background color (elegant parchment cream)
    ctx.fillStyle = "#FCFBF7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main border (emerald green)
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#064e3b"; // emerald-900
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Inner gold border
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#d97706"; // amber-600
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Corner decorative details
    ctx.fillStyle = "#d97706";
    // Top left
    ctx.fillRect(40, 40, 35, 8);
    ctx.fillRect(40, 40, 8, 35);
    // Top right
    ctx.fillRect(canvas.width - 75, 40, 35, 8);
    ctx.fillRect(canvas.width - 48, 40, 8, 35);
    // Bottom left
    ctx.fillRect(40, canvas.height - 48, 35, 8);
    ctx.fillRect(40, canvas.height - 75, 8, 35);
    // Bottom right
    ctx.fillRect(canvas.width - 75, canvas.height - 48, 35, 8);
    ctx.fillRect(canvas.width - 48, canvas.height - 75, 8, 35);

    // Header Title (Arabic)
    ctx.textAlign = "center";
    ctx.fillStyle = "#b45309"; // amber-700
    ctx.font = "bold 22px serif";
    ctx.fillText("شَهَادَةُ إِتْمَام", canvas.width / 2, 90);

    ctx.fillStyle = "#064e3b"; // emerald-900
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("ABU QOONITAH ISLAMIC ACADEMY", canvas.width / 2, 140);

    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("AUTHORIZED BOARD OF ISLAMIC EDUCATION STUDIES", canvas.width / 2, 170);

    // Decorative Dividers
    ctx.strokeStyle = "rgba(217, 119, 6, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, 195);
    ctx.lineTo(canvas.width / 2 + 150, 195);
    ctx.stroke();

    ctx.fillStyle = "#b45309"; // amber-700
    ctx.font = "italic 28px serif";
    ctx.fillText("Certificate of Achievement", canvas.width / 2, 235);

    ctx.strokeStyle = "rgba(217, 119, 6, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, 260);
    ctx.lineTo(canvas.width / 2 + 150, 260);
    ctx.stroke();

    // Content text
    ctx.fillStyle = "#334155"; // slate-700
    ctx.font = "300 18px sans-serif";
    ctx.fillText("This is to certify that the beloved student", canvas.width / 2, 310);

    // Student Name
    ctx.fillStyle = "#064e3b"; // emerald-950
    ctx.font = "bold 32px sans-serif";
    const studentName = studentSession.name || "Beloved Student";
    ctx.fillText(studentName, canvas.width / 2, 370);

    // Gold Underline Name
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const nameWidth = ctx.measureText(studentName).width;
    ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 15, 385);
    ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 15, 385);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "300 18px sans-serif";
    ctx.fillText("has successfully passed all scheduled examinations, completed homework worksheets,", canvas.width / 2, 435);
    ctx.fillText("and fulfilled the progressive curriculum requirements for the free module", canvas.width / 2, 470);

    // Program Title
    ctx.fillStyle = "#022c22"; // emerald-950
    ctx.font = "bold 20px sans-serif";
    const courseTitleStr = (data?.title || "Laamiyyatu Ibn Taimiyyah").toUpperCase();
    ctx.fillText(courseTitleStr, canvas.width / 2, 525);

    ctx.fillStyle = "#334155";
    ctx.font = "300 18px sans-serif";
    ctx.fillText("showing upright character, devotion, and outstanding academic performance.", canvas.width / 2, 575);

    // Director Signature
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Ishaq Ridwanullah B.", canvas.width / 2 - 280, 680);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 380, 695);
    ctx.lineTo(canvas.width / 2 - 180, 695);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText("Academy Director", canvas.width / 2 - 280, 715);

    // Golden Wax Seal
    ctx.fillStyle = "#f59e0b"; // golden amber seal
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 680, 45, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 680, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#78350f"; // amber-900
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("OFFICIAL SEAL", canvas.width / 2, 678);
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("ABU QOONITAH", canvas.width / 2, 692);

    // Graduation Date
    ctx.fillStyle = "#1e293b";
    ctx.font = "14px sans-serif";
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(dateStr, canvas.width / 2 + 280, 680);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + 180, 695);
    ctx.lineTo(canvas.width / 2 + 380, 695);
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText("Date of Graduation", canvas.width / 2 + 280, 715);

    // Trigger File Download
    const link = document.createElement("a");
    link.download = `FreeClass_Certificate_${studentName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Send to student's WhatsApp
  const handleSendToWhatsApp = () => {
    if (!studentSession) return;
    const studentName = studentSession.name;
    const courseName = data?.title || "Laamiyyatu Ibn Taimiyyah";
    const whatsappNum = studentSession.whatsapp;
    
    const text = `Assalamu Alaikum! 🎓\n\nI have successfully passed the CBT Exam and graduated from the Free Class *"${courseName}"* at the *Abu Qoonitah Islamic Academy*!\n\nName: *${studentName}*\nCBT Score: *${studentSession.examScore || 5}/5*\nStatus: *Completed & Certified*\nDate: *${new Date().toLocaleDateString()}*\n\nPlease find my certificate of achievement linked with my registered session ID: ${studentSession.id}!`;
    
    const cleanPhone = whatsappNum.replace(/\D/g, "");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-natural-gold animate-spin" />
        <p className="text-xs text-slate-400">Loading free Madrasah modules...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-16 bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="font-bold text-red-800 dark:text-red-400">Failed to Load</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || "Could not retrieve course."}</p>
      </div>
    );
  }

  const allAudiosCount = data.audioFiles?.length || 0;
  const completedAudiosCount = studentSession?.completedAudios?.length || 0;
  const allCompleted = allAudiosCount > 0 && completedAudiosCount === allAudiosCount;

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans animate-fade-in text-xs">
      
      {/* 1. HERO HEADER */}
      <div className="text-center space-y-4">
        <span className="inline-block px-4 py-1.5 bg-amber-100 dark:bg-emerald-950 text-amber-800 dark:text-natural-gold rounded-full text-xs font-bold uppercase tracking-widest">
          {isArabic ? "المحاضرات والدورات المجانية" : "Free Academic Modules"}
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-natural-green dark:text-white leading-tight">
          {data.title}
        </h1>
        <div className="h-0.5 bg-natural-gold w-24 mx-auto rounded" />
        <p className="text-slate-500 dark:text-emerald-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>
      </div>

      {/* 2. ENROLLMENT & PROGRESS tracking banner */}
      <div className="max-w-3xl mx-auto">
        {!studentSession ? (
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white border border-emerald-850 shadow-md text-center space-y-4">
            <Award className="w-10 h-10 text-natural-gold mx-auto" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-amber-100">🎓 Join Free & Claim Your Certificate</h2>
            <p className="text-slate-300 text-xs max-w-lg mx-auto">
              Enroll with your name and WhatsApp number to unlock progressive study tracking, take the official CBT Graduation Exam, and obtain your official graduation certificate.
            </p>
            
            <form onSubmit={handleRegister} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto items-center">
              <input
                type="text"
                placeholder="Your Full Name"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full sm:flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-natural-gold"
              />
              <input
                type="text"
                placeholder="WhatsApp Number (e.g., +234...)"
                required
                value={regWhatsapp}
                onChange={(e) => setRegWhatsapp(e.target.value)}
                className="w-full sm:flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-natural-gold font-mono"
              />
              <button
                type="submit"
                disabled={regLoading}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors disabled:opacity-50 text-xs whitespace-nowrap"
              >
                {regLoading ? "Registering..." : "Start Learning"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-natural-dark rounded-3xl p-6 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-amber-300 px-2 py-0.5 rounded font-bold uppercase">Active Session</span>
                <h3 className="font-bold text-sm text-natural-green dark:text-amber-100 mt-1">Learner: {studentSession.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Session ID: {studentSession.id} | WhatsApp: {studentSession.whatsapp}</p>
              </div>
              <button
                type="button"
                onClick={handleClearSession}
                className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950 text-slate-650 dark:text-slate-300 rounded-lg font-bold transition-all cursor-pointer text-[10px]"
              >
                Logout / Exit Session
              </button>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 border-t border-emerald-50/50 dark:border-emerald-900/20 pt-3">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-emerald-800 dark:text-amber-200 uppercase">Class Progressive Learning</span>
                <span className="font-mono">{completedAudiosCount} / {allAudiosCount} Audios Listened ({studentSession.progress || 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-emerald-950 h-3 rounded-full overflow-hidden border border-emerald-200/10">
                <div 
                  className="bg-emerald-600 dark:bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${studentSession.progress || 0}%` }} 
                />
              </div>
            </div>

            {/* Completion state messages */}
            {studentSession.completed ? (
              <div className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 text-center space-y-3">
                <Award className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-serif font-bold text-amber-800 dark:text-amber-200 text-xs">🎓 CONGRATULATIONS! COURSE GRADUATE</h4>
                <p className="text-slate-500 dark:text-slate-300 text-[11px] max-w-lg mx-auto">
                  You have successfully passed the CBT Exam and graduated from our free study program. Your official Certificate of Achievement is signed and ready!
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleDownloadPNG}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    📥 Download Certificate Image (PNG)
                  </button>
                  <button
                    onClick={handleSendToWhatsApp}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    💬 Send to My WhatsApp
                  </button>
                </div>
              </div>
            ) : allCompleted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 text-center space-y-3">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-natural-green dark:text-emerald-400 text-xs">📚 Lectures Fully Listened!</h4>
                <p className="text-slate-500 dark:text-slate-350 text-[11px] max-w-lg mx-auto">
                  You have completed 100% of the lectures in this module. To earn your printable certificate of completion, please complete the 5-question graduation CBT Exam.
                </p>
                {!showExam ? (
                  <button
                    type="button"
                    onClick={() => setShowExam(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl cursor-pointer transition-transform hover:scale-[1.01] inline-flex items-center gap-1.5"
                  >
                    🌟 Start Graduation CBT Exam (5 Marks)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExam(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px]"
                  >
                    Hide Exam Form
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-emerald-950/20 rounded-2xl p-4 text-center text-slate-450">
                <p className="text-[11px]">Keep listening to the remaining audio tracks to unlock the Graduation CBT Exam! ({allAudiosCount - completedAudiosCount} remaining)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. CBT EXAM SCREEN (Modal-like overlay or Inline card) */}
      {showExam && studentSession && !studentSession.completed && (
        <div className="max-w-xl mx-auto bg-white dark:bg-natural-dark border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-emerald-900/30 pb-3">
            <h3 className="font-serif font-bold text-sm text-natural-green dark:text-amber-100 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Laamiyyatu Ibn Taimiyyah Graduation CBT Exam</span>
            </h3>
            <button type="button" onClick={() => setShowExam(false)} className="text-slate-400 hover:text-slate-650">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10">
            <strong>Passing requirement:</strong> Answer at least 4 out of 5 questions correctly. Once you submit and pass, your graduation status is instant-synced to our records and your certificate will unlock!
          </div>

          {examFeedback && (
            <div className={`p-4 rounded-xl text-[11px] font-bold ${examScore !== null && examScore >= 4 ? "bg-emerald-50 text-emerald-850 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {examFeedback}
            </div>
          )}

          <form onSubmit={handleSubmitExam} className="space-y-6">
            {examQuestions.map((q, qIdx) => (
              <div key={q.id} className="space-y-2 text-left">
                <p className="font-bold text-slate-800 dark:text-white flex gap-1">
                  <span>{qIdx + 1}.</span>
                  <span>{q.question}</span>
                </p>
                <div className="grid grid-cols-1 gap-2 pl-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = examAnswers[qIdx] === optIdx;
                    return (
                      <label 
                        key={optIdx} 
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center gap-2.5 text-xs ${
                          isSelected 
                            ? "bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-600 dark:border-amber-500 text-emerald-950 dark:text-white font-bold" 
                            : "bg-slate-50/40 dark:bg-emerald-950/5 border-slate-200 dark:border-emerald-900/30 hover:bg-slate-50 dark:hover:bg-emerald-950/10 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          disabled={examSubmitted && examScore !== null && examScore >= 4}
                          onChange={() => {
                            setExamAnswers({
                              ...examAnswers,
                              [qIdx]: optIdx
                            });
                          }}
                          className="accent-emerald-600 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {(!examSubmitted || (examScore !== null && examScore < 4)) && (
              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow cursor-pointer transition-all uppercase tracking-wider"
              >
                Submit CBT Exam Answers
              </button>
            )}
          </form>
        </div>
      )}

      {/* 4. AUDIO & PICTURE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PICTURE DISPLAY & AUDIO PLAYLIST */}
        <div className="lg:col-span-5 space-y-6">
          {/* COURSE PICTURE */}
          {data.imageUrl && (
            <div className="bg-white dark:bg-natural-dark rounded-3xl p-3 border border-emerald-50 dark:border-emerald-900/40 shadow-sm overflow-hidden">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                <img 
                  src={data.imageUrl} 
                  alt={data.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                <div className="absolute bottom-3 left-3 bg-natural-green/80 text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase flex items-center gap-1 backdrop-blur-xs">
                  <ImageIcon className="w-3 h-3 text-natural-gold" />
                  <span>Course Material</span>
                </div>
              </div>
            </div>
          )}

          {/* AUDIO TRACKS */}
          <div className="bg-white dark:bg-natural-dark rounded-3xl p-6 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-natural-green dark:text-amber-100 flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-900/35 pb-2.5">
              <Volume2 className="w-4 h-4 text-natural-gold" />
              <span>Audio Recitations & Lectures</span>
            </h3>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {data.audioFiles && data.audioFiles.map((file) => {
                const isCompleted = studentSession?.completedAudios?.includes(file.id);
                return (
                  <div 
                    key={file.id} 
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      playingId === file.id
                        ? "bg-emerald-50/30 dark:bg-emerald-950/40 border-natural-gold"
                        : isCompleted
                        ? "bg-slate-50/40 dark:bg-emerald-950/5 border-emerald-100 dark:border-emerald-900/10 opacity-90"
                        : "bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-50/45 dark:border-emerald-900/20"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {studentSession && (
                          <button
                            type="button"
                            onClick={() => toggleTrackCompletion(file.id)}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              isCompleted 
                                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" 
                                : "text-slate-350 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-emerald-950/30"
                            }`}
                            title={isCompleted ? "Mark as uncompleted" : "Mark as completed"}
                          >
                            <Check className={`w-4 h-4 ${isCompleted ? "stroke-[3px]" : "stroke-[1.5px]"}`} />
                          </button>
                        )}
                        <h4 className="font-bold text-xs text-natural-green dark:text-amber-150 truncate">
                          {file.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-350 leading-relaxed line-clamp-2 pl-7">
                        {file.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handlePlayPause(file.id, file.url)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-all ${
                        playingId === file.id
                          ? "bg-natural-gold text-white scale-105"
                          : "bg-natural-green hover:bg-emerald-800 text-white"
                      }`}
                    >
                      {playingId === file.id ? (
                        <Pause className="w-4 h-4 text-white fill-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      )}
                    </button>
                  </div>
                );
              })}
              {(!data.audioFiles || data.audioFiles.length === 0) && (
                <p className="text-center text-xs text-slate-400 py-6">No audio files uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: POEM TEXT VIEW */}
        <div className="lg:col-span-7 bg-white dark:bg-natural-dark rounded-3xl p-6 sm:p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-natural-green dark:text-amber-100 flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-900/35 pb-3">
            <FileText className="w-4 h-4 text-natural-gold" />
            <span>Classical Verses Text (المنظومة اللامية)</span>
          </h3>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {data.poemArabicText && data.poemArabicText.map((line, idx) => (
              <div 
                key={idx}
                className="p-4 bg-natural-sage/10 dark:bg-natural-green/10 rounded-2xl border border-emerald-50/50 dark:border-natural-green/20 hover:border-natural-gold/50 transition-colors"
              >
                {/* Arabic Line */}
                <div className="text-right text-base sm:text-lg font-serif text-natural-green dark:text-amber-100 leading-loose">
                  {line}
                </div>
                {/* Divider */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-100 dark:via-emerald-900 to-transparent my-2" />
                {/* Translation Line */}
                <div className="text-left text-xs text-slate-500 dark:text-emerald-350 italic font-sans leading-relaxed pl-1">
                  {data.poemTranslationText && data.poemTranslationText[idx] 
                    ? data.poemTranslationText[idx] 
                    : "No translation added."}
                </div>
              </div>
            ))}
            {(!data.poemArabicText || data.poemArabicText.length === 0) && (
              <p className="text-center text-xs text-slate-400 py-6">No poem verses uploaded yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
