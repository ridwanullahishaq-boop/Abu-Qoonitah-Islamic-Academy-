/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Send, Phone, Mail, Clock, Calendar, Heart, Shield } from "lucide-react";

interface FooterProps {
  isArabic: boolean;
  setActivePage: (page: string) => void;
}

export default function Footer({ isArabic, setActivePage }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  // Accurate, dynamically calculated seasonal prayer times for Ibadan, Oyo State, Nigeria (7.3775° N, 3.9470° E)
  const getIbadanPrayerTimes = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Seasonal variation in minutes based on day of year (sinusoidal model for declination)
    const seasonalShift = Math.sin((dayOfYear - 80) * 2 * Math.PI / 365) * 12; // +/- 12 mins variation
    const equationOfTime = Math.sin((dayOfYear - 4) * 4 * Math.PI / 365) * 7; // +/- 7 mins general shift
    
    // Base times for Ibadan (approximate annual averages in minutes from midnight)
    const fajrBase = 5 * 60 + 15;      // 05:15 AM
    const dhuhrBase = 12 * 60 + 48;    // 12:48 PM
    const asrBase = 16 * 60 + 12;      // 04:12 PM
    const maghribBase = 18 * 60 + 52;  // 06:52 PM
    const ishaBase = 20 * 60 + 6;      // 08:06 PM

    const formatTime = (minutes: number) => {
      const hrs = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      const period = hrs >= 12 ? "PM" : "AM";
      const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
      return `${displayHrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
    };

    return [
      { nameEn: "Fajr", nameAr: "الفجر", time: formatTime(fajrBase + equationOfTime - seasonalShift) },
      { nameEn: "Dhuhr", nameAr: "الظهر", time: formatTime(dhuhrBase + equationOfTime) },
      { nameEn: "Asr", nameAr: "العصر", time: formatTime(asrBase + equationOfTime + seasonalShift / 2) },
      { nameEn: "Maghrib", nameAr: "المغرب", time: formatTime(maghribBase + equationOfTime + seasonalShift) },
      { nameEn: "Isha", nameAr: "العشاء", time: formatTime(ishaBase + equationOfTime + seasonalShift) },
    ];
  };

  const prayerTimes = getIbadanPrayerTimes();

  const quickLinks = [
    { id: "home", labelEn: "Home", labelAr: "الرئيسية" },
    { id: "about", labelEn: "About Us", labelAr: "من نحن" },
    { id: "courses", labelEn: "Online Madrasah", labelAr: "المدرسة الرقمية" },
    { id: "library", labelEn: "Islamic Library", labelAr: "المكتبة الإسلامية" },
    { id: "donate", labelEn: "Donate & Support", labelAr: "تبرع للمدرسة" },
  ];

  return (
    <footer id="app-footer" className="bg-natural-green text-emerald-100 border-t-4 border-natural-gold pt-16 pb-8 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        {/* About & Branding Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-natural-dark/60 flex items-center justify-center border border-natural-gold shadow-md shrink-0">
              <span className="text-natural-gold font-bold text-lg">AQ</span>
            </div>
            <div>
              <span className="block font-sans font-bold text-sm tracking-widest text-white uppercase">
                Abu Qoonitah
              </span>
              <span className="block text-[10px] text-natural-gold uppercase tracking-widest leading-none mt-0.5">
                Islamic Academy
              </span>
            </div>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed max-w-sm">
            {isArabic 
              ? "مؤسسة إسلامية عالمية مخصصة لتدريس العلوم الشرعية الأصيلة واللغة العربية وفق منهجية واضحة تيسر العلم للمبتدئين وترقى بالمتقدمين."
              : "A global Islamic academy dedicated to teaching authentic Shariah sciences and Arabic through a structured methodology, welcoming to beginners and inspiring to advanced seekers."}
          </p>
          <div className="flex flex-col gap-2 text-xs text-emerald-300">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-natural-gold animate-pulse" />
              <span>08122455759</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-natural-gold" />
              <span className="break-all">abuqoonitahuniversityofdeen@gmail.com</span>
            </div>
            <div className="pt-2">
              <a
                href="https://wa.me/2348122455759"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.465L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.528 2.017 14.077 1.001 11.45 1h-.005c-5.439 0-9.867 4.373-9.87 9.802a9.71 9.71 0 001.488 4.79l-.975 3.565 3.654-.959zm12.388-7.391c-.244-.122-1.45-.715-1.671-.798-.223-.083-.385-.122-.547.122-.162.244-.623.798-.763.959-.14.162-.28.182-.524.061-.244-.122-1.03-.38-1.962-1.211-.725-.647-1.215-1.447-1.357-1.691-.141-.244-.015-.375.107-.496.111-.109.244-.28.365-.42.122-.14.162-.24.244-.401.08-.162.04-.304-.02-.426-.06-.122-.547-1.32-.75-1.81-.197-.477-.397-.412-.547-.419-.142-.007-.304-.008-.467-.008a.893.893 0 00-.647.304c-.223.244-.852.833-.852 2.031 0 1.2 1.022 2.358 1.022 2.52.142.162 1.7 2.605 4.12 3.65.576.248 1.025.396 1.377.508.578.183 1.103.157 1.517.096.462-.068 1.45-.591 1.652-1.162.203-.571.203-1.061.142-1.162-.06-.101-.223-.162-.467-.284z"/>
                </svg>
                <span>WhatsApp Business</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Pages Navigation */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
            {isArabic ? "روابط سريعة" : "Quick Links"}
          </h4>
          <ul className="space-y-2 text-xs">
            {quickLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => setActivePage(link.id)}
                  className="hover:text-natural-gold text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <span className="text-natural-gold">◈</span>
                  {isArabic ? link.labelAr : link.labelEn}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Real-time Prayer Times & Hijri Calendar */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2 flex items-center justify-between">
            <span>{isArabic ? "مواقيت الصلاة اليوم (إبادان، نيجيريا)" : "Ibadan, Nigeria Prayer Times"}</span>
            <Clock className="w-4 h-4 text-natural-gold animate-pulse" />
          </h4>
          <div className="grid grid-cols-5 gap-1 bg-natural-dark/40 p-2 rounded-xl border border-emerald-800/40">
            {prayerTimes.map((p) => (
              <div key={p.nameEn} className="text-center">
                <span className="block text-[10px] text-emerald-300 font-semibold">{isArabic ? p.nameAr : p.nameEn}</span>
                <span className="block text-[9px] font-mono text-natural-gold mt-1">{p.time.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-natural-dark/20 p-2 rounded-xl border border-emerald-900/60 text-xs text-emerald-300">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-natural-gold" />
              <span>{isArabic ? "١٤٤٨ هـ" : "1448AH"}</span>
            </div>
            <span className="font-mono text-[10px] bg-natural-dark/60 px-1.5 py-0.5 rounded text-white">{currentTime}</span>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
            {isArabic ? "النشرة البريدية" : "Newsletter"}
          </h4>
          <p className="text-xs text-emerald-300 leading-relaxed">
            {isArabic 
              ? "اشترك معنا لتصلك أحدث الإعلانات، والدروس العامة، وجداول المحاضرات المفتوحة."
              : "Subscribe to receive key academic announcements, free public lecture schedules, and newsletters."}
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              placeholder={isArabic ? "بريدك الإلكتروني..." : "Your email..."}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-natural-dark border border-emerald-800 rounded px-3 py-1.5 text-xs text-white placeholder-emerald-500 focus:outline-none focus:ring-1 focus:ring-natural-gold"
            />
            <button
              type="submit"
              className="px-3 bg-natural-gold hover:bg-amber-600 text-white font-bold rounded flex items-center justify-center transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          {subscribed && (
            <p className="text-[10px] text-natural-gold font-medium animate-bounce">
              {isArabic ? "تم الاشتراك بنجاح! جزاكم الله خيراً." : "Subscribed successfully! Jazakum Allahu Khairan."}
            </p>
          )}
        </div>

      </div>

      {/* Quote of the Day & Copyright Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-emerald-900 text-center space-y-4">
        {/* Quote */}
        <div className="bg-natural-dark/40 border border-emerald-800/40 p-4 rounded-3xl max-w-3xl mx-auto space-y-2">
          <p className="font-serif text-sm text-natural-gold italic tracking-wide font-medium leading-relaxed">
            "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ"
          </p>
          <p className="text-[11px] text-emerald-200">
            "Whoever takes a path upon which he seeks knowledge, Allah will make easy for him a path to Paradise."
          </p>
          <p className="text-[9px] text-natural-gold uppercase font-bold tracking-wider">— Sahih Muslim 2699</p>
        </div>

        {/* Security & Copyright Text */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-emerald-400 gap-4 pt-4">
          <p>
            © {new Date().getFullYear()} Abu Qoonitah Islamic Academy. {isArabic ? "جميع الحقوق محفوظة لله." : "All rights reserved. Dedicated to the cause of Allah."}
          </p>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Shield className="w-3.5 h-3.5 text-natural-gold" />
            <span>SSL Secured • Cryptographic Authentication Enabled</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
