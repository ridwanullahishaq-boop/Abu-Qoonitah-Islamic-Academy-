/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { User, UserRole, Course, Submission, Donation, Book, Poem, Announcement, DiscussionMessage, DirectMessage, SchoolCalendarEvent, Testimonial } from "./src/types";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

// --- SUPABASE CLIENT CONFIGURATION & SYNCHRONIZATION ---
const rawSupabaseUrl = (process.env.SUPABASE_URL || "https://fhmgbmrsnwrkgfvucuvi.supabase.co").trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobWdibXJzbndya2dmdnVjdXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzE2ODQsImV4cCI6MjA5OTI0NzY4NH0.zcU4R6uRo5d1YlSKd1IIXUuToIpxNRyS36N6U1NQ_A4").trim();

// Automatically sanitize URL to handle trailing /rest/v1/ paths
let SUPABASE_URL = rawSupabaseUrl;
if (SUPABASE_URL.endsWith("/rest/v1/")) {
  SUPABASE_URL = SUPABASE_URL.slice(0, -9);
} else if (SUPABASE_URL.endsWith("/rest/v1")) {
  SUPABASE_URL = SUPABASE_URL.slice(0, -8);
}

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    console.log("Supabase client initialized with URL:", SUPABASE_URL);
  } catch (err) {
    console.error("Error initializing Supabase client:", err);
  }
}

async function loadFromSupabase(): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("academy_state")
      .select("data")
      .eq("id", "main_db")
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch database state from Supabase (this is normal if table is not yet created):", error.message);
      return null;
    }
    if (data && data.data) {
      console.log("Successfully retrieved database state from Supabase Cloud!");
      return data.data;
    }
  } catch (err: any) {
    console.warn("Supabase load error:", err.message);
  }
  return null;
}

async function saveToSupabase(dbState: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("academy_state")
      .upsert({ id: "main_db", data: dbState, updated_at: new Date().toISOString() });

    if (error) {
      console.warn("Could not save database state to Supabase:", error.message);
    } else {
      console.log("Successfully backed up database state to Supabase Cloud!");
    }
  } catch (err: any) {
    console.warn("Supabase save error:", err.message);
  }
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- DATABASE UTILITIES ---
interface DatabaseSchema {
  users: Record<string, User & { passwordHash: string; salt: string }>;
  courses: Course[];
  submissions: Submission[];
  donations: Donation[];
  books: Book[];
  poems: Poem[];
  announcements: Announcement[];
  discussions: DiscussionMessage[];
  directMessages: DirectMessage[];
  calendar: SchoolCalendarEvent[];
  testimonials: Testimonial[];
  settings: {
    prayerTimes: Record<string, string>;
    hijriAdjustment: number;
    quoteOfTheDay: { arabic: string; translation: string; source: string };
  };
  freeCourse: {
    title: string;
    description: string;
    imageUrl: string;
    poemArabicText: string[];
    poemTranslationText: string[];
    audioFiles: { id: string; title: string; url: string; description: string; }[];
  };
  aboutUs: {
    historyEn: string;
    historyAr: string;
    founderBioEn: string;
    founderBioAr: string;
    values: { titleEn: string; titleAr: string; descEn: string; descAr: string; }[];
    faqs: { qEn: string; qAr: string; aEn: string; aAr: string; }[];
  };
  sermons: { id: string; title: string; category: string; duration: string; url: string; speaker: string; coverUrl?: string; isAudio?: boolean; }[];
  curriculum: {
    whyEnroll: string;
    sections: {
      id: string;
      titleEn: string;
      titleAr: string;
      items: { nameEn: string; nameAr: string; }[];
    }[];
    featuredCourses?: {
      id: string;
      level: string;
      titleEn: string;
      titleAr: string;
      teacherEn: string;
      teacherAr: string;
      duration: string;
      descEn: string;
      descAr: string;
    }[];
  };
  donationSettings: {
    targetTitle: string;
    targetDescription: string;
    targetAmount: number;
    raisedAmount: number;
    accountNumber: string;
    accountName: string;
    bank: string;
  };
}

// Secure PBKDF2 Password Hashing
function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
}

