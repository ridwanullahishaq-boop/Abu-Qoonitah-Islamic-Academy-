/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";

// --- CLIENT-SIDE SUPABASE BACKEND FALLBACK ENGINE ---
// This file runs inside the browser and intercepts all "/api/*" requests
// when the app is deployed on static hosts like Netlify (where server.ts does not run).
// It maintains a fully replicated database state in Supabase's 'academy_state' table
// and performs all backend operations directly in the browser!

const SUPABASE_URL = "https://mghikpkippboxeujukpm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGlrcGtpcHBib3hldWp1a3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Njc1OTgsImV4cCI6MjA5OTI0MzU5OH0.VgAtoV3aYmZ2WQW1QBgFwrDvb4Ei-bd0UrHn8XzN17w";

let supabase: any = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
} catch (err) {
  console.error("Supabase fallback initialization failed:", err);
}

let clientDb: any = null;
let useClientFallback = false;

// Standard PBKDF2 function compatible with server.ts
async function pbkdf2(password: string, saltHex: string, iterations = 1000, keyLen = 64): Promise<string> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256"
    },
    passwordKey,
    keyLen * 8
  );

  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Generate random ID
function generateId(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).substring(2, 10);
}

// Load database from Supabase
async function loadDbFromSupabase(): Promise<any> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("academy_state")
      .select("data")
      .eq("id", "main_db")
      .maybeSingle();

    if (error) {
      console.warn("Could not load state from Supabase:", error.message);
      return null;
    }
    if (data && data.data) {
      return data.data;
    }
  } catch (err) {
    console.error("Supabase load fallback error:", err);
  }
  return null;
}

// Save database to Supabase
async function saveDbToSupabase() {
  if (!supabase || !clientDb) return;
  try {
    await supabase
      .from("academy_state")
      .upsert({ id: "main_db", data: clientDb, updated_at: new Date().toISOString() });
    console.log("Supabase Fallback: DB State backed up to cloud!");
  } catch (err) {
    console.error("Supabase fallback save error:", err);
  }
}

// Probe to check if local server is working or we are on Netlify
async function probeBackend() {
  try {
    const res = await originalFetch("/api/public/free-course");
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html") || !res.ok) {
      console.log("Supabase Fallback: Real API server not found or returned HTML redirect (Netlify detected). Activating fallback engine...");
      useClientFallback = true;
      clientDb = await loadDbFromSupabase();
      if (!clientDb) {
        console.warn("Supabase Fallback: Could not fetch DB from cloud. Initializing empty fallback state.");
        clientDb = {
          users: {},
          courses: [],
          submissions: [],
          donations: [],
          books: [],
          poems: [],
          announcements: [],
          discussions: [],
          directMessages: [],
          calendar: [],
          testimonials: [],
          settings: {
            prayerTimes: { fajr: "05:10", dhuhr: "12:35", asr: "15:55", maghrib: "19:15", isha: "20:30" },
            hijriAdjustment: 0,
            quoteOfTheDay: { arabic: "العلم صيد والكتابة قيده", translation: "Knowledge is a prey, and writing is its fetter.", source: "Shafi'i" }
          },
          freeCourse: {
            title: "Laamiyyatu Ibn Taimiyyah",
            description: "A beautiful classical Arabic poem outlining the core creed (Aqeedah) of Islam.",
            imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e",
            poemArabicText: [],
            poemTranslationText: [],
            audioFiles: []
          },
          aboutUs: {
            historyEn: "",
            historyAr: "",
            founderBioEn: "",
            founderBioAr: "",
            values: [],
            faqs: []
          },
          sermons: [],
          curriculum: {
            whyEnroll: "Abu Qoonitah Islamic Academy provides a structured online Madrasah environment that blends the depth of classical, traditional texts with the speed and reach of modern LMS technology. Gain a firm foundation in Tajweed, Arabic grammar, and authentic Islamic creed under certified teachers with direct supervision.",
            sections: [
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
            ],
            featuredCourses: [
              {
                id: "course-beg-1",
                level: "Beginner",
                titleEn: "Introduction to Arabic Alphabet",
                titleAr: "مقدمة الحروف العربية",
                teacherEn: "Shaykh Ahmed Al-Misri",
                teacherAr: "الشيخ أحمد المصري",
                duration: "6 Weeks",
                descEn: "Master pronunciation and writing. Perfect for absolute beginners starting their Islamic path.",
                descAr: "إتقان مخارج الحروف العربية ونطقها وكتابتها للمبتدئين."
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
                descAr: "شرح أحكام النون الساكنة والتنوين وتلاوة القرآن بطريقة صحيحة."
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
                descAr: "شرح تقسيم الكلمة والعلامات الإعرابية وتبسيط قواعد التركيب."
              }
            ]
          },
          donationSettings: { targetTitle: "Support the Madrasah", targetDescription: "Help fund educational programs and facility upkeep.", targetAmount: 5000000, raisedAmount: 125000, accountNumber: "08122455759", accountName: "Abu Qoonitah Academy", bank: "Opay" }
        };
      }
    } else {
      console.log("Supabase Fallback: API server responded successfully. Running standard API mode.");
    }
  } catch (err) {
    console.log("Supabase Fallback: Network probe failed. Activating client fallback engine...", err);
    useClientFallback = true;
    clientDb = await loadDbFromSupabase();
  }
}

// Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);
  
  if (urlStr.includes("/api/") && useClientFallback) {
    try {
      const response = await handleMockRequest(urlStr, init);
      return response;
    } catch (err: any) {
      console.error("Fallback engine error processing request:", urlStr, err);
      return new Response(JSON.stringify({ error: err.message || "Internal Fallback Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return originalFetch(input, init);
};

// Start the probe
probeBackend();

// Mock routing engine
async function handleMockRequest(url: string, init?: RequestInit): Promise<Response> {
  const method = init?.method?.toUpperCase() || "GET";
  const body = init?.body ? JSON.parse(init.body as string) : null;
  const authHeader = init?.headers ? (init.headers as any)["Authorization"] || (init.headers as any)["authorization"] : null;
  const token = authHeader?.replace("Bearer ", "") || "";
  
  const parsedUrl = new URL(url, window.location.origin);
  const path = parsedUrl.pathname;

  console.log(`[Supabase Fallback Proxy] ${method} ${path}`, body);

  const mockResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  const getAuthorizedUser = () => {
    if (!token) return null;
    return clientDb.users[token] || null; // Using userId directly as token
  };

  // --- PUBLIC ENDPOINTS ---
  if (path === "/api/public/free-course" && method === "GET") {
    return mockResponse(clientDb.freeCourse);
  }
  if (path === "/api/public/donation-settings" && method === "GET") {
    return mockResponse(clientDb.donationSettings);
  }
  if (path === "/api/public/sermons" && method === "GET") {
    return mockResponse(clientDb.sermons || []);
  }
  if (path === "/api/public/about" && method === "GET") {
    return mockResponse(clientDb.aboutUs);
  }
  if (path === "/api/public/curriculum" && method === "GET") {
    return mockResponse(clientDb.curriculum);
  }
  if (path === "/api/public/stats" && method === "GET") {
    const studentsCount = Object.values(clientDb.users).filter((u: any) => u.role === "student").length;
    const teachersCount = Object.values(clientDb.users).filter((u: any) => u.role === "teacher").length;
    const coursesCount = clientDb.courses.length;
    return mockResponse({ studentsCount, teachersCount, coursesCount });
  }
  if (path === "/api/public/quote" && method === "GET") {
    return mockResponse(clientDb.settings.quoteOfTheDay);
  }
  if (path === "/api/public/calendar" && method === "GET") {
    return mockResponse(clientDb.calendar || []);
  }
  if (path === "/api/public/testimonials" && method === "GET") {
    return mockResponse(clientDb.testimonials || []);
  }
  if (path === "/api/public/books" && method === "GET") {
    return mockResponse(clientDb.books || []);
  }
  if (path === "/api/public/poems" && method === "GET") {
    return mockResponse(clientDb.poems || []);
  }
  if (path === "/api/public/announcements" && method === "GET") {
    return mockResponse(clientDb.announcements || []);
  }

  // --- AUTH ENDPOINTS ---
  if (path === "/api/auth/login" && method === "POST") {
    const { username, password } = body || {};
    const userObj = Object.values(clientDb.users).find(
      (u: any) => u.username?.toLowerCase() === username?.toLowerCase() || u.email?.toLowerCase() === username?.toLowerCase()
    ) as any;

    if (!userObj) {
      return mockResponse({ error: "Invalid username or password" }, 401);
    }

    const hashed = await pbkdf2(password, userObj.salt);
    if (hashed !== userObj.passwordHash) {
      return mockResponse({ error: "Invalid username or password" }, 401);
    }

    return mockResponse({ token: userObj.id, user: userObj });
  }

  if (path === "/api/auth/register" && method === "POST") {
    const { username, email, password, name, role, dob, level, country, state, receiptUrl, whyJoin } = body || {};
    
    const exists = Object.values(clientDb.users).some(
      (u: any) => u.username?.toLowerCase() === username?.toLowerCase() || u.email?.toLowerCase() === email?.toLowerCase()
    );
    if (exists) {
      return mockResponse({ error: "Username or Email already registered" }, 400);
    }

    const userId = generateId("user");
    const salt = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    const passwordHash = await pbkdf2(password, salt);

    const newUser = {
      id: userId,
      username,
      email,
      name,
      role: role || "student",
      isPaid: false,
      dob,
      level,
      country,
      state,
      receiptUrl,
      whyJoin,
      passwordHash,
      salt,
      plainPassword: password
    };

    clientDb.users[userId] = newUser;
    await saveDbToSupabase();
    
    return mockResponse({ success: true, token: userId, user: newUser });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const user = getAuthorizedUser();
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    return mockResponse({ user });
  }

  // --- PROTECTED/COURSES/SUBMISSIONS ---
  if (path === "/api/courses" && method === "GET") {
    const user = getAuthorizedUser();
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    return mockResponse(clientDb.courses || []);
  }

  if (path === "/api/courses/enroll" && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    const { courseId } = body || {};
    const course = clientDb.courses.find((c: any) => c.id === courseId);
    if (!course) return mockResponse({ error: "Course not found" }, 404);
    
    if (!user.enrolledCourses) user.enrolledCourses = [];
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      course.enrolledStudentsCount = (course.enrolledStudentsCount || 0) + 1;
      await saveDbToSupabase();
    }
    return mockResponse({ success: true, user });
  }

  if (path === "/api/submissions/submit" && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    const { courseId, assignmentId, fileUrl, comments } = body || {};

    const newSubmission = {
      id: generateId("sub"),
      courseId,
      assignmentId,
      studentId: user.id,
      studentName: user.name,
      fileUrl,
      comments,
      submittedAt: new Date().toISOString(),
      status: "pending",
      grade: null,
      feedback: ""
    };

    if (!clientDb.submissions) clientDb.submissions = [];
    clientDb.submissions.push(newSubmission);
    await saveDbToSupabase();
    return mockResponse({ success: true, submission: newSubmission });
  }

  if (path === "/api/submissions" && method === "GET") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    if (user.role === "admin" || user.role === "teacher") {
      return mockResponse(clientDb.submissions || []);
    }
    const mySubs = (clientDb.submissions || []).filter((s: any) => s.studentId === user.id);
    return mockResponse(mySubs);
  }

  if (path.startsWith("/api/submissions/") && path.endsWith("/grade") && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const subId = path.split("/")[3];
    const { grade, feedback } = body || {};
    const sub = (clientDb.submissions || []).find((s: any) => s.id === subId);
    if (!sub) return mockResponse({ error: "Submission not found" }, 404);

    sub.grade = Number(grade);
    sub.feedback = feedback;
    sub.status = "graded";
    
    await saveDbToSupabase();
    return mockResponse({ success: true, submission: sub });
  }

  // --- DONATIONS ---
  if (path === "/api/donations/submit" && method === "POST") {
    const { donorName, amount, category, frequency, paymentMethod, message } = body || {};
    
    const newDonation = {
      id: generateId("don"),
      donorName: donorName || "Anonymous",
      amount: Number(amount),
      category,
      frequency,
      paymentMethod,
      message,
      date: new Date().toISOString()
    };

    if (!clientDb.donations) clientDb.donations = [];
    clientDb.donations.push(newDonation);
    
    if (clientDb.donationSettings) {
      clientDb.donationSettings.raisedAmount = (clientDb.donationSettings.raisedAmount || 0) + Number(amount);
    }

    await saveDbToSupabase();

    // Generate WhatsApp Notification message for Abu Qoonitah Academy DM
    const waMessage = `✨ *NEW SACRED ACADEMY DONATION RECEIVED* ✨\n\n` +
      `👤 *Donor Name:* ${donorName || "Anonymous Donor"}\n` +
      `💰 *Donation Amount:* ₦${Number(amount).toLocaleString()}\n` +
      `📂 *Allocation Fund:* ${category || "General Operations"}\n` +
      `📅 *Frequency:* ${frequency || "One-time"}\n` +
      `💳 *Payment Method:* ${paymentMethod || "Bank Transfer"}\n` +
      `💬 *Donor Message:* "${message || "No message attached."}"\n\n` +
      `⚡ *Verification Status:* Pending physical bank alert check.\n` +
      `🙏 _Barakallahu feekum! May Allah multiply your reward in this life and the Next._`;

    const waNotifyUrl = `https://wa.me/2348122455759?text=${encodeURIComponent(waMessage)}`;

    return mockResponse({ success: true, donation: newDonation, waNotifyUrl });
  }

  // --- DISCUSSIONS / PRIVATE MESSAGES ---
  if (path.startsWith("/api/discussions/") && method === "GET") {
    const courseId = path.split("/")[3];
    const msgs = (clientDb.discussions || []).filter((d: any) => d.courseId === courseId);
    return mockResponse(msgs);
  }

  if (path === "/api/discussions/post" && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    const { courseId, message } = body || {};

    const newMsg = {
      id: generateId("disc"),
      courseId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message,
      timestamp: new Date().toISOString()
    };

    if (!clientDb.discussions) clientDb.discussions = [];
    clientDb.discussions.push(newMsg);
    await saveDbToSupabase();
    return mockResponse({ success: true, message: newMsg });
  }

  if (path === "/api/messages/contacts" && method === "GET") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    
    // Admins and teachers can message anyone, students can message admins and teachers
    const allUsers = Object.values(clientDb.users) as any[];
    if (user.role === "admin" || user.role === "teacher") {
      return mockResponse(allUsers.filter(u => u.id !== user.id));
    } else {
      return mockResponse(allUsers.filter(u => u.role === "admin" || u.role === "teacher"));
    }
  }

  if (path === "/api/messages/history" && method === "GET") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    const withUserId = parsedUrl.searchParams.get("withUserId");

    const chatHistory = (clientDb.directMessages || []).filter(
      (m: any) =>
        (m.senderId === user.id && m.receiverId === withUserId) ||
        (m.senderId === withUserId && m.receiverId === user.id)
    );
    return mockResponse(chatHistory);
  }

  if (path === "/api/messages/send" && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user) return mockResponse({ error: "Unauthorized" }, 401);
    const { receiverId, message } = body || {};

    const newDm = {
      id: generateId("dm"),
      senderId: user.id,
      senderName: user.name,
      receiverId,
      message,
      timestamp: new Date().toISOString()
    };

    if (!clientDb.directMessages) clientDb.directMessages = [];
    clientDb.directMessages.push(newDm);
    await saveDbToSupabase();
    return mockResponse({ success: true, message: newDm });
  }

  // --- ADMIN PORTALS ---
  const adminCheck = () => {
    const user = getAuthorizedUser() as any;
    return user && user.role === "admin";
  };

  if (path === "/api/admin/free-course" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    clientDb.freeCourse = body;
    await saveDbToSupabase();
    return mockResponse({ success: true, freeCourse: clientDb.freeCourse });
  }

  if (path === "/api/admin/about" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    clientDb.aboutUs = body;
    await saveDbToSupabase();
    return mockResponse({ success: true, aboutUs: clientDb.aboutUs });
  }

  if (path === "/api/admin/curriculum" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    clientDb.curriculum = body;
    await saveDbToSupabase();
    return mockResponse({ success: true, curriculum: clientDb.curriculum });
  }

  if (path === "/api/admin/donation-settings" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    clientDb.donationSettings = body;
    await saveDbToSupabase();
    return mockResponse({ success: true, donationSettings: clientDb.donationSettings });
  }

  if (path === "/api/admin/sermons" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const { sermons } = body || {};
    if (Array.isArray(sermons)) {
      clientDb.sermons = sermons;
    } else {
      if (!clientDb.sermons) clientDb.sermons = [];
      clientDb.sermons.push({
        id: generateId("sermon"),
        ...body
      });
    }
    await saveDbToSupabase();
    return mockResponse({ success: true, sermons: clientDb.sermons });
  }

  if (path === "/api/admin/students" && method === "GET") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const list = Object.values(clientDb.users).filter((u: any) => u.role === "student");
    return mockResponse(list);
  }

  if (path === "/api/admin/teachers" && method === "GET") {
    const user = getAuthorizedUser() as any;
    if (!user || user.role !== "admin") return mockResponse({ error: "Unauthorized" }, 403);
    const list = Object.values(clientDb.users).filter((u: any) => u.role === "teacher");
    return mockResponse(list);
  }

  if (path === "/api/admin/admission-list" && method === "GET") {
    const user = getAuthorizedUser() as any;
    if (!user || user.role !== "admin") return mockResponse({ error: "Unauthorized" }, 403);
    const list = Object.values(clientDb.users);
    return mockResponse(list);
  }

  if (path.startsWith("/api/admin/students/") && path.endsWith("/payment") && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const studentId = path.split("/")[4];
    const { isPaid } = body || {};
    const stud = clientDb.users[studentId];
    if (stud) {
      stud.isPaid = isPaid;
      await saveDbToSupabase();
    }
    return mockResponse({ success: true, user: stud });
  }

  if (path === "/api/admin/students/create" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const { username, email, password, name, role, level } = body || {};
    
    const exists = Object.values(clientDb.users).some(
      (u: any) => u.username?.toLowerCase() === username?.toLowerCase() || u.email?.toLowerCase() === email?.toLowerCase()
    );
    if (exists) return mockResponse({ error: "Username or email already exists" }, 400);

    const userId = generateId("user");
    const salt = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    const passwordHash = await pbkdf2(password, salt);

    const newUser = {
      id: userId,
      username,
      email,
      name,
      role: role || "student",
      level: level || "beginner",
      isPaid: true,
      passwordHash,
      salt,
      plainPassword: password
    };

    clientDb.users[userId] = newUser;
    await saveDbToSupabase();
    return mockResponse({ success: true, user: newUser });
  }

  if (path.startsWith("/api/admin/students/") && path.endsWith("/update-credentials") && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const studId = path.split("/")[4];
    const { username, password } = body || {};
    const stud = clientDb.users[studId];
    if (!stud) return mockResponse({ error: "User not found" }, 404);

    if (username) stud.username = username;
    if (password) {
      stud.plainPassword = password;
      const salt = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      stud.salt = salt;
      stud.passwordHash = await pbkdf2(password, salt);
    }

    await saveDbToSupabase();
    return mockResponse({ success: true, user: stud });
  }

  if (path === "/api/admin/books/add" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    if (!clientDb.books) clientDb.books = [];
    const newBook = {
      id: generateId("book"),
      ...body
    };
    clientDb.books.push(newBook);
    await saveDbToSupabase();
    return mockResponse({ success: true, book: newBook });
  }

  if (path === "/api/admin/poems/add" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    if (!clientDb.poems) clientDb.poems = [];
    const newPoem = {
      id: generateId("poem"),
      ...body
    };
    clientDb.poems.push(newPoem);
    await saveDbToSupabase();
    return mockResponse({ success: true, poem: newPoem });
  }

  if (path === "/api/admin/announcements/create" && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const newAnn = {
      id: generateId("ann"),
      title: body.title,
      content: body.content,
      date: new Date().toISOString(),
      targetRole: body.targetRole || "all",
      author: user.name
    };

    if (!clientDb.announcements) clientDb.announcements = [];
    clientDb.announcements.unshift(newAnn);
    await saveDbToSupabase();
    return mockResponse({ success: true, announcement: newAnn });
  }

  if (path.startsWith("/api/admin/announcements/") && method === "DELETE") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const annId = path.split("/")[4];
    clientDb.announcements = (clientDb.announcements || []).filter((a: any) => a.id !== annId);
    await saveDbToSupabase();
    return mockResponse({ success: true });
  }

  if (path === "/api/admin/quote/update" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    clientDb.settings.quoteOfTheDay = body;
    await saveDbToSupabase();
    return mockResponse({ success: true, quote: clientDb.settings.quoteOfTheDay });
  }

  if (path === "/api/admin/calendar/create" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const newEvent = {
      id: generateId("cal"),
      ...body
    };
    if (!clientDb.calendar) clientDb.calendar = [];
    clientDb.calendar.push(newEvent);
    await saveDbToSupabase();
    return mockResponse({ success: true, event: newEvent });
  }

  if (path.startsWith("/api/admin/calendar/") && method === "DELETE") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const eventId = path.split("/")[4];
    clientDb.calendar = (clientDb.calendar || []).filter((e: any) => e.id !== eventId);
    await saveDbToSupabase();
    return mockResponse({ success: true });
  }

  if (path === "/api/admin/testimonials/create" && method === "POST") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const newTestimonial = {
      id: generateId("t"),
      ...body
    };
    if (!clientDb.testimonials) clientDb.testimonials = [];
    clientDb.testimonials.push(newTestimonial);
    await saveDbToSupabase();
    return mockResponse({ success: true, testimonial: newTestimonial });
  }

  if (path.startsWith("/api/admin/testimonials/") && method === "DELETE") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const tId = path.split("/")[4];
    clientDb.testimonials = (clientDb.testimonials || []).filter((t: any) => t.id !== tId);
    await saveDbToSupabase();
    return mockResponse({ success: true });
  }

  if (path.startsWith("/api/admin/courses/") && path.endsWith("/materials") && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const courseId = path.split("/")[4];
    const { title, type, url, description, duration, fileSize, dueDate, points } = body || {};
    const course = clientDb.courses.find((c: any) => c.id === courseId);
    if (!course) return mockResponse({ error: "Course not found" }, 404);

    if (type === "video") {
      if (!course.videos) course.videos = [];
      course.videos.push({ id: generateId("vid"), title, url, description, duration });
    } else if (type === "pdf") {
      if (!course.pdfs) course.pdfs = [];
      course.pdfs.push({ id: generateId("pdf"), title, url, description, fileSize });
    } else if (type === "assignment") {
      if (!course.assignments) course.assignments = [];
      course.assignments.push({ id: generateId("assign"), title, description, dueDate, points: Number(points) });
    }

    await saveDbToSupabase();
    return mockResponse({ success: true, course });
  }

  if (path.startsWith("/api/admin/courses/") && path.includes("/materials/") && method === "DELETE") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const courseId = path.split("/")[4];
    const type = path.split("/")[6];
    const matId = path.split("/")[7];
    const course = clientDb.courses.find((c: any) => c.id === courseId);
    if (!course) return mockResponse({ error: "Course not found" }, 404);

    if (type === "video") {
      course.videos = (course.videos || []).filter((v: any) => v.id !== matId);
    } else if (type === "pdf") {
      course.pdfs = (course.pdfs || []).filter((p: any) => p.id !== matId);
    } else if (type === "assignment") {
      course.assignments = (course.assignments || []).filter((a: any) => a.id !== matId);
    }

    await saveDbToSupabase();
    return mockResponse({ success: true, course });
  }

  if (path.startsWith("/api/admin/courses/") && path.includes("/materials/") && method === "PUT") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const courseId = path.split("/")[4];
    const type = path.split("/")[6];
    const matId = path.split("/")[7];
    const course = clientDb.courses.find((c: any) => c.id === courseId);
    if (!course) return mockResponse({ error: "Course not found" }, 404);

    let material: any = null;
    if (type === "video") {
      material = (course.videos || []).find((v: any) => v.id === matId);
    } else if (type === "pdf") {
      material = (course.pdfs || []).find((p: any) => p.id === matId);
    } else if (type === "assignment") {
      material = (course.assignments || []).find((a: any) => a.id === matId);
    }

    if (material) {
      Object.assign(material, body);
      await saveDbToSupabase();
    }
    return mockResponse({ success: true, course });
  }

  if (path === "/api/admin/courses/create" && method === "POST") {
    const user = getAuthorizedUser() as any;
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return mockResponse({ error: "Unauthorized" }, 403);
    }
    const newCourse = {
      id: generateId("course"),
      level: body.level || "beginner",
      title: body.title,
      description: body.description,
      duration: body.duration,
      teacherName: user.name,
      enrolledStudentsCount: 0,
      objectives: body.objectives || [],
      videos: [],
      pdfs: [],
      assignments: [],
      quizzes: []
    };

    if (!clientDb.courses) clientDb.courses = [];
    clientDb.courses.push(newCourse);
    await saveDbToSupabase();
    return mockResponse({ success: true, course: newCourse });
  }

  if (path.startsWith("/api/admin/books/") && method === "DELETE") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const bookId = path.split("/")[4];
    clientDb.books = (clientDb.books || []).filter((b: any) => b.id !== bookId);
    await saveDbToSupabase();
    return mockResponse({ success: true });
  }

  if (path.startsWith("/api/admin/poems/") && method === "DELETE") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const poemId = path.split("/")[4];
    clientDb.poems = (clientDb.poems || []).filter((p: any) => p.id !== poemId);
    await saveDbToSupabase();
    return mockResponse({ success: true });
  }

  if (path.startsWith("/api/admin/books/") && method === "PUT") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const bookId = path.split("/")[4];
    const b = (clientDb.books || []).find((x: any) => x.id === bookId);
    if (b) {
      Object.assign(b, body);
      await saveDbToSupabase();
    }
    return mockResponse({ success: true, book: b });
  }

  if (path.startsWith("/api/admin/poems/") && method === "PUT") {
    if (!adminCheck()) return mockResponse({ error: "Unauthorized" }, 403);
    const poemId = path.split("/")[4];
    const p = (clientDb.poems || []).find((x: any) => x.id === poemId);
    if (p) {
      Object.assign(p, body);
      await saveDbToSupabase();
    }
    return mockResponse({ success: true, poem: p });
  }

  if (path === "/api/search" && method === "GET") {
    const query = parsedUrl.searchParams.get("q")?.toLowerCase() || "";
    if (!query) return mockResponse({ courses: [], books: [], poems: [] });
    
    const courses = (clientDb.courses || []).filter((c: any) => c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query));
    const books = (clientDb.books || []).filter((b: any) => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || b.description.toLowerCase().includes(query));
    const poems = (clientDb.poems || []).filter((p: any) => p.title.toLowerCase().includes(query) || p.poetName.toLowerCase().includes(query));
    
    return mockResponse({ courses, books, poems });
  }

  return mockResponse({ error: "Not Found or Not Implemented in Fallback Engine" }, 404);
}
