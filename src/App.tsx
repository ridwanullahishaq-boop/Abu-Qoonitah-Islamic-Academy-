/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import HomeHero from "./components/HomeHero";
import AboutUs from "./components/AboutUs";
import Library from "./components/Library";
import SermonTV from "./components/SermonTV";
import DonationPage from "./components/DonationPage";
import LMSPortal from "./components/LMSPortal";
import AIChatBot from "./components/AIChatBot";
import OnlineMadrasah from "./components/OnlineMadrasah";
import FreeCourses from "./components/FreeCourses";
import { User } from "./types";

export default function App() {
  // Global States
  const [activePage, setActivePage] = useState<string>("home");
  const [isArabic, setIsArabic] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lmsRegisterOnly, setLmsRegisterOnly] = useState<boolean>(false);

  // Authenticate user session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Session expired");
          }
          return res.json();
        })
        .then((data) => {
          setCurrentUser(data.user);
        })
        .catch((err) => {
          console.log("No valid session restored:", err.message);
          localStorage.removeItem("token");
          setCurrentUser(null);
        });
    }
  }, []);

  // Update HTML class list for theme management
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleLoginSuccess = (user: User, token: string) => {
    localStorage.setItem("token", token);
    setCurrentUser(user);
    setActivePage("lms"); // Land on their dashboard directly
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setActivePage("home");
  };

  // Safe wrapper to handle header/navigation portal redirects
  const handleNavClick = (page: string) => {
    if (page === "register") {
      setLmsRegisterOnly(true);
      setActivePage("lms");
    } else {
      if (page === "portal" || page === "lms") {
        setLmsRegisterOnly(false);
      }
      setActivePage(page === "portal" ? "lms" : page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-natural-bg dark:bg-natural-dark text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200 selection:bg-natural-gold selection:text-white">
      
      {/* 1. TOP RESPONSIVE NAVIGATION BAR */}
      <Navigation
        activePage={activePage}
        setActivePage={handleNavClick}
        isArabic={isArabic}
        setIsArabic={setIsArabic}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. DYNAMIC WORKSPACE ROUTER */}
      <main className="flex-grow">
        {activePage === "home" && (
          <HomeHero
            isArabic={isArabic}
            setActivePage={handleNavClick}
            isDarkMode={isDarkMode}
          />
        )}

        {(activePage === "about" || activePage === "vision") && (
          <AboutUs 
            isArabic={isArabic} 
            activePage={activePage}
          />
        )}

        {(activePage === "library" || activePage === "poetry") && (
          <Library 
            isArabic={isArabic} 
            activeSection={activePage === "poetry" ? "poetry" : "books"}
          />
        )}

        {(activePage === "sermontv" || activePage === "sermons") && (
          <SermonTV isArabic={isArabic} />
        )}

        {(activePage === "donation" || activePage === "donate") && (
          <DonationPage isArabic={isArabic} />
        )}

        {activePage === "chat" && (
          <AIChatBot isArabic={isArabic} />
        )}

        {activePage === "courses" && (
          <OnlineMadrasah
            isArabic={isArabic}
            onEnrollClick={() => handleNavClick("register")}
          />
        )}

        {activePage === "free-courses" && (
          <FreeCourses isArabic={isArabic} />
        )}

        {activePage === "lms" && (
          <LMSPortal
            isArabic={isArabic}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            initialRegistering={lmsRegisterOnly}
          />
        )}
      </main>

      {/* 3. CORE FOOTER WITH PRAYER TIMES AND HIJRI CALENDAR */}
      <Footer 
        isArabic={isArabic} 
        setActivePage={handleNavClick}
      />

      {/* PERSISTENT FLOATING WHATSAPP BUSINESS BUTTON */}
      <a
        href="https://wa.me/2348122455759"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with Abu Qoonitah on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 hover:scale-110 active:scale-95 text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 cursor-pointer font-bold border border-emerald-400 group"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.465L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.528 2.017 14.077 1.001 11.45 1h-.005c-5.439 0-9.867 4.373-9.87 9.802a9.71 9.71 0 001.488 4.79l-.975 3.565 3.654-.959zm12.388-7.391c-.244-.122-1.45-.715-1.671-.798-.223-.083-.385-.122-.547.122-.162.244-.623.798-.763.959-.14.162-.28.182-.524.061-.244-.122-1.03-.38-1.962-1.211-.725-.647-1.215-1.447-1.357-1.691-.141-.244-.015-.375.107-.496.111-.109.244-.28.365-.42.122-.14.162-.24.244-.401.08-.162.04-.304-.02-.426-.06-.122-.547-1.32-.75-1.81-.197-.477-.397-.412-.547-.419-.142-.007-.304-.008-.467-.008a.893.893 0 00-.647.304c-.223.244-.852.833-.852 2.031 0 1.2 1.022 2.358 1.022 2.52.142.162 1.7 2.605 4.12 3.65.576.248 1.025.396 1.377.508.578.183 1.103.157 1.517.096.462-.068 1.45-.591 1.652-1.162.203-.571.203-1.061.142-1.162-.06-.101-.223-.162-.467-.284z"/>
        </svg>
        <span className="text-xs max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-350 ease-in-out whitespace-nowrap">
          {isArabic ? "تواصل واتساب" : "WhatsApp Chat"}
        </span>
      </a>

    </div>
  );
}
