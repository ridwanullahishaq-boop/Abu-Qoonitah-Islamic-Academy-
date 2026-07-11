/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Tv, Search, Play, Folder, User, Clock, ChevronRight } from "lucide-react";

interface SermonTVProps {
  isArabic: boolean;
}

export default function SermonTV({ isArabic }: SermonTVProps) {
  const [sermons, setSermons] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSermon, setActiveSermon] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/public/sermons")
      .then((res) => res.json())
      .then((data) => {
        setSermons(data);
        if (data.length > 0) {
          setActiveSermon(data[0]); // Select first by default
        }
      })
      .catch((err) => console.error("Error loading sermons:", err));
  }, []);

  const categories = ["All", "Khutbah", "Ramadan", "Tafsir", "Hadith", "Fiqh", "Motivational talks"];

  const filteredSermons = sermons.filter((sermon) => {
    const matchesCategory = selectedCategory === "All" || sermon.category === selectedCategory;
    const matchesSearch =
      sermon.title.toLowerCase().includes(search.toLowerCase()) ||
      sermon.speaker.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in">
      
      {/* Page Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-natural-gold tracking-widest uppercase">
          {isArabic ? "بث الدروس والخطب" : "Islamic Sermon Streaming"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-light text-natural-green dark:text-white flex items-center justify-center gap-2">
          <Tv className="w-8 h-8 text-natural-gold animate-pulse" />
          <span>{isArabic ? "قناة أبو قانتة الدعوية (Sermon TV)" : "Abu Qoonitah Sermon TV"}</span>
        </h1>
        <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />
      </div>

      {/* Main Streaming Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Active Video Player Embedded */}
        <div className="lg:col-span-8 space-y-4">
          {activeSermon ? (
            <div className="space-y-4">
              {/* Responsive Iframe Container */}
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-lg border border-emerald-50 dark:border-emerald-900/40">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={activeSermon.url}
                  title={activeSermon.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              
              {/* Active Video Details */}
              <div className="bg-white dark:bg-natural-dark rounded-3xl p-6 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-3">
                <span className="px-3 py-1 text-[9px] font-bold bg-natural-sage dark:bg-natural-green text-natural-green dark:text-natural-gold uppercase rounded-full">
                  {activeSermon.category}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-natural-green dark:text-amber-100 font-serif">
                  {activeSermon.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-natural-gold" />
                    <span className="font-semibold text-natural-green dark:text-emerald-300">{activeSermon.speaker}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-natural-gold" />
                    <span>Duration: {activeSermon.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-natural-sage/20 rounded-3xl flex items-center justify-center border border-dashed border-emerald-50 dark:border-emerald-900/40 text-emerald-600">
              {isArabic ? "جاري تحميل البث..." : "Loading sermon streaming engine..."}
            </div>
          )}
        </div>

        {/* Right Side: Search & Playlist Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-natural-dark rounded-3xl p-6 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-6 flex flex-col max-h-[600px]">
          
          <h3 className="font-bold text-natural-green dark:text-amber-100 flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-900/30 pb-3 font-serif">
            <Folder className="w-5 h-5 text-natural-gold" />
            <span>{isArabic ? "قائمة الخطب والمحاضرات" : "Lecture Playlists"}</span>
          </h3>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-natural-green" />
            </div>
            <input
              type="text"
              placeholder={isArabic ? "البحث في القناة..." : "Search playlist..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-emerald-50 dark:border-emerald-900/40 rounded-full text-xs bg-natural-sage/10 dark:bg-natural-green/20 text-natural-green dark:text-emerald-100 placeholder-emerald-500 focus:outline-none focus:ring-1 focus:ring-natural-gold"
            />
          </div>

          {/* Category Filter Pills (mini) */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 text-[9px] font-bold rounded-full transition-all ${
                  selectedCategory === cat
                    ? "bg-natural-gold text-white shadow-xs font-bold"
                    : "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-emerald-200 hover:bg-natural-sage/40"
                }`}
              >
                {cat === "All" ? (isArabic ? "الكل" : "All") : cat}
              </button>
            ))}
          </div>

          {/* Playable Items Scrollbar list */}
          <div className="space-y-3 overflow-y-auto pr-1 flex-grow">
            {filteredSermons.map((sermon) => (
              <div
                key={sermon.id}
                onClick={() => setActiveSermon(sermon)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex gap-3 items-center ${
                  activeSermon?.id === sermon.id
                    ? "bg-natural-sage/20 dark:bg-natural-green/20 border-natural-gold"
                    : "bg-white dark:bg-natural-dark hover:bg-natural-sage/10 border-emerald-50 dark:border-emerald-900/40"
                }`}
              >
                {/* Play Circle Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activeSermon?.id === sermon.id 
                    ? "bg-natural-gold text-white" 
                    : "bg-natural-sage text-natural-green dark:bg-natural-green/60 dark:text-natural-gold"
                }`}>
                  <Play className="w-3.5 h-3.5 pl-0.5" />
                </div>
                <div className="min-w-0 flex-grow">
                  <h4 className="text-xs font-bold text-natural-green dark:text-emerald-100 truncate">
                    {sermon.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {sermon.speaker} • {sermon.duration}
                  </p>
                </div>
              </div>
            ))}
            {filteredSermons.length === 0 && (
              <p className="text-xs text-center text-slate-400 py-6">
                {isArabic ? "لا توجد خطب تطابق البحث." : "No matching sermons."}
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