// Initial Seeding Data
const initialDB: DatabaseSchema = {
  users: {},
  courses: [
    {
      id: "course-beg-1",
      level: "beginner",
      title: "Introduction to Arabic Alphabet",
      description: "Master the pronunciation, writing, and recognition of the 28 letters of the Arabic alphabet with their varying forms (beginning, middle, and end). Ideal for absolute beginners.",
      duration: "6 Weeks",
      teacherName: "Shaykh Ahmed Al-Misri",
      enrolledStudentsCount: 142,
      objectives: [
        "Pronounce each of the 28 Arabic letters correctly from their articulation points (Makharij).",
        "Recognize and write letters in isolated, initial, medial, and final forms.",
        "Understand the short vowels (Fathah, Kasrah, Dammah) and long vowels (Mad letters)."
      ],
      videos: [
        { id: "vid-beg1-1", title: "Lesson 1: Introduction & Makhraj of Alif to Kha", url: "https://www.youtube.com/embed/vT4r_2bI-0Q", description: "Learn the proper articulation points for the first five letters of the Arabic alphabet.", duration: "15:20" },
        { id: "vid-beg1-2", title: "Lesson 2: Letters Dal to Sâd & Connecting Forms", url: "https://www.youtube.com/embed/8I869l_5mYg", description: "Understand how letters change shape when joined together in a word.", duration: "18:45" },
        { id: "vid-beg1-3", title: "Lesson 3: Vowels (Fathah, Kasrah, Dammah) and Tanween", url: "https://www.youtube.com/embed/jZ_E3O9nK8A", description: "Master the short vowel markings and double vowels (nunation).", duration: "20:10" }
      ],
      pdfs: [
        { id: "pdf-beg1-1", title: "Arabic Writing & Alphabet Workbook", url: "https://example.com/arabic_writing_workbook.pdf", description: "Printable tracing exercises for mastering stroke order.", fileSize: "4.2 MB" },
        { id: "pdf-beg1-2", title: "Makharij Visual Articulation Chart", url: "https://example.com/makharij_chart.pdf", description: "An anatomical chart illustrating correct throat and mouth positions.", fileSize: "1.8 MB" }
      ],
      assignments: [
        { id: "assign-beg1-1", title: "Alphabet Writing Assignment", description: "Write down the Arabic letters in their individual, starting, middle, and ending forms on a blank sheet. Take a photo of your work and submit it.", dueDate: "2026-07-20", points: 20 }
      ],
      quizzes: [
        {
          id: "quiz-beg1-1",
          title: "Alphabet Recognition Quiz",
          questions: [
            { id: "q-beg1-1", questionText: "Which letter is pronounced from the deepest part of the throat?", options: ["Alif (أ)", "Kha (خ)", "Hamzah (أ/ء)", "Ayn (ع)"], correctAnswerIndex: 2 },
            { id: "q-beg1-2", questionText: "How many letters are there in the Arabic alphabet?", options: ["26", "28", "29", "30"], correctAnswerIndex: 1 },
            { id: "q-beg1-3", questionText: "What sound does the Kasrah symbol represent?", options: ["'aa' (as in cat)", "'ee' (as in meet)", "'oo' (as in pool)", "Silence"], correctAnswerIndex: 1 }
          ]
        }
      ]
    },
    {
      id: "course-beg-2",
      level: "beginner",
      title: "Basic Tajweed Rules",
      description: "Learn the fundamental guidelines of reciting the Holy Quran with correct pronunciation, focusing on the rules of Noon Sakinah, Tanween, and Meem Sakinah.",
      duration: "8 Weeks",
      teacherName: "Shaykh Ahmed Al-Misri",
      enrolledStudentsCount: 118,
      objectives: [
        "Identify and implement the four rules of Noon Sakinah and Tanween: Izhar, Idgham, Iqlab, and Ikhfa.",
        "Recite surahs from Juz Amma applying these basic rules.",
        "Differentiate between heavy (Tafkheem) and light (Tarqeeq) letters."
      ],
      videos: [
        { id: "vid-beg2-1", title: "Lesson 1: Intro to Tajweed & Izhar Halqi", url: "https://www.youtube.com/embed/vT4r_2bI-0Q", description: "Understanding the importance of Tajweed and the clear pronunciation of Noon Sakinah.", duration: "22:15" },
        { id: "vid-beg2-2", title: "Lesson 2: Idgham (With and Without Ghunnah)", url: "https://www.youtube.com/embed/8I869l_5mYg", description: "How to merge letters when reciting, with nasalization examples.", duration: "25:30" }
      ],
      pdfs: [
        { id: "pdf-beg2-1", title: "Tajweed Golden Summary Guide", url: "https://example.com/tajweed_summary.pdf", description: "One-page cheat sheet showing all Noon Sakinah letters.", fileSize: "1.2 MB" }
      ],
      assignments: [
        { id: "assign-beg2-1", title: "Record Surah Al-Ikhlas recitation", description: "Record an audio file of yourself reciting Surah Al-Ikhlas while applying Izhar Halqi or other rules. Upload or write your self-evaluation.", dueDate: "2026-07-25", points: 30 }
      ],
      quizzes: [
        {
          id: "quiz-beg2-1",
          title: "Noon Sakinah Rules Quiz",
          questions: [
            { id: "q-beg2-1", questionText: "How many rules are there for Noon Sakinah and Tanween?", options: ["2", "3", "4", "5"], correctAnswerIndex: 2 },
            { id: "q-beg2-2", questionText: "Which of these is the rule for converting a Noon sound into a Meem?", options: ["Izhar", "Idgham", "Iqlab", "Ikhfa"], correctAnswerIndex: 2 }
          ]
        }
      ]
    },
    {
      id: "course-int-1",
      level: "intermediate",
      title: "Introduction to Al-Nahw (Arabic Grammar)",
      description: "Delve into the system of Arabic sentence structure, word classifications (Ism, Fi'l, Harf), and the grammatical states (Raf', Nasb, Jarr) of words.",
      duration: "10 Weeks",
      teacherName: "Ustadh Abu Qoonitah",
      enrolledStudentsCount: 95,
      objectives: [
        "Classify any Arabic word into Noun (Ism), Verb (Fi'l), or Particle (Harf).",
        "Determine the grammatical state of singular nouns in nominal and verbal sentences.",
        "Analyze simple Quranic sentences grammatically (I'rab)."
      ],
      videos: [
        { id: "vid-int1-1", title: "Lesson 1: The Three Word Classifications", url: "https://www.youtube.com/embed/jZ_E3O9nK8A", description: "Deep dive into signs of an Ism, Fi'l, and Harf.", duration: "28:10" }
      ],
      pdfs: [
        { id: "pdf-int1-1", title: "Fundamentals of Nahw Workbook", url: "https://example.com/fundamentals_of_nahw.pdf", description: "Comprehensive grammar exercises with solutions.", fileSize: "5.5 MB" }
      ],
      assignments: [
        { id: "assign-int1-1", title: "Grammatical Breakdown of Surah Fatiha Verse 1-3", description: "Identify the nouns, verbs, and particles in the first three verses of Surah Al-Fatiha and submit your analysis.", dueDate: "2026-07-28", points: 50 }
      ],
      quizzes: [
        {
          id: "quiz-int1-1",
          title: "Nahw Core Concepts Quiz",
          questions: [
            { id: "q-int1-1", questionText: "Which of the following is a key sign of an Ism (Noun)?", options: ["Accepts Tanween and Alif-Lam", "Ends with a Sukoon", "Always starts with Meem", "Cannot be conjugated"], correctAnswerIndex: 0 },
            { id: "q-int1-2", questionText: "What is the standard grammatical state of a Subject (Fâ'il) in a sentence?", options: ["Mansoob (Accusative)", "Marfoo' (Nominative)", "Majroor (Genitive)", "Majzoom (Jussive)"], correctAnswerIndex: 1 }
          ]
        }
      ]
    },
    {
      id: "course-adv-1",
      level: "advanced",
      title: "Al-Ajurrumiyyah Deep Study",
      description: "An intensive advanced course studying the classical text in Arabic grammar, 'Matn al-Ajurrumiyyah', exploring complete parsing (I'rab) and complex sentence structures.",
      duration: "12 Weeks",
      teacherName: "Ustadh Abu Qoonitah",
      enrolledStudentsCount: 64,
      objectives: [
        "Memorize and explain key passages of Matn Al-Ajurrumiyyah.",
        "Perform advanced syntactical analysis (I'rab) on classical texts and complex Quranic verses.",
        "Understand the subtle differences in Arabic syntax that affect theological meanings."
      ],
      videos: [
        { id: "vid-adv1-1", title: "Lesson 1: Introduction to Matn & Author's Biography", url: "https://www.youtube.com/embed/vT4r_2bI-0Q", description: "Contextual history of Ibn Ajurrum and the structure of his famous text.", duration: "32:40" }
      ],
      pdfs: [
        { id: "pdf-adv1-1", title: "Matn Al-Ajurrumiyyah Arabic-English Interlinear", url: "https://example.com/ajurrumiyyah_interlinear.pdf", description: "The original text paired with word-by-word explanation.", fileSize: "3.6 MB" }
      ],
      assignments: [
        { id: "assign-adv1-1", title: "Advanced Syntactical Research Paper", description: "Analyze the complete grammatical structures and rhetorical implications of Ayat Al-Kursi (2:255). Word count: 1000+ words in Arabic/English.", dueDate: "2026-08-15", points: 100 }
      ],
      quizzes: [
        {
          id: "quiz-adv1-1",
          title: "Advanced Al-Ajurrumiyyah Quiz",
          questions: [
            { id: "q-adv1-1", questionText: "How many types of Mansoobaat (nouns in accusative state) are outlined in Al-Ajurrumiyyah?", options: ["10", "12", "15", "17"], correctAnswerIndex: 2 },
            { id: "q-adv1-2", questionText: "What is the marker of Raf' in the sound masculine plural (Jam' Mudhakkar Salim)?", options: ["Dammah", "Waw", "Alif", "Noon"], correctAnswerIndex: 1 }
          ]
        }
      ]
    },
    {
      id: "course-free-1",
      level: "free",
      title: "The Prophetic Prayer Guide (Salah)",
      description: "A free, step-by-step practical visual guide to performing the daily Islamic prayers exactly as demonstrated by Prophet Muhammad (peace be upon him).",
      duration: "2 Weeks",
      teacherName: "Shaykh Ahmed Al-Misri",
      enrolledStudentsCount: 450,
      objectives: [
        "Learn the prerequisites of prayer (Wudu/ablution, intention, and direction).",
        "Perform every movement of Salah correctly (Takbeer, Ruku, Sajdah, Tashahhud).",
        "Memorize the essential supplications recited in each posture."
      ],
      videos: [
        { id: "vid-free1-1", title: "Complete Step-by-Step Salah Guide", url: "https://www.youtube.com/embed/jZ_E3O9nK8A", description: "A highly visual demonstration of the entire prayer from start to finish.", duration: "18:30" }
      ],
      pdfs: [
        { id: "pdf-free1-1", title: "Prophetic Prayer Pocket Guide", url: "https://example.com/prophetic_prayer_guide.pdf", description: "A beautifully illustrated pocket booklet to memorize prayers.", fileSize: "2.5 MB" }
      ],
      assignments: [],
      quizzes: []
    }
  ],
  submissions: [],
  donations: [
    { id: "don-1", donorName: "Brother Tariq Al-Mansour", amount: 500, category: "sponsor_student", type: "one-time", message: "May Allah accept this to sponsor a young seeker of Islamic knowledge.", date: "2026-07-01T14:30:00Z", status: "completed" },
    { id: "don-2", donorName: "Sister Maryam Yusuf", amount: 50, category: "monthly_donor", type: "monthly", message: "In support of Madrasah education operations.", date: "2026-07-03T09:15:00Z", status: "completed" },
    { id: "don-3", donorName: "An anonymous brother", amount: 1000, category: "build_education", type: "one-time", message: "For building the virtual servers and expanding courses globally.", date: "2026-07-05T18:40:00Z", status: "completed" }
  ],
  books: [
    { id: "book-1", title: "Al-Aqeedah Al-Wasitiyyah", author: "Shaykh al-Islam Ibn Taymiyyah", category: "Aqeedah", description: "A concise yet comprehensive treatise outlining the creed of Ahlus-Sunnah wal-Jama'ah with strict adherence to Quranic texts and Prophetic narrations.", downloadUrl: "#", coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80" },
    { id: "book-2", title: "Riyadh As-Saliheen (The Meadows of the Righteous)", author: "Imam An-Nawawi", category: "Hadith", description: "A celebrated collection of Quranic verses and authentic Hadiths compiled to guide Muslims in spiritual purification, moral conduct, and daily life.", downloadUrl: "#", coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80" },
    { id: "book-3", title: "Tafsir Al-Jalalayn", author: "Jalaluddin Al-Mahalli & Jalaluddin As-Suyuti", category: "Tafsir", description: "A famous classical Quranic commentary renowned for its brevity, clarity, and direct explanation of words.", downloadUrl: "#", coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80" },
    { id: "book-4", title: "Al-Mukhtasar in Hanafi Fiqh", author: "Imam Al-Quduri", category: "Fiqh", description: "The premier handbook of Islamic jurisprudence according to the Hanafi school of thought, covering worship, transactions, and family law.", downloadUrl: "#", coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80" },
    { id: "book-5", title: "Ar-Raheeq Al-Makhtum (The Sealed Nectar)", author: "Shaykh Safiur-Rahman Al-Mubarakpuri", category: "Seerah", description: "An award-winning biography of Prophet Muhammad (peace be upon him) tracing his noble life, character, and mission.", downloadUrl: "#", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80" }
  ],
  poems: [
    {
      id: "poem-1",
      title: "Al-Qasida Al-Lamiyyah (The L-Poem)",
      poetName: "Ibn Al-Wardi (d. 749 AH)",
      biography: "A prominent Syrian scholar, jurist, and poet known for his expertise in grammar and Shafi'i jurisprudence. This masterpiece of ethical exhortation was written for his son.",
      category: "Wisdom",
      audioUrl: "https://example.com/audio/lamiyyah.mp3",
      arabicText: [
        "اعْتَزِلْ ذِكْرَ الأَغَانِي وَالْغَزَلْ ... وَدَعِ الْهَزْلَ وَجَانِبْ مَنْ هَزَلْ",
        "وَافْتَكِرْ فِي مُنْتَهَى حُسْنِ الَّذِي ... أَنْتَ تَهْوَاهُ تَجِدْ خَطْبًا جَلَلْ",
        "وَاتَّقِ اللهَ فَتَقْوَى اللهِ مَا ... جَاوَرَتْ قَلْبَ امْرِئٍ إِلاَّ وَصَلْ",
        "كُتِبَ الْمَوْتُ عَلَى الْخَلْقِ فَكَمْ ... فَلَّ جَيْشًا بَغْتَةً وَهْوَ بَطَلْ"
      ],
      translationText: [
        "Abandon the mention of songs and romantic verses... and leave playfulness, and keep clear of those who joke.",
        "And reflect upon the ultimate end of the beauty of that... which you love, you will find it a substantial affair.",
        "And fear Allah, for the fear of Allah has never... resided in the heart of a person except that they reached their goal.",
        "Death has been decreed upon creation; how many... an army has it defeated suddenly, even if they were heroes!"
      ]
    },
    {
      id: "poem-2",
      title: "Qasidat Unwan al-Hikam (The Address of Wisdom)",
      poetName: "Abu al-Fath al-Busti (d. 400 AH)",
      biography: "A legendary Persian secretary, literary critic, and poet celebrated for his rhetorical styling, wise aphorisms, and grammatical mastery.",
      category: "Wisdom",
      audioUrl: "https://example.com/audio/unwan_hikam.mp3",
      arabicText: [
        "أَحْسِنْ إِلَى النَّاسِ تَسْتَعْبِدْ قُلُوبَهُمُ ... فَطَالَمَا اسْتَعْبَدَ الإِنْسَانَ إِحْسَانُ",
        "يَا خَادِمَ الْجِسْمِ كَمْ تَسْعَى لِخِدْمَتِهِ ... أَتَطْلُبُ الرِّبْحَ مِمَّا فِيهِ خُسْرَانُ",
        "أَقْبِلْ عَلَى النَّفْسِ وَاسْتَكْمِلْ فَضَائِلَهَا ... فَأَنْتَ بِالنَّفْسِ لا بِالْجِسْمِ إِنْسَانُ"
      ],
      translationText: [
        "Be good to people, and you will enslave their hearts... for how long has goodness enslaved a human being!",
        "O servant of the body, how much do you strive in its service... do you seek profit from that which holds loss?",
        "Turn towards the soul and complete its virtues... for you are a human by virtue of your soul, not your physical body."
      ]
    }
  ],
  announcements: [
    { id: "ann-1", title: "New Academic Term Registration Open", content: "We are pleased to announce that registrations are now open for the upcoming semester. Students can enroll into Beginner level, Intermediate, or Advanced level tracks.", date: "2026-07-06T10:00:00Z", targetRole: "all", author: "Administration" },
    { id: "ann-2", title: "Weekly Live Webinar on Tajweed Articulation Points", content: "Shaykh Ahmed Al-Misri will hold a live recitation and feedback session this Friday after Asr prayer. Attendance is mandatory for Beginner students.", date: "2026-07-07T14:00:00Z", targetRole: "student", author: "Shaykh Ahmed" }
  ],
  discussions: [],
  directMessages: [],
  calendar: [
    { id: "cal-1", title: "Week 1-2 Syllabus", description: "Watch Video 1, 2, 3 & 4 + Submit Week 1-2 Assignments.", date: "2026-07-10", type: "lecture" },
    { id: "cal-2", title: "Week 3-4 Syllabus", description: "Watch Video 5, 6, 7 & 8 + Submit Week 3-4 Assignments.", date: "2026-07-24", type: "lecture" },
    { id: "cal-3", title: "Week 5-6 Syllabus", description: "Watch Video 9, 10, 11 & 12 + Submit Week 5-6 Assignments.", date: "2026-08-07", type: "lecture" },
    { id: "cal-4", title: "Week 7-8 Syllabus", description: "Watch Video 13, 14, 15 & 16 + Submit Week 7-8 Assignments.", date: "2026-08-21", type: "lecture" },
    { id: "cal-5", title: "Week 8 CBT Test (5 Marks)", description: "Complete the online Computer Based Test on previous lessons.", date: "2026-08-28", type: "exam" },
    { id: "cal-6", title: "Week 9-10 Syllabus", description: "Watch Video 17, 18, 19 & 20 + Submit Week 9-10 Assignments.", date: "2026-09-04", type: "lecture" },
    { id: "cal-7", title: "Week 11 Oral Test (5 Marks)", description: "Schedule and complete live oral testing session with teacher.", date: "2026-09-18", type: "exam" },
    { id: "cal-8", title: "Week 12 Semester Revision", description: "In-class and homework review of entire Semester 1 syllabus.", date: "2026-10-02", type: "holiday" },
    { id: "cal-9", title: "Week 13 Final Exam (20 Marks)", description: "Comprehensive online and written final evaluation for Semester 1.", date: "2026-10-09", type: "exam" }
  ],
  testimonials: [
    { id: "t-1", name: "Ibrahim Cole", role: "Adult Student (USA)", content: "Learning Arabic was always a hurdle for me. Abu Qoonitah Academy's structured methodology and direct focus on classical Matns like Al-Ajurrumiyyah broke it down beautifully.", rating: 5 },
    { id: "t-2", name: "Aishah bint Haroon", role: "Parent (London, UK)", content: "My two children attend the online daily Quran classes. The level of patience and Tajweed precision the teachers demonstrate is unmatched. I can track their attendance and quiz scores daily.", rating: 5 },
    { id: "t-3", name: "Dr. Tariq Mahmood", role: "Islamic Studies Professor", content: "This LMS provides the true spiritual essence of a traditional digital Madrasah with the rigorous learning metrics of a world-class university.", rating: 5 }
  ],
  settings: {
    prayerTimes: { Fajr: "05:11 AM", Dhuhr: "12:48 PM", Asr: "04:12 PM", Maghrib: "07:02 PM", Isha: "08:18 PM" },
    hijriAdjustment: 1447, // Current Year
    quoteOfTheDay: {
      arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
      translation: "Whoever takes a path upon which he seeks knowledge, Allah will make easy for him a path to Paradise.",
      source: "Sahih Muslim 2699"
    }
  },
  freeCourse: {
    title: "Laamiyyatu Ibn Taimiyyah",
    description: "The classical creed poem (Aqeedah) composed by Sheikh-ul-Islam Ibn Taimiyyah, presenting authentic Islamic beliefs regarding the Companions, the Divine Attributes, and the Quran in elegant rhyme.",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    poemArabicText: [
      "يَا سَائِلِي عَنْ مَذْهَبِي وَعَقِيدَتِي ... رُزِقَ الْهُدَى مَنْ لِلْهِدَايَةِ يَسْأَلُ",
      "اسْمَعْ كَلَامَ مُحَقِّقٍ فِي قَوْلِهِ ... لَا يَنْثَنِي عَنْهُ وَلَا يَتَبَدَّلُ",
      "حُبُّ الصَّحَابَةِ كُلِّهِمْ لِي مَذْهَبٌ ... وَمَوَدَّةٌ أَرْجُو بِهَا أَتَوَسَّلُ"
    ],
    poemTranslationText: [
      "O seeker inquiring about my creed and school of thought... Guided is the one who asks for guidance!",
      "Hear the words of a verifier in his speech... One who never wavers nor changes his stance.",
      "Loving all of the Companions is my path... And a devotion through which I seek a means of near-ness (to Allah)."
    ],
    audioFiles: [
      { id: "audio-laamiyyah-1", title: "Complete Recitation (Acoustic)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", description: "Beautiful classical melodic recitation of the complete 16 verses of Laamiyyatu Ibn Taimiyyah." }
    ]
  },
  aboutUs: {
    historyEn: "Abu Qoonitah Islamic Academy started as a focused public initiative to teach basic Tajweed and Arabic to non-native speakers. It rapidly blossomed into a comprehensive digital Madrasah serving thousands of students across the globe with structured modules, daily assignments, and direct teacher oversight.",
    historyAr: "انطلقت أكاديمية أبو قانتة الإسلامية كمبادرة لتعليم مبادئ التجويد واللغة العربية للناطقين بغيرها، ثم سرعان ما تطورت لتصبح صرحًا تعليميًا إسلاميًا متكاملاً يخدم آلاف الطلاب من مختلف دول العالم عبر الفصول الافتراضية الممنهجة واللقاءات الحية المتكررة.",
    founderBioEn: "Ustadh Abu Qoonitah is a seasoned instructor specializing in classical Arabic grammar (Nahw/Sarf) and Quran recitation. He has spent years breaking down dense texts like 'Al-Ajurrumiyyah' and establishing phonetic clarity for students around the world, aiming to re-connect Muslims directly with the language of Revelation.",
    founderBioAr: "الأستاذ أبو قانتة متخصص في تدريس النحو والصرف، ومجاز برواية حفص عن عاصم، كرس سنوات عديدة في تبسيط متون النحو كـ'الآجرومية' وتيسير مخارج الحروف للطلاب غير الناطقين بلسان عربي مبين، هادفًا لربط الأمة بلغة وحي رب العالمين.",
    values: [
      { titleEn: "Sincerity (Ikhlas)", titleAr: "الإخلاص", descEn: "All learning and service are dedicated purely for the cause of Allah.", descAr: "أن يكون العمل خالصًا لوجه الله الكريم ونفع المسلمين." },
      { titleEn: "Authenticity (Asalah)", titleAr: "الأصالة الشرعية", descEn: "Knowledge grounded in Quran and Sunnah, following the righteous predecessors.", descAr: "تأصيل المعارف الشرعية بالاعتماد على الكتاب والسنة الصحيحة." },
      { titleEn: "Academic Excellence", titleAr: "التميز الأكاديمي", descEn: "Utilizing modern educational pedagogy to deliver high comprehension rates.", descAr: "اتباع أفضل المناهج والوسائل الحديثة لتسهيل الفهم والحفظ." },
      { titleEn: "Moral Character (Adab)", titleAr: "الأدب والأخلاق", descEn: "Nurturing students in high ethical conduct alongside academic proficiency.", descAr: "تربية النفوس على مكارم الأخلاق والسمت الإسلامي القويم." }
    ],
    faqs: [
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
    ]
  },
  sermons: [
    { id: "serm-1", title: "Developing Sincerity (Ikhlas) in Seeking Knowledge", category: "Motivational talks", duration: "45:10", url: "https://www.youtube.com/embed/vT4r_2bI-0Q", speaker: "Ustadh Abu Qoonitah" },
    { id: "serm-2", title: "A Journey Through the Biography of Imam Nawawi", category: "Hadith", duration: "55:30", url: "https://www.youtube.com/embed/8I869l_5mYg", speaker: "Shaykh Ahmed Al-Misri" },
    { id: "serm-3", title: "The Virtues of Ramadan & Laylatul Qadr", category: "Ramadan", duration: "38:45", url: "https://www.youtube.com/embed/jZ_E3O9nK8A", speaker: "Ustadh Abu Qoonitah" },
    { id: "serm-4", title: "Friday Khutbah: Keeping the Tongue Moist with Dhikr", category: "Khutbah", duration: "25:12", url: "https://www.youtube.com/embed/vT4r_2bI-0Q", speaker: "Shaykh Ahmed Al-Misri" },
    { id: "serm-5", title: "Explaining Surah Al-Kahf Tafsir", category: "Tafsir", duration: "1:15:20", url: "https://www.youtube.com/embed/8I869l_5mYg", speaker: "Shaykh Ahmed Al-Misri" },
    {
      id: "serm-quran-minshawi-fatiha",
      title: "Surah Al-Fatiha (The Opening) Recitation",
      category: "Quran Recitation",
      duration: "02:15",
      url: "https://server11.mp3quran.net/minsh/001.mp3",
      speaker: "Qari Muhammad Siddiq Al-Minshawi",
      coverUrl: "https://images.unsplash.com/photo-1609599006353-e629f1d40e4a?w=400",
      isAudio: true
    },
    {
      id: "serm-quran-minshawi-ikhlas",
      title: "Surah Al-Ikhlas (The Sincerity) Recitation",
      category: "Quran Recitation",
      duration: "00:45",
      url: "https://server11.mp3quran.net/minsh/112.mp3",
      speaker: "Qari Muhammad Siddiq Al-Minshawi",
      coverUrl: "https://images.unsplash.com/photo-1609599006353-e629f1d40e4a?w=400",
      isAudio: true
    },
    {
      id: "serm-quran-husary-fatiha",
      title: "Surah Al-Fatiha (The Opening) Recitation",
      category: "Quran Recitation",
      duration: "02:30",
      url: "https://server13.mp3quran.net/husr/001.mp3",
      speaker: "Qari Mahmoud Khalil Al-Husary",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      isAudio: true
    },
    {
      id: "serm-quran-husary-maun",
      title: "Surah Al-Ma'un (The Small Kindnesses) Recitation",
      category: "Quran Recitation",
      duration: "01:10",
      url: "https://server13.mp3quran.net/husr/107.mp3",
      speaker: "Qari Mahmoud Khalil Al-Husary",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      isAudio: true
    }
  ],
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
  donationSettings: {
    targetTitle: "Expand Islamic Digital Infrastructure & Sponsor Seeking Students",
    targetDescription: "Support Abu Qoonitah Islamic Academy in acquiring server storage, broadcasting licenses, and direct sponsorships for needy students of classical knowledge.",
    targetAmount: 5000000,
    raisedAmount: 450000,
    accountNumber: "8122455759",
    accountName: "Ishaq Ridwanullah Babatunde",
    bank: "Opay"
  }
};

// Database state
let db: DatabaseSchema = initialDB;

// Load DB from file if exists, else write the initial seed
function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      db = JSON.parse(raw);
      // Ensure plainPasswords exist for default users if missing
      let modified = false;
      if (!db.freeCourse) {
        db.freeCourse = initialDB.freeCourse;
        modified = true;
      }
      if (!db.aboutUs) {
        db.aboutUs = initialDB.aboutUs;
        modified = true;
      }
      if (!db.sermons) {
        db.sermons = initialDB.sermons;
        modified = true;
      }
      if (!db.curriculum) {
        db.curriculum = initialDB.curriculum;
        modified = true;
      }
      if (!db.donationSettings) {
        db.donationSettings = initialDB.donationSettings;
        modified = true;
      }
      if (db.users["user-admin"] && !db.users["user-admin"].plainPassword) {
        db.users["user-admin"].plainPassword = "Ridwanullah@1234";
        modified = true;
      }
      if (db.users["user-teacher"] && !db.users["user-teacher"].plainPassword) {
        db.users["user-teacher"].plainPassword = "Teacher@123";
        modified = true;
      }
      if (db.users["user-student"] && !db.users["user-student"].plainPassword) {
        db.users["user-student"].plainPassword = "Student@123";
        modified = true;
      }
      if (db.users["user-locked"] && !db.users["user-locked"].plainPassword) {
        db.users["user-locked"].plainPassword = "Student@123";
        modified = true;
      }
      if (modified) {
        saveDatabase();
      }
    } else {
      // Seed default accounts
      const saltAdmin = generateSalt();
      const saltTeacher = generateSalt();
      const saltStudent = generateSalt();
      const saltLocked = generateSalt();

      db.users = {
        "user-admin": {
          id: "user-admin",
          username: "Ridwanullahi",
          name: "Ustadh Abu Qoonitah",
          email: "admin@abuqoonitah.academy",
          role: "admin",
          enrolledCourses: [],
          progress: {},
          attendance: {},
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword("Ridwanullah@1234", saltAdmin),
          salt: saltAdmin,
          plainPassword: "Ridwanullah@1234"
        },
        "user-teacher": {
          id: "user-teacher",
          username: "Teacher",
          name: "Shaykh Ahmed Al-Misri",
          email: "ahmed.misri@abuqoonitah.academy",
          role: "teacher",
          enrolledCourses: ["course-beg-1", "course-beg-2", "course-free-1"],
          progress: {},
          attendance: {},
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword("Teacher@123", saltTeacher),
          salt: saltTeacher,
          plainPassword: "Teacher@123"
        },
        "user-student": {
          id: "user-student",
          username: "Student",
          name: "Zayd Mansoor",
          email: "zayd@gmail.com",
          role: "student",
          level: "beginner",
          isPaid: true,
          enrolledCourses: ["course-beg-1", "course-free-1"],
          progress: { "course-beg-1": 33, "course-free-1": 100 },
          attendance: {
            "course-beg-1": [
              { date: "2026-07-01", status: "present" },
              { date: "2026-07-03", status: "present" },
              { date: "2026-07-05", status: "absent" }
            ]
          },
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword("Student@123", saltStudent),
          salt: saltStudent,
          plainPassword: "Student@123"
        },
        "user-locked": {
          id: "user-locked",
          username: "LockedStudent",
          name: "Sumayyah Farooq",
          email: "sumayyah@gmail.com",
          role: "student",
          level: "intermediate",
          isPaid: false,
          enrolledCourses: ["course-int-1"],
          progress: {},
          attendance: {},
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword("Student@123", saltLocked),
          salt: saltLocked,
          plainPassword: "Student@123"
        }
      };

      saveDatabase();
    }
  } catch (error) {
    console.error("Error reading database:", error);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    // Backup to Supabase
    saveToSupabase(db);
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

// Load DB immediately
loadDatabase();

// Temporary Session token cache mapping token -> userId
const sessions: Record<string, string> = {};

// Express Middleware to verify authentication
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
  if (!token || !sessions[token]) {
    res.status(401).json({ error: "Unauthorized access. Please login." });
    return;
  }
  (req as any).userId = sessions[token];
  next();
}

// --- DIRECT FILE UPLOADS SYSTEM ---
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve /uploads statically
app.use("/uploads", express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB maximum upload limit
  }
});

app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file was uploaded." });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl: fileUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

// --- API ENDPOINTS ---

// Free Course (Laamiyyatu Ibn Taimiyyah) API
app.get("/api/public/free-course", (req, res) => {
  res.json(db.freeCourse || (initialDB as any).freeCourse);
});

app.post("/api/admin/free-course", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }

  const { title, description, imageUrl, poemArabicText, poemTranslationText, audioFiles } = req.body;
  
  db.freeCourse = {
    title: title || db.freeCourse.title,
    description: description || db.freeCourse.description,
    imageUrl: imageUrl || db.freeCourse.imageUrl,
    poemArabicText: poemArabicText || db.freeCourse.poemArabicText,
    poemTranslationText: poemTranslationText || db.freeCourse.poemTranslationText,
    audioFiles: audioFiles || db.freeCourse.audioFiles
  };

  saveDatabase();
  res.json({ success: true, freeCourse: db.freeCourse });
});

