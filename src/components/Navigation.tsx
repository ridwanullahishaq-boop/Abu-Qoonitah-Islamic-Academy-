/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Search, Menu, X, Globe, Moon, Sun, ShieldAlert, Award, User, Heart } from "lucide-react";

interface NavigationProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  currentUser: any;
  onLogout: () => void;
}

export default function Navigation({
  activePage,
  setActivePage,
  isArabic,
  setIsArabic,
  isDarkMode,
  setIsDarkMode,
  currentUser,
  onLogout,
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ courses: any[]; books: any[]; poems: any[] } | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Handle global search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delayDebounce = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setSearchResults(data);
            setShowResults(true);
          })
          .catch((err) => console.error("Search error:", err));
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults(null);
      setShowResults(false);
    }
  }, [searchQuery]);

  const menuItems = [
    { id: "home", labelEn: "Home", labelAr: "الرئيسية" },
    { id: "about", labelEn: "About Us", labelAr: "من نحن" },
    { id: "vision", labelEn: "Vision & Goals", labelAr: "رؤيتنا" },
    { id: "courses", labelEn: "Online Madrasah", labelAr: "المدرسة الرقمية" },
    { id: "free-courses", labelEn: "Free Courses", labelAr: "دورات مجانية" },
    { id: "sermons", labelEn: "Sermon TV", labelAr: "البث الإسلامي" },
    { id: "library", labelEn: "Islamic Library", labelAr: "المكتبة الإسلامية" },
    { id: "poetry", labelEn: "Poetry Library", labelAr: "ديوان الشعر" },
    { id: "donate", labelEn: "Donate Now", labelAr: "تبرع لله" },
  ];

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId);
    setIsOpen(false);
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-natural-dark border-b border-emerald-100 dark:border-natural-green shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo & Academy Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick("home")}>
            <div className="w-10 h-10 bg-natural-green dark:bg-natural-green rounded-lg flex items-center justify-center text-natural-gold font-bold text-xl shadow-md border border-emerald-800 shrink-0">
              AQ
            </div>
            <div>
              <span className="block text-lg font-bold text-natural-green dark:text-amber-100 font-sans leading-none tracking-tight uppercase">
                Abu Qoonitah
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-natural-gold font-medium tracking-[0.2em] uppercase mt-0.5">
                Islamic Academy
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                  activePage === item.id
                    ? "text-natural-green dark:text-natural-gold bg-natural-sage/50 dark:bg-natural-green/40 border-b-2 border-natural-gold font-semibold"
                    : "text-slate-600 dark:text-emerald-200 hover:text-natural-green dark:hover:text-natural-gold hover:bg-natural-sage/20 dark:hover:bg-natural-green/10"
                }`}
              >
                {isArabic ? item.labelAr : item.labelEn}
              </button>
            ))}
          </div>

          {/* Search Bar & Utilities */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Global Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-emerald-600" />
              </div>
              <input
                type="text"
                placeholder={isArabic ? "بحث في الأكاديمية..." : "Search academy..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-40 xl:w-48 pl-9 pr-3 py-1.5 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs bg-emerald-50/50 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 placeholder-emerald-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:w-56 transition-all duration-300"
              />
              {/* Search Results Dropdown */}
              {showResults && searchResults && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-emerald-900 rounded-lg shadow-xl border border-emerald-100 dark:border-emerald-800 max-h-96 overflow-y-auto z-50">
                  <div className="p-3 border-b border-emerald-100 dark:border-emerald-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-950">
                    <span className="text-xs font-bold text-emerald-900 dark:text-amber-200">
                      {isArabic ? "نتائج البحث" : "Search Results"}
                    </span>
                    <button onClick={() => setShowResults(false)} className="text-xs text-emerald-500 hover:text-emerald-800">
                      ✕
                    </button>
                  </div>
                  <div className="p-2 space-y-3">
                    {/* Courses */}
                    {searchResults.courses.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block px-2 mb-1">
                          {isArabic ? "الدورات" : "Courses"}
                        </span>
                        {searchResults.courses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              handleNavClick("courses");
                              setShowResults(false);
                            }}
                            className="p-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-800/60 cursor-pointer text-xs"
                          >
                            <div className="font-semibold text-emerald-900 dark:text-emerald-100">{c.title}</div>
                            <div className="text-[10px] text-emerald-500">{c.teacherName} • {c.duration}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Books */}
                    {searchResults.books.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block px-2 mb-1">
                          {isArabic ? "الكتب الإسلامية" : "Islamic Books"}
                        </span>
                        {searchResults.books.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              handleNavClick("library");
                              setShowResults(false);
                            }}
                            className="p-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-800/60 cursor-pointer text-xs"
                          >
                            <div className="font-semibold text-emerald-900 dark:text-emerald-100">{b.title}</div>
                            <div className="text-[10px] text-emerald-500">{b.author} • {b.category}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Poems */}
                    {searchResults.poems.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block px-2 mb-1">
                          {isArabic ? "القصائد العربية" : "Arabic Poems"}
                        </span>
                        {searchResults.poems.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              handleNavClick("poetry");
                              setShowResults(false);
                            }}
                            className="p-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-800/60 cursor-pointer text-xs"
                          >
                            <div className="font-semibold text-emerald-900 dark:text-emerald-100">{p.title}</div>
                            <div className="text-[10px] text-emerald-500">{p.poetName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.courses.length === 0 &&
                      searchResults.books.length === 0 &&
                      searchResults.poems.length === 0 && (
                        <div className="p-4 text-center text-xs text-emerald-600 dark:text-emerald-400">
                          {isArabic ? "لم يتم العثور على نتائج." : "No results found."}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <button
              id="lang-toggle"
              onClick={() => setIsArabic(!isArabic)}
              className="p-2 rounded-full hover:bg-natural-sage/50 dark:hover:bg-natural-green/40 text-natural-green dark:text-natural-gold transition-colors"
              title={isArabic ? "English" : "العربية"}
            >
              <Globe className="h-5 w-5" />
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-natural-sage/50 dark:hover:bg-natural-green/40 text-natural-green dark:text-natural-gold transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Portal Actions */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="portal-btn"
                  onClick={() => handleNavClick("portal")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-natural-sage dark:bg-natural-green/40 hover:bg-natural-sage/80 dark:hover:bg-natural-green/60 border border-emerald-100 dark:border-emerald-800 text-natural-green dark:text-natural-gold text-xs font-bold rounded-full transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  {currentUser.role === "admin"
                    ? isArabic ? "لوحة الإدارة" : "Admin Panel"
                    : currentUser.role === "teacher"
                    ? isArabic ? "بوابة المعلم" : "Teacher Portal"
                    : isArabic ? "بوابة الطالب" : "Student Portal"}
                </button>
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-full border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 transition-all"
                >
                  {isArabic ? "خروج" : "Logout"}
                </button>
              </div>
            ) : (
              <button
                id="login-redirect"
                onClick={() => handleNavClick("portal")}
                className="px-6 py-2.5 bg-natural-gold hover:bg-amber-600 text-white rounded-full text-xs font-bold shadow-lg shadow-yellow-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-white" />
                {isArabic ? "بوابة الدخول" : "Portal Access"}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Language & Theme for Mobile Quick Bar */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-700 dark:text-emerald-200"
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-700 dark:text-emerald-200"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-800 dark:text-emerald-100 hover:text-emerald-900 hover:bg-emerald-100 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-white dark:bg-emerald-950 border-t border-emerald-100 dark:border-emerald-900 px-4 pt-2 pb-6 space-y-1">
          {/* Mobile Search */}
          <div className="relative mb-3 py-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-emerald-600" />
            </div>
            <input
              type="text"
              placeholder={isArabic ? "البحث في الأكاديمية..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs bg-emerald-50/50 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-100 placeholder-emerald-500 focus:outline-none"
            />
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                activePage === item.id
                  ? "bg-natural-sage dark:bg-natural-green text-natural-green dark:text-natural-gold"
                  : "text-slate-700 dark:text-emerald-200 hover:bg-natural-sage/50 dark:hover:bg-natural-green/20"
              }`}
            >
              {isArabic ? item.labelAr : item.labelEn}
            </button>
          ))}

          {/* Mobile Portal / Logout Button */}
          <div className="pt-4 border-t border-emerald-100 dark:border-natural-green">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick("portal")}
                  className="w-full text-center py-2.5 px-4 bg-natural-green dark:bg-natural-accent text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {currentUser.role === "admin"
                    ? isArabic ? "لوحة الإدارة" : "Admin Panel"
                    : currentUser.role === "teacher"
                    ? isArabic ? "بوابة المعلم" : "Teacher Portal"
                    : isArabic ? "بوابة الطالب" : "Student Portal"}
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-center py-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-semibold rounded-md text-sm border border-red-100 dark:border-red-900"
                >
                  {isArabic ? "خروج" : "Logout"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick("portal")}
                className="w-full text-center py-2.5 px-4 bg-natural-gold hover:bg-amber-600 text-white rounded-full text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                {isArabic ? "بوابة الطلاب والأساتذة" : "Portal Access"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
