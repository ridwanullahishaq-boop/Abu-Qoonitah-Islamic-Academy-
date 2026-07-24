import React from "react";
import { Sparkles, Globe } from "lucide-react";

interface WelcomeTickerProps {
  isArabic: boolean;
}

export default function WelcomeTicker({ isArabic }: WelcomeTickerProps) {
  const messageEn = "✨ Welcome to Abu Qoonitah Islamic Academy — Empowering Sacred Knowledge, Character & Faith! Explore Online Madrasah, Free Matn Courses, Islamic Library & TV Sermons!";
  const messageAr = "✨ مرحباً بكم في أكاديمية أبي قنيطة الإسلامية — أهلاً وسهلاً بكم في صرح العلم الشرعي والتميز والأخلاق! استكشف المدرسة الرقمية، والدورات المجانية، والمكتبة الإسلامية، والبث المباشر!";

  const message = isArabic ? messageAr : messageEn;

  // Repeat text to fill the scrolling track continuously
  const items = [message, message, message, message];

  return (
    <div
      className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-amber-200 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-950 border-b border-natural-gold/30 text-xs py-2 overflow-hidden select-none relative shadow-sm z-50"
      dir={isArabic ? "rtl" : "ltr"}
      title={isArabic ? "شريط الترحيب المتحرك" : "Welcome Marquee"}
    >
      <div className="flex items-center overflow-hidden">
        <div
          className={`whitespace-nowrap flex items-center gap-8 ${
            isArabic ? "animate-marquee-rtl" : "animate-marquee-ltr"
          }`}
        >
          {/* First sequence of repeated items */}
          <div className="flex items-center gap-8 shrink-0">
            {items.map((item, idx) => (
              <span key={`group1-${idx}`} className="flex items-center gap-3 font-serif font-medium tracking-wide">
                <span className="text-amber-300 font-bold">{item}</span>
                <span className="text-natural-gold/60 text-[10px]">◆</span>
              </span>
            ))}
          </div>

          {/* Second sequence of repeated items (Duplicate for seamless continuous loop) */}
          <div className="flex items-center gap-8 shrink-0">
            {items.map((item, idx) => (
              <span key={`group2-${idx}`} className="flex items-center gap-3 font-serif font-medium tracking-wide">
                <span className="text-amber-300 font-bold">{item}</span>
                <span className="text-natural-gold/60 text-[10px]">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