// GET /api/admin/free-course/enrollments
app.get("/api/admin/free-course/enrollments", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  const enrollments = (db as any).freeCourseEnrollments || [];
  res.json(enrollments);
});

// DELETE /api/admin/free-course/enrollments/:id
app.delete("/api/admin/free-course/enrollments/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  const targetId = req.params.id;
  const enrollments = (db as any).freeCourseEnrollments || [];
  const filtered = enrollments.filter((e: any) => e.id !== targetId);
  (db as any).freeCourseEnrollments = filtered;
  saveDatabase();
  res.json({ success: true, message: "Free course enrollment deleted." });
});

// POST /api/public/free-course/register
app.post("/api/public/free-course/register", (req, res) => {
  const { name, whatsapp } = req.body;
  if (!name || !whatsapp) {
    res.status(400).json({ error: "Name and WhatsApp number are required." });
    return;
  }

  if (!(db as any).freeCourseEnrollments) {
    (db as any).freeCourseEnrollments = [];
  }

  // Check if already registered
  let student = (db as any).freeCourseEnrollments.find((e: any) => e.whatsapp === whatsapp);
  if (!student) {
    student = {
      id: "fc-" + Math.random().toString(36).substr(2, 9),
      name,
      whatsapp,
      progress: 0,
      completedAudios: [],
      examScore: null,
      completed: false,
      joinedAt: new Date().toISOString()
    };
    (db as any).freeCourseEnrollments.push(student);
    saveDatabase();
  }

  res.json({ success: true, student });
});

