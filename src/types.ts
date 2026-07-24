/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'guest';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  level?: 'beginner' | 'intermediate' | 'advanced';
  semester?: string;
  teacherId?: string;
  teacherName?: string;
  assignedTeacherName?: string;
  isPaid?: boolean;
  enrolledCourses: string[]; // Course IDs
  progress: Record<string, number>; // CourseID -> percentage completed (0-100)
  attendance: Record<string, { date: string; status: 'present' | 'absent' | 'excused' }[]>; // CourseID -> Attendance records
  createdAt: string;
  plainPassword?: string;
  whyJoin?: string;
  dob?: string;
  country?: string;
  state?: string;
  paymentMode?: string;
  receiptUrl?: string;
  whatsapp?: string;
  teacherId?: string;
  phone?: string;
  gender?: string;
  profilePic?: string;
  subjects?: string;
  assignedClass?: string;
  qualification?: string;
  bio?: string;
}

export interface Course {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'free';
  title: string;
  description: string;
  duration: string;
  teacherName: string;
  objectives: string[];
  videos: Video[];
  pdfs: Pdf[];
  assignments: Assignment[];
  quizzes: Quiz[];
  enrolledStudentsCount: number;
}

export interface Video {
  id: string;
  title: string;
  url: string; // Embed or stream url
  description: string;
  duration: string;
  audioUrl?: string; // Voice note or audio lecture URL/Base64
  photos?: string[]; // Slide/whiteboard photos
}

export interface Pdf {
  id: string;
  title: string;
  url: string;
  description: string;
  fileSize: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  durationMinutes?: number;
  limitQuestions?: number | null;
  automaticMarking?: boolean;
  examDate?: string | null;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  type: 'assignment' | 'quiz' | 'exam' | 'payment';
  referenceId: string; // assignmentId or quizId or 'final-exam'
  referenceTitle: string; // assignment or quiz title
  submissionContent: string; // Text answer or option choices
  submittedAt: string;
  score?: number; // Graded score
  maxPoints: number;
  gradedBy?: string;
  gradedAt?: string;
  comments?: string;
  status: 'pending' | 'graded';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: 'Aqeedah' | 'Fiqh' | 'Hadith' | 'Tafsir' | 'Arabic' | 'Nahw' | 'Sarf' | 'Seerah' | 'Poetry' | 'History';
  description: string;
  downloadUrl: string;
  coverUrl: string;
  isFavorite?: boolean;
}

export interface Poem {
  id: string;
  title: string;
  poetName: string;
  biography: string;
  category: 'Spiritual' | 'Arabic Grammar' | 'Exhortation' | 'Praise' | 'Wisdom';
  arabicText: string[];
  translationText: string[];
  audioUrl: string;
  pdfUrl?: string;
  coverUrl?: string;
  isBookmarked?: boolean;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  category: 'sponsor_student' | 'build_education' | 'general' | 'monthly_donor';
  type: 'one-time' | 'monthly';
  message: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetRole: 'all' | 'student' | 'teacher';
  author: string;
}

export interface DiscussionMessage {
  id: string;
  courseId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
}

export interface SchoolCalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: 'holiday' | 'exam' | 'event' | 'lecture';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatarUrl?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // 'admin' or user ID or 'teachers' or 'all'
  recipientRole?: 'admin' | 'teacher' | 'student';
  title: string;
  message: string;
  type: 'message' | 'assignment' | 'free_course' | 'enrollment';
  linkTab?: string;
  createdAt: string;
  read: boolean;
  fromName?: string;
  fromRole?: string;
}

