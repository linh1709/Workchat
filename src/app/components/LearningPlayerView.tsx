import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Clock, ChevronRight, ChevronLeft, CheckCircle2, Video, FileText, Download,
  MessageSquare, Bookmark, Share2, Flag, ListChecks,
  Volume2, VolumeX, Pencil, Presentation, Image, Headphones,
  Pause, PanelRightClose, PanelRightOpen, Fullscreen, Minimize2,
  Monitor, Circle, ChevronDown, Flame, TrendingUp, Zap,
  SkipBack, SkipForward, Brain, Layers, Settings, Subtitles,
  Maximize2, RotateCcw, RotateCw, Sparkles, Camera, Scissors,
  NotebookPen, Captions, ArrowRight
} from "lucide-react";

// ──── Types ────
interface LessonItem {
  id: string;
  title: string;
  duration: string;
  durationSec: number;
  type: "video" | "document" | "audio" | "presentation" | "image" | "quiz" | "exercise" | "project";
  completed: boolean;
  videoUrl?: string;
}
interface ModuleItem {
  id: string;
  title: string;
  lessons: LessonItem[];
}

// Sample video URLs (free/public domain)
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];

// ──── Data ────
const playerModules: ModuleItem[] = [
  { id: "m1", title: "Giới thiệu tổng quan", lessons: [
    { id: "l1", title: "Giới thiệu khóa học & Mục tiêu", duration: "12:33", durationSec: 753, type: "video", completed: true, videoUrl: SAMPLE_VIDEOS[0] },
    { id: "l2", title: "Sổ tay Khung Năng lực Gelexinco", duration: "11 phút đọc", durationSec: 660, type: "document", completed: true },
    { id: "l3", title: "Podcast — CEO chia sẻ tầm nhìn", duration: "18:45", durationSec: 1125, type: "audio", completed: true },
  ]},
  { id: "m2", title: "Năng lực Lãnh đạo Chiến lược", lessons: [
    { id: "l4", title: "Mô hình Lãnh đạo 5 cấp độ", duration: "24 slides", durationSec: 1440, type: "presentation", completed: true },
    { id: "l5", title: "Case Study — Ra quyết định tại ABBank", duration: "25:30", durationSec: 1530, type: "video", completed: false, videoUrl: SAMPLE_VIDEOS[1] },
    { id: "l6", title: "Infographic — Quy trình Ra quyết định", duration: "5 phút", durationSec: 300, type: "image", completed: false },
    { id: "l7", title: "Phân tích SWOT — Mẫu dự án BĐS", duration: "10 phút đọc", durationSec: 600, type: "document", completed: false },
  ]},
  { id: "m3", title: "Kỹ năng Quản lý Thực chiến", lessons: [
    { id: "l8", title: "Quản lý hiệu suất đội nhóm", duration: "32:15", durationSec: 1935, type: "video", completed: false, videoUrl: SAMPLE_VIDEOS[2] },
    { id: "l9", title: "Phỏng vấn Giám đốc Xi măng Thăng Long", duration: "22:30", durationSec: 1350, type: "audio", completed: false },
    { id: "l10", title: "Bộ KPIs cho Quản lý cấp trung", duration: "15 phút đọc", durationSec: 900, type: "document", completed: false },
    { id: "l11", title: "Workshop — Giải quyết xung đột", duration: "28:00", durationSec: 1680, type: "video", completed: false, videoUrl: SAMPLE_VIDEOS[3] },
    { id: "l12", title: "Mô hình OKR thực tiễn", duration: "18 slides", durationSec: 1080, type: "presentation", completed: false },
  ]},
];

const lessonTypeConfig: Record<string, { label: string; color: string; bg: string; dotColor: string; icon: React.ReactNode }> = {
  video: { label: "Video", color: "text-red-600", bg: "bg-red-100", dotColor: "bg-red-500", icon: <Video className="w-3.5 h-3.5" /> },
  document: { label: "Tài liệu", color: "text-blue-600", bg: "bg-blue-100", dotColor: "bg-blue-500", icon: <FileText className="w-3.5 h-3.5" /> },
  audio: { label: "Audio", color: "text-purple-600", bg: "bg-purple-100", dotColor: "bg-purple-500", icon: <Headphones className="w-3.5 h-3.5" /> },
  presentation: { label: "Thuyết trình", color: "text-orange-600", bg: "bg-orange-100", dotColor: "bg-orange-500", icon: <Presentation className="w-3.5 h-3.5" /> },
  image: { label: "Hình ảnh", color: "text-emerald-600", bg: "bg-emerald-100", dotColor: "bg-emerald-500", icon: <Image className="w-3.5 h-3.5" /> },
  quiz: { label: "Quiz", color: "text-cyan-600", bg: "bg-cyan-100", dotColor: "bg-cyan-500", icon: <Brain className="w-3.5 h-3.5" /> },
  exercise: { label: "Bài tập", color: "text-amber-600", bg: "bg-amber-100", dotColor: "bg-amber-500", icon: <ListChecks className="w-3.5 h-3.5" /> },
  project: { label: "Project", color: "text-indigo-600", bg: "bg-indigo-100", dotColor: "bg-indigo-500", icon: <Layers className="w-3.5 h-3.5" /> },
};