// POST /api/public/free-course/progress
app.post("/api/public/free-course/progress", (req, res) => {
  const { id, completedAudios } = req.body;
  if (!id) {
    res.status(400).json({ error: "Student ID is required." });
    return;
  }

  const enrollments = (db as any).freeCourseEnrollments || [];
  const student = enrollments.find((e: any) => e.id === id);
  if (!student) {
    res.status(404).json({ error: "Student registration not found." });
    return;
  }

  student.completedAudios = completedAudios || [];
  
  // Calculate progress percentage
  const totalAudios = db.freeCourse && db.freeCourse.audioFiles ? db.freeCourse.audioFiles.length : 1;
  student.progress = Math.min(100, Math.round((student.completedAudios.length / (totalAudios || 1)) * 100));
  
  saveDatabase();
  res.json({ success: true, student });
});

// POST /api/public/free-course/submit-exam
app.post("/api/public/free-course/submit-exam", (req, res) => {
  const { id, score } = req.body;
  if (!id) {
    res.status(400).json({ error: "Student ID is required." });
    return;
  }

  const enrollments = (db as any).freeCourseEnrollments || [];
  const student = enrollments.find((e: any) => e.id === id);
  if (!student) {
    res.status(404).json({ error: "Student registration not found." });
    return;
  }

  student.examScore = score;
  if (score >= 4) { // 4 out of 5 is a pass
    student.completed = true;
    student.progress = 100;
  }

  saveDatabase();
  res.json({ success: true, student });
});

// Admin: About Us & FAQ Settings
app.post("/api/admin/about", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  const { historyEn, historyAr, founderBioEn, founderBioAr, values, faqs } = req.body;
  db.aboutUs = {
    historyEn: historyEn !== undefined ? historyEn : db.aboutUs.historyEn,
    historyAr: historyAr !== undefined ? historyAr : db.aboutUs.historyAr,
    founderBioEn: founderBioEn !== undefined ? founderBioEn : db.aboutUs.founderBioEn,
    founderBioAr: founderBioAr !== undefined ? founderBioAr : db.aboutUs.founderBioAr,
    values: values !== undefined ? values : db.aboutUs.values,
    faqs: faqs !== undefined ? faqs : db.aboutUs.faqs
  };
  saveDatabase();
  res.json({ success: true, aboutUs: db.aboutUs });
});

