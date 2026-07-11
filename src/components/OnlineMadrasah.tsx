/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, CheckCircle, GraduationCap, Award, Compass, Heart, ArrowRight } from "lucide-react";

interface OnlineMadrasahProps {
  isArabic: boolean;
  onEnrollClick: () => void;
}

export default function OnlineMadrasah({ isArabic, onEnrollClick }: OnlineMadrasahProps) {
  const [curriculumData, setCurriculumData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/curriculum")
      .then((res) => res.json())
      .then((data) => setCurriculumData(data))
      .catch((err) => console.error("Error fetching curriculum:", err));
  }, []);

  const whyEnrolReasons = [
    {
      titleEn: "Authorized Classical Teachings",
      titleAr: "التعليم المنهجي المؤصل",
      descEn: "Our lessons are strictly grounded in authentic Quran, Sunnah, and classical textbooks following traditional scholarship.",
      descAr: "دروسنا مبنية على الكتاب والسنة وفهم سلف الأمة بالاعتماد على المتون المعتمدة."
    },
    {
      titleEn: "Elite Direct Oversight",
      titleAr: "إشراف مباشر مستمر",
      descEn: "Receive individual testing, homework corrections, and recitation clearance from certified, patient shuyookh.",
      descAr: "احصل على تسميع يومي، وتصحيح الواجبات، ومتابعة خاصة من معلم مرخص ومجاز."
    },
    {
      titleEn: "Modern LMS Accessibility",
      titleAr: "سهولة الوصول والتعلم",
      descEn: "Examine recorded videos, download PDF curriculum kits, write quizzes, and track grades on any smart device.",
      descAr: "شاهد المحاضرات المسجلة، وحمل المذكرات، وحل الاختبارات، وتتبع درجاتك بسهولة."
    },
    {
      titleEn: "Structured Academic Progression",
      titleAr: "تدرج علمي مدروس",
      descEn: "Graduate step-by-step from absolute basic literacy to complex classical commentaries with official verification.",
      descAr: "تدرج في طلب العلم من الأحرف الهجائية إلى شروح المتون الكبرى واحصل على شهادات معتمدة."
    }
  ];

  const defaultSections = [
    {
      id: "cur-1",
      titleEn: "Beginner Class",
      titleAr: "مرحلة المبتدئين",
      items: [
        { nameEn: "Level 1 Spelling and reading class", nameAr: "المستوى الأول: التهجئة والقراءة الصحيحة" },
        { nameEn: "Level 2 Quran (Juz Ammah), 100 Hadith, Fiqh, Tawheed", nameAr: "المستوى الثاني: حفظ جزء عم، 100 حديث، الفقه العقدي، التوحيد" },
        { nameEn: "Level 3 Quran (Juz Tabaarak), 40 Hadith, Al-Akhdori, Thalaathatul Usool", nameAr: "المستوى الثالث: حفظ جزء تبارك، الأربعين النووية، متن الأخضري، ثلاثة الأصول" }
      ]
    },
    {
      id: "cur-2",
      titleEn: "Intermediate Class (Zad Academic Book)",
      titleAr: "المرحلة المتوسطة (كتاب زاد المستقنع والأكاديمي)",
      items: [
        { nameEn: "Level 1 - First Semester Book: Fiqh, Tawheed, Hadith, Arabiyyah, Seerah", nameAr: "المستوى الأول - الفصل الدراسي الأول: الفقه، التوحيد، الحديث، العربية، السيرة النبوية" },
        { nameEn: "Level 1 - Second Semester Book: Fiqh, Tawheed, Hadith, Arabiyyah, Seerah", nameAr: "المستوى الأول - الفصل الدراسي الثاني: الفقه، التوحيد، الحديث، العربية، السيرة النبوية" },
        { nameEn: "Level 2 - First Semester Book: Fiqh, Tawheed, Hadith, Arabiyyah, Seerah", nameAr: "المستوى الثاني - الفصل الدراسي الأول: الفقه، التوحيد، الحديث، العربية، السيرة النبوية" },
        { nameEn: "Level 2 - Second Semester Book: Fiqh, Tawheed, Hadith, Arabiyyah, Seerah", nameAr: "المستوى الثاني - الفصل الدراسي الثاني: الفقه، التوحيد، الحديث، العربية، السيرة النبوية" }
      ]
    }
  ];

  const sections = curriculumData?.sections || defaultSections;
  const whyEnrollText = curriculumData?.whyEnroll || (isArabic
    ? "ندعوك للبدء في رحلة علمية مباركة تجمع بين أصالة المنهج ومرونة العصر الرقمي لبناء التميز الشرعي."
    : "Abu Qoonitah Islamic Academy provides a structured online Madrasah environment that blends the depth of classical, traditional texts with the speed and reach of modern LMS technology. Gain a firm foundation in Tajweed, Arabic grammar, and authentic Islamic creed under certified teachers with direct supervision.");

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans animate-fade-in">
      
      {/* 1. HERO HEADER */}
      <div className="text-center space-y-4">
        <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-natural-gold rounded-full text-xs font-bold uppercase tracking-widest">
          {isArabic ? "برنامج المدرسة الرقمية المتكامل" : "Online Madrasah Program"}
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-natural-green dark:text-white leading-tight">
          {isArabic ? "لماذا تنضم إلينا ومنهجنا الأكاديمي" : "Why You Should Enrol & Our Curriculum"}
        </h1>
        <div className="h-0.5 bg-natural-gold w-24 mx-auto rounded" />
        <p className="text-slate-500 dark:text-emerald-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
          {whyEnrollText}
        </p>
      </div>

      {/* 2. WHY ENROL SECTION */}
      <section className="space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-serif text-natural-green dark:text-amber-100 font-light">
            {isArabic ? "أبرز مميزات الدراسة بالأكاديمية" : "Key Benefits of Studying with Us"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyEnrolReasons.map((reason, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-natural-dark p-6 rounded-3xl border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-3 hover:shadow-md hover:scale-[1.01] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-natural-sage/35 dark:bg-emerald-950 flex items-center justify-center text-natural-green dark:text-natural-gold">
                <CheckCircle className="w-5 h-5 text-natural-gold" />
              </div>
              <h3 className="font-bold text-sm text-natural-green dark:text-amber-200">
                {isArabic ? reason.titleAr : reason.titleEn}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-350 leading-relaxed">
                {isArabic ? reason.descAr : reason.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE CURRICULUM SYLLABUS SECTION */}
      <section className="bg-white dark:bg-natural-dark rounded-3xl p-6 sm:p-10 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-10">
        <div className="text-center space-y-2">
          <GraduationCap className="w-10 h-10 text-natural-gold mx-auto animate-bounce" />
          <h2 className="text-2xl font-serif text-natural-green dark:text-white font-light">
            {isArabic ? "خطة المناهج والمستويات الأكاديمية" : "Academic Syllabus & Level Curriculums"}
          </h2>
          <p className="text-[11px] text-slate-400">
            {isArabic ? "مناهج مبسطة للمبتدئين وتفصيلية للمتقدمين" : "Highly structured, scholarly pathways developed for progressive literacy."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          {sections.map((sec: any, idx: number) => (
            <div 
              key={sec.id || idx}
              className={`${idx === 0 ? "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/50" : "bg-amber-50/10 dark:bg-amber-950/5 border-amber-100/20 dark:border-amber-950/20"} rounded-2xl p-6 border space-y-6`}
            >
              <div className="flex justify-between items-center border-b border-emerald-100 dark:border-emerald-900 pb-3">
                <div>
                  <span className="text-[10px] text-natural-gold font-bold uppercase tracking-wider block">
                    {idx === 0 ? "FOUNDATION TRACK" : "CLASSICAL STUDY"}
                  </span>
                  <h3 className="text-lg font-bold text-natural-green dark:text-amber-100 font-serif">
                    {isArabic ? sec.titleAr : sec.titleEn}
                  </h3>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                  {idx === 0 ? (isArabic ? "التأسيس" : "Foundation") : (isArabic ? "مستوى معتمد" : "Academic")}
                </span>
              </div>

              {idx === 1 && (
                <p className="text-xs text-natural-gold font-bold italic">
                  ✨ Core Reference Textbook: Zad Academic Book
                </p>
              )}

              <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {sec.items && sec.items.map((item: any, itemIdx: number) => (
                  <div key={itemIdx} className="p-3 bg-white dark:bg-natural-dark rounded-xl border border-emerald-100/30 dark:border-emerald-900/30 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-natural-gold" />
                      <h4 className="font-bold text-natural-green dark:text-amber-150">
                        {isArabic ? item.nameAr : item.nameEn}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CALL TO ACTION FOR ADMISSIONS */}
      <section className="bg-natural-green text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-lg border border-emerald-700">
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full border-[15px] border-emerald-800/30" />
        <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 rounded-full border-[15px] border-emerald-800/30" />
        
        <h2 className="text-2xl sm:text-3xl font-serif text-amber-300">
          {isArabic ? "ابدأ طلب العلم الشرعي المنهجي اليوم" : "Enroll & Secure Your Academic Roster Slot"}
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
          {isArabic 
            ? "التسجيل مفتوح حاليًا لجميع الفئات وسنبدأ مستوانا التأسيسي من الصفر مع المتابعة اليومية المكثفة."
            : "Admissions are active. Note that as a policy of authentic academic rigor, all newly registered students will start from the beginner level to ensure correct fundamentals."}
        </p>
        
        <div className="pt-2">
          <button
            onClick={onEnrollClick}
            className="px-8 py-3.5 bg-natural-gold hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 mx-auto shadow-md cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            <span>{isArabic ? "سجل الآن وابدأ الدراسة" : "Enroll Now & Submit Admission"}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </section>

    </div>
  );
}
