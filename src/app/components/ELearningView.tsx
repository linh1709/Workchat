import { useState, useRef, useEffect, useCallback } from "react";
import {
  GraduationCap, BookOpen, Play, Clock, Award, Users,
  Star, ChevronRight, Search, Filter, BarChart3, Calendar,
  CheckCircle2, Lock, TrendingUp, Video, FileText, Download,
  MessageSquare, Target, Zap, ArrowRight, Bookmark, BookMarked,
  Trophy, Flame, CircleCheck, Circle, ChevronDown, X,
  PlayCircle, PauseCircle, RotateCcw, Volume2, Maximize2,
  Eye, ThumbsUp, Share2, Flag, ListChecks, Timer,
  Lightbulb, Brain, Layers, Monitor, Smartphone, Globe,
  SkipBack, SkipForward, VolumeX, Settings, Pencil, StickyNote,
  Presentation, Image, Headphones, ChevronUp, Pause,
  PanelRightClose, PanelRightOpen, MoreHorizontal, Heart,
  Fullscreen, Minimize2
} from "lucide-react";
import { LearningPlayerView } from "./LearningPlayerView";

// ──── Data Types ────
interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  thumbnail: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  rating: number;
  enrolled: number;
  tags: string[];
  status: "not_started" | "in_progress" | "completed";
  certificate?: boolean;
  mandatory?: boolean;
  deadline?: string;
  lastAccessed?: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[];
  totalDuration: string;
  progress: number;
  color: string;
  icon: string;
}

interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  enrolled: number;
  maxCapacity: number;
  status: "upcoming" | "live" | "completed";
  courseId: string;
}

interface Certificate {
  id: string;
  courseTitle: string;
  issueDate: string;
  credentialId: string;
  instructor: string;
}

// ──── Mock Data ────
const courses: Course[] = [
  {
    id: "c1", title: "React & TypeScript Nâng cao", description: "Xây dựng ứng dụng React với TypeScript, Hooks patterns, Performance optimization và Testing",
    instructor: "Nguyễn Văn A", instructorAvatar: "NV", thumbnail: "react", category: "Frontend", level: "advanced",
    duration: "24h", totalLessons: 48, completedLessons: 32, progress: 67, rating: 4.8, enrolled: 156,
    tags: ["React", "TypeScript", "Hooks"], status: "in_progress", mandatory: true, deadline: "2026-04-15", lastAccessed: "2 giờ trước"
  },
  {
    id: "c2", title: "UX/UI Design System", description: "Thiết kế Design System từ A-Z: Typography, Color, Components, Documentation",
    instructor: "Trần Thị B", instructorAvatar: "TT", thumbnail: "design", category: "Design", level: "intermediate",
    duration: "18h", totalLessons: 36, completedLessons: 36, progress: 100, rating: 4.9, enrolled: 203,
    tags: ["UI/UX", "Figma", "Design System"], status: "completed", certificate: true
  },
  {
    id: "c3", title: "DevOps & CI/CD Pipeline", description: "Docker, Kubernetes, GitHub Actions, Monitoring & Logging",
    instructor: "Lê Văn C", instructorAvatar: "LV", thumbnail: "devops", category: "DevOps", level: "advanced",
    duration: "30h", totalLessons: 60, completedLessons: 15, progress: 25, rating: 4.7, enrolled: 89,
    tags: ["Docker", "K8s", "CI/CD"], status: "in_progress", lastAccessed: "1 ngày trước"
  },
  {
    id: "c4", title: "Agile & Scrum Master", description: "Phương pháp Agile, Scrum framework, Sprint planning, Retrospective",
    instructor: "Phạm Thị D", instructorAvatar: "PT", thumbnail: "agile", category: "Quản lý", level: "beginner",
    duration: "12h", totalLessons: 24, completedLessons: 0, progress: 0, rating: 4.6, enrolled: 312,
    tags: ["Agile", "Scrum", "Management"], status: "not_started", mandatory: true, deadline: "2026-05-01"
  },
  {
    id: "c5", title: "Node.js Microservices", description: "Kiến trúc Microservices với Node.js, gRPC, Message Queue, API Gateway",
    instructor: "Hoàng Văn E", instructorAvatar: "HV", thumbnail: "nodejs", category: "Backend", level: "advanced",
    duration: "28h", totalLessons: 56, completedLessons: 42, progress: 75, rating: 4.8, enrolled: 134,
    tags: ["Node.js", "Microservices", "gRPC"], status: "in_progress", lastAccessed: "5 giờ trước"
  },
  {
    id: "c6", title: "Bảo mật ứng dụng Web", description: "OWASP Top 10, Penetration Testing, Authentication & Authorization",
    instructor: "Đặng Văn F", instructorAvatar: "ĐV", thumbnail: "security", category: "Security", level: "intermediate",
    duration: "16h", totalLessons: 32, completedLessons: 0, progress: 0, rating: 4.5, enrolled: 178,
    tags: ["Security", "OWASP", "Pentest"], status: "not_started"
  },
  {
    id: "c7", title: "Data Analytics với Python", description: "Pandas, NumPy, Visualization, Machine Learning cơ bản",
    instructor: "Vũ Thị G", instructorAvatar: "VT", thumbnail: "python", category: "Data", level: "intermediate",
    duration: "22h", totalLessons: 44, completedLessons: 44, progress: 100, rating: 4.7, enrolled: 245,
    tags: ["Python", "Data", "ML"], status: "completed", certificate: true
  },
  {
    id: "c8", title: "Leadership & Communication", description: "Kỹ năng lãnh đạo, giao tiếp hiệu quả, quản lý xung đột",
    instructor: "Ngô Thị H", instructorAvatar: "NT", thumbnail: "leadership", category: "Soft Skills", level: "beginner",
    duration: "8h", totalLessons: 16, completedLessons: 10, progress: 63, rating: 4.4, enrolled: 428,
    tags: ["Leadership", "Communication"], status: "in_progress", mandatory: true, deadline: "2026-03-30", lastAccessed: "3 ngày trước"
  },
];