// Admin: Curriculum Settings
app.post("/api/admin/curriculum", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  const { whyEnroll, sections, featuredCourses } = req.body;
  db.curriculum = {
    whyEnroll: whyEnroll !== undefined ? whyEnroll : db.curriculum.whyEnroll,
    sections: sections !== undefined ? sections : db.curriculum.sections,
    featuredCourses: featuredCourses !== undefined ? featuredCourses : db.curriculum.featuredCourses
  };
  saveDatabase();
  res.json({ success: true, curriculum: db.curriculum });
});

// Admin: Register Teacher
app.post("/api/admin/register-teacher", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }

  const {
    name,
    email,
    phone,
    gender,
    profilePic,
    subjects,
    assignedClass,
    qualification,
    bio,
    username,
    password,
    confirmPassword,
  } = req.body;

  // Proper Validation
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Full Name is required." });
    return;
  }
  if (!email || !email.trim()) {
    res.status(400).json({ error: "Email Address is required." });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }
  if (!username || !username.trim()) {
    res.status(400).json({ error: "Username is required." });
    return;
  }
  if (!password || !password.trim()) {
    res.status(400).json({ error: "Password is required." });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "Password and Confirm Password do not match." });
    return;
  }

  // Prevent duplicate email/username accounts
  const cleanedUsername = username.trim().toLowerCase();
  const cleanedEmail = email.trim().toLowerCase();

  const isDuplicate = Object.values(db.users).some(u => {
    return (
      u.username.toLowerCase() === cleanedUsername ||
      (u.email && u.email.toLowerCase() === cleanedEmail)
    );
  });

  if (isDuplicate) {
    res.status(400).json({ error: "A user with this Username or Email already exists." });
    return;
  }

  // Generate unique Teacher ID
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const teacherId = `TCH-${randNum}`;

  // Generate salt and hash password
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newTeacherId = `user-teacher-${Date.now()}`;
  const newTeacher = {
    id: newTeacherId,
    teacherId: teacherId,
    username: username.trim(),
    name: name.trim(),
    email: email.trim(),
    role: "teacher" as UserRole,
    phone: phone ? phone.trim() : "",
    gender: gender || "male",
    profilePic: profilePic || "",
    subjects: subjects || "",
    assignedClass: assignedClass || "",
    qualification: qualification || "",
    bio: bio || "",
    enrolledCourses: ["course-beg-1", "course-beg-2", "course-free-1"], // defaults
    progress: {},
    attendance: {},
    createdAt: new Date().toISOString(),
    passwordHash: passwordHash,
    salt: salt,
    plainPassword: password
  };

  db.users[newTeacherId] = newTeacher;
  saveDatabase();

  res.json({
    success: true,
    message: `Teacher account ${name} successfully registered with ID: ${teacherId}`,
    teacher: {
      id: newTeacherId,
      teacherId: teacherId,
      username: username.trim(),
      name: name.trim(),
      email: email.trim(),
      role: "teacher"
    }
  });
});

// Admin: Sermon TV Settings
app.post("/api/admin/sermons", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  const { sermons } = req.body;
  if (Array.isArray(sermons)) {
    db.sermons = sermons;
    saveDatabase();
    res.json({ success: true, sermons: db.sermons });
  } else {
    res.status(400).json({ error: "Sermons must be an array." });
  }
});

// Admin: Donation Settings
app.post("/api/admin/donation-settings", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  const { targetTitle, targetDescription, targetAmount, raisedAmount, accountNumber, accountName, bank } = req.body;
  db.donationSettings = {
    targetTitle: targetTitle !== undefined ? targetTitle : db.donationSettings.targetTitle,
    targetDescription: targetDescription !== undefined ? targetDescription : db.donationSettings.targetDescription,
    targetAmount: targetAmount !== undefined ? Number(targetAmount) : db.donationSettings.targetAmount,
    raisedAmount: raisedAmount !== undefined ? Number(raisedAmount) : db.donationSettings.raisedAmount,
    accountNumber: accountNumber !== undefined ? accountNumber : db.donationSettings.accountNumber,
    accountName: accountName !== undefined ? accountName : db.donationSettings.accountName,
    bank: bank !== undefined ? bank : db.donationSettings.bank
  };
  saveDatabase();
  res.json({ success: true, donationSettings: db.donationSettings });
});

// Admin: Delete Book
app.delete("/api/admin/books/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  db.books = db.books.filter(b => b.id !== req.params.id);
  saveDatabase();
  res.json({ success: true });
});

// Admin: Delete Poem
app.delete("/api/admin/poems/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  db.poems = db.poems.filter(p => p.id !== req.params.id);
  saveDatabase();
  res.json({ success: true });
});

// Admin: Edit Book
app.put("/api/admin/books/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { title, author, category, description, coverUrl, downloadUrl } = req.body;
  const bookIndex = db.books.findIndex(b => b.id === req.params.id);
  if (bookIndex === -1) {
    res.status(404).json({ error: "Book not found." });
    return;
  }
  
  db.books[bookIndex] = {
    ...db.books[bookIndex],
    title,
    author,
    category,
    description,
    coverUrl: coverUrl || db.books[bookIndex].coverUrl,
    downloadUrl: downloadUrl || db.books[bookIndex].downloadUrl
  };
  
  saveDatabase();
  res.json({ success: true, book: db.books[bookIndex] });
});

// Admin: Edit Poem
app.put("/api/admin/poems/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { title, poetName, biography, category, arabicText, translationText, pdfUrl, coverUrl } = req.body;
  const poemIndex = db.poems.findIndex(p => p.id === req.params.id);
  if (poemIndex === -1) {
    res.status(404).json({ error: "Poem not found." });
    return;
  }
  
  db.poems[poemIndex] = {
    ...db.poems[poemIndex],
    title,
    poetName,
    biography,
    category,
    arabicText: arabicText || [],
    translationText: translationText || [],
    pdfUrl: pdfUrl || "",
    coverUrl: coverUrl || ""
  };
  
  saveDatabase();
  res.json({ success: true, poem: db.poems[poemIndex] });
});

// Public Dynamic Content Endpoints
app.get("/api/public/about", (req, res) => {
  res.json(db.aboutUs || (initialDB as any).aboutUs);
});

app.get("/api/public/curriculum", (req, res) => {
  res.json(db.curriculum || (initialDB as any).curriculum);
});

app.get("/api/public/donation-settings", (req, res) => {
  res.json(db.donationSettings || (initialDB as any).donationSettings);
});

// Public endpoints
app.get("/api/public/stats", (req, res) => {
  const students = Object.values(db.users).filter(u => u.role === "student").length;
  const teachers = Object.values(db.users).filter(u => u.role === "teacher").length;
  const courses = db.courses.length;
  res.json({
    students: students + 240, // Base stats for presentation
    teachers: teachers + 12,
    courses: courses + 4,
    countries: 42
  });
});

app.get("/api/public/quote", (req, res) => {
  res.json(db.settings.quoteOfTheDay);
});

app.get("/api/public/calendar", (req, res) => {
  res.json(db.calendar);
});

app.get("/api/public/testimonials", (req, res) => {
  res.json(db.testimonials);
});

app.get("/api/public/books", (req, res) => {
  res.json(db.books);
});

app.get("/api/public/poems", (req, res) => {
  res.json(db.poems);
});

app.get("/api/public/sermons", (req, res) => {
  res.json(db.sermons || []);
});

app.get("/api/public/announcements", (req, res) => {
  res.json(db.announcements);
});

// Authentication Routes
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  // Find user by case-insensitive username
  const userRecord = Object.values(db.users).find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!userRecord) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const calculatedHash = hashPassword(password, userRecord.salt);
  if (calculatedHash !== userRecord.passwordHash) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString("hex");
  sessions[token] = userRecord.id;

  const { passwordHash, salt, ...safeUser } = userRecord;
  res.json({ token, user: safeUser });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { identifier, whatsapp } = req.body;
  if (!identifier) {
    res.status(400).json({ error: "Username, Email, or WhatsApp is required." });
    return;
  }

  const searchVal = identifier.toLowerCase().trim();
  const userRecord = Object.values(db.users).find(u => {
    return (
      u.username.toLowerCase() === searchVal ||
      (u.email && u.email.toLowerCase() === searchVal) ||
      (u.whatsapp && u.whatsapp.replace(/\D/g, "") === searchVal.replace(/\D/g, ""))
    );
  });

  if (!userRecord) {
    res.status(404).json({ error: "No registered account found matching that Username, Email, or WhatsApp." });
    return;
  }

  // Force Admin WhatsApp directly
  if (userRecord.role === "admin") {
    userRecord.whatsapp = "08122455759";
    saveDatabase();
  } else if (whatsapp && !userRecord.whatsapp) {
    userRecord.whatsapp = whatsapp;
    saveDatabase();
  }

  const plainPassword = userRecord.plainPassword || "Contact administrator";
  const username = userRecord.username;

  res.json({
    success: true,
    user: {
      name: userRecord.name,
      username: username,
      plainPassword: plainPassword,
      whatsapp: userRecord.whatsapp || whatsapp || "",
      role: userRecord.role
    }
  });
});

app.post("/api/auth/register", (req, res) => {
  const { username, password, name, email, level, whyJoin, dob, country, state, paymentMode, receiptUrl, whatsapp } = req.body;
  if (!username || !password || !name || !email) {
    res.status(400).json({ error: "Username, password, name, and email are required." });
    return;
  }

  const exists = Object.values(db.users).some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    res.status(400).json({ error: "Username already exists." });
    return;
  }

  const userId = "user-" + crypto.randomBytes(8).toString("hex");
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser: any = {
    id: userId,
    username,
    name,
    email,
    role: "student",
    level: "beginner", // Everyone will start from beginner
    isPaid: false, // Default unpaid/locked for paid courses
    enrolledCourses: ["course-beg-1"], // Force beginners to begin on beg-1
    progress: {},
    attendance: {},
    createdAt: new Date().toISOString(),
    plainPassword: password,
    whyJoin: whyJoin || "",
    dob: dob || "",
    country: country || "",
    state: state || "",
    paymentMode: paymentMode || "",
    receiptUrl: receiptUrl || "",
    whatsapp: whatsapp || ""
  };

  db.users[userId] = { ...newUser, passwordHash, salt };
  saveDatabase();

  // Generate session token automatically
  const token = crypto.randomBytes(32).toString("hex");
  sessions[token] = userId;

  res.json({ token, user: newUser });
});

