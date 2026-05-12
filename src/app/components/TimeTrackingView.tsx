import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Clock, Play, Pause, Square, X, Plus, Search, Filter, Download,
  MoreHorizontal, Edit3, Trash2, Copy, Calendar, ChevronDown,
  ChevronLeft, ChevronRight, BarChart3, PieChart, TrendingUp,
  Target, Users, Tag, FolderOpen, Zap, Timer, StopCircle,
  ArrowUp, ArrowDown, Check, AlertCircle, Coffee
} from "lucide-react";

interface TimeEntry {
  id: string;
  task: string;
  project: string;
  projectColor: string;
  minutes: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  tags: string[];
  billable: boolean;
  note?: string;
}

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const initialEntries: TimeEntry[] = [
  { id: "te1", task: "Thiết kế trang chủ mới", project: "Website Redesign", projectColor: "#0891b2", minutes: 225, date: today, startTime: "08:30", endTime: "12:15", tags: ["design", "ui"], billable: true },
  { id: "te2", task: "Implement authentication system", project: "Website Redesign", projectColor: "#0891b2", minutes: 320, date: today, startTime: "13:00", endTime: "18:20", tags: ["backend", "auth"], billable: true },
  { id: "te3", task: "Code review PR #142", project: "Website Redesign", projectColor: "#0891b2", minutes: 45, date: today, startTime: "18:30", endTime: "19:15", tags: ["review"], billable: false },
  { id: "te4", task: "API rate limiting", project: "API Development", projectColor: "#059669", minutes: 130, date: yesterday, startTime: "09:00", endTime: "11:10", tags: ["backend", "api"], billable: true },
  { id: "te5", task: "Database schema optimization", project: "API Development", projectColor: "#059669", minutes: 180, date: yesterday, startTime: "13:00", endTime: "16:00", tags: ["database"], billable: true },
  { id: "te6", task: "SEO optimization research", project: "Social Campaign", projectColor: "#d97706", minutes: 90, date: yesterday, startTime: "16:30", endTime: "18:00", tags: ["research"], billable: false },
  { id: "te7", task: "Design system documentation", project: "Brand Guidelines", projectColor: "#db2777", minutes: 240, date: "2026-03-15", startTime: "09:00", endTime: "13:00", tags: ["docs", "design"], billable: true },
  { id: "te8", task: "Mobile responsive fixes", project: "Website Redesign", projectColor: "#0891b2", minutes: 150, date: "2026-03-14", startTime: "10:00", endTime: "12:30", tags: ["frontend", "mobile"], billable: true },
  { id: "te9", task: "Unit tests for auth module", project: "Website Redesign", projectColor: "#0891b2", minutes: 195, date: "2026-03-13", startTime: "08:00", endTime: "11:15", tags: ["testing"], billable: true },
  { id: "te10", task: "Sprint planning meeting", project: "Website Redesign", projectColor: "#0891b2", minutes: 60, date: "2026-03-12", startTime: "09:00", endTime: "10:00", tags: ["meeting"], billable: false },
  { id: "te11", task: "Figma prototype review", project: "Brand Guidelines", projectColor: "#db2777", minutes: 90, date: "2026-03-12", startTime: "14:00", endTime: "15:30", tags: ["design", "review"], billable: true },
  { id: "te12", task: "Bug fix: login redirect", project: "API Development", projectColor: "#059669", minutes: 45, date: "2026-03-11", startTime: "16:00", endTime: "16:45", tags: ["bugfix"], billable: true },
];

const projectOptions = [
  { name: "Website Redesign", color: "#0891b2" },
  { name: "API Development", color: "#059669" },
  { name: "Social Campaign", color: "#d97706" },
  { name: "Brand Guidelines", color: "#db2777" },
  { name: "Mobile App", color: "#7c3aed" },
];

const dailyGoalMinutes = 480; // 8 hours

type ViewTab = "entries" | "reports" | "insights" | "pomodoro";

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

const fmtDate = (d: string) => {
  if (d === today) return "Hôm nay";
  if (d === yesterday) return "Hôm qua";
  return new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "short" });
};