const learningPaths: LearningPath[] = [
  { id: "lp1", title: "Full-Stack Developer", description: "Lộ trình trở thành Full-Stack Developer", courses: ["c1", "c5", "c3"], totalDuration: "82h", progress: 56, color: "#6366f1", icon: "🚀" },
  { id: "lp2", title: "Tech Lead", description: "Lộ trình phát triển lên Tech Lead", courses: ["c1", "c4", "c8"], totalDuration: "44h", progress: 43, color: "#0891b2", icon: "⭐" },
  { id: "lp3", title: "Security Engineer", description: "Chuyên gia bảo mật ứng dụng", courses: ["c6", "c3"], totalDuration: "46h", progress: 12, color: "#dc2626", icon: "🛡️" },
  { id: "lp4", title: "Product Designer", description: "Lộ trình UX/UI Designer chuyên nghiệp", courses: ["c2", "c8"], totalDuration: "26h", progress: 82, color: "#ec4899", icon: "🎨" },
];

const liveSessions: LiveSession[] = [
  { id: "ls1", title: "Workshop: React Server Components", instructor: "Nguyễn Văn A", date: "2026-03-20", time: "14:00", duration: "2h", enrolled: 45, maxCapacity: 60, status: "upcoming", courseId: "c1" },
  { id: "ls2", title: "Q&A: Triển khai Kubernetes Production", instructor: "Lê Văn C", date: "2026-03-22", time: "10:00", duration: "1.5h", enrolled: 30, maxCapacity: 40, status: "upcoming", courseId: "c3" },
  { id: "ls3", title: "Live Coding: Design System Components", instructor: "Trần Thị B", date: "2026-03-18", time: "15:00", duration: "2h", enrolled: 58, maxCapacity: 60, status: "live", courseId: "c2" },
  { id: "ls4", title: "Seminar: Agile trong thực tế", instructor: "Phạm Thị D", date: "2026-03-25", time: "09:00", duration: "1h", enrolled: 80, maxCapacity: 100, status: "upcoming", courseId: "c4" },
];

const certificates: Certificate[] = [
  { id: "cert1", courseTitle: "UX/UI Design System", issueDate: "2026-02-15", credentialId: "VWORK-DS-2026-0215", instructor: "Trần Thị B" },
  { id: "cert2", courseTitle: "Data Analytics với Python", issueDate: "2026-01-20", credentialId: "VWORK-DA-2026-0120", instructor: "Vũ Thị G" },
];