// Change Password/Credentials (Admin/User security settings)
app.post("/api/auth/change-credentials", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const { oldPassword, newPassword, newUsername } = req.body;

  const userRecord = db.users[userId];
  if (!userRecord) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (oldPassword) {
    const hash = hashPassword(oldPassword, userRecord.salt);
    if (hash !== userRecord.passwordHash) {
      res.status(400).json({ error: "Incorrect old password." });
      return;
    }
  }

  if (newUsername) {
    const exists = Object.values(db.users).some(u => u.id !== userId && u.username.toLowerCase() === newUsername.toLowerCase());
    if (exists) {
      res.status(400).json({ error: "Username already taken." });
      return;
    }
    userRecord.username = newUsername;
  }

  if (newPassword) {
    const salt = generateSalt();
    userRecord.salt = salt;
    userRecord.passwordHash = hashPassword(newPassword, salt);
    userRecord.plainPassword = newPassword;
  }

  db.users[userId] = userRecord;
  saveDatabase();

  res.json({ success: true, message: "Credentials updated successfully." });
});

// Get currently logged-in user profile
app.get("/api/auth/me", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const userRecord = db.users[userId];
  if (!userRecord) {
    res.status(404).json({ error: "User session expired or not found." });
    return;
  }
  const { passwordHash, salt, ...safeUser } = userRecord;
  res.json(safeUser);
});

// Course endpoints
app.get("/api/courses", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Filter based on user profile and permissions
  // Free courses are always accessible
  // Admin and Teachers can access all courses
  // Students access all, but can only see paid content of their specific level if isPaid is true
  res.json(db.courses);
});

app.post("/api/courses/enroll", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const { courseId } = req.body;
  const user = db.users[userId];
  const course = db.courses.find(c => c.id === courseId);

  if (!user || !course) {
    res.status(404).json({ error: "User or Course not found" });
    return;
  }

  if (user.enrolledCourses.includes(courseId)) {
    res.status(400).json({ error: "Already enrolled in this course." });
    return;
  }

  // Locked check
  if (course.level !== "free" && !user.isPaid && user.role === "student") {
    res.status(403).json({ error: "Your access is locked. Please verify payment or contact administrator." });
    return;
  }

  user.enrolledCourses.push(courseId);
  if (user.progress[courseId] === undefined) {
    user.progress[courseId] = 0;
  }

  course.enrolledStudentsCount = (course.enrolledStudentsCount || 0) + 1;
  db.users[userId] = user as any; // update
  saveDatabase();

  const { passwordHash, salt, ...safeUser } = db.users[userId];
  res.json({ success: true, user: safeUser });
});

// Submissions (Assignments/Quizzes/Exams)
app.post("/api/submissions/submit", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { courseId, type, referenceId, referenceTitle, submissionContent, maxPoints } = req.body;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const submissionId = "sub-" + crypto.randomBytes(8).toString("hex");

  // Auto-grading for Quizzes
  let score: number | undefined = undefined;
  let status: "pending" | "graded" = "pending";

  if (type === "quiz") {
    // Attempt auto-grading
    const course = db.courses.find(c => c.id === courseId);
    const quiz = course?.quizzes.find(q => q.id === referenceId);
    if (quiz) {
      try {
        const studentAnswers = JSON.parse(submissionContent) as Record<string, number>;
        let correctCount = 0;
        let answeredCount = 0;
        quiz.questions.forEach((q) => {
          if (studentAnswers[q.id] !== undefined) {
            answeredCount++;
            if (studentAnswers[q.id] === q.correctAnswerIndex) {
              correctCount++;
            }
          }
        });
        const totalQuestions = answeredCount || quiz.questions.length || 1;
        score = Math.round((correctCount / totalQuestions) * maxPoints);
        
        // If automatic marking is enabled (defaulting to true), set status as graded
        if (quiz.automaticMarking !== false) {
          status = "graded";
        } else {
          status = "pending";
        }
      } catch (e) {
        // Fallback if formatting was custom
      }
    }
  } else if (type === "assignment") {
    // If it's a rich worksheet submission (with photos/audio/typed answers) or the assignment has points > 1,
    // let it be "pending" for manual grading! Otherwise, system auto-mark.
    const course = db.courses.find(c => c.id === courseId);
    const assignment = course?.assignments.find(a => a.id === referenceId);
    const hasRichAttachments = submissionContent && (submissionContent.includes('"photos"') || submissionContent.includes('"audio"'));

    if (hasRichAttachments || (assignment && assignment.points > 1)) {
      status = "pending";
      score = undefined;
    } else {
      score = 1;
      status = "graded";
    }
  }

  const newSubmission: Submission = {
    id: submissionId,
    studentId: userId,
    studentName: user.name,
    courseId,
    courseTitle: db.courses.find(c => c.id === courseId)?.title || "Unknown Course",
    type,
    referenceId,
    referenceTitle,
    submissionContent,
    submittedAt: new Date().toISOString(),
    score,
    maxPoints: type === "assignment" ? (status === "graded" ? 1 : (maxPoints || 100)) : maxPoints,
    status,
    gradedBy: type === "quiz" ? "Auto Grader" : (type === "assignment" && status === "graded" ? "System Auto-Mark" : undefined),
    gradedAt: (type === "quiz" || (type === "assignment" && status === "graded")) ? new Date().toISOString() : undefined
  };

  db.submissions.push(newSubmission);

  // Update student progress percentage loosely on submission
  if (user.progress[courseId] !== undefined) {
    user.progress[courseId] = Math.min(100, (user.progress[courseId] || 0) + 20);
  }

  saveDatabase();
  res.json({ success: true, submission: newSubmission });
});

// Get submissions (teachers see all, students see own)
app.get("/api/submissions", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === "admin" || user.role === "teacher") {
    res.json(db.submissions);
  } else {
    res.json(db.submissions.filter(s => s.studentId === userId));
  }
});

// Teacher: Grade submission
app.post("/api/submissions/:id/grade", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { score, comments } = req.body;
  const submissionId = req.params.id;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied. Teacher or Admin privileges required." });
    return;
  }

  const submission = db.submissions.find(s => s.id === submissionId);
  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  submission.score = Number(score);
  submission.comments = comments;
  submission.status = "graded";
  submission.gradedBy = user.name;
  submission.gradedAt = new Date().toISOString();

  // If final exam, issue 100% progress
  if (submission.referenceId === "final-exam" && submission.score >= submission.maxPoints * 0.5) {
    const studentUser = db.users[submission.studentId];
    if (studentUser) {
      studentUser.progress[submission.courseId] = 100;
    }
  }

  // If payment, automatically mark student user as Paid/Unlocked
  if (submission.type === "payment") {
    const studentUser = db.users[submission.studentId];
    if (studentUser) {
      studentUser.isPaid = true;
    }
  }

  saveDatabase();
  res.json({ success: true, submission });
});

// Teacher/Admin: Delete submission (Reset so student can re-take)
app.delete("/api/submissions/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const submissionId = req.params.id;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied. Teacher or Admin privileges required." });
    return;
  }

  const index = db.submissions.findIndex(s => s.id === submissionId);
  if (index === -1) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const deleted = db.submissions.splice(index, 1)[0];
  saveDatabase();
  res.json({ success: true, deletedId: submissionId, studentName: deleted.studentName });
});

// Teacher/Admin: Log manual/custom grade
app.post("/api/submissions/manual", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { studentName, courseId, type, referenceTitle, score, maxPoints, comments } = req.body;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied. Teacher or Admin privileges required." });
    return;
  }

  // Find the student by name to get studentId
  let targetStudentId = "";
  const foundStudent = Object.entries(db.users).find(([id, u]) => u.name === studentName);
  if (foundStudent) {
    targetStudentId = foundStudent[0];
  } else {
    // Generate a secure pseudo-id for offline / manual students if not found
    targetStudentId = "student-manual-" + crypto.randomBytes(4).toString("hex");
  }

  const courseTitle = db.courses.find(c => c.id === courseId)?.title || "Custom Logged Syllabus";

  const newSubmission: Submission = {
    id: "sub-manual-" + crypto.randomBytes(8).toString("hex"),
    studentId: targetStudentId,
    studentName,
    courseId,
    courseTitle,
    type,
    referenceId: "manual-" + crypto.randomBytes(4).toString("hex"),
    referenceTitle,
    submissionContent: "[Manually Logged Grade by Teacher/Admin]",
    submittedAt: new Date().toISOString(),
    score: Number(score) || 0,
    maxPoints: Number(maxPoints) || 10,
    status: "graded",
    gradedBy: user.name,
    gradedAt: new Date().toISOString(),
    comments: comments || "Well done"
  };

  db.submissions.push(newSubmission);
  saveDatabase();
  res.json({ success: true, submission: newSubmission });
});

// Donations Management
app.post("/api/donations/submit", (req, res) => {
  const { donorName, amount, category, type, message } = req.body;
  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Invalid donation amount." });
    return;
  }

  const newDonation: Donation = {
    id: "don-" + crypto.randomBytes(8).toString("hex"),
    donorName: donorName || "An anonymous donor",
    amount: Number(amount),
    category: category || "general",
    type: type || "one-time",
    message: message || "May Allah accept.",
    date: new Date().toISOString(),
    status: "completed"
  };

  db.donations.push(newDonation);
  saveDatabase();
  res.json({ success: true, donation: newDonation });
});

app.get("/api/donations", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admin role required." });
    return;
  }
  res.json(db.donations);
});

// Discussion Forum messages
app.get("/api/discussions/:courseId", authenticate, (req, res) => {
  const { courseId } = req.params;
  res.json(db.discussions.filter(d => d.courseId === courseId));
});

