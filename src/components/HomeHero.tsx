/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Users, Globe, Award, Calendar, ChevronRight, MessageSquare, Flame, CheckCircle, Volume2, Heart } from "lucide-react";
import { motion } from "motion/react";

interface HomeHeroProps {
  isArabic: boolean;
  setActivePage: (page: string) => void;
  isDarkMode: boolean;
}

export default function HomeHero({ isArabic, setActivePage, isDarkMode }: HomeHeroProps) {
  const [stats, setStats] = useState({ students: 382, teachers: 15, courses: 9, countries: 42 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [quote, setQuote] = useState({ arabic: "", translation: "", source: "" });

  useEffect(() => {
    // Fetch statistics
    fetch("/api/public/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error loading stats:", err));

    // Fetch announcements
    fetch("/api/public/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error("Error loading announcements:", err));

    // Fetch calendar events
    fetch("/api/public/calendar")
      .then((res) => res.json())
      .then((data) => setCalendarEvents(data.slice(0, 3)))
      .catch((err) => console.error("Error loading calendar:", err));

    // Fetch testimonials
    fetch("/api/public/testimonials")
      .then((res) => res.json())
      .then((data) => setTestimonials(data))
      .catch((err) => console.error("Error loading testimonials:", err));

    // Fetch quote
    fetch("/api/public/quote")
      .then((res) => res.json())
      .then((data) => setQuote(data))
      .catch((err) => console.error("Error loading quote:", err));
  }, []);

  const featuredCourses = [
    {
      id: "course-beg-1",
      level: "Beginner",
      titleEn: "Introduction to Arabic Alphabet",
      titleAr: "مقدمة الحروف العربية",
      teacherEn: "Shaykh Ahmed Al-Misri",
      teacherAr: "الشيخ أحمد المصري",
      duration: "6 Weeks",
      descEn: "Master pronunciation and writing. Perfect for absolute beginners starting their Islamic path.",
      descAr: "إتقان مخارج الحروف العربية ونطقها وكتابتها للمبتدئين.",
    },
    {
      id: "course-beg-2",
      level: "Beginner",
      titleEn: "Basic Tajweed Rules",
      titleAr: "قواعد التجويد للمبتدئين",
      teacherEn: "Shaykh Ahmed Al-Misri",
      teacherAr: "الشيخ أحمد المصري",
      duration: "8 Weeks",
      descEn: "Learn the rules of Noon Sakinah and Tanween to recite Quran elegantly with clarity.",
      descAr: "شرح أحكام النون الساكنة والتنوين وتلاوة القرآن بطريقة صحيحة.",
    },
    {
      id: "course-int-1",
      level: "Intermediate",
      titleEn: "Introduction to Al-Nahw (Arabic Grammar)",
      titleAr: "مقدمة علم النحو",
      teacherEn: "Ustadh Abu Qoonitah",
      teacherAr: "أستاذ أبو قانتة",
      duration: "10 Weeks",
      descEn: "Examine word classifications and grammar states to decode sentence structures easily.",
      descAr: "شرح تقسيم الكلمة والعلامات الإعرابية وتبسيط قواعد التركيب.",
    }
  ];

  return (
    <div className="space-y-20 pb-20 transition-colors duration-200 bg-natural-bg dark:bg-natural-dark/40">
      
      {/* 1. HERO SECTION WITH ARABESQUE GRAPHIC */}
      <section className="relative overflow-hidden bg-natural-green dark:bg-natural-dark py-24 px-4 sm:px-6 lg:px-8 border-b-8 border-natural-gold shadow-xl">
        {/* Decorative background grid overlays & gradient blooms */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 border-[30px] border-emerald-800/20 rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20px] left-[20%] w-32 h-32 bg-natural-gold/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <path d="M50,0 L100,50 L50,100 L0,50 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Welcome Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 bg-emerald-700/50 rounded-full text-xs font-bold tracking-widest uppercase mb-2 border border-emerald-600/60 text-emerald-50">
              {isArabic ? "أكاديمية إسلامية رقمية متكاملة" : "Modern Online Madrasah"}
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light tracking-tight text-white leading-[1.15]">
              {isArabic ? (
                <>
                  تعلم العلوم الشرعية الأصيلة <br />
                  <span className="text-natural-gold font-serif italic font-normal">من منبعها الصافي</span>
                </>
              ) : (
                <>
                  Cultivating Authentic <br />
                  <span className="text-natural-gold font-serif italic font-normal">Islamic Excellence</span>
                </>
              )}
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              {isArabic ? (
                "تقدم أكاديمية أبو قانتة الإسلامية برامج تعليمية ممنهجة للأطفال والشباب والكبار لتمكينهم من فهم وتلاوة القرآن الكريم وإتقان قواعد اللغة العربية بأحدث التقنيات الرقمية."
              ) : (
                "Join a global community of learners seeking pure knowledge. Abu Qoonitah Islamic Academy provides highly structured academic tracks in Quran recitation, Tajweed, classical Arabic grammar, and authentic Aqeedah."
              )}
            </p>

            {/* CTA Actions */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <button
                id="hero-enroll-now"
                onClick={() => setActivePage("register")}
                className="px-8 py-4 bg-white text-natural-green font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center gap-2"
              >
                <span>{isArabic ? "سجل الآن" : "Enroll Now"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                id="hero-explore-courses"
                onClick={() => setActivePage("courses")}
                className="px-8 py-4 bg-emerald-700/40 border border-emerald-600/50 text-white font-bold rounded-xl hover:scale-[1.02] transition-all text-sm"
              >
                {isArabic ? "استكشف المناهج الدراسية" : "Explore Curriculum"}
              </button>
              <button
                id="hero-donate-now"
                onClick={() => setActivePage("donate")}
                className="px-6 py-4 bg-natural-gold text-white font-bold rounded-xl shadow-lg shadow-yellow-500/20 hover:scale-[1.02] transition-all text-sm flex items-center gap-2"
              >
                <span>{isArabic ? "تبرع الآن" : "Donate Now"}</span>
                <Heart className="w-4 h-4 text-white animate-pulse" />
              </button>
            </div>
          </div>

          {/* Aesthetic Islamic Art Graphic Representation */}
          <motion.div 
            className="lg:col-span-5 flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <motion.div 
              className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-3xl bg-natural-green/40 border border-emerald-700/40 p-4 shadow-2xl flex items-center justify-center overflow-hidden"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              {/* Islamic Pattern rotating frames mockup */}
              <motion.div 
                className="absolute inset-2 border-2 border-natural-gold/30 rounded-2xl" 
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-4 border border-dashed border-emerald-700/60 rounded-xl" 
                animate={{ rotate: [0, -360] }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-8 border border-double border-natural-gold/10 rounded-full" 
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              />
              
              <div className="text-center space-y-4 z-10 px-6">
                <motion.div 
                  className="w-20 h-20 mx-auto rounded-xl bg-natural-green flex items-center justify-center border-2 border-natural-gold shadow-inner cursor-pointer"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  animate={{ boxShadow: ["0px 0px 0px rgba(212, 175, 55, 0)", "0px 0px 20px rgba(212, 175, 55, 0.4)", "0px 0px 0px rgba(212, 175, 55, 0)"] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <BookOpen className="w-10 h-10 text-natural-gold" />
                </motion.div>
                <h3 className="font-serif text-3xl font-light text-natural-gold">أبو قانتة</h3>
                <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
                  Abu Qoonitah Academy
                </p>
                <div className="h-[2px] bg-gradient-to-r from-transparent via-natural-gold to-transparent w-full" />
                <p className="font-serif text-xs italic text-emerald-150 leading-relaxed">
                  "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ" <br />
                  <span className="block mt-1 font-sans text-[10px] text-natural-gold tracking-wider font-semibold">— Surah Al-Alaq 1</span>
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* 3. FEATURED COURSES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-natural-gold tracking-widest uppercase">
            {isArabic ? "برامجنا الدراسية المتميزة" : "Explore Curriculums"}
          </span>
          <h2 className="text-3xl font-serif font-light text-natural-green dark:text-white">
            {isArabic ? "دورات منتقاة لبدء رحلتك العلمية" : "Featured Madrasah Learning Programs"}
          </h2>
          <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCourses.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-natural-dark rounded-3xl p-6 shadow-sm hover:shadow-md border border-emerald-50 dark:border-emerald-900/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="px-3 py-1 text-[9px] font-bold bg-natural-sage dark:bg-natural-green text-natural-green dark:text-natural-gold uppercase rounded-full">
                  {c.level}
                </span>
                <h3 className="text-lg font-bold text-natural-green dark:text-amber-100">
                  {isArabic ? c.titleAr : c.titleEn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300 leading-relaxed">
                  {isArabic ? c.descAr : c.descEn}
                </p>
                <div className="text-[11px] text-slate-400">
                  <span>{isArabic ? "المعلم:" : "Instructor:"} </span>
                  <span className="font-semibold text-natural-green dark:text-emerald-200">{isArabic ? c.teacherAr : c.teacherEn}</span>
                </div>
              </div>

              <div className="border-t border-emerald-50 dark:border-emerald-900/40 mt-6 pt-4 flex justify-between items-center">
                <span className="text-[10px] font-mono font-semibold bg-natural-sage dark:bg-natural-green/45 text-natural-green dark:text-natural-gold px-2.5 py-1 rounded-full">
                  {c.duration}
                </span>
                <button
                  onClick={() => setActivePage("courses")}
                  className="text-xs text-natural-gold hover:text-amber-600 font-bold flex items-center gap-1 group"
                >
                  <span>{isArabic ? "عرض التفاصيل" : "View Curriculum"}</span>
                  <ChevronRight className="w-4.5 h-4.5 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ANNOUNCEMENTS & CALENDAR EVENTS BENTO LAYOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Latest Announcements Column */}
        <div className="lg:col-span-7 bg-white dark:bg-natural-dark rounded-3xl p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-natural-green dark:text-amber-100 flex items-center gap-2 font-serif">
            <span className="w-1.5 h-6 bg-natural-gold rounded-full" />
            {isArabic ? "لوحة الإعلانات الأكاديمية" : "Latest Academy Announcements"}
          </h3>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 bg-natural-sage/20 dark:bg-natural-green/20 rounded-2xl border border-emerald-50/50 dark:border-natural-green/30"
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-natural-green dark:text-emerald-100">
                    {ann.title}
                  </h4>
                  <span className="text-[9px] font-mono text-natural-gold">
                    {new Date(ann.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-emerald-350 mt-2 leading-relaxed">
                  {ann.content}
                </p>
                <div className="text-[9px] text-natural-gold dark:text-amber-400 font-bold uppercase mt-2">
                  By {ann.author}
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-xs text-center text-slate-400">
                {isArabic ? "لا توجد إعلانات حالية." : "No announcements posted yet."}
              </p>
            )}
          </div>
        </div>

        {/* Academic Calendar / Upcoming Events Column */}
        <div className="lg:col-span-5 bg-white dark:bg-natural-dark rounded-3xl p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-natural-green dark:text-amber-100 flex items-center gap-2 font-serif">
            <span className="w-1.5 h-6 bg-natural-gold rounded-full" />
            {isArabic ? "التقويم الدراسي والقادم" : "Upcoming Academic Events"}
          </h3>

          <div className="space-y-4">
            {calendarEvents.map((event) => (
              <div key={event.id} className="flex gap-4 items-start">
                <div className="w-12 text-center flex-shrink-0 bg-natural-sage dark:bg-natural-green/40 rounded-xl p-1.5 border border-emerald-50 dark:border-natural-green/40 font-mono">
                  <span className="block text-[9px] text-natural-green dark:text-natural-gold uppercase font-bold leading-none">
                    {new Date(event.date).toLocaleDateString([], { month: "short" })}
                  </span>
                  <span className="block text-sm font-bold text-natural-green dark:text-amber-200 mt-1">
                    {new Date(event.date).toLocaleDateString([], { day: "numeric" })}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-natural-green dark:text-emerald-100 leading-tight">
                    {event.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-400 mt-1">
                    {event.description}
                  </p>
                  <span className="inline-block text-[9px] font-bold uppercase text-natural-green dark:text-natural-gold mt-1.5 bg-natural-sage dark:bg-natural-green/30 px-2.5 py-0.5 rounded-full">
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* 5. TESTIMONIALS & TRUST SECTION */}
      <section className="bg-natural-green text-white py-16 px-4 sm:px-6 lg:px-8 shadow-inner rounded-3xl max-w-7xl mx-auto border-t border-b border-emerald-700">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-natural-gold uppercase tracking-widest block">
              {isArabic ? "آراء الطلاب وأولياء الأمور" : "Student Voices"}
            </span>
            <h2 className="text-3xl font-serif font-light text-white">
              {isArabic ? "ماذا يقول شركاء النجاح عن الأكاديمية" : "What Our Community Says About Us"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-emerald-900/40 rounded-3xl p-6 border border-emerald-800/60 shadow-md space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Rating stars */}
                  <div className="flex gap-1 text-natural-gold">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="text-xs text-emerald-100 italic leading-relaxed">
                    "{t.content}"
                  </p>
                </div>
                <div className="border-t border-emerald-850 pt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <span className="text-[10px] text-natural-gold font-semibold">{t.role}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
