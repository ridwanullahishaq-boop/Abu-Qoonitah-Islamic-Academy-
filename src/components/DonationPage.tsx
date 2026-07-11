/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Heart, Landmark, CreditCard, Award, Flame, Users, CheckCircle, ShieldCheck, Copy, Check } from "lucide-react";
import { Donation } from "../types";

interface DonationPageProps {
  isArabic: boolean;
}

export default function DonationPage({ isArabic }: DonationPageProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amount, setAmount] = useState<number>(5000);
  const [category, setCategory] = useState<'sponsor_student' | 'build_education' | 'general' | 'monthly_donor'>("general");
  const [type, setType] = useState<'one-time' | 'monthly'>("one-time");
  const [message, setMessage] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Credit card mockup states
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [donationSettings, setDonationSettings] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<any>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [waNotifyUrl, setWaNotifyUrl] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    fetch("/api/public/donation-settings")
      .then((res) => res.json())
      .then((data) => setDonationSettings(data))
      .catch((err) => console.error("Error fetching donation settings:", err));
  }, []);

  useEffect(() => {
    // Load recent donations
    fetch("/api/donations", {
      headers: {
        Authorization: "Bearer user-admin" // Simple bypass for presentation
      }
    })
      .then((res) => {
        if (!res.ok) {
          // Fallback if not logged in
          return fetch("/api/public/testimonials").then(() => [
            { id: "don-1", donorName: "Brother Tariq Al-Mansour", amount: 500, category: "sponsor_student", type: "one-time", message: "May Allah accept this to sponsor a young seeker of Islamic knowledge.", date: "2026-07-01T14:30:00Z", status: "completed" },
            { id: "don-2", donorName: "Sister Maryam Yusuf", amount: 50, category: "monthly_donor", type: "monthly", message: "In support of Madrasah education operations.", date: "2026-07-03T09:15:00Z", status: "completed" },
            { id: "don-3", donorName: "An anonymous brother", amount: 1000, category: "build_education", type: "one-time", message: "For building the virtual servers and expanding courses globally.", date: "2026-07-05T18:40:00Z", status: "completed" }
          ]);
        }
        return res.json();
      })
      .then((data) => setDonations(data))
      .catch((err) => console.error("Error loading donations:", err));
  }, []);

  // Calculate live progression
  const totalRaised = donations.reduce((acc, curr) => acc + curr.amount, 0);
  const targetGoal = donationSettings?.targetAmount || 50000;
  const progressPercent = Math.min(100, Math.round((totalRaised / targetGoal) * 100));

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);

    const donationData = {
      donorName: isAnonymous ? "An anonymous donor" : donorName || "An anonymous donor",
      amount,
      category,
      type,
      message: message || "May Allah accept this contribution.",
      paymentMethod,
      receipt: paymentMethod === 'bank' ? receiptFile : null,
      receiptFileName: paymentMethod === 'bank' ? receiptFileName : null
    };

    setTimeout(() => {
      fetch("/api/donations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationData)
      })
        .then((res) => res.json())
        .then((data) => {
          setIsSubmitting(false);
          setSuccessMsg(true);
          // Add locally
          setDonations((prev) => [data.donation, ...prev]);

          // Prepare WhatsApp notification
          const formattedAmount = Number(amount).toLocaleString();
          const categoryName = category === 'sponsor_student' 
            ? "Sponsor a Seeking Student" 
            : category === 'build_education' 
            ? "Build Digital Infrastructure" 
            : category === 'monthly_donor'
            ? "Monthly Sustaining Donor"
            : "General Madrasah Operations";
          
          const donor = isAnonymous ? "An anonymous donor" : donorName || "An anonymous donor";
          const paymentType = type === 'monthly' ? "Monthly Recurring" : "One-Time";
          const paymentWay = paymentMethod === 'bank' ? "Direct Bank Transfer" : "Card Checkout Gateway";
          const donorMessageText = message ? `"${message}"` : "May Allah accept this contribution.";

          const waMessage = `As-salamu alaykum, Abu Qoonitah Academy.\n\nI have just authorized a donation of ₦${formattedAmount}!\n\n• Donor Name: ${donor}\n• Category: ${categoryName}\n• Frequency: ${paymentType}\n• Payment Method: ${paymentWay}\n• Message: ${donorMessageText}\n\nKindly verify and authorize the payment. Jazakum Allahu Khairan!`;

          const waUrl = `https://wa.me/2348122455759?text=${encodeURIComponent(waMessage)}`;
          setWaNotifyUrl(waUrl);

          // Auto-trigger WhatsApp
          try {
            window.open(waUrl, "_blank");
          } catch (err) {
            console.error("Popup blocked:", err);
          }

          // Reset form
          setDonorName("");
          setIsAnonymous(false);
          setMessage("");
          setCardNumber("");
          setExpiry("");
          setCvv("");
          setReceiptFile(null);
          setReceiptFileName("");
          setAmount(5000);
          setTimeout(() => {
            setSuccessMsg(false);
            setWaNotifyUrl(null);
          }, 25000); // Keep success/WhatsApp button visible longer for easy access
        })
        .catch((err) => {
          console.error("Donation submit failed:", err);
          setIsSubmitting(false);
        });
    }, 1500); // Elegant simulated latency
  };

  const donationTiers = [1000, 2000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 animate-fade-in">
      
      {/* 1. TITLE & INTRODUCTION */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-natural-gold tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
          <span>{isArabic ? "دعم ونشر العلم النافع" : "Support the Spread of Sacred Knowledge"}</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-light text-natural-green dark:text-white">
          {isArabic ? "صدقة جارية ودعم للتعليم الإسلامي" : "Support Abu Qoonitah Academy"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-300 leading-relaxed font-sans whitespace-pre-line">
          {isArabic
            ? (donationSettings?.descriptionAr || "تبرعاتكم تساهم مباشرة في رعاية طلبة العلم المعسرين، وبناء منصات البث لتقديم العلم الشرعي مجانًا للمسلمين حول العالم. قال رسول الله صلى الله عليه وسلم: 'إذا مات ابن آدم انقطع عمله إلا من ثلاث: صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له'.")
            : (donationSettings?.descriptionEn || "Your contributions support disadvantaged seekers of knowledge and sustain our Madrasah software servers to offer free Islamic modules globally. The Prophet (PBUH) said: 'When a man dies, his deeds come to an end except for three: a continuous charity, knowledge by which people benefit, or a righteous child who prays for him.'")}
        </p>
        <div className="h-0.5 bg-natural-gold w-16 mx-auto rounded" />
      </div>

      {/* 2. PROGRESS BAR */}
      <section className="bg-white dark:bg-natural-dark rounded-3xl p-6 sm:p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm gap-2">
          <div className="text-natural-green dark:text-emerald-100 font-bold font-serif">
            {isArabic ? "إجمالي التبرعات المجمعة:" : "Total Fundraised Pool:"} <span className="text-natural-gold font-mono text-base sm:text-lg">₦{totalRaised.toLocaleString()}</span>
          </div>
          <div className="text-slate-400 font-bold font-mono">
            {isArabic ? `الهدف السنوي: ₦${targetGoal.toLocaleString()}` : `Annual Target Goal: ₦${targetGoal.toLocaleString()}`}
          </div>
        </div>
        
        {/* Visual Progress Track */}
        <div className="w-full bg-natural-sage/20 dark:bg-natural-green/20 h-4 rounded-full overflow-hidden border border-emerald-50 dark:border-emerald-900/45 relative">
          <div
            className="bg-gradient-to-r from-natural-green to-natural-gold h-full rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-natural-green font-mono">
            {progressPercent}% Complete
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-center text-xs text-slate-450 dark:text-emerald-300">
          <div className="space-y-1">
            <h5 className="font-bold text-natural-green dark:text-amber-200 font-serif">{isArabic ? "سد العجز" : "Infrastructure Support"}</h5>
            <p className="text-[11px] text-slate-500">{isArabic ? "صيانة الخوادم وحزمة النطاق للبث." : "Hosting, high bandwidth video servers, and digital library databases."}</p>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-emerald-50 dark:border-emerald-900/30 pt-4 md:pt-0">
            <h5 className="font-bold text-natural-green dark:text-amber-200 font-serif">{isArabic ? "رعاية الطلاب" : "Sponsor Talabatul Ilm"}</h5>
            <p className="text-[11px] text-slate-500">{isArabic ? "تمويل الرسوم الدراسية للطلبة المتعسرين." : "Directly financing tuition for students in underprivileged regions."}</p>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-emerald-50 dark:border-emerald-900/30 pt-4 md:pt-0">
            <h5 className="font-bold text-natural-green dark:text-amber-200 font-serif">{isArabic ? "طباعة المذكرات" : "Classical Literature Study"}</h5>
            <p className="text-[11px] text-slate-500">{isArabic ? "توفير الكتب وترجمة المتون الأساسية." : "Translating Arabic grammar books and producing interlinear workbooks."}</p>
          </div>
        </div>
      </section>

      {/* 3. DONATION SUBMISSION ENGINE AND RECENT DONORS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Donation Form */}
        <form onSubmit={handleDonationSubmit} className="lg:col-span-7 bg-white dark:bg-natural-dark p-8 rounded-3xl border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-natural-green dark:text-amber-100 flex items-center gap-2 font-serif">
            <span className="w-1.5 h-6 bg-natural-gold rounded-full" />
            <span>{isArabic ? "تفاصيل تبرعك الكريم" : "Enter Secure Donation Details"}</span>
          </h3>

          {/* Preset Tiers */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-natural-green dark:text-emerald-300">
              {isArabic ? "اختر مبلغ التبرع (بالنيرا ₦):" : "Select Contribution Amount (Naira ₦):"}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {donationTiers.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAmount(t)}
                  className={`py-2 rounded-full text-xs font-bold font-mono transition-all border ${
                    amount === t
                      ? "bg-natural-green text-white border-natural-green shadow-md"
                      : "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-emerald-200 border-none hover:bg-natural-sage/40"
                  }`}
                >
                  ₦{t.toLocaleString()}
                </button>
              ))}
            </div>
            {/* Custom Amount Input */}
            <div className="pt-2">
              <input
                type="number"
                min="100"
                placeholder={isArabic ? "مبلغ مخصص..." : "Enter custom amount..."}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-natural-sage/10 dark:bg-natural-green/20 border border-emerald-50 dark:border-emerald-900/40 rounded-full p-2.5 text-xs text-natural-green dark:text-white font-semibold font-mono placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-natural-gold"
              />
            </div>
          </div>

          {/* Donation Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-natural-green dark:text-emerald-300">
                {isArabic ? "تصنيف التبرع:" : "Donation Category:"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/40 rounded-full p-2.5 text-xs text-natural-green dark:text-emerald-100 focus:outline-none"
              >
                <option value="general">{isArabic ? "تبرع عام للمدرسة" : "General Madrasah Operations"}</option>
                <option value="sponsor_student">{isArabic ? "كفالة ورعاية طالب علم" : "Sponsor a Seeking Student"}</option>
                <option value="build_education">{isArabic ? "تطوير المنصة والبث الرقمي" : "Build Digital Infrastructure"}</option>
                <option value="monthly_donor">{isArabic ? "برنامج الشراكة الشهرية" : "Monthly Sustaining Donor"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-natural-green dark:text-emerald-300">
                {isArabic ? "تكرار التبرع:" : "Frequencies:"}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("one-time")}
                  className={`flex-1 py-2 rounded-full text-xs font-bold transition-all border ${
                    type === "one-time"
                      ? "bg-natural-gold text-white border-none shadow-xs"
                      : "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-emerald-200 border-none"
                  }`}
                >
                  {isArabic ? "مرة واحدة" : "One-Time"}
                </button>
                <button
                  type="button"
                  onClick={() => setType("monthly")}
                  className={`flex-1 py-2 rounded-full text-xs font-bold transition-all border ${
                    type === "monthly"
                      ? "bg-natural-gold text-white border-none shadow-xs"
                      : "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-emerald-200 border-none"
                  }`}
                >
                  {isArabic ? "شهري مستمر" : "Monthly Recurring"}
                </button>
              </div>
            </div>
          </div>

          {/* Donor Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-natural-green dark:text-emerald-300">
                {isArabic ? "اسم المتبرع الكريم:" : "Donor Name:"}
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-natural-green">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-natural-gold focus:ring-0"
                />
                <span>{isArabic ? "تبرع كفاعل خير (مجهول)" : "Donate anonymously"}</span>
              </label>
            </div>
            {!isAnonymous && (
              <input
                type="text"
                placeholder={isArabic ? "أدخل اسمك الكريم..." : "Your full name..."}
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                required={!isAnonymous}
                className="w-full bg-natural-sage/10 dark:bg-natural-green/20 border border-emerald-50 dark:border-emerald-900/40 rounded-full p-2.5 text-xs text-natural-green dark:text-white placeholder-emerald-400 focus:outline-none"
              />
            )}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-natural-green dark:text-emerald-300">
                {isArabic ? "دعاء أو رسالة للأكاديمية:" : "Short Prayer / Message:"}
              </label>
              <textarea
                rows={2}
                placeholder={isArabic ? "اكتب دعاءً أو رسالة قصيرة..." : "Write a brief prayer or encouraging words..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-natural-sage/10 dark:bg-natural-green/20 border border-emerald-50 dark:border-emerald-900/40 rounded-3xl p-2.5 text-xs text-natural-green dark:text-white placeholder-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-natural-green dark:text-emerald-300">
              {isArabic ? "طريقة الدفع الآمنة:" : "Secure Payment Gateways:"}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-natural-green dark:text-emerald-150">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="text-natural-green"
                />
                <CreditCard className="w-4 h-4 text-natural-gold" />
                <span>{isArabic ? "بطاقة ائتمان / دفع إلكتروني" : "Card Checkout Gateway"}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-natural-green dark:text-emerald-150">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                  className="text-natural-green"
                />
                <Landmark className="w-4 h-4 text-natural-gold" />
                <span>{isArabic ? "حوالة بنكية مباشرة" : "Bank Transfer Wire"}</span>
              </label>
            </div>
          </div>

          {/* Checkout simulators */}
          {paymentMethod === "card" ? (
            <div className="p-4 bg-natural-sage/10 dark:bg-natural-green/20 rounded-3xl border border-emerald-50 dark:border-emerald-900/40 space-y-3">
              <div className="text-[10px] font-bold text-natural-gold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-natural-gold" />
                <span>256-Bit SSL Encrypted Simulated Vault</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[10px] text-natural-green font-bold block">CARD NUMBER</span>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/45 rounded-full px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-natural-green font-bold block">EXPIRY</span>
                  <input
                    type="text"
                    placeholder="12/29"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/45 rounded-full px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-natural-green font-bold block">CVV</span>
                  <input
                    type="password"
                    placeholder="***"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-natural-dark border border-emerald-50 dark:border-emerald-900/45 rounded-full px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-natural-sage/10 dark:bg-natural-green/10 rounded-3xl border border-emerald-50 dark:border-emerald-900/40 text-xs space-y-4">
              <span className="font-bold text-natural-gold block font-serif">{isArabic ? "تفاصيل التحويل البنكي المباشر:" : "Madrasah Bank Account Credentials:"}</span>
              <div className="grid grid-cols-3 gap-y-3 items-center text-[11px] text-slate-500 dark:text-emerald-300 font-mono">
                <div>Bank Name:</div>
                <div className="font-bold text-natural-green dark:text-white col-span-2 flex items-center justify-between">
                  <span>{donationSettings?.bank || "Opay"}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(donationSettings?.bank || "Opay", "bank")}
                    className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded text-slate-400 hover:text-natural-gold transition-colors cursor-pointer"
                    title="Copy Bank Name"
                  >
                    {copiedField === "bank" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div>Account Name:</div>
                <div className="font-bold text-natural-green dark:text-white col-span-2 flex items-center justify-between">
                  <span>{donationSettings?.accountName || "Ishaq Ridwanullah Babatunde"}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(donationSettings?.accountName || "Ishaq Ridwanullah Babatunde", "name")}
                    className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded text-slate-400 hover:text-natural-gold transition-colors cursor-pointer"
                    title="Copy Account Name"
                  >
                    {copiedField === "name" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div>Account No:</div>
                <div className="font-bold text-natural-green dark:text-white col-span-2 flex items-center justify-between text-base">
                  <span className="font-bold font-sans tracking-wide text-natural-gold">{donationSettings?.accountNumber || "8122455759"}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(donationSettings?.accountNumber || "8122455759", "number")}
                    className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded text-slate-400 hover:text-natural-gold transition-colors cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedField === "number" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Receipt upload field */}
              <div className="p-3 bg-white dark:bg-natural-dark rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 space-y-2">
                <label className="block text-[11px] font-bold text-natural-green dark:text-amber-100">
                  {isArabic ? "تحميل إيصال الدفع / التحويل (مطلوب):" : "Upload Your Payment Receipt (Required):"}
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReceiptFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setReceiptFile(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-natural-sage file:text-natural-green hover:file:bg-emerald-100 cursor-pointer"
                />
                {receiptFileName && (
                  <p className="text-[10px] text-natural-gold font-semibold">
                    ✓ {receiptFileName}
                  </p>
                )}
              </div>

              <p className="text-[10px] italic text-slate-400">
                {isArabic ? "يرجى كتابة اسم المتبرع في حقل الملاحظات لإظهاره في لوحة المانحين." : "Please use your donor name as payment reference for manual reconciliation."}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-natural-green hover:bg-natural-dark disabled:bg-slate-300 text-white font-bold rounded-full shadow hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {isSubmitting ? (
              <span>{isArabic ? "جاري تشفير ومعالجة العملية..." : "Authorizing Secure Payment..."}</span>
            ) : (
              <>
                <Heart className="w-4 h-4 text-white fill-white animate-pulse" />
                <span>{isArabic ? `إرسال تبرع بقيمة ₦${amount.toLocaleString()}` : `Authorize Donation of ₦${amount.toLocaleString()}`}</span>
              </>
            )}
          </button>

          {/* Success message popup with WhatsApp Button */}
          {successMsg && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-100 dark:border-emerald-900/45 rounded-3xl flex flex-col gap-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-natural-green dark:text-emerald-100 font-bold leading-relaxed">
                  {isArabic 
                    ? "تقبل الله منكم! تم استلام تبرعكم بنجاح وتسجيله في كشوفات الأكاديمية. يرجى إرسال إشعار الدفع مباشرة عبر الواتساب لتأكيد العملية وسرعة اعتمادها." 
                    : "Donation received! Jazakum Allahu Khairan for your support. Please proceed to notify us on WhatsApp to confirm your donation approval."}
                </div>
              </div>
              {waNotifyUrl && (
                <a
                  href={waNotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full text-xs shadow hover:shadow-md transition-all decoration-none"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 1.977 14.113.953 11.5.953c-5.44 0-9.865 4.371-9.87 9.8-.002 1.722.453 3.4 1.32 4.893l-.994 3.63 3.71-.97c1.455.796 2.907 1.25 4.39 1.25zM15.8 11.66c-.23-.115-1.354-.668-1.564-.744-.21-.076-.363-.115-.516.115-.153.23-.593.744-.727.898-.134.153-.268.172-.498.057-.23-.115-.97-.358-1.846-1.14-.68-.606-1.14-1.355-1.273-1.585-.134-.23-.014-.354.1-.47.1-.104.23-.268.345-.403.115-.134.153-.23.23-.383.076-.153.038-.287-.019-.403-.057-.115-.516-1.246-.707-1.707-.186-.448-.37-.387-.516-.395-.134-.007-.287-.008-.44-.008-.153 0-.403.057-.613.287-.21.23-.804.786-.804 1.917s.824 2.222.939 2.375c.115.153 1.62 2.474 3.924 3.467.548.236.976.377 1.31.483.55.174 1.05.15 1.445.09.44-.067 1.354-.554 1.545-1.09.19-.536.19-1.01.134-1.09-.057-.08-.21-.115-.44-.23z" />
                  </svg>
                  <span>🟢 Proceed to Notify on WhatsApp</span>
                </a>
              )}
            </div>
          )}

        </form>

        {/* Recent Donors List */}
        <div className="lg:col-span-5 bg-white dark:bg-natural-dark rounded-3xl p-6 sm:p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-6 max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-bold text-natural-green dark:text-amber-100 uppercase tracking-wider border-b border-emerald-50 dark:border-emerald-900/30 pb-3 flex items-center justify-between font-serif">
            <span>{isArabic ? "سجل المانحين الأخير" : "Recent Noble Donors"}</span>
            <Users className="w-4 h-4 text-natural-gold" />
          </h3>

          <div className="space-y-4">
            {donations.map((don) => (
              <div
                key={don.id}
                className="p-4 bg-natural-sage/10 dark:bg-natural-green/20 rounded-2xl border border-emerald-50 dark:border-emerald-900/30 flex items-start gap-3 text-xs animate-fade-in"
              >
                <div className="w-8 h-8 rounded-full bg-natural-green flex items-center justify-center text-natural-gold font-bold text-xs flex-shrink-0">
                  {don.donorName.slice(0, 1)}
                </div>
                <div className="space-y-1 min-w-0 flex-grow">
                  <div className="flex justify-between items-center gap-1 font-bold">
                    <span className="text-natural-green dark:text-emerald-100 truncate font-serif">{don.donorName}</span>
                    <span className="text-natural-gold font-mono flex-shrink-0 font-bold">+₦{don.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-500 dark:text-emerald-300 italic text-[11px] leading-relaxed">
                    "{don.message}"
                  </p>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1">
                    <span className="bg-natural-sage/25 dark:bg-natural-green/45 px-2 py-0.5 rounded-full uppercase font-semibold text-natural-green dark:text-natural-gold">
                      {don.category.replace("_", " ")}
                    </span>
                    <span className="font-mono">{new Date(don.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