app.post("/api/discussions/post", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { courseId, content } = req.body;

  if (!user || !content) {
    res.status(400).json({ error: "Content is required." });
    return;
  }

  const newPost: DiscussionMessage = {
    id: "disc-" + crypto.randomBytes(8).toString("hex"),
    courseId,
    senderId: userId,
    senderName: user.name,
    senderRole: user.role,
    content,
    timestamp: new Date().toISOString()
  };

  db.discussions.push(newPost);
  saveDatabase();
  res.json(newPost);
});

// Direct Messaging
app.get("/api/messages/history", authenticate, (req, res) => {
  const userId = (req as any).userId;
  res.json(db.directMessages.filter(m => m.senderId === userId || m.receiverId === userId));
});

app.get("/api/messages/contacts", authenticate, (req, res) => {
  // Return list of available contacts to message
  const contacts = Object.values(db.users).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role
  }));
  res.json(contacts);
});

app.post("/api/messages/send", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const sender = db.users[userId];
  const { receiverId, content } = req.body;

  const receiver = db.users[receiverId];
  if (!sender || !receiver || !content) {
    res.status(400).json({ error: "Receiver or Content missing." });
    return;
  }

  const newMessage: DirectMessage = {
    id: "msg-" + crypto.randomBytes(8).toString("hex"),
    senderId: userId,
    senderName: sender.name,
    receiverId,
    receiverName: receiver.name,
    content,
    timestamp: new Date().toISOString()
  };

  db.directMessages.push(newMessage);
  saveDatabase();
  res.json(newMessage);
});

// --- ADMIN / TEACHER DASHBOARD MANAGEMENT ENDPOINTS ---

// Admin: Get all students
app.get("/api/admin/students", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const students = Object.values(db.users)
    .filter(u => u.role === "student")
    .map(({ passwordHash, salt, ...safe }) => safe);
  res.json(students);
});

// Admin: Get all teachers
app.get("/api/admin/teachers", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const teachers = Object.values(db.users)
    .filter(u => u.role === "teacher")
    .map(({ passwordHash, salt, ...safe }) => safe);
  res.json(teachers);
});

// Admin/Teacher: Get admission list (students and teachers with plain-text credentials)
app.get("/api/admin/admission-list", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const list = Object.values(db.users)
    .filter(u => u.role === "student" || u.role === "teacher")
    .map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      level: u.level,
      plainPassword: u.plainPassword || (u.role === "teacher" ? "Teacher@123" : "Student@123")
    }));
  res.json(list);
});

// Admin: Delete student or teacher profile
app.delete("/api/admin/profiles/:id", authenticate, (req, res) => {
  const adminId = (req as any).userId;
  const admin = db.users[adminId];
  const targetId = req.params.id;

  if (!admin || admin.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }

  const targetUser = db.users[targetId];
  if (!targetUser) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (targetId === adminId) {
    res.status(400).json({ error: "You cannot delete your own admin account." });
    return;
  }

  delete db.users[targetId];
  saveDatabase();

  res.json({ success: true, message: `Profile of ${targetUser.name} has been deleted.` });
});

// Admin: Lock/Unlock paid student
app.post("/api/admin/students/:id/payment", authenticate, (req, res) => {
  const adminId = (req as any).userId;
  const admin = db.users[adminId];
  const studentId = req.params.id;
  const { isPaid } = req.body;

  if (!admin || admin.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const student = db.users[studentId];
  if (!student) {
    res.status(404).json({ error: "Student not found." });
    return;
  }

  student.isPaid = Boolean(isPaid);
  db.users[studentId] = student;
  saveDatabase();

  res.json({ success: true, student });
});

// Admin: Create student account manually
app.post("/api/admin/students/create", authenticate, (req, res) => {
  const adminId = (req as any).userId;
  const admin = db.users[adminId];
  if (!admin || (admin.role !== "admin" && admin.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const { username, password, name, email, level, isPaid } = req.body;
  if (!username || !password || !name || !email) {
    res.status(400).json({ error: "Username, password, name, and email are required." });
    return;
  }

  const exists = Object.values(db.users).some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    res.status(400).json({ error: "Username already exists." });
    return;
  }

  const userId = "user-" + crypto.randomBytes(8).toString("hex");
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser: any = {
    id: userId,
    username,
    name,
    email,
    role: "student",
    level: level || "beginner",
    isPaid: isPaid !== undefined ? Boolean(isPaid) : false,
    enrolledCourses: level === "beginner" ? ["course-beg-1"] : (level === "intermediate" ? ["course-int-1"] : []),
    progress: {},
    attendance: {},
    createdAt: new Date().toISOString(),
    plainPassword: password
  };

  db.users[userId] = { ...newUser, passwordHash, salt };
  saveDatabase();

  res.json({ success: true, student: newUser });
});

// Admin: Update student account details and credentials
app.post("/api/admin/students/:id/update-credentials", authenticate, (req, res) => {
  const adminId = (req as any).userId;
  const admin = db.users[adminId];
  if (!admin || (admin.role !== "admin" && admin.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const studentId = req.params.id;
  const student = db.users[studentId];
  if (!student || student.role !== "student") {
    res.status(404).json({ error: "Student not found." });
    return;
  }

  const { username, password, name, email, level } = req.body;

  if (username && username !== student.username) {
    const exists = Object.values(db.users).some(u => u.id !== studentId && u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      res.status(400).json({ error: "Username already exists." });
      return;
    }
    student.username = username;
  }

  if (password) {
    const salt = generateSalt();
    student.salt = salt;
    student.passwordHash = hashPassword(password, salt);
    student.plainPassword = password;
  }

  if (name) student.name = name;
  if (email) student.email = email;
  if (level) student.level = level;

  db.users[studentId] = student;
  saveDatabase();

  const { passwordHash, salt: s, ...safeStudent } = student;
  res.json({ success: true, student: safeStudent });
});

// Teacher/Admin: Log attendance for student
app.post("/api/admin/attendance", authenticate, (req, res) => {
  const teacherId = (req as any).userId;
  const teacher = db.users[teacherId];
  const { studentId, courseId, date, status } = req.body;

  if (!teacher || (teacher.role !== "admin" && teacher.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const student = db.users[studentId];
  if (!student) {
    res.status(404).json({ error: "Student not found." });
    return;
  }

  if (!student.attendance[courseId]) {
    student.attendance[courseId] = [];
  }

  // Remove existing for same date
  student.attendance[courseId] = student.attendance[courseId].filter(a => a.date !== date);
  student.attendance[courseId].push({ date, status });

  db.users[studentId] = student;
  saveDatabase();

  res.json({ success: true, attendance: student.attendance[courseId] });
});

// Admin/Teacher: Create Course
app.post("/api/admin/courses/create", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { level, title, description, duration, teacherName, objectives } = req.body;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const newCourse: Course = {
    id: "course-" + crypto.randomBytes(8).toString("hex"),
    level: level || "free",
    title,
    description,
    duration: duration || "8 Weeks",
    teacherName: teacherName || user.name,
    objectives: objectives || [],
    videos: [],
    pdfs: [],
    assignments: [],
    quizzes: [],
    enrolledStudentsCount: 0
  };

  db.courses.push(newCourse);
  saveDatabase();

  res.json({ success: true, course: newCourse });
});

// Admin/Teacher: Add Lecture/Material
app.post("/api/admin/courses/:id/materials", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const courseId = req.params.id;
  const { type, title, url, description, duration, fileSize, audioUrl, photos } = req.body;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (type === "video") {
    course.videos.push({
      id: "vid-" + crypto.randomBytes(6).toString("hex"),
      title,
      url: url || "",
      description,
      duration: duration || (audioUrl ? "Audio Lecture" : "10:00"),
      audioUrl,
      photos
    });
  } else if (type === "pdf") {
    course.pdfs.push({
      id: "pdf-" + crypto.randomBytes(6).toString("hex"),
      title,
      url: url || "#",
      description,
      fileSize: fileSize || "1.5 MB"
    });
  } else if (type === "assignment") {
    course.assignments.push({
      id: "assign-" + crypto.randomBytes(6).toString("hex"),
      title,
      description,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0], // 7 days from now
      points: Number(duration) || 50
    });
  }

  saveDatabase();
  res.json({ success: true, course });
});

// Admin/Teacher: Create CBT Quiz
app.post("/api/admin/courses/:id/quizzes", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const courseId = req.params.id;
  const { title, durationMinutes, questions, limitQuestions, automaticMarking, examDate } = req.body;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const newQuiz = {
    id: "quiz-" + crypto.randomBytes(6).toString("hex"),
    title: title || "New CBT Exam",
    durationMinutes: Number(durationMinutes) || 10,
    questions: Array.isArray(questions) ? questions : [],
    limitQuestions: limitQuestions !== undefined && limitQuestions !== null ? Number(limitQuestions) : null,
    automaticMarking: automaticMarking !== false,
    examDate: examDate || null
  };

  if (!course.quizzes) {
    course.quizzes = [];
  }
  course.quizzes.push(newQuiz);

  saveDatabase();
  res.json({ success: true, course, quiz: newQuiz });
});

// Admin/Teacher: Update CBT Quiz
app.put("/api/admin/courses/:courseId/quizzes/:quizId", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { courseId, quizId } = req.params;
  const { title, durationMinutes, questions, limitQuestions, automaticMarking, examDate } = req.body;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const quiz = course.quizzes?.find(q => q.id === quizId) as any;
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  if (title !== undefined) quiz.title = title;
  if (durationMinutes !== undefined) quiz.durationMinutes = Number(durationMinutes);
  if (questions !== undefined) quiz.questions = questions;
  if (limitQuestions !== undefined) quiz.limitQuestions = limitQuestions !== null ? Number(limitQuestions) : null;
  if (automaticMarking !== undefined) quiz.automaticMarking = automaticMarking;
  if (examDate !== undefined) quiz.examDate = examDate;

  saveDatabase();
  res.json({ success: true, course, quiz });
});

// Admin/Teacher: Delete CBT Quiz
app.delete("/api/admin/courses/:courseId/quizzes/:quizId", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { courseId, quizId } = req.params;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  course.quizzes = (course.quizzes || []).filter(q => q.id !== quizId);

  saveDatabase();
  res.json({ success: true, course });
});

