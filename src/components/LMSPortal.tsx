/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { User, Course, Submission, Announcement, SchoolCalendarEvent, DiscussionMessage, DirectMessage } from "../types";
import {
  BookOpen, Users, Video, FileText, CheckCircle2, AlertTriangle, Send, Mail, Key, Shield, UserPlus,
  ChevronRight, ArrowRight, MessageSquare, Award, Clock, Calendar, Lock, Unlock, Check, Star, Settings, Trash2, Plus, Edit
} from "lucide-react";

interface LMSPortalProps {
  isArabic: boolean;
  currentUser: any;
  onLoginSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  initialRegistering?: boolean;
}

export default function LMSPortal({ isArabic, currentUser, onLoginSuccess, onLogout, initialRegistering }: LMSPortalProps) {
  // --- Auth states ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLevel, setRegLevel] = useState<'beginner' | 'intermediate' | 'advanced'>("beginner");
  
  // New enrollment/admission states
  const [regWhyJoin, setRegWhyJoin] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regCountry, setRegCountry] = useState("");
  const [regState, setRegState] = useState("");
  const [regPaymentMode, setRegPaymentMode] = useState("Opay");
  const [regReceiptUrl, setRegReceiptUrl] = useState("");
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);
  const [regWhatsapp, setRegWhatsapp] = useState("");

  useEffect(() => {
    if (initialRegistering !== undefined) {
      setIsRegistering(initialRegistering);
    }
  }, [initialRegistering]);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot password mockup
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotWhatsapp, setForgotWhatsapp] = useState("");
  const [forgotResult, setForgotResult] = useState<any>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // --- LMS Dashboard states ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Derived certificate unlock state
  const passedBeginner = submissions.some(s => {
    if (s.type !== "quiz") return false;
    const course = courses.find(c => c.id === s.courseId);
    return course?.level === "beginner";
  });

  const passedIntermediate = submissions.some(s => {
    if (s.type !== "quiz") return false;
    const course = courses.find(c => c.id === s.courseId);
    return course?.level === "intermediate";
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<SchoolCalendarEvent[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Dashboard Sub-tabs
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [adminSubTab, setAdminSubTab] = useState<string>("payments");
  const [studentSubTab, setStudentSubTab] = useState<"courses" | "assignments" | "announcements" | "payments" | "results" | "certificates">("courses");
  const [teacherSubTab, setTeacherSubTab] = useState<"tracker" | "grading" | "attendance" | "announcements" | "curriculum" | "admissions">("tracker");

  // --- Teacher Registration states ---
  const [tchName, setTchName] = useState("");
  const [tchEmail, setTchEmail] = useState("");
  const [tchPhone, setTchPhone] = useState("");
  const [tchGender, setTchGender] = useState("male");
  const [tchProfilePic, setTchProfilePic] = useState("");
  const [tchSubjects, setTchSubjects] = useState("");
  const [tchClass, setTchClass] = useState("beginner");
  const [tchQualification, setTchQualification] = useState("");
  const [tchBio, setTchBio] = useState("");
  const [tchUsername, setTchUsername] = useState("");
  const [tchPassword, setTchPassword] = useState("");
  const [tchConfirmPassword, setTchConfirmPassword] = useState("");
  const [tchLoading, setTchLoading] = useState(false);
  const [tchError, setTchError] = useState("");
  const [tchSuccess, setTchSuccess] = useState("");
  const [tchRegisteredId, setTchRegisteredId] = useState("");

  // Copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const handleCopyField = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 50-Mark Semester 1 Marking System Helper
  const calculateSemesterMarks = (studentName: string) => {
    const studentSubs = submissions.filter(s => s.studentName === studentName);
    
    // 1. Assignments: 1 mark per assignment, up to 20 marks total
    const assignmentsList = studentSubs.filter(s => s.type === "assignment");
    const assignmentMarks = Math.min(20, assignmentsList.length);
    
    // 2. CBT Test: 5 marks. Find quiz containing "cbt" or "test" or fallback to any quiz
    const cbtSub = studentSubs.find(s => s.type === "quiz" && (s.referenceTitle.toLowerCase().includes("cbt") || s.referenceTitle.toLowerCase().includes("test")))
      || studentSubs.find(s => s.type === "quiz");
    const cbtMark = cbtSub && cbtSub.score !== undefined && (subMaxPoints(cbtSub) > 0)
      ? Math.round((cbtSub.score / subMaxPoints(cbtSub)) * 5)
      : 0;
    const cbtTitle = cbtSub ? cbtSub.referenceTitle : "Not Attempted";
    
    // 3. Oral Test: 5 marks. Look for any assignment/quiz containing "oral"
    const oralSub = studentSubs.find(s => s.referenceTitle.toLowerCase().includes("oral"));
    const oralMark = oralSub && oralSub.score !== undefined && (subMaxPoints(oralSub) > 0)
      ? Math.round((oralSub.score / subMaxPoints(oralSub)) * 5)
      : 0;
    const oralTitle = oralSub ? oralSub.referenceTitle : "Not Attempted";
    
    // 4. Final Exam: 20 marks. Look for any submission containing "final" or "exam"
    const finalSub = studentSubs.find(s => s.referenceTitle.toLowerCase().includes("final") || s.referenceTitle.toLowerCase().includes("exam"));
    const finalMark = finalSub && finalSub.score !== undefined && (subMaxPoints(finalSub) > 0)
      ? Math.round((finalSub.score / subMaxPoints(finalSub)) * 20)
      : 0;
    const finalTitle = finalSub ? finalSub.referenceTitle : "Not Attempted";
    
    const totalMarks = assignmentMarks + cbtMark + oralMark + finalMark;
    
    return {
      assignmentMarks,
      assignmentCount: assignmentsList.length,
      cbtMark,
      cbtTitle,
      cbtScore: cbtSub && cbtSub.score !== undefined ? `${cbtSub.score}/${subMaxPoints(cbtSub)}` : null,
      oralMark,
      oralTitle,
      oralScore: oralSub && oralSub.score !== undefined ? `${oralSub.score}/${subMaxPoints(oralSub)}` : null,
      finalMark,
      finalTitle,
      finalScore: finalSub && finalSub.score !== undefined ? `${finalSub.score}/${subMaxPoints(finalSub)}` : null,
      totalMarks
    };
  };

  const subMaxPoints = (sub: any) => sub.maxPoints || 100;

  // Admission List States
  const [admissionList, setAdmissionList] = useState<any[]>([]);
  const [admissionLoading, setAdmissionLoading] = useState(false);
  const [admissionError, setAdmissionError] = useState("");
  const [admissionSearch, setAdmissionSearch] = useState("");
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [admissionRoleFilter, setAdmissionRoleFilter] = useState<"all" | "student" | "teacher">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Quiz / CBT states
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<{ score: number; maxPoints: number } | null>(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);

  // Teacher/Admin CBT Management States
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState<any | null>(null);
  const [quizEditTitle, setQuizEditTitle] = useState("");
  const [quizEditDuration, setQuizEditDuration] = useState(10);
  const [quizEditQuestions, setQuizEditQuestions] = useState<any[]>([]);
  const [quizEditLimitQuestions, setQuizEditLimitQuestions] = useState<number | "">("");
  const [quizEditAutomaticMarking, setQuizEditAutomaticMarking] = useState<boolean>(true);
  const [quizEditExamDate, setQuizEditExamDate] = useState<string>("");
  
  // Current question creator scratchpad
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrectIndex, setNewQuestionCorrectIndex] = useState(0);

  // Tuition Payment state overrides
  const [tuitionPayType, setTuitionPayType] = useState<'monthly' | 'semester'>('semester');
  const [activeCertificate, setActiveCertificate] = useState<"beginner" | "intermediate" | "free" | null>(null);
  const [calendarSemester, setCalendarSemester] = useState<"semester1" | "semester2">("semester1");
  const [selectedReportSemester, setSelectedReportSemester] = useState<1 | 2>(1);

  // Assignment upload states
  const [activeAssign, setActiveAssign] = useState<any | null>(null);
  const [assignText, setAssignText] = useState("");
  const [assignSubmitSuccess, setAssignSubmitSuccess] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Discussion forum states
  const [forumMessages, setForumMessages] = useState<DiscussionMessage[]>([]);
  const [newForumMsg, setNewForumMsg] = useState("");

  // Direct messages states
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [dmHistory, setDmHistory] = useState<DirectMessage[]>([]);
  const [newDMMsg, setNewDMMsg] = useState("");

  // Teacher states
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradingScore, setGradingScore] = useState<number | "">("");
  const [gradingComments, setGradingComments] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent'>>({});
  const [teacherCourseId, setTeacherCourseId] = useState("");
  const [selectedStudentDetailsId, setSelectedStudentDetailsId] = useState<string | null>(null);
  const [gradingFilter, setGradingFilter] = useState<"pending" | "graded">("pending");
  const [gradingSearchText, setGradingSearchText] = useState("");
  const [gradingTypeFilter, setGradingTypeFilter] = useState<"all" | "assignment" | "quiz" | "exam">("all");

  // Manual grading custom states
  const [showManualGradeForm, setShowManualGradeForm] = useState(false);
  const [manualGradeStudentName, setManualGradeStudentName] = useState("");
  const [manualGradeCourseId, setManualGradeCourseId] = useState("");
  const [manualGradeType, setManualGradeType] = useState<"assignment" | "quiz" | "exam" | "oral">("assignment");
  const [manualGradeReferenceTitle, setManualGradeReferenceTitle] = useState("");
  const [manualGradeScore, setManualGradeScore] = useState<number | "">("");
  const [manualGradeMaxPoints, setManualGradeMaxPoints] = useState<number | "">("");
  const [manualGradeComments, setManualGradeComments] = useState("");

  // Edit already graded submission state
  const [editingGradedSubmission, setEditingGradedSubmission] = useState<Submission | null>(null);
  const [editGradedScore, setEditGradedScore] = useState<number | "">("");
  const [editGradedComments, setEditGradedComments] = useState("");

  // Creator forms (Teacher / Admin)
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseLevel, setNewCourseLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'free'>("beginner");
  const [newCourseDuration, setNewCourseDuration] = useState("8 Weeks");
  const [newCourseObjectives, setNewCourseObjectives] = useState("");

  // Add material forms
  const [matType, setMatType] = useState<'video' | 'pdf' | 'assignment'>("video");
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matDesc, setMatDesc] = useState("");
  const [matDurationOrSize, setMatDurationOrSize] = useState("");
  const [matDueDate, setMatDueDate] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<{ type: 'video' | 'pdf' | 'assignment', id: string, courseId: string } | null>(null);

  // Teacher lecture recording / multiple photos states
  const [matAudioUrl, setMatAudioUrl] = useState<string | null>(null);
  const [matPhotos, setMatPhotos] = useState<string[]>([]);
  const [isRecordingMat, setIsRecordingMat] = useState(false);
  const [recordingMatSeconds, setRecordingMatSeconds] = useState(0);
  const recordingMatTimerRef = useRef<any>(null);
  const teacherMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const teacherAudioChunksRef = useRef<Blob[]>([]);

  // Admin states
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annTarget, setAnnTarget] = useState<'all' | 'student' | 'teacher'>("all");

  // Credentials change states
  const [credOldPassword, setCredOldPassword] = useState("");
  const [credNewPassword, setCredNewPassword] = useState("");
  const [credNewUsername, setCredNewUsername] = useState("");

  // Student Payment submission states
  const [payMonth, setPayMonth] = useState("July 2026");
  const [payAmount, setPayAmount] = useState("₦15,000 / $25");
  const [payBankRef, setPayBankRef] = useState("");
  const [payReceiptSuccess, setPayReceiptSuccess] = useState(false);

  // Admin Quote management states
  const [quoteArabic, setQuoteArabic] = useState("");
  const [quoteTranslation, setQuoteTranslation] = useState("");
  const [quoteSource, setQuoteSource] = useState("");

  // Admin Free Course (Poem) management states
  const [fcTitle, setFcTitle] = useState("");
  const [fcDescription, setFcDescription] = useState("");
  const [fcImageUrl, setFcImageUrl] = useState("");
  const [fcVerses, setFcVerses] = useState<{ arabic: string; translation: string }[]>([]);
  const [fcAudioFiles, setFcAudioFiles] = useState<{ id: string; title: string; url: string; description: string }[]>([]);
  const [fcQuestions, setFcQuestions] = useState<{ id: string; question: string; options: string[]; correctIndex: number }[]>([]);
  const [fcPassingScore, setFcPassingScore] = useState<number>(4);
  const [fcSaving, setFcSaving] = useState(false);
  const [fcMessage, setFcMessage] = useState("");
  const [fcEnrollments, setFcEnrollments] = useState<any[]>([]);
  const [fcEnrollmentsLoading, setFcEnrollmentsLoading] = useState(false);

  // Admin About Us & FAQ states
  const [aboutUsHistoryEn, setAboutUsHistoryEn] = useState("");
  const [aboutUsHistoryAr, setAboutUsHistoryAr] = useState("");
  const [aboutUsFounderBioEn, setAboutUsFounderBioEn] = useState("");
  const [aboutUsFounderBioAr, setAboutUsFounderBioAr] = useState("");
  const [aboutUsValues, setAboutUsValues] = useState<{ titleEn: string; titleAr: string; descEn: string; descAr: string }[]>([]);
  const [aboutUsFaqs, setAboutUsFaqs] = useState<{ qEn: string; qAr: string; aEn: string; aAr: string }[]>([]);
  const [aboutUsSaving, setAboutUsSaving] = useState(false);
  const [aboutUsMessage, setAboutUsMessage] = useState("");

  // Admin Curriculum states
  const [currWhyEnroll, setCurrWhyEnroll] = useState("");
  const [currSections, setCurrSections] = useState<{ id: string; titleEn: string; titleAr: string; items: { nameEn: string; nameAr: string }[] }[]>([]);
  const [currFeaturedCourses, setCurrFeaturedCourses] = useState<{ id: string; level: string; titleEn: string; titleAr: string; teacherEn: string; teacherAr: string; duration: string; descEn: string; descAr: string }[]>([]);
  const [currSaving, setCurrSaving] = useState(false);
  const [currMessage, setCurrMessage] = useState("");

  // Admin Sermon TV states
  const [sermons, setSermons] = useState<{ id: string; title: string; category: string; duration: string; url: string; speaker: string; coverUrl?: string; isAudio?: boolean }[]>([]);
  const [newSermonTitle, setNewSermonTitle] = useState("");
  const [newSermonCategory, setNewSermonCategory] = useState("Sermon");
  const [newSermonDuration, setNewSermonDuration] = useState("");
  const [newSermonUrl, setNewSermonUrl] = useState("");
  const [newSermonSpeaker, setNewSermonSpeaker] = useState("Shaykh Abu Qoonitah");
  const [newSermonCoverUrl, setNewSermonCoverUrl] = useState("");
  const [isRecordingSermon, setIsRecordingSermon] = useState(false);
  const [mediaRecorderSermon, setMediaRecorderSermon] = useState<MediaRecorder | null>(null);
  const [recordingSecondsSermon, setRecordingSecondsSermon] = useState(0);
  const [recordingIntervalIdSermon, setRecordingIntervalIdSermon] = useState<any>(null);
  const [audioBlobUrlSermon, setAudioBlobUrlSermon] = useState<string | null>(null);
  const [sermonSaving, setSermonSaving] = useState(false);
  const [sermonMessage, setSermonMessage] = useState("");

  // Admin Donation Settings states
  const [donTargetTitle, setDonTargetTitle] = useState("");
  const [donTargetDescription, setDonTargetDescription] = useState("");
  const [donTargetAmount, setDonTargetAmount] = useState(50000);
  const [donRaisedAmount, setDonRaisedAmount] = useState(0);
  const [donAccountNumber, setDonAccountNumber] = useState("8122455759");
  const [donAccountName, setDonAccountName] = useState("Ishaq Ridwanullah Babatunde");
  const [donBank, setDonBank] = useState("Opay");
  const [donSaving, setDonSaving] = useState(false);
  const [donMessage, setDonMessage] = useState("");

  // Admin Islamic Library states
  const [libraryBooks, setLibraryBooks] = useState<any[]>([]);
  const [libraryPoems, setLibraryPoems] = useState<any[]>([]);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCategory, setNewBookCategory] = useState("Hadith");
  const [newBookDesc, setNewBookDesc] = useState("");
  const [newBookCoverUrl, setNewBookCoverUrl] = useState("");
  const [newBookDownloadUrl, setNewBookDownloadUrl] = useState("");
  const [newPoemTitle, setNewPoemTitle] = useState("");
  const [newPoemPoet, setNewPoemPoet] = useState("");
  const [newPoemBio, setNewPoemBio] = useState("");
  const [newPoemCategory, setNewPoemCategory] = useState("Aqeedah");
  const [newPoemArabicText, setNewPoemArabicText] = useState("");
  const [newPoemTranslationText, setNewPoemTranslationText] = useState("");
  const [newPoemPdfUrl, setNewPoemPdfUrl] = useState("");
  const [newPoemCoverUrl, setNewPoemCoverUrl] = useState("");
  const [libSaving, setLibSaving] = useState(false);
  const [libMessage, setLibMessage] = useState("");
  const [isBookCoverUploading, setIsBookCoverUploading] = useState(false);
  const [isBookPdfUploading, setIsBookPdfUploading] = useState(false);
  const [isPoemCoverUploading, setIsPoemCoverUploading] = useState(false);
  const [isPoemPdfUploading, setIsPoemPdfUploading] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingPoemId, setEditingPoemId] = useState<string | null>(null);

  // Admin Testimonials management states
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [newTestName, setNewTestName] = useState("");
  const [newTestRole, setNewTestRole] = useState("");
  const [newTestContent, setNewTestContent] = useState("");
  const [newTestRating, setNewTestRating] = useState(5);

  // Admin Calendar management states
  const [newCalTitle, setNewCalTitle] = useState("");
  const [newCalDesc, setNewCalDesc] = useState("");
  const [newCalDate, setNewCalDate] = useState("");
  const [newCalType, setNewCalType] = useState("event");

  // Admin Student Management (Credentials & Manual Addition) States
  const [isEditingStudentCredentials, setIsEditingStudentCredentials] = useState(false);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentEmail, setEditStudentEmail] = useState("");
  const [editStudentUsername, setEditStudentUsername] = useState("");
  const [editStudentPassword, setEditStudentPassword] = useState("");
  const [editStudentLevel, setEditStudentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>("beginner");
  const [editStudentSuccessMsg, setEditStudentSuccessMsg] = useState("");
  const [editStudentErrorMsg, setEditStudentErrorMsg] = useState("");

  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [addStudentName, setAddStudentName] = useState("");
  const [addStudentEmail, setAddStudentEmail] = useState("");
  const [addStudentUsername, setAddStudentUsername] = useState("");
  const [addStudentPassword, setAddStudentPassword] = useState("");
  const [addStudentLevel, setAddStudentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>("beginner");
  const [addStudentIsPaid, setAddStudentIsPaid] = useState(false);
  const [addStudentSuccessMsg, setAddStudentSuccessMsg] = useState("");
  const [addStudentErrorMsg, setAddStudentErrorMsg] = useState("");

  // Auto-generate username and password for registration & manual additions
  useEffect(() => {
    const clean = regName.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (clean) {
      setRegUsername(clean);
      setRegPassword(`${clean}@123`);
    } else {
      setRegUsername("");
      setRegPassword("");
    }
  }, [regName]);

  useEffect(() => {
    const clean = addStudentName.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (clean) {
      setAddStudentUsername(clean);
      setAddStudentPassword(`${clean}@123`);
    } else {
      setAddStudentUsername("");
      setAddStudentPassword("");
    }
  }, [addStudentName]);

  // --- TIMER FOR CBT QUIZ COUNTDOWN ---
  useEffect(() => {
    if (activeQuiz && quizTimeLeft !== null && !quizScore) {
      if (quizTimeLeft <= 0) {
        // Auto submit
        handleQuizSubmit(activeQuiz.id);
        alert("⏱️ Time is up! Your answers have been automatically submitted.");
        return;
      }
      const timer = setInterval(() => {
        setQuizTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeQuiz, quizTimeLeft, quizScore]);

  // --- LOAD LMS DATA UPON AUTH ---
  useEffect(() => {
    if (currentUser) {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      // Load donation settings dynamically for tuition page & donation display
      fetch("/api/public/donation-settings")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setDonAccountNumber(data.accountNumber || "8122455759");
            setDonAccountName(data.accountName || "Ishaq Ridwanullah Babatunde");
            setDonBank(data.bank || "Opay");
          }
        })
        .catch((err) => console.error(err));

      // Load Courses
      fetch("/api/courses", { headers })
        .then((res) => res.json())
        .then((data) => {
          setCourses(data);
          if (data && data.length > 0) {
            setTeacherCourseId(data[0].id);
          }
        })
        .catch((err) => console.error(err));

      // Load submissions
      fetch("/api/submissions", { headers })
        .then((res) => res.json())
        .then((data) => setSubmissions(data))
        .catch((err) => console.error(err));

      // Load Announcements
      fetch("/api/public/announcements")
        .then((res) => res.json())
        .then((data) => setAnnouncements(data))
        .catch((err) => console.error(err));

      // Load Calendar
      fetch("/api/public/calendar")
        .then((res) => res.json())
        .then((data) => setCalendarEvents(data))
        .catch((err) => console.error(err));

      // Load Testimonials
      fetch("/api/public/testimonials")
        .then((res) => res.json())
        .then((data) => setAllTestimonials(data))
        .catch((err) => console.error(err));

      // Load Quote of the Day
      fetch("/api/public/quote")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setQuoteArabic(data.arabic || "");
            setQuoteTranslation(data.translation || "");
            setQuoteSource(data.source || "");
          }
        })
        .catch((err) => console.error(err));

      // Load Contacts
      fetch("/api/messages/contacts", { headers })
        .then((res) => res.json())
        .then((data) => setContacts(data.filter((c: any) => c.id !== currentUser.id)))
        .catch((err) => console.error(err));

      // Load Direct Messages
      fetch("/api/messages/history", { headers })
        .then((res) => res.json())
        .then((data) => setDmHistory(data))
        .catch((err) => console.error(err));

      // Load rosters if teacher or admin
      if (currentUser.role === "admin" || currentUser.role === "teacher") {
        fetch("/api/admin/students", { headers })
          .then((res) => res.json())
          .then((data) => {
            setAllStudents(data);
            // Initialize attendance toggles to 'present'
            const initial: Record<string, 'present' | 'absent'> = {};
            data.forEach((s: any) => { initial[s.id] = 'present'; });
            setAttendanceStatus(initial);
          })
          .catch((err) => console.error(err));
      }

      if (currentUser.role === "admin") {
        fetch("/api/admin/teachers", { headers })
          .then((res) => res.json())
          .then((data) => setAllTeachers(data))
          .catch((err) => console.error(err));
      }
    }
  }, [currentUser]);

  // Synchronize student credentials edit form
  useEffect(() => {
    if (selectedStudentDetailsId) {
      const s = allStudents.find(st => st.id === selectedStudentDetailsId);
      if (s) {
        setEditStudentName(s.name || "");
        setEditStudentEmail(s.email || "");
        setEditStudentUsername(s.username || "");
        setEditStudentLevel(s.level || "beginner");
        setEditStudentPassword("");
        setIsEditingStudentCredentials(false);
        setEditStudentSuccessMsg("");
        setEditStudentErrorMsg("");
      }
    }
  }, [selectedStudentDetailsId, allStudents]);

  // Fetch Free Course data for Admin settings editing
  useEffect(() => {
    if (currentUser?.role === "admin" && adminSubTab === "freecourse") {
      fetch("/api/public/free-course")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setFcTitle(data.title || "");
            setFcDescription(data.description || "");
            setFcImageUrl(data.imageUrl || "");
            
            const verses: { arabic: string; translation: string }[] = [];
            const ar = data.poemArabicText || [];
            const tr = data.poemTranslationText || [];
            const len = Math.max(ar.length, tr.length);
            for (let i = 0; i < len; i++) {
              verses.push({
                arabic: ar[i] || "",
                translation: tr[i] || ""
              });
            }
            setFcVerses(verses);
            setFcAudioFiles(data.audioFiles || []);
            setFcQuestions(data.questions || []);
            setFcPassingScore(data.passingScore || 4);
          }
        })
        .catch((err) => console.error(err));

      setFcEnrollmentsLoading(true);
      const token = localStorage.getItem("token") || "";
      fetch("/api/admin/free-course/enrollments", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          setFcEnrollments(Array.isArray(data) ? data : []);
          setFcEnrollmentsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setFcEnrollmentsLoading(false);
        });
    }
  }, [currentUser, adminSubTab]);

  // Fetch About Us, Curriculum, Sermons, Donations, and Library data for Admin settings editing
  useEffect(() => {
    if (currentUser?.role === "admin") {
      if (adminSubTab === "aboutUs") {
        fetch("/api/public/about")
          .then((res) => res.json())
          .then((data) => {
            if (data) {
              setAboutUsHistoryEn(data.historyEn || "");
              setAboutUsHistoryAr(data.historyAr || "");
              setAboutUsFounderBioEn(data.founderBioEn || "");
              setAboutUsFounderBioAr(data.founderBioAr || "");
              setAboutUsValues(data.values || []);
              setAboutUsFaqs(data.faqs || []);
            }
          })
          .catch((err) => console.error(err));
      } else if (adminSubTab === "curriculum" || adminSubTab === "curriculumSettings") {
        fetch("/api/public/curriculum")
          .then((res) => res.json())
          .then((data) => {
            if (data) {
              setCurrWhyEnroll(data.whyEnroll || "");
              setCurrSections(data.sections || []);
              setCurrFeaturedCourses(data.featuredCourses || []);
            }
          })
          .catch((err) => console.error(err));
      } else if (adminSubTab === "sermons") {
        fetch("/api/public/sermons")
          .then((res) => res.json())
          .then((data) => {
            if (data) setSermons(data);
          })
          .catch((err) => console.error(err));
      } else if (adminSubTab === "donations") {
        fetch("/api/public/donation-settings")
          .then((res) => res.json())
          .then((data) => {
            if (data) {
              setDonTargetTitle(data.targetTitle || "");
              setDonTargetDescription(data.targetDescription || "");
              setDonTargetAmount(data.targetAmount || 50000);
              setDonRaisedAmount(data.raisedAmount || 0);
              setDonAccountNumber(data.accountNumber || "8122455759");
              setDonAccountName(data.accountName || "Ishaq Ridwanullah Babatunde");
              setDonBank(data.bank || "Opay");
            }
          })
          .catch((err) => console.error(err));
      } else if (adminSubTab === "library") {
        fetch("/api/public/books")
          .then((res) => res.json())
          .then((data) => {
            if (data) setLibraryBooks(data);
          })
          .catch((err) => console.error(err));

        fetch("/api/public/poems")
          .then((res) => res.json())
          .then((data) => {
            if (data) setLibraryPoems(data);
          })
          .catch((err) => console.error(err));
      }
    }
  }, [currentUser, adminSubTab]);

  // Load discussion forum when course changes
  useEffect(() => {
    if (selectedCourse && currentUser) {
      const token = localStorage.getItem("token") || "";
      fetch(`/api/discussions/${selectedCourse.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setForumMessages(data))
        .catch((err) => console.error(err));
    }
  }, [selectedCourse, currentUser]);

  // --- AUTH HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Login failed"); });
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("token", data.token);
        onLoginSuccess(data.user, data.token);
        setUsername("");
        setPassword("");
      })
      .catch((err) => setAuthError(err.message));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        whatsapp: regWhatsapp,
        username: regUsername,
        password: regPassword,
        level: regLevel,
        whyJoin: regWhyJoin,
        dob: regDob,
        country: regCountry,
        state: regState,
        paymentMode: regPaymentMode,
        receiptUrl: regReceiptUrl
      })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Registration failed"); });
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("token", data.token);

        // Redirect to WhatsApp Business
        const waMessage = `As-salamu alaykum. I have enrolled in Abu Qoonitah Islamic Academy. Here are my registration details:
- Full Name: ${regName}
- Email: ${regEmail}
- WhatsApp Number: ${regWhatsapp}
- Why I want to join: ${regWhyJoin}
- Date of Birth: ${regDob}
- Country: ${regCountry}
- State: ${regState}
- Payment Mode: ${regPaymentMode}
- Academic Level: Beginner (Everyone starts from beginner)

Please verify my payment receipt and activate my admission. Jazakum Allahu Khairan.`;
        const waUrl = `https://wa.me/2348122455759?text=${encodeURIComponent(waMessage)}`;
        try {
          window.open(waUrl, "_blank");
        } catch (e) {
          window.location.href = waUrl;
        }

        onLoginSuccess(data.user, data.token);
        // Clear forms
        setRegName("");
        setRegEmail("");
        setRegWhatsapp("");
        setRegUsername("");
        setRegPassword("");
        setRegWhyJoin("");
        setRegDob("");
        setRegCountry("");
        setRegState("");
        setRegPaymentMode("Opay");
        setRegReceiptUrl("");
        setIsRegistering(false);
      })
      .catch((err) => setAuthError(err.message));
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setAuthError("Please enter your Username, Email, or WhatsApp.");
      return;
    }
    
    setForgotLoading(true);
    setAuthError("");
    setSuccessMsg("");
    setForgotResult(null);

    fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: forgotIdentifier, whatsapp: forgotWhatsapp })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || "Failed to lookup account"); });
        }
        return res.json();
      })
      .then(data => {
        setForgotResult(data.user);
        const prefilledWhatsapp = data.user.role === "admin" ? "08122455759" : (data.user.whatsapp || "");
        setForgotWhatsapp(prefilledWhatsapp);
        setSuccessMsg(`Account located successfully for ${data.user.name}.`);
      })
      .catch(err => {
        setAuthError(err.message);
      })
      .finally(() => {
        setForgotLoading(false);
      });
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "234" + cleaned.substring(1);
    }
    return cleaned;
  };

  const getWhatsAppLink = (user: any, phone: string) => {
    const targetPhone = user.role === "admin" ? "08122455759" : phone;
    const cleanedPhone = formatPhoneForWhatsApp(targetPhone);
    const text = `As-salamu alaykum,

Here are your login credentials for Abu Qoonitah Academy:
👤 *Username:* ${user.username}
🔑 *Password:* ${user.plainPassword}
Role: ${user.role.toUpperCase()}

Please keep this secure.`;
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsReceiptUploading(true);
      try {
        const compressed = await compressImage(file);
        setRegReceiptUrl(compressed);
      } catch (err) {
        console.error("Error loading receipt:", err);
      } finally {
        setIsReceiptUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setIsReceiptUploading(true);
      try {
        const compressed = await compressImage(file);
        setRegReceiptUrl(compressed);
      } catch (err) {
        console.error("Error loading receipt:", err);
      } finally {
        setIsReceiptUploading(false);
      }
    }
  };

  const handleCredentialsChange = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";
    fetch("/api/auth/change-credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: credOldPassword,
        newPassword: credNewPassword,
        newUsername: credNewUsername
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          alert("Credentials successfully updated! For security, your session has been secured.");
          setCredOldPassword("");
          setCredNewPassword("");
          setCredNewUsername("");
        }
      })
      .catch((err) => console.error(err));
  };

  // --- ACTIONS ---

  // Enroll Student to Course
  const handleEnroll = (courseId: string) => {
    const token = localStorage.getItem("token") || "";
    fetch("/api/courses/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ courseId })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        return res.json();
      })
      .then((data) => {
        // Update user state locally
        onLoginSuccess(data.user, token);
        // Re-request courses to update stats
        setCourses(courses.map(c => c.id === courseId ? { ...c, enrolledStudentsCount: (c.enrolledStudentsCount || 0) + 1 } : c));
        alert("Barakallahu Feekum! Successfully enrolled in the course. Start studying now.");
      })
      .catch((err) => alert(`Enrolment Error: ${err.message}`));
  };

  // Submit Quiz answer sheet
  const handleQuizSubmit = (quizId: string) => {
    if (!selectedCourse) return;
    const token = localStorage.getItem("token") || "";

    fetch("/api/submissions/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseId: selectedCourse.id,
        type: "quiz",
        referenceId: quizId,
        referenceTitle: activeQuiz.title,
        submissionContent: JSON.stringify(quizAnswers),
        maxPoints: 100
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmissions([data.submission, ...submissions]);
        
        // Calculate scores for prompt visual
        let correct = 0;
        activeQuiz.questions.forEach((q: any) => {
          if (quizAnswers[q.id] === q.correctAnswerIndex) correct++;
        });
        setQuizScore({
          score: Math.round((correct / activeQuiz.questions.length) * 100),
          maxPoints: 100
        });
      })
      .catch((err) => console.error(err));
  };

  // Base64 helper for custom files
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Image change handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const base64Promises = Array.from(files).map((file: any) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
    });

    try {
      const base64s = await Promise.all(base64Promises);
      setUploadedPhotos((prev) => [...prev, ...base64s]);
    } catch (err) {
      console.error("Error reading images:", err);
      alert("Failed to read image files.");
    }
  };

  // Microphone audio recorder handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          (audioChunksRef.current as any[]).push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current as any[], { type: mimeType });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setUploadedAudio(base64Audio);
        };
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Mic access error:", err);
      alert("🎙️ Microphone access was denied or is not supported. Please make sure the site has microphone permission, or select/upload a recorded audio file instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setUploadedAudio(null);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  // --- TEACHER STUDY MATERIAL ATTACHMENTS HELPERS ---
  const handleMatPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const base64Promises = Array.from(files).map((file: any) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    });

    try {
      const base64s = await Promise.all(base64Promises);
      setMatPhotos((prev) => [...prev, ...base64s]);
    } catch (err) {
      console.error("Error reading images for lecture:", err);
      alert("Failed to read slide image files.");
    }
  };

  const startRecordingMat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      teacherMediaRecorderRef.current = mediaRecorder;
      teacherAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          (teacherAudioChunksRef.current as any[]).push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = teacherMediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(teacherAudioChunksRef.current as any[], { type: mimeType });
        const previewUrl = URL.createObjectURL(audioBlob);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setMatAudioUrl(base64Audio);
        };
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingMat(true);
      setRecordingMatSeconds(0);

      recordingMatTimerRef.current = setInterval(() => {
        setRecordingMatSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Teacher Mic access error:", err);
      alert("🎙️ Microphone access was denied or is not supported. Please make sure the site has microphone permission, or check your device configuration.");
    }
  };

  const stopRecordingMat = () => {
    if (teacherMediaRecorderRef.current && isRecordingMat) {
      teacherMediaRecorderRef.current.stop();
      setIsRecordingMat(false);
      if (recordingMatTimerRef.current) {
        clearInterval(recordingMatTimerRef.current);
      }
    }
  };

  const deleteRecordingMat = () => {
    setMatAudioUrl(null);
    setRecordingMatSeconds(0);
    if (recordingMatTimerRef.current) {
      clearInterval(recordingMatTimerRef.current);
    }
  };

  // Submit rich worksheet / homework assignment
  const handleAssignSubmitRich = (e: React.FormEvent, assignmentItem: any) => {
    e.preventDefault();
    const courseObj = courses.find(c => c.assignments.some(a => a.id === assignmentItem.id));
    if (!courseObj) {
      alert("Course not found for this assignment.");
      return;
    }
    
    if (!assignText.trim() && uploadedPhotos.length === 0 && !uploadedAudio) {
      alert("⚠️ Please provide some content before submitting. Write an answer, upload homework photos, or record/upload a voice note.");
      return;
    }

    const token = localStorage.getItem("token") || "";
    
    const wrappedContent = JSON.stringify({
      text: assignText,
      photos: uploadedPhotos,
      audio: uploadedAudio
    });

    fetch("/api/submissions/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseId: courseObj.id,
        type: "assignment",
        referenceId: assignmentItem.id,
        referenceTitle: assignmentItem.title,
        submissionContent: wrappedContent,
        maxPoints: assignmentItem.points
      })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        return res.json();
      })
      .then((data) => {
        setSubmissions([data.submission, ...submissions]);
        setAssignSubmitSuccess(true);
        setAssignText("");
        setUploadedPhotos([]);
        setUploadedAudio(null);
        setAudioPreviewUrl(null);
        
        setTimeout(() => {
          setAssignSubmitSuccess(false);
          setActiveAssign(null);
        }, 3000);
      })
      .catch((err) => {
        console.error(err);
        alert(`Failed to submit: ${err.message}`);
      });
  };

  // Submit Tuition Receipt
  const handleTuitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBankRef.trim()) return;
    const token = localStorage.getItem("token") || "";

    const selectedAmount = tuitionPayType === "semester" ? "₦15,000 NGN" : "₦5,000 NGN";
    const selectedTitle = tuitionPayType === "semester" ? `Semester Tuition Fee (${payMonth})` : `Monthly Tuition Fee (${payMonth})`;

    fetch("/api/submissions/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseId: "tuition",
        type: "payment",
        referenceId: "tuition-" + tuitionPayType + "-" + payMonth.toLowerCase().replace(" ", "-"),
        referenceTitle: selectedTitle,
        submissionContent: JSON.stringify({
          amount: selectedAmount,
          bankRef: payBankRef,
          date: new Date().toISOString()
        }),
        maxPoints: 100
      })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        return res.json();
      })
      .then((data) => {
        setSubmissions([data.submission, ...submissions]);
        setPayReceiptSuccess(true);
        setPayBankRef("");
        
        // WhatsApp Redirect notification
        const waMessage = `As-salamu alaykum, Abu Qoonitah Academy.

I have just completed a tuition payment via Bank Transfer!

• Student: ${currentUser?.name || ""} (${currentUser?.username || ""})
• Payment Type: ${tuitionPayType === "semester" ? "Semester Tuition Fee" : "Monthly Tuition Payment"}
• Month/Period: ${payMonth}
• Amount Paid: ${selectedAmount}
• Target Bank: ${donBank}
• Target Account Name: ${donAccountName}
• Target Account Number: ${donAccountNumber}
• Bank Transfer Reference: ${payBankRef}

Kindly verify my proof of payment and clear my academic lock. Jazakum Allahu Khairan!`;

        const waUrl = `https://wa.me/2348122455759?text=${encodeURIComponent(waMessage)}`;
        
        alert("As-salamu alaykum. Tuition payment receipt logged. Opening WhatsApp to notify school admin...");
        
        try {
          window.open(waUrl, "_blank");
        } catch (e) {
          window.location.href = waUrl;
        }

        setTimeout(() => {
          setPayReceiptSuccess(false);
        }, 5000);
      })
      .catch((err) => alert(`Submission Error: ${err.message}`));
  };

  // Post in forum
  const handlePostForum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newForumMsg.trim()) return;
    const token = localStorage.getItem("token") || "";

    fetch("/api/discussions/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseId: selectedCourse.id,
        content: newForumMsg
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setForumMessages([...forumMessages, data]);
        setNewForumMsg("");
      })
      .catch((err) => console.error(err));
  };

  // Direct messages sender
  const handleSendDM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !newDMMsg.trim()) return;
    const token = localStorage.getItem("token") || "";

    fetch("/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: activeContact.id,
        content: newDMMsg
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setDmHistory([...dmHistory, data]);
        setNewDMMsg("");
      })
      .catch((err) => console.error(err));
  };

  // --- TEACHER ACTIONS ---
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    const token = localStorage.getItem("token") || "";

    fetch(`/api/submissions/${gradingSubmission.id}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        score: gradingScore === "" ? 0 : gradingScore,
        comments: gradingComments
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(submissions.map(s => s.id === gradingSubmission.id ? data.submission : s));
        setGradingSubmission(null);
        setGradingScore("");
        setGradingComments("");
        alert("Grade and comments recorded successfully.");
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteSubmission = (id: string) => {
    if (!confirm("Are you sure you want to delete/reset this student's submission? This will allow them to re-take the CBT exam or re-submit their written worksheet.")) return;
    const token = localStorage.getItem("token") || "";

    fetch(`/api/submissions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.ok) {
          setSubmissions(submissions.filter(s => s.id !== id));
          alert("Submission was successfully deleted and reset!");
        } else {
          alert("Could not delete submission.");
        }
      })
      .catch((err) => console.error(err));
  };

  const handleManualGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualGradeStudentName || !manualGradeCourseId || !manualGradeReferenceTitle) {
      alert("Please fill in student name, course, and title.");
      return;
    }
    const token = localStorage.getItem("token") || "";

    fetch("/api/submissions/manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        studentName: manualGradeStudentName,
        courseId: manualGradeCourseId,
        type: manualGradeType,
        referenceTitle: manualGradeReferenceTitle,
        score: manualGradeScore === "" ? 0 : manualGradeScore,
        maxPoints: manualGradeMaxPoints === "" ? 10 : manualGradeMaxPoints,
        comments: manualGradeComments
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubmissions([data.submission, ...submissions]);
          setShowManualGradeForm(false);
          setManualGradeStudentName("");
          setManualGradeReferenceTitle("");
          setManualGradeScore("");
          setManualGradeMaxPoints("");
          setManualGradeComments("");
          alert("Manual grade logged successfully!");
        } else {
          alert("Error logging manual grade: " + (data.error || "Unknown"));
        }
      })
      .catch((err) => console.error(err));
  };

  const handleEditGradedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGradedSubmission) return;
    const token = localStorage.getItem("token") || "";

    fetch(`/api/submissions/${editingGradedSubmission.id}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        score: editGradedScore === "" ? 0 : editGradedScore,
        comments: editGradedComments
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubmissions(submissions.map(s => s.id === editingGradedSubmission.id ? data.submission : s));
          setEditingGradedSubmission(null);
          setEditGradedScore("");
          setEditGradedComments("");
          alert("Graded history updated successfully.");
        } else {
          alert("Error updating graded history.");
        }
      })
      .catch((err) => console.error(err));
  };

  const handlePostAttendance = (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";

    const promises = Object.entries(attendanceStatus).map(([studentId, status]) => {
      return fetch("/api/admin/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          courseId,
          date: attendanceDate,
          status
        })
      });
    });

    Promise.all(promises)
      .then(() => {
        alert("Attendance roster posted successfully into academic records.");
      })
      .catch((err) => console.error(err));
  };

  const handleCreateCourseMaterial = (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";

    const isEditing = editingMaterial && editingMaterial.courseId === courseId;
    const apiUrl = isEditing
      ? `/api/admin/courses/${courseId}/materials/${editingMaterial.type}/${editingMaterial.id}`
      : `/api/admin/courses/${courseId}/materials`;
    const method = isEditing ? "PUT" : "POST";

    const payload: any = {
      type: matType,
      title: matTitle,
      url: matUrl,
      description: matDesc,
      duration: matDurationOrSize,
      fileSize: matDurationOrSize,
      audioUrl: matAudioUrl,
      photos: matPhotos
    };

    if (matType === "assignment") {
      payload.points = Number(matDurationOrSize) || 50;
      if (matDueDate) {
        payload.dueDate = matDueDate;
      }
    }

    fetch(apiUrl, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Failed to save material"); });
        return res.json();
      })
      .then((data) => {
        setCourses(courses.map(c => c.id === courseId ? data.course : c));
        if (selectedCourse && selectedCourse.id === courseId) {
          setSelectedCourse(data.course); // Update selected course details view
        }
        setMatTitle("");
        setMatUrl("");
        setMatDesc("");
        setMatDurationOrSize("");
        setMatDueDate("");
        setMatAudioUrl(null);
        setMatPhotos([]);
        setEditingMaterial(null);
        alert(isEditing ? "Educational material updated successfully!" : "Educational material appended successfully!");
      })
      .catch((err) => {
        console.error(err);
        alert(`Error: ${err.message}`);
      });
  };

  // --- ADMIN ACTIONS ---
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";

    fetch("/api/admin/courses/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        level: newCourseLevel,
        title: newCourseTitle,
        description: newCourseDesc,
        duration: newCourseDuration,
        objectives: newCourseObjectives.split("\n").filter(o => o.trim())
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setCourses([...courses, data.course]);
        setNewCourseTitle("");
        setNewCourseDesc("");
        setNewCourseObjectives("");
        alert(`Course "${data.course.title}" successfully designed.`);
      })
      .catch((err) => console.error(err));
  };

  const handleAdminLockout = (studentId: string, isPaid: boolean) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/students/${studentId}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isPaid })
    })
      .then((res) => res.json())
      .then((data) => {
        setAllStudents(allStudents.map(s => s.id === studentId ? { ...s, isPaid: data.student.isPaid } : s));
        alert(isPaid ? "Student account unlocked! Paid courses authorized." : "Student account locked out due to pending payment.");
      })
      .catch((err) => console.error(err));
  };

  const handleAddStudentManually = (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentErrorMsg("");
    setAddStudentSuccessMsg("");

    const token = localStorage.getItem("token") || "";
    fetch("/api/admin/students/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: addStudentName,
        email: addStudentEmail,
        username: addStudentUsername,
        password: addStudentPassword,
        level: addStudentLevel,
        isPaid: addStudentIsPaid
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create student.");
        return data;
      })
      .then((data) => {
        setAllStudents([...allStudents, data.student]);
        setAddStudentSuccessMsg(`Student "${data.student.name}" successfully registered with username "${data.student.username}".`);
        // Reset form
        setAddStudentName("");
        setAddStudentEmail("");
        setAddStudentUsername("");
        setAddStudentPassword("");
        setAddStudentLevel("beginner");
        setAddStudentIsPaid(false);
        fetchAdmissionList();
      })
      .catch((err) => {
        setAddStudentErrorMsg(err.message);
      });
  };

  const handleUpdateStudentCredentials = (studentId: string) => {
    setEditStudentErrorMsg("");
    setEditStudentSuccessMsg("");

    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/students/${studentId}/update-credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: editStudentName,
        email: editStudentEmail,
        username: editStudentUsername,
        password: editStudentPassword || undefined,
        level: editStudentLevel
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update student.");
        return data;
      })
      .then((data) => {
        setAllStudents(allStudents.map(s => s.id === studentId ? { ...s, ...data.student } : s));
        setEditStudentSuccessMsg(`Student "${data.student.name}" credentials updated successfully.`);
        setEditStudentPassword(""); // clear password field
        fetchAdmissionList();
      })
      .catch((err) => {
        setEditStudentErrorMsg(err.message);
      });
  };

  // Helper function to compress images before converting to Base64 to prevent storage and network payload errors
  function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
      // If it's not an image, resolve with standard FileReader
      if (!file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  // Convert compressed base64 images into raw binary blobs for seamless high-performance upload
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // High-performance binary stream upload direct to server disk storage (supporting up to 150MB files)
  const uploadFileToServer = async (file: File | Blob, originalFilename?: string): Promise<string> => {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append("file", file);
    } else {
      formData.append("file", file, originalFilename || "upload.jpg");
    }

    const token = localStorage.getItem("token") || "";
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const handleFcCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setFcImageUrl(compressed);
    } catch (err) {
      console.error("Error compressing cover:", err);
    }
  };

  const handleFcAudioUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Warn if audio file is extremely large
    if (file.size > 15 * 1024 * 1024) {
      alert("⚠️ Warning: This audio file is very large (" + Math.round(file.size / 1024 / 1024) + "MB). For optimal streaming performance, we highly recommend uploading files under 10MB, or using an external stream URL.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...fcAudioFiles];
      updated[index].url = reader.result as string;
      setFcAudioFiles(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleSermonCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setNewSermonCoverUrl(compressed);
    } catch (err) {
      console.error("Error compressing sermon cover:", err);
    }
  };

  const handleSermonMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size for sermon media
    if (file.size > 20 * 1024 * 1024) {
      alert("❌ File Too Large: This video/audio file is " + Math.round(file.size / 1024 / 1024) + "MB. The server has a strict upload payload limit to prevent database synchronization timeouts. Please paste an external URL (e.g. YouTube Embed, SoundCloud, Google Drive) or compress your media file to under 15MB first.");
      return;
    } else if (file.size > 8 * 1024 * 1024) {
      alert("⚠️ Warning: This media file is " + Math.round(file.size / 1024 / 1024) + "MB. It may take some time to upload and synchronize with Supabase Cloud. For the best experience, we recommend using external YouTube embeds or audio links.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewSermonUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBookPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      alert("❌ PDF File Too Large: PDFs are strictly limited to under 150MB.");
      return;
    }

    setIsBookPdfUploading(true);
    setLibMessage("⏳ Uploading PDF directly to secure server storage...");
    try {
      const url = await uploadFileToServer(file);
      setNewBookDownloadUrl(url);
      setLibMessage("✓ PDF uploaded successfully to server!");
    } catch (err: any) {
      console.error("Error uploading book PDF:", err);
      setLibMessage(`❌ PDF upload failed: ${err.message}`);
    } finally {
      setIsBookPdfUploading(false);
    }
  };

  const handleBookCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBookCoverUploading(true);
    setLibMessage("⏳ Compressing and uploading cover image...");
    try {
      const compressed = await compressImage(file);
      const blob = dataURLtoBlob(compressed);
      const url = await uploadFileToServer(blob, file.name);
      setNewBookCoverUrl(url);
      setLibMessage("✓ Cover image uploaded successfully!");
    } catch (err: any) {
      console.error("Error compressing book cover:", err);
      setLibMessage(`❌ Cover upload failed: ${err.message}`);
    } finally {
      setIsBookCoverUploading(false);
    }
  };

  const handlePoemPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      alert("❌ PDF File Too Large: Poem PDFs are strictly limited to under 150MB.");
      return;
    }

    setIsPoemPdfUploading(true);
    setLibMessage("⏳ Uploading PDF directly to secure server storage...");
    try {
      const url = await uploadFileToServer(file);
      setNewPoemPdfUrl(url);
      setLibMessage("✓ Poem PDF uploaded successfully to server!");
    } catch (err: any) {
      console.error("Error uploading poem PDF:", err);
      setLibMessage(`❌ Poem PDF upload failed: ${err.message}`);
    } finally {
      setIsPoemPdfUploading(false);
    }
  };

  const handlePoemCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPoemCoverUploading(true);
    setLibMessage("⏳ Compressing and uploading illustration...");
    try {
      const compressed = await compressImage(file);
      const blob = dataURLtoBlob(compressed);
      const url = await uploadFileToServer(blob, file.name);
      setNewPoemCoverUrl(url);
      setLibMessage("✓ Poem illustration uploaded successfully!");
    } catch (err: any) {
      console.error("Error compressing poem cover:", err);
      setLibMessage(`❌ Illustration upload failed: ${err.message}`);
    } finally {
      setIsPoemCoverUploading(false);
    }
  };

  const startSermonRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setNewSermonUrl(base64Audio);
          setAudioBlobUrlSermon(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorderSermon(recorder);
      setIsRecordingSermon(true);
      setRecordingSecondsSermon(0);

      // We need to keep track of a local mutable variable inside the setInterval scope
      // because React state updates are asynchronous and the closure would capture 0.
      let secondsTracked = 0;
      const interval = setInterval(() => {
        secondsTracked += 1;
        setRecordingSecondsSermon(secondsTracked);
      }, 1000);
      setRecordingIntervalIdSermon(interval);
    } catch (err) {
      alert("Microphone access denied or not supported in this browser.");
      console.error(err);
    }
  };

  const stopSermonRecording = () => {
    if (mediaRecorderSermon && isRecordingSermon) {
      mediaRecorderSermon.stop();
      setIsRecordingSermon(false);
      if (recordingIntervalIdSermon) {
        clearInterval(recordingIntervalIdSermon);
        setRecordingIntervalIdSermon(null);
      }
      // Calculate duration from the actual recorded state seconds
      const mins = Math.floor(recordingSecondsSermon / 60);
      const secs = recordingSecondsSermon % 60;
      setNewSermonDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
    }
  };

  const cancelSermonRecording = () => {
    if (mediaRecorderSermon) {
      try {
        mediaRecorderSermon.stop();
      } catch (e) {}
    }
    setIsRecordingSermon(false);
    setAudioBlobUrlSermon(null);
    setNewSermonUrl("");
    if (recordingIntervalIdSermon) {
      clearInterval(recordingIntervalIdSermon);
      setRecordingIntervalIdSermon(null);
    }
    setRecordingSecondsSermon(0);
  };

  const handleSaveFreeCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setFcSaving(true);
    setFcMessage("");
    const token = localStorage.getItem("token") || "";

    const payload = {
      title: fcTitle,
      description: fcDescription,
      imageUrl: fcImageUrl,
      poemArabicText: fcVerses.map(v => v.arabic),
      poemTranslationText: fcVerses.map(v => v.translation),
      audioFiles: fcAudioFiles,
      questions: fcQuestions,
      passingScore: fcPassingScore
    };

    fetch("/api/admin/free-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        setFcSaving(false);
        if (data.success) {
          setFcMessage("🎉 Free Course settings updated successfully!");
          setTimeout(() => setFcMessage(""), 4000);
        } else {
          setFcMessage("❌ Failed to update Free Course: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        setFcSaving(false);
        setFcMessage("❌ Network error saving Free Course");
        console.error(err);
      });
  };

  const handleSaveAboutUs = (e: React.FormEvent) => {
    e.preventDefault();
    setAboutUsSaving(true);
    setAboutUsMessage("");
    const token = localStorage.getItem("token") || "";

    const payload = {
      historyEn: aboutUsHistoryEn,
      historyAr: aboutUsHistoryAr,
      founderBioEn: aboutUsFounderBioEn,
      founderBioAr: aboutUsFounderBioAr,
      values: aboutUsValues,
      faqs: aboutUsFaqs
    };

    fetch("/api/admin/about", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        setAboutUsSaving(false);
        if (data.success) {
          setAboutUsMessage("🎉 About Us & FAQ Settings saved successfully!");
          setTimeout(() => setAboutUsMessage(""), 4500);
        } else {
          setAboutUsMessage("❌ Error: " + (data.error || "Failed to update About Us"));
        }
      })
      .catch((err) => {
        setAboutUsSaving(false);
        setAboutUsMessage("❌ Network error saving About Us");
        console.error(err);
      });
  };

  const handleSaveCurriculumSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrSaving(true);
    setCurrMessage("");
    const token = localStorage.getItem("token") || "";

    const payload = {
      whyEnroll: currWhyEnroll,
      sections: currSections,
      featuredCourses: currFeaturedCourses
    };

    fetch("/api/admin/curriculum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrSaving(false);
        if (data.success) {
          setCurrMessage("🎉 Curriculum Settings saved successfully!");
          setTimeout(() => setCurrMessage(""), 4500);
        } else {
          setCurrMessage("❌ Error: " + (data.error || "Failed to update Curriculum"));
        }
      })
      .catch((err) => {
        setCurrSaving(false);
        setCurrMessage("❌ Network error saving Curriculum");
        console.error(err);
      });
  };

  const handleSaveSermon = (e: React.FormEvent) => {
    e.preventDefault();
    setSermonSaving(true);
    setSermonMessage("");
    const token = localStorage.getItem("token") || "";

    // Append new sermon if fields are set
    let updatedSermons = [...sermons];
    if (newSermonTitle && newSermonUrl) {
      const isAudioSermon = newSermonUrl.startsWith("data:audio") || newSermonUrl.includes(".mp3") || newSermonUrl.includes(".wav") || !!audioBlobUrlSermon;
      const newSermon = {
        id: "sermon-" + Date.now(),
        title: newSermonTitle,
        category: newSermonCategory,
        duration: newSermonDuration || "15 mins",
        url: newSermonUrl,
        speaker: newSermonSpeaker,
        coverUrl: newSermonCoverUrl || "",
        isAudio: isAudioSermon
      };
      updatedSermons = [...updatedSermons, newSermon];
    }

    fetch("/api/admin/sermons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sermons: updatedSermons })
    })
      .then((res) => res.json())
      .then((data) => {
        setSermonSaving(false);
        if (data.success) {
          setSermons(data.sermons || updatedSermons);
          setNewSermonTitle("");
          setNewSermonUrl("");
          setNewSermonDuration("");
          setNewSermonCoverUrl("");
          setAudioBlobUrlSermon(null);
          setSermonMessage("🎉 Sermon TV list saved successfully!");
          setTimeout(() => setSermonMessage(""), 4500);
        } else {
          setSermonMessage("❌ Error: " + (data.error || "Failed to update Sermons"));
        }
      })
      .catch((err) => {
        setSermonSaving(false);
        setSermonMessage("❌ Network error saving Sermons");
        console.error(err);
      });
  };

  const handleDeleteSermon = (id: string) => {
    const updatedSermons = sermons.filter(s => s.id !== id);
    const token = localStorage.getItem("token") || "";
    setSermonSaving(true);

    fetch("/api/admin/sermons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sermons: updatedSermons })
    })
      .then((res) => res.json())
      .then((data) => {
        setSermonSaving(false);
        if (data.success) {
          setSermons(data.sermons || updatedSermons);
          setSermonMessage("🗑️ Sermon deleted successfully!");
          setTimeout(() => setSermonMessage(""), 4500);
        }
      })
      .catch((err) => {
        setSermonSaving(false);
        console.error(err);
      });
  };

  const handleSaveDonationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setDonSaving(true);
    setDonMessage("");
    const token = localStorage.getItem("token") || "";

    const payload = {
      targetTitle: donTargetTitle,
      targetDescription: donTargetDescription,
      targetAmount: Number(donTargetAmount),
      raisedAmount: Number(donRaisedAmount),
      accountNumber: donAccountNumber,
      accountName: donAccountName,
      bank: donBank
    };

    fetch("/api/admin/donation-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        setDonSaving(false);
        if (data.success) {
          setDonMessage("🎉 Donation settings updated successfully!");
          setTimeout(() => setDonMessage(""), 4500);
        } else {
          setDonMessage("❌ Error: " + (data.error || "Failed to save donation settings"));
        }
      })
      .catch((err) => {
        setDonSaving(false);
        setDonMessage("❌ Network error saving Donation Settings");
        console.error(err);
      });
  };

  const handleRegisterTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setTchLoading(true);
    setTchError("");
    setTchSuccess("");
    setTchRegisteredId("");

    // Local validation
    if (!tchName.trim() || !tchEmail.trim() || !tchUsername.trim() || !tchPassword.trim()) {
      setTchError("Please fill out all required fields.");
      setTchLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tchEmail)) {
      setTchError("Please enter a valid email address.");
      setTchLoading(false);
      return;
    }

    if (tchPassword !== tchConfirmPassword) {
      setTchError("Password and Confirm Password do not match.");
      setTchLoading(false);
      return;
    }

    const token = localStorage.getItem("token") || "";

    const payload = {
      name: tchName,
      email: tchEmail,
      phone: tchPhone,
      gender: tchGender,
      profilePic: tchProfilePic,
      subjects: tchSubjects,
      assignedClass: tchClass,
      qualification: tchQualification,
      bio: tchBio,
      username: tchUsername,
      password: tchPassword,
      confirmPassword: tchConfirmPassword,
    };

    fetch("/api/admin/register-teacher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to register teacher");
          });
        }
        return res.json();
      })
      .then((data) => {
        setTchLoading(false);
        if (data.success) {
          setTchSuccess(data.message || `Teacher successfully registered!`);
          setTchRegisteredId(data.teacher.teacherId);
          // Reset form fields
          setTchName("");
          setTchEmail("");
          setTchPhone("");
          setTchGender("male");
          setTchProfilePic("");
          setTchSubjects("");
          setTchClass("beginner");
          setTchQualification("");
          setTchBio("");
          setTchUsername("");
          setTchPassword("");
          setTchConfirmPassword("");
        } else {
          setTchError(data.error || "Failed to register teacher.");
        }
      })
      .catch((err) => {
        setTchLoading(false);
        setTchError(err.message || "Network error registering teacher.");
      });
  };

  const handleAddLibraryBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      setLibMessage("⚠️ Title and Author are required fields to register a book!");
      return;
    }
    setLibSaving(true);
    setLibMessage("");
    const token = localStorage.getItem("token") || "";

    const payload = {
      title: newBookTitle,
      author: newBookAuthor,
      category: newBookCategory,
      description: newBookDesc,
      coverUrl: newBookCoverUrl,
      downloadUrl: newBookDownloadUrl
    };

    if (editingBookId) {
      fetch(`/api/admin/books/${editingBookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          setLibSaving(false);
          if (data.success) {
            setLibraryBooks(libraryBooks.map(b => b.id === editingBookId ? data.book : b));
            setNewBookTitle("");
            setNewBookAuthor("");
            setNewBookDesc("");
            setNewBookCoverUrl("");
            setNewBookDownloadUrl("");
            setEditingBookId(null);
            setLibMessage("📚 Book updated successfully!");
            setTimeout(() => setLibMessage(""), 4500);
          } else {
            setLibMessage("❌ Failed to update book: " + (data.error || "Unknown error"));
          }
        })
        .catch((err) => {
          setLibSaving(false);
          setLibMessage("❌ Network error updating book");
          console.error(err);
        });
    } else {
      fetch("/api/admin/books/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          setLibSaving(false);
          if (data.success) {
            setLibraryBooks([...libraryBooks, data.book]);
            setNewBookTitle("");
            setNewBookAuthor("");
            setNewBookDesc("");
            setNewBookCoverUrl("");
            setNewBookDownloadUrl("");
            setLibMessage("📚 Book added to library successfully!");
            setTimeout(() => setLibMessage(""), 4500);
          } else {
            setLibMessage("❌ Failed to add book: " + (data.error || "Unknown error"));
          }
        })
        .catch((err) => {
          setLibSaving(false);
          setLibMessage("❌ Network error adding book");
          console.error(err);
        });
    }
  };

  const startEditBook = (book: any) => {
    setEditingBookId(book.id);
    setNewBookTitle(book.title);
    setNewBookAuthor(book.author);
    setNewBookCategory(book.category || "Hadith");
    setNewBookDesc(book.description || "");
    setNewBookCoverUrl(book.coverUrl || "");
    setNewBookDownloadUrl(book.downloadUrl || "");
    const element = document.getElementById("admin-book-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookDesc("");
    setNewBookCoverUrl("");
    setNewBookDownloadUrl("");
  };

  const handleDeleteLibraryBook = (id: string) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/books/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(() => {
        setLibraryBooks(libraryBooks.filter(b => b.id !== id));
        if (editingBookId === id) {
          cancelEditBook();
        }
        setLibMessage("🗑️ Book removed from library");
        setTimeout(() => setLibMessage(""), 4500);
      })
      .catch((err) => console.error(err));
  };

  const handleAddLibraryPoem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoemTitle.trim() || !newPoemPoet.trim()) {
      setLibMessage("⚠️ Title and Poet Name are required fields to register a poem!");
      return;
    }
    setLibSaving(true);
    setLibMessage("");
    const token = localStorage.getItem("token") || "";

    const payload = {
      title: newPoemTitle,
      poetName: newPoemPoet,
      biography: newPoemBio,
      category: newPoemCategory,
      arabicText: newPoemArabicText.split("\n").filter(line => line.trim()),
      translationText: newPoemTranslationText.split("\n").filter(line => line.trim()),
      pdfUrl: newPoemPdfUrl,
      coverUrl: newPoemCoverUrl
    };

    if (editingPoemId) {
      fetch(`/api/admin/poems/${editingPoemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          setLibSaving(false);
          if (data.success) {
            setLibraryPoems(libraryPoems.map(p => p.id === editingPoemId ? data.poem : p));
            setNewPoemTitle("");
            setNewPoemPoet("");
            setNewPoemBio("");
            setNewPoemArabicText("");
            setNewPoemTranslationText("");
            setNewPoemPdfUrl("");
            setNewPoemCoverUrl("");
            setEditingPoemId(null);
            setLibMessage("📜 Poem updated successfully!");
            setTimeout(() => setLibMessage(""), 4500);
          } else {
            setLibMessage("❌ Failed to update poem: " + (data.error || "Unknown error"));
          }
        })
        .catch((err) => {
          setLibSaving(false);
          setLibMessage("❌ Network error updating poem");
          console.error(err);
        });
    } else {
      fetch("/api/admin/poems/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          setLibSaving(false);
          if (data.success) {
            setLibraryPoems([...libraryPoems, data.poem]);
            setNewPoemTitle("");
            setNewPoemPoet("");
            setNewPoemBio("");
            setNewPoemArabicText("");
            setNewPoemTranslationText("");
            setNewPoemPdfUrl("");
            setNewPoemCoverUrl("");
            setLibMessage("📜 Poem added to library successfully!");
            setTimeout(() => setLibMessage(""), 4500);
          } else {
            setLibMessage("❌ Failed to add poem: " + (data.error || "Unknown error"));
          }
        })
        .catch((err) => {
          setLibSaving(false);
          setLibMessage("❌ Network error adding poem");
          console.error(err);
        });
    }
  };

  const startEditPoem = (poem: any) => {
    setEditingPoemId(poem.id);
    setNewPoemTitle(poem.title);
    setNewPoemPoet(poem.poetName);
    setNewPoemBio(poem.biography || poem.biography || "");
    setNewPoemCategory(poem.category || "Aqeedah");
    setNewPoemArabicText(poem.arabicText ? poem.arabicText.join("\n") : "");
    setNewPoemTranslationText(poem.translationText ? poem.translationText.join("\n") : "");
    setNewPoemPdfUrl(poem.pdfUrl || "");
    setNewPoemCoverUrl(poem.coverUrl || "");
    const element = document.getElementById("admin-poem-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEditPoem = () => {
    setEditingPoemId(null);
    setNewPoemTitle("");
    setNewPoemPoet("");
    setNewPoemBio("");
    setNewPoemArabicText("");
    setNewPoemTranslationText("");
    setNewPoemPdfUrl("");
    setNewPoemCoverUrl("");
  };

  const handleDeleteLibraryPoem = (id: string) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/poems/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(() => {
        setLibraryPoems(libraryPoems.filter(p => p.id !== id));
        if (editingPoemId === id) {
          cancelEditPoem();
        }
        setLibMessage("🗑️ Poem removed from library");
        setTimeout(() => setLibMessage(""), 4500);
      })
      .catch((err) => console.error(err));
  };

  const fetchAdmissionList = () => {
    if (!currentUser) return;
    setAdmissionLoading(true);
    setAdmissionError("");
    const token = localStorage.getItem("token") || "";
    fetch("/api/admin/admission-list", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load admission list.");
        return data;
      })
      .then((data) => {
        setAdmissionList(data);
        setAdmissionLoading(false);
      })
      .catch((err) => {
        setAdmissionError(err.message);
        setAdmissionLoading(false);
      });
  };

  const handleDeleteProfile = (id: string, name: string, role: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the ${role} profile of "${name}"? This action cannot be undone.`)) {
      return;
    }
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/profiles/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(`Success: ${data.message || "Profile deleted."}`);
          fetchAdmissionList();
        } else {
          alert(`Error: ${data.error || "Failed to delete profile."}`);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to delete profile due to a network error.");
      });
  };

  const handleDeleteFcEnrollment = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the free course learning record of "${name}"? This action cannot be undone.`)) {
      return;
    }
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/free-course/enrollments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Learning record deleted successfully.");
          setFcEnrollments(prev => prev.filter(e => e.id !== id));
        } else {
          alert(`Error: ${data.error || "Failed to delete record."}`);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to delete record due to a network error.");
      });
  };

  useEffect(() => {
    if ((teacherSubTab === "admissions" || adminSubTab === "admissions") && currentUser) {
      fetchAdmissionList();
    }
  }, [teacherSubTab, adminSubTab, currentUser]);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";

    fetch("/api/admin/announcements/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: annTitle,
        content: annContent,
        targetRole: annTarget
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements([data.announcement, ...announcements]);
        setAnnTitle("");
        setAnnContent("");
        alert("Academic announcement broadcast successfully.");
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteAnnouncement = (id: string) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(() => {
        setAnnouncements(announcements.filter(a => a.id !== id));
        alert("Announcement deleted successfully.");
      })
      .catch((err) => console.error(err));
  };

  const handleUpdateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";
    fetch("/api/admin/quote/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        arabic: quoteArabic,
        translation: quoteTranslation,
        source: quoteSource
      })
    })
      .then((res) => res.json())
      .then(() => {
        alert("Weekly Quote updated successfully!");
      })
      .catch((err) => console.error(err));
  };

  const handleCreateCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";
    fetch("/api/admin/calendar/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: newCalTitle,
        description: newCalDesc,
        date: newCalDate,
        type: newCalType
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setCalendarEvents([...calendarEvents, data.event]);
        setNewCalTitle("");
        setNewCalDesc("");
        setNewCalDate("");
        alert("Calendar event created successfully!");
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteCalendarEvent = (id: string) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/calendar/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(() => {
        setCalendarEvents(calendarEvents.filter(e => e.id !== id));
        alert("Calendar event deleted successfully.");
      })
      .catch((err) => console.error(err));
  };

  const handleCreateTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";
    fetch("/api/admin/testimonials/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newTestName,
        role: newTestRole,
        content: newTestContent,
        rating: newTestRating
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setAllTestimonials([...allTestimonials, data.testimonial]);
        setNewTestName("");
        setNewTestRole("");
        setNewTestContent("");
        alert("Community Testimonial added successfully!");
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteTestimonial = (id: string) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/testimonials/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(() => {
        setAllTestimonials(allTestimonials.filter(t => t.id !== id));
        alert("Testimonial deleted successfully.");
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteCourseMaterial = (courseId: string, type: string, materialId: string) => {
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/courses/${courseId}/materials/${type}/${materialId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Failed to delete course material"); });
        return res.json();
      })
      .then((data) => {
        if (!data.course) {
          throw new Error("No course data returned from server");
        }
        setCourses(courses.map(c => c.id === courseId ? data.course : c));
        if (selectedCourse && selectedCourse.id === courseId) {
          setSelectedCourse(data.course);
        }
        alert("Material deleted successfully!");
      })
      .catch((err) => {
        console.error(err);
        alert(`Error deleting material: ${err.message}`);
      });
  };

  const handleStartEditMaterial = (courseId: string, type: 'video' | 'pdf' | 'assignment', item: any) => {
    setIsCreatingQuiz(false);
    setIsEditingQuiz(null);
    setEditingMaterial({ type, id: item.id, courseId });
    setMatType(type);
    setMatTitle(item.title || "");
    setMatUrl(item.url || "");
    setMatDesc(item.description || "");
    setMatAudioUrl(item.audioUrl || null);
    setMatPhotos(item.photos || []);
    if (type === "video") {
      setMatDurationOrSize(item.duration || "");
      setMatDueDate("");
    } else if (type === "pdf") {
      setMatDurationOrSize(item.fileSize || "");
      setMatDueDate("");
    } else if (type === "assignment") {
      setMatDurationOrSize(item.points ? String(item.points) : "50");
      setMatDueDate(item.dueDate || "");
    }
  };

  const handleCreateOrUpdateQuiz = (courseId: string) => {
    if (!quizEditTitle.trim()) {
      alert("Please enter a quiz title.");
      return;
    }
    if (quizEditQuestions.length === 0) {
      alert("Please add at least one question to the CBT quiz.");
      return;
    }
    const token = localStorage.getItem("token") || "";
    const isEdit = !!isEditingQuiz;
    const url = isEdit
      ? `/api/admin/courses/${courseId}/quizzes/${isEditingQuiz.id}`
      : `/api/admin/courses/${courseId}/quizzes`;
    
    fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: quizEditTitle,
        durationMinutes: Number(quizEditDuration) || 10,
        questions: quizEditQuestions,
        limitQuestions: quizEditLimitQuestions === "" ? null : Number(quizEditLimitQuestions),
        automaticMarking: quizEditAutomaticMarking,
        examDate: quizEditExamDate || null
      })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        return res.json();
      })
      .then((data) => {
        setCourses(courses.map(c => c.id === courseId ? data.course : c));
        alert(isEdit ? "CBT Quiz updated successfully!" : "New CBT Quiz created successfully!");
        // Reset state
        setIsCreatingQuiz(false);
        setIsEditingQuiz(null);
        setQuizEditTitle("");
        setQuizEditDuration(10);
        setQuizEditQuestions([]);
        setQuizEditLimitQuestions("");
        setQuizEditAutomaticMarking(true);
        setQuizEditExamDate("");
      })
      .catch((err) => alert(`Error saving quiz: ${err.message}`));
  };

  const handleDeleteQuiz = (courseId: string, quizId: string) => {
    if (!confirm("Are you sure you want to permanently delete this CBT quiz?")) return;
    const token = localStorage.getItem("token") || "";
    fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        return res.json();
      })
      .then((data) => {
        setCourses(courses.map(c => c.id === courseId ? data.course : c));
        if (selectedCourse && selectedCourse.id === courseId) {
          setSelectedCourse(data.course);
        }
        alert("CBT Quiz deleted successfully!");
      })
      .catch((err) => alert(`Error deleting quiz: ${err.message}`));
  };


  // --- VIEW RENDER HELPERS ---

  // Auth Layout (Login / Register / Forgot Password)
  if (!currentUser) {
    return (
      <div id="auth-portal" className="max-w-md mx-auto my-16 bg-white dark:bg-natural-dark rounded-3xl border border-emerald-50 dark:border-emerald-900/40 p-8 shadow-sm space-y-6 animate-fade-in">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-natural-green mx-auto flex items-center justify-center border border-natural-gold">
            <Shield className="w-5 h-5 text-natural-gold" />
          </div>
          <h2 className="text-xl font-serif font-light text-natural-green dark:text-amber-100">
            {showForgot
              ? isArabic ? "استعادة كلمة المرور" : "Recover Credentials"
              : isRegistering
              ? isArabic ? "تسجيل طالب جديد" : "Student Admissions Form"
              : isArabic ? "بوابة تسجيل الدخول" : "Secure Portal Login"}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-emerald-350 tracking-wider font-sans">
            {isRegistering
              ? isArabic ? "ابدأ رحلة طلب العلم الشرعي اليوم" : "Enroll as a registered student"
              : isArabic ? "أدخل بياناتك لتصفح لوحتك الدراسية" : "Enter your Madrasah credentials"}
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-850 rounded border border-emerald-200 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {showForgot ? (
          <div className="space-y-4">
            {!forgotResult ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-700 dark:text-amber-100 font-bold uppercase tracking-wider block">
                    USERNAME, EMAIL, OR WHATSAPP
                  </span>
                  <input
                    type="text"
                    placeholder="Enter registered username, email or WhatsApp"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  {forgotLoading ? "Locating Account..." : "Locate My Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setAuthError("");
                    setSuccessMsg("");
                    setForgotIdentifier("");
                    setForgotResult(null);
                  }}
                  className="w-full text-center text-xs text-emerald-650 dark:text-amber-150 hover:text-emerald-800 font-semibold"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-150 rounded-xl space-y-3">
                  <div className="border-b border-emerald-100 pb-2">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Account Found</span>
                    <h4 className="font-bold text-sm text-emerald-950 dark:text-white">{forgotResult.name}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-500/10 text-amber-650 border border-amber-500/20 rounded text-[9px] font-bold uppercase">
                      {forgotResult.role}
                    </span>
                  </div>

                  <div className="space-y-2 font-sans">
                    <div className="flex justify-between items-center bg-white dark:bg-emerald-900/10 p-2 rounded border border-emerald-100/30">
                      <div>
                        <span className="text-[9px] text-slate-400 block">USERNAME</span>
                        <code className="text-xs font-bold text-emerald-950 dark:text-white font-mono">{forgotResult.username}</code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(forgotResult.username);
                          alert("Username copied to clipboard!");
                        }}
                        className="text-[10px] text-amber-600 font-semibold hover:underline"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-white dark:bg-emerald-900/10 p-2 rounded border border-emerald-100/30">
                      <div>
                        <span className="text-[9px] text-slate-400 block">PASSWORD</span>
                        <code className="text-xs font-bold text-emerald-950 dark:text-white font-mono">{forgotResult.plainPassword}</code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(forgotResult.plainPassword);
                          alert("Password copied to clipboard!");
                        }}
                        className="text-[10px] text-amber-600 font-semibold hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-700 dark:text-amber-100 font-bold uppercase tracking-wider block">
                    YOUR WHATSAPP NUMBER
                  </span>
                  <input
                    type="text"
                    placeholder="e.g., 2348012345678"
                    value={forgotWhatsapp}
                    onChange={(e) => setForgotWhatsapp(e.target.value)}
                    className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono"
                  />
                  <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                    Enter WhatsApp number with country code (e.g. 234 for Nigeria, or 080... format will auto-convert).
                  </p>
                </div>

                <a
                  href={getWhatsAppLink(forgotResult, forgotWhatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors text-center shadow-xs cursor-pointer"
                >
                  <span>📩 Send to WhatsApp</span>
                </a>

                <div className="flex gap-2.5 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotResult(null);
                      setSuccessMsg("");
                      setAuthError("");
                    }}
                    className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/20 text-slate-500 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setAuthError("");
                      setSuccessMsg("");
                      setForgotIdentifier("");
                      setForgotResult(null);
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : isRegistering ? (
          /* Student Admissions / Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">YOUR FULL NAME</span>
                <input
                  type="text"
                  placeholder="e.g., Yahya Ibn Sharaf"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    const cleanName = e.target.value.replace(/\s+/g, "").toLowerCase();
                    setRegUsername(cleanName);
                    setRegPassword(`${cleanName}@123`);
                  }}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">EMAIL ADDRESS</span>
                <input
                  type="email"
                  placeholder="yahya@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">WHATSAPP NUMBER</span>
                <input
                  type="tel"
                  placeholder="e.g., 08122455759"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">CHOOSE USERNAME</span>
                <input
                  type="text"
                  placeholder="e.g. yahya"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">SECURE PASSWORD</span>
                <input
                  type="text"
                  placeholder="e.g. yahya@123"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">DATE OF BIRTH</span>
                <input
                  type="date"
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">COUNTRY</span>
                <input
                  type="text"
                  placeholder="Nigeria"
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">STATE</span>
                <input
                  type="text"
                  placeholder="Kwara"
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  required
                  className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">WHY DO YOU WANT TO JOIN THE MADRASAH?</span>
              <textarea
                placeholder="Briefly share your motivations and goals for enrolling in our Islamic studies modules..."
                value={regWhyJoin}
                onChange={(e) => setRegWhyJoin(e.target.value)}
                required
                rows={2}
                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">PAYMENT MODE</span>
                <select
                  value={regPaymentMode}
                  onChange={(e) => setRegPaymentMode(e.target.value)}
                  className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-900 dark:text-white font-semibold"
                >
                  <option value="Opay">Opay (Admin Account: 812245759)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">ACADEMIC LEVEL</span>
                <div className="w-full bg-emerald-100/40 dark:bg-emerald-950/30 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-800 dark:text-natural-gold font-bold flex items-center justify-center gap-1">
                  <span>Beginner Level Class (Mandatory Start)</span>
                </div>
              </div>
            </div>

            {/* DRAG AND DROP FILE UPLOAD AREA */}
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">UPLOAD TRANSFER RECEIPT</span>
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-emerald-250 dark:border-emerald-800 hover:border-amber-500 transition-colors rounded-xl p-4 text-center cursor-pointer relative bg-emerald-50/20 dark:bg-emerald-950/10"
              >
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleReceiptChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required={!regReceiptUrl}
                />
                
                {isReceiptUploading ? (
                  <p className="text-xs text-slate-400 animate-pulse">Processing receipt file...</p>
                ) : regReceiptUrl ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">✓ Receipt Loaded Successfully</p>
                    {regReceiptUrl.startsWith("data:image/") ? (
                      <img src={regReceiptUrl} alt="Receipt preview" className="h-16 mx-auto object-contain rounded border" />
                    ) : (
                      <span className="text-xs text-slate-500">File Selected (Click/Drag to replace)</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-900 dark:text-emerald-150 font-semibold">
                      Drag & Drop your payment receipt here, or <span className="text-amber-650 font-bold">Browse</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Supported formats: JPG, PNG, PDF (Max 2MB)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer hover:scale-[1.01]"
            >
              Submit Admissions & Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setAuthError(""); }}
              className="w-full text-center text-xs text-emerald-650 hover:text-emerald-800 transition-colors"
            >
              Already Registered? Login Instead
            </button>
          </form>
        ) : (
          /* Secure Login form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">USERNAME</span>
              <input
                type="text"
                placeholder="e.g., Student / Teacher / Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">PASSWORD</span>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[10px] text-amber-600 hover:text-amber-700"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                placeholder="e.g. Student@123 / Teacher@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs hover:scale-[1.01] transition-all"
            >
              Sign In to Madrasah
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setAuthError(""); }}
              className="w-full text-center text-xs text-emerald-650 hover:text-emerald-800"
            >
              New Student? Admissions Registration
            </button>

            {/* Quick Helper Credentials Banner for Dev */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-250 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <span className="font-bold">Demonstration Credentials:</span>
              <div className="grid grid-cols-2 gap-1 font-mono">
                <div>Admin:</div><div>Admin / Ridwanullah@123</div>
                <div>Teacher:</div><div>Teacher / Teacher@123</div>
                <div>Student (Unpaid):</div><div>LockedStudent / Student@123</div>
                <div>Student (Paid):</div><div>Student / Student@123</div>
              </div>
            </div>
          </form>
        )}
      </div>
    );
  }

  const renderAdmissionListTab = () => {
    const filteredList = admissionList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(admissionSearch.toLowerCase()) ||
        item.username.toLowerCase().includes(admissionSearch.toLowerCase()) ||
        item.email.toLowerCase().includes(admissionSearch.toLowerCase());
      const matchRole =
        admissionRoleFilter === "all" || item.role === admissionRoleFilter;
      return matchSearch && matchRole;
    });

    const handleCopy = (item: any) => {
      const text = `Name: ${item.name}\nRole: ${item.role.toUpperCase()}\nUsername: ${item.username}\nPassword: ${item.plainPassword}`;
      navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    };

    const togglePasswordVisibility = (id: string) => {
      setShowPasswordMap((prev) => ({
        ...prev,
        [id]: !prev[id]
      }));
    };

    return (
      <div className="space-y-6 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Official Academic Admissions & Credentials List</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              List of all officially registered student and teacher profiles with active login credentials. Ideal for onboarding distribution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-emerald-800/60 dark:hover:bg-emerald-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              {showAllPasswords ? "🙈 Conceal All Passwords" : "👀 Reveal All Passwords"}
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              Print List (PDF)
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 flex flex-wrap gap-1 bg-slate-100 dark:bg-emerald-950/45 p-1 rounded-xl border border-slate-200/50 dark:border-emerald-800/40">
            <button
              type="button"
              onClick={() => setAdmissionRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                admissionRoleFilter === "all"
                  ? "bg-white dark:bg-emerald-800 text-emerald-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              All Accounts ({admissionList.length})
            </button>
            <button
              type="button"
              onClick={() => setAdmissionRoleFilter("student")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                admissionRoleFilter === "student"
                  ? "bg-white dark:bg-emerald-800 text-emerald-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              Students ({admissionList.filter((u) => u.role === "student").length})
            </button>
            <button
              type="button"
              onClick={() => setAdmissionRoleFilter("teacher")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                admissionRoleFilter === "teacher"
                  ? "bg-white dark:bg-emerald-800 text-emerald-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              Teachers ({admissionList.filter((u) => u.role === "teacher").length})
            </button>
          </div>

          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={admissionSearch}
              onChange={(e) => setAdmissionSearch(e.target.value)}
              className="w-full bg-white dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800 p-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white font-sans"
            />
          </div>
        </div>

        {/* Admission Error/Loading State */}
        {admissionLoading ? (
          <div className="p-12 text-center text-emerald-600 font-bold text-xs animate-pulse">
            Generating Secure Admission Database Roster...
          </div>
        ) : admissionError ? (
          <div className="p-6 bg-red-500/10 text-red-600 rounded-xl text-center font-medium text-xs">
            {admissionError}
          </div>
        ) : (
          <div className="bg-white dark:bg-emerald-900 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-emerald-950 border-b border-emerald-50 dark:border-emerald-800 text-emerald-950 dark:text-amber-100 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-4">Full Name & ID</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Level / Class</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Password</th>
                    <th className="p-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/15">
                  {filteredList.map((item) => {
                    const isPasswordVisible = showAllPasswords || showPasswordMap[item.id];
                    const isExpanded = expandedStudentId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={() => { if (item.role === 'student') setExpandedStudentId(isExpanded ? null : item.id); }}
                          className={`hover:bg-slate-50/50 dark:hover:bg-emerald-850/20 text-emerald-850 dark:text-emerald-100 transition-colors ${item.role === 'student' ? 'cursor-pointer' : ''}`}
                        >
                          <td className="p-3.5 pl-4">
                            <div className="flex items-center gap-2">
                              {item.role === "student" && (
                                <span className="text-[10px] text-slate-400 select-none">
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                              )}
                              <div>
                                <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                  <span>{item.name}</span>
                                  {item.role === "student" && (item.receiptUrl || item.dob) && (
                                    <span className="text-[8px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold font-sans uppercase tracking-wider shrink-0">
                                      Admissions Portfolio
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.role === "teacher" 
                                ? "bg-amber-100 text-amber-800 border border-amber-200" 
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {item.role === "student" ? (
                              <span className="font-medium text-[11px] capitalize">{item.level || "beginner"}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-300 font-sans text-[11px]">
                            {item.email}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] font-semibold tracking-wide text-slate-800 dark:text-white">
                            {item.username}
                          </td>
                          <td className="p-3.5 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5 font-sans" onClick={(e) => e.stopPropagation()}>
                              <span className="font-semibold select-all text-emerald-700 dark:text-amber-300">
                                {isPasswordVisible ? item.plainPassword : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(item.id)}
                                className="text-slate-400 hover:text-emerald-600 transition-all cursor-pointer p-0.5 rounded text-[10px]"
                              >
                                {isPasswordVisible ? "Hide" : "Show"}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(item)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  copiedId === item.id
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 dark:bg-emerald-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <span>Copy</span>
                                )}
                              </button>
                              {currentUser?.role === "admin" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProfile(item.id, item.name, item.role)}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-bold text-[10px] rounded transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Delete Profile"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && item.role === "student" && (
                          <tr className="bg-emerald-50/10 dark:bg-emerald-950/20">
                            <td colSpan={7} className="p-6 pl-8 border-l-4 border-amber-500 text-left">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-sans">
                                
                                {/* ADMISSIONS METADATA COLUMN */}
                                <div className="md:col-span-7 space-y-4">
                                  <h4 className="font-serif font-bold text-natural-green dark:text-amber-100 border-b border-emerald-50 dark:border-emerald-900/30 pb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <span>Admissions Portfolio Details</span>
                                  </h4>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">DATE OF BIRTH</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-100">{item.dob || "Not specified"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">LOCATION</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                                        {item.state ? `${item.state}, ` : ""}{item.country || "Not specified"}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">PAYMENT MODE</span>
                                      <span className="font-bold text-emerald-800 dark:text-natural-gold">{item.paymentMode || "Opay (Admin Account 812245759)"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">STARTING ACADEMIC PLACEMENT</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">{item.level || "beginner"} Class</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">WHY JOIN THE MADRASAH</span>
                                    <p className="text-slate-650 dark:text-emerald-300 italic text-xs leading-relaxed mt-1 bg-white dark:bg-natural-dark/40 p-3 rounded-xl border border-emerald-50 dark:border-emerald-900/10">
                                      "{item.whyJoin || "No personal statement submitted."}"
                                    </p>
                                  </div>
                                </div>

                                {/* RECEIPT COLUMN */}
                                <div className="md:col-span-5 space-y-2">
                                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">SUBMITTED PAYMENT RECEIPT</span>
                                  {item.receiptUrl ? (
                                    <div className="border border-emerald-50 dark:border-emerald-900/35 p-2 rounded-2xl bg-white dark:bg-natural-dark shadow-xs max-w-xs overflow-hidden">
                                      {item.receiptUrl.startsWith("data:image/") ? (
                                        <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="block relative group aspect-video rounded-xl overflow-hidden bg-slate-50 border">
                                          <img src={item.receiptUrl} alt="Payment Receipt" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                                          <div className="absolute inset-0 bg-natural-green/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded">View Fullscreen</span>
                                          </div>
                                        </a>
                                      ) : (
                                        <div className="p-4 text-center">
                                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">📄 PDF / File Attached</span>
                                          <a href={item.receiptUrl} download={`receipt_${item.username}.pdf`} className="inline-block mt-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold">Download File</a>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 border border-dashed border-amber-200 dark:border-amber-900/40 rounded-xl text-center text-amber-850 dark:text-amber-300 text-[10px] italic">
                                      No payment receipt file uploaded.
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                        No active admissions found matching "{admissionSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- LMS MAIN LAYOUT WITH LEFT NAVIGATION DRAWER OR SIDEBAR ---
  return (
    <div id="lms-dashboard-wrapper" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Student/Teacher Profile & Menu Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-natural-dark rounded-3xl p-6 border border-emerald-50 dark:border-emerald-900/40 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-natural-green mx-auto flex items-center justify-center border border-natural-gold">
              <span className="text-2xl font-serif font-light text-natural-gold">{currentUser.name.slice(0, 1)}</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-natural-green dark:text-white">{currentUser.name}</h3>
              <p className="text-[10px] uppercase tracking-widest text-natural-gold font-mono">
                {currentUser.role} Account
              </p>
              {currentUser.role === "student" && (
                <div className="mt-2 space-y-1">
                  <span className="inline-block text-[9px] font-bold bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    Level: {currentUser.level}
                  </span>
                  <div>
                    {currentUser.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-natural-green">
                        <Unlock className="w-3 h-3 text-natural-gold" /> Unlocked Student
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600">
                        <Lock className="w-3 h-3" /> Locked (Unpaid)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Change Credentials Form Drawer Toggler */}
            <details className="text-left text-xs bg-natural-sage/10 dark:bg-natural-green/25 p-2.5 rounded-2xl border border-emerald-50 dark:border-emerald-900/30">
              <summary className="font-bold cursor-pointer text-natural-green dark:text-amber-200 list-none flex justify-between items-center select-none font-serif">
                <span>🔑 Change Security Pass</span>
                <Settings className="w-3.5 h-3.5 text-natural-gold" />
              </summary>
              <form onSubmit={handleCredentialsChange} className="mt-3 space-y-2">
                <input
                  type="password"
                  placeholder="Old Password"
                  value={credOldPassword}
                  onChange={(e) => setCredOldPassword(e.target.value)}
                  className="w-full p-2 border border-emerald-50 dark:border-emerald-900/30 rounded-full bg-white dark:bg-natural-dark text-[10px]"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={credNewPassword}
                  onChange={(e) => setCredNewPassword(e.target.value)}
                  className="w-full p-2 border border-emerald-50 dark:border-emerald-900/30 rounded-full bg-white dark:bg-natural-dark text-[10px]"
                />
                <input
                  type="text"
                  placeholder="New Username (Optional)"
                  value={credNewUsername}
                  onChange={(e) => setCredNewUsername(e.target.value)}
                  className="w-full p-2 border border-emerald-50 dark:border-emerald-900/30 rounded-full bg-white dark:bg-natural-dark text-[10px]"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-natural-green text-white font-bold text-[10px] rounded-full hover:bg-natural-dark border-none transition-all cursor-pointer"
                >
                  Apply Change
                </button>
              </form>
            </details>

            {/* Supabase Connection Status Badge */}
            <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-emerald-50 dark:border-emerald-900/10 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span>Supabase Cloud Synced</span>
            </div>
          </div>

          {/* Tab Navigation buttons */}
          <div className="bg-white dark:bg-natural-dark rounded-3xl border border-emerald-50 dark:border-emerald-900/30 shadow-sm overflow-hidden">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedCourse(null); }}
              className={`w-full text-left px-5 py-3.5 text-xs font-bold border-b border-emerald-50 dark:border-emerald-900/10 flex items-center justify-between transition-colors border-none cursor-pointer ${
                activeTab === "dashboard" ? "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-amber-300" : "text-slate-500 dark:text-emerald-200 hover:bg-natural-sage/10"
              }`}
            >
              <span className="font-serif">🏡 Dashboard Home</span>
              <ChevronRight className="w-4 h-4 text-natural-gold" />
            </button>
            <button
              onClick={() => { setActiveTab("messages"); setSelectedCourse(null); }}
              className={`w-full text-left px-5 py-3.5 text-xs font-bold border-b border-emerald-50 dark:border-emerald-900/10 flex items-center justify-between transition-colors border-none cursor-pointer ${
                activeTab === "messages" ? "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-amber-300" : "text-slate-500 dark:text-emerald-200 hover:bg-natural-sage/10"
              }`}
            >
              <span className="font-serif">💬 Direct Messages</span>
              <ChevronRight className="w-4 h-4 text-natural-gold" />
            </button>
            <button
              onClick={() => { setActiveTab("calendar"); setSelectedCourse(null); }}
              className={`w-full text-left px-5 py-3.5 text-xs font-bold border-b border-emerald-50 dark:border-emerald-900/10 flex items-center justify-between transition-colors border-none cursor-pointer ${
                activeTab === "calendar" ? "bg-natural-sage/20 dark:bg-natural-green/45 text-natural-green dark:text-amber-300" : "text-slate-500 dark:text-emerald-200 hover:bg-natural-sage/10"
              }`}
            >
              <span className="font-serif">📅 Academy Calendar</span>
              <ChevronRight className="w-4 h-4 text-natural-gold" />
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-5 py-3.5 text-xs font-bold flex items-center justify-between text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-none cursor-pointer"
            >
              <span className="font-serif">{isArabic ? "🚪 تسجيل الخروج (Log Out)" : "🚪 Log Out Portal"}</span>
              <ChevronRight className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Right Side: Active Workspace views */}
        <div className="lg:col-span-9 space-y-6">

          {/* TAB 1: CALENDAR VIEW */}
          {activeTab === "calendar" && (
            <div className="space-y-6">
              {/* Semester Selector Switcher */}
              <div className="flex justify-center items-center gap-3 bg-white dark:bg-emerald-950 p-2.5 rounded-2xl max-w-sm mx-auto border border-emerald-100 dark:border-emerald-900 shadow-sm">
                <button
                  type="button"
                  onClick={() => setCalendarSemester("semester1")}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calendarSemester === "semester1"
                      ? "bg-emerald-700 text-white shadow-md scale-[1.02]"
                      : "text-slate-600 dark:text-emerald-200 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/40"
                  }`}
                >
                  Semester 1 (3 Months)
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarSemester("semester2")}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calendarSemester === "semester2"
                      ? "bg-emerald-700 text-white shadow-md scale-[1.02]"
                      : "text-slate-600 dark:text-emerald-200 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/40"
                  }`}
                >
                  Semester 2 (3 Months)
                </button>
              </div>

              {/* Official Beautiful Master Syllabus & Guidelines */}
              <div className="bg-amber-500/5 dark:bg-emerald-950/25 border-2 border-dashed border-amber-500/20 rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in">
                <div className="text-center space-y-1">
                  <span className="font-mono text-xs text-amber-600 font-bold tracking-widest uppercase">Academic Ledger Syllabus</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-natural-green dark:text-amber-100 font-serif tracking-tight">
                    Abu Qoonitah University of Deen
                  </h2>
                  <p className="text-sm font-serif italic text-slate-500 dark:text-emerald-300">
                    Official School Calendar — {calendarSemester === "semester1" ? "Semester 1" : "Semester 2"} (3 Months)
                  </p>
                </div>

                {/* Important Guidelines Card */}
                <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-sm text-natural-green dark:text-amber-100 flex items-center gap-1.5 border-b border-emerald-50 dark:border-emerald-800 pb-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Academic Marking System & Guidelines ({calendarSemester === "semester1" ? "First Semester" : "Second Semester"})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="font-bold text-slate-700 dark:text-emerald-200">Total Semester Marks:</span>
                        <span className="font-mono font-bold text-natural-green dark:text-amber-300 bg-natural-sage/20 px-2 py-0.5 rounded">50 Marks</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></span>
                        <p className="text-slate-600 dark:text-emerald-300 leading-relaxed">
                          <span className="font-bold">Assignments Weight:</span> Carries <span className="font-bold">20 Marks</span> in total. When you submit your homework assignment, you will get <span className="font-bold text-amber-600">one mark (1 Mark)</span> on each assignment recorded!
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/20 dark:bg-emerald-950/25 p-3.5 rounded-xl border border-emerald-50 dark:border-emerald-900/40 space-y-1.5">
                      <div className="text-[10px] font-bold font-mono uppercase text-amber-600">Semester Marks Breakdown</div>
                      <ul className="space-y-1 text-[11px] font-sans text-slate-600 dark:text-emerald-300">
                        <li className="flex justify-between border-b border-emerald-500/10 pb-1">
                          <span>📝 Submitted Homework Assignments</span>
                          <span className="font-bold font-mono text-natural-green dark:text-amber-300">20 Marks</span>
                        </li>
                        <li className="flex justify-between border-b border-emerald-500/10 py-1">
                          <span>🖥️ Week 8 Computer Based Test (CBT)</span>
                          <span className="font-bold font-mono text-natural-green dark:text-amber-300">5 Marks</span>
                        </li>
                        <li className="flex justify-between border-b border-emerald-500/10 py-1">
                          <span>🗣️ Week 11 Oral Evaluation Exam</span>
                          <span className="font-bold font-mono text-natural-green dark:text-amber-300">5 Marks</span>
                        </li>
                        <li className="flex justify-between py-1">
                          <span>🎓 Week 13 Comprehensive Final Exam</span>
                          <span className="font-bold font-mono text-natural-green dark:text-amber-300">20 Marks</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Week by Week Structured Timeline */}
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-sm text-natural-green dark:text-amber-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Weekly Study Schedule & Milestones ({calendarSemester === "semester1" ? "Semester 1" : "Semester 2"})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
                    <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-600 uppercase">Week 1 - 2</div>
                      <div className="font-serif font-bold text-natural-green dark:text-white">Basics & Foundation</div>
                      <p className="text-slate-500 dark:text-emerald-300 text-[11px]">
                        Watch Video {calendarSemester === "semester1" ? "1, 2, 3 & 4" : "21, 22, 23 & 24"} + Submit Assignments
                      </p>
                    </div>

                    <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-600 uppercase">Week 3 - 4</div>
                      <div className="font-serif font-bold text-natural-green dark:text-white">Syntax & Vocabulary</div>
                      <p className="text-slate-500 dark:text-emerald-300 text-[11px]">
                        Watch Video {calendarSemester === "semester1" ? "5, 6, 7 & 8" : "25, 26, 27 & 28"} + Submit Assignments
                      </p>
                    </div>

                    <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-600 uppercase">Week 5 - 6</div>
                      <div className="font-serif font-bold text-natural-green dark:text-white">Grammar Rules</div>
                      <p className="text-slate-500 dark:text-emerald-300 text-[11px]">
                        Watch Video {calendarSemester === "semester1" ? "9, 10, 11 & 12" : "29, 30, 31 & 32"} + Submit Assignments
                      </p>
                    </div>

                    <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-600 uppercase">Week 7 - 8</div>
                      <div className="font-serif font-bold text-natural-green dark:text-white">Matn Articulation</div>
                      <p className="text-slate-500 dark:text-emerald-300 text-[11px]">
                        Watch Video {calendarSemester === "semester1" ? "13, 14, 15 & 16" : "33, 34, 35 & 36"} + Submit Assignments
                      </p>
                    </div>

                    <div className="bg-amber-500/10 border-2 border-amber-500/20 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-700 uppercase flex justify-between">
                        <span>Week 8 Milestone</span>
                        <span>5 MARKS</span>
                      </div>
                      <div className="font-serif font-bold text-amber-900">Computer Based Test (CBT)</div>
                      <p className="text-amber-800 text-[11px]">Theoretical examinations across all materials covered.</p>
                    </div>

                    <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-600 uppercase">Week 9 - 10</div>
                      <div className="font-serif font-bold text-natural-green dark:text-white">Sentence Synthesis</div>
                      <p className="text-slate-500 dark:text-emerald-300 text-[11px]">
                        Watch Video {calendarSemester === "semester1" ? "17, 18, 19 & 20" : "37, 38, 39 & 40"} + Submit Assignments
                      </p>
                    </div>

                    <div className="bg-amber-500/10 border-2 border-amber-500/20 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-700 uppercase flex justify-between">
                        <span>Week 11 Milestone</span>
                        <span>5 MARKS</span>
                      </div>
                      <div className="font-serif font-bold text-amber-900">Oral Recitation Test</div>
                      <p className="text-amber-800 text-[11px]">Live speaking and Tajweed articulation review.</p>
                    </div>

                    <div className="bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-amber-600 uppercase">Week 12</div>
                      <div className="font-serif font-bold text-natural-green dark:text-white font-semibold">Semester Revision</div>
                      <p className="text-slate-500 dark:text-emerald-300 text-[11px]">Consolidated revision exercises & mock test sheets.</p>
                    </div>

                    <div className="bg-emerald-700 text-white p-4 rounded-xl space-y-1 shadow-sm">
                      <div className="text-[10px] font-mono font-bold text-amber-300 uppercase flex justify-between">
                        <span>Week 13 Final</span>
                        <span>20 MARKS</span>
                      </div>
                      <div className="font-serif font-bold text-white text-base">Comprehensive Exam</div>
                      <p className="text-emerald-100 text-[11px]">Final comprehensive assessment of {calendarSemester === "semester1" ? "Semester 1" : "Semester 2"}.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Calendar Dates Feed */}
              <div className="bg-white dark:bg-natural-dark rounded-3xl p-6 sm:p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-natural-green dark:text-amber-100 flex items-center gap-2 font-serif">
                  <Calendar className="w-5 h-5 text-natural-gold" />
                  <span>Calendar Timeline & Target Dates</span>
                </h3>
                <div className="space-y-4">
                  {calendarEvents.map((evt) => (
                    <div key={evt.id} className="p-4 bg-natural-sage/10 dark:bg-natural-green/20 border border-emerald-50 dark:border-emerald-900/30 rounded-2xl flex items-start gap-4 text-xs animate-fade-in">
                      <div className="w-14 text-center font-mono bg-natural-green text-white rounded-xl p-1.5 flex-shrink-0">
                        <span className="block text-[10px] uppercase font-bold text-natural-gold">{new Date(evt.date).toLocaleDateString([], { month: "short" })}</span>
                        <span className="block text-base font-serif font-light">{new Date(evt.date).toLocaleDateString([], { day: "numeric" })}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-natural-green dark:text-white font-serif">{evt.title}</h4>
                        <p className="text-slate-500 dark:text-emerald-300 mt-1 leading-normal">{evt.description}</p>
                        <span className="inline-block mt-2 bg-natural-sage/30 text-natural-green dark:text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full text-[9px] uppercase">
                          {evt.type}
                        </span>
                      </div>
                    </div>
                  ))}
                  {calendarEvents.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No specific events logged in general ledger.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT MESSAGES */}
          {activeTab === "messages" && (
            <div className="bg-white dark:bg-natural-dark rounded-3xl p-6 sm:p-8 border border-emerald-50 dark:border-emerald-900/40 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">
              {/* Contacts roster */}
              <div className="md:col-span-4 border-r border-emerald-50/10 dark:border-emerald-900/10 pr-4 space-y-4">
                <h3 className="font-serif font-bold text-sm text-natural-green dark:text-amber-100 uppercase tracking-wider border-b border-emerald-50 dark:border-emerald-900/30 pb-2">
                  Madrasah Contacts
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-colors flex items-center gap-2 text-xs ${
                        activeContact?.id === contact.id
                          ? "bg-natural-sage/20 dark:bg-natural-green/45 border-natural-gold shadow-xs"
                          : "bg-white dark:bg-natural-dark border-emerald-50/30 dark:border-emerald-900/30"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-natural-green text-natural-gold flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {contact.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="font-serif font-bold text-natural-green dark:text-white truncate">{contact.name}</div>
                        <div className="text-[9px] uppercase font-bold text-natural-gold font-mono truncate">{contact.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DM Dialogue Chat Box */}
              <div className="md:col-span-8 flex flex-col justify-between min-h-[400px]">
                {activeContact ? (
                  <>
                    {/* Header */}
                    <div className="border-b border-emerald-50 dark:border-emerald-900/15 pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-natural-green text-natural-gold flex items-center justify-center font-bold">
                        {activeContact.name.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-natural-green dark:text-white">{activeContact.name}</h4>
                        <span className="text-[10px] text-slate-400 capitalize">{activeContact.role} Contact</span>
                      </div>
                    </div>

                    {/* Chat History Messages list */}
                    <div className="flex-grow my-4 space-y-3 max-h-[300px] overflow-y-auto pr-2 flex flex-col">
                      {dmHistory
                        .filter((m) => m.senderId === activeContact.id || m.receiverId === activeContact.id)
                        .map((m) => {
                          const isSentByMe = m.senderId === currentUser.id;
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-2xl text-xs max-w-sm ${
                                isSentByMe
                                  ? "bg-natural-green text-white self-end rounded-br-none"
                                  : "bg-natural-sage/15 dark:bg-natural-green/20 text-natural-green dark:text-emerald-100 self-start rounded-bl-none border border-emerald-50 dark:border-emerald-900/30"
                              }`}
                            >
                              <p className="leading-relaxed font-sans">{m.content}</p>
                              <span className="block text-[8px] opacity-75 mt-1 text-right font-mono">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    {/* Message typing box */}
                    <form onSubmit={handleSendDM} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type direct message..."
                        value={newDMMsg}
                        onChange={(e) => setNewDMMsg(e.target.value)}
                        required
                        className="w-full bg-natural-sage/10 dark:bg-natural-green/20 border border-emerald-50 dark:border-emerald-900/40 rounded-full p-2.5 text-xs text-natural-green dark:text-white placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-natural-gold"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-natural-green hover:bg-natural-dark text-white font-bold rounded-full border-none cursor-pointer flex items-center justify-center"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12 text-slate-400">
                    <Mail className="w-12 h-12 text-natural-gold mb-2 animate-bounce" />
                    <p className="text-xs font-serif">Select a Madrasah contact to start exchanging secure messages.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PORTAL DASHBOARD (BASED ON ROLE) */}
          {activeTab === "dashboard" && (
            <>
              {/* === A. STUDENT PORTAL WORKSPACE === */}
              {currentUser.role === "student" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Student Sub-tab Navigation Pills */}
                  <div className="flex flex-wrap gap-2 border-b border-emerald-100 dark:border-emerald-800 pb-4">
                    <button
                      onClick={() => { setStudentSubTab("courses"); setSelectedCourse(null); }}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        studentSubTab === "courses"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📚 Enrolled Classes & Lectures
                    </button>
                    <button
                      onClick={() => { setStudentSubTab("assignments"); setSelectedCourse(null); }}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        studentSubTab === "assignments"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📝 Assignments & Worksheets
                    </button>
                    <button
                      onClick={() => { setStudentSubTab("announcements"); setSelectedCourse(null); }}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        studentSubTab === "announcements"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📢 School Announcements
                    </button>
                    <button
                      onClick={() => { setStudentSubTab("payments"); setSelectedCourse(null); }}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        studentSubTab === "payments"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      💳 Monthly Tuition Payments
                    </button>
                    <button
                      onClick={() => { setStudentSubTab("results"); setSelectedCourse(null); }}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        studentSubTab === "results"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📊 Academic Report Card
                    </button>
                    <button
                      onClick={() => { setStudentSubTab("certificates"); setSelectedCourse(null); }}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        studentSubTab === "certificates"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      🎓 Graduation Certificates
                    </button>
                  </div>

                  {/* SUB-TAB 1: ENROLLED COURSES & CLASSROOM */}
                  {studentSubTab === "courses" && (
                    <div className="space-y-6">
                      {!selectedCourse ? (
                        <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                          <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-amber-500" />
                            <span>Your Enrolled Courses</span>
                          </h2>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {courses.map((course) => {
                              const isEnrolled = currentUser.enrolledCourses.includes(course.id);
                              const isLocked = course.level !== "free" && !currentUser.isPaid;
                              const progress = currentUser.progress[course.id] || 0;

                              return (
                                <div
                                  key={course.id}
                                  className={`p-5 rounded-xl border flex flex-col justify-between bg-white dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                      <span className="bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded text-emerald-800 dark:text-amber-300">
                                        {course.level} Track
                                      </span>
                                      {isLocked && <span className="text-red-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
                                    </div>

                                    <h3 className="font-bold text-sm sm:text-base text-emerald-900 dark:text-white">{course.title}</h3>
                                    <p className="text-xs text-emerald-650 dark:text-emerald-350 line-clamp-2 leading-relaxed">{course.description}</p>
                                    
                                    {isEnrolled && !isLocked && (
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-emerald-500 font-mono">
                                          <span>Progress</span>
                                          <span>{progress}%</span>
                                        </div>
                                        <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-1.5 rounded-full overflow-hidden">
                                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="border-t border-emerald-50 dark:border-emerald-850 mt-4 pt-3 flex justify-between items-center">
                                    <span className="text-[10px] font-semibold text-emerald-500">{course.duration} duration</span>
                                    
                                    {isEnrolled ? (
                                      isLocked ? (
                                        <button
                                          onClick={() => alert("This premium course level requires enrollment payment clearance. Please submit your monthly tuition receipt in the Payments tab to unlock.")}
                                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-[10px] font-bold rounded"
                                        >
                                          Unlock Access
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => setSelectedCourse(course)}
                                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded flex items-center gap-1"
                                        >
                                          <span>Enter Classroom</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )
                                    ) : (
                                      <button
                                        onClick={() => handleEnroll(course.id)}
                                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-[10px] font-bold rounded shadow-xs cursor-pointer"
                                      >
                                        Enroll Now
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div id="classroom-panel" className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border-2 border-amber-500 shadow-md space-y-8 animate-fade-in relative">
                          <button
                            onClick={() => setSelectedCourse(null)}
                            className="absolute top-4 right-4 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-800 p-2 rounded-full border text-xs"
                          >
                            ✕ Close Classroom
                          </button>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{selectedCourse.level} Class</span>
                            <h2 className="text-2xl font-bold text-emerald-950 dark:text-amber-100 font-sans">{selectedCourse.title}</h2>
                            <p className="text-xs text-emerald-750 dark:text-emerald-300 leading-relaxed font-sans">{selectedCourse.description}</p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                            {/* Left Col: Lectures, PDFs, Assignments */}
                            <div className="lg:col-span-7 space-y-6">
                              {/* Lesson Videos (Lectures) */}
                              <div className="space-y-3">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <Video className="w-4 h-4 text-emerald-700" />
                                  <span>Lesson Videos ({selectedCourse.videos.length})</span>
                                </h4>
                                <div className="space-y-2">
                                  {selectedCourse.videos.map((vid) => (
                                    <details key={vid.id} className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-xs">
                                      <summary className="font-bold cursor-pointer text-emerald-900 dark:text-white flex justify-between items-center select-none">
                                        <span className="flex items-center gap-1.5 flex-wrap">
                                          <span>◈ {vid.title}</span>
                                          {(vid.audioUrl || (vid.photos && vid.photos.length > 0)) && (
                                            <span className="text-[8px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">Audio & Slides</span>
                                          )}
                                        </span>
                                        <span className="font-mono text-[9px] bg-emerald-800 text-white px-2 py-0.5 rounded">{vid.duration || "Audio Lecture"}</span>
                                      </summary>
                                      <div className="mt-3 space-y-3">
                                        <p className="text-[11px] text-emerald-650 dark:text-emerald-300 font-sans leading-relaxed">{vid.description}</p>
                                        
                                        {/* Audio voice note if present */}
                                        {vid.audioUrl && (
                                          <div className="space-y-1 bg-white dark:bg-emerald-950 p-2.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/40">
                                            <span className="font-bold text-[9px] text-amber-600 block uppercase font-mono">🎙️ Teacher's Voice Note Explanatory Lecture:</span>
                                            <audio src={vid.audioUrl} controls className="w-full h-8 mt-1" />
                                          </div>
                                        )}

                                        {/* Board photos if present */}
                                        {vid.photos && vid.photos.length > 0 && (
                                          <div className="space-y-2">
                                            <span className="font-bold text-[9px] text-emerald-800 dark:text-emerald-300 block uppercase font-mono">📸 Lesson Board Slides / Materials ({vid.photos.length}):</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                              {vid.photos.map((photo, pIdx) => (
                                                <a key={pIdx} href={photo} target="_blank" rel="noopener noreferrer" className="relative group block rounded border border-emerald-100 dark:border-emerald-850 overflow-hidden bg-slate-50 aspect-square">
                                                  <img src={photo} alt={`Slide ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                  <span className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">Zoom slide</span>
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* YouTube embed if URL is set and is not empty */}
                                        {vid.url && (
                                          <div className="aspect-video w-full rounded overflow-hidden bg-black border border-emerald-850">
                                            <iframe
                                              className="w-full h-full"
                                              src={vid.url}
                                              title={vid.title}
                                              allowFullScreen
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </details>
                                  ))}
                                  {selectedCourse.videos.length === 0 && (
                                    <p className="text-xs italic text-emerald-500">No lecture recordings available yet.</p>
                                  )}
                                </div>
                              </div>

                              {/* PDFs Handouts */}
                              <div className="space-y-3 pt-4 border-t border-emerald-50 dark:border-emerald-850">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-emerald-700" />
                                  <span>Course Study Handouts / Notes ({selectedCourse.pdfs.length})</span>
                                </h4>
                                <div className="space-y-2">
                                  {selectedCourse.pdfs.map((pdf) => (
                                    <div key={pdf.id} className="p-3 bg-white dark:bg-emerald-950 rounded border border-emerald-100 dark:border-emerald-850 flex justify-between items-center text-xs">
                                      <div>
                                        <span className="font-bold text-emerald-900 dark:text-white">{pdf.title}</span>
                                        <p className="text-[10px] text-emerald-500">{pdf.description}</p>
                                      </div>
                                      <button
                                        onClick={() => alert(`Downloading handout: ${pdf.title}...`)}
                                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900 text-emerald-750 dark:text-amber-200 border border-emerald-100 rounded text-[10px] font-bold"
                                      >
                                        {pdf.fileSize} PDF Download
                                      </button>
                                    </div>
                                  ))}
                                  {selectedCourse.pdfs.length === 0 && (
                                    <p className="text-xs italic text-emerald-500">No notes published for this class yet.</p>
                                  )}
                                </div>
                              </div>

                              {/* Quizzes */}
                              <div className="space-y-3 pt-4 border-t border-emerald-50 dark:border-emerald-850">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">Class Quizzes</h4>
                                <div className="space-y-2">
                                  {selectedCourse.quizzes.map((quiz) => {
                                    const sub = submissions.find(s => s.referenceId === quiz.id);
                                    return (
                                      <div key={quiz.id} className="space-y-2">
                                        {sub ? (
                                          <div className="p-3 bg-emerald-100/50 dark:bg-emerald-950/25 rounded border border-emerald-200 text-xs flex justify-between items-center">
                                            <span className="font-bold text-emerald-900 dark:text-emerald-100 truncate">{quiz.title}</span>
                                            {sub.status === "graded" ? (
                                              <span className="font-mono font-bold text-emerald-800 dark:text-amber-300">Score: {sub.score}%</span>
                                            ) : (
                                              <span className="font-mono text-amber-600 font-bold text-[11px] animate-pulse">⏳ Pending Teacher Review</span>
                                            )}
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              const questionsToShow = quiz.limitQuestions && quiz.limitQuestions < quiz.questions.length
                                                ? quiz.questions.slice(0, quiz.limitQuestions)
                                                : quiz.questions;
                                              setActiveQuiz({
                                                ...quiz,
                                                questions: questionsToShow
                                              });
                                              setQuizAnswers({});
                                              setQuizScore(null);
                                              setQuizTimeLeft((quiz.durationMinutes || 10) * 60);
                                            }}
                                            className="w-full text-left p-3 bg-white dark:bg-emerald-950 hover:bg-emerald-50/60 rounded border border-emerald-150 dark:border-emerald-850 text-xs font-bold text-emerald-900 dark:text-amber-200 flex justify-between items-center cursor-pointer"
                                          >
                                            <div className="flex flex-col gap-0.5">
                                              <span>📝 Take {quiz.title}</span>
                                              <span className="text-[10px] text-emerald-550 dark:text-emerald-400 font-normal">
                                                ⏱️ Time Limit: {quiz.durationMinutes || 10} minutes • {quiz.questions?.length || 0} total questions
                                              </span>
                                              {quiz.examDate && (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                                  📅 Exam Announcement/Date: {quiz.examDate}
                                                </span>
                                              )}
                                              {quiz.limitQuestions && (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                  ⚙️ Question Pool Limit: {quiz.limitQuestions} of {quiz.questions?.length} Qs
                                                </span>
                                              )}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-emerald-650" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {selectedCourse.quizzes.length === 0 && (
                                    <p className="text-xs text-emerald-500 italic">No scheduled quizzes.</p>
                                  )}

                                  {/* Active Quiz Box */}
                                  {activeQuiz && (
                                    <div className="bg-white dark:bg-emerald-950 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 space-y-4 text-xs animate-fade-in text-emerald-950 dark:text-white">
                                      <div className="flex justify-between items-center border-b border-emerald-100 dark:border-emerald-800 pb-2">
                                        <h5 className="font-bold text-sm text-emerald-900 dark:text-amber-100">{activeQuiz.title}</h5>
                                        {quizTimeLeft !== null && !quizScore && (
                                          <div className="flex flex-col items-end gap-1">
                                            <div className={`px-2.5 py-1 rounded font-mono font-bold text-xs flex items-center gap-1.5 ${
                                              quizTimeLeft < 60 
                                                ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 animate-pulse" 
                                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200"
                                            }`}>
                                              <span>⏱️</span>
                                              <span>
                                                {Math.floor(quizTimeLeft / 60)}:{(quizTimeLeft % 60).toString().padStart(2, '0')}
                                              </span>
                                            </div>
                                            {/* Teacher/Admin CBT Exam Timer Override */}
                                            <div className="flex items-center gap-1">
                                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Extend:</span>
                                              {[15, 30, 60, 120].map((mins) => (
                                                <button
                                                  key={mins}
                                                  type="button"
                                                  onClick={() => {
                                                    setQuizTimeLeft((prev) => (prev !== null ? prev + mins * 60 : mins * 60));
                                                    alert(`CBT Exam Timer successfully extended by +${mins} minutes by order of Abu Qoonitah Academy Admin/Teacher!`);
                                                  }}
                                                  className="px-1 py-0.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded text-[8px] font-bold font-mono transition-all active:scale-95 cursor-pointer"
                                                  title={`Add ${mins} extra minutes to the CBT timer`}
                                                >
                                                  +{mins}m
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {quizScore ? (
                                        <div className="text-center p-4 space-y-2">
                                          <Award className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
                                          <div className="font-bold text-base text-emerald-900 dark:text-white">Exam Sheet Submitted!</div>
                                          {activeQuiz.automaticMarking === false ? (
                                            <>
                                              <div className="font-mono text-xs font-bold text-amber-600">Pending Review & Manual Grading</div>
                                              <p className="text-[10px] text-slate-500">Your answers have been submitted to your teacher for review.</p>
                                            </>
                                          ) : (
                                            <>
                                              <div className="font-mono text-xl font-bold text-emerald-700 dark:text-amber-400">{quizScore.score}% Score</div>
                                              <p className="text-[10px] text-emerald-550 dark:text-emerald-400">Graded instantly in academic report cards.</p>
                                            </>
                                          )}
                                          <button onClick={() => { setActiveQuiz(null); setQuizScore(null); }} className="px-3 py-1 bg-emerald-700 text-white font-bold rounded">Dismiss</button>
                                        </div>
                                      ) : (
                                        <>
                                          {activeQuiz.questions.map((q: any) => (
                                            <div key={q.id} className="space-y-2">
                                              <div className="font-bold text-emerald-900 dark:text-amber-100">{q.questionText}</div>
                                              <div className="grid grid-cols-1 gap-1">
                                                {q.options.map((opt: string, optIdx: number) => (
                                                  <label key={optIdx} className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded border border-emerald-100/50 dark:border-emerald-900/50 cursor-pointer hover:bg-emerald-100/50">
                                                    <input
                                                      type="radio"
                                                      name={q.id}
                                                      checked={quizAnswers[q.id] === optIdx}
                                                      onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                                      className="text-emerald-750"
                                                    />
                                                    <span>{opt}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                          <div className="flex gap-2">
                                            <button type="button" onClick={() => handleQuizSubmit(activeQuiz.id)} className="px-3 py-1 bg-amber-500 text-emerald-950 font-bold rounded cursor-pointer">Submit Exam Sheet</button>
                                            <button type="button" onClick={() => setActiveQuiz(null)} className="px-3 py-1 bg-red-50 text-red-600 rounded cursor-pointer">Cancel</button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Col: Discussion forum */}
                            <div className="lg:col-span-5">
                              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex flex-col justify-between min-h-[350px]">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-emerald-100 dark:border-emerald-900 pb-2">
                                  Class Discussion Forum
                                </h4>
                                
                                <div className="space-y-3 my-3 overflow-y-auto max-h-[180px] pr-1 flex flex-col">
                                  {forumMessages.map((msg) => (
                                    <div key={msg.id} className="p-2.5 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-850 rounded-lg text-[11px] self-start w-full">
                                      <div className="flex justify-between items-center text-[9px] font-bold text-emerald-500 mb-1">
                                        <span className="text-emerald-900 dark:text-amber-200">{msg.senderName} ({msg.senderRole})</span>
                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <p className="text-emerald-750 dark:text-emerald-300 font-sans leading-normal">{msg.content}</p>
                                    </div>
                                  ))}
                                  {forumMessages.length === 0 && (
                                    <p className="text-[11px] text-emerald-500 text-center py-4">Begin the dialogue. Post the first comment.</p>
                                  )}
                                </div>

                                <form onSubmit={handlePostForum} className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="Post on forum..."
                                    value={newForumMsg}
                                    onChange={(e) => setNewForumMsg(e.target.value)}
                                    required
                                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-850 rounded p-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400"
                                  />
                                  <button type="submit" className="px-2.5 bg-amber-500 text-emerald-950 font-bold rounded cursor-pointer">
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 2: ALL ASSIGNMENTS LIST */}
                  {studentSubTab === "assignments" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span>Assignments & Worksheets</span>
                      </h2>
                      <p className="text-xs text-emerald-650 dark:text-emerald-350 leading-relaxed">
                        Complete your homework assignments and view grading responses from your Shaykhs or teachers.
                      </p>

                      <div className="space-y-4">
                        {courses
                          .filter(c => currentUser.enrolledCourses.includes(c.id))
                          .flatMap(c => c.assignments.map(a => ({ ...a, courseId: c.id, courseTitle: c.title })))
                          .map((assign) => {
                            const sub = submissions.find(s => s.referenceId === assign.id);
                            const isLocked = courses.find(c => c.id === assign.courseId)?.level !== "free" && !currentUser.isPaid;

                            return (
                              <div key={assign.id} className="p-4 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/60 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <span className="text-[10px] font-bold text-amber-600 block">{assign.courseTitle}</span>
                                    <span className="font-bold text-emerald-900 dark:text-white text-sm">{assign.title}</span>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Max: {assign.points} pts</span>
                                </div>
                                <p className="text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed">{assign.description}</p>
                                <div className="text-[10px] text-emerald-500">Due Date: {new Date(assign.dueDate).toLocaleDateString()}</div>

                                {isLocked ? (
                                  <div className="p-2 bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400 font-bold text-[10px] rounded flex items-center gap-1">
                                    <Lock className="w-3.5 h-3.5" /> Enrolled course is locked. Complete tuition clearance to submit answers.
                                  </div>
                                ) : sub ? (
                                  <div className="p-3 bg-white dark:bg-emerald-950 rounded border border-emerald-100 dark:border-emerald-850 space-y-2 text-xs">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500">
                                      <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                                      </span>
                                      <span className="capitalize">{sub.status}</span>
                                    </div>
                                    
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/30 p-3 rounded text-[11px] font-sans leading-relaxed space-y-3">
                                      <span className="font-bold text-[10px] text-amber-600 block uppercase">Your Submitted Worksheet Content:</span>
                                      {(() => {
                                        try {
                                          if (sub.submissionContent.startsWith("{") && sub.submissionContent.endsWith("}")) {
                                            const rich = JSON.parse(sub.submissionContent);
                                            return (
                                              <div className="space-y-3">
                                                {rich.text && (
                                                  <div className="whitespace-pre-wrap text-emerald-950 dark:text-white font-serif text-xs bg-white dark:bg-emerald-950/40 p-2.5 rounded border border-emerald-100/50">
                                                    {rich.text}
                                                  </div>
                                                )}
                                                
                                                {rich.photos && rich.photos.length > 0 && (
                                                  <div className="space-y-1">
                                                    <span className="font-semibold text-[9px] text-emerald-750 dark:text-emerald-300 block">Uploaded Photos ({rich.photos.length}):</span>
                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                      {rich.photos.map((src: string, idx: number) => (
                                                        <a key={idx} href={src} target="_blank" rel="noopener noreferrer" className="relative group block rounded border border-emerald-100 overflow-hidden bg-slate-50 aspect-square">
                                                          <img src={src} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                                          <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">Zoom</span>
                                                        </a>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {rich.audio && (
                                                  <div className="space-y-1 bg-white dark:bg-emerald-950/40 p-2 rounded border border-emerald-100/50">
                                                    <span className="font-semibold text-[9px] text-emerald-750 dark:text-emerald-300 flex items-center gap-1">
                                                      <span>🎙️ Attached Voice Note / Explanatory Audio:</span>
                                                    </span>
                                                    <audio src={rich.audio} controls className="w-full h-8 mt-1 text-xs" />
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }
                                        } catch (err) {}
                                        
                                        // Fallback to plain text
                                        return <div className="break-all font-mono text-[10px] whitespace-pre-wrap">{sub.submissionContent}</div>;
                                      })()}
                                    </div>

                                    {sub.status === "graded" ? (
                                      <div className="p-2 bg-emerald-100/50 dark:bg-emerald-950/50 rounded border border-emerald-200/50">
                                        <div className="font-bold text-emerald-900 dark:text-amber-100">Score: {sub.score} / {sub.maxPoints}</div>
                                        <div className="text-[10px] text-emerald-650 dark:text-emerald-300 italic mt-0.5">Teacher Feedback: "{sub.comments || "No comments written."}" — Graded by {sub.gradedBy}</div>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-emerald-500 italic">Awaiting grading verification by school teacher...</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {activeAssign?.id === assign.id ? (
                                      <form onSubmit={(e) => handleAssignSubmitRich(e, assign)} className="p-5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs space-y-4 animate-fade-in text-emerald-950 dark:text-white">
                                        <div className="flex justify-between items-center pb-2 border-b border-emerald-150">
                                          <h4 className="font-bold text-emerald-900 dark:text-amber-100 flex items-center gap-1.5">
                                            <span>📝 Worksheet Answer Submission Sheet</span>
                                          </h4>
                                          <button 
                                            type="button" 
                                            onClick={() => { setActiveAssign(null); setUploadedPhotos([]); setUploadedAudio(null); setAudioPreviewUrl(null); }}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer bg-none border-none"
                                          >
                                            Close Form
                                          </button>
                                        </div>

                                        {assignSubmitSuccess ? (
                                          <div className="p-4 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 text-center rounded border border-emerald-200">
                                            <Check className="w-8 h-8 text-emerald-600 mx-auto animate-bounce mb-1" />
                                            <div className="font-bold">Barakallahu Feekum!</div>
                                            <p className="text-[10px] mt-0.5">Your answer worksheet and media attachments have been successfully submitted for grading.</p>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Text Field */}
                                            <div className="space-y-1">
                                              <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Write Written Answers / Explanatory Notes (Optional if uploading images/audio):</label>
                                              <textarea
                                                rows={5}
                                                value={assignText}
                                                onChange={(e) => setAssignText(e.target.value)}
                                                placeholder="Type your translation, syntax breakdown, or script answers here..."
                                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                              />
                                            </div>

                                            {/* Images Area (Multiple Photos) */}
                                            <div className="space-y-2 pt-2 border-t border-emerald-150">
                                              <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                                                  <span>📸 Upload Worksheet Photos (Phone Gallery / Camera):</span>
                                                </label>
                                                <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/45 px-2 py-0.5 rounded">
                                                  {uploadedPhotos.length} Photos Selected
                                                </span>
                                              </div>
                                              
                                              <p className="text-[10px] text-slate-400 mt-[-4px]">
                                                Snap photos of your written notes on paper and upload them. You can upload more than 5 photos!
                                              </p>

                                              <div className="flex flex-wrap gap-2 items-center">
                                                {/* File input trigger */}
                                                <label className="relative flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg cursor-pointer bg-emerald-50/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                                                  <Plus className="w-5 h-5 text-emerald-600" />
                                                  <span className="text-[8px] font-bold text-emerald-750 dark:text-emerald-300 mt-1">Add Image</span>
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                  />
                                                </label>

                                                {/* Photo Previews */}
                                                <div className="flex flex-wrap gap-2">
                                                  {uploadedPhotos.map((photo, pIdx) => (
                                                    <div key={pIdx} className="relative w-20 h-20 rounded-lg border border-emerald-150 overflow-hidden bg-slate-50 shadow-sm">
                                                      <img src={photo} alt={`Preview ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                      <button
                                                        type="button"
                                                        onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, idx) => idx !== pIdx))}
                                                        className="absolute top-1 right-1 bg-red-650/90 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow cursor-pointer focus:outline-none"
                                                        title="Remove photo"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Audio / Voice Notes Area */}
                                            <div className="space-y-2 pt-2 border-t border-emerald-150">
                                              <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                                                🎙️ Explanatory Voice Note or Audio file:
                                              </label>
                                              
                                              <p className="text-[10px] text-slate-400 mt-[-4px]">
                                                Explain your worksheet answer or recitation. Record directly using your mic or select an audio file!
                                              </p>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/10 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100/50">
                                                {/* Option A: Direct Mic Recording */}
                                                <div className="space-y-2">
                                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase font-mono">Option A: Record Live voice note</span>
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    {isRecording ? (
                                                      <button
                                                        type="button"
                                                        onClick={stopRecording}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] flex items-center gap-1 animate-pulse cursor-pointer"
                                                      >
                                                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                                        Stop ({recordingSeconds}s)
                                                      </button>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={startRecording}
                                                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[10px] flex items-center gap-1.5 cursor-pointer"
                                                      >
                                                        <span>🎙️ Start Recording</span>
                                                      </button>
                                                    )}

                                                    {audioPreviewUrl && (
                                                      <button
                                                        type="button"
                                                        onClick={deleteRecording}
                                                        className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[10px] font-bold cursor-pointer"
                                                      >
                                                        Remove Rec
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Option B: Choose Audio File */}
                                                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-emerald-150 pt-2 sm:pt-0 sm:pl-4">
                                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase font-mono">Option B: Select audio file</span>
                                                  <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={async (e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        const base64 = await convertToBase64(file);
                                                        setUploadedAudio(base64);
                                                        setAudioPreviewUrl(URL.createObjectURL(file));
                                                      }
                                                    }}
                                                    className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-emerald-50 file:text-emerald-750 hover:file:bg-emerald-100 cursor-pointer"
                                                  />
                                                </div>
                                              </div>

                                              {/* Playback preview */}
                                              {audioPreviewUrl && (
                                                <div className="p-2.5 bg-white dark:bg-emerald-950/40 border border-emerald-100/50 rounded-lg flex flex-col gap-1.5">
                                                  <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold">▶️ Listen to your recording/audio preview before sending:</span>
                                                  <audio src={audioPreviewUrl} controls className="w-full h-8" />
                                                </div>
                                              )}
                                            </div>

                                            {/* Submission controls */}
                                            <div className="flex gap-2 pt-3 border-t border-emerald-150">
                                              <button
                                                type="submit"
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded text-xs cursor-pointer shadow-xs font-sans flex items-center gap-1.5 active:scale-95 transition-all"
                                              >
                                                <span>🚀 Submit Completed Worksheet</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => { setActiveAssign(null); setUploadedPhotos([]); setUploadedAudio(null); setAudioPreviewUrl(null); }}
                                                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </form>
                                    ) : (
                                      <button
                                        onClick={() => { setActiveAssign(assign); setAssignText(""); setUploadedPhotos([]); setUploadedAudio(null); setAudioPreviewUrl(null); }}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                                      >
                                        <span>Write & Submit Answer Worksheet</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {courses.filter(c => currentUser.enrolledCourses.includes(c.id)).length === 0 && (
                          <div className="text-center p-8 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-xl border border-dashed border-emerald-200">
                            <p className="text-xs text-slate-500">You are not enrolled in any class yet. Back to Dashboard to enroll.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: SCHOOL ANNOUNCEMENTS */}
                  {studentSubTab === "announcements" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                        <Send className="w-5 h-5 text-amber-500" />
                        <span>Classroom & Academy Announcements</span>
                      </h2>
                      <p className="text-xs text-emerald-650 dark:text-emerald-350 leading-relaxed">
                        Stay informed on school term calendar adjustments, Friday lectures, and notifications from Shaykh Abu Qoonitah.
                      </p>

                      <div className="space-y-4">
                        {announcements
                          .filter(ann => ann.targetRole === "all" || ann.targetRole === "student")
                          .map((ann) => (
                            <div key={ann.id} className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-2 animate-fade-in text-xs">
                              <div className="flex justify-between items-center text-[10px] font-bold text-amber-600 font-mono">
                                <span>PUBLISHED BY {ann.author.toUpperCase()}</span>
                                <span>{new Date(ann.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                              <h3 className="font-serif font-bold text-sm text-emerald-900 dark:text-white leading-snug">{ann.title}</h3>
                              <p className="text-emerald-750 dark:text-emerald-300 font-sans leading-relaxed whitespace-pre-line">{ann.content}</p>
                            </div>
                          ))}
                        {announcements.filter(ann => ann.targetRole === "all" || ann.targetRole === "student").length === 0 && (
                          <p className="text-xs italic text-emerald-500 py-4 text-center">No announcements recorded.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: MONTHLY TUITION PAYMENTS */}
                  {studentSubTab === "payments" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Submit Receipt Form */}
                      <div className="lg:col-span-7 bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                          <Lock className="w-5 h-5 text-amber-500" />
                          <span>Submit Tuition Payment Receipt</span>
                        </h2>
                        
                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-150 text-xs text-emerald-950 dark:text-emerald-100 space-y-3">
                          <span className="font-bold text-emerald-900 dark:text-amber-100 block uppercase">🏦 Academy Official Bank Account:</span>
                          
                          <div className="space-y-2 font-mono text-[11px] bg-white/70 dark:bg-emerald-950/50 p-3 rounded border border-emerald-100 dark:border-emerald-800">
                            <div className="flex justify-between items-center py-1 border-b border-emerald-50 dark:border-emerald-900/40">
                              <div><span className="font-bold text-emerald-800 dark:text-emerald-400">Bank Name:</span> {donBank}</div>
                              <button 
                                onClick={() => handleCopyField(donBank, "bank")}
                                className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 rounded text-[9px] font-sans font-bold"
                              >
                                {copiedField === "bank" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-emerald-50 dark:border-emerald-900/40">
                              <div><span className="font-bold text-emerald-800 dark:text-emerald-400">Account Name:</span> {donAccountName}</div>
                              <button 
                                onClick={() => handleCopyField(donAccountName, "accName")}
                                className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 rounded text-[9px] font-sans font-bold"
                              >
                                {copiedField === "accName" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <div><span className="font-bold text-emerald-800 dark:text-emerald-400">Account Number:</span> {donAccountNumber}</div>
                              <button 
                                onClick={() => handleCopyField(donAccountNumber, "accNum")}
                                className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 rounded text-[9px] font-sans font-bold font-mono"
                              >
                                {copiedField === "accNum" ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>

                          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded space-y-1.5">
                            <span className="font-bold text-emerald-900 dark:text-amber-100 block">💳 Official Tuition Rates:</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className="bg-white/40 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-100/50">
                                <span className="block font-bold text-emerald-700 dark:text-amber-300">Semester Fee</span>
                                <span className="text-emerald-900 dark:text-white">₦15,000 NGN</span>
                              </div>
                              <div className="bg-white/40 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-100/50">
                                <span className="block font-bold text-emerald-700 dark:text-amber-300">Monthly Payment</span>
                                <span className="text-emerald-900 dark:text-white">₦5,000 NGN</span>
                              </div>
                            </div>
                          </div>

                          <span className="block text-[10px] text-amber-600 font-bold italic mt-2">
                            * Transfer the tuition fee via your bank app, submit proof, then tap "Notify on WhatsApp" to instant-clear lockout!
                          </span>
                        </div>

                        <form onSubmit={handleTuitionSubmit} className="space-y-4 text-xs">
                          <div className="space-y-2">
                            <span className="font-bold text-emerald-700 block uppercase font-mono text-[10px]">Select Tuition Payment Category</span>
                            <div className="grid grid-cols-2 gap-3">
                              <label className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                                tuitionPayType === "semester" 
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs" 
                                  : "bg-white dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-850 hover:bg-emerald-50/20"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name="tuition_type" 
                                    checked={tuitionPayType === "semester"}
                                    onChange={() => setTuitionPayType("semester")}
                                    className="text-emerald-750"
                                  />
                                  <span className="font-bold text-emerald-900 dark:text-amber-100">Semester Fee</span>
                                </div>
                                <span className="text-[10px] text-emerald-650 dark:text-emerald-400 font-mono">₦15,000 NGN</span>
                              </label>

                              <label className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                                tuitionPayType === "monthly" 
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs" 
                                  : "bg-white dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-850 hover:bg-emerald-50/20"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name="tuition_type" 
                                    checked={tuitionPayType === "monthly"}
                                    onChange={() => setTuitionPayType("monthly")}
                                    className="text-emerald-750"
                                  />
                                  <span className="font-bold text-emerald-900 dark:text-amber-100">Monthly Payment</span>
                                </div>
                                <span className="text-[10px] text-emerald-650 dark:text-emerald-400 font-mono">₦5,000 NGN</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">BILLING MONTH/TERM</span>
                              <select
                                value={payMonth}
                                onChange={(e) => setPayMonth(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-900 dark:text-white"
                              >
                                <option value="First Semester 2026">First Semester 2026</option>
                                <option value="Second Semester 2026">Second Semester 2026</option>
                                <option value="June 2026">June 2026 (Monthly)</option>
                                <option value="July 2026">July 2026 (Monthly)</option>
                                <option value="August 2026">August 2026 (Monthly)</option>
                                <option value="September 2026">September 2026 (Monthly)</option>
                              </select>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">PAYMENT VALUE</span>
                              <div className="w-full bg-emerald-50/30 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-850 rounded p-2 text-emerald-900 dark:text-amber-200 font-mono font-bold">
                                {tuitionPayType === "semester" ? "₦15,000 NGN" : "₦5,000 NGN"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">BANK TRANSACTION REFERENCE / REF NUMBER</span>
                            <input
                              type="text"
                              placeholder="e.g. FT26192039481 / ATM-DEP-IBADAN"
                              value={payBankRef}
                              onChange={(e) => setPayBankRef(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2.5 text-xs text-emerald-950 dark:text-white placeholder-emerald-400 focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <span>Authorize & Submit Transfer Proof</span>
                          </button>
                        </form>
                      </div>

                      {/* Payment History List */}
                      <div className="lg:col-span-5 bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-emerald-950 dark:text-amber-100">Receipt Submission History</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {submissions
                            .filter(s => s.type === "payment")
                            .map((p) => {
                              let meta = { amount: "", bankRef: "", date: "" };
                              try { meta = JSON.parse(p.submissionContent); } catch(e){}
                              return (
                                <div key={p.id} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900/50 text-xs">
                                  <div className="flex justify-between font-bold text-emerald-900 dark:text-white text-[11px] mb-1">
                                    <span>{p.referenceTitle}</span>
                                    <span className="text-emerald-600 font-mono">{meta.amount}</span>
                                  </div>
                                  <div className="text-[10px] text-emerald-500 space-y-0.5 font-mono">
                                    <div>Ref: {meta.bankRef}</div>
                                    <div>Date: {new Date(meta.date || p.submittedAt).toLocaleDateString()}</div>
                                  </div>
                                  <div className="mt-2 text-[9px] font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-sm inline-block">
                                    {p.status === "graded" ? "Verified Clear" : "Pending Verification"}
                                  </div>
                                </div>
                              );
                            })}
                          {submissions.filter(s => s.type === "payment").length === 0 && (
                            <p className="text-xs text-emerald-500 italic py-4 text-center">No tuition receipts submitted yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 5: ACADEMIC RESULTS REPORT CARD */}
                  {studentSubTab === "results" && (() => {
                    const marks = calculateSemesterMarks(currentUser.name);
                    return (
                      <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6 animate-fade-in font-sans">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-emerald-50 dark:border-emerald-800 pb-4">
                          <div>
                            <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                              <Award className="w-5 h-5 text-amber-500" />
                              <span>Unified Academic Report Card</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-emerald-300 leading-relaxed mt-1">
                              Track your academic scores, test sheets, quiz performance, and logged class attendance percentage metrics.
                            </p>
                          </div>
                          
                          {/* Total Score Badge */}
                          <div className="bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl flex items-center gap-3 w-fit">
                            <div className="text-center">
                              <span className="block text-2xl font-bold font-mono text-emerald-800 dark:text-amber-300">
                                {marks.totalMarks} <span className="text-xs text-slate-400">/ 50</span>
                              </span>
                              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Semester Grade</span>
                            </div>
                            <div className="h-8 w-[1px] bg-emerald-250 dark:bg-emerald-850"></div>
                            <div className="text-xs font-bold text-emerald-700 dark:text-amber-400 font-serif">
                              {marks.totalMarks >= 45 ? "A+ Excellent (Mumtaz)" :
                               marks.totalMarks >= 40 ? "A Very Good (Jayyid Jiddan)" :
                               marks.totalMarks >= 30 ? "B Good (Jayyid)" :
                               marks.totalMarks >= 25 ? "C Pass (Maqbul)" : "F Study Harder"}
                            </div>
                          </div>
                        </div>

                        {/* Semester 1 Official Marks Breakdown Card */}
                        <div className="bg-amber-500/5 dark:bg-emerald-950/20 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                          <h3 className="text-xs font-bold font-mono text-amber-600 uppercase tracking-wider">
                            Semester 1 marking Board (Capped at 50 Marks total)
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            {/* Homework Assignments */}
                            <div className="bg-white dark:bg-emerald-900/60 p-4 rounded-xl border border-emerald-50 dark:border-emerald-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Homework Assignments</span>
                              <div className="flex justify-between items-baseline">
                                <span className="text-lg font-bold font-mono text-emerald-800 dark:text-amber-300">
                                  {marks.assignmentMarks} <span className="text-xs font-normal text-slate-400">/ 20</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 font-semibold">({marks.assignmentCount} submitted)</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-emerald-350">
                                1 mark for each submitted homework assignment.
                              </div>
                            </div>

                            {/* CBT Test */}
                            <div className="bg-white dark:bg-emerald-900/60 p-4 rounded-xl border border-emerald-50 dark:border-emerald-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Computer Test (CBT)</span>
                              <div className="flex justify-between items-baseline">
                                <span className="text-lg font-bold font-mono text-emerald-800 dark:text-amber-300">
                                  {marks.cbtMark} <span className="text-xs font-normal text-slate-400">/ 5</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 truncate max-w-[80px]" title={marks.cbtTitle}>
                                  {marks.cbtScore || "Pending"}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-emerald-350 truncate" title={marks.cbtTitle}>
                                CBT test paper: {marks.cbtTitle}
                              </div>
                            </div>

                            {/* Oral Test */}
                            <div className="bg-white dark:bg-emerald-900/60 p-4 rounded-xl border border-emerald-50 dark:border-emerald-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Oral Recitation Test</span>
                              <div className="flex justify-between items-baseline">
                                <span className="text-lg font-bold font-mono text-emerald-800 dark:text-amber-300">
                                  {marks.oralMark} <span className="text-xs font-normal text-slate-400">/ 5</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 truncate max-w-[80px]" title={marks.oralTitle}>
                                  {marks.oralScore || "Pending"}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-emerald-350 truncate" title={marks.oralTitle}>
                                Oral paper: {marks.oralTitle}
                              </div>
                            </div>

                            {/* Final Exam */}
                            <div className="bg-white dark:bg-emerald-900/60 p-4 rounded-xl border border-emerald-50 dark:border-emerald-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Final Exam Paper</span>
                              <div className="flex justify-between items-baseline">
                                <span className="text-lg font-bold font-mono text-emerald-800 dark:text-amber-300">
                                  {marks.finalMark} <span className="text-xs font-normal text-slate-400">/ 20</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 truncate max-w-[80px]" title={marks.finalTitle}>
                                  {marks.finalScore || "Pending"}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-emerald-350 truncate" title={marks.finalTitle}>
                                Final paper: {marks.finalTitle}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Performance Quick Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-850 rounded-2xl text-center">
                            <span className="block text-2xl font-serif font-bold text-emerald-900 dark:text-amber-300">
                              {submissions.filter(s => s.type === "quiz" && s.studentName === currentUser.name).length}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Quizzes Taken</span>
                          </div>
                          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-850 rounded-2xl text-center">
                            <span className="block text-2xl font-serif font-bold text-emerald-900 dark:text-amber-300">
                              {submissions.filter(s => s.type === "quiz" && s.studentName === currentUser.name && s.score && s.score >= (s.maxPoints || 10) * 0.7).length}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Excellent (Mumtaz)</span>
                          </div>
                          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-850 rounded-2xl text-center">
                            <span className="block text-2xl font-serif font-bold text-emerald-900 dark:text-amber-300">
                              {submissions.filter(s => s.type === "assignment" && s.studentName === currentUser.name && s.status === "graded").length}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Graded Homework</span>
                          </div>
                          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-850 rounded-2xl text-center">
                            <span className="block text-2xl font-serif font-bold text-emerald-900 dark:text-amber-300">
                              {currentUser.attendance && Object.keys(currentUser.attendance).length > 0 ? "92%" : "100%"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Class Attendance</span>
                          </div>
                        </div>

                        {/* Score sheets list */}
                        <div className="space-y-4 pt-4 border-t border-emerald-50 dark:border-emerald-850">
                          <h3 className="font-serif font-bold text-sm text-emerald-950 dark:text-amber-100">Graded Marks & Feedback</h3>
                          <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-emerald-50 dark:bg-emerald-950 border-b border-emerald-100 text-emerald-900 dark:text-amber-100">
                                  <th className="p-3 font-bold">Exam / Quiz Sheet</th>
                                  <th className="p-3 font-bold">Class Course</th>
                                  <th className="p-3 font-bold">Submission Date</th>
                                  <th className="p-3 font-bold">Obtained Grade</th>
                                  <th className="p-3 font-bold">Remarks & Feedback</th>
                                </tr>
                              </thead>
                              <tbody>
                                {submissions
                                  .filter(s => (s.type === "quiz" || s.type === "assignment") && s.studentName === currentUser.name)
                                  .map((s) => (
                                    <tr key={s.id} className="border-b border-emerald-50/10 hover:bg-emerald-50/10 text-emerald-850 dark:text-emerald-200">
                                      <td className="p-3 font-semibold">{s.referenceTitle}</td>
                                      <td className="p-3">{s.courseTitle}</td>
                                      <td className="p-3 text-[10px] font-mono">{new Date(s.submittedAt).toLocaleDateString()}</td>
                                      <td className="p-3">
                                        {s.status === "graded" ? (
                                          <span className="font-bold text-emerald-700 dark:text-amber-400 font-mono">{s.score} / {s.maxPoints}</span>
                                        ) : (
                                          <span className="text-emerald-400 italic">Pending...</span>
                                        )}
                                      </td>
                                      <td className="p-3 font-sans max-w-xs truncate text-[11px]" title={s.comments}>
                                        {s.comments || s.gradedBy ? `"${s.comments || "Good job"}" — ${s.gradedBy}` : "-"}
                                      </td>
                                    </tr>
                                  ))}
                                {submissions.filter(s => (s.type === "quiz" || s.type === "assignment") && s.studentName === currentUser.name).length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="p-8 text-center text-emerald-500 italic">No exams or quizzes taken yet. Keep studying hard!</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {studentSubTab === "certificates" && (
                    <div className="space-y-6">
                      {/* CSS style block for absolute print perfection */}
                      <style>{`
                        @media print {
                          body * {
                            visibility: hidden;
                          }
                          #print-certificate-container, #print-certificate-container * {
                            visibility: visible;
                          }
                          #print-certificate-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100% !important;
                            max-width: 100% !important;
                            border: none !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                          }
                          .no-print {
                            display: none !important;
                          }
                        }
                      `}</style>

                      <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-500" />
                          <span>Academic Graduation & Certificates</span>
                        </h2>
                        <p className="text-xs text-emerald-650 dark:text-emerald-350 leading-relaxed">
                          Abu Qoonitah Academy honors students who complete academic milestones. Clear CBT examinations and submit worksheets to unlock official printable graduation credentials.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Beginner Section Certificate Card */}
                        <div className="bg-white dark:bg-emerald-900 rounded-2xl p-6 border border-emerald-150 dark:border-emerald-800 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full">Beginner Section</span>
                              {passedBeginner ? (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                  <span>●</span> Graduated
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <span>○</span> Locked
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-emerald-950 dark:text-white">Al-Mubtadi’ Graduation Certificate</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Awarded to students completing core Islamic studies, basics of Fiqh, and foundational Qur'anic Arabic principles.
                            </p>
                          </div>

                          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg text-[10px] font-mono text-emerald-800 dark:text-emerald-400">
                            <span className="font-bold block mb-1">UNLOX CONDITION:</span>
                            Pass any Beginner Level CBT Quiz with a score of 50% or higher.
                          </div>

                          {passedBeginner ? (
                            <button
                              onClick={() => setActiveCertificate("beginner")}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer text-center"
                            >
                              🎓 View & Print Graduation Certificate
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-100 dark:bg-slate-800/50 text-slate-400 font-bold text-xs rounded-lg cursor-not-allowed text-center"
                            >
                              🔒 Locked (Complete Beginner CBT First)
                            </button>
                          )}
                        </div>

                        {/* 2. Intermediate Section Certificate Card */}
                        <div className="bg-white dark:bg-emerald-900 rounded-2xl p-6 border border-emerald-150 dark:border-emerald-800 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full">Intermediate Section</span>
                              {passedIntermediate ? (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                  <span>●</span> Graduated
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <span>○</span> Locked
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-emerald-950 dark:text-white">Al-Mutawassit Graduation Certificate</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Awarded to students achieving proficiency in Tajweed Al-Qur'an, advanced Fiqh studies, and Prophetic Seerah.
                            </p>
                          </div>

                          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg text-[10px] font-mono text-emerald-800 dark:text-emerald-400">
                            <span className="font-bold block mb-1">UNLOX CONDITION:</span>
                            Pass any Intermediate Level CBT Quiz with a score of 50% or higher.
                          </div>

                          {passedIntermediate ? (
                            <button
                              onClick={() => setActiveCertificate("intermediate")}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer text-center"
                            >
                              🎓 View & Print Graduation Certificate
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-100 dark:bg-slate-800/50 text-slate-400 font-bold text-xs rounded-lg cursor-not-allowed text-center"
                            >
                              🔒 Locked (Complete Intermediate CBT First)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Gorgeous Printable Certificate Viewer Overlay */}
                      {activeCertificate && (
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
                          <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 max-w-4xl w-full space-y-6 shadow-2xl relative">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                              <h4 className="font-bold text-sm text-slate-800">Print Preview - Official Graduation Certificate</h4>
                              <button
                                onClick={() => setActiveCertificate(null)}
                                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg"
                              >
                                ✕ Close
                              </button>
                            </div>

                            {/* Actual high-fidelity Certificate Frame */}
                            <div
                              id="print-certificate-container"
                              className="bg-[#FCFBF7] text-slate-900 border-8 border-double border-emerald-800 rounded-lg p-8 sm:p-12 space-y-6 sm:space-y-8 relative overflow-hidden shadow-md mx-auto"
                              style={{ width: "100%", maxWidth: "800px" }}
                            >
                              {/* Islamic geometric pattern border visual elements */}
                              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-600 opacity-30"></div>
                              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-600 opacity-30"></div>
                              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-600 opacity-30"></div>
                              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-600 opacity-30"></div>

                              {/* Academy Badge */}
                              <div className="text-center space-y-1">
                                <div className="text-xs uppercase tracking-widest font-bold text-amber-700">شَهَادَةُ إِتْمَام</div>
                                <h1 className="text-xl sm:text-2xl font-serif font-bold text-emerald-850 tracking-wider">ABU QOONITAH ISLAMIC ACADEMY</h1>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Authorized Board of Islamic Education Studies</p>
                              </div>

                              {/* Title */}
                              <div className="text-center space-y-2">
                                <div className="h-px bg-amber-500/30 w-1/3 mx-auto"></div>
                                <h2 className="text-lg sm:text-xl font-serif text-amber-700 italic">Certificate of Achievement</h2>
                                <div className="h-px bg-amber-500/30 w-1/3 mx-auto"></div>
                              </div>

                              {/* Body Text */}
                              <div className="text-center space-y-4 max-w-2xl mx-auto text-xs leading-relaxed text-slate-700">
                                <p className="font-light">This is to certify that the beloved student</p>
                                <p className="text-lg sm:text-2xl font-bold text-emerald-850 underline decoration-amber-500 decoration-2 underline-offset-8 font-sans py-1">
                                  {currentUser.name}
                                </p>
                                <p className="font-light">
                                  has successfully passed all scheduled examinations, completed homework worksheets, and fulfilled the curriculum requirements for the
                                </p>
                                <p className="text-sm sm:text-base font-bold text-emerald-950 uppercase tracking-wider font-sans bg-emerald-500/5 py-1.5 px-4 rounded-full border border-emerald-100 inline-block">
                                  {activeCertificate === "beginner" ? "Beginner Section (Al-Mubtadi’)" : "Intermediate Section (Al-Mutawassit)"}
                                </p>
                                <p className="font-light">
                                  of the official academic syllabus, showing upright character, perseverance, and dedication in pursuing Islamic knowledge.
                                </p>
                              </div>

                              {/* Signatures & Seal */}
                              <div className="pt-6 sm:pt-10 grid grid-cols-3 gap-4 items-end text-center">
                                <div className="space-y-1 text-[10px]">
                                  <div className="font-semibold text-slate-800">Ishaq Ridwanullah B.</div>
                                  <div className="h-px bg-slate-300 w-full"></div>
                                  <div className="text-[9px] text-slate-500">Academy Director</div>
                                </div>

                                <div className="flex justify-center items-center">
                                  {/* Beautiful Golden Islamic Seal Ribbon SVG */}
                                  <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center border-4 border-white shadow-md relative">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-800 flex items-center justify-center text-[10px] font-bold text-amber-950 font-mono">
                                      SEAL
                                    </div>
                                    <div className="absolute -bottom-2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-amber-500"></div>
                                  </div>
                                </div>

                                <div className="space-y-1 text-[10px]">
                                  <div className="font-mono text-slate-800">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                  <div className="h-px bg-slate-300 w-full"></div>
                                  <div className="text-[9px] text-slate-500">Date of Graduation</div>
                                </div>
                              </div>
                            </div>

                            {/* Print Controls */}
                            <div className="flex justify-end gap-3 pt-3">
                              <button
                                onClick={() => setActiveCertificate(null)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                              >
                                Close
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                              >
                                🖨️ Print Certificate
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* === B. TEACHER PORTAL WORKSPACE === */}
              {currentUser.role === "teacher" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* Teacher Sub-tab Navigation Pills */}
                  <div className="flex flex-wrap gap-2 border-b border-emerald-100 dark:border-emerald-800 pb-4">
                    <button
                      onClick={() => setTeacherSubTab("tracker")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        teacherSubTab === "tracker"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Student Roster & Progress</span>
                    </button>
                    <button
                      onClick={() => setTeacherSubTab("grading")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        teacherSubTab === "grading"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Grading Worksheet Center</span>
                    </button>
                    <button
                      onClick={() => setTeacherSubTab("attendance")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        teacherSubTab === "attendance"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Log Daily Attendance</span>
                    </button>
                    <button
                      onClick={() => setTeacherSubTab("announcements")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        teacherSubTab === "announcements"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Class Announcements</span>
                    </button>
                    <button
                      onClick={() => setTeacherSubTab("curriculum")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        teacherSubTab === "curriculum"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Classroom Curriculum</span>
                    </button>
                    <button
                      onClick={() => setTeacherSubTab("admissions")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        teacherSubTab === "admissions"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <Key className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>Admission Credentials List</span>
                    </button>
                  </div>

                  {/* SUB-TAB 1: STUDENT ROSTER & DETAILS TRACKER */}
                  {teacherSubTab === "tracker" && (
                    <div className="space-y-6">
                      {/* Tracker Analytics Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-emerald-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 text-center">
                          <span className="block text-2xl font-serif font-bold text-emerald-800 dark:text-amber-300">{allStudents.length}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Total Madrasah Students</span>
                        </div>
                        <div className="bg-white dark:bg-emerald-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 text-center">
                          <span className="block text-2xl font-serif font-bold text-emerald-800 dark:text-amber-300">
                            {allStudents.filter(s => s.level === "beginner").length}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Beginners (Mubtadi')</span>
                        </div>
                        <div className="bg-white dark:bg-emerald-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 text-center">
                          <span className="block text-2xl font-serif font-bold text-emerald-800 dark:text-amber-300">
                            {allStudents.filter(s => s.level === "intermediate").length}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Intermediates (Mutawassit)</span>
                        </div>
                        <div className="bg-white dark:bg-emerald-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800 text-center">
                          <span className="block text-2xl font-serif font-bold text-emerald-800 dark:text-amber-300">
                            {allStudents.filter(s => s.level === "advanced").length}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Advanced (Mutaqaddim)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                        {/* Students Roster table */}
                        <div className={`bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4 ${selectedStudentDetailsId ? "lg:col-span-7" : "lg:col-span-12"}`}>
                          <div className="flex justify-between items-center pb-2 border-b border-emerald-50 dark:border-emerald-800">
                            <h3 className="text-sm font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-amber-500" />
                              <span>Registered Student List</span>
                            </h3>
                            <button
                              onClick={() => {
                                setShowAddStudentForm(!showAddStudentForm);
                                setAddStudentErrorMsg("");
                                setAddStudentSuccessMsg("");
                              }}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{showAddStudentForm ? "Close Form" : "Add Student Manually"}</span>
                            </button>
                          </div>

                          {showAddStudentForm && (
                            <form onSubmit={handleAddStudentManually} className="p-4 bg-emerald-50/20 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-800/80 rounded-xl space-y-4 animate-fade-in text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-amber-100 mb-2">
                                <UserPlus className="w-4 h-4 text-amber-500" />
                                <span>Register New Student Account</span>
                              </div>

                              {addStudentSuccessMsg && (
                                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg font-medium">
                                  {addStudentSuccessMsg}
                                </div>
                              )}
                              {addStudentErrorMsg && (
                                <div className="p-2.5 bg-red-500/10 text-red-600 rounded-lg font-medium">
                                  {addStudentErrorMsg}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={addStudentName}
                                    onChange={(e) => setAddStudentName(e.target.value)}
                                    placeholder="e.g. Ridwanullah Alabi"
                                    className="w-full bg-white dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                  <input
                                    type="email"
                                    required
                                    value={addStudentEmail}
                                    onChange={(e) => setAddStudentEmail(e.target.value)}
                                    placeholder="e.g. ridwan@gmail.com"
                                    className="w-full bg-white dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                                  <input
                                    type="text"
                                    required
                                    value={addStudentUsername}
                                    onChange={(e) => setAddStudentUsername(e.target.value)}
                                    placeholder="e.g. ridwan123"
                                    className="w-full bg-white dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Password</label>
                                  <input
                                    type="password"
                                    required
                                    value={addStudentPassword}
                                    onChange={(e) => setAddStudentPassword(e.target.value)}
                                    placeholder="Set student password"
                                    className="w-full bg-white dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class Level</label>
                                  <select
                                    value={addStudentLevel}
                                    onChange={(e) => setAddStudentLevel(e.target.value as any)}
                                    className="w-full bg-white dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white font-sans"
                                  >
                                    <option value="beginner">Beginner (Mubtadi')</option>
                                    <option value="intermediate">Intermediate (Mutawassit)</option>
                                    <option value="advanced">Advanced (Mutaqaddim)</option>
                                  </select>
                                </div>
                                <div className="space-y-1 flex flex-col justify-end">
                                  <label className="flex items-center gap-2 cursor-pointer py-2 font-sans select-none">
                                    <input
                                      type="checkbox"
                                      checked={addStudentIsPaid}
                                      onChange={(e) => setAddStudentIsPaid(e.target.checked)}
                                      className="rounded border-emerald-300 dark:border-emerald-700 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                                    />
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Financial Clearance (Paid)</span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddStudentForm(false);
                                    setAddStudentErrorMsg("");
                                    setAddStudentSuccessMsg("");
                                  }}
                                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-emerald-800/55 hover:bg-slate-300 dark:hover:bg-emerald-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-3.5 py-1.5 bg-emerald-750 hover:bg-emerald-800 text-white rounded-lg font-bold cursor-pointer transition-all"
                                >
                                  Create Student Account
                                </button>
                              </div>
                            </form>
                          )}

                          <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-amber-100 border-b border-emerald-100">
                                  <th className="p-3 font-bold">Student</th>
                                  <th className="p-3 font-bold">Class Level</th>
                                  <th className="p-3 font-bold">Financial Clearance</th>
                                  <th className="p-3 font-bold text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allStudents.map((student) => (
                                  <tr
                                    key={student.id}
                                    className={`border-b border-emerald-50/10 hover:bg-emerald-50/10 text-emerald-800 dark:text-emerald-200 cursor-pointer ${
                                      selectedStudentDetailsId === student.id ? "bg-emerald-50/30 dark:bg-emerald-950/25" : ""
                                    }`}
                                    onClick={() => setSelectedStudentDetailsId(student.id)}
                                  >
                                    <td className="p-3">
                                      <div className="font-semibold">{student.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{student.email}</div>
                                    </td>
                                    <td className="p-3">
                                      <span className="uppercase text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-amber-400 px-2 py-0.5 rounded">
                                        {student.level}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      {student.isPaid ? (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                          <CheckCircle2 className="w-3 h-3" /> Clear
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                          <Lock className="w-3 h-3" /> Locked
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedStudentDetailsId(student.id); }}
                                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold cursor-pointer"
                                      >
                                        View Log
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Individual Student Detail Sidebar panel */}
                        {selectedStudentDetailsId && (() => {
                          const student = allStudents.find(s => s.id === selectedStudentDetailsId);
                          if (!student) return null;
                          return (
                            <div className="lg:col-span-5 bg-white dark:bg-emerald-900 rounded-xl p-6 border border-amber-500/30 dark:border-emerald-800 shadow-md space-y-6 animate-fade-in relative font-sans">
                              <button
                                onClick={() => setSelectedStudentDetailsId(null)}
                                className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-red-500 p-1 bg-slate-100 dark:bg-emerald-950 rounded-full cursor-pointer"
                              >
                                ✕
                              </button>

                              <div className="border-b border-emerald-100 dark:border-emerald-800 pb-4 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-amber-600 font-mono tracking-widest">Student Profile Card</span>
                                    <h4 className="text-base font-bold text-emerald-950 dark:text-amber-100">{student.name}</h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">Username: {student.username} • Level: {student.level.toUpperCase()}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setIsEditingStudentCredentials(!isEditingStudentCredentials);
                                      setEditStudentSuccessMsg("");
                                      setEditStudentErrorMsg("");
                                    }}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Settings className="w-3 h-3" />
                                    <span>{isEditingStudentCredentials ? "Cancel Edit" : "Edit Credentials"}</span>
                                  </button>
                                </div>

                                {isEditingStudentCredentials && (
                                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800 rounded-lg space-y-3 animate-fade-in mt-2 text-xs">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">Edit Credentials & Info</div>

                                    {editStudentSuccessMsg && (
                                      <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded text-[11px] font-medium">
                                        {editStudentSuccessMsg}
                                      </div>
                                    )}
                                    {editStudentErrorMsg && (
                                      <div className="p-2 bg-red-500/10 text-red-600 rounded text-[11px] font-medium">
                                        {editStudentErrorMsg}
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                                        <input
                                          type="text"
                                          value={editStudentName}
                                          onChange={(e) => setEditStudentName(e.target.value)}
                                          className="w-full bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-800 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                                        <input
                                          type="email"
                                          value={editStudentEmail}
                                          onChange={(e) => setEditStudentEmail(e.target.value)}
                                          className="w-full bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-800 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Username</label>
                                        <input
                                          type="text"
                                          value={editStudentUsername}
                                          onChange={(e) => setEditStudentUsername(e.target.value)}
                                          className="w-full bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-800 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">New Password</label>
                                        <input
                                          type="password"
                                          value={editStudentPassword}
                                          onChange={(e) => setEditStudentPassword(e.target.value)}
                                          placeholder="•••••••• (leave blank to keep unchanged)"
                                          className="w-full bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-800 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Class Level</label>
                                        <select
                                          value={editStudentLevel}
                                          onChange={(e) => setEditStudentLevel(e.target.value as any)}
                                          className="w-full bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-800 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white font-sans"
                                        >
                                          <option value="beginner">Beginner (Mubtadi')</option>
                                          <option value="intermediate">Intermediate (Mutawassit)</option>
                                          <option value="advanced">Advanced (Mutaqaddim)</option>
                                        </select>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStudentCredentials(student.id)}
                                      className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold cursor-pointer text-xs"
                                    >
                                      Save Changes
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* 50-Mark Semester 1 grading board */}
                              {(() => {
                                const marks = calculateSemesterMarks(student.name);
                                return (
                                  <div className="bg-amber-500/5 dark:bg-emerald-950/25 border border-amber-500/25 rounded-xl p-3.5 space-y-3 text-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-slate-700 dark:text-emerald-100 flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Semester 1 Grade Board</span>
                                      </span>
                                      <span className="font-mono font-bold text-emerald-800 dark:text-amber-300 bg-white dark:bg-emerald-900 border border-emerald-150 px-2 py-0.5 rounded">
                                        {marks.totalMarks} / 50 Marks
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
                                      <div className="bg-white dark:bg-emerald-900/60 p-2 rounded border border-emerald-50/20 dark:border-emerald-800">
                                        <span className="text-slate-400 block uppercase tracking-wider font-mono">Assignments</span>
                                        <span className="font-bold text-emerald-800 dark:text-amber-300 font-mono">{marks.assignmentMarks} / 20</span>
                                      </div>
                                      <div className="bg-white dark:bg-emerald-900/60 p-2 rounded border border-emerald-50/20 dark:border-emerald-800">
                                        <span className="text-slate-400 block uppercase tracking-wider font-mono">CBT Test</span>
                                        <span className="font-bold text-emerald-800 dark:text-amber-300 font-mono">{marks.cbtMark} / 5</span>
                                      </div>
                                      <div className="bg-white dark:bg-emerald-900/60 p-2 rounded border border-emerald-50/20 dark:border-emerald-800">
                                        <span className="text-slate-400 block uppercase tracking-wider font-mono">Oral Test</span>
                                        <span className="font-bold text-emerald-800 dark:text-amber-300 font-mono">{marks.oralMark} / 5</span>
                                      </div>
                                      <div className="bg-white dark:bg-emerald-900/60 p-2 rounded border border-emerald-50/20 dark:border-emerald-800">
                                        <span className="text-slate-400 block uppercase tracking-wider font-mono">Final Exam</span>
                                        <span className="font-bold text-emerald-800 dark:text-amber-300 font-mono">{marks.finalMark} / 20</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Attendance logs for selected student */}
                              <div className="space-y-3">
                                <h5 className="font-bold text-xs text-emerald-850 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-emerald-600" />
                                  <span>Recorded Attendance Logs</span>
                                </h5>

                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                  {Object.entries(student.attendance || {}).flatMap(([cId, logs]) => {
                                    const cTitle = courses.find(c => c.id === cId)?.title || "Classroom Lecture";
                                    return (logs as any[]).map((log, idx) => (
                                      <div key={`${cId}-${idx}`} className="p-2.5 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded flex justify-between items-center text-xs">
                                        <div className="font-sans">
                                          <div className="font-semibold text-emerald-900 dark:text-white truncate max-w-[150px]">{cTitle}</div>
                                          <div className="text-[10px] text-slate-400 font-mono">{new Date(log.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                          log.status === "present"
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-red-500/10 text-red-600"
                                        }`}>
                                          {log.status}
                                        </span>
                                      </div>
                                    ));
                                  })}
                                  {Object.keys(student.attendance || {}).length === 0 && (
                                    <p className="text-[11px] text-slate-400 italic py-4 text-center">No attendance recorded in general ledger.</p>
                                  )}
                                </div>
                              </div>

                              {/* Student Academic performance statistics */}
                              <div className="space-y-3 pt-4 border-t border-emerald-50 dark:border-emerald-800">
                                <h5 className="font-bold text-xs text-emerald-850 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1">
                                  <Award className="w-4 h-4 text-emerald-600" />
                                  <span>Classroom Submissions</span>
                                </h5>

                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                  {submissions
                                    .filter(sub => sub.studentName === student.name)
                                    .map((sub) => (
                                      <div key={sub.id} className="p-2.5 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-850 rounded flex justify-between items-center text-xs">
                                        <div>
                                          <div className="font-semibold text-emerald-900 dark:text-white">{sub.referenceTitle}</div>
                                          <div className="text-[10px] text-slate-400">{sub.courseTitle}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                          sub.status === "graded"
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-amber-500/10 text-amber-600"
                                        }`}>
                                          {sub.status === "graded" ? `${sub.score}/${sub.maxPoints} pts` : "Pending"}
                                        </span>
                                      </div>
                                    ))}
                                  {submissions.filter(sub => sub.studentName === student.name).length === 0 && (
                                    <p className="text-[11px] text-slate-400 italic py-4 text-center">No quiz or homework submitted yet.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: GRADING WORKSHEET QUEUE */}
                  {teacherSubTab === "grading" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-emerald-50 dark:border-emerald-850">
                        <div className="space-y-1">
                          <h2 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-sans">
                            <Award className="w-5 h-5 text-amber-500" />
                            <span>Academic Grading Center</span>
                          </h2>
                          <p className="text-xs text-slate-500">Assess, score, and provide feedback on student homework answers and exam sheets.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setShowManualGradeForm(!showManualGradeForm);
                              if (courses.length > 0) {
                                setManualGradeCourseId(courses[0].id);
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                          >
                            <span>{showManualGradeForm ? "✕ Close Form" : "[+] Log Manual Grade"}</span>
                          </button>
                          <div className="flex bg-emerald-50 dark:bg-emerald-950 p-1 rounded-lg border border-emerald-100 dark:border-emerald-850">
                            <button
                              onClick={() => { setGradingFilter("pending"); setGradingSubmission(null); }}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                gradingFilter === "pending"
                                  ? "bg-emerald-700 text-white shadow-xs"
                                  : "text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                              }`}
                            >
                              Pending Review ({submissions.filter(s => s.status === "pending").length})
                            </button>
                            <button
                              onClick={() => { setGradingFilter("graded"); setGradingSubmission(null); }}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                gradingFilter === "graded"
                                  ? "bg-emerald-700 text-white shadow-xs"
                                  : "text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                              }`}
                            >
                              Graded History ({submissions.filter(s => s.status === "graded").length})
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Search & Type Filter Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/55 dark:border-emerald-850/60 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-850 dark:text-emerald-300 uppercase tracking-wide font-mono block">🔍 Search Student or Item</label>
                          <input
                            type="text"
                            value={gradingSearchText}
                            onChange={(e) => setGradingSearchText(e.target.value)}
                            placeholder="Type student name, course or assignment title..."
                            className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-850 dark:text-emerald-300 uppercase tracking-wide font-mono block">📚 Filter Submission Type</label>
                          <select
                            value={gradingTypeFilter}
                            onChange={(e: any) => setGradingTypeFilter(e.target.value)}
                            className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white cursor-pointer"
                          >
                            <option value="all">📖 All Submissions</option>
                            <option value="assignment">📝 Written Worksheets / Homework</option>
                            <option value="quiz">📝 Computer-Based Quizzes</option>
                            <option value="exam">🎓 Final Exams / CBT Tests</option>
                          </select>
                        </div>
                        <div className="flex items-end justify-end">
                          {(gradingSearchText || gradingTypeFilter !== "all") && (
                            <button
                              onClick={() => { setGradingSearchText(""); setGradingTypeFilter("all"); }}
                              className="px-3 py-2 bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded text-xs transition-all cursor-pointer border border-slate-200/50 dark:border-emerald-850"
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Log Manual Custom Grade Form */}
                      {showManualGradeForm && (
                        <form onSubmit={handleManualGradeSubmit} className="bg-amber-50/50 dark:bg-emerald-950/25 border border-amber-500/25 rounded-xl p-5 space-y-4 text-xs animate-fade-in text-emerald-950 dark:text-white">
                          <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
                            <span className="font-bold text-slate-700 dark:text-emerald-100 flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-500" />
                              <span>Log Manual Student Grade / Extra Credit</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Offline recitation or printed homework grade ledger</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Student Name</label>
                              <input
                                type="text"
                                list="student-suggestions"
                                required
                                value={manualGradeStudentName}
                                onChange={(e) => setManualGradeStudentName(e.target.value)}
                                placeholder="Enter student's exact name"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                              />
                              <datalist id="student-suggestions">
                                {allStudents.map((s, idx) => <option key={idx} value={s.name} />)}
                              </datalist>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Target Course Level</label>
                              <select
                                required
                                value={manualGradeCourseId}
                                onChange={(e) => setManualGradeCourseId(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none text-emerald-950 dark:text-white cursor-pointer"
                              >
                                <option value="">-- Select Course --</option>
                                {courses.map((c) => (
                                  <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Grading Category</label>
                              <select
                                required
                                value={manualGradeType}
                                onChange={(e) => setManualGradeType(e.target.value as any)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none text-emerald-950 dark:text-white cursor-pointer"
                              >
                                <option value="assignment">Homework Worksheet</option>
                                <option value="quiz">CBT Quiz</option>
                                <option value="exam">Written Term Exam</option>
                                <option value="oral">Oral Examination</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1 md:col-span-1">
                              <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Worksheet / Exam Title</label>
                              <input
                                type="text"
                                required
                                value={manualGradeReferenceTitle}
                                onChange={(e) => setManualGradeReferenceTitle(e.target.value)}
                                placeholder="e.g. Surah Al-Baqarah Recitation Test"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Obtained Score</label>
                              <input
                                type="number"
                                min="0"
                                required
                                value={manualGradeScore}
                                onChange={(e) => setManualGradeScore(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="e.g. 18"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Max Possible Points</label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={manualGradeMaxPoints}
                                onChange={(e) => setManualGradeMaxPoints(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="e.g. 20"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono text-[9px]">Teacher Remarks & Constructive Feedback</label>
                            <input
                              type="text"
                              value={manualGradeComments}
                              onChange={(e) => setManualGradeComments(e.target.value)}
                              placeholder="e.g. Mumtaz! Exceptional oral fluency and tajweed rules application."
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <button type="submit" className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer">
                              Publish & Save Grade
                            </button>
                            <button type="button" onClick={() => setShowManualGradeForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded text-xs cursor-pointer">
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-4 font-sans">
                        {/* Pending Submissions */}
                        {gradingFilter === "pending" && submissions
                          .filter(s => s.status === "pending")
                          .filter(s => gradingTypeFilter === "all" || s.type === gradingTypeFilter)
                          .filter(s => {
                            if (!gradingSearchText) return true;
                            const q = gradingSearchText.toLowerCase();
                            return s.studentName.toLowerCase().includes(q) ||
                                   s.courseTitle.toLowerCase().includes(q) ||
                                   (s.referenceTitle || "").toLowerCase().includes(q);
                          })
                          .map((sub) => (
                          <div key={sub.id} className="p-5 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-4 text-xs text-emerald-950 dark:text-white">
                            <div className="flex justify-between items-start border-b border-emerald-100 dark:border-emerald-800/65 pb-2">
                              <div>
                                <span className="font-bold text-emerald-900 dark:text-white text-sm block">{sub.studentName}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Course: {sub.courseTitle} • Published {new Date(sub.submittedAt).toLocaleDateString()}</span>
                              </div>
                              <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1 rounded text-[10px] uppercase font-mono tracking-wider">
                                {sub.type}
                              </span>
                            </div>

                            <div className="bg-white dark:bg-emerald-950 p-4 rounded-lg border border-emerald-100 dark:border-emerald-850 text-xs leading-relaxed text-emerald-800 dark:text-slate-350 space-y-3">
                              <span className="font-bold font-sans text-[10px] text-amber-600 block uppercase">STUDENT ANSWER WORKSHEET & MEDIA ATTACHMENTS:</span>
                              {(() => {
                                try {
                                  if (sub.submissionContent.startsWith("{") && sub.submissionContent.endsWith("}")) {
                                    const parsed = JSON.parse(sub.submissionContent);
                                    
                                    // If it's a quiz or exam, or has numeric choices (not text/photos/audio)
                                    if (sub.type === "quiz" || sub.type === "exam" || (!parsed.text && !parsed.photos && !parsed.audio)) {
                                      const courseObj = courses.find(c => c.id === sub.courseId);
                                      const quizObj = courseObj?.quizzes.find(q => q.id === sub.referenceId);
                                      
                                      if (quizObj && quizObj.questions) {
                                        let correctCount = 0;
                                        quizObj.questions.forEach((q) => {
                                          if (parsed[q.id] === q.correctAnswerIndex) {
                                            correctCount++;
                                          }
                                        });
                                        
                                        return (
                                          <div className="space-y-4">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/50 flex justify-between items-center text-xs">
                                              <div>
                                                <span className="font-bold text-emerald-950 dark:text-emerald-100">📋 {quizObj.title}</span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">Total Questions: {quizObj.questions.length} Questions</span>
                                              </div>
                                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                                Score: {correctCount} / {quizObj.questions.length} Correct ({Math.round((correctCount / quizObj.questions.length) * 100)}%)
                                              </span>
                                            </div>
                                            
                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                              {quizObj.questions.map((q, idx) => {
                                                const studentChoice = parsed[q.id];
                                                const isCorrect = studentChoice === q.correctAnswerIndex;
                                                return (
                                                  <div key={idx} className={`p-3 rounded-lg border text-xs ${
                                                    isCorrect 
                                                      ? "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50" 
                                                      : "bg-red-50/10 dark:bg-red-950/15 border-red-100/40 dark:border-red-900/30"
                                                  }`}>
                                                    <div className="font-semibold flex items-start gap-1.5 text-emerald-950 dark:text-white">
                                                      <span>{idx + 1}.</span>
                                                      <span>{q.questionText}</span>
                                                      {studentChoice !== undefined ? (
                                                        isCorrect ? (
                                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-auto shrink-0">✓ Correct</span>
                                                        ) : (
                                                          <span className="text-red-550 dark:text-red-400 font-bold ml-auto shrink-0">✗ Incorrect</span>
                                                        )
                                                      ) : (
                                                        <span className="text-slate-400 font-bold ml-auto shrink-0">Unanswered</span>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4">
                                                      {q.options.map((opt, oIdx) => {
                                                        const isChosen = studentChoice === oIdx;
                                                        const isCorrectOpt = q.correctAnswerIndex === oIdx;
                                                        return (
                                                          <div key={oIdx} className={`p-1.5 rounded text-[11px] border ${
                                                            isCorrectOpt
                                                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium"
                                                              : isChosen
                                                                ? "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400"
                                                                : "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/50 text-slate-550 dark:text-slate-400"
                                                          }`}>
                                                            <div className="flex items-center gap-1.5">
                                                              <span className="font-mono text-[9px] text-slate-400">({String.fromCharCode(65 + oIdx)})</span>
                                                              <span>{opt}</span>
                                                              {isChosen && <span className="text-[8px] uppercase px-1 py-0.1 bg-slate-200 dark:bg-slate-800 rounded font-bold font-mono shrink-0 font-bold">Chosen</span>}
                                                            </div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="space-y-1 bg-slate-50 dark:bg-emerald-950/20 p-3 rounded border border-slate-200">
                                            <span className="font-bold text-amber-600 block uppercase font-mono text-[10px]">CBT Quiz Submissions:</span>
                                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                              {Object.entries(parsed).map(([qKey, val]) => (
                                                <div key={qKey} className="p-1 bg-white dark:bg-emerald-950 rounded border">
                                                  <span className="text-emerald-700">Question {qKey}:</span> Option Index {String(val)}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                    }

                                    const rich = parsed;
                                    return (
                                      <div className="space-y-4">
                                        {rich.text && (
                                          <div className="whitespace-pre-wrap font-serif text-xs bg-emerald-50/20 dark:bg-emerald-950/40 p-3 rounded border border-emerald-100/40 text-emerald-900 dark:text-emerald-105">
                                            {rich.text}
                                          </div>
                                        )}
                                        
                                        {rich.photos && rich.photos.length > 0 && (
                                          <div className="space-y-1.5">
                                            <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-300 block">Uploaded Photos ({rich.photos.length}):</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                                              {rich.photos.map((src: string, idx: number) => (
                                                <a key={idx} href={src} target="_blank" rel="noopener noreferrer" className="relative group block rounded border border-emerald-100 overflow-hidden bg-slate-50 aspect-square">
                                                  <img src={src} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold">Zoom Page</span>
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {rich.audio && (
                                          <div className="space-y-1.5 bg-emerald-50/10 dark:bg-emerald-950/40 p-2.5 rounded border border-emerald-100/50">
                                            <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                              <span>🎙️ Recorded Voice Note / Student Explanation:</span>
                                            </span>
                                            <audio src={rich.audio} controls className="w-full h-8 mt-1 text-xs" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                } catch (err) {}
                                
                                // Fallback to plain text
                                return <div className="break-all font-mono text-[11px] whitespace-pre-wrap">{sub.submissionContent}</div>;
                              })()}
                            </div>

                            {gradingSubmission?.id === sub.id ? (
                              <form onSubmit={handleGradeSubmit} className="space-y-3 pt-2 border-t border-dashed border-emerald-100 dark:border-emerald-850 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-800 block uppercase font-mono">Score Out of {sub.maxPoints} Points</span>
                                    <input
                                      type="number"
                                      max={sub.maxPoints}
                                      required
                                      value={gradingScore || ""}
                                      onChange={(e) => setGradingScore(Number(e.target.value))}
                                      placeholder={`Enter score (0 - ${sub.maxPoints})`}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-800 block uppercase font-mono">Remarks & Constructive Feedback</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. Mumtaz! Perfect syntax analysis"
                                      value={gradingComments}
                                      onChange={(e) => setGradingComments(e.target.value)}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button type="submit" className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] cursor-pointer">
                                    Record Grade & Verify
                                  </button>
                                  <button type="button" onClick={() => setGradingSubmission(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] cursor-pointer">
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => { setGradingSubmission(sub); setGradingScore(sub.maxPoints ?? 100); }}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                                >
                                  <span>Assess & Grade Sheet</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubmission(sub.id)}
                                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1 border border-red-200/50"
                                  title="Reject and Delete submission entirely"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Reset Submission</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Graded History */}
                        {gradingFilter === "graded" && submissions
                          .filter(s => s.status === "graded")
                          .filter(s => gradingTypeFilter === "all" || s.type === gradingTypeFilter)
                          .filter(s => {
                            if (!gradingSearchText) return true;
                            const q = gradingSearchText.toLowerCase();
                            return s.studentName.toLowerCase().includes(q) ||
                                   s.courseTitle.toLowerCase().includes(q) ||
                                   (s.referenceTitle || "").toLowerCase().includes(q);
                          })
                          .map((sub) => (
                          <div key={sub.id} className="p-4 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-3 text-xs text-emerald-950 dark:text-white">
                            <div className="flex justify-between items-start border-b border-emerald-50 dark:border-emerald-900/30 pb-2">
                              <div>
                                <span className="font-bold text-emerald-950 dark:text-white text-sm block">{sub.studentName}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Course: {sub.courseTitle} • Graded on {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                <span className="inline-block mt-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[9px] uppercase font-mono">
                                  {sub.type} {sub.referenceTitle ? `(${sub.referenceTitle})` : ""}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-700 dark:text-amber-400 font-mono text-sm block">{sub.score} / {sub.maxPoints}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-bold">Obtained Grade</span>
                              </div>
                            </div>

                            {/* Inline edit form or static display */}
                            {editingGradedSubmission?.id === sub.id ? (
                              <form onSubmit={handleEditGradedSubmit} className="space-y-3 p-3 bg-slate-50 dark:bg-emerald-950/40 rounded-lg border border-dashed border-emerald-200 animate-fade-in text-emerald-950 dark:text-white">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono">Edit Grade Score (Max: {sub.maxPoints})</span>
                                    <input
                                      type="number"
                                      max={sub.maxPoints}
                                      required
                                      value={editGradedScore || ""}
                                      onChange={(e) => setEditGradedScore(e.target.value === "" ? "" : Number(e.target.value))}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase font-mono">Update Remarks / Comments</span>
                                    <input
                                      type="text"
                                      value={editGradedComments}
                                      onChange={(e) => setEditGradedComments(e.target.value)}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button type="submit" className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[10px] cursor-pointer">
                                    Save Grade
                                  </button>
                                  <button type="button" onClick={() => setEditingGradedSubmission(null)} className="px-3 py-1.5 bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded text-[10px] cursor-pointer">
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="bg-slate-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-slate-200/50 dark:border-emerald-900/30 text-xs leading-relaxed space-y-3 mb-3">
                                  <span className="font-bold font-sans text-[10px] text-slate-500 block uppercase">Student Submission:</span>
                                  {(() => {
                                    try {
                                      if (sub.submissionContent.startsWith("{") && sub.submissionContent.endsWith("}")) {
                                        const parsed = JSON.parse(sub.submissionContent);
                                        
                                        // If it's a quiz or exam, or has numeric choices (not text/photos/audio)
                                        if (sub.type === "quiz" || sub.type === "exam" || (!parsed.text && !parsed.photos && !parsed.audio)) {
                                          const courseObj = courses.find(c => c.id === sub.courseId);
                                          const quizObj = courseObj?.quizzes.find(q => q.id === sub.referenceId);
                                          
                                          if (quizObj && quizObj.questions) {
                                            let correctCount = 0;
                                            quizObj.questions.forEach((q) => {
                                              if (parsed[q.id] === q.correctAnswerIndex) {
                                                correctCount++;
                                              }
                                            });
                                            
                                            return (
                                              <div className="space-y-4">
                                                <div className="p-3 bg-white dark:bg-emerald-950 rounded-lg border flex justify-between items-center text-xs">
                                                  <div>
                                                    <span className="font-bold text-emerald-950 dark:text-emerald-100">📋 {quizObj.title}</span>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">Total Questions: {quizObj.questions.length} Questions</span>
                                                  </div>
                                                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                                    Score: {correctCount} / {quizObj.questions.length} Correct ({Math.round((correctCount / quizObj.questions.length) * 100)}%)
                                                  </span>
                                                </div>
                                                
                                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                                  {quizObj.questions.map((q, idx) => {
                                                    const studentChoice = parsed[q.id];
                                                    const isCorrect = studentChoice === q.correctAnswerIndex;
                                                    return (
                                                      <div key={idx} className={`p-3 rounded-lg border text-xs ${
                                                        isCorrect 
                                                          ? "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50" 
                                                          : "bg-red-50/10 dark:bg-red-950/15 border-red-100/40 dark:border-red-900/30"
                                                      }`}>
                                                        <div className="font-semibold flex items-start gap-1.5 text-emerald-950 dark:text-white">
                                                          <span>{idx + 1}.</span>
                                                          <span>{q.questionText}</span>
                                                          {studentChoice !== undefined ? (
                                                            isCorrect ? (
                                                              <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-auto shrink-0 font-bold">✓ Correct</span>
                                                            ) : (
                                                              <span className="text-red-550 dark:text-red-400 font-bold ml-auto shrink-0 font-bold">✗ Incorrect</span>
                                                            )
                                                          ) : (
                                                            <span className="text-slate-400 font-bold ml-auto shrink-0">Unanswered</span>
                                                          )}
                                                        </div>
                                                        
                                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4">
                                                          {q.options.map((opt, oIdx) => {
                                                            const isChosen = studentChoice === oIdx;
                                                            const isCorrectOpt = q.correctAnswerIndex === oIdx;
                                                            return (
                                                              <div key={oIdx} className={`p-1.5 rounded text-[11px] border ${
                                                                isCorrectOpt
                                                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium"
                                                                  : isChosen
                                                                    ? "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400"
                                                                    : "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/50 text-slate-550 dark:text-slate-400"
                                                              }`}>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="font-mono text-[9px] text-slate-400">({String.fromCharCode(65 + oIdx)})</span>
                                                                  <span>{opt}</span>
                                                                  {isChosen && <span className="text-[8px] uppercase px-1 py-0.1 bg-slate-200 dark:bg-slate-800 rounded font-bold font-mono shrink-0">Chosen</span>}
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="space-y-1 bg-slate-50 dark:bg-emerald-950/20 p-3 rounded border border-slate-200">
                                                <span className="font-bold text-amber-600 block uppercase font-mono text-[10px]">CBT Quiz Submissions:</span>
                                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                                  {Object.entries(parsed).map(([qKey, val]) => (
                                                    <div key={qKey} className="p-1 bg-white dark:bg-emerald-950 rounded border">
                                                      <span className="text-emerald-700">Question {qKey}:</span> Option Index {String(val)}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          }
                                        }

                                        const rich = parsed;
                                        return (
                                          <div className="space-y-3">
                                            {rich.text && (
                                              <div className="whitespace-pre-wrap font-serif text-xs bg-white dark:bg-emerald-950/50 p-2 rounded border border-slate-100 text-emerald-900 dark:text-emerald-100 font-normal">
                                                {rich.text}
                                              </div>
                                            )}
                                            
                                            {rich.photos && rich.photos.length > 0 && (
                                              <div className="space-y-1">
                                                <span className="font-bold text-[9px] text-slate-500 block">Uploaded Photos ({rich.photos.length}):</span>
                                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                  {rich.photos.map((src: string, idx: number) => (
                                                    <a key={idx} href={src} target="_blank" rel="noopener noreferrer" className="relative group block rounded border border-slate-200 overflow-hidden bg-white aspect-square">
                                                      <img src={src} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[8px] font-bold">Zoom</span>
                                                    </a>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {rich.audio && (
                                              <div className="space-y-1 bg-white dark:bg-emerald-950/40 p-2 rounded border border-slate-200/50">
                                                <span className="font-bold text-[9px] text-slate-500 flex items-center gap-1">
                                                  <span>🎙️ Recorded Voice Note / Audio:</span>
                                                </span>
                                                <audio src={rich.audio} controls className="w-full h-8 mt-1 text-xs" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                    } catch (err) {}
                                    
                                    // Fallback to plain text
                                    return <div className="break-all font-mono text-[10px] whitespace-pre-wrap">{sub.submissionContent}</div>;
                                  })()}
                                </div>

                                <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-2.5 rounded text-[11px] font-sans italic text-emerald-800 dark:text-slate-300 border border-emerald-100/50 dark:border-emerald-900/30">
                                  <span className="font-bold font-mono text-[9px] text-amber-600 block uppercase not-italic font-sans">Teacher Remarks:</span>
                                  "{sub.comments || "Good effort. Keep up the high level work."}" — graded by {sub.gradedBy || "System Auto-Mark"}
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingGradedSubmission(sub);
                                      setEditGradedScore(sub.score);
                                      setEditGradedComments(sub.comments || "");
                                    }}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 border border-emerald-100 dark:border-emerald-850"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit Score/Remarks</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubmission(sub.id)}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                    title="Delete graded record completely"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete Record</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Empty states */}
                        {gradingFilter === "pending" && submissions
                          .filter(s => s.status === "pending")
                          .filter(s => gradingTypeFilter === "all" || s.type === gradingTypeFilter)
                          .filter(s => {
                            if (!gradingSearchText) return true;
                            const q = gradingSearchText.toLowerCase();
                            return s.studentName.toLowerCase().includes(q) ||
                                   s.courseTitle.toLowerCase().includes(q) ||
                                   (s.referenceTitle || "").toLowerCase().includes(q);
                          }).length === 0 && (
                          <div className="text-center py-12 bg-emerald-50/10 rounded-xl border border-dashed border-emerald-200">
                            <p className="text-xs text-slate-400 italic font-serif">
                              {gradingSearchText || gradingTypeFilter !== "all" 
                                ? "No pending worksheets matched your search filters."
                                : "No pending student worksheets to grade. Alhamdulillah, you are all caught up!"}
                            </p>
                          </div>
                        )}
                        {gradingFilter === "graded" && submissions
                          .filter(s => s.status === "graded")
                          .filter(s => gradingTypeFilter === "all" || s.type === gradingTypeFilter)
                          .filter(s => {
                            if (!gradingSearchText) return true;
                            const q = gradingSearchText.toLowerCase();
                            return s.studentName.toLowerCase().includes(q) ||
                                   s.courseTitle.toLowerCase().includes(q) ||
                                   (s.referenceTitle || "").toLowerCase().includes(q);
                          }).length === 0 && (
                          <div className="text-center py-12 bg-emerald-50/10 rounded-xl border border-dashed border-emerald-200">
                            <p className="text-xs text-slate-400 italic font-serif">
                              {gradingSearchText || gradingTypeFilter !== "all" 
                                ? "No graded records matched your search filters."
                                : "No historical graded sheets recorded."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: ATTENDANCE LOGGER */}
                  {teacherSubTab === "attendance" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-sans">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <span>Log Daily Class Attendance</span>
                      </h3>
                      <p className="text-xs text-slate-500">Log student attendance lists to update general academic report cards accurately. Select a target course and date below:</p>

                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-4 font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block uppercase font-mono text-[10px]">SELECT ATTENDANCE DATE</span>
                            <input
                              type="date"
                              value={attendanceDate}
                              onChange={(e) => setAttendanceDate(e.target.value)}
                              className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-white dark:bg-emerald-950 text-emerald-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block uppercase font-mono text-[10px]">SELECT TARGET CLASSROOM</span>
                            <select
                              value={teacherCourseId}
                              onChange={(e) => setTeacherCourseId(e.target.value)}
                              className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-white dark:bg-emerald-950 text-emerald-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs cursor-pointer"
                            >
                              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Quick Preset Actions for teachers */}
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const update: Record<string, 'present' | 'absent'> = {};
                              allStudents.forEach(s => update[s.id] = 'present');
                              setAttendanceStatus(update);
                            }}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded border border-emerald-200/50 cursor-pointer"
                          >
                            ✓ Mark All Present
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const update: Record<string, 'present' | 'absent'> = {};
                              allStudents.forEach(s => update[s.id] = 'absent');
                              setAttendanceStatus(update);
                            }}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded border border-red-200/50 cursor-pointer"
                          >
                            ✗ Mark All Absent
                          </button>
                        </div>

                        {/* Student list Roster with radio toggles */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {allStudents.map((stud) => (
                            <div key={stud.id} className="p-3 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-850 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-emerald-900 dark:text-white block text-sm">{stud.name}</span>
                                <span className="text-[10px] text-slate-400">Level: {stud.level.toUpperCase()}</span>
                              </div>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`attend-${stud.id}`}
                                    checked={attendanceStatus[stud.id] === 'present'}
                                    onChange={() => setAttendanceStatus({ ...attendanceStatus, [stud.id]: 'present' })}
                                    className="text-emerald-700 h-3.5 w-3.5 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-[11px] font-bold text-emerald-600">Present</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`attend-${stud.id}`}
                                    checked={attendanceStatus[stud.id] === 'absent'}
                                    onChange={() => setAttendanceStatus({ ...attendanceStatus, [stud.id]: 'absent' })}
                                    className="text-emerald-750 h-3.5 w-3.5 focus:ring-red-500 cursor-pointer"
                                  />
                                  <span className="text-[11px] font-bold text-red-600">Absent</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={(e) => handlePostAttendance(e, teacherCourseId || courses[0]?.id)}
                          className="w-full py-2.5 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer active:scale-95 transition-all shadow"
                        >
                          Submit Daily Attendance Roster
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: CLASSROOM ANNOUNCEMENTS */}
                  {teacherSubTab === "announcements" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                      {/* Compose Announcements Form */}
                      <div className="lg:col-span-5 bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-1.5">
                          <Plus className="w-5 h-5 text-amber-500" />
                          <span>Broadcast New Announcement</span>
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Broadcast announcements directly to classrooms, specific student groups, or fellow Islamic academy teachers.</p>

                        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">ANNOUNCEMENT TITLE</span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Tajweed Recitation Practical Class Adjustments"
                              value={annTitle}
                              onChange={(e) => setAnnTitle(e.target.value)}
                              className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-emerald-950 dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">TARGET AUDIENCE TRACK</span>
                            <select
                              value={annTarget}
                              onChange={(e) => setAnnTarget(e.target.value as any)}
                              className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 text-emerald-950 dark:text-white cursor-pointer"
                            >
                              <option value="all">Everyone (Students & Teachers)</option>
                              <option value="student">Students Only</option>
                              <option value="teacher">Teachers Only</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">ANNOUNCEMENT BODY MESSAGE</span>
                            <textarea
                              required
                              rows={5}
                              placeholder="Type detail notes here..."
                              value={annContent}
                              onChange={(e) => setAnnContent(e.target.value)}
                              className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-emerald-950 dark:text-white font-sans"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer transition-all shadow-md font-sans"
                          >
                            Publish Announcement
                          </button>
                        </form>
                      </div>

                      {/* View & Delete Announcements Feed */}
                      <div className="lg:col-span-7 bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-1.5">
                          <Send className="w-5 h-5 text-amber-500" />
                          <span>Announcement Feed</span>
                        </h3>
                        
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {announcements.map((ann) => (
                            <div key={ann.id} className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-3 relative text-xs">
                              <button
                                onClick={() => { if(confirm("Are you sure you want to delete this announcement?")) handleDeleteAnnouncement(ann.id); }}
                                className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-red-500 p-1.5 bg-white dark:bg-emerald-900 rounded border hover:border-red-500 cursor-pointer"
                                title="Delete Announcement"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </button>

                              <div className="space-y-1 pr-6">
                                <div className="flex justify-between items-center text-[9px] font-bold text-amber-600 uppercase font-mono">
                                  <span>PUBLISHED BY {ann.author}</span>
                                  <span>{new Date(ann.date).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-serif font-bold text-emerald-950 dark:text-white text-sm">{ann.title}</h4>
                                <div className="text-[10px] font-mono text-emerald-600 uppercase font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-sm inline-block">Audience: {ann.targetRole}</div>
                                <p className="text-emerald-800 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-line mt-2">{ann.content}</p>
                              </div>
                            </div>
                          ))}
                          {announcements.length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-8">No published announcements recorded.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 5: CURRICULUM & MATERIAL PUBLISHING */}
                  {teacherSubTab === "curriculum" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-1.5 font-sans">
                              <BookOpen className="w-5 h-5 text-amber-500" />
                              <span>Classroom Curriculum & Materials Editor</span>
                            </h3>
                            <p className="text-xs text-slate-500">Select a course level below to control lectures, workbook resources, and assignment listings.</p>
                          </div>
                          <div>
                            <select
                              value={teacherCourseId}
                              onChange={(e) => setTeacherCourseId(e.target.value)}
                              className="p-2 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50 dark:bg-emerald-950 font-bold text-xs text-emerald-950 dark:text-white cursor-pointer"
                            >
                              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const activeCourse = courses.find(c => c.id === teacherCourseId) || courses[0];
                        if (!activeCourse) return (
                          <p className="text-xs text-center italic text-slate-400 py-12">No active courses configured in registry.</p>
                        );
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                            {/* Materials and homework items list */}
                            <div className="lg:col-span-7 bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                              <div className="border-b border-emerald-50 dark:border-emerald-850 pb-4">
                                <span className="text-[10px] font-bold uppercase font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">{activeCourse.level} level track</span>
                                <h3 className="text-base font-bold text-emerald-950 dark:text-white mt-2">{activeCourse.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{activeCourse.description}</p>
                              </div>

                              {/* Course Lesson Videos */}
                              <div className="space-y-3">
                                <h4 className="font-bold text-xs text-emerald-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                                  <Video className="w-4 h-4 text-emerald-700" />
                                  <span>Lesson Videos ({activeCourse.videos.length})</span>
                                </h4>
                                <div className="space-y-2">
                                  {activeCourse.videos.map((vid) => (
                                    <div key={vid.id} className="p-3 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
                                      <div className="space-y-1 flex-1">
                                        <div className="font-semibold text-emerald-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                                          <span>◈ {vid.title}</span>
                                          {(vid.audioUrl || (vid.photos && vid.photos.length > 0)) && (
                                            <span className="text-[8px] bg-amber-500/20 text-amber-750 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">Audio & Slides</span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400">{vid.description}</div>
                                        <div className="text-[9px] font-mono text-amber-600 font-bold">Duration: {vid.duration || "Audio Lecture"}</div>
                                        
                                        {/* Audio preview for teacher */}
                                        {vid.audioUrl && (
                                          <div className="mt-1.5 p-1.5 bg-white dark:bg-emerald-950/40 rounded border border-emerald-100/40 max-w-md">
                                            <span className="text-[8px] font-semibold text-emerald-700 uppercase block mb-0.5">🎙️ Lecture Audio:</span>
                                            <audio src={vid.audioUrl} controls className="w-full h-6" />
                                          </div>
                                        )}

                                        {/* Slides preview for teacher */}
                                        {vid.photos && vid.photos.length > 0 && (
                                          <div className="mt-1.5 flex gap-1 overflow-x-auto py-1">
                                            {vid.photos.map((ph, phIdx) => (
                                              <img key={phIdx} src={ph} alt="board slide" className="w-10 h-10 object-cover rounded border border-emerald-100/40" />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                                        <button
                                          onClick={() => handleStartEditMaterial(activeCourse.id, "video", vid)}
                                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 rounded cursor-pointer transition-all border border-transparent"
                                          title="Edit Lesson"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => { if(confirm(`Confirm deletion of lecture video "${vid.title}"?`)) handleDeleteCourseMaterial(activeCourse.id, "video", vid.id); }}
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 rounded cursor-pointer transition-all border border-transparent"
                                          title="Delete Lesson"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {activeCourse.videos.length === 0 && (
                                    <p className="text-[11px] text-slate-400 italic">No video classes published.</p>
                                  )}
                                </div>
                              </div>

                              {/* Course PDF Handouts */}
                              <div className="space-y-3 pt-4 border-t border-emerald-50 dark:border-emerald-850">
                                <h4 className="font-bold text-xs text-emerald-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-emerald-700" />
                                  <span>Study Workbooks & Handouts ({activeCourse.pdfs.length})</span>
                                </h4>
                                <div className="space-y-2">
                                  {activeCourse.pdfs.map((pdf) => (
                                    <div key={pdf.id} className="p-3 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg flex justify-between items-center text-xs animate-fade-in">
                                      <div>
                                        <div className="font-semibold text-emerald-950 dark:text-white">{pdf.title}</div>
                                        <div className="text-[10px] text-slate-400 line-clamp-1">{pdf.description}</div>
                                        <div className="text-[9px] font-mono text-amber-600 font-bold mt-0.5">Size: {pdf.fileSize}</div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleStartEditMaterial(activeCourse.id, "pdf", pdf)}
                                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 rounded cursor-pointer transition-all border border-transparent"
                                          title="Edit Handout"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => { if(confirm(`Confirm deletion of workbook handout "${pdf.title}"?`)) handleDeleteCourseMaterial(activeCourse.id, "pdf", pdf.id); }}
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 rounded cursor-pointer transition-all border border-transparent"
                                          title="Delete Handout"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {activeCourse.pdfs.length === 0 && (
                                    <p className="text-[11px] text-slate-400 italic">No workbook files published.</p>
                                  )}
                                </div>
                              </div>

                              {/* Course Homework Assignments */}
                              <div className="space-y-3 pt-4 border-t border-emerald-50 dark:border-emerald-850">
                                <h4 className="font-bold text-xs text-emerald-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-emerald-700" />
                                  <span>Written Homework Assignments ({activeCourse.assignments.length})</span>
                                </h4>
                                <div className="space-y-2">
                                  {activeCourse.assignments.map((ass) => (
                                    <div key={ass.id} className="p-3 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg flex justify-between items-center text-xs animate-fade-in">
                                      <div>
                                        <div className="font-semibold text-emerald-950 dark:text-white">{ass.title}</div>
                                        <div className="text-[10px] text-slate-400 line-clamp-2">{ass.description}</div>
                                        <div className="text-[9px] font-mono text-amber-600 font-bold mt-0.5">Points: {ass.points} • Due: {ass.dueDate}</div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleStartEditMaterial(activeCourse.id, "assignment", ass)}
                                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 rounded cursor-pointer transition-all border border-transparent"
                                          title="Edit Homework"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => { if(confirm(`Confirm deletion of homework assignment "${ass.title}"?`)) handleDeleteCourseMaterial(activeCourse.id, "assignment", ass.id); }}
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 rounded cursor-pointer transition-all border border-transparent"
                                          title="Delete Homework"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* CBT Quizzes list */}
                              <div className="space-y-3 pt-4 border-t border-emerald-50 dark:border-emerald-850">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-xs text-emerald-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-emerald-700" />
                                    <span>Interactive CBT Quizzes ({activeCourse.quizzes?.length || 0})</span>
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCreatingQuiz(true);
                                      setIsEditingQuiz(null);
                                      setQuizEditTitle("");
                                      setQuizEditDuration(10);
                                      setQuizEditQuestions([]);
                                      setQuizEditLimitQuestions("");
                                      setQuizEditAutomaticMarking(true);
                                      setQuizEditExamDate("");
                                    }}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                                  >
                                    [+] Create CBT Quiz
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {(activeCourse.quizzes || []).map((quiz: any) => (
                                    <div key={quiz.id} className="p-3 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg flex justify-between items-center text-xs animate-fade-in">
                                      <div>
                                        <div className="font-semibold text-emerald-950 dark:text-white">{quiz.title}</div>
                                        <div className="text-[10px] text-slate-400 line-clamp-1">⏱️ {quiz.durationMinutes} minutes limit • {quiz.questions?.length || 0} questions</div>
                                        {(quiz.limitQuestions || quiz.examDate || quiz.automaticMarking === false) && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {quiz.limitQuestions && (
                                              <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase">Show: {quiz.limitQuestions} Qs</span>
                                            )}
                                            {quiz.examDate && (
                                              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase">Exam: {quiz.examDate}</span>
                                            )}
                                            {quiz.automaticMarking === false && (
                                              <span className="bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase">Manual Marking</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => {
                                            setIsEditingQuiz(quiz);
                                            setIsCreatingQuiz(false);
                                            setQuizEditTitle(quiz.title || "");
                                            setQuizEditDuration(quiz.durationMinutes !== undefined && quiz.durationMinutes !== null ? quiz.durationMinutes : 10);
                                            setQuizEditQuestions(quiz.questions || []);
                                            setQuizEditLimitQuestions(quiz.limitQuestions !== undefined && quiz.limitQuestions !== null ? quiz.limitQuestions : "");
                                            setQuizEditAutomaticMarking(quiz.automaticMarking !== undefined && quiz.automaticMarking !== null ? quiz.automaticMarking : true);
                                            setQuizEditExamDate(quiz.examDate || "");
                                          }}
                                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 rounded cursor-pointer transition-all text-[11px]"
                                          title="Edit Quiz"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteQuiz(activeCourse.id, quiz.id)}
                                          className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 rounded cursor-pointer transition-all border border-transparent"
                                          title="Delete Quiz"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {(!activeCourse.quizzes || activeCourse.quizzes.length === 0) && (
                                    <p className="text-[11px] text-slate-400 italic">No CBT exams/quizzes published yet.</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* CONDITIONAL RIGHT COLUMN: CBT Builder OR Study Material Publisher */}
                            {(isCreatingQuiz || isEditingQuiz) ? (
                              <div className="lg:col-span-5 bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                                <div className="border-b border-emerald-100 dark:border-emerald-800 pb-3 flex justify-between items-center">
                                  <div>
                                    <h3 className="text-base font-bold text-emerald-950 dark:text-amber-100">
                                      {isEditingQuiz ? "Edit CBT Quiz" : "Create CBT Quiz"}
                                    </h3>
                                    <p className="text-[10px] text-slate-500">Formulate standard options exam templates</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setIsCreatingQuiz(false);
                                      setIsEditingQuiz(null);
                                    }}
                                    className="px-2 py-1 bg-red-50 text-red-600 text-[10px] rounded hover:bg-red-100 font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <div className="space-y-3 text-xs font-sans">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">QUIZ TITLE / EXAM NAME</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. Mid-Term Aqeedah Exam"
                                      value={quizEditTitle}
                                      onChange={(e) => setQuizEditTitle(e.target.value)}
                                      className="w-full bg-emerald-50/20 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">DURATION TIME LIMIT (MINUTES)</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="1440"
                                      value={quizEditDuration}
                                      onChange={(e) => setQuizEditDuration(Number(e.target.value) || 10)}
                                      className="w-full bg-emerald-50/20 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white focus:outline-none font-mono"
                                    />
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {[10, 15, 30, 45, 60, 120, 180, 300, 600, 1440].map((mins) => (
                                        <button
                                          key={mins}
                                          type="button"
                                          onClick={() => setQuizEditDuration(mins)}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono transition-all border cursor-pointer ${
                                            quizEditDuration === mins
                                              ? "bg-emerald-700 text-white border-transparent"
                                              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-850 hover:bg-emerald-100"
                                          }`}
                                        >
                                          {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                                        </button>
                                      ))}
                                    </div>
                                    <span className="text-[9px] text-slate-400 block mt-1">Provide up to 1440 minutes (24 hours) or choose a quick preset.</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">NUMBER OF QUESTIONS TO DISPLAY</span>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="All questions"
                                        value={quizEditLimitQuestions}
                                        onChange={(e) => setQuizEditLimitQuestions(e.target.value === "" ? "" : Number(e.target.value))}
                                        className="w-full bg-emerald-50/20 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white focus:outline-none font-mono"
                                      />
                                      <span className="text-[9px] text-slate-400 block mt-0.5">Leave blank to present all added questions.</span>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">EXAM ANNOUNCEMENT DATE</span>
                                      <input
                                        type="date"
                                        value={quizEditExamDate}
                                        onChange={(e) => setQuizEditExamDate(e.target.value)}
                                        className="w-full bg-emerald-50/20 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white focus:outline-none font-mono"
                                      />
                                      <span className="text-[9px] text-slate-400 block mt-0.5">Scheduled or announcement date.</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 py-1.5 bg-emerald-50/10 dark:bg-emerald-950/20 p-2 border border-emerald-50 dark:border-emerald-900 rounded-lg">
                                    <input
                                      type="checkbox"
                                      id="automaticMarking"
                                      checked={quizEditAutomaticMarking}
                                      onChange={(e) => setQuizEditAutomaticMarking(e.target.checked)}
                                      className="w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="automaticMarking" className="font-bold text-emerald-700 dark:text-emerald-300 uppercase font-mono text-[9px] cursor-pointer select-none">
                                      Enable Automatic Marking / Instant Grading
                                    </label>
                                  </div>

                                  <div className="space-y-2 pt-2 border-t border-emerald-50 dark:border-emerald-850">
                                    <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">Current Questions ({quizEditQuestions.length})</span>
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                      {quizEditQuestions.map((q, idx) => (
                                        <div key={idx} className="p-2.5 bg-emerald-50/40 dark:bg-emerald-950/40 rounded border border-emerald-100 dark:border-emerald-850 text-[11px] flex justify-between items-start gap-2">
                                          <div className="space-y-0.5">
                                            <div className="font-bold text-emerald-950 dark:text-amber-100">{idx + 1}. {q.questionText}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">Options: {q.options.join(" | ")}</div>
                                            <div className="text-[10px] text-emerald-600 font-bold font-mono">Correct: Option {q.correctAnswerIndex + 1}</div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setQuizEditQuestions(quizEditQuestions.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700 font-bold"
                                            title="Delete Question"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                      {quizEditQuestions.length === 0 && (
                                        <p className="text-[10px] text-slate-400 italic py-2 text-center">Add questions using the tool below.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Add a New Question Builder */}
                                  <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-lg border border-emerald-100 dark:border-emerald-850 space-y-3 pt-3">
                                    <span className="font-bold text-amber-600 block uppercase font-mono text-[9px]">Add a Quiz Question</span>
                                    
                                    <div className="space-y-1">
                                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 block text-[10px]">QUESTION TEXT / PROMPT</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. What is the pillar of Islam that comes after Shahadah?"
                                        value={newQuestionText}
                                        onChange={(e) => setNewQuestionText(e.target.value)}
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-1.5 text-xs text-emerald-950 dark:text-white focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 block text-[10px]">OPTION CHOICES (PROVIDE 4)</span>
                                      <div className="grid grid-cols-2 gap-2">
                                        {newQuestionOptions.map((opt, oIdx) => (
                                          <input
                                            key={oIdx}
                                            type="text"
                                            placeholder={`Option ${oIdx + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                              const next = [...newQuestionOptions];
                                              next[oIdx] = e.target.value;
                                              setNewQuestionOptions(next);
                                            }}
                                            className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-1 text-xs text-emerald-950 dark:text-white focus:outline-none"
                                          />
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 block text-[10px]">CORRECT OPTION INDEX</span>
                                      <select
                                        value={newQuestionCorrectIndex}
                                        onChange={(e) => setNewQuestionCorrectIndex(Number(e.target.value))}
                                        className="p-1 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-white dark:bg-emerald-950 text-xs text-emerald-950 dark:text-white cursor-pointer"
                                      >
                                        <option value={0}>Option 1 is Correct</option>
                                        <option value={1}>Option 2 is Correct</option>
                                        <option value={2}>Option 3 is Correct</option>
                                        <option value={3}>Option 4 is Correct</option>
                                      </select>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newQuestionText.trim()) {
                                          alert("Please enter a question prompt.");
                                          return;
                                        }
                                        if (newQuestionOptions.some(opt => !opt.trim())) {
                                          alert("Please populate all 4 option choice textboxes.");
                                          return;
                                        }
                                        const newQ = {
                                          id: "q-" + Math.random().toString(36).substr(2, 9),
                                          questionText: newQuestionText,
                                          options: [...newQuestionOptions],
                                          correctAnswerIndex: newQuestionCorrectIndex
                                        };
                                        setQuizEditQuestions([...quizEditQuestions, newQ]);
                                        // Reset question helper
                                        setNewQuestionText("");
                                        setNewQuestionOptions(["", "", "", ""]);
                                        setNewQuestionCorrectIndex(0);
                                      }}
                                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded text-[11px] cursor-pointer"
                                    >
                                      Append Question to List
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCreateOrUpdateQuiz(activeCourse.id)}
                                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md"
                                  >
                                    Save & Publish CBT Quiz Sheet
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="lg:col-span-5 bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                                <h3 className="text-base font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-1.5 font-sans">
                                  {editingMaterial ? <Edit className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                                  <span>{editingMaterial ? "Edit Course Material" : "Publish Study Material"}</span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                  {editingMaterial
                                    ? "Modify the fields below to update the details of this educational resource:"
                                    : "Append high-quality video links, tracing workbook files, or homework worksheets to this course syllabus:"}
                                </p>

                                <form onSubmit={(e) => handleCreateCourseMaterial(e, activeCourse.id)} className="space-y-4 text-xs font-sans">
                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">MATERIAL CLASSIFICATION</span>
                                  <select
                                    value={matType}
                                    onChange={(e) => setMatType(e.target.value as any)}
                                    disabled={!!editingMaterial}
                                    className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 text-emerald-950 dark:text-white cursor-pointer focus:ring-1 focus:ring-emerald-750 disabled:opacity-50"
                                  >
                                    <option value="video">🎥 Lecture Class Recording (YouTube Embed)</option>
                                    <option value="pdf">📓 Workbook PDF Handout (Download Link)</option>
                                    <option value="assignment">📝 Written Homework Homework (Mark Sheet)</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">Material Title</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Lesson 4: Deep Throat Makhraj Ayn to Haa"
                                    value={matTitle}
                                    onChange={(e) => setMatTitle(e.target.value)}
                                    className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none text-emerald-950 dark:text-white"
                                  />
                                </div>

                                {matType === "video" && (
                                  <div className="space-y-4 border border-emerald-100 dark:border-emerald-800 p-3.5 rounded-lg bg-emerald-50/10 dark:bg-emerald-950/20">
                                    <div className="flex justify-between items-center pb-2 border-b border-emerald-50 dark:border-emerald-850">
                                      <span className="font-bold text-emerald-900 dark:text-amber-100 uppercase tracking-wider text-[10px] block">Lecture Delivery Options</span>
                                    </div>
                                    
                                    {/* Video URL Option */}
                                    <div className="space-y-1">
                                      <span className="font-semibold text-emerald-700 block uppercase font-mono text-[9px]">Option A: YouTube Embed URL (Optional)</span>
                                      <input
                                        type="url"
                                        placeholder="https://www.youtube.com/embed/..."
                                        value={matUrl}
                                        onChange={(e) => setMatUrl(e.target.value)}
                                        className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none text-emerald-950 dark:text-white font-mono text-xs"
                                      />
                                    </div>

                                    {/* Voice note recorder option */}
                                    <div className="space-y-2 pt-2 border-t border-emerald-100/50 dark:border-emerald-800/50">
                                      <span className="font-semibold text-emerald-700 block uppercase font-mono text-[9px]">Option B: Record Lecture Voice Note / Audio Explanation</span>
                                      
                                      <div className="flex flex-wrap gap-2 items-center">
                                        {!isRecordingMat ? (
                                          <button
                                            type="button"
                                            onClick={startRecordingMat}
                                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                                          >
                                            <span>🎙️ Start Audio Recording</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={stopRecordingMat}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
                                          >
                                            <span>🛑 Stop Recording ({recordingMatSeconds}s)</span>
                                          </button>
                                        )}

                                        {matAudioUrl && (
                                          <button
                                            type="button"
                                            onClick={deleteRecordingMat}
                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                          >
                                            <span>Delete Audio</span>
                                          </button>
                                        )}
                                      </div>

                                      {matAudioUrl && (
                                        <div className="p-2 bg-white dark:bg-emerald-950 rounded border border-emerald-100 mt-1">
                                          <span className="text-[9px] font-bold text-amber-600 block mb-1">🎧 Preview Audio Lecture:</span>
                                          <audio src={matAudioUrl} controls className="w-full h-8" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Multiple slide photos option */}
                                    <div className="space-y-2 pt-2 border-t border-emerald-100/50 dark:border-emerald-800/50">
                                      <span className="font-semibold text-emerald-700 block uppercase font-mono text-[9px]">Option C: Upload Board Slides / Textbook Pictures</span>
                                      
                                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/5 dark:hover:bg-emerald-950/30 rounded-lg p-3 cursor-pointer transition-all">
                                        <span className="text-[10px] text-emerald-600 font-bold">📸 Click to upload board images</span>
                                        <input
                                          type="file"
                                          multiple
                                          accept="image/*"
                                          onChange={handleMatPhotosChange}
                                          className="hidden"
                                        />
                                      </label>

                                      {matPhotos.length > 0 && (
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center">
                                            <span className="font-bold text-[9px] text-slate-500">Board Slide Photos ({matPhotos.length}):</span>
                                            <button
                                              type="button"
                                              onClick={() => setMatPhotos([])}
                                              className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                                            >
                                              Clear All Photos
                                            </button>
                                          </div>
                                          <div className="grid grid-cols-4 gap-1.5">
                                            {matPhotos.map((src, pIdx) => (
                                              <div key={pIdx} className="relative aspect-square border border-emerald-100/60 rounded overflow-hidden">
                                                <img src={src} alt="Board preview" className="w-full h-full object-cover" />
                                                <button
                                                  type="button"
                                                  onClick={() => setMatPhotos(prev => prev.filter((_, i) => i !== pIdx))}
                                                  className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold cursor-pointer"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {matType === "pdf" && (
                                  <div className="space-y-1 animate-fade-in">
                                    <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">PDF Resource URL Link</span>
                                    <input
                                      type="text"
                                      placeholder="https://example.com/handout.pdf"
                                      value={matUrl}
                                      onChange={(e) => setMatUrl(e.target.value)}
                                      className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">
                                    {matType === "video" ? "Duration Time (e.g. 25:15 / Audio Lecture)" : matType === "pdf" ? "File Size (e.g. 3.2 MB)" : "Max Points Value (e.g. 50)"}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder={matType === "video" ? "e.g. 18:40" : matType === "pdf" ? "e.g. 2.1 MB" : "e.g. 50"}
                                    value={matDurationOrSize}
                                    onChange={(e) => setMatDurationOrSize(e.target.value)}
                                    className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none text-emerald-950 dark:text-white"
                                  />
                                </div>

                                {matType === "assignment" && (
                                  <div className="space-y-1 animate-fade-in">
                                    <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">Due Date Deadline</span>
                                    <input
                                      type="date"
                                      required
                                      value={matDueDate}
                                      onChange={(e) => setMatDueDate(e.target.value)}
                                      className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none text-emerald-950 dark:text-white font-mono text-xs"
                                    />
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-700 block uppercase font-mono text-[9px]">Material Explanation & Instructions</span>
                                  <textarea
                                    required
                                    rows={4}
                                    placeholder="Provide detailed description of this lesson and guidelines..."
                                    value={matDesc}
                                    onChange={(e) => setMatDesc(e.target.value)}
                                    className="p-2.5 border border-emerald-200 dark:border-emerald-800 rounded w-full bg-emerald-50/20 dark:bg-emerald-950 focus:outline-none text-emerald-950 dark:text-white font-sans"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  {editingMaterial && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMaterial(null);
                                        setMatTitle("");
                                        setMatUrl("");
                                        setMatDesc("");
                                        setMatDurationOrSize("");
                                        setMatDueDate("");
                                      }}
                                      className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-white font-bold rounded-lg text-xs cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="submit"
                                    className={`${editingMaterial ? 'w-2/3' : 'w-full'} py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer transition-all shadow-md active:scale-95`}
                                  >
                                    {editingMaterial ? "Save & Update" : "Publish to Syllabus"}
                                  </button>
                                </div>
                              </form>
                            </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SUB-TAB 6: ADMISSION CREDENTIALS LIST */}
                  {teacherSubTab === "admissions" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                      {renderAdmissionListTab()}
                    </div>
                  )}

                </div>
              )}

              {/* === C. ADMIN DASHBOARD WORKSPACE === */}
              {currentUser.role === "admin" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Admin Navigation Pills */}
                  <div className="flex flex-wrap gap-2 border-b border-emerald-100 dark:border-emerald-800 pb-4">
                    <button
                      onClick={() => setAdminSubTab("payments")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        adminSubTab === "payments"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      💳 Payments & Clearances
                    </button>
                    <button
                      onClick={() => setAdminSubTab("announcements")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        adminSubTab === "announcements"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📢 Announcements Broadcast
                    </button>
                    <button
                      onClick={() => setAdminSubTab("testimonials")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        adminSubTab === "testimonials"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      👥 Community Testimonials
                    </button>
                    <button
                      onClick={() => setAdminSubTab("calendar")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        adminSubTab === "calendar"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📅 Events Planner
                    </button>
                    <button
                      onClick={() => setAdminSubTab("quote")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        adminSubTab === "quote"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      ✍️ Weekly Quote & Quotes
                    </button>
                    <button
                      onClick={() => setAdminSubTab("curriculum")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        adminSubTab === "curriculum"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      📚 Courses & Materials
                    </button>
                    <button
                      onClick={() => setAdminSubTab("admissions")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "admissions"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <Key className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>Admission Credentials List</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("freecourse")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "freecourse"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>📖 Free Course Settings</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("aboutUs")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "aboutUs"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>🏢 About Us & FAQ</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("curriculumSettings")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "curriculumSettings"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>🎓 Curriculum & Why Enroll</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("sermons")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "sermons"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>📺 Sermon TV</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("library")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "library"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>📚 Islamic Library</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("donations")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "donations"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>💝 Donation Settings</span>
                    </button>
                    <button
                      onClick={() => setAdminSubTab("registerTeacher")}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminSubTab === "registerTeacher"
                          ? "bg-emerald-700 text-white shadow"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <span>👨‍🏫 Register Teacher</span>
                    </button>
                  </div>

                  {/* SUB-TAB 1: PAYMENTS & CLEARANCES */}
                  {adminSubTab === "payments" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-500" />
                        <span>Clear Admissions lockout / Verify Payments</span>
                      </h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300 leading-normal">
                        Verify Ibadan community member tuition receipts and clear lockouts for registered students instantly.
                      </p>

                      <div className="space-y-3">
                        {allStudents.map((student) => (
                          <div key={student.id} className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-50 dark:border-emerald-900/60 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-emerald-900 dark:text-white">{student.name}</span>
                              <span className="text-[10px] text-emerald-500 block">Username: {student.username} • Level: {student.level}</span>
                            </div>
                            
                            {student.isPaid ? (
                              <button
                                onClick={() => handleAdminLockout(student.id, false)}
                                className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                              >
                                <Lock className="w-3 h-3" /> Lock account
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAdminLockout(student.id, true)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-750 border border-emerald-100 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                              >
                                <Unlock className="w-3 h-3" /> Clear Payment (Unlock)
                              </button>
                            )}
                          </div>
                        ))}
                        {allStudents.length === 0 && (
                          <p className="text-xs italic text-emerald-500">No registered students to clear.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: ANNOUNCEMENTS BROADCAST */}
                  {adminSubTab === "announcements" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Form */}
                      <form onSubmit={handleCreateAnnouncement} className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-amber-500" />
                          <span>Post Academic Announcement</span>
                        </h3>

                        <div className="space-y-3 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">ANNOUNCEMENT HEADER</span>
                            <input
                              type="text"
                              placeholder="Midterm schedules..."
                              value={annTitle}
                              onChange={(e) => setAnnTitle(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">TARGET VIEWER ROLE</span>
                            <select
                              value={annTarget}
                              onChange={(e) => setAnnTarget(e.target.value as any)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-900 dark:text-white"
                            >
                              <option value="all">Broadcast to All</option>
                              <option value="student">Students Only</option>
                              <option value="teacher">Teachers Only</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">ANNOUNCEMENT MESSAGE BODY</span>
                            <textarea
                              rows={3}
                              placeholder="Write announcement text details here..."
                              value={annContent}
                              onChange={(e) => setAnnContent(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Broadcast Announcement
                        </button>
                      </form>

                      {/* Current list with Delete */}
                      <div className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100">
                          Current Announcements
                        </h3>
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                          {announcements.map((ann) => (
                            <div key={ann.id} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/40 rounded border border-emerald-150 dark:border-emerald-850 text-xs flex justify-between items-start gap-3">
                              <div className="space-y-1 min-w-0 flex-grow">
                                <h4 className="font-bold text-emerald-900 dark:text-white">{ann.title}</h4>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-normal">{ann.content}</p>
                                <span className="text-[9px] text-emerald-400 block">To: {ann.targetRole} • {new Date(ann.date).toLocaleDateString()}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete announcement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {announcements.length === 0 && (
                            <p className="text-xs italic text-emerald-500">No announcements posted yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: COMMUNITY TESTIMONIALS */}
                  {adminSubTab === "testimonials" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Form */}
                      <form onSubmit={handleCreateTestimonial} className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-amber-500" />
                          <span>Add Community Testimonial</span>
                        </h3>

                        <div className="space-y-3 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">NAME</span>
                            <input
                              type="text"
                              placeholder="e.g. Brother Abdulrahman Ibadan"
                              value={newTestName}
                              onChange={(e) => setNewTestName(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">OCCUPATION / ROLE</span>
                            <input
                              type="text"
                              placeholder="e.g. Parent of 2 students"
                              value={newTestRole}
                              onChange={(e) => setNewTestRole(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">FEEDBACK MESSAGE</span>
                            <textarea
                              rows={3}
                              placeholder="What does our Ibadan community say about Abu Qoonitah Academy?"
                              value={newTestContent}
                              onChange={(e) => setNewTestContent(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">RATING (1-5 Stars)</span>
                            <select
                              value={newTestRating}
                              onChange={(e) => setNewTestRating(Number(e.target.value))}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-900 dark:text-white"
                            >
                              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                              <option value="3">⭐⭐⭐ 3 Stars</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Publish Testimonial
                        </button>
                      </form>

                      {/* Current testimonials */}
                      <div className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100">
                          Community Feedback List
                        </h3>
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                          {allTestimonials.map((t) => (
                            <div key={t.id} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/40 rounded border border-emerald-150 dark:border-emerald-850 text-xs flex justify-between items-start gap-3">
                              <div className="space-y-1 min-w-0 flex-grow">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-emerald-900 dark:text-white">{t.name}</h4>
                                  <span className="text-amber-500 font-mono">{"★".repeat(t.rating)}</span>
                                </div>
                                <span className="text-[10px] text-amber-600 block">{t.role}</span>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-normal italic">"{t.content}"</p>
                              </div>
                              <button
                                onClick={() => handleDeleteTestimonial(t.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete feedback"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {allTestimonials.length === 0 && (
                            <p className="text-xs italic text-emerald-500">No community feedback listed yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: CALENDAR EVENTS */}
                  {adminSubTab === "calendar" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Form */}
                      <form onSubmit={handleCreateCalendarEvent} className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-amber-500" />
                          <span>Schedule Upcoming Event</span>
                        </h3>

                        <div className="space-y-3 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">EVENT TITLE</span>
                            <input
                              type="text"
                              placeholder="e.g. Semester 1 Quran Recitation Competition"
                              value={newCalTitle}
                              onChange={(e) => setNewCalTitle(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">DATE</span>
                            <input
                              type="date"
                              value={newCalDate}
                              onChange={(e) => setNewCalDate(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">CLASSIFICATION</span>
                            <select
                              value={newCalType}
                              onChange={(e) => setNewCalType(e.target.value)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-900 dark:text-white"
                            >
                              <option value="event">Standard Event</option>
                              <option value="exam">Exam Period</option>
                              <option value="holiday">Madrasah Holiday</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">DESCRIPTION</span>
                            <textarea
                              rows={2}
                              placeholder="Brief instructions or information..."
                              value={newCalDesc}
                              onChange={(e) => setNewCalDesc(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Publish Event on Calendar
                        </button>
                      </form>

                      {/* Current list */}
                      <div className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100">
                          Active Calendar Dates
                        </h3>
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                          {calendarEvents.map((evt) => (
                            <div key={evt.id} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/40 rounded border border-emerald-150 dark:border-emerald-850 text-xs flex justify-between items-start gap-3">
                              <div className="space-y-1 min-w-0 flex-grow">
                                <h4 className="font-bold text-emerald-900 dark:text-white">{evt.title}</h4>
                                <span className="text-[10px] text-amber-600 block">{new Date(evt.date).toLocaleDateString()} • {evt.type}</span>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-normal">{evt.description}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteCalendarEvent(evt.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {calendarEvents.length === 0 && (
                            <p className="text-xs italic text-emerald-500">No scheduled events yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 5: WEEKLY QUOTES & SETTINGS */}
                  {adminSubTab === "quote" && (
                    <form onSubmit={handleUpdateQuote} className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4 max-w-2xl mx-auto">
                      <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span>Configure Weekly Quote of the Day</span>
                      </h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300">
                        This update instantly changes the featured spiritual citation rendered on the public landing page banner.
                      </p>

                      <div className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-700 block text-right">ARABIC INSPIRATIONAL SCRIPT (العربية)</span>
                          <textarea
                            rows={2}
                            dir="rtl"
                            placeholder="مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا..."
                            value={quoteArabic}
                            onChange={(e) => setQuoteArabic(e.target.value)}
                            required
                            className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-right text-base text-emerald-950 dark:text-white font-serif"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-700 block">ENGLISH TRANSLATION</span>
                          <textarea
                            rows={2}
                            placeholder="Whoever takes a path upon which he seeks knowledge..."
                            value={quoteTranslation}
                            onChange={(e) => setQuoteTranslation(e.target.value)}
                            required
                            className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-700 block">CITATION SOURCE REFERENCE</span>
                          <input
                            type="text"
                            placeholder="e.g. Sahih Muslim 2699"
                            value={quoteSource}
                            onChange={(e) => setQuoteSource(e.target.value)}
                            required
                            className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Publish Weekly Quote
                      </button>
                    </form>
                  )}

                  {/* SUB-TAB 6: COURSES & MATERIALS */}
                  {adminSubTab === "curriculum" && (
                    <div className="space-y-8">
                      {/* Course Creator */}
                      <form onSubmit={handleCreateCourse} className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-amber-500" />
                          <span>Design New Madrasah Course</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">COURSE TITLE</span>
                            <input
                              type="text"
                              placeholder="e.g. Introduction to Sarf (Morphology)"
                              value={newCourseTitle}
                              onChange={(e) => setNewCourseTitle(e.target.value)}
                              required
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">ACADEMIC TRACK</span>
                            <select
                              value={newCourseLevel}
                              onChange={(e) => setNewCourseLevel(e.target.value as any)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-900 dark:text-white"
                            >
                              <option value="beginner">Beginner Level</option>
                              <option value="intermediate">Intermediate Level</option>
                              <option value="advanced">Advanced Level</option>
                              <option value="free">Free Courses Panel</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">DURATION</span>
                            <input
                              type="text"
                              placeholder="e.g. 10 Weeks"
                              value={newCourseDuration}
                              onChange={(e) => setNewCourseDuration(e.target.value)}
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">CURRICULUM OBJECTIVES (One per line)</span>
                            <textarea
                              rows={2}
                              placeholder="Understand word families&#10;Decline triliteral verbs"
                              value={newCourseObjectives}
                              onChange={(e) => setNewCourseObjectives(e.target.value)}
                              className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-emerald-700 block">COURSE DESCRIPTION</span>
                          <textarea
                            rows={3}
                            placeholder="Study Arabic verbs patterns..."
                            value={newCourseDesc}
                            onChange={(e) => setNewCourseDesc(e.target.value)}
                            required
                            className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-950 dark:text-white"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Authorize Course Design
                        </button>
                      </form>

                      {/* Course Materials Appender with Course selection */}
                      {courses.length > 0 && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const targetId = (document.getElementById("target-course-id") as HTMLSelectElement)?.value;
                            if (targetId) handleCreateCourseMaterial(e, targetId);
                          }}
                          className="bg-white dark:bg-emerald-900 p-6 sm:p-8 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-4"
                        >
                          <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2">
                            <Video className="w-5 h-5 text-amber-500" />
                            <span>Append Materials & Homeworks to Any Course</span>
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">SELECT TARGET COURSE</span>
                              <select
                                id="target-course-id"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-900 dark:text-white"
                              >
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.level})</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">MATERIAL CLASSIFICATION</span>
                              <select
                                value={matType}
                                onChange={(e) => setMatType(e.target.value as any)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-900 dark:text-white"
                              >
                                <option value="video">Lesson Stream Video</option>
                                <option value="pdf">Handout Document (PDF)</option>
                                <option value="assignment">Assignment Sheet</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">TITLE</span>
                              <input
                                type="text"
                                placeholder="e.g. Rule of Noon Sakinah part 2"
                                value={matTitle}
                                onChange={(e) => setMatTitle(e.target.value)}
                                required
                                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">STREAM URL / PDF LINK</span>
                              <input
                                type="text"
                                placeholder="https://www.youtube.com/embed/vT4r_2bI-0Q"
                                value={matUrl}
                                onChange={(e) => setMatUrl(e.target.value)}
                                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">DURATION OR FILE SIZE</span>
                              <input
                                type="text"
                                placeholder="e.g. 15:40 / 3.2 MB"
                                value={matDurationOrSize}
                                onChange={(e) => setMatDurationOrSize(e.target.value)}
                                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">SHORT DESCRIPTION</span>
                              <textarea
                                rows={1}
                                placeholder="Brief instructions..."
                                value={matDesc}
                                onChange={(e) => setMatDesc(e.target.value)}
                                className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Publish Material on Course Dashboard
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 7: ADMISSION CREDENTIALS LIST */}
                  {adminSubTab === "admissions" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                      {renderAdmissionListTab()}
                    </div>
                  )}

                  {/* SUB-TAB 8: FREE COURSE (POEM) SETTINGS */}
                  {adminSubTab === "freecourse" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>📖 Free Course: Laamiyyatu Ibn Taimiyyah Settings</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Directly manage the display info, upload cover art, edit Arabic/English poem text verses, and manage audio recordings for the free public course.
                        </p>
                      </div>

                      {fcMessage && (
                        <div className={`p-4 rounded-xl text-xs font-bold ${fcMessage.includes("🎉") ? "bg-emerald-50 text-emerald-850 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {fcMessage}
                        </div>
                      )}

                      <form onSubmit={handleSaveFreeCourse} className="space-y-6 text-xs">
                        
                        {/* Course metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Course Title</label>
                            <input
                              type="text"
                              value={fcTitle}
                              onChange={(e) => setFcTitle(e.target.value)}
                              required
                              className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Cover Image (URL or Upload File)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/..."
                                value={fcImageUrl}
                                onChange={(e) => setFcImageUrl(e.target.value)}
                                className="flex-1 bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono"
                              />
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFcCoverUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <button type="button" className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer">
                                  Upload File
                                </button>
                              </div>
                            </div>
                            {fcImageUrl && (
                              <img src={fcImageUrl} alt="Cover Preview" className="h-16 object-cover rounded mt-2 border" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Description</label>
                          <textarea
                            rows={2}
                            value={fcDescription}
                            onChange={(e) => setFcDescription(e.target.value)}
                            required
                            className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                          />
                        </div>

                        {/* Poem Verses Section */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Verses of the Poem</h4>
                            <button
                              type="button"
                              onClick={() => setFcVerses([...fcVerses, { arabic: "", translation: "" }])}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 dark:bg-emerald-850 dark:text-emerald-250 font-bold rounded-full text-xs cursor-pointer"
                            >
                              ＋ Add Verse
                            </button>
                          </div>

                          <div className="space-y-3">
                            {fcVerses.map((verse, index) => (
                              <div key={index} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/20 rounded-xl space-y-2 relative">
                                <button
                                  type="button"
                                  onClick={() => setFcVerses(fcVerses.filter((_, i) => i !== index))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                >
                                  × Remove
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono">Verse #{index + 1}</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Arabic Verse Text..."
                                      value={verse.arabic || ""}
                                      onChange={(e) => {
                                        const updated = [...fcVerses];
                                        updated[index].arabic = e.target.value;
                                        setFcVerses(updated);
                                      }}
                                      dir="rtl"
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="English Translation..."
                                      value={verse.translation || ""}
                                      onChange={(e) => {
                                        const updated = [...fcVerses];
                                        updated[index].translation = e.target.value;
                                        setFcVerses(updated);
                                      }}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Audio Tracks Section */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Audio Recitations (MP3 Streams)</h4>
                            <button
                              type="button"
                              onClick={() => setFcAudioFiles([...fcAudioFiles, { id: "track-" + Date.now(), title: "", url: "", description: "" }])}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 dark:bg-emerald-850 dark:text-emerald-250 font-bold rounded-full text-xs cursor-pointer"
                            >
                              ＋ Add Audio Track
                            </button>
                          </div>

                          <div className="space-y-3">
                            {fcAudioFiles.map((track, index) => (
                              <div key={track.id || index} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/20 rounded-xl space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => setFcAudioFiles(fcAudioFiles.filter((_, i) => i !== index))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                >
                                  × Remove
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono">Audio Track #{index + 1}</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Track Title</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. Vocal Recitation - Abu Qoonitah"
                                      value={track.title || ""}
                                      onChange={(e) => {
                                        const updated = [...fcAudioFiles];
                                        updated[index].title = e.target.value;
                                        setFcAudioFiles(updated);
                                      }}
                                      required
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Audio File Upload or URL</span>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Audio Stream Link (MP3 URL) or choose file"
                                        value={(track.url && track.url.startsWith("data:audio") ? "Uploaded base64 audio file" : track.url) || ""}
                                        onChange={(e) => {
                                          const updated = [...fcAudioFiles];
                                          updated[index].url = e.target.value;
                                          setFcAudioFiles(updated);
                                        }}
                                        className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                                      />
                                      <div className="relative">
                                        <input
                                          type="file"
                                          accept="audio/*"
                                          onChange={(e) => handleFcAudioUpload(e, index)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                        <button type="button" className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded text-xs cursor-pointer">
                                          Upload MP3
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-700 block uppercase text-[9px]">Track Description</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. A clear and beautiful recitation for memorization..."
                                    value={track.description || ""}
                                    onChange={(e) => {
                                      const updated = [...fcAudioFiles];
                                      updated[index].description = e.target.value;
                                      setFcAudioFiles(updated);
                                    }}
                                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Graduation CBT settings */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4 text-left">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Graduation CBT Exam Settings</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Customize the exam required to graduate from this free module and unlock certificates.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFcQuestions([...fcQuestions, { id: "q-" + Date.now(), question: "", options: ["", "", "", ""], correctIndex: 0 }])}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-full text-xs cursor-pointer"
                            >
                              ＋ Add Question
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/15 dark:bg-emerald-950/15 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[9px]">Passing Requirement Score</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={Math.max(1, fcQuestions.length)}
                                  value={fcPassingScore}
                                  onChange={(e) => setFcPassingScore(parseInt(e.target.value) || 1)}
                                  className="w-20 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-bold text-center text-emerald-950 dark:text-white"
                                />
                                <span className="text-[11px] text-slate-500">
                                  correct answers out of {fcQuestions.length} questions
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {fcQuestions.map((q, qIdx) => (
                              <div key={q.id || qIdx} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/20 rounded-xl space-y-3 relative text-left">
                                <button
                                  type="button"
                                  onClick={() => setFcQuestions(fcQuestions.filter((_, i) => i !== qIdx))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer text-xs"
                                >
                                  × Remove
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono font-bold block">Question #{qIdx + 1}</span>
                                
                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-700 block uppercase text-[9px]">Question Text</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. Who is the author of Laamiyyatu Ibn Taimiyyah?"
                                    value={q.question || ""}
                                    onChange={(e) => {
                                      const updated = [...fcQuestions];
                                      updated[qIdx].question = e.target.value;
                                      setFcQuestions(updated);
                                    }}
                                    required
                                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="space-y-1">
                                      <span className="font-bold text-slate-550 block uppercase text-[8px]">Option {String.fromCharCode(65 + optIdx)}</span>
                                      <input
                                        type="text"
                                        placeholder={`Answer Option ${optIdx + 1}...`}
                                        value={opt || ""}
                                        onChange={(e) => {
                                          const updated = [...fcQuestions];
                                          updated[qIdx].options[optIdx] = e.target.value;
                                          setFcQuestions(updated);
                                        }}
                                        required
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="space-y-1 max-w-xs text-left">
                                  <span className="font-bold text-emerald-700 block uppercase text-[9px]">Correct Answer Index</span>
                                  <select
                                    value={q.correctIndex}
                                    onChange={(e) => {
                                      const updated = [...fcQuestions];
                                      updated[qIdx].correctIndex = parseInt(e.target.value);
                                      setFcQuestions(updated);
                                    }}
                                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                  >
                                    <option value={0}>Option A</option>
                                    <option value={1}>Option B</option>
                                    <option value={2}>Option C</option>
                                    <option value={3}>Option D</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                            {fcQuestions.length === 0 && (
                              <p className="text-xs text-slate-400 bg-slate-50/50 dark:bg-emerald-950/20 p-4 rounded-xl text-center">
                                No custom CBT questions defined. The course will fall back to default questions.
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={fcSaving}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow transition-all hover:scale-[1.005] disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                          {fcSaving ? "💾 Saving Settings..." : "💾 Save & Deploy Free Course Settings"}
                        </button>
                      </form>

                      {/* FREE COURSE LEARNERS ROSTER */}
                      <div className="border-t border-emerald-100 dark:border-emerald-800 pt-8 mt-8 space-y-4">
                        <div>
                          <h4 className="text-base font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                            <span>👥 Registered Free Course Learners ({fcEnrollments.length})</span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            A list of students currently registered, their progressive learning percentage, and their final CBT exam score.
                          </p>
                        </div>

                        {fcEnrollmentsLoading ? (
                          <p className="text-xs text-emerald-600 animate-pulse font-bold">Loading learner records...</p>
                        ) : fcEnrollments.length === 0 ? (
                          <div className="p-6 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-xl text-center border border-dashed border-emerald-200">
                            <p className="text-xs text-slate-400">No students registered for the free class yet.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-emerald-100 dark:border-emerald-800 text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-emerald-950 text-emerald-950 dark:text-amber-100 font-bold uppercase text-[9px] tracking-wider border-b border-emerald-100 dark:border-emerald-800">
                                  <th className="p-3 pl-4">Full Name</th>
                                  <th className="p-3">WhatsApp Number</th>
                                  <th className="p-3">Joined Date</th>
                                  <th className="p-3">Learning Progress</th>
                                  <th className="p-3">CBT Score</th>
                                  <th className="p-3">Certificate</th>
                                  <th className="p-3 pr-4 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-50/15">
                                {fcEnrollments.map((student) => (
                                  <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100">
                                    <td className="p-3 pl-4 font-bold">{student.name}</td>
                                    <td className="p-3 font-mono text-[11px]">{student.whatsapp}</td>
                                    <td className="p-3 text-slate-450">{student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : "—"}</td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-slate-100 dark:bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-200/20">
                                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${student.progress || 0}%` }} />
                                        </div>
                                        <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-amber-300">{student.progress || 0}%</span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {student.examScore !== null && student.examScore !== undefined ? (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${student.examScore >= 4 ? "bg-emerald-100 text-emerald-850 dark:bg-emerald-950 dark:text-emerald-200" : "bg-red-50 text-red-750"}`}>
                                          {student.examScore} / 5 ({student.examScore >= 4 ? "PASSED" : "FAILED"})
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[10px]">No Attempt</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {student.completed ? (
                                        <span className="px-2 py-0.5 bg-amber-500 text-emerald-950 font-bold rounded text-[9px] uppercase tracking-wide">
                                          Issued 🎓
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </td>
                                    <td className="p-3 pr-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFcEnrollment(student.id, student.name)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 9: ABOUT US & FAQ SETTINGS */}
                  {adminSubTab === "aboutUs" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>🏢 About Us & FAQs Management</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Directly edit the academy history, founder bio, values list, and frequently asked questions displayed on the home page.
                        </p>
                      </div>

                      {aboutUsMessage && (
                        <div className={`p-4 rounded-xl text-xs font-bold ${aboutUsMessage.includes("🎉") ? "bg-emerald-50 text-emerald-850 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {aboutUsMessage}
                        </div>
                      )}

                      <form onSubmit={handleSaveAboutUs} className="space-y-6 text-xs">
                        
                        {/* History fields */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Madrasah History</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">History (English)</label>
                              <textarea
                                rows={4}
                                value={aboutUsHistoryEn}
                                onChange={(e) => setAboutUsHistoryEn(e.target.value)}
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">History (Arabic)</label>
                              <textarea
                                rows={4}
                                value={aboutUsHistoryAr}
                                onChange={(e) => setAboutUsHistoryAr(e.target.value)}
                                dir="rtl"
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-serif"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Founder Bio fields */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Founder Bio</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Founder Bio (English)</label>
                              <textarea
                                rows={4}
                                value={aboutUsFounderBioEn}
                                onChange={(e) => setAboutUsFounderBioEn(e.target.value)}
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Founder Bio (Arabic)</label>
                              <textarea
                                rows={4}
                                value={aboutUsFounderBioAr}
                                onChange={(e) => setAboutUsFounderBioAr(e.target.value)}
                                dir="rtl"
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-serif"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Academy Values Section */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Our Values & Goals</h4>
                            <button
                              type="button"
                              onClick={() => setAboutUsValues([...aboutUsValues, { titleEn: "", titleAr: "", descEn: "", descAr: "" }])}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 dark:bg-emerald-850 dark:text-emerald-250 font-bold rounded-full text-xs cursor-pointer"
                            >
                              ＋ Add Value Item
                            </button>
                          </div>

                          <div className="space-y-3">
                            {aboutUsValues.map((val, index) => (
                              <div key={index} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/20 rounded-xl space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => setAboutUsValues(aboutUsValues.filter((_, i) => i !== index))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                >
                                  × Remove
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono">Value Item #{index + 1}</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Title (English)</span>
                                    <input
                                      type="text"
                                      value={val.titleEn || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsValues];
                                        updated[index].titleEn = e.target.value;
                                        setAboutUsValues(updated);
                                      }}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Title (Arabic)</span>
                                    <input
                                      type="text"
                                      value={val.titleAr || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsValues];
                                        updated[index].titleAr = e.target.value;
                                        setAboutUsValues(updated);
                                      }}
                                      dir="rtl"
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Description (English)</span>
                                    <textarea
                                      rows={2}
                                      value={val.descEn || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsValues];
                                        updated[index].descEn = e.target.value;
                                        setAboutUsValues(updated);
                                      }}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Description (Arabic)</span>
                                    <textarea
                                      rows={2}
                                      value={val.descAr || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsValues];
                                        updated[index].descAr = e.target.value;
                                        setAboutUsValues(updated);
                                      }}
                                      dir="rtl"
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Frequently Asked Questions (FAQ) Section */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Frequently Asked Questions (FAQ)</h4>
                            <button
                              type="button"
                              onClick={() => setAboutUsFaqs([...aboutUsFaqs, { qEn: "", qAr: "", aEn: "", aAr: "" }])}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 dark:bg-emerald-850 dark:text-emerald-250 font-bold rounded-full text-xs cursor-pointer"
                            >
                              ＋ Add FAQ Item
                            </button>
                          </div>

                          <div className="space-y-3">
                            {aboutUsFaqs.map((faq, index) => (
                              <div key={index} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/20 rounded-xl space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => setAboutUsFaqs(aboutUsFaqs.filter((_, i) => i !== index))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                >
                                  × Remove
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono">FAQ Item #{index + 1}</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Question (English)</span>
                                    <input
                                      type="text"
                                      value={faq.qEn || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsFaqs];
                                        updated[index].qEn = e.target.value;
                                        setAboutUsFaqs(updated);
                                      }}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Question (Arabic)</span>
                                    <input
                                      type="text"
                                      value={faq.qAr || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsFaqs];
                                        updated[index].qAr = e.target.value;
                                        setAboutUsFaqs(updated);
                                      }}
                                      dir="rtl"
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Answer (English)</span>
                                    <textarea
                                      rows={2}
                                      value={faq.aEn || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsFaqs];
                                        updated[index].aEn = e.target.value;
                                        setAboutUsFaqs(updated);
                                      }}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Answer (Arabic)</span>
                                    <textarea
                                      rows={2}
                                      value={faq.aAr || ""}
                                      onChange={(e) => {
                                        const updated = [...aboutUsFaqs];
                                        updated[index].aAr = e.target.value;
                                        setAboutUsFaqs(updated);
                                      }}
                                      dir="rtl"
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={aboutUsSaving}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow disabled:bg-slate-400"
                        >
                          {aboutUsSaving ? "💾 Saving Settings..." : "💾 Save & Deploy About Us & FAQ settings"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB 10: CURRICULUM & WHY ENROLL SETTINGS */}
                  {adminSubTab === "curriculumSettings" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>🎓 Madrasah Public Curriculum Settings</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Directly manage the "Why Enroll" promotional copy, course levels, curriculum segments, and classes list displayed on public curriculum page.
                        </p>
                      </div>

                      {currMessage && (
                        <div className={`p-4 rounded-xl text-xs font-bold ${currMessage.includes("🎉") ? "bg-emerald-50 text-emerald-850 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {currMessage}
                        </div>
                      )}

                      <form onSubmit={handleSaveCurriculumSettings} className="space-y-6 text-xs">
                        
                        {/* Why enroll */}
                        <div className="space-y-1">
                          <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Why You Should Enroll Description Text</label>
                          <textarea
                            rows={4}
                            value={currWhyEnroll}
                            onChange={(e) => setCurrWhyEnroll(e.target.value)}
                            required
                            placeholder="Entail reasons, pedagogical approach, benefits..."
                            className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                          />
                        </div>

                        {/* Sections / Levels */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Curriculum Levels & Semester Books</h4>
                            <button
                              type="button"
                              onClick={() => setCurrSections([...currSections, { id: "sec-" + Date.now(), titleEn: "", titleAr: "", items: [] }])}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 dark:bg-emerald-850 dark:text-emerald-250 font-bold rounded-full text-xs cursor-pointer"
                            >
                              ＋ Add Level / Section
                            </button>
                          </div>

                          <div className="space-y-4">
                            {currSections.map((section, secIdx) => (
                              <div key={section.id || secIdx} className="p-5 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/25 rounded-2xl space-y-4 relative">
                                <button
                                  type="button"
                                  onClick={() => setCurrSections(currSections.filter((_, i) => i !== secIdx))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer text-xs"
                                >
                                  × Remove Level
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono">Curriculum Track Level #{secIdx + 1}</span>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Level Title (English)</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. Beginner Class - Level 1"
                                      value={section.titleEn || ""}
                                      onChange={(e) => {
                                        const updated = [...currSections];
                                        updated[secIdx].titleEn = e.target.value;
                                        setCurrSections(updated);
                                      }}
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-emerald-700 block uppercase text-[9px]">Level Title (Arabic)</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. الصف المبتدئ - المستوى الأول"
                                      value={section.titleAr || ""}
                                      onChange={(e) => {
                                        const updated = [...currSections];
                                        updated[secIdx].titleAr = e.target.value;
                                        setCurrSections(updated);
                                      }}
                                      dir="rtl"
                                      className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                                    />
                                  </div>
                                </div>

                                {/* Subjects / Books */}
                                <div className="p-3 bg-white/50 dark:bg-emerald-950/30 rounded-xl space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-emerald-850 dark:text-emerald-350 text-[10px] tracking-wide uppercase">Subjects & Books in this Level</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...currSections];
                                        updated[secIdx].items.push({ nameEn: "", nameAr: "" });
                                        setCurrSections(updated);
                                      }}
                                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[9px] font-bold rounded-full cursor-pointer"
                                    >
                                      ＋ Add Book / Subject
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {section.items.map((item, itemIdx) => (
                                      <div key={itemIdx} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          placeholder="English Book / Subject Name..."
                                          value={item.nameEn || ""}
                                          onChange={(e) => {
                                            const updated = [...currSections];
                                            updated[secIdx].items[itemIdx].nameEn = e.target.value;
                                            setCurrSections(updated);
                                          }}
                                          className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-1.5 text-xs text-emerald-950 dark:text-white"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Arabic..."
                                          value={item.nameAr || ""}
                                          onChange={(e) => {
                                            const updated = [...currSections];
                                            updated[secIdx].items[itemIdx].nameAr = e.target.value;
                                            setCurrSections(updated);
                                          }}
                                          dir="rtl"
                                          className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-1.5 text-xs text-right text-emerald-950 dark:text-white font-serif"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...currSections];
                                            updated[secIdx].items = updated[secIdx].items.filter((_, i) => i !== itemIdx);
                                            setCurrSections(updated);
                                          }}
                                          className="text-red-500 hover:text-red-700 font-bold px-1 text-xs cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Featured Programs / Courses */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm flex items-center gap-1.5">
                                <span>💎 Featured Madrasah Programs / Courses</span>
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                These programs are displayed as cards on the public homepage.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrFeaturedCourses([...currFeaturedCourses, { id: "feat-" + Date.now(), level: "Beginner", titleEn: "", titleAr: "", teacherEn: "", teacherAr: "", duration: "6 Weeks", descEn: "", descAr: "" }])}
                              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold rounded-full text-[11px] cursor-pointer flex items-center gap-1"
                            >
                              ＋ Add Featured Card
                            </button>
                          </div>

                          {currFeaturedCourses.length === 0 ? (
                            <div className="p-4 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl text-center text-slate-400">
                              No featured programs currently set. Add one to override the default landing page cards.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currFeaturedCourses.map((fc, fcIdx) => (
                                <div key={fc.id || fcIdx} className="p-5 bg-amber-50/10 dark:bg-amber-950/10 border border-amber-100/30 dark:border-amber-900/20 rounded-2xl space-y-4 relative">
                                  <button
                                    type="button"
                                    onClick={() => setCurrFeaturedCourses(currFeaturedCourses.filter((_, i) => i !== fcIdx))}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold cursor-pointer text-xs"
                                  >
                                    × Remove
                                  </button>
                                  <span className="text-[10px] text-amber-600 dark:text-amber-350 font-mono font-bold uppercase tracking-wider">Featured Card #{fcIdx + 1}</span>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Class Level / Category</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. Beginner, Intermediate..."
                                        value={fc.level || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].level = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Duration / Term</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. 6 Weeks, 8 Weeks..."
                                        value={fc.duration || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].duration = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Program Title (English)</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. Introduction to Arabic Alphabet"
                                        value={fc.titleEn || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].titleEn = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Program Title (Arabic)</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. مقدمة الحروف العربية"
                                        value={fc.titleAr || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].titleAr = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        dir="rtl"
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-right font-serif text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Instructor / Shaykh (English)</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. Shaykh Ahmed Al-Misri"
                                        value={fc.teacherEn || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].teacherEn = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Instructor / Shaykh (Arabic)</span>
                                      <input
                                        type="text"
                                        placeholder="e.g. الشيخ أحمد المصري"
                                        value={fc.teacherAr || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].teacherAr = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        dir="rtl"
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-right font-serif text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Description (English)</span>
                                      <textarea
                                        rows={2}
                                        placeholder="Brief description..."
                                        value={fc.descEn || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].descEn = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-emerald-700 dark:text-amber-100 block uppercase text-[9px]">Description (Arabic)</span>
                                      <textarea
                                        rows={2}
                                        placeholder="الوصف المختصر..."
                                        value={fc.descAr || ""}
                                        onChange={(e) => {
                                          const updated = [...currFeaturedCourses];
                                          updated[fcIdx].descAr = e.target.value;
                                          setCurrFeaturedCourses(updated);
                                        }}
                                        dir="rtl"
                                        className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-right font-serif text-emerald-950 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={currSaving}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow disabled:bg-slate-400"
                        >
                          {currSaving ? "💾 Saving Settings..." : "💾 Save & Deploy Public Curriculum Settings"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB 11: SERMON TV SETTINGS */}
                  {adminSubTab === "sermons" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>📺 Sermon TV Video Stream Settings</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Manage and publish video recordings, Friday sermons (Khutbah), or public lectures from YouTube to the Sermon TV playlist.
                        </p>
                      </div>

                      {sermonMessage && (
                        <div className={`p-4 rounded-xl text-xs font-bold ${sermonMessage.includes("🎉") ? "bg-emerald-50 text-emerald-850 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {sermonMessage}
                        </div>
                      )}

                      {/* Add new sermon form */}
                      <form onSubmit={handleSaveSermon} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/25 rounded-2xl space-y-4 text-xs">
                        <h4 className="font-bold text-emerald-900 dark:text-amber-100 text-xs uppercase tracking-wider">Add New Video Sermon to Playlist</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Sermon Title</span>
                            <input
                              type="text"
                              placeholder="e.g. Sincerity in Seeking Knowledge (Ikhlas)"
                              value={newSermonTitle}
                              onChange={(e) => setNewSermonTitle(e.target.value)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">YouTube Embed URL / Audio Stream URL</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="https://www.youtube.com/embed/8I869l_5mYg"
                                value={newSermonUrl}
                                onChange={(e) => setNewSermonUrl(e.target.value)}
                                className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                              />
                              <div className="relative shrink-0">
                                <input
                                  type="file"
                                  accept="audio/*,video/*"
                                  onChange={handleSermonMediaUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <button type="button" className="px-3 py-2 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer">
                                  Upload
                                </button>
                              </div>
                            </div>
                            {newSermonUrl?.startsWith("data:") && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                ✓ Media file loaded from device ({Math.round(newSermonUrl.length / 1024)} KB)
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Sermon Cover / Thumbnail Image</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Image URL..."
                                value={newSermonCoverUrl}
                                onChange={(e) => setNewSermonCoverUrl(e.target.value)}
                                className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                              />
                              <div className="relative shrink-0">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleSermonCoverUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <button type="button" className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer">
                                  Upload
                                </button>
                              </div>
                            </div>
                            {newSermonCoverUrl && (
                              <img src={newSermonCoverUrl} alt="Sermon Thumbnail" className="h-10 w-16 object-cover rounded mt-1.5 border border-emerald-100" />
                            )}
                          </div>
                        </div>

                        {/* Live Recording Widget */}
                        <div className="p-4 bg-emerald-50/5 dark:bg-emerald-950/20 rounded-2xl border border-dashed border-emerald-100 dark:border-emerald-800/45 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-900 dark:text-amber-100 flex items-center gap-1.5">
                              <span>🎙️ Audio Sermon Recording Studio</span>
                            </span>
                            {audioBlobUrlSermon && (
                              <button
                                type="button"
                                onClick={cancelSermonRecording}
                                className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                              >
                                Clear Recording
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {!isRecordingSermon ? (
                              <button
                                type="button"
                                onClick={startSermonRecording}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <span>🔴 Start Microphone Recording</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={stopSermonRecording}
                                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer animate-pulse shadow-xs"
                                >
                                  <span>⏹️ Stop Recording ({Math.floor(recordingSecondsSermon / 60)}:{(recordingSecondsSermon % 60).toString().padStart(2, "0")})</span>
                                </button>
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                              </div>
                            )}

                            {audioBlobUrlSermon && (
                              <div className="flex-1 min-w-[200px]">
                                <audio src={audioBlobUrlSermon} controls className="w-full h-8" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Category</span>
                            <select
                              value={newSermonCategory}
                              onChange={(e) => setNewSermonCategory(e.target.value)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            >
                              <option value="Sermon">Friday Sermon (Khutbah)</option>
                              <option value="Lecture">Public Lecture</option>
                              <option value="Shorts">Beneficial Reminder</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Duration</span>
                            <input
                              type="text"
                              placeholder="e.g. 25:10"
                              value={newSermonDuration}
                              onChange={(e) => setNewSermonDuration(e.target.value)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Speaker / Scholar</span>
                            <input
                              type="text"
                              value={newSermonSpeaker}
                              onChange={(e) => setNewSermonSpeaker(e.target.value)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={sermonSaving}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs cursor-pointer shadow disabled:bg-slate-400"
                        >
                          ➕ Add & Publish Sermon Video
                        </button>
                      </form>

                      {/* Active sermon list */}
                      <div className="space-y-3 pt-2">
                        <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Active Playlist ({sermons.length} Videos)</h4>
                        {sermons.length === 0 ? (
                          <p className="text-xs text-slate-400 font-serif">No videos published yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {sermons.map((sermon) => (
                              <div key={sermon.id} className="p-3 bg-emerald-50/5 border border-emerald-100 dark:border-emerald-850 rounded-xl flex justify-between items-center">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[9px] rounded-full uppercase">{sermon.category}</span>
                                    <span className="text-slate-400 text-[10px] font-mono">{sermon.duration}</span>
                                  </div>
                                  <p className="text-xs font-serif font-bold text-emerald-950 dark:text-amber-100">{sermon.title}</p>
                                  <p className="text-[10px] text-slate-400">Speaker: {sermon.speaker} | {sermon.url}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSermon(sermon.id)}
                                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-full cursor-pointer transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 12: ISLAMIC LIBRARY SETTINGS */}
                  {adminSubTab === "library" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>📚 Islamic Library Administration</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Directly add, modify, or remove Islamic books (PDF links) and classical poems from the public library dashboard.
                        </p>
                      </div>

                      {libMessage && (
                        <div className={`p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-850 border border-emerald-200`}>
                          {libMessage}
                        </div>
                      )}

                      {/* Books Management section */}
                      <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                        <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">1. Manage Library Books</h4>
                        
                        <form id="admin-book-form" onSubmit={handleAddLibraryBook} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/25 rounded-2xl space-y-4 text-xs">
                          <span className="font-bold text-emerald-850 dark:text-amber-100 text-xs uppercase tracking-wide">
                            {editingBookId ? "✏️ Edit Library Book" : "Register New Book PDF"}
                          </span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block font-serif">Book Title</span>
                              <input
                                type="text"
                                placeholder="e.g. Riyadh As-Saliheen"
                                value={newBookTitle}
                                onChange={(e) => setNewBookTitle(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Author / Writer</span>
                              <input
                                type="text"
                                placeholder="e.g. Imam An-Nawawi"
                                value={newBookAuthor}
                                onChange={(e) => setNewBookAuthor(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Book Category</span>
                              <select
                                value={newBookCategory}
                                onChange={(e) => setNewBookCategory(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              >
                                <option value="Aqeedah">Aqeedah & Creed</option>
                                <option value="Hadith">Hadith Collections</option>
                                <option value="Fiqh">Jurisprudence (Fiqh)</option>
                                <option value="Tafsir">Quran Tafsir</option>
                                <option value="Arabic">Arabic Language</option>
                                <option value="Nahw">Arabic Grammar (Nahw)</option>
                                <option value="Sarf">Morphology (Sarf)</option>
                                <option value="Seerah">Prophetic Biography (Seerah)</option>
                                <option value="Poetry">Poetry (Mutun)</option>
                                <option value="History">Islamic History</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Cover Image (Upload or Enter URL)</span>
                              <div className="flex gap-2">
                                {isBookCoverUploading ? (
                                  <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 text-xs text-amber-800 dark:text-amber-200 font-bold">
                                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full"></span>
                                    <span>⏳ Compressing & Uploading Cover...</span>
                                  </div>
                                ) : (newBookCoverUrl?.startsWith("data:") || newBookCoverUrl?.startsWith("/uploads/")) ? (
                                  <div className="flex-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded px-3 py-2 text-xs text-emerald-950 dark:text-white font-mono">
                                    <span className="truncate font-bold text-emerald-800 dark:text-emerald-300">
                                      ✓ Cover Loaded ({newBookCoverUrl.startsWith("data:") ? "Device Local" : "Saved on Server"})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setNewBookCoverUrl("")}
                                      className="ml-2 px-2 py-0.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded font-bold text-[10px] uppercase transition-colors"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="https://images.unsplash.com/... or uploaded file"
                                    value={newBookCoverUrl}
                                    onChange={(e) => setNewBookCoverUrl(e.target.value)}
                                    className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                                  />
                                )}
                                <label htmlFor="book-cover-file-input" className="px-3 py-2 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer font-serif shrink-0 flex items-center justify-center text-center select-none">
                                  Upload Cover
                                </label>
                                <input
                                  id="book-cover-file-input"
                                  type="file"
                                  accept="image/*"
                                  disabled={isBookCoverUploading}
                                  onChange={handleBookCoverUpload}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Book PDF Document (Upload File or Enter URL)</span>
                            <div className="flex gap-2">
                              {isBookPdfUploading ? (
                                <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 text-xs text-amber-800 dark:text-amber-200 font-bold">
                                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full"></span>
                                  <span>⏳ Uploading PDF to Server...</span>
                                </div>
                              ) : (newBookDownloadUrl?.startsWith("data:") || newBookDownloadUrl?.startsWith("/uploads/")) ? (
                                <div className="flex-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded px-3 py-2 text-xs text-emerald-950 dark:text-white font-mono">
                                  <span className="truncate font-bold text-emerald-800 dark:text-emerald-300">
                                    ✓ PDF Document Loaded ({newBookDownloadUrl.startsWith("data:") ? "Device Local" : "Saved on Server"})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setNewBookDownloadUrl("")}
                                    className="ml-2 px-2 py-0.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded font-bold text-[10px] uppercase transition-colors"
                                  >
                                    Clear
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="https://example.com/book.pdf or loaded from device..."
                                  value={newBookDownloadUrl}
                                  onChange={(e) => setNewBookDownloadUrl(e.target.value)}
                                  className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                                />
                              )}
                              <label htmlFor="book-pdf-file-input" className="px-3 py-2 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer font-serif shrink-0 flex items-center justify-center text-center select-none">
                                Upload PDF
                              </label>
                              <input
                                id="book-pdf-file-input"
                                type="file"
                                accept="application/pdf"
                                disabled={isBookPdfUploading}
                                onChange={handleBookPdfUpload}
                                className="hidden"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-emerald-700 block">Book Description</span>
                            <textarea
                              rows={2}
                              placeholder="Brief overview of the book's contents, importance, and level..."
                              value={newBookDesc}
                              onChange={(e) => setNewBookDesc(e.target.value)}
                              className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={libSaving}
                              className="flex-grow py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs cursor-pointer shadow flex items-center justify-center gap-1.5"
                            >
                              {libSaving ? (
                                <>
                                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                                  <span>⏳ Saving & Synchronizing...</span>
                                </>
                              ) : (
                                <span>{editingBookId ? "💾 Save Book Changes" : "➕ Add Book to Catalog"}</span>
                              )}
                            </button>
                            {editingBookId && (
                              <button
                                type="button"
                                onClick={cancelEditBook}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>

                        {/* Active books catalog */}
                        <div className="space-y-2 pt-2">
                          <span className="font-bold text-emerald-950 dark:text-amber-100 text-xs block uppercase tracking-wide">Active Book Catalog ({libraryBooks.length} Books)</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {libraryBooks.map((book) => (
                              <div key={book.id} className="p-3 bg-slate-50 dark:bg-emerald-950/20 border border-slate-100 dark:border-emerald-850 rounded-xl flex gap-3 items-center">
                                <img src={book.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120"} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm border" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-serif font-bold text-xs text-emerald-950 dark:text-amber-100 truncate">{book.title}</p>
                                  <p className="text-[10px] text-slate-400 truncate">By {book.author}</p>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-bold uppercase">{book.category}</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditBook(book)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-full cursor-pointer transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLibraryBook(book.id)}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded-full cursor-pointer transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Poetry Management section */}
                      <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-6">
                        <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">2. Manage Classical Poems (Mutun)</h4>
                        
                        <form id="admin-poem-form" onSubmit={handleAddLibraryPoem} className="p-4 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-50 dark:border-emerald-900/25 rounded-2xl space-y-4 text-xs">
                          <span className="font-bold text-emerald-850 dark:text-amber-100 text-xs uppercase tracking-wide font-serif">
                            {editingPoemId ? "✏️ Edit Mutn / Poem" : "Register New Mutn / Poem"}
                          </span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Poem Title</span>
                              <input
                                type="text"
                                placeholder="e.g. Al-Ajurrumiyyah Poem"
                                value={newPoemTitle}
                                onChange={(e) => setNewPoemTitle(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Poet Name (Nazim)</span>
                              <input
                                type="text"
                                placeholder="e.g. Ibn Ajurrum / Ibn Abi Dawud"
                                value={newPoemPoet}
                                onChange={(e) => setNewPoemPoet(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Poem Category</span>
                              <select
                                value={newPoemCategory}
                                onChange={(e) => setNewPoemCategory(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              >
                                <option value="Aqeedah">Aqeedah & Creed</option>
                                <option value="Hadith">Hadith Sciences</option>
                                <option value="Grammar">Arabic Grammar (Nahw/Sarf)</option>
                                <option value="Tajweed">Tajweed Sciences</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Poet Biography & History</span>
                              <input
                                type="text"
                                placeholder="e.g. He is Abu Abdillah Muhammad..."
                                value={newPoemBio}
                                onChange={(e) => setNewPoemBio(e.target.value)}
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Poem Cover/Illustration (Upload or Enter URL)</span>
                              <div className="flex gap-2">
                                {isPoemCoverUploading ? (
                                  <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 text-xs text-amber-800 dark:text-amber-200 font-bold">
                                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full"></span>
                                    <span>⏳ Compressing & Uploading Illustration...</span>
                                  </div>
                                ) : (newPoemCoverUrl?.startsWith("data:") || newPoemCoverUrl?.startsWith("/uploads/")) ? (
                                  <div className="flex-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded px-3 py-2 text-xs text-emerald-950 dark:text-white font-mono">
                                    <span className="truncate font-bold text-emerald-800 dark:text-emerald-300">
                                      ✓ Cover Loaded ({newPoemCoverUrl.startsWith("data:") ? "Device Local" : "Saved on Server"})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setNewPoemCoverUrl("")}
                                      className="ml-2 px-2 py-0.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded font-bold text-[10px] uppercase transition-colors"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="https://images.unsplash.com/... or uploaded file"
                                    value={newPoemCoverUrl}
                                    onChange={(e) => setNewPoemCoverUrl(e.target.value)}
                                    className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                                  />
                                )}
                                <label htmlFor="poem-cover-file-input" className="px-3 py-2 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer font-serif shrink-0 flex items-center justify-center text-center select-none">
                                  Upload Image
                                </label>
                                <input
                                  id="poem-cover-file-input"
                                  type="file"
                                  accept="image/*"
                                  disabled={isPoemCoverUploading}
                                  onChange={handlePoemCoverUpload}
                                  className="hidden"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block">Poem PDF Document (Upload File or Enter URL)</span>
                              <div className="flex gap-2">
                                {isPoemPdfUploading ? (
                                  <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 text-xs text-amber-800 dark:text-amber-200 font-bold">
                                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full"></span>
                                    <span>⏳ Uploading PDF to Server...</span>
                                  </div>
                                ) : (newPoemPdfUrl?.startsWith("data:") || newPoemPdfUrl?.startsWith("/uploads/")) ? (
                                  <div className="flex-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded px-3 py-2 text-xs text-emerald-950 dark:text-white font-mono">
                                    <span className="truncate font-bold text-emerald-800 dark:text-emerald-300">
                                      ✓ PDF Document Loaded ({newPoemPdfUrl.startsWith("data:") ? "Device Local" : "Saved on Server"})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setNewPoemPdfUrl("")}
                                      className="ml-2 px-2 py-0.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded font-bold text-[10px] uppercase transition-colors"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="https://example.com/poem.pdf or loaded from device..."
                                    value={newPoemPdfUrl}
                                    onChange={(e) => setNewPoemPdfUrl(e.target.value)}
                                    className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white font-mono"
                                  />
                                )}
                                <label htmlFor="poem-pdf-file-input" className="px-3 py-2 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded text-xs cursor-pointer font-serif shrink-0 flex items-center justify-center text-center select-none">
                                  Upload PDF
                                </label>
                                <input
                                  id="poem-pdf-file-input"
                                  type="file"
                                  accept="application/pdf"
                                  disabled={isPoemPdfUploading}
                                  onChange={handlePoemPdfUpload}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block uppercase text-[9px]">Arabic Lines (One verse line per line)</span>
                              <textarea
                                rows={5}
                                value={newPoemArabicText}
                                onChange={(e) => setNewPoemArabicText(e.target.value)}
                                dir="rtl"
                                placeholder="أبدأ بالحمد مصليا على ... محمد خير نبي أرسلا"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs font-serif text-right text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 block uppercase text-[9px]">English Translations (One line per line)</span>
                              <textarea
                                rows={5}
                                value={newPoemTranslationText}
                                onChange={(e) => setNewPoemTranslationText(e.target.value)}
                                placeholder="I begin with praise sending blessings upon ... Muhammad, the best Prophet sent"
                                className="w-full bg-white dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded p-2 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={libSaving}
                              className="flex-grow py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs cursor-pointer shadow flex items-center justify-center gap-1.5"
                            >
                              {libSaving ? (
                                <>
                                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                                  <span>⏳ Saving & Synchronizing...</span>
                                </>
                              ) : (
                                <span>{editingPoemId ? "💾 Save Poem Changes" : "➕ Add Poem to Catalog"}</span>
                              )}
                            </button>
                            {editingPoemId && (
                              <button
                                type="button"
                                onClick={cancelEditPoem}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>

                        {/* Active poems list */}
                        <div className="space-y-2 pt-2">
                          <span className="font-bold text-emerald-950 dark:text-amber-100 text-xs block uppercase tracking-wide">Active Poems Catalog ({libraryPoems.length} Poems)</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {libraryPoems.map((poem) => (
                              <div key={poem.id} className="p-3 bg-slate-50 dark:bg-emerald-950/20 border border-slate-100 dark:border-emerald-850 rounded-xl flex justify-between items-center font-serif">
                                <div className="min-w-0">
                                  <p className="font-serif font-bold text-xs text-emerald-950 dark:text-amber-100">{poem.title}</p>
                                  <p className="text-[10px] text-slate-400 font-sans">By {poem.poetName} ({poem.arabicText?.length || 0} verses)</p>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-bold uppercase font-sans">{poem.category}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <button
                                    type="button"
                                    onClick={() => startEditPoem(poem)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-full cursor-pointer transition-colors font-sans"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLibraryPoem(poem.id)}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded-full cursor-pointer transition-colors font-sans"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 13: DONATION SETTINGS PANEL */}
                  {adminSubTab === "donations" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>💝 Donate Now Settings Management</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          Directly manage the charity campaign targets, account numbers, and banking details shown to donors.
                        </p>
                      </div>

                      {donMessage && (
                        <div className={`p-4 rounded-xl text-xs font-bold ${donMessage.includes("🎉") ? "bg-emerald-50 text-emerald-850 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {donMessage}
                        </div>
                      )}

                      <form onSubmit={handleSaveDonationSettings} className="space-y-6 text-xs">
                        
                        {/* Target campaign metadata */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Campaign Target Details</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Campaign Title</label>
                              <input
                                type="text"
                                value={donTargetTitle}
                                onChange={(e) => setDonTargetTitle(e.target.value)}
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Goal Amount ($)</label>
                                <input
                                  type="number"
                                  value={donTargetAmount}
                                  onChange={(e) => setDonTargetAmount(Number(e.target.value))}
                                  required
                                  className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Raised Amount ($)</label>
                                <input
                                  type="number"
                                  value={donRaisedAmount}
                                  onChange={(e) => setDonRaisedAmount(Number(e.target.value))}
                                  required
                                  className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Campaign Description</label>
                            <textarea
                              rows={3}
                              value={donTargetDescription}
                              onChange={(e) => setDonTargetDescription(e.target.value)}
                              required
                              className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Bank credentials */}
                        <div className="space-y-4 border-t border-emerald-50 dark:border-emerald-900/35 pt-4">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm">Direct Bank Transfer details</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Bank Name</label>
                              <input
                                type="text"
                                value={donBank}
                                onChange={(e) => setDonBank(e.target.value)}
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Account Name</label>
                              <input
                                type="text"
                                value={donAccountName}
                                onChange={(e) => setDonAccountName(e.target.value)}
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 block uppercase tracking-wider text-[10px]">Account Number</label>
                              <input
                                type="text"
                                value={donAccountNumber}
                                onChange={(e) => setDonAccountNumber(e.target.value)}
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={donSaving}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow disabled:bg-slate-400"
                        >
                          {donSaving ? "💾 Saving Settings..." : "💾 Save & Deploy Donation Settings"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB 14: REGISTER TEACHER PANEL */}
                  {adminSubTab === "registerTeacher" && (
                    <div className="bg-white dark:bg-emerald-900 rounded-xl p-6 sm:p-8 border border-emerald-100 dark:border-emerald-800 shadow-sm space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-950 dark:text-amber-100 flex items-center gap-2 font-serif">
                          <span>👨‍🏫 Register a New Teacher</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          Create a new official teacher account and automatically configure access to the Teacher Dashboard.
                        </p>
                      </div>

                      {tchError && (
                        <div className="p-4 rounded-xl text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                          ⚠️ {tchError}
                        </div>
                      )}

                      {tchSuccess && (
                        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-850 border border-emerald-200 space-y-2">
                          <div>🎉 {tchSuccess}</div>
                          {tchRegisteredId && (
                            <div className="mt-2 p-2.5 bg-white dark:bg-emerald-950/45 rounded-lg border border-emerald-250 font-mono text-[11px] space-y-1 text-emerald-950 dark:text-white">
                              <span className="block font-bold text-emerald-800 uppercase tracking-wider text-[9px]">Generated Credentials</span>
                              <div><span className="text-slate-400">Teacher ID:</span> <span className="font-bold">{tchRegisteredId}</span></div>
                              <div><span className="text-slate-400">Please communicate this secure identifier to the teacher. They can now log in normally.</span></div>
                            </div>
                          )}
                        </div>
                      )}

                      <form onSubmit={handleRegisterTeacher} className="space-y-6 text-xs text-left">
                        {/* 1. Personal Info */}
                        <div className="space-y-4 pt-2">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm border-b border-emerald-50 dark:border-emerald-900/35 pb-2">
                            1. Personal Details
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Full Name *</label>
                              <input
                                type="text"
                                value={tchName}
                                onChange={(e) => setTchName(e.target.value)}
                                placeholder="Shaykh/Ustadh Full Name"
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Email Address *</label>
                              <input
                                type="email"
                                value={tchEmail}
                                onChange={(e) => setTchEmail(e.target.value)}
                                placeholder="teacher@abuqoonitah.academy"
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Phone Number</label>
                              <input
                                type="text"
                                value={tchPhone}
                                onChange={(e) => setTchPhone(e.target.value)}
                                placeholder="e.g., +234 812 245 5759"
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Gender</label>
                              <select
                                value={tchGender}
                                onChange={(e) => setTchGender(e.target.value)}
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                          </div>

                          {/* Profile Picture Drag-and-Drop / Selector */}
                          <div className="space-y-2">
                            <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Profile Picture</label>
                            <div 
                              className="border-2 border-dashed border-emerald-200 dark:border-emerald-850 hover:border-emerald-400 dark:hover:border-emerald-700 rounded-xl p-4 text-center cursor-pointer bg-emerald-50/10 dark:bg-emerald-950/10 transition-colors relative"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setTchProfilePic(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            >
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setTchProfilePic(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              {tchProfilePic ? (
                                <div className="flex flex-col items-center gap-2">
                                  <img 
                                    src={tchProfilePic} 
                                    alt="Preview" 
                                    className="w-16 h-16 rounded-full object-cover border border-emerald-200 shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Image selected successfully (Click or drag to change)</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-emerald-700 dark:text-emerald-300 font-semibold">Drag and drop an image here, or click to browse</p>
                                  <p className="text-[10px] text-slate-400">Supports PNG, JPG, GIF up to 2MB</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Professional Details */}
                        <div className="space-y-4 pt-2">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm border-b border-emerald-50 dark:border-emerald-900/35 pb-2">
                            2. Professional Details
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Subject(s) Taught</label>
                              <input
                                type="text"
                                value={tchSubjects}
                                onChange={(e) => setTchSubjects(e.target.value)}
                                placeholder="e.g., Arabic Grammar, Fiqh, Tajweed"
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Class / Level Assigned</label>
                              <select
                                value={tchClass}
                                onChange={(e) => setTchClass(e.target.value)}
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Qualifications</label>
                            <input
                              type="text"
                              value={tchQualification}
                              onChange={(e) => setTchQualification(e.target.value)}
                              placeholder="e.g., B.A. in Islamic Studies (Islamic University of Madinah)"
                              className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Biography / Background</label>
                            <textarea
                              rows={3}
                              value={tchBio}
                              onChange={(e) => setTchBio(e.target.value)}
                              placeholder="A short biography detailing experience and background..."
                              className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-medium"
                            />
                          </div>
                        </div>

                        {/* 3. Credentials & Login */}
                        <div className="space-y-4 pt-2">
                          <h4 className="font-bold text-emerald-950 dark:text-amber-100 text-sm border-b border-emerald-50 dark:border-emerald-900/35 pb-2">
                            3. Login Credentials
                          </h4>

                          <div className="space-y-1">
                            <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Username *</label>
                            <input
                              type="text"
                              value={tchUsername}
                              onChange={(e) => setTchUsername(e.target.value)}
                              placeholder="Choose username (e.g. shaykh_ahmed)"
                              required
                              className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Password *</label>
                              <input
                                type="password"
                                value={tchPassword}
                                onChange={(e) => setTchPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider text-[10px]">Confirm Password *</label>
                              <input
                                type="password"
                                value={tchConfirmPassword}
                                onChange={(e) => setTchConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-emerald-50/40 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-xs text-emerald-950 dark:text-white font-mono font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={tchLoading}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow disabled:bg-slate-400 transition-colors mt-2"
                        >
                          {tchLoading ? "⚙️ Processing Registration..." : "👨‍🏫 Register Teacher & Create Account"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