export function TimeTrackingView() {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [activeTab, setActiveTab] = useState<ViewTab>("entries");

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTask, setTimerTask] = useState("Implement authentication system");
  const [timerProject, setTimerProject] = useState(projectOptions[0]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({ task: "", project: projectOptions[0].name, startTime: "09:00", endTime: "10:00", date: today, tags: "", note: "", billable: true });

  // Filters
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<"today" | "yesterday" | "week" | "month">("week");
  const [searchQ, setSearchQ] = useState("");

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);

  // Pomodoro state
  const [pomodoroMode, setPomodoroMode] = useState<"work" | "break" | "longbreak">("work");
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroTask, setPomodoroTask] = useState("Focus session");
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [pomodoroWorkMins, setPomodoroWorkMins] = useState(25);
  const [pomodoroBreakMins, setPomodoroBreakMins] = useState(5);
  const [pomodoroLongBreakMins, setPomodoroLongBreakMins] = useState(15);
  const [pomodoroTotalToday, setPomodoroTotalToday] = useState(6); // mock: 6 sessions already done
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pomodoro timer logic
  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroSeconds(s => {
          if (s <= 1) {
            // Timer complete
            setPomodoroRunning(false);
            if (pomodoroMode === "work") {
              const newSessions = pomodoroSessions + 1;
              setPomodoroSessions(newSessions);
              setPomodoroTotalToday(p => p + 1);
              toast.success(`Pomodoro #${newSessions} hoàn thành!`, { description: pomodoroTask });
              if (newSessions % 4 === 0) {
                setPomodoroMode("longbreak");
                setPomodoroSeconds(pomodoroLongBreakMins * 60);
                toast("Long break time! 15 phút nghỉ ngơi", { icon: "☕" });
              } else {
                setPomodoroMode("break");
                setPomodoroSeconds(pomodoroBreakMins * 60);
                toast("Break time! 5 phút nghỉ ngơi", { icon: "🧘" });
              }
            } else {
              setPomodoroMode("work");
              setPomodoroSeconds(pomodoroWorkMins * 60);
              toast("Break over! Time to focus", { icon: "🔥" });
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (pomodoroRef.current) {
      clearInterval(pomodoroRef.current);
    }
    return () => { if (pomodoroRef.current) clearInterval(pomodoroRef.current); };
  }, [pomodoroRunning, pomodoroMode, pomodoroSessions, pomodoroTask, pomodoroWorkMins, pomodoroBreakMins, pomodoroLongBreakMins]);

  const fmtTimer = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const startTimer = useCallback(() => {
    setTimerRunning(true);
    toast.success("Timer started");
  }, []);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    const mins = Math.max(1, Math.round(timerSeconds / 60));
    const now = new Date();
    const endH = String(now.getHours()).padStart(2, "0");
    const endM = String(now.getMinutes()).padStart(2, "0");
    const startDate = new Date(now.getTime() - timerSeconds * 1000);
    const startH = String(startDate.getHours()).padStart(2, "0");
    const startM = String(startDate.getMinutes()).padStart(2, "0");

    const entry: TimeEntry = {
      id: `te_${Date.now()}`, task: timerTask, project: timerProject.name, projectColor: timerProject.color,
      minutes: mins, date: today, startTime: `${startH}:${startM}`, endTime: `${endH}:${endM}`,
      tags: [], billable: true,
    };
    setEntries(prev => [entry, ...prev]);
    setTimerSeconds(0);
    toast.success(`${fmtMins(mins)} tracked`, { description: timerTask });
  }, [timerSeconds, timerTask, timerProject]);

  const discardTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerSeconds(0);
    toast.info("Timer discarded");
  }, []);

  // Manual entry
  const addManualEntry = useCallback(() => {
    if (!manualForm.task.trim()) return;
    const [sh, sm] = manualForm.startTime.split(":").map(Number);
    const [eh, em] = manualForm.endTime.split(":").map(Number);
    const mins = Math.max(1, (eh * 60 + em) - (sh * 60 + sm));
    const proj = projectOptions.find(p => p.name === manualForm.project) || projectOptions[0];
    const entry: TimeEntry = {
      id: `te_${Date.now()}`, task: manualForm.task, project: proj.name, projectColor: proj.color,
      minutes: mins, date: manualForm.date, startTime: manualForm.startTime, endTime: manualForm.endTime,
      tags: manualForm.tags.split(",").map(t => t.trim()).filter(Boolean), billable: manualForm.billable,
      note: manualForm.note || undefined,
    };
    setEntries(prev => [entry, ...prev]);
    setShowManualEntry(false);
    setManualForm({ task: "", project: projectOptions[0].name, startTime: "09:00", endTime: "10:00", date: today, tags: "", note: "", billable: true });
    toast.success(`${fmtMins(mins)} added`, { description: manualForm.task });
  }, [manualForm]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setCtxMenu(null);
    toast.success("Entry deleted");
  }, []);

  const duplicateEntry = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    setEntries(prev => [{ ...entry, id: `te_${Date.now()}`, date: today }, ...prev]);
    setCtxMenu(null);
    toast.success("Entry duplicated");
  }, [entries]);

  // Filter
  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchProject = filterProject === "all" || e.project === filterProject;
      const matchSearch = !searchQ || e.task.toLowerCase().includes(searchQ.toLowerCase()) || e.project.toLowerCase().includes(searchQ.toLowerCase());
      let matchDate = true;
      if (filterDate === "today") matchDate = e.date === today;
      else if (filterDate === "yesterday") matchDate = e.date === yesterday;
      else if (filterDate === "week") {
        const d = new Date(e.date);
        const weekAgo = new Date("2026-03-11");
        matchDate = d >= weekAgo;
      } else {
        const d = new Date(e.date);
        const monthAgo = new Date("2026-02-17");
        matchDate = d >= monthAgo;
      }
      return matchProject && matchSearch && matchDate;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [entries, filterProject, filterDate, searchQ]);

  // Grouped by date
  const grouped = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    filtered.forEach(e => { const arr = map.get(e.date) || []; arr.push(e); map.set(e.date, arr); });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Stats
  const todayMins = useMemo(() => entries.filter(e => e.date === today).reduce((a, e) => a + e.minutes, 0), [entries]);
  const weekMins = useMemo(() => entries.filter(e => new Date(e.date) >= new Date("2026-03-11")).reduce((a, e) => a + e.minutes, 0), [entries]);
  const billableMins = useMemo(() => filtered.filter(e => e.billable).reduce((a, e) => a + e.minutes, 0), [filtered]);
  const totalFiltered = useMemo(() => filtered.reduce((a, e) => a + e.minutes, 0), [filtered]);

  // By project
  const byProject = useMemo(() => {
    const map = new Map<string, { color: string; mins: number; count: number; billable: number }>();
    filtered.forEach(e => {
      const cur = map.get(e.project) || { color: e.projectColor, mins: 0, count: 0, billable: 0 };
      cur.mins += e.minutes; cur.count++; if (e.billable) cur.billable += e.minutes;
      map.set(e.project, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].mins - a[1].mins);
  }, [filtered]);

  // Weekly heatmap
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const mins = entries.filter(e => e.date === dateStr).reduce((a, e) => a + e.minutes, 0);
      days.push({ date: dateStr, dayName: d.toLocaleDateString("vi-VN", { weekday: "short" }), day: d.getDate(), mins });
    }
    return days;
  }, [entries]);

  // By tag
  const byTag = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(e => e.tags.forEach(t => map.set(t, (map.get(t) || 0) + e.minutes)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const goalPct = Math.min(100, (todayMins / dailyGoalMinutes) * 100);

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setCtxMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Time Tracking</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Theo dõi thời gian · {fmtMins(todayMins)} hôm nay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowManualEntry(true)} className="flex items-center gap-1.5 text-[11px] text-gray-600 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
              <Plus className="w-3.5 h-3.5" /> Manual Entry
            </button>
            <button onClick={timerRunning ? stopTimer : startTimer}
              className={`flex items-center gap-1.5 text-[11px] px-4 py-2 rounded-xl shadow-sm transition-all ${timerRunning ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-cyan-500/20"}`}>
              {timerRunning ? <><StopCircle className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Start Timer</>}
            </button>
          </div>
        </div>

        {/* Active Timer */}
        {(timerRunning || timerSeconds > 0) && (
          <div className={`bg-white rounded-2xl border p-4 mb-4 shadow-sm flex items-center gap-4 transition-all ${timerRunning ? "border-cyan-200 ring-1 ring-cyan-100" : "border-gray-200"}`}>
            <div className={`w-3 h-3 rounded-full ${timerRunning ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
            <div className="flex-1 min-w-0">
              <input value={timerTask} onChange={e => setTimerTask(e.target.value)} placeholder="Bạn đang làm gì?"
                className="w-full text-[13px] text-gray-800 focus:outline-none bg-transparent" />
              <div className="flex items-center gap-2 mt-1">
                <select value={timerProject.name} onChange={e => { const p = projectOptions.find(pr => pr.name === e.target.value); if (p) setTimerProject(p); }}
                  className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 focus:outline-none">
                  {projectOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className={`text-[24px] tabular-nums tracking-wider ${timerRunning ? "text-cyan-700" : "text-gray-400"}`}>{fmtTimer(timerSeconds)}</div>
            <div className="flex items-center gap-1">
              {timerRunning ? (
                <button onClick={stopTimer} className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500"><StopCircle className="w-4 h-4" /></button>
              ) : (
                <>
                  <button onClick={startTimer} className="w-9 h-9 rounded-xl bg-cyan-50 hover:bg-cyan-100 flex items-center justify-center text-cyan-600"><Play className="w-4 h-4" /></button>
                  <button onClick={discardTimer} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Clock className="w-4 h-4" /></div>
              <span className="text-xl text-orange-600 tracking-tight">{fmtMins(todayMins)}</span>
            </div>
            <p className="text-[9px] text-gray-400 mb-1.5">Hôm nay</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${goalPct >= 100 ? "bg-emerald-400" : goalPct >= 75 ? "bg-cyan-400" : "bg-orange-400"}`} style={{ width: `${goalPct}%` }} />
            </div>
            <p className="text-[8px] text-gray-400 mt-1">{Math.round(goalPct)}% of {fmtMins(dailyGoalMinutes)} goal</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500"><Calendar className="w-4 h-4" /></div>
              <span className="text-xl text-cyan-600 tracking-tight">{fmtMins(weekMins)}</span>
            </div>
            <p className="text-[9px] text-gray-400">Tuần này</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><Target className="w-4 h-4" /></div>
              <span className="text-xl text-emerald-600 tracking-tight">{fmtMins(billableMins)}</span>
            </div>
            <p className="text-[9px] text-gray-400">Billable ({totalFiltered > 0 ? Math.round((billableMins / totalFiltered) * 100) : 0}%)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500"><BarChart3 className="w-4 h-4" /></div>
              <span className="text-xl text-violet-600 tracking-tight">{filtered.length}</span>
            </div>
            <p className="text-[9px] text-gray-400">Entries</p>
          </div>
        </div>

        {/* Weekly heatmap */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 shadow-sm">
          <h3 className="text-[12px] text-gray-700 mb-3">Weekly Overview</h3>
          <div className="flex items-end gap-2">
            {weekDays.map(d => {
              const maxMins = Math.max(...weekDays.map(dd => dd.mins), 1);
              const h = Math.max(4, (d.mins / maxMins) * 70);
              const pctGoal = d.mins / dailyGoalMinutes;
              const color = pctGoal >= 1 ? "#059669" : pctGoal >= 0.75 ? "#0891b2" : pctGoal >= 0.5 ? "#d97706" : "#d1d5db";
              const isToday = d.date === today;
              return (
                <div key={d.date} className={`flex-1 flex flex-col items-center gap-1 ${isToday ? "" : "opacity-80"}`}>
                  <span className="text-[9px] text-gray-400">{d.mins > 0 ? fmtMins(d.mins) : "—"}</span>
                  <div className="w-full flex justify-center" style={{ height: 70 }}>
                    <div className={`w-8 rounded-t-lg transition-all ${isToday ? "ring-2 ring-offset-1 ring-cyan-300" : ""}`}
                      style={{ height: h, backgroundColor: color }} />
                  </div>
                  <span className={`text-[9px] ${isToday ? "text-gray-800" : "text-gray-400"}`}>{d.dayName}</span>
                  <span className={`text-[8px] ${isToday ? "text-gray-600" : "text-gray-300"}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {([
            ["entries", "Entries", <Timer key="e" className="w-3.5 h-3.5" />],
            ["reports", "Reports", <BarChart3 key="r" className="w-3.5 h-3.5" />],
            ["insights", "Insights", <TrendingUp key="i" className="w-3.5 h-3.5" />],
            ["pomodoro", "Pomodoro", <Coffee key="p" className="w-3.5 h-3.5" />],
          ] as [ViewTab, string, React.ReactNode][]).map(([key, label, icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] rounded-xl transition-all ${activeTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
              {icon} {label}
            </button>
          ))}
          <div className="flex-1" />
          {/* Date filter */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
            {(["today", "yesterday", "week", "month"] as const).map(d => (
              <button key={d} onClick={() => setFilterDate(d)}
                className={`px-2.5 py-1.5 text-[10px] rounded-lg transition-all capitalize ${filterDate === d ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                {d === "today" ? "Nay" : d === "yesterday" ? "Qua" : d === "week" ? "Tuần" : "Tháng"}
              </button>
            ))}
          </div>
        </div>

        {/* ENTRIES TAB */}
        {activeTab === "entries" && (
          <>
            {/* Search & filter bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm entries..."
                  className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
              </div>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                className="text-[11px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none focus:border-cyan-300">
                <option value="all">Tất cả projects</option>
                {projectOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            {/* Grouped entries */}
            <div className="space-y-4">
              {grouped.map(([date, dayEntries]) => {
                const dayTotal = dayEntries.reduce((a, e) => a + e.minutes, 0);
                return (
                  <div key={date} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[12px] text-gray-700">{fmtDate(date)}</span>
                        <span className="text-[10px] text-gray-400">{dayEntries.length} entries</span>
                      </div>
                      <span className="text-[12px] text-gray-700 tabular-nums">{fmtMins(dayTotal)}</span>
                    </div>
                    {dayEntries.map((entry, i) => (
                      <div key={entry.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-all group ${i < dayEntries.length - 1 ? "border-b border-gray-50" : ""}`}>
                        <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: entry.projectColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-gray-800 truncate">{entry.task}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-400">{entry.project}</span>
                            <span className="text-[9px] text-gray-300">·</span>
                            <span className="text-[9px] text-gray-400">{entry.startTime} — {entry.endTime}</span>
                            {entry.billable && <span className="text-[8px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">$</span>}
                          </div>
                          {entry.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {entry.tags.map(t => <span key={t} className="text-[8px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{t}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (entry.minutes / dailyGoalMinutes) * 100)}%`, backgroundColor: entry.projectColor }} />
                        </div>
                        <span className="text-[12px] px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 tabular-nums shrink-0 min-w-[65px] text-center" style={{ color: entry.projectColor }}>{fmtMins(entry.minutes)}</span>
                        <div className="relative">
                          <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === entry.id ? null : entry.id); }}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {ctxMenu === entry.id && (
                            <div className="absolute right-0 top-full mt-1 w-[150px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { duplicateEntry(entry.id); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3 h-3 text-gray-400" /> Duplicate</button>
                              <div className="h-px bg-gray-100 my-0.5" />
                              <button onClick={() => deleteEntry(entry.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {grouped.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <Coffee className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[12px] text-gray-500">Chưa có entries nào</p>
                  <p className="text-[10px] text-gray-400 mt-1">Bắt đầu timer hoặc thêm manual entry</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Project */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><FolderOpen className="w-4 h-4 text-gray-400" /> By Project</h3>
              <div className="space-y-3">
                {byProject.map(([name, data]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                        <span className="text-[11px] text-gray-700">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{data.count} entries</span>
                        <span className="text-[11px] text-gray-700 tabular-nums min-w-[50px] text-right">{fmtMins(data.mins)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(data.mins / totalFiltered) * 100}%`, backgroundColor: data.color }} />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[8px] text-gray-400">{Math.round((data.mins / totalFiltered) * 100)}%</span>
                      <span className="text-[8px] text-emerald-500">{fmtMins(data.billable)} billable</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Tag */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-gray-400" /> By Tag</h3>
              {byTag.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Không có tags</p>}
              <div className="space-y-2">
                {byTag.map(([tag, mins]) => (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg w-24 text-center truncate">#{tag}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-violet-400" style={{ width: `${(mins / totalFiltered) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 tabular-nums min-w-[45px] text-right">{fmtMins(mins)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billable vs Non-billable */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> Billable Ratio</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#059669" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - (totalFiltered > 0 ? billableMins / totalFiltered : 0))}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[16px] text-gray-800">{totalFiltered > 0 ? Math.round((billableMins / totalFiltered) * 100) : 0}%</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div><div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[11px] text-gray-600">Billable</span></div><p className="text-[16px] text-gray-800 ml-4">{fmtMins(billableMins)}</p></div>
                  <div><div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-gray-300" /><span className="text-[11px] text-gray-600">Non-billable</span></div><p className="text-[16px] text-gray-800 ml-4">{fmtMins(totalFiltered - billableMins)}</p></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400" /> Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[20px] text-gray-800 tracking-tight">{fmtMins(totalFiltered)}</p><p className="text-[9px] text-gray-400 mt-0.5">Total Time</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[20px] text-gray-800 tracking-tight">{filtered.length}</p><p className="text-[9px] text-gray-400 mt-0.5">Entries</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[20px] text-gray-800 tracking-tight">{grouped.length}</p><p className="text-[9px] text-gray-400 mt-0.5">Active Days</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[20px] text-gray-800 tracking-tight">{grouped.length > 0 ? fmtMins(Math.round(totalFiltered / grouped.length)) : "—"}</p><p className="text-[9px] text-gray-400 mt-0.5">Avg/Day</p></div>
              </div>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            {/* Productivity score */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Productivity Score</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#7c3aed" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - 0.82)}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] text-gray-800">82</span>
                    <span className="text-[8px] text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {[
                    { label: "Focus Time", score: 85, desc: "Thời gian tập trung liên tục > 30m", color: "#0891b2" },
                    { label: "Goal Completion", score: Math.round(goalPct), desc: "Đạt mục tiêu 8h/ngày", color: "#059669" },
                    { label: "Billable Ratio", score: totalFiltered > 0 ? Math.round((billableMins / totalFiltered) * 100) : 0, desc: "Tỷ lệ giờ tính phí", color: "#d97706" },
                    { label: "Consistency", score: 78, desc: "Tracking đều đặn", color: "#7c3aed" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-600">{m.label}</span>
                        <span className="text-[10px]" style={{ color: m.color }}>{m.score}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.score}%`, backgroundColor: m.color }} />
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Streaks & achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
                <div className="text-[32px] mb-1">🔥</div>
                <p className="text-[22px] text-gray-800 tracking-tight">7</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Day Streak</p>
                <p className="text-[9px] text-gray-400">Tracking liên tục 7 ngày!</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
                <div className="text-[32px] mb-1">⚡</div>
                <p className="text-[22px] text-gray-800 tracking-tight">5h 20m</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Longest Focus</p>
                <p className="text-[9px] text-gray-400">Phiên tập trung dài nhất</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
                <div className="text-[32px] mb-1">🏆</div>
                <p className="text-[22px] text-gray-800 tracking-tight">3</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Goals Met This Week</p>
                <p className="text-[9px] text-gray-400">Đạt 8h/ngày 3 lần tuần này</p>
              </div>
            </div>

            {/* Peak hours */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400" /> Peak Productivity Hours</h3>
              <div className="flex items-end gap-1 h-[80px]">
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i + 8; // 8am to 7pm
                  const values = [20, 65, 85, 90, 40, 75, 95, 80, 60, 30, 15, 5];
                  const val = values[i];
                  const color = val >= 80 ? "#059669" : val >= 50 ? "#0891b2" : val >= 25 ? "#d97706" : "#e5e7eb";
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex justify-center" style={{ height: 60 }}>
                        <div className="w-full max-w-[28px] rounded-t-lg" style={{ height: (val / 100) * 60, backgroundColor: color }} />
                      </div>
                      <span className="text-[7px] text-gray-400">{hour}h</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500 mt-3 text-center">🟢 High productivity (≥80%) · 🔵 Medium (≥50%) · 🟡 Low (≥25%)</p>
            </div>
          </div>
        )}

        {/* POMODORO TAB */}
        {activeTab === "pomodoro" && (
          <div className="space-y-4">
            {/* Main timer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              {/* Mode selector */}
              <div className="flex items-center justify-center gap-1 mb-8">
                {([
                  ["work", "Focus", "#dc2626"],
                  ["break", "Break", "#059669"],
                  ["longbreak", "Long Break", "#7c3aed"],
                ] as ["work" | "break" | "longbreak", string, string][]).map(([key, label, color]) => (
                  <button key={key} onClick={() => { setPomodoroMode(key); setPomodoroRunning(false); setPomodoroSeconds(key === "work" ? pomodoroWorkMins * 60 : key === "break" ? pomodoroBreakMins * 60 : pomodoroLongBreakMins * 60); }}
                    className={`px-4 py-2 text-[11px] rounded-xl transition-all ${pomodoroMode === key ? "text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
                    style={pomodoroMode === key ? { backgroundColor: color } : {}}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Circular timer */}
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  {(() => {
                    const totalSecs = (pomodoroMode === "work" ? pomodoroWorkMins : pomodoroMode === "break" ? pomodoroBreakMins : pomodoroLongBreakMins) * 60;
                    const pct = pomodoroSeconds / totalSecs;
                    const color = pomodoroMode === "work" ? "#dc2626" : pomodoroMode === "break" ? "#059669" : "#7c3aed";
                    const r = 86;
                    return (
                      <>
                        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
                          <circle cx="96" cy="96" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                          <circle cx="96" cy="96" r={r} fill="none" stroke={color} strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * r}`} strokeDashoffset={`${2 * Math.PI * r * (1 - pct)}`} strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[40px] tabular-nums tracking-wider text-gray-800">
                            {String(Math.floor(pomodoroSeconds / 60)).padStart(2, "0")}:{String(pomodoroSeconds % 60).padStart(2, "0")}
                          </span>
                          <span className="text-[11px] text-gray-400 mt-1">
                            {pomodoroMode === "work" ? "Focus Time" : pomodoroMode === "break" ? "Short Break" : "Long Break"}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Task input */}
              <div className="max-w-xs mx-auto mb-6">
                <input value={pomodoroTask} onChange={e => setPomodoroTask(e.target.value)} placeholder="Đang tập trung làm gì?"
                  className="w-full text-center text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-300" />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { setPomodoroRunning(false); setPomodoroSeconds((pomodoroMode === "work" ? pomodoroWorkMins : pomodoroMode === "break" ? pomodoroBreakMins : pomodoroLongBreakMins) * 60); }}
                  className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all">
                  <Square className="w-4 h-4" />
                </button>
                <button onClick={() => setPomodoroRunning(!pomodoroRunning)}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 ${pomodoroRunning ? "bg-gray-700 hover:bg-gray-800" : pomodoroMode === "work" ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : pomodoroMode === "break" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" : "bg-violet-500 hover:bg-violet-600 shadow-violet-500/30"}`}>
                  {pomodoroRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button onClick={() => { const nextMode = pomodoroMode === "work" ? "break" : pomodoroMode === "break" ? "longbreak" : "work"; setPomodoroMode(nextMode); setPomodoroRunning(false); setPomodoroSeconds((nextMode === "work" ? pomodoroWorkMins : nextMode === "break" ? pomodoroBreakMins : pomodoroLongBreakMins) * 60); }}
                  className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Session dots */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < (pomodoroSessions % 4) ? "bg-red-400 scale-110" : "bg-gray-200"}`} />
                ))}
                <span className="text-[10px] text-gray-400 ml-2">#{pomodoroSessions + 1}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-center">
                <div className="text-[28px] mb-1">🍅</div>
                <p className="text-[20px] text-gray-800 tracking-tight">{pomodoroTotalToday}</p>
                <p className="text-[9px] text-gray-400">Sessions hôm nay</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-center">
                <div className="text-[28px] mb-1">⏱️</div>
                <p className="text-[20px] text-gray-800 tracking-tight">{fmtMins(pomodoroTotalToday * pomodoroWorkMins)}</p>
                <p className="text-[9px] text-gray-400">Focus time</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm text-center">
                <div className="text-[28px] mb-1">🎯</div>
                <p className="text-[20px] text-gray-800 tracking-tight">{Math.round((pomodoroTotalToday / 12) * 100)}%</p>
                <p className="text-[9px] text-gray-400">Daily goal (12)</p>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Timer className="w-4 h-4 text-gray-400" /> Timer Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Focus", value: pomodoroWorkMins, set: (v: number) => setPomodoroWorkMins(v), color: "#dc2626" },
                  { label: "Break", value: pomodoroBreakMins, set: (v: number) => setPomodoroBreakMins(v), color: "#059669" },
                  { label: "Long Break", value: pomodoroLongBreakMins, set: (v: number) => setPomodoroLongBreakMins(v), color: "#7c3aed" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-[10px] text-gray-500 mb-2">{s.label}</p>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => s.set(Math.max(1, s.value - 5))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-[12px]">−</button>
                      <span className="text-[16px] w-10 text-center tabular-nums" style={{ color: s.color }}>{s.value}</span>
                      <button onClick={() => s.set(s.value + 5)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-[12px]">+</button>
                    </div>
                    <p className="text-[8px] text-gray-400 mt-1">minutes</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly pomodoro history */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400" /> This Week</h3>
              <div className="flex items-end gap-2">
                {[
                  { day: "T2", sessions: 10 }, { day: "T3", sessions: 8 }, { day: "T4", sessions: 12 },
                  { day: "T5", sessions: 6 }, { day: "T6", sessions: 9 }, { day: "T7", sessions: 4 },
                  { day: "CN", sessions: pomodoroTotalToday },
                ].map((d, i) => {
                  const max = 12;
                  const h = Math.max(4, (d.sessions / max) * 70);
                  const isToday = i === 6;
                  return (
                    <div key={d.day} className={`flex-1 flex flex-col items-center gap-1 ${isToday ? "" : "opacity-70"}`}>
                      <span className="text-[9px] text-gray-400">{d.sessions}</span>
                      <div className="w-full flex justify-center" style={{ height: 70 }}>
                        <div className={`w-8 rounded-t-lg transition-all ${isToday ? "ring-2 ring-offset-1 ring-red-300" : ""}`}
                          style={{ height: h, backgroundColor: d.sessions >= 10 ? "#059669" : d.sessions >= 6 ? "#0891b2" : "#d97706" }} />
                      </div>
                      <span className={`text-[9px] ${isToday ? "text-gray-800" : "text-gray-400"}`}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-3">Total: 55 sessions · {fmtMins(55 * pomodoroWorkMins)} focus time this week</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowManualEntry(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-orange-500" /><h3 className="text-[15px] text-gray-800">Manual Entry</h3></div>
              <button onClick={() => setShowManualEntry(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Task *</label>
                <input value={manualForm.task} onChange={e => setManualForm(p => ({ ...p, task: e.target.value }))} placeholder="Bạn đã làm gì?" autoFocus
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Project</label>
                <select value={manualForm.project} onChange={e => setManualForm(p => ({ ...p, project: e.target.value }))}
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-cyan-400 text-gray-700">
                  {projectOptions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Date</label>
                  <input type="date" value={manualForm.date} onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Start</label>
                  <input type="time" value={manualForm.startTime} onChange={e => setManualForm(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">End</label>
                  <input type="time" value={manualForm.endTime} onChange={e => setManualForm(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Tags (comma separated)</label>
                <input value={manualForm.tags} onChange={e => setManualForm(p => ({ ...p, tags: e.target.value }))} placeholder="design, frontend, review"
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Note</label>
                <textarea value={manualForm.note} onChange={e => setManualForm(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú (tùy chọn)"
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700 h-16 resize-none" /></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setManualForm(p => ({ ...p, billable: !p.billable }))}
                  className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all ${manualForm.billable ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-gray-200 text-gray-500"}`}>
                  <Target className="w-3 h-3" /> {manualForm.billable ? "Billable" : "Non-billable"}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowManualEntry(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={addManualEntry} disabled={!manualForm.task.trim()}
                className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 disabled:opacity-40">Add Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}