// Admin: Add Islamic Book
app.post("/api/admin/books/add", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { title, author, category, description, coverUrl, downloadUrl } = req.body;

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const newBook: Book = {
    id: "book-" + crypto.randomBytes(8).toString("hex"),
    title,
    author,
    category,
    description,
    downloadUrl: downloadUrl || "#",
    coverUrl: coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80"
  };

  db.books.push(newBook);
  saveDatabase();
  res.json({ success: true, book: newBook });
});

// Admin: Add Poem
app.post("/api/admin/poems/add", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { title, poetName, biography, category, arabicText, translationText, pdfUrl, coverUrl } = req.body;

  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const newPoem: Poem = {
    id: "poem-" + crypto.randomBytes(8).toString("hex"),
    title,
    poetName,
    biography,
    category,
    arabicText: arabicText || [],
    translationText: translationText || [],
    audioUrl: "",
    pdfUrl: pdfUrl || "",
    coverUrl: coverUrl || ""
  };

  db.poems.push(newPoem);
  saveDatabase();
  res.json({ success: true, poem: newPoem });
});

// Admin: Create Announcement
app.post("/api/admin/announcements/create", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  const { title, content, targetRole } = req.body;

  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  const newAnn: Announcement = {
    id: "ann-" + crypto.randomBytes(8).toString("hex"),
    title,
    content,
    date: new Date().toISOString(),
    targetRole: targetRole || "all",
    author: user.name
  };

  db.announcements.unshift(newAnn);
  saveDatabase();
  res.json({ success: true, announcement: newAnn });
});

// Admin/Teacher: Delete Announcement
app.delete("/api/admin/announcements/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const annId = req.params.id;
  db.announcements = db.announcements.filter(a => a.id !== annId);
  saveDatabase();
  res.json({ success: true, message: "Announcement deleted successfully." });
});

// Admin: Update Weekly Quote
app.post("/api/admin/quote/update", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { arabic, translation, source } = req.body;
  db.settings.quoteOfTheDay = { arabic, translation, source };
  saveDatabase();
  res.json({ success: true, quote: db.settings.quoteOfTheDay });
});

// Admin: Create Calendar Event
app.post("/api/admin/calendar/create", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { title, description, date, type } = req.body;
  const newEvent: SchoolCalendarEvent = {
    id: "cal-" + crypto.randomBytes(8).toString("hex"),
    title,
    description,
    date,
    type: type || "event"
  };
  db.calendar.push(newEvent);
  saveDatabase();
  res.json({ success: true, event: newEvent });
});

// Admin: Delete Calendar Event
app.delete("/api/admin/calendar/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const eventId = req.params.id;
  db.calendar = db.calendar.filter(e => e.id !== eventId);
  saveDatabase();
  res.json({ success: true, message: "Calendar event deleted." });
});

// Admin: Create Testimonial
app.post("/api/admin/testimonials/create", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { name, role, content, rating } = req.body;
  const newTestimonial: Testimonial = {
    id: "t-" + crypto.randomBytes(8).toString("hex"),
    name,
    role,
    content,
    rating: Number(rating) || 5
  };
  db.testimonials.push(newTestimonial);
  saveDatabase();
  res.json({ success: true, testimonial: newTestimonial });
});

// Admin: Delete Testimonial
app.delete("/api/admin/testimonials/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const testId = req.params.id;
  db.testimonials = db.testimonials.filter(t => t.id !== testId);
  saveDatabase();
  res.json({ success: true, message: "Testimonial deleted." });
});

// Admin/Teacher: Delete Course Material
app.delete("/api/admin/courses/:courseId/materials/:type/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { courseId, type, id } = req.params;
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (type === "video") {
    course.videos = course.videos.filter(v => v.id !== id);
  } else if (type === "pdf") {
    course.pdfs = course.pdfs.filter(p => p.id !== id);
  } else if (type === "assignment") {
    course.assignments = course.assignments.filter(a => a.id !== id);
  }

  saveDatabase();
  res.json({ success: true, course });
});

// Admin/Teacher: Edit Course Material
app.put("/api/admin/courses/:courseId/materials/:type/:id", authenticate, (req, res) => {
  const userId = (req as any).userId;
  const user = db.users[userId];
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const { courseId, type, id } = req.params;
  const { title, url, description, duration, fileSize, dueDate, points, audioUrl, photos } = req.body;
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (type === "video") {
    const video = course.videos.find(v => v.id === id);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    if (title !== undefined) video.title = title;
    if (url !== undefined) video.url = url;
    if (description !== undefined) video.description = description;
    if (duration !== undefined) video.duration = duration;
    if (audioUrl !== undefined) video.audioUrl = audioUrl;
    if (photos !== undefined) video.photos = photos;
  } else if (type === "pdf") {
    const pdf = course.pdfs.find(p => p.id === id);
    if (!pdf) {
      res.status(404).json({ error: "PDF not found" });
      return;
    }
    if (title !== undefined) pdf.title = title;
    if (url !== undefined) pdf.url = url;
    if (description !== undefined) pdf.description = description;
    if (fileSize !== undefined) pdf.fileSize = fileSize;
  } else if (type === "assignment") {
    const assignment = course.assignments.find(a => a.id === id);
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (points !== undefined) assignment.points = Number(points);
  } else {
    res.status(400).json({ error: "Invalid material type" });
    return;
  }

  saveDatabase();
  res.json({ success: true, course });
});

// Global Search across Courses, Library Books, and Poetry!
app.get("/api/search", (req, res) => {
  const query = (req.query.q as string || "").toLowerCase();
  if (!query) {
    res.json({ courses: [], books: [], poems: [] });
    return;
  }

  const courses = db.courses.filter(c => c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query));
  const books = db.books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || b.description.toLowerCase().includes(query));
  const poems = db.poems.filter(p => p.title.toLowerCase().includes(query) || p.poetName.toLowerCase().includes(query));

  res.json({ courses, books, poems });
});

// AI Chat Support Grounded Endpoint using Gemini API
// (Uses @google/genai as required)
import { GoogleGenAI } from "@google/genai";
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful fallback if API key is not yet set
      res.json({
        reply: "As-salamu alaykum! Welcome to Abu Qoonitah Islamic Academy. (AI is currently in local mode. Please set your GEMINI_API_KEY in the Secrets menu for full AI answers). How can I assist you with enrollment, courses, or navigating our Madrasah LMS?"
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are "Abu Qoonitah Academy AI Assistant", an educational bot for Abu Qoonitah Islamic Academy, an online Madrasah teaching authentic Islamic knowledge (Quran recitation, Tajweed, Arabic grammar Al-Ajurrumiyyah, Nahw, Sarf, Aqeedah, and Fiqh).
    Your core duty is to teach students, teachers, and visitors/strangers how to navigate and use this website, as well as providing authentic, correct Islamic and academic answers.

    WEBSITE USAGE MANUAL TO TEACH USERS:
    
    1. FOR STUDENTS:
       - HOW TO ACCESS: Click "Portal Access" (or "بوابة الدخول") at the top right of the navigation bar. Under Student Portal, they can register a new account or log in.
       - DASHBOARD FEATURES: Once logged in, students can see enrolled courses, review lessons, and view Course Announcements.
       - SUBMITTING WORKSHEETS: On a course page, students can access worksheets. They can type answers, upload worksheet documents or photos (up to 150MB), or record their voice/recitation live on the browser to submit!
       - FREE COURSES: Accessible via the "Free Courses" tab in the navbar. They can learn classical poems like Ibn Taymiyyah's Laamiyyatu with real audio recitations.

    2. FOR TEACHERS:
       - HOW TO ACCESS: Click "Portal Access" at the top right and enter teacher credentials.
       - MANAGEMENT: Teachers can create courses, manage syllabus PDFs (up to 150MB), schedule school calendar dates/lectures, publish news, and upload videos to the Sermon TV stream.
       - GRADING WORKSHEETS: Teachers can review students' worksheet submissions, view their uploaded files/images, listen to student-recorded recitation audios, and input grades and custom text feedback.

    3. FOR VISITORS / STRANGERS:
       - ABOUT US: Learn the Madrasah's mission under "About Us" and "Vision & Goals" tabs.
       - LIBRARIES: Browse and search classical Islamic works under "Islamic Library" or Arabic classical verses under "Poetry Library". All items can be downloaded.
       - VIDEOS: Stream lectures and video broadcasts in "Sermon TV".
       - DONATING: Click "Donate Now" to support the Madrasah. Visitors can input card information or upload a bank transfer receipt file to support free education.
       - CONTACT: Click the green floating WhatsApp button at the bottom right to chat with Abu Qoonitah directly on WhatsApp (number: 08122455759).

    4. WEATHER & SOLAR TIME FEATURE:
       - In the Footer, users can select weather conditions (Sunny, Cloudy, Rainy, Overcast) which dynamically changes the atmospheric refraction.
       - This refraction index automatically adjusts Salat (Splat) times and live Apparent Solar Time in real-time.
       - The footer also displays a dynamic Hijrah (Hijri) date calculated from Umm al-Qura standard calendars.

    Your tone must be exceptionally welcoming, respectful, and encouraging. Greet users with "As-salamu alaykum" when starting. Keep your answers clear, beautifully structured, and highly precise.`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }]
    }));

    // Generate content using gemini-2.5-flash as default model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 500
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    res.json({
      reply: "As-salamu alaykum! I am currently experiencing connection difficulties, but I can tell you that Abu Qoonitah Islamic Academy is dedicated to providing premium Islamic knowledge across Beginner, Intermediate, and Advanced tracks. Let me know what you would like to learn!"
    });
  }
});

// --- VITE AND STATIC SERVING MIDDLEWARE ---

async function startServer() {
  console.log("Synchronizing with Supabase Cloud...");
  try {
    const supabaseDb = await loadFromSupabase();
    if (supabaseDb) {
      db = supabaseDb;
      console.log("Successfully loaded database from Supabase and updated memory state!");
    } else {
      console.log("No existing state found on Supabase. Falling back to local db.json.");
    }
  } catch (err: any) {
    console.error("Failed to fetch startup state from Supabase:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Abu Qoonitah Madrasah LMS running on http://localhost:${PORT}`);
  });
}

startServer();
