/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Award, Compass, Heart, Users, Target, CheckCircle2, BookOpen, MessageCircle } from "lucide-react";

interface AboutUsProps {
  isArabic: boolean;
  activePage: string; // 'about' or 'vision'
}

export default function AboutUs({ isArabic, activePage }: AboutUsProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [aboutData, setAboutData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/about")
      .then((res) => res.json())
      .then((data) => setAboutData(data))
      .catch((err) => console.error("Error fetching about data:", err));
  }, []);

  const values = aboutData?.values || [
    { titleEn: "Sincerity (Ikhlas)", titleAr: "الإخلاص", descEn: "All learning and service are dedicated purely for the cause of Allah.", descAr: "أن يكون العمل خالصًا لوجه الله الكريم ونفع المسلمين." },
    { titleEn: "Authenticity (Asalah)", titleAr: "الأصالة الشرعية", descEn: "Knowledge grounded in Quran and Sunnah, following the righteous predecessors.", descAr: "تأصيل المعارف الشرعية بالاعتماد على الكتاب والسنة الصحيحة." },
    { titleEn: "Academic Excellence", titleAr: "التميز الأكاديمي", descEn: "Utilizing modern educational pedagogy to deliver high comprehension rates.", descAr: "اتباع أفضل المناهج والوسائل الحديثة لتسهيل الفهم والحفظ." },
    { titleEn: "Moral Character (Adab)", titleAr: "الأدب والأخلاق", descEn: "Nurturing students in high ethical conduct alongside academic proficiency.", descAr: "تربية النفوس على مكارم الأخلاق والسمت الإسلامي القويم." }
  ];

  const faqs = aboutData?.faqs || [
    {
      qEn: "Who is the founder of Abu Qoonitah Islamic Academy?",
      qAr: "من هو مؤسس أكاديمية أبو قانتة الإسلامية؟",
      aEn: "The academy was founded by Ustadh Abu Qoonitah, an authorized (Mujeez) classical Arabic and Islamic studies instructor with extensive experience teaching Tajweed and Arabic grammar to students globally.",
      aAr: "تأسست الأكاديمية بإشراف الأستاذ أبو قانتة، وهو معلم مجاز ومتخصص في تدريس العلوم العربية والقرآنية وله خبرة طويلة في تأهيل طلبة العلم حول العالم."
    },
    {
      qEn: "What are the age groups for the classes?",
      qAr: "ما هي الفئات العمرية المستهدفة في الحلقات؟",
      aEn: "We offer tailored classes for children (6-12), teenagers (13-18), and adult tracks for university students and general seekers.",
      aAr: "لدينا برامج مخصصة للأطفال (من سن ٦ إلى ١٢ سنة)، وللناشئين والشباب، بالإضافة إلى مسارات مخصصة للكبار وطلبة الجامعات."
    },
    {
      qEn: "How do paid and free courses differ?",
      qAr: "ما الفرق بين الدورات المجانية والدورات المدفوعة؟",
      aEn: "Free courses contain pre-recorded video lessons and study handouts. Paid levels provide live-streamed tutoring, grading systems, interactive quizzes, direct assignments, and authorized graduation certificates.",
      aAr: "الدروس المجانية مفتوحة للجميع وتحتوي على تسجيلات ومذكرات مبسطة. أما المسارات المدفوعة فتشتمل على حلقات تفاعلية، ومتابعة يومية، واختبارات، وشهادات تخرج معتمدة."
    },
    {
      qEn: "Can I learn at my own pace?",
      qAr: "هل يمكنني الدراسة بحسب وتيرتي الخاصة؟",
      aEn: "Yes, our digital Madrasah platform tracks your progress. You can watch recorded lecture videos and submit your assignments whenever you are ready.",
      aAr: "نعم، نظام المدرسة الرقمية يسجل تقدمك تلقائياً؛ وبذلك تستطيع مشاهدة الحلقات المسجلة وتسليم الواجبات في أي وقت يناسبك."
    }
  ];

  const historyEn = aboutData?.historyEn || "Abu Qoonitah Islamic Academy started as a focused public initiative to teach basic Tajweed and Arabic to non-native speakers. It rapidly blossomed into a comprehensive digital Madrasah serving thousands of students across the globe with structured modules, daily assignments, and direct teacher oversight.";
  const historyAr = aboutData?.historyAr || "انطلقت أكاديمية أبو قانتة الإسلامية كمبادرة لتعليم مبادئ التجويد واللغة العربية للناطقين بغيرها، ثم سرعان ما تطورت لتصبح صرحًا تعليميًا إسلاميًا متكاملاً يخدم آلاف الطلاب من مختلف دول العالم عبر الفصول الافتراضية الممنهجة واللقاءات الحية المتكررة.";
  const founderBioEn = aboutData?.founderBioEn || "Ustadh Abu Qoonitah is a seasoned instructor specializing in classical Arabic grammar (Nahw/Sarf) and Quran recitation. He has spent years breaking down dense texts like 'Al-Ajurrumiyyah' and establishing phonetic clarity for students around the world, aiming to re-connect Muslims directly with the language of Revelation.";
  const founderBioAr = aboutData?.founderBioAr || "الأستاذ أبو قانتة متخصص في تدريس النحو والصرف، ومجاز برواية حفص عن عاصم، كرس سنوات عديدة في تبسيط متون النحو كـ'الآجرومية' وتيسير مخارج الحروف للطلاب غير الناطقين بلسان عربي مبين، هادفًا لربط الأمة بلغة وحي رب العالمين.";

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  if (activePage === "vision") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-natural-gold tracking-widest uppercase">
            {isArabic ? "رؤيتنا الأكاديمية وفلسفتنا" : "Philosophy & Direction"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-light text-natural-green dark:text-white">
            {isArabic ? "رؤية الأكاديمية وأهدافها البعيدة" : "Vision, Mission & Core Goals"}
          </h1>
          <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />
        </div>

        {/* Vision, Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-natural-dark rounded-3xl p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-natural-sage dark:bg-natural-green/40 flex items-center justify-center text-natural-green dark:text-natural-gold">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-natural-green dark:text-natural-gold">
              {isArabic ? "رؤيتنا" : "Our Vision"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-emerald-350 leading-relaxed">
              {isArabic
                ? "أن نكون المنصة الرقمية الأكثر موثوقية وتميزًا عالميًا في تدريس كتاب الله واللغة العربية والعلوم الشرعية بما يسهم في إحياء الفهم السليم والواعي للإسلام."
                : "To be the most trusted and distinctive online platform globally for Quranic studies, Arabic grammar, and Shariah sciences, fostering a sound, pure understanding of Islamic heritage."}
            </p>
          </div>

          <div className="bg-white dark:bg-natural-dark rounded-3xl p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-natural-sage dark:bg-natural-green/40 flex items-center justify-center text-natural-green dark:text-natural-gold">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-natural-green dark:text-natural-gold">
              {isArabic ? "رسالتنا" : "Our Mission"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-emerald-350 leading-relaxed">
              {isArabic
                ? "توفير تعليم إسلامي متكامل بجودة عالية، من خلال مناهج تقليدية متدرجة، ومحاضرين مجازين، ومنصة تقنية عصرية تلائم شتى فئات الدارسين."
                : "Providing high-quality integrated Islamic education through systematic, traditional curriculums, certified and patient instructors, and a modern technology portal tailored to worldwide seekers."}
            </p>
          </div>
        </div>

        {/* Goals / Long Term Plans */}
        <div className="bg-natural-green text-white rounded-3xl p-8 sm:p-12 shadow-md space-y-8">
          <h2 className="text-2xl font-bold text-center text-amber-300">
            {isArabic ? "خطط الأكاديمية بعيدة المدى" : "Strategic Long-Term Plans"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="text-amber-400 font-mono text-3xl font-extrabold">01</div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">{isArabic ? "تحقيق الموثوقية" : "Establish Integrity"}</h4>
              <p className="text-xs text-emerald-200 leading-relaxed">
                {isArabic ? "إتاحة مناهج معتمدة ومقروءة على كبار العلماء لحماية العقيدة والفهم." : "Delivering validated curriculums certified by scholars to ensure authentic doctrinal guidance."}
              </p>
            </div>
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-emerald-800 pt-6 md:pt-0">
              <div className="text-amber-400 font-mono text-3xl font-extrabold">02</div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">{isArabic ? "الدمج التقني" : "LMS Innovations"}</h4>
              <p className="text-xs text-emerald-200 leading-relaxed">
                {isArabic ? "توظيف أحدث ميزات الذكاء الاصطناعي لتتبع مخارج الحروف والتسميع الذاتي." : "Integrating advanced, safe interactive feedback loops to enhance Quran recitation learning."}
              </p>
            </div>
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-emerald-800 pt-6 md:pt-0">
              <div className="text-amber-400 font-mono text-3xl font-extrabold">03</div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">{isArabic ? "منح الإجازات" : "Graduation & Ijazah"}</h4>
              <p className="text-xs text-emerald-200 leading-relaxed">
                {isArabic ? "ربط الطلاب بسند متصل بالنبي صلى الله عليه وسلم في تلاوة القرآن الكريم وحفظ المتون." : "Enabling advanced students to graduate with connected chains (Ijazah) directly to the Prophet (PBUH)."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active page: About
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 animate-fade-in">
      
      {/* Academy History */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs font-bold text-natural-gold tracking-widest uppercase">
            {isArabic ? "قصة التأسيس والمراحل" : "Historical Origins"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-light text-natural-green dark:text-white">
            {isArabic ? "نبذة عن أكاديمية أبو قانتة الإسلامية" : "History of Abu Qoonitah Academy"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-emerald-300 leading-relaxed">
            {isArabic ? historyAr : historyEn}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/40 rounded-3xl flex items-center gap-3 shadow-sm">
              <Users className="w-5 h-5 text-natural-gold flex-shrink-0" />
              <div>
                <span className="block text-sm font-bold text-natural-green dark:text-amber-100">100% Online</span>
                <span className="block text-[10px] text-slate-400">{isArabic ? "فصول مرنة من أي مكان" : "Learn comfortably anywhere"}</span>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/40 rounded-3xl flex items-center gap-3 shadow-sm">
              <Award className="w-5 h-5 text-natural-gold flex-shrink-0" />
              <div>
                <span className="block text-sm font-bold text-natural-green dark:text-amber-100">{isArabic ? "شهادات معتمدة" : "Verified Credentials"}</span>
                <span className="block text-[10px] text-slate-400">{isArabic ? "عند اجتياز الاختبارات بنجاح" : "Issued upon passing final exams"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Founder Biography Card */}
        <div className="lg:col-span-5 bg-natural-green text-white rounded-3xl p-6 sm:p-8 shadow-xl border-t-4 border-natural-gold relative">
          <div className="absolute top-4 right-4 text-emerald-800 text-6xl opacity-25 font-serif">“</div>
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-natural-gold font-bold block">
              {isArabic ? "سيرة المشرف العام" : "General Supervisor Biography"}
            </span>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-natural-dark/60 flex items-center justify-center border-2 border-natural-gold">
                <span className="text-2xl font-bold text-natural-gold font-serif">AQ</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-natural-gold">Ustadh Abu Qoonitah</h3>
                <p className="text-xs text-emerald-200">{isArabic ? "مؤسس الأكاديمية ومدرس علوم اللغة والقرآن" : "Founder & Classical Arabic Specialist"}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-sans pt-2">
              {isArabic ? founderBioAr : founderBioEn}
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-light text-natural-green dark:text-white">
            {isArabic ? "قيمنا الحاكمة ومنهجيتنا" : "Our Core Values"}
          </h2>
          <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <div key={i} className="bg-white dark:bg-natural-dark rounded-3xl p-6 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-3">
              <h4 className="font-bold text-natural-green dark:text-amber-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-natural-gold" />
                <span>{isArabic ? v.titleAr : v.titleEn}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-emerald-305 leading-relaxed">
                {isArabic ? v.descAr : v.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-8 bg-natural-sage/10 dark:bg-natural-dark/60 p-8 rounded-3xl border border-emerald-50 dark:border-emerald-900/40">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-light text-natural-green dark:text-white">
            {isArabic ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
          <p className="text-xs text-slate-400 dark:text-emerald-350">{isArabic ? "إجابات سريعة لمختلف استفساراتكم" : "Answers to common student and parent questions."}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-natural-dark rounded-2xl border border-emerald-50 dark:border-emerald-900/40 overflow-hidden shadow-xs">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-5 py-4 font-bold text-xs sm:text-sm text-natural-green dark:text-amber-100 flex justify-between items-center hover:bg-emerald-50/20 dark:hover:bg-emerald-850/50 transition-colors"
              >
                <span>{isArabic ? faq.qAr : faq.qEn}</span>
                <span className="text-natural-gold font-mono text-base">{openFaq === idx ? "−" : "+"}</span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-500 dark:text-emerald-300 leading-relaxed border-t border-emerald-50/50 dark:border-emerald-850">
                  {isArabic ? faq.aAr : faq.aEn}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
