/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Search, Heart, Bookmark, Play, Pause, Download, User, Info, FileText, Music } from "lucide-react";

interface LibraryProps {
  isArabic: boolean;
  activeSection: 'books' | 'poetry'; // Can toggle between Islamic Books and Poetry
}

export default function Library({ isArabic, activeSection: initialSection }: LibraryProps) {
  const [section, setSection] = useState<'books' | 'poetry'>(initialSection);
  const [books, setBooks] = useState<any[]>([]);
  const [poems, setPoems] = useState<any[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [poemSearch, setPoemSearch] = useState("");
  const [selectedBookCategory, setSelectedBookCategory] = useState("All");
  
  // Poetry Audio Player States
  const [playingPoemId, setPlayingPoemId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Book Favorite and Poem Bookmark toggles
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Sync initial section from navigation
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    // Load Library Books
    fetch("/api/public/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error("Error loading library books:", err));

    // Load Poetry Library
    fetch("/api/public/poems")
      .then((res) => res.json())
      .then((data) => setPoems(data))
      .catch((err) => console.error("Error loading poems:", err));
  }, []);

  // Audio simulation
  useEffect(() => {
    let timer: any;
    if (playingPoemId) {
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setPlayingPoemId(null);
            return 0;
          }
          return prev + 5;
        });
      }, 1000);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(timer);
  }, [playingPoemId]);

  const toggleFavorite = (bookId: string) => {
    setFavorites(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  const toggleBookmark = (poemId: string) => {
    setBookmarks(prev => ({ ...prev, [poemId]: !prev[poemId] }));
  };

  const bookCategories = ["All", "Aqeedah", "Fiqh", "Hadith", "Tafsir", "Arabic", "Nahw", "Sarf", "Seerah", "History"];

  const filteredBooks = books.filter((book) => {
    const matchesCategory = selectedBookCategory === "All" || book.category === selectedBookCategory;
    const matchesSearch =
      book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      book.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      book.description.toLowerCase().includes(bookSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPoems = poems.filter((poem) => {
    return (
      poem.title.toLowerCase().includes(poemSearch.toLowerCase()) ||
      poem.poetName.toLowerCase().includes(poemSearch.toLowerCase())
    );
  });

  const triggerDownloadSimulation = (book: any) => {
    if (book.downloadUrl && book.downloadUrl !== "#") {
      const link = document.createElement("a");
      link.href = book.downloadUrl;
      link.download = `${book.title.replace(/[\s\W]+/g, "_")}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(isArabic 
        ? `بدء تحميل كتاب "${book.title}" بصيغة PDF. جاري تواصلك بخادم التوزيع الأكاديمي...` 
        : `Starting PDF download for "${book.title}". Connecting to Madrasah library servers...`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in">
      
      {/* Page Title & Section Switcher */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-natural-gold tracking-widest uppercase">
          {isArabic ? "منصة المعرفة الإسلامية" : "Islamic Knowledge Portal"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-light text-natural-green dark:text-white">
          {section === "books" 
            ? isArabic ? "المكتبة الرقمية الإسلامية" : "The Digital Islamic Library"
            : isArabic ? "ديوان الشعر والأدب العربي" : "Poetry Library & Arabic Literature"}
        </h1>
        <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />

        {/* Beautiful Pills to switch library category */}
        <div className="inline-flex rounded-full bg-natural-sage/20 dark:bg-natural-dark p-1 border border-emerald-50 dark:border-emerald-900/40 mt-4">
          <button
            onClick={() => setSection("books")}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
              section === "books"
                ? "bg-natural-green text-white shadow-md"
                : "text-natural-green dark:text-emerald-200 hover:text-emerald-900"
            }`}
          >
            {isArabic ? "مكتبة الكتب الشرعية" : "Islamic Books"}
          </button>
          <button
            onClick={() => setSection("poetry")}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
              section === "poetry"
                ? "bg-natural-green text-white shadow-md"
                : "text-natural-green dark:text-emerald-200 hover:text-emerald-900"
            }`}
          >
            {isArabic ? "ديوان القصائد العربية" : "Arabic Poetry"}
          </button>
        </div>
      </div>

      {/* SECTION 1: ISLAMIC BOOKS */}
      {section === "books" && (
        <div className="space-y-8">
          
          {/* Search & Category Filter bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-natural-dark p-4 rounded-3xl shadow-sm border border-emerald-50 dark:border-emerald-900/40">
            
            {/* Search */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-natural-green" />
              </div>
              <input
                type="text"
                placeholder={isArabic ? "البحث عن عنوان، مؤلف، وصف..." : "Search title, author, key term..."}
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-emerald-50 dark:border-emerald-900/40 rounded-full text-xs bg-natural-sage/10 dark:bg-natural-green/20 text-natural-green dark:text-emerald-100 placeholder-emerald-500 focus:outline-none focus:ring-1 focus:ring-natural-gold"
              />
            </div>

            {/* Scrollable Categories on Desktop / wrapped on Mobile */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {bookCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedBookCategory(cat)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                    selectedBookCategory === cat
                      ? "bg-natural-gold text-white shadow-sm font-bold"
                      : "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-emerald-200 hover:bg-natural-sage/40"
                  }`}
                >
                  {cat === "All" ? (isArabic ? "الكل" : "All") : cat}
                </button>
              ))}
            </div>

          </div>

          {/* Books Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white dark:bg-natural-dark rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-emerald-50 dark:border-emerald-900/40 transition-all flex flex-col md:flex-row"
              >
                {/* Book cover cover image */}
                <div className="w-full md:w-1/3 relative bg-emerald-950 flex-shrink-0 h-48 md:h-auto">
                  <img
                    referrerPolicy="no-referrer"
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 to-transparent opacity-60" />
                  <span className="absolute bottom-2 left-2 text-[10px] bg-natural-gold text-white px-2 py-0.5 rounded font-bold uppercase">
                    {book.category}
                  </span>
                </div>

                {/* Book Details */}
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="text-sm font-bold text-natural-green dark:text-amber-100 leading-snug font-serif">
                        {book.title}
                      </h3>
                      <button
                        onClick={() => toggleFavorite(book.id)}
                        className={`text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20`}
                      >
                        <Heart className={`w-4.5 h-4.5 ${favorites[book.id] ? "fill-red-500" : ""}`} />
                      </button>
                    </div>
                    <div className="text-[10px] font-semibold text-natural-gold dark:text-amber-400">
                      By {book.author}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-emerald-300 line-clamp-3 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  <button
                    onClick={() => triggerDownloadSimulation(book)}
                    className="w-full py-2 bg-natural-sage/20 hover:bg-natural-sage/40 dark:bg-natural-green/45 dark:hover:bg-natural-green text-natural-green dark:text-natural-gold text-xs font-bold rounded-full flex items-center justify-center gap-1.5 transition-all border-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isArabic ? "تحميل نسخة PDF مجانية" : "Download PDF Code"}</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && (
              <div className="col-span-full py-16 text-center text-natural-green dark:text-emerald-400 text-xs font-semibold">
                {isArabic ? "لم يتم العثور على كتب تطابق شروط البحث." : "No books found matching your parameters."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: POETRY LIBRARY */}
      {section === "poetry" && (
        <div className="space-y-12">
          
          {/* Poetry Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-natural-green" />
              </div>
              <input
                type="text"
                placeholder={isArabic ? "ابحث عن عنوان القصيدة، أو اسم الشاعر..." : "Search poem title, poet name..."}
                value={poemSearch}
                onChange={(e) => setPoemSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 border border-emerald-50 dark:border-emerald-900/40 rounded-full text-xs bg-natural-sage/10 dark:bg-natural-green/20 text-natural-green dark:text-emerald-100 placeholder-emerald-500 focus:outline-none focus:ring-1 focus:ring-natural-gold"
              />
            </div>
          </div>

          {/* Poetry Display Cards */}
          <div className="space-y-12">
            {filteredPoems.map((poem) => (
              <div
                key={poem.id}
                className="bg-white dark:bg-natural-dark rounded-3xl border border-emerald-50 dark:border-emerald-900/40 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Poet Biography & Audio simulation panel */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-emerald-50 dark:border-emerald-800 pb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-natural-green dark:text-amber-100 font-serif">
                      {poem.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-natural-gold dark:text-amber-400 font-medium">
                      <User className="w-4 h-4 text-natural-green" />
                      <span>{isArabic ? "الشاعر:" : "Poet:"} {poem.poetName}</span>
                    </div>
                  </div>

                  {/* Audio Recitation Block */}
                  <div className="w-full md:w-auto flex items-center gap-4 bg-natural-sage/25 dark:bg-natural-dark px-4 py-2 rounded-2xl border border-emerald-50 dark:border-emerald-900/40">
                    <button
                      onClick={() => {
                        if (playingPoemId === poem.id) {
                          setPlayingPoemId(null);
                        } else {
                          setPlayingPoemId(poem.id);
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-natural-green hover:bg-natural-dark text-white flex items-center justify-center shadow-sm"
                    >
                      {playingPoemId === poem.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
                    </button>
                    <div className="flex-grow md:w-32">
                      <div className="text-[10px] font-bold text-natural-green dark:text-amber-200 flex items-center gap-1">
                        <Music className="w-3 h-3 text-natural-gold" />
                        <span>{isArabic ? "استماع للقصيدة" : "Listen to Recitation"}</span>
                      </div>
                      {/* Audio progress simulation */}
                      <div className="w-full bg-emerald-200 dark:bg-emerald-800 h-1 rounded mt-1 overflow-hidden">
                        <div 
                          className="bg-natural-gold h-full transition-all duration-1000"
                          style={{ width: `${playingPoemId === poem.id ? audioProgress : 0}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleBookmark(poem.id)}
                      className="text-natural-green dark:text-emerald-300 p-1"
                    >
                      <Bookmark className={`w-4.5 h-4.5 ${bookmarks[poem.id] ? "fill-natural-gold text-natural-gold" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Poet Biography box */}
                <div className="bg-natural-sage/10 dark:bg-natural-green/20 rounded-2xl p-4 border border-emerald-50 dark:border-emerald-900/30 text-xs">
                  <div className="flex items-center gap-1 font-bold text-natural-green dark:text-amber-200 mb-1.5">
                    <Info className="w-3.5 h-3.5 text-natural-gold" />
                    <span>{isArabic ? "ترجمة الناظم وسيرته" : "About the Poet & Context"}</span>
                  </div>
                  <p className="text-slate-500 dark:text-emerald-300 leading-relaxed font-sans">
                    {poem.biography}
                  </p>
                </div>

                {/* Noble verses (Side-by-side Bilingual Columns) */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-natural-gold border-b border-emerald-50 dark:border-emerald-800 pb-1.5">
                    {isArabic ? "الأبيات والترجمة" : "Poetic Verses & Translations"}
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {poem.arabicText.map((verse: string, index: number) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-natural-sage/10 dark:bg-natural-green/10 rounded-2xl border border-emerald-50/50 dark:border-emerald-850/50 items-center text-xs"
                      >
                        {/* Arabic verse column */}
                        <div className="sm:col-span-6 font-serif text-right text-natural-green dark:text-amber-100 text-sm md:text-base font-semibold py-1">
                          {verse}
                        </div>
                        {/* Divider */}
                        <div className="hidden sm:block sm:col-span-1 text-center text-natural-gold font-bold">
                          ◈
                        </div>
                        {/* Translation column */}
                        <div className="sm:col-span-5 text-left text-slate-500 dark:text-emerald-300 font-sans italic py-1 leading-normal">
                          {poem.translationText[index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
            {filteredPoems.length === 0 && (
              <div className="py-16 text-center text-natural-green dark:text-emerald-400 text-xs font-semibold">
                {isArabic ? "لم يتم العثور على قصائد." : "No poems found."}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