interface LearningPlayerProps {
  courseTitle: string;
  onBack: () => void;
}

export function LearningPlayerView({ courseTitle, onBack }: LearningPlayerProps) {
  // ── Sidebar state ──
  const [sidebarTab, setSidebarTab] = useState<"content" | "stats">("content");
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ m1: true, m2: true, m3: true });
  const [completedLessons, setCompletedLessons] = useState<string[]>(
    playerModules.flatMap(m => m.lessons.filter(l => l.completed).map(l => l.id))
  );
  const [selectedLesson, setSelectedLesson] = useState<LessonItem>(playerModules[1].lessons[1]);
  const [autoPlay, setAutoPlay] = useState(true);

  // ── Non-video content state ──
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35);
  const [slideIndex, setSlideIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);

  // ── Video player state ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const isVideoLesson = selectedLesson.type === "video" && selectedLesson.videoUrl;

  // ── Video event handlers ──
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [isSeeking]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoLoaded(true);
      setVideoError(false);
    }
  }, []);

  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    if (!completedLessons.includes(selectedLesson.id)) {
      setCompletedLessons(prev => [...prev, selectedLesson.id]);
    }
    // Auto-play next
    if (autoPlay) {
      const allLessons = playerModules.flatMap(m => m.lessons);
      const idx = allLessons.findIndex(l => l.id === selectedLesson.id);
      if (idx >= 0 && idx < allLessons.length - 1) {
        const next = allLessons[idx + 1];
        if (next.type === "video" && next.videoUrl) {
          setTimeout(() => selectLesson(next), 1500);
        }
      }
    }
  }, [selectedLesson, autoPlay, completedLessons]);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
    setVideoLoaded(false);
  }, []);

  // ── Video controls ──
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (!videoRef.current) return;
    const t = Math.max(0, Math.min(time, duration));
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  }, [duration]);

  const skip = useCallback((delta: number) => {
    if (!videoRef.current) return;
    seek(videoRef.current.currentTime + delta);
  }, [seek]);

  const changeVolume = useCallback((v: number) => {
    if (!videoRef.current) return;
    const vol = Math.max(0, Math.min(1, v));
    videoRef.current.volume = vol;
    setVolume(vol);
    if (vol === 0) setIsMuted(true);
    else setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Progress bar interaction ──
  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  }, [duration, seek]);

  const handleProgressBarHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pct * duration);
    setHoverX(e.clientX - rect.left);
  }, [duration]);

  // ── Volume bar interaction ──
  const handleVolumeBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    changeVolume(pct);
  }, [changeVolume]);

  // ── Show/hide controls on hover ──
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      resetControlsTimeout();
    }
  }, [isPlaying]);

  // ── Switch lesson: load new video ──
  const selectLesson = useCallback((lesson: LessonItem) => {
    setSelectedLesson(lesson);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setIsPlaying(false);
    setVideoLoaded(false);
    setVideoError(false);
    setShowControls(true);
  }, []);

  useEffect(() => {
    if (videoRef.current && isVideoLesson) {
      videoRef.current.load();
    }
  }, [selectedLesson.id]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          if (!e.metaKey && !e.altKey) { e.preventDefault(); skip(10); }
          break;
        case "ArrowLeft":
          if (!e.metaKey && !e.altKey) { e.preventDefault(); skip(-10); }
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(volume + 0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(volume - 0.05);
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyF":
          toggleFullscreen();
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePlay, skip, changeVolume, toggleMute, toggleFullscreen, volume]);

  // ── Helper ──
  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalCompleted = completedLessons.length;
  const totalLessons = playerModules.reduce((s, m) => s + m.lessons.length, 0);
  const progressPercent = Math.round((totalCompleted / totalLessons) * 100);

  const toggleModule = (id: string) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

  const markComplete = () => {
    if (!completedLessons.includes(selectedLesson.id)) {
      setCompletedLessons(prev => [...prev, selectedLesson.id]);
    }
  };

  // ── Prev/Next lesson helpers ──
  const allLessons = playerModules.flatMap(m => m.lessons);
  const currentIdx = allLessons.findIndex(l => l.id === selectedLesson.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const remainingTime = duration > 0 ? Math.max(0, duration - currentTime) : selectedLesson.durationSec;
  const remainingMin = Math.ceil(remainingTime / 60);

  // ── Slide data for presentation ──
  const slideData = [
    { title: "Mở đầu — Tầm nhìn lãnh đạo", bullets: ["Định nghĩa lãnh đạo chiến lược", "5 phẩm chất cốt lõi", "Mô hình Gelexinco 2025"] },
    { title: "Cấp 1 — Năng lực Cá nhân", bullets: ["Tự nhận thức & EQ", "Quản lý thời gian", "Ra quyết định dựa trên dữ liệu"] },
    { title: "Cấp 2 — Quản lý Đội nhóm", bullets: ["Xây dựng văn hoá tin cậy", "Delegation hiệu quả", "1:1 coaching framework"] },
    { title: "Cấp 3 — Lãnh đạo Tổ chức", bullets: ["Alignment OKR", "Cross-functional collaboration", "Change management"] },
    { title: "Cấp 4 — Chiến lược Doanh nghiệp", bullets: ["SWOT & PESTEL", "Blue Ocean Strategy", "M&A integration playbook"] },
    { title: "Cấp 5 — Ảnh hưởng Hệ sinh thái", bullets: ["Thought leadership", "Industry partnerships", "ESG & bền vững"] },
  ];
  const totalSlides = slideData.length;

  // ── Waveform data for audio ──
  const waveformBars = Array.from({ length: 60 }, () => 15 + Math.random() * 85);

  // ── Document paragraphs ──
  const docSections = [
    { heading: "1. Giới thiệu", text: "Sổ tay Khung Năng lực Gelexinco được xây dựng nhằm hệ thống hoá tiêu chuẩn năng lực cho toàn bộ cán bộ quản lý cấp trung trở lên. Tài liệu này là kết quả của quá trình nghiên cứu 18 tháng, khảo sát hơn 200 lãnh đạo trong hệ thống." },
    { heading: "2. Khung Năng lực 5 cấp độ", text: "Mô hình chia thành 5 cấp: (1) Năng lực cá nhân, (2) Quản lý đội nhóm, (3) Lãnh đạo tổ chức, (4) Chiến lược doanh nghiệp, (5) Ảnh hưởng hệ sinh thái. Mỗi cấp bao gồm 3–5 tiêu chí đánh giá kèm rubric 4 mức." },
    { heading: "3. Phương pháp đánh giá", text: "Áp dụng đánh giá 360° kết hợp tự đánh giá, đánh giá của cấp trên, đồng nghiệp và cấp dưới. Kết quả được tổng hợp bằng hệ thống VWork Pro với dashboard trực quan theo thời gian thực." },
    { heading: "4. Lộ trình phát triển", text: "Dựa trên kết quả đánh giá, hệ thống tự động đề xuất lộ trình phát triển cá nhân hoá bao gồm: khoá đào tạo nội bộ, mentoring 1:1, dự án thực chiến, và chương trình rotation liên công ty trong hệ sinh thái Gelexinco." },
    { heading: "5. Kết luận", text: "Khung năng lực là công cụ sống, cần được cập nhật hàng năm theo chiến lược kinh doanh. Ban Nhân sự phối hợp với lãnh đạo cấp cao review và điều chỉnh các tiêu chí phù hợp với bối cảnh thị trường." },
  ];

  // ── Content area renderer for non-video ──
  const renderContentArea = () => {
    const type = selectedLesson.type;
    const cfg = lessonTypeConfig[type];

    // ── DOCUMENT ──
    if (type === "document") {
      return (
        <div className="bg-gradient-to-b from-gray-50 to-white">
          {/* Document header */}
          <div className="bg-white border-b border-gray-200 px-8 py-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px]" style={{ fontWeight: 500 }}>PDF</span>
              <span className="text-[12px] text-gray-400">{selectedLesson.duration}</span>
              <span className="text-[12px] text-gray-400">•</span>
              <span className="text-[12px] text-gray-400">5 phần</span>
            </div>
            <h2 className="text-[18px] text-gray-900 mb-1" style={{ fontWeight: 600 }}>{selectedLesson.title}</h2>
            <p className="text-[13px] text-gray-500">Tài liệu nội bộ — Gelexinco Group</p>
          </div>
          {/* Document body */}
          <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
            {docSections.map((sec, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-[15px] text-gray-900 mb-3" style={{ fontWeight: 600 }}>{sec.heading}</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">{sec.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── AUDIO ──
    if (type === "audio") {
      return (
        <div className="bg-gradient-to-b from-purple-950 via-gray-900 to-gray-900 aspect-video flex flex-col items-center justify-center relative overflow-hidden shrink-0">
          {/* Decorative circles */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/[0.06] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-violet-500/[0.05] rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-xl px-8 flex flex-col items-center">
            {/* Album art / icon */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20">
              <Headphones className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-white/90 text-[16px] mb-1 text-center" style={{ fontWeight: 600 }}>{selectedLesson.title}</h3>
            <p className="text-white/40 text-[12px] mb-6">Gelexinco Internal Podcast</p>

            {/* Waveform */}
            <div className="w-full flex items-end justify-center gap-[2px] h-16 mb-4">
              {waveformBars.map((h, i) => {
                const isPlayed = i / waveformBars.length * 100 < audioProgress;
                return (
                  <div key={i} className={`w-[3px] rounded-full transition-all cursor-pointer hover:opacity-80 ${isPlayed ? "bg-purple-400" : "bg-white/15"}`}
                    style={{ height: `${h}%` }}
                    onClick={() => setAudioProgress(Math.round(i / waveformBars.length * 100))}
                  />
                );
              })}
            </div>

            {/* Time */}
            <div className="flex items-center justify-between w-full text-[11px] text-white/40 tabular-nums mb-4">
              <span>{formatTime(selectedLesson.durationSec * audioProgress / 100)}</span>
              <span>{selectedLesson.duration}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button onClick={() => setAudioProgress(Math.max(0, audioProgress - 5))} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={() => setAudioPlaying(!audioPlaying)} className="w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105">
                {audioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button onClick={() => setAudioProgress(Math.min(100, audioProgress + 5))} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-2 mt-4">
              {[0.75, 1, 1.25, 1.5, 2].map(s => (
                <button key={s} className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${s === 1 ? "bg-purple-500/30 text-purple-300" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── PRESENTATION ──
    if (type === "presentation") {
      const slide = slideData[slideIndex] || slideData[0];
      return (
        <div className="bg-gray-900 aspect-video flex flex-col relative shrink-0">
          {/* Slide area */}
          <div className="flex-1 flex items-center justify-center px-12 py-8">
            <div className="w-full max-w-2xl bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-10 shadow-2xl shadow-orange-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
              <div className="relative z-10">
                <p className="text-white/50 text-[11px] mb-3 uppercase tracking-wider">Slide {slideIndex + 1} / {totalSlides}</p>
                <h2 className="text-white text-[22px] mb-5" style={{ fontWeight: 700 }}>{slide.title}</h2>
                <ul className="space-y-3">
                  {slide.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/90 text-[14px]">
                      <div className="w-2 h-2 rounded-full bg-white/50 mt-1.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Slide nav */}
          <div className="shrink-0 flex items-center justify-center gap-4 pb-4">
            <button onClick={() => setSlideIndex(Math.max(0, slideIndex - 1))} disabled={slideIndex === 0}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {slideData.map((_, i) => (
                <button key={i} onClick={() => setSlideIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === slideIndex ? "bg-orange-400 w-5" : "bg-white/20 hover:bg-white/40"}`} />
              ))}
            </div>
            <button onClick={() => setSlideIndex(Math.min(totalSlides - 1, slideIndex + 1))} disabled={slideIndex === totalSlides - 1}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    // ── IMAGE ──
    if (type === "image") {
      return (
        <div className="bg-gray-100 aspect-video flex flex-col items-center justify-center relative shrink-0 overflow-hidden">
          {/* Mock infographic */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-lg" style={{ transform: `scale(${imageZoom})`, transition: "transform 0.2s" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[14px] text-gray-900" style={{ fontWeight: 600 }}>Quy trình Ra quyết định</h3>
                <p className="text-[11px] text-gray-400">Infographic — ABBank Case Study</p>
              </div>
            </div>
            <div className="space-y-3">
              {["Thu thập dữ liệu", "Phân tích SWOT", "Brainstorm giải pháp", "Đánh giá rủi ro", "Ra quyết định", "Triển khai & đo lường"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[12px]" style={{ fontWeight: 600 }}>{i + 1}</div>
                  <div className="flex-1 h-8 bg-emerald-50 rounded-lg flex items-center px-3 text-[12px] text-emerald-800" style={{ fontWeight: 500 }}>{step}</div>
                  {i < 5 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-lg shadow border border-gray-200 p-1">
            <button onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.1))} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 text-[14px]">−</button>
            <span className="text-[11px] text-gray-500 w-10 text-center tabular-nums">{Math.round(imageZoom * 100)}%</span>
            <button onClick={() => setImageZoom(Math.min(2, imageZoom + 0.1))} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 text-[14px]">+</button>
          </div>
        </div>
      );
    }

    // ── FALLBACK (quiz, exercise, project) ──
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-8 py-12 flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-2xl ${cfg.bg} flex items-center justify-center mb-5`}>
            <span className={cfg.color}>{type === "quiz" ? <Brain className="w-9 h-9" /> : type === "exercise" ? <ListChecks className="w-9 h-9" /> : <Layers className="w-9 h-9" />}</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.bg} mb-4`}>
            <span className={cfg.color}>{cfg.icon}</span>
            <span className={`text-[11px] ${cfg.color}`} style={{ fontWeight: 500 }}>{cfg.label}</span>
          </div>
          <h2 className="text-[18px] text-gray-900 mb-2" style={{ fontWeight: 600 }}>{selectedLesson.title}</h2>
          <p className="text-[13px] text-gray-500 mb-6">{selectedLesson.duration}</p>
          <button className={`px-6 py-3 rounded-xl text-[14px] text-white flex items-center gap-2 transition-all hover:scale-105 ${cfg.bg.replace("bg-", "bg-")} shadow-lg`}
            style={{ fontWeight: 500, background: type === "quiz" ? "linear-gradient(135deg, #06b6d4, #0891b2)" : type === "exercise" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <Play className="w-5 h-5" /> Bắt đầu {cfg.label.toLowerCase()}
          </button>
        </div>
      </div>
    );
  };

  // ── Shared below-content renderer ──
  const renderBelowContent = () => {
    const type = selectedLesson.type;
    const cfg = lessonTypeConfig[type];
    const estMin = Math.ceil(selectedLesson.durationSec / 60);
    const descMap: Record<string, string> = {
      document: "Tài liệu nội bộ hệ thống hoá tiêu chuẩn năng lực cho cán bộ quản lý.",
      audio: "Podcast nội bộ phỏng vấn lãnh đạo cấp cao chia sẻ kinh nghiệm thực tiễn.",
      presentation: "Bài thuyết trình tổng hợp mô hình lãnh đạo 5 cấp độ theo chuẩn Gelexinco.",
      image: "Infographic minh hoạ quy trình ra quyết định chiến lược.",
      video: "Phân tích case study thực tế về quy trình ra quyết định chiến lược tại ABBank.",
      quiz: "Kiểm tra kiến thức qua bộ câu hỏi trắc nghiệm.",
      exercise: "Bài tập thực hành áp dụng kiến thức đã học.",
      project: "Dự án thực chiến kết hợp nhiều kỹ năng.",
    };
    return (
      <div className="bg-white">
        {/* Lesson Info */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color} text-[11px]`} style={{ fontWeight: 500 }}>{cfg.label}</span>
                <span className="text-[12px] text-gray-500 tabular-nums">{selectedLesson.duration}</span>
                <span className="text-[12px] text-gray-400">•</span>
                <span className="flex items-center gap-1 text-[12px] text-gray-500"><Clock className="w-3 h-3" />~{estMin} phút</span>
              </div>
              <h3 className="text-[17px] text-gray-900 mb-1" style={{ fontWeight: 600 }}>{cfg.label}: {selectedLesson.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{descMap[type] || ""}</p>
            </div>
            <div className="flex items-center gap-1 ml-4 shrink-0">
              {[{ ic: <Share2 className="w-4 h-4" />, t: "Chia sẻ" }, { ic: <Flag className="w-4 h-4" />, t: "Báo lỗi" }, { ic: <Download className="w-4 h-4" />, t: "Tải xuống" }].map((b, i) => (
                <button key={i} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all" title={b.t}>{b.ic}</button>
              ))}
            </div>
          </div>
        </div>
        {/* AI Summary */}
        <div className="px-6 py-4 border-b border-gray-100">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 hover:from-violet-100 hover:to-purple-100 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-500/20"><Sparkles className="w-4 h-4 text-white" /></div>
              <div className="text-left">
                <p className="text-[13px] text-violet-900" style={{ fontWeight: 500 }}>AI Tóm tắt thông minh</p>
                <p className="text-[11px] text-violet-500">Nhấn để tạo</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-violet-400 group-hover:text-violet-600 transition-colors" />
          </button>
        </div>
        {/* Prev / Next */}
        <div className="px-6 py-4 flex items-center gap-3">
          {prevLesson ? (
            <button onClick={() => selectLesson(prevLesson)} className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-left group min-w-0">
              <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Bài trước</p>
                <p className="text-[12px] text-gray-700 truncate" style={{ fontWeight: 500 }}>{lessonTypeConfig[prevLesson.type]?.label}: {prevLesson.title}</p>
              </div>
            </button>
          ) : <div className="flex-1" />}
          <button onClick={markComplete} className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] transition-all border ${completedLessons.includes(selectedLesson.id) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`} style={{ fontWeight: 500 }}>
            <CheckCircle2 className="w-4 h-4" />{completedLessons.includes(selectedLesson.id) ? "Đã học xong" : "Chưa học xong"}
          </button>
          {nextLesson ? (
            <button onClick={() => selectLesson(nextLesson)} className="flex-1 flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-right group min-w-0">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Bài tiếp</p>
                <p className="text-[12px] text-gray-700 truncate" style={{ fontWeight: 500 }}>{lessonTypeConfig[nextLesson.type]?.label}: {nextLesson.title}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors" />
            </button>
          ) : <div className="flex-1" />}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* ══════════ TOP BAR ══════════ */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 transition-all shrink-0 pr-2 border-r border-gray-200 mr-1">
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>
        <span className="text-[12px] text-gray-400 truncate max-w-[180px]">{courseTitle}</span>
        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`w-2 h-2 rounded-full shrink-0 ${lessonTypeConfig[selectedLesson.type]?.dotColor}`} />
          <span className="text-[13px] text-gray-800 truncate" style={{ fontWeight: 500 }}>{selectedLesson.title}</span>
        </div>

        {/* Course progress */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[12px] text-gray-500 tabular-nums">{progressPercent}%</span>
          <button onClick={() => setAutoPlay(!autoPlay)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all border ${autoPlay ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
            <Zap className="w-3 h-3" /> Auto
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1 border-l border-gray-200 pl-2">
          {[
            { icon: <Pencil className="w-3.5 h-3.5" />, tip: "Ghi chú" },
            { icon: <Bookmark className="w-3.5 h-3.5" />, tip: "Đánh dấu" },
            { icon: <Share2 className="w-3.5 h-3.5" />, tip: "Chia sẻ" },
            { icon: <Download className="w-3.5 h-3.5" />, tip: "Tải xuống" },
          ].map((btn, i) => (
            <button key={i} title={btn.tip} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
              {btn.icon}
            </button>
          ))}
        </div>

        <button onClick={() => setShowSidebar(!showSidebar)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all ml-0.5" title={showSidebar ? "Ẩn sidebar" : "Hiện sidebar"}>
          {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── PLAYER AREA ── */}
        <div className="flex-1 overflow-y-auto min-w-0" ref={playerContainerRef}>
          {isVideoLesson ? (
            <>
              {/* Video container — fixed 16:9 ratio */}
              <div
                className="relative bg-black overflow-hidden cursor-pointer group aspect-video shrink-0"
                onMouseMove={resetControlsTimeout}
                onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
                onClick={(e) => {
                  // Don't toggle on controls click
                  if ((e.target as HTMLElement).closest("[data-controls]")) return;
                  togglePlay();
                }}
              >
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onProgress={handleProgress}
                  onEnded={handleVideoEnd}
                  onError={handleVideoError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="metadata"
                  playsInline
                >
                  <source src={selectedLesson.videoUrl} type="video/mp4" />
                </video>

                {/* Loading spinner */}
                {!videoLoaded && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {/* Error state */}
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                    <Video className="w-12 h-12 text-white/30 mb-3" />
                    <p className="text-white/60 text-[14px] mb-1">Không thể tải video</p>
                    <p className="text-white/40 text-[12px] mb-4">Vui lòng kiểm tra kết nối mạng</p>
                    <button onClick={() => { setVideoError(false); videoRef.current?.load(); }}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-[13px] hover:bg-white/20 transition-all flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> Thử lại
                    </button>
                  </div>
                )}

                {/* Big center play button (when paused) */}
                {!isPlaying && videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-[72px] h-[72px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-2xl">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Skip indicators (visual feedback) */}
                {/* Branding watermark */}
                <div className="absolute top-3 right-4 text-[11px] text-white/15 tracking-[0.15em] pointer-events-none select-none" style={{ fontWeight: 500 }}>
                  VWork Pro LMS
                </div>

                {/* ── Controls overlay ── */}
                <div
                  data-controls
                  className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Gradient backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  <div className="relative z-10 px-4 pb-3 pt-12">
                    {/* ── Progress bar ── */}
                    <div
                      ref={progressBarRef}
                      className="relative h-5 flex items-center cursor-pointer group/progress mb-1"
                      onClick={handleProgressBarClick}
                      onMouseMove={handleProgressBarHover}
                      onMouseLeave={() => setHoverTime(null)}
                    >
                      <div className="absolute inset-x-0 h-[4px] bg-white/20 rounded-full top-1/2 -translate-y-1/2 group-hover/progress:h-[6px] transition-all">
                        {/* Buffered */}
                        <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full" style={{ width: duration ? `${(buffered / duration) * 100}%` : "0%" }} />
                        {/* Played */}
                        <div className="h-full bg-red-500 rounded-full relative" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}>
                          {/* Scrubber dot */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-red-500 shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity border-2 border-white" />
                        </div>
                      </div>
                      {/* Hover tooltip */}
                      {hoverTime !== null && (
                        <div className="absolute bottom-6 -translate-x-1/2 bg-black/90 text-white text-[11px] px-2 py-1 rounded pointer-events-none"
                          style={{ left: hoverX }}>
                          {formatTime(hoverTime)}
                        </div>
                      )}
                    </div>

                    {/* ── Control buttons ── */}
                    <div className="flex items-center gap-1">
                      {/* Play/pause */}
                      <button onClick={togglePlay} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition-all">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>

                      {/* Skip backward */}
                      <button onClick={() => skip(-10)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all" title="-10s">
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Skip forward */}
                      <button onClick={() => skip(10)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all" title="+10s">
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {/* Volume */}
                      <div className="flex items-center gap-1 ml-1 group/vol">
                        <button onClick={toggleMute} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all">
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <div
                          ref={volumeBarRef}
                          className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200 cursor-pointer"
                          onClick={handleVolumeBarClick}
                        >
                          <div className="w-20 h-1 bg-white/20 rounded-full relative">
                            <div className="h-full bg-white rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%` }}>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time display */}
                      <span className="text-[12px] text-white/70 ml-2 tabular-nums select-none">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>

                      <div className="flex-1" />

                      {/* Complete button */}
                      <button onClick={markComplete} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all mr-1 ${completedLessons.includes(selectedLesson.id) ? "bg-emerald-500/30 text-emerald-300" : "hover:bg-white/10 text-white/60 hover:text-white"}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{completedLessons.includes(selectedLesson.id) ? "Đã xong" : "Hoàn thành"}</span>
                      </button>

                      {/* Subtitles */}
                      <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Phụ đề">
                        <Subtitles className="w-4 h-4" />
                      </button>

                      {/* Settings / Speed */}
                      <div className="relative">
                        <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="h-8 px-2 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all text-[12px]" style={{ fontWeight: 500 }}>
                          {playbackSpeed !== 1 ? `${playbackSpeed}x` : <Settings className="w-4 h-4" />}
                        </button>
                        {showSpeedMenu && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSpeedMenu(false)} />
                            <div className="absolute bottom-10 right-0 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl py-2 z-20 w-36">
                              <p className="px-3 py-1 text-[11px] text-white/40 uppercase tracking-wider">Tốc độ phát</p>
                              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                                <button key={speed} onClick={() => changeSpeed(speed)}
                                  className={`w-full px-3 py-2 text-[13px] text-left hover:bg-white/10 transition-all flex items-center justify-between ${playbackSpeed === speed ? "text-red-400" : "text-white/80"}`}>
                                  <span>{speed === 1 ? "Bình thường" : `${speed}x`}</span>
                                  {playbackSpeed === speed && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* PiP */}
                      <button onClick={() => { if (videoRef.current) { if (document.pictureInPictureElement) document.exitPictureInPicture(); else videoRef.current.requestPictureInPicture?.().catch(() => {}); }}}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title="Picture in Picture">
                        <Monitor className="w-4 h-4" />
                      </button>

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all" title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keyboard hint (shows briefly) */}
                <div className={`absolute top-3 left-4 flex items-center gap-3 text-[10px] text-white/30 pointer-events-none transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
                  <span>Space: Phát/Dừng</span>
                  <span>← → ±10s</span>
                  <span>↑↓ Âm lượng</span>
                  <span>M: Tắt tiếng</span>
                  <span>F: Toàn màn hình</span>
                </div>
              </div>

              {renderBelowContent()}
            </>
          ) : (
            <>
              {renderContentArea()}
              {renderBelowContent()}
            </>
          )}
        </div>

        {/* ══════════ RIGHT SIDEBAR ══════════ */}
        {showSidebar && (
          <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0">
              {(["content", "stats"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2.5 text-[13px] border-b-2 transition-all ${
                    sidebarTab === tab ? "border-amber-500 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontWeight: sidebarTab === tab ? 500 : 400 }}
                >
                  {tab === "content" ? "Nội dung" : "Thống kê"}
                </button>
              ))}
            </div>

            {/* Course progress */}
            <div className="px-4 pt-3 pb-1 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">Tiến độ khóa học</span>
                <span className="text-[11px] text-gray-500 tabular-nums">{totalCompleted}/{totalLessons} bài</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {sidebarTab === "content" ? (
              <div className="flex-1 overflow-y-auto">
                {playerModules.map((mod, mi) => {
                  const modDone = mod.lessons.filter(l => completedLessons.includes(l.id)).length;
                  const allDone = modDone === mod.lessons.length;
                  return (
                    <div key={mod.id} className="border-b border-gray-100 last:border-b-0">
                      <button onClick={() => toggleModule(mod.id)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-all text-left">
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${expandedModules[mod.id] ? "" : "-rotate-90"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-gray-900 leading-snug" style={{ fontWeight: 500 }}>
                            Module {mi + 1}: {mod.title}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {mod.lessons.length} bài • {allDone ? "✓ Hoàn thành" : `${modDone}/${mod.lessons.length} đã xong`}
                          </p>
                        </div>
                        {allDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                      {expandedModules[mod.id] && (
                        <div className="pb-1">
                          {mod.lessons.map(lesson => {
                            const isActive = selectedLesson.id === lesson.id;
                            const isDone = completedLessons.includes(lesson.id);
                            const cfg = lessonTypeConfig[lesson.type];
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => selectLesson(lesson)}
                                className={`w-full flex items-start gap-2.5 pl-6 pr-4 py-2.5 text-left transition-all ${
                                  isActive ? "bg-amber-50 border-l-[3px] border-amber-500" : "hover:bg-gray-50 border-l-[3px] border-transparent"
                                }`}
                              >
                                {/* Status indicator */}
                                <div className="mt-0.5 shrink-0">
                                  {isDone ? (
                                    <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />
                                  ) : isActive ? (
                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-amber-500 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    </div>
                                  ) : (
                                    <Circle className="w-[18px] h-[18px] text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[12px] leading-snug ${isActive ? "text-amber-900" : isDone ? "text-gray-400 line-through" : "text-gray-700"}`}
                                    style={{ fontWeight: isActive ? 500 : 400 }}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={cfg.color}>{cfg.icon}</span>
                                    <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                                    <span className="text-[10px] text-gray-400">• {lesson.duration}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Content type legend */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Loại nội dung</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {Object.entries(lessonTypeConfig).slice(0, 6).map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-1.5 text-[11px]">
                        <span className={cfg.color}>{cfg.icon}</span>
                        <span className="text-gray-600">{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Stats Tab ── */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Hoàn thành", value: `${totalCompleted}/${totalLessons}`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-50" },
                    { label: "Tiến độ", value: `${progressPercent}%`, icon: <TrendingUp className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50" },
                    { label: "Thời gian học", value: "2h 45m", icon: <Clock className="w-4 h-4 text-amber-500" />, bg: "bg-amber-50" },
                    { label: "Streak", value: "5 ngày", icon: <Flame className="w-4 h-4 text-red-500" />, bg: "bg-red-50" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>{stat.icon}</div>
                      <p className="text-[16px] text-gray-900" style={{ fontWeight: 600 }}>{stat.value}</p>
                      <p className="text-[11px] text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[12px] text-gray-500 mb-2" style={{ fontWeight: 500 }}>Theo loại nội dung</p>
                  <div className="space-y-2">
                    {[
                      { type: "video", count: 4, done: 1 },
                      { type: "document", count: 3, done: 1 },
                      { type: "audio", count: 2, done: 1 },
                      { type: "presentation", count: 2, done: 1 },
                      { type: "image", count: 1, done: 0 },
                    ].map((item, i) => {
                      const cfg = lessonTypeConfig[item.type];
                      const pct = Math.round((item.done / item.count) * 100);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`${cfg.color} shrink-0`}>{cfg.icon}</span>
                          <span className="text-[12px] text-gray-600 w-20">{cfg.label}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.bg}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] text-gray-400 w-8 text-right">{item.done}/{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[12px] text-gray-500 mb-2" style={{ fontWeight: 500 }}>Hoạt động gần đây</p>
                  <div className="space-y-2">
                    {[
                      { lesson: "Podcast — CEO chia sẻ tầm nhìn", time: "15 phút trước" },
                      { lesson: "Sổ tay Khung Năng lực", time: "1 giờ trước" },
                      { lesson: "Case Study — Ra quyết định", time: "2 giờ trước" },
                    ].map((act, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-700 truncate">{act.lesson}</p>
                          <p className="text-[10px] text-gray-400">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}