const categories = ["Tất cả", "Frontend", "Backend", "Design", "DevOps", "Security", "Data", "Quản lý", "Soft Skills"];

// ──── Color helpers ────
const levelConfig = {
  beginner: { label: "Cơ bản", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  intermediate: { label: "Trung bình", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  advanced: { label: "Nâng cao", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const thumbnailColors: Record<string, string> = {
  react: "#61dafb", design: "#ec4899", devops: "#14b8a6", agile: "#6366f1",
  nodejs: "#68a063", security: "#dc2626", python: "#3776ab", leadership: "#f59e0b",
};

const thumbnailIcons: Record<string, string> = {
  react: "⚛️", design: "🎨", devops: "🔧", agile: "📋",
  nodejs: "🟢", security: "🔒", python: "🐍", leadership: "👥",
};

type TabType = "dashboard" | "courses" | "paths" | "live" | "certificates";

export function ELearningView() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [bookmarked, setBookmarked] = useState<string[]>(["c1", "c5"]);
  const [learningMode, setLearningMode] = useState(false);

  const tabs: { key: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "dashboard", label: "Tổng quan", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "courses", label: "Khóa học", icon: <BookOpen className="w-4 h-4" />, badge: courses.length },
    { key: "paths", label: "Lộ trình", icon: <Target className="w-4 h-4" />, badge: learningPaths.length },
    { key: "live", label: "Lớp học trực tiếp", icon: <Video className="w-4 h-4" />, badge: liveSessions.filter(s => s.status !== "completed").length },
    { key: "certificates", label: "Chứng chỉ", icon: <Award className="w-4 h-4" />, badge: certificates.length },
  ];

  const myCourses = courses.filter(c => c.status === "in_progress");
  const completedCourses = courses.filter(c => c.status === "completed");
  const mandatoryCourses = courses.filter(c => c.mandatory && c.status !== "completed");
  const totalHoursLearned = courses.reduce((sum, c) => sum + (parseInt(c.duration) * c.progress / 100), 0);

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = selectedCategory === "Tất cả" || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  // ──── Learning Player View ────
  if (selectedCourse && learningMode) {
    return <LearningPlayerView courseTitle={selectedCourse.title} onBack={() => setLearningMode(false)} />;
  }

  // ──── Course Detail View ────
  if (selectedCourse) {
    return <CourseDetailView course={selectedCourse} onBack={() => setSelectedCourse(null)} bookmarked={bookmarked.includes(selectedCourse.id)} onToggleBookmark={() => setBookmarked(prev => prev.includes(selectedCourse.id) ? prev.filter(id => id !== selectedCourse.id) : [...prev, selectedCourse.id])} onStartLearning={() => setLearningMode(true)} />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 text-[18px]" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>Học trực tuyến</h1>
              <p className="text-[12px] text-gray-500">Hệ thống đào tạo nội bộ VWork Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-[12px] text-amber-700">7 ngày liên tục</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-200">
              <Trophy className="w-4 h-4 text-violet-500" />
              <span className="text-[12px] text-violet-700">1,240 XP</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-all ${
                activeTab === tab.key
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-amber-200 text-amber-800" : "bg-gray-100 text-gray-500"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "dashboard" && (
          <DashboardTab
            myCourses={myCourses}
            completedCourses={completedCourses}
            mandatoryCourses={mandatoryCourses}
            totalHoursLearned={totalHoursLearned}
            liveSessions={liveSessions}
            learningPaths={learningPaths}
            certificates={certificates}
            onSelectCourse={setSelectedCourse}
          />
        )}
        {activeTab === "courses" && (
          <CoursesTab
            courses={filteredCourses}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onSelectCourse={setSelectedCourse}
            bookmarked={bookmarked}
            onToggleBookmark={(id) => setBookmarked(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        {activeTab === "paths" && (
          <PathsTab paths={learningPaths} courses={courses} onSelectCourse={setSelectedCourse} />
        )}
        {activeTab === "live" && (
          <LiveTab sessions={liveSessions} courses={courses} />
        )}
        {activeTab === "certificates" && (
          <CertificatesTab certificates={certificates} />
        )}
      </div>
    </div>
  );
}

// ══════════════ DASHBOARD TAB ══════════════
function DashboardTab({ myCourses, completedCourses, mandatoryCourses, totalHoursLearned, liveSessions, learningPaths, certificates, onSelectCourse }: {
  myCourses: Course[]; completedCourses: Course[]; mandatoryCourses: Course[]; totalHoursLearned: number;
  liveSessions: LiveSession[]; learningPaths: LearningPath[]; certificates: Certificate[];
  onSelectCourse: (c: Course) => void;
}) {
  const liveNow = liveSessions.find(s => s.status === "live");

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Đang học", value: myCourses.length, icon: <BookOpen className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Hoàn thành", value: completedCourses.length, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Giờ đã học", value: `${Math.round(totalHoursLearned)}h`, icon: <Clock className="w-5 h-5" />, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
          { label: "Chứng chỉ", value: certificates.length, icon: <Award className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} border ${stat.border} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${stat.color}`}>{stat.icon}</span>
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-[24px] text-gray-900" style={{ fontWeight: 600 }}>{stat.value}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Live Now Banner */}
      {liveNow && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Đang phát trực tiếp</span>
              </div>
              <p className="text-[14px]" style={{ fontWeight: 500 }}>{liveNow.title}</p>
              <p className="text-[12px] text-white/80">{liveNow.instructor} • {liveNow.enrolled} người tham gia</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white text-red-600 rounded-lg text-[13px] hover:bg-white/90 transition-all flex items-center gap-2" style={{ fontWeight: 500 }}>
            <Play className="w-4 h-4" /> Tham gia ngay
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] text-gray-900" style={{ fontWeight: 600 }}>Tiếp tục học</h2>
            <span className="text-[12px] text-amber-600 cursor-pointer hover:underline">Xem tất cả →</span>
          </div>
          <div className="space-y-3">
            {myCourses.map(course => (
              <button key={course.id} onClick={() => onSelectCourse(course)} className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-sm transition-all text-left group">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-[24px] shrink-0" style={{ backgroundColor: `${thumbnailColors[course.thumbnail]}20` }}>
                    {thumbnailIcons[course.thumbnail]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[14px] text-gray-900 truncate" style={{ fontWeight: 500 }}>{course.title}</p>
                      {course.mandatory && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0">Bắt buộc</span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 mb-2">{course.instructor} • {course.category}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500 shrink-0">{course.progress}%</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{course.completedLessons}/{course.totalLessons} bài</span>
                    </div>
                    {course.deadline && (
                      <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hạn: {new Date(course.deadline).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <Play className="w-5 h-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Mandatory Courses */}
          {mandatoryCourses.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-[15px] text-gray-900 flex items-center gap-2" style={{ fontWeight: 600 }}>
                  <Flag className="w-4 h-4 text-red-500" /> Khóa học bắt buộc
                </h2>
                <span className="text-[12px] text-red-500">{mandatoryCourses.length} chưa hoàn thành</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mandatoryCourses.map(course => (
                  <button key={course.id} onClick={() => onSelectCourse(course)} className="bg-white border border-red-100 rounded-xl p-3 hover:border-red-300 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: `${thumbnailColors[course.thumbnail]}15` }}>
                        {thumbnailIcons[course.thumbnail]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 500 }}>{course.title}</p>
                        <p className="text-[11px] text-gray-500">{course.progress}% • Hạn {course.deadline ? new Date(course.deadline).toLocaleDateString("vi-VN") : ""}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Learning Streak */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[13px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Chuỗi học tập</h3>
            <div className="flex items-center justify-between mb-3">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] ${
                    i < 5 ? "bg-amber-100 text-amber-600" : i === 5 ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {i < 6 ? <Flame className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
                  </div>
                  <span className="text-[9px] text-gray-400">{day}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 text-center">🔥 Tuyệt vời! Giữ chuỗi 7 ngày để nhận thưởng!</p>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[13px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Lịch học sắp tới</h3>
            <div className="space-y-2.5">
              {liveSessions.filter(s => s.status === "upcoming").slice(0, 3).map(session => (
                <div key={session.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-900 truncate" style={{ fontWeight: 500 }}>{session.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(session.date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" })} • {session.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Paths Progress */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[13px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Lộ trình của tôi</h3>
            <div className="space-y-3">
              {learningPaths.slice(0, 3).map(path => (
                <div key={path.id} className="group cursor-pointer">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[14px]">{path.icon}</span>
                    <p className="text-[12px] text-gray-800 flex-1 truncate" style={{ fontWeight: 500 }}>{path.title}</p>
                    <span className="text-[11px] text-gray-500">{path.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${path.progress}%`, backgroundColor: path.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════ COURSES TAB ══════════════
function CoursesTab({ courses, searchQuery, onSearchChange, selectedCategory, onCategoryChange, onSelectCourse, bookmarked, onToggleBookmark }: {
  courses: Course[]; searchQuery: string; onSearchChange: (q: string) => void;
  selectedCategory: string; onCategoryChange: (c: string) => void;
  onSelectCourse: (c: Course) => void; bookmarked: string[]; onToggleBookmark: (id: string) => void;
}) {
  return (
    <div className="p-6 space-y-4">
      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm khóa học, chủ đề, giảng viên..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-[12px] transition-all border ${
              selectedCategory === cat
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-[12px] text-gray-500">{courses.length} khóa học</p>

      {/* Course Grid */}
      <div className="grid grid-cols-3 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-amber-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => onSelectCourse(course)}>
            {/* Thumbnail */}
            <div className="h-32 relative flex items-center justify-center" style={{ backgroundColor: `${thumbnailColors[course.thumbnail]}15` }}>
              <span className="text-[48px]">{thumbnailIcons[course.thumbnail]}</span>
              {course.mandatory && (
                <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-red-500 text-white">Bắt buộc</span>
              )}
              <div className={`absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full ${levelConfig[course.level].bg} ${levelConfig[course.level].color} border ${levelConfig[course.level].border}`}>
                {levelConfig[course.level].label}
              </div>
              <button
                onClick={e => { e.stopPropagation(); onToggleBookmark(course.id); }}
                className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
              >
                {bookmarked.includes(course.id) ? <BookMarked className="w-3.5 h-3.5 text-amber-500" /> : <Bookmark className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              {course.status === "in_progress" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div className="h-full bg-amber-500" style={{ width: `${course.progress}%` }} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{course.category}</span>
                <span className="text-[10px] text-gray-400">•</span>
                <span className="text-[10px] text-gray-500">{course.duration}</span>
              </div>
              <p className="text-[14px] text-gray-900 mb-1 line-clamp-2" style={{ fontWeight: 500 }}>{course.title}</p>
              <p className="text-[12px] text-gray-500 mb-3 line-clamp-2">{course.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[7px] text-white">{course.instructorAvatar}</div>
                  <span className="text-[11px] text-gray-600">{course.instructor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] text-gray-600">{course.rating}</span>
                  <span className="text-[11px] text-gray-400">({course.enrolled})</span>
                </div>
              </div>

              {course.status === "in_progress" && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-amber-600">{course.progress}% hoàn thành</span>
                  <span className="text-[11px] text-gray-400">{course.lastAccessed}</span>
                </div>
              )}
              {course.status === "completed" && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600">Đã hoàn thành</span>
                  {course.certificate && <Award className="w-3.5 h-3.5 text-amber-500 ml-auto" />}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════ PATHS TAB ══════════════
function PathsTab({ paths, courses: allCourses, onSelectCourse }: { paths: LearningPath[]; courses: Course[]; onSelectCourse: (c: Course) => void }) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] text-gray-900" style={{ fontWeight: 600 }}>Lộ trình học tập</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">Theo dõi tiến độ và hoàn thành các lộ trình đào tạo</p>
        </div>
      </div>

      <div className="space-y-4">
        {paths.map(path => {
          const pathCourses = path.courses.map(id => allCourses.find(c => c.id === id)).filter(Boolean) as Course[];
          const isExpanded = expandedPath === path.id;

          return (
            <div key={path.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all">
              <button onClick={() => setExpandedPath(isExpanded ? null : path.id)} className="w-full p-5 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[28px] shrink-0" style={{ backgroundColor: `${path.color}15` }}>
                    {path.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-[16px] text-gray-900" style={{ fontWeight: 600 }}>{path.title}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{pathCourses.length} khóa</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{path.totalDuration}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 mb-3">{path.description}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${path.progress}%`, backgroundColor: path.color }} />
                      </div>
                      <span className="text-[13px] text-gray-600 shrink-0" style={{ fontWeight: 500 }}>{path.progress}%</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-2.5 border-t border-gray-100 pt-4">
                  {pathCourses.map((course, i) => (
                    <button key={course.id} onClick={() => onSelectCourse(course)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] shrink-0 ${
                        course.status === "completed" ? "bg-emerald-100 text-emerald-600" : course.status === "in_progress" ? "text-white" : "bg-gray-100 text-gray-400"
                      }`} style={course.status === "in_progress" ? { backgroundColor: path.color } : undefined}>
                        {course.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-900" style={{ fontWeight: 500 }}>{course.title}</p>
                        <p className="text-[11px] text-gray-500">{course.duration} • {course.totalLessons} bài học</p>
                      </div>
                      {course.status === "in_progress" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${path.color}15`, color: path.color }}>{course.progress}%</span>
                      )}
                      {course.status === "completed" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Hoàn thành</span>
                      )}
                      {course.status === "not_started" && (
                        <Lock className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════ LIVE TAB ══════════════
function LiveTab({ sessions, courses }: { sessions: LiveSession[]; courses: Course[] }) {
  const upcoming = sessions.filter(s => s.status === "upcoming");
  const live = sessions.filter(s => s.status === "live");

  return (
    <div className="p-6 space-y-6">
      {/* Live Now */}
      {live.length > 0 && (
        <div>
          <h2 className="text-[15px] text-gray-900 mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Đang diễn ra
          </h2>
          {live.map(session => (
            <div key={session.id} className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-[16px] mb-1" style={{ fontWeight: 600 }}>{session.title}</p>
                    <p className="text-[13px] text-white/80">{session.instructor} • {session.duration}</p>
                    <p className="text-[12px] text-white/60 mt-1">{session.enrolled}/{session.maxCapacity} người tham gia</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-white text-red-600 rounded-xl text-[14px] hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg" style={{ fontWeight: 500 }}>
                  <Play className="w-4 h-4" /> Tham gia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-[15px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Sắp diễn ra</h2>
        <div className="grid grid-cols-2 gap-4">
          {upcoming.map(session => {
            const course = courses.find(c => c.id === session.courseId);
            return (
              <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-amber-300 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-gray-900 mb-0.5" style={{ fontWeight: 500 }}>{session.title}</p>
                    <p className="text-[12px] text-gray-500">{session.instructor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(session.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {session.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[12px] text-gray-500">{session.enrolled}/{session.maxCapacity}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(session.enrolled / session.maxCapacity) * 100}%` }} />
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[12px] hover:bg-amber-100 transition-all border border-amber-200">
                    Đăng ký
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════ CERTIFICATES TAB ══════════════
function CertificatesTab({ certificates }: { certificates: Certificate[] }) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-[16px] text-gray-900" style={{ fontWeight: 600 }}>Chứng chỉ của tôi</h2>
        <p className="text-[12px] text-gray-500 mt-0.5">Các chứng chỉ đã đạt được sau khi hoàn thành khóa học</p>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-16">
          <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-[14px] text-gray-500">Chưa có chứng chỉ nào</p>
          <p className="text-[12px] text-gray-400 mt-1">Hoàn thành khóa học để nhận chứng chỉ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
              {/* Certificate preview */}
              <div className="h-40 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100 flex flex-col items-center justify-center p-4 relative">
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] text-gray-500" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}>VWork Pro</span>
                </div>
                <Award className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] mb-1">Chứng nhận hoàn thành</p>
                <p className="text-[14px] text-gray-900 text-center" style={{ fontWeight: 600 }}>{cert.courseTitle}</p>
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
                  <div className="w-16 h-[1px] bg-amber-300" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-gray-500">Giảng viên: {cert.instructor}</span>
                  <span className="text-[11px] text-gray-400">{new Date(cert.issueDate).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">{cert.credentialId}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all" title="Chia sẻ">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all" title="Tải xuống">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════ COURSE DETAIL VIEW ══════════════
function CourseDetailView({ course, onBack, bookmarked, onToggleBookmark, onStartLearning }: {
  course: Course; onBack: () => void; bookmarked: boolean; onToggleBookmark: () => void; onStartLearning: () => void;
}) {
  const [activeSection, setActiveSection] = useState<"overview" | "curriculum" | "discussion" | "resources">("overview");

  // Mock curriculum data
  const modules = [
    { id: "m1", title: "Giới thiệu & Setup", lessons: [
      { id: "l1", title: "Tổng quan khóa học", duration: "10 phút", type: "video" as const, completed: true },
      { id: "l2", title: "Cài đặt môi trường", duration: "15 phút", type: "video" as const, completed: true },
      { id: "l3", title: "Bài tập thực hành #1", duration: "20 phút", type: "exercise" as const, completed: true },
    ]},
    { id: "m2", title: "Kiến thức nền tảng", lessons: [
      { id: "l4", title: "Concepts cốt lõi", duration: "25 phút", type: "video" as const, completed: true },
      { id: "l5", title: "Patterns & Best Practices", duration: "30 phút", type: "video" as const, completed: true },
      { id: "l6", title: "Quiz kiểm tra", duration: "10 phút", type: "quiz" as const, completed: false },
    ]},
    { id: "m3", title: "Nâng cao & Optimization", lessons: [
      { id: "l7", title: "Performance Optimization", duration: "35 phút", type: "video" as const, completed: false },
      { id: "l8", title: "Advanced Patterns", duration: "40 phút", type: "video" as const, completed: false },
      { id: "l9", title: "Project cuối khóa", duration: "2 giờ", type: "project" as const, completed: false },
    ]},
  ];

  const lessonTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <PlayCircle className="w-4 h-4" />;
      case "exercise": return <ListChecks className="w-4 h-4" />;
      case "quiz": return <Brain className="w-4 h-4" />;
      case "project": return <Layers className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Quay lại</span>
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-[12px] text-gray-400">{course.category}</span>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-[12px] text-gray-700 truncate">{course.title}</span>
        <div className="flex-1" />
        <button onClick={onToggleBookmark} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all">
          {bookmarked ? <BookMarked className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4 text-gray-400" />}
        </button>
        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-start gap-6">
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-[56px] shrink-0" style={{ backgroundColor: `${thumbnailColors[course.thumbnail]}15` }}>
                {thumbnailIcons[course.thumbnail]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${levelConfig[course.level].bg} ${levelConfig[course.level].color} border ${levelConfig[course.level].border}`}>
                    {levelConfig[course.level].label}
                  </span>
                  <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{course.category}</span>
                  {course.mandatory && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Bắt buộc</span>}
                </div>
                <h1 className="text-[22px] text-gray-900 mb-1" style={{ fontWeight: 600 }}>{course.title}</h1>
                <p className="text-[14px] text-gray-500 mb-3">{course.description}</p>
                <div className="flex items-center gap-4 text-[13px] text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[8px] text-white">{course.instructorAvatar}</div>
                    {course.instructor}
                  </span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.totalLessons} bài</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.enrolled}</span>
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{course.rating}</span>
                </div>

                {/* Progress */}
                {course.status !== "not_started" && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${course.progress}%` }} />
                    </div>
                    <span className="text-[13px] text-gray-600" style={{ fontWeight: 500 }}>{course.progress}%</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="shrink-0">
                {course.status === "not_started" ? (
                  <button onClick={onStartLearning} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-[14px] hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2" style={{ fontWeight: 500 }}>
                    <Play className="w-5 h-5" /> Bắt đầu học
                  </button>
                ) : course.status === "in_progress" ? (
                  <button onClick={onStartLearning} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-[14px] hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2" style={{ fontWeight: 500 }}>
                    <Play className="w-5 h-5" /> Tiếp tục học
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[14px]" style={{ fontWeight: 500 }}>Đã hoàn thành</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="bg-white border-b border-gray-200 px-8">
          <div className="flex items-center gap-1">
            {[
              { key: "overview" as const, label: "Tổng quan", icon: <Eye className="w-4 h-4" /> },
              { key: "curriculum" as const, label: "Nội dung", icon: <ListChecks className="w-4 h-4" /> },
              { key: "discussion" as const, label: "Thảo luận", icon: <MessageSquare className="w-4 h-4" /> },
              { key: "resources" as const, label: "Tài liệu", icon: <FileText className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] border-b-2 transition-all ${
                  activeSection === tab.key
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Content */}
        <div className="px-8 py-6">
          {activeSection === "overview" && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div>
                  <h3 className="text-[15px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Bạn sẽ học được gì</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["Nắm vững kiến thức nền tảng", "Áp dụng vào dự án thực tế", "Best practices & patterns", "Testing & debugging", "Performance optimization", "Triển khai production"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                        <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[15px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Yêu cầu</h3>
                  <ul className="space-y-1.5 text-[13px] text-gray-600">
                    <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-gray-400" />Kiến thức cơ bản về lập trình</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-gray-400" />Hiểu biết về HTML, CSS, JavaScript</li>
                    <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-gray-400" />Máy tính có cài đặt Node.js</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[15px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Mô tả khóa học</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    Khóa học này được thiết kế cho các developer muốn nâng cao kỹ năng và áp dụng vào các dự án thực tế tại công ty.
                    Bạn sẽ được học từ các chuyên gia hàng đầu, thực hành qua các bài tập và project, và nhận chứng chỉ sau khi hoàn thành.
                  </p>
                </div>
              </div>

              {/* Instructor Card */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-[13px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Giảng viên</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[14px] text-white">{course.instructorAvatar}</div>
                    <div>
                      <p className="text-[14px] text-gray-900" style={{ fontWeight: 500 }}>{course.instructor}</p>
                      <p className="text-[12px] text-gray-500">Senior Engineer</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[12px] text-gray-500">
                    <p className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-amber-400" /> 4.8 đánh giá trung bình</p>
                    <p className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-gray-400" /> 1,200+ học viên</p>
                    <p className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-gray-400" /> 5 khóa học</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-[13px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {course.tags.map(tag => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "curriculum" && (
            <div className="space-y-4">
              {modules.map((mod, mi) => (
                <div key={mod.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-400">Module {mi + 1}</span>
                      <span className="text-[14px] text-gray-900" style={{ fontWeight: 500 }}>{mod.title}</span>
                    </div>
                    <span className="text-[12px] text-gray-500">{mod.lessons.length} bài</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {mod.lessons.map((lesson, li) => (
                      <button key={lesson.id} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all text-left">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          lesson.completed ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                        }`}>
                          {lesson.completed ? <CheckCircle2 className="w-4 h-4" /> : lessonTypeIcon(lesson.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] ${lesson.completed ? "text-gray-500" : "text-gray-900"}`}>{lesson.title}</p>
                          <p className="text-[11px] text-gray-400 capitalize">{lesson.type === "video" ? "Video" : lesson.type === "exercise" ? "Bài tập" : lesson.type === "quiz" ? "Trắc nghiệm" : "Dự án"} • {lesson.duration}</p>
                        </div>
                        {!lesson.completed && (
                          <PlayCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "discussion" && (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-[14px] text-gray-500">Thảo luận về khóa học</p>
              <p className="text-[12px] text-gray-400 mt-1">Đặt câu hỏi và trao đổi với giảng viên và học viên khác</p>
              <button className="mt-4 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-[13px] border border-amber-200 hover:bg-amber-100 transition-all">
                Bắt đầu thảo luận
              </button>
            </div>
          )}

          {activeSection === "resources" && (
            <div className="space-y-3">
              {[
                { name: "Slide bài giảng.pdf", size: "2.4 MB", type: "PDF" },
                { name: "Source code mẫu.zip", size: "15 MB", type: "ZIP" },
                { name: "Tài liệu tham khảo.pdf", size: "1.8 MB", type: "PDF" },
                { name: "Cheat sheet.png", size: "320 KB", type: "Image" },
              ].map((file, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-900" style={{ fontWeight: 500 }}>{file.name}</p>
                    <p className="text-[11px] text-gray-500">{file.type} • {file.size}</p>
                  </div>
                  <button className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
