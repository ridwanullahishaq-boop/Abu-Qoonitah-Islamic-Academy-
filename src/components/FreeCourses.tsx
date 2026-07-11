/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Volume2, Play, Pause, AlertCircle, RefreshCw, FileText, ImageIcon } from "lucide-react";

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

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans animate-fade-in">
      
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

      {/* 2. AUDIO & PICTURE SECTION */}
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
                    // Fallback if image fails or is bad URL
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

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {data.audioFiles && data.audioFiles.map((file) => (
                <div 
                  key={file.id} 
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    playingId === file.id
                      ? "bg-emerald-50/30 dark:bg-emerald-950/40 border-natural-gold"
                      : "bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-50/45 dark:border-emerald-900/20"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-xs text-natural-green dark:text-amber-150 truncate">
                      {file.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-350 leading-relaxed line-clamp-2">
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
              ))}
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

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
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
