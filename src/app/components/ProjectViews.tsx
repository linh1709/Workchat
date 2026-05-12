import { useState, useRef, useMemo, useCallback } from "react";
import { copyToClipboard } from "./clipboard";
import {
  Plus, Search, ChevronDown, ChevronRight, MoreHorizontal,
  Target, TrendingUp, CheckCircle2, Circle, AlertCircle,
  Video, Phone, Monitor, Mic, MicOff, VideoOff, Users,
  Clock, Calendar, ExternalLink, Link2, Play, Pause,
  FileText, FolderOpen, Star, Eye, Edit3, Download,
  ArrowUpRight, Globe, MapPin, Filter, Columns3,
  Flag, Zap, Award, BarChart3, Layers, MessageSquare,
  Send, Image, Paperclip, Share2, Copy, Trash2, X,
  ChevronUp, Hash, BookOpen, GraduationCap, Lightbulb,
  Diamond,
  type LucideIcon
} from "lucide-react";
import { teamMembers, type Task } from "./data";

/* ================================================================
   TIMELINE VIEW — Horizontal time-based task layout (FULL)
   ================================================================ */
interface TimelineProps { tasks: Task[]; onTaskClick: (task: Task) => void; }

export function TimelineView({ tasks, onTaskClick }: TimelineProps) {
  const [scale, setScale] = useState<"day" | "week" | "month">("week");
  const [hoveredTask, setHoveredTask] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [groupBy, setGroupBy] = useState<"assignee" | "status">("assignee");
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<string, string> = { todo: "#94a3b8", in_progress: "#0891b2", in_review: "#7c3aed", done: "#059669" };
  const statusLabels: Record<string, string> = { todo: "Chưa làm", in_progress: "Đang làm", in_review: "Đang review", done: "Hoàn thành" };
  const priorityLabels: Record<string, { color: string; label: string }> = {
    urgent: { color: "#dc2626", label: "Khẩn cấp" }, high: { color: "#f59e0b", label: "Cao" },
    normal: { color: "#3b82f6", label: "Bình thường" }, low: { color: "#94a3b8", label: "Thấp" },
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const baseDate = new Date(today); baseDate.setDate(today.getDate() - 14);
  const totalDays = scale === "month" ? 90 : scale === "week" ? 56 : 35;
  const dayWidth = scale === "day" ? 48 : scale === "week" ? 22 : 8;
  const totalWidth = totalDays * dayWidth;
  const ROW_HEIGHT = 40;
  const BAR_HEIGHT = 28;
  const SIDEBAR_W = 240;

  // Day cells for background
  const dayCells = useMemo(() => Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(baseDate); d.setDate(d.getDate() + i);
    const dow = d.getDay();
    return { index: i, date: new Date(d), isWeekend: dow === 0 || dow === 6, isToday: d.toDateString() === today.toDateString(), dayOfWeek: ["CN","T2","T3","T4","T5","T6","T7"][dow] };
  }), [scale, totalDays]);

  // Column headers
  const columns = useMemo(() => {
    if (scale === "day") return dayCells.map(c => ({ label: `${c.date.getDate()}`, subLabel: c.dayOfWeek, width: dayWidth, isWeekend: c.isWeekend, isToday: c.isToday }));
    if (scale === "week") {
      const cols: { label: string; width: number }[] = [];
      let cursor = new Date(baseDate);
      const dow = cursor.getDay(); if (dow !== 1) cursor.setDate(cursor.getDate() - ((dow + 6) % 7));
      for (let w = 0; w < 8; w++) {
        const ws = new Date(cursor); ws.setDate(ws.getDate() + w * 7);
        const we = new Date(ws); we.setDate(we.getDate() + 6);
        cols.push({ label: `${ws.getDate()}/${ws.getMonth()+1} — ${we.getDate()}/${we.getMonth()+1}`, width: 7 * dayWidth });
      }
      return cols;
    }
    return [{ label: "Tháng 3", width: 31 * dayWidth }, { label: "Tháng 4", width: 30 * dayWidth }, { label: "Tháng 5", width: 29 * dayWidth }];
  }, [scale, totalDays, dayWidth]);

  const todayOffset = Math.floor((today.getTime() - baseDate.getTime()) / 86400000);
  const todayX = todayOffset * dayWidth + dayWidth / 2;

  const getTaskBar = useCallback((task: Task) => {
    const sd = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
    const ed = task.dueDate ? new Date(task.dueDate) : new Date(sd.getTime() + 7 * 86400000);
    const left = Math.max(0, ((sd.getTime() - baseDate.getTime()) / 86400000) * dayWidth);
    const right = Math.min(totalWidth, ((ed.getTime() - baseDate.getTime()) / 86400000) * dayWidth);
    return { left, width: Math.max(dayWidth, right - left), startDate: sd, endDate: ed };
  }, [dayWidth, totalWidth]);

  // Group tasks
  const groups = useMemo(() => {
    if (groupBy === "assignee") {
      const g = teamMembers.map(m => ({ id: m.id, label: m.name, sublabel: m.role, color: m.color, avatar: m.name.charAt(0), tasks: tasks.filter(t => t.assignee?.id === m.id) })).filter(g => g.tasks.length > 0);
      const un = tasks.filter(t => !t.assignee);
      if (un.length > 0) g.push({ id: "unassigned", label: "Chưa giao", sublabel: `${un.length} tasks`, color: "#94a3b8", avatar: "?", tasks: un });
      return g;
    }
    return (["todo","in_progress","in_review","done"] as const).map(s => ({ id: s, label: statusLabels[s], sublabel: "", color: statusColors[s], avatar: "", tasks: tasks.filter(t => t.status === s) })).filter(g => g.tasks.length > 0);
  }, [tasks, groupBy]);

  // Stack overlapping tasks into rows
  const getStackedRows = useCallback((groupTasks: Task[]) => {
    const rows: Task[][] = [];
    const sorted = [...groupTasks].sort((a, b) => (a.startDate || a.createdAt).localeCompare(b.startDate || b.createdAt));
    for (const task of sorted) {
      const bar = getTaskBar(task);
      let placed = false;
      for (const row of rows) {
        const last = row[row.length - 1];
        const lb = getTaskBar(last);
        if (bar.left >= lb.left + lb.width + 2) { row.push(task); placed = true; break; }
      }
      if (!placed) rows.push([task]);
    }
    return rows;
  }, [getTaskBar]);

  // Dependency arrows data
  const dependencyLines = useMemo(() => {
    const lines: { from: Task; to: Task }[] = [];
    tasks.forEach(task => { task.dependencies?.forEach(depId => { const dep = tasks.find(t => t.id === depId); if (dep) lines.push({ from: dep, to: task }); }); });
    return lines;
  }, [tasks]);

  // taskId → absolute Y position
  const taskYMap = useMemo(() => {
    const map: Record<string, number> = {};
    let cumY = 0;
    groups.forEach(group => {
      const rows = getStackedRows(group.tasks);
      rows.forEach((row, ri) => { row.forEach(task => { map[task.id] = cumY + ri * ROW_HEIGHT + ROW_HEIGHT / 2; }); });
      cumY += Math.max(1, rows.length) * ROW_HEIGHT;
    });
    return map;
  }, [groups, getStackedRows]);

  const handleBarHover = (e: React.MouseEvent, task: Task) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect) setHoveredTask({ task, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const fmtDate = (d: Date) => `${d.getDate()}/${d.getMonth()+1}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 gap-3 bg-white shrink-0">
        <Columns3 className="w-4 h-4 text-sky-500" />
        <span className="text-[13px] text-gray-700 tracking-tight">Dòng thời gian</span>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 ml-2">
          {(["day","week","month"] as const).map(s => (
            <button key={s} onClick={() => setScale(s)} className={`px-3 py-1 text-[11px] rounded-md transition-all ${scale === s ? "bg-white shadow-sm text-cyan-700" : "text-gray-500 hover:text-gray-700"}`}>
              {s === "day" ? "Ngày" : s === "week" ? "Tuần" : "Tháng"}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <span className="text-[11px] text-gray-400">Nhóm:</span>
        <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)} className="text-[11px] text-gray-600 bg-gray-100 rounded-md px-2 py-1 border-none outline-none cursor-pointer">
          <option value="assignee">Thành viên</option>
          <option value="status">Trạng thái</option>
        </select>
        <div className="flex-1" />
        <button onClick={() => { if (scrollRef.current) scrollRef.current.scrollLeft = Math.max(0, todayX - 400); }}
          className="text-[11px] text-cyan-600 hover:text-cyan-700 bg-cyan-50 px-3 py-1 rounded-md border border-cyan-200 hover:bg-cyan-100 transition-all">Hôm nay</button>
        <div className="flex items-center gap-3 ml-3">
          {Object.entries(statusColors).map(([k,c]) => (
            <div key={k} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} /><span className="text-[10px] text-gray-400">{statusLabels[k]}</span></div>
          ))}
          <div className="flex items-center gap-1"><Diamond className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" /><span className="text-[10px] text-gray-400">Hoàn thành</span></div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 border-r border-gray-200 bg-white z-20 flex flex-col" style={{ width: SIDEBAR_W }}>
          <div className="h-[44px] border-b border-gray-200 flex items-center px-4 bg-gray-50/70 shrink-0">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{groupBy === "assignee" ? "Thành viên" : "Trạng thái"}</span>
          </div>
          <div className="flex-1 overflow-auto">
            {groups.map(group => {
              const rowCount = Math.max(1, getStackedRows(group.tasks).length);
              return (
                <div key={group.id} className="border-b border-gray-100 flex items-center gap-2.5 px-4" style={{ height: rowCount * ROW_HEIGHT }}>
                  {groupBy === "assignee" ? (
                    <><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: group.color }}>{group.avatar}</div>
                    <div className="min-w-0 flex-1"><p className="text-[12px] text-gray-700 truncate">{group.label}</p><p className="text-[10px] text-gray-400">{group.tasks.length} tasks</p></div></>
                  ) : (
                    <><div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: group.color }} />
                    <div className="min-w-0 flex-1"><p className="text-[12px] text-gray-700 truncate">{group.label}</p><p className="text-[10px] text-gray-400">{group.tasks.length} tasks</p></div></>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div ref={gridRef} className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Column headers */}
            <div className="h-[44px] border-b border-gray-200 flex sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
              {scale === "day" ? dayCells.map(c => (
                <div key={c.index} className={`flex flex-col items-center justify-center border-r shrink-0 ${c.isToday ? "bg-cyan-50/80 border-cyan-200" : c.isWeekend ? "bg-gray-100/60 border-gray-100" : "border-gray-100"}`} style={{ width: dayWidth }}>
                  <span className={`text-[9px] ${c.isToday ? "text-cyan-600" : c.isWeekend ? "text-gray-300" : "text-gray-400"}`}>{c.dayOfWeek}</span>
                  <span className={`text-[11px] ${c.isToday ? "text-cyan-800" : c.isWeekend ? "text-gray-300" : "text-gray-600"}`}>{c.date.getDate()}</span>
                </div>
              )) : (columns as any[]).map((col: any, i: number) => (
                <div key={i} className="flex items-center justify-center border-r border-gray-100 text-[11px] text-gray-500 shrink-0" style={{ width: col.width }}>{col.label}</div>
              ))}
            </div>

            {/* Body */}
            <div className="relative">
              {/* Background day columns */}
              {dayCells.map(c => (
                <div key={c.index} className={`absolute top-0 bottom-0 border-r ${c.isWeekend ? "bg-amber-50/20 border-gray-100" : "border-gray-50"}`} style={{ left: c.index * dayWidth, width: dayWidth }} />
              ))}

              {/* Today marker */}
              {todayX > 0 && todayX < totalWidth && (
                <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: todayX }}>
                  <div className="w-px h-full bg-red-400/70" />
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-1.5 bg-red-400 rounded-full" />
                </div>
              )}

              {/* Dependency arrows */}
              <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" style={{ overflow: "visible" }}>
                <defs><marker id="tlArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto" fill="#94a3b8"><polygon points="0 0, 6 2, 0 4" /></marker></defs>
                {dependencyLines.map(({ from, to }, di) => {
                  const y1 = taskYMap[from.id]; const y2 = taskYMap[to.id];
                  if (y1 === undefined || y2 === undefined) return null;
                  const fb = getTaskBar(from); const tb = getTaskBar(to);
                  const x1 = fb.left + fb.width; const x2 = tb.left;
                  const mx = x1 + (x2 - x1) * 0.5;
                  return <path key={di} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#tlArrow)" opacity="0.5" />;
                })}
              </svg>

              {/* Group rows + bars */}
              {groups.map(group => {
                const stackedRows = getStackedRows(group.tasks);
                const rowCount = Math.max(1, stackedRows.length);
                return (
                  <div key={group.id} className="relative border-b border-gray-100" style={{ height: rowCount * ROW_HEIGHT }}>
                    {/* Alternate row bg */}
                    {Array.from({ length: rowCount }).map((_, ri) => (
                      <div key={ri} className={ri % 2 === 1 ? "absolute left-0 right-0 bg-gray-50/30" : "absolute left-0 right-0"} style={{ top: ri * ROW_HEIGHT, height: ROW_HEIGHT }} />
                    ))}
                    {/* Bars */}
                    {stackedRows.map((row, ri) => row.map(task => {
                      const bar = getTaskBar(task);
                      const isDone = task.status === "done";
                      const isOverdue = !!(task.dueDate && new Date(task.dueDate) < today && !isDone);
                      return (
                        <div key={task.id} className="absolute z-20 group/bar" style={{ left: bar.left, top: ri * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2, width: bar.width, height: BAR_HEIGHT }}>
                          <div className={`h-full rounded-md flex items-center gap-1.5 px-2 cursor-pointer transition-all shadow-sm hover:shadow-md hover:brightness-105 ${isDone ? "opacity-65" : ""} ${isOverdue ? "ring-1 ring-red-300 ring-offset-1" : ""}`}
                            style={{ backgroundColor: statusColors[task.status] }}
                            onClick={() => onTaskClick(task)}
                            onMouseEnter={e => handleBarHover(e, task)} onMouseLeave={() => setHoveredTask(null)}>
                            {task.priority === "urgent" && <div className="w-1.5 h-1.5 rounded-full bg-red-300 shrink-0 animate-pulse" />}
                            <span className="text-[10px] text-white truncate flex-1">{task.title}</span>
                            {task.subtasks && task.subtasks.length > 0 && <span className="text-[8px] text-white/70 shrink-0">{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>}
                            {task.assignee && groupBy !== "assignee" && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white border border-white/30 shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>
                            )}
                          </div>
                          {/* Milestone diamond */}
                          {isDone && <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-30"><Diamond className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400 drop-shadow-sm" /></div>}
                          {/* Resize handle */}
                          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-all flex items-center"><div className="w-1 h-4 bg-white/50 rounded-full" /></div>
                        </div>
                      );
                    }))}
                  </div>
                );
              })}
            </div>

            {/* ── Tooltip ── */}
            {hoveredTask && (
              <div className="absolute z-50 pointer-events-none" style={{ left: Math.min(hoveredTask.x + 12, totalWidth - 260), top: hoveredTask.y + 44 + 16 }}>
                <div className="bg-gray-800 text-white rounded-xl shadow-xl px-4 py-3 min-w-[220px] max-w-[280px] relative">
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45" />
                  <p className="text-[12px] mb-2 leading-snug">{hoveredTask.task.title}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[hoveredTask.task.status] }} /><span className="text-[10px] text-gray-300">{statusLabels[hoveredTask.task.status]}</span></div>
                    <div className="flex items-center gap-2"><Flag className="w-2.5 h-2.5" style={{ color: priorityLabels[hoveredTask.task.priority].color }} /><span className="text-[10px] text-gray-300">{priorityLabels[hoveredTask.task.priority].label}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-2.5 h-2.5 text-gray-400" /><span className="text-[10px] text-gray-300">{hoveredTask.task.startDate ? fmtDate(new Date(hoveredTask.task.startDate)) : "—"} → {hoveredTask.task.dueDate ? fmtDate(new Date(hoveredTask.task.dueDate)) : "—"}</span></div>
                    {hoveredTask.task.assignee && (
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: hoveredTask.task.assignee.color }}>{hoveredTask.task.assignee.name.charAt(0)}</div><span className="text-[10px] text-gray-300">{hoveredTask.task.assignee.name}</span></div>
                    )}
                    {hoveredTask.task.subtasks && hoveredTask.task.subtasks.length > 0 && (
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-2.5 h-2.5 text-gray-400" /><span className="text-[10px] text-gray-300">Subtasks: {hoveredTask.task.subtasks.filter(s => s.done).length}/{hoveredTask.task.subtasks.length}</span></div>
                    )}
                    {hoveredTask.task.dependencies && hoveredTask.task.dependencies.length > 0 && (
                      <div className="flex items-center gap-2"><Link2 className="w-2.5 h-2.5 text-gray-400" /><span className="text-[10px] text-gray-300">Phụ thuộc: {hoveredTask.task.dependencies.length} task</span></div>
                    )}
                    {hoveredTask.task.timeEstimate && (
                      <div className="flex items-center gap-2"><Clock className="w-2.5 h-2.5 text-gray-400" /><span className="text-[10px] text-gray-300">{Math.floor((hoveredTask.task.timeSpent||0)/60)}h / {Math.floor(hoveredTask.task.timeEstimate/60)}h</span></div>
                    )}
                    {hoveredTask.task.dueDate && new Date(hoveredTask.task.dueDate) < today && hoveredTask.task.status !== "done" && (
                      <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-gray-700"><AlertCircle className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-300">Quá hạn!</span></div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   OKR VIEW — Objectives & Key Results (FULL)
   ================================================================ */
interface OKRObjective {
  id: string; title: string; description: string; owner: string;
  status: "on_track" | "at_risk" | "behind"; quarter: string; keyResults: OKRKeyResult[];
}
interface OKRKeyResult {
  id: string; title: string; current: number; target: number; unit: string;
  status: "on_track" | "at_risk" | "behind" | "done";
}

const initialObjectives: OKRObjective[] = [
  { id: "obj1", title: "Tăng trưởng doanh thu Q1", description: "Đạt mục tiêu doanh thu Q1 bằng cách mở rộng thị trường", owner: "u1", status: "on_track", quarter: "Q1 2026",
    keyResults: [
      { id: "kr1", title: "Tăng MRR lên 500 triệu VND", current: 380, target: 500, unit: "tr VND", status: "on_track" },
      { id: "kr2", title: "Đạt 1,000 khách hàng mới", current: 820, target: 1000, unit: "KH", status: "on_track" },
      { id: "kr3", title: "Giảm churn rate xuống dưới 3%", current: 3.2, target: 3, unit: "%", status: "at_risk" },
    ],
  },
  { id: "obj2", title: "Nâng cao chất lượng sản phẩm", description: "Cải thiện UX và giảm lỗi để tăng sự hài lòng", owner: "u3", status: "at_risk", quarter: "Q1 2026",
    keyResults: [
      { id: "kr4", title: "Đạt NPS score >= 65", current: 52, target: 65, unit: "điểm", status: "behind" },
      { id: "kr5", title: "Giảm bug critical còn 0", current: 2, target: 0, unit: "bugs", status: "at_risk" },
      { id: "kr6", title: "Test coverage đạt 85%", current: 78, target: 85, unit: "%", status: "on_track" },
      { id: "kr7", title: "Response time < 200ms", current: 230, target: 200, unit: "ms", status: "at_risk" },
    ],
  },
  { id: "obj3", title: "Xây dựng đội ngũ xuất sắc", description: "Tuyển dụng và phát triển nhân tài", owner: "u1", status: "on_track", quarter: "Q1 2026",
    keyResults: [
      { id: "kr8", title: "Tuyển 5 kỹ sư senior", current: 4, target: 5, unit: "người", status: "on_track" },
      { id: "kr9", title: "Hoàn thành chương trình mentoring", current: 100, target: 100, unit: "%", status: "done" },
      { id: "kr10", title: "Employee satisfaction >= 4.2/5", current: 4.3, target: 4.2, unit: "/5", status: "done" },
    ],
  },
  { id: "obj4", title: "Ra mắt tính năng AI Assistant", description: "Phát triển và triển khai AI hỗ trợ quản lý dự án", owner: "u4", status: "behind", quarter: "Q1 2026",
    keyResults: [
      { id: "kr11", title: "Hoàn thành MVP AI module", current: 40, target: 100, unit: "%", status: "behind" },
      { id: "kr12", title: "Accuracy phân loại task >= 90%", current: 72, target: 90, unit: "%", status: "behind" },
      { id: "kr13", title: "10 beta users sử dụng thành công", current: 3, target: 10, unit: "users", status: "behind" },
    ],
  },
];

export function OKRView() {
  const [objectives, setObjectives] = useState<OKRObjective[]>(initialObjectives);
  const [expandedObj, setExpandedObj] = useState<string[]>(["obj1", "obj2"]);
  const [selectedQuarter, setSelectedQuarter] = useState("Q1 2026");
  const [filterStatus, setFilterStatus] = useState<"all" | "on_track" | "at_risk" | "behind">("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [showObjModal, setShowObjModal] = useState(false);
  const [editingObj, setEditingObj] = useState<OKRObjective | null>(null);
  const [checkInKr, setCheckInKr] = useState<{ objId: string; kr: OKRKeyResult } | null>(null);
  const [checkInValue, setCheckInValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [objForm, setObjForm] = useState({ title: "", description: "", owner: "u1", quarter: "Q1 2026" });
  const [addKrFor, setAddKrFor] = useState<string | null>(null);
  const [krForm, setKrForm] = useState({ title: "", target: "", unit: "" });
  const [contextMenu, setContextMenu] = useState<{ objId: string; x: number; y: number } | null>(null);

  const toggleExpand = (id: string) => setExpandedObj(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const okrStatusCfg = {
    on_track: { label: "Đúng tiến độ", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
    at_risk: { label: "Có rủi ro", color: "#d97706", bg: "#fefce8", border: "#fde68a" },
    behind: { label: "Chậm tiến độ", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    done: { label: "Hoàn thành", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  };

  const getObjProgress = (obj: OKRObjective) => {
    if (obj.keyResults.length === 0) return 0;
    const total = obj.keyResults.reduce((sum, kr) => sum + Math.min(100, Math.round((kr.current / Math.max(1, kr.target)) * 100)), 0);
    return Math.round(total / obj.keyResults.length);
  };
  const getObjStatus = (p: number): "on_track" | "at_risk" | "behind" => p >= 70 ? "on_track" : p >= 40 ? "at_risk" : "behind";

  const filtered = objectives.filter(o => {
    if (o.quarter !== selectedQuarter) return false;
    if (filterStatus !== "all" && getObjStatus(getObjProgress(o)) !== filterStatus) return false;
    if (filterOwner !== "all" && o.owner !== filterOwner) return false;
    return true;
  });

  const allQ = objectives.filter(o => o.quarter === selectedQuarter);
  const overallProgress = allQ.length > 0 ? Math.round(allQ.reduce((s, o) => s + getObjProgress(o), 0) / allQ.length) : 0;
  const onTrackCount = allQ.filter(o => getObjStatus(getObjProgress(o)) === "on_track").length;
  const atRiskCount = allQ.filter(o => getObjStatus(getObjProgress(o)) === "at_risk").length;
  const behindCount = allQ.filter(o => getObjStatus(getObjProgress(o)) === "behind").length;
  const ownerIds = [...new Set(objectives.map(o => o.owner))];

  const handleSaveObj = () => {
    if (!objForm.title.trim()) return;
    if (editingObj) {
      setObjectives(prev => prev.map(o => o.id === editingObj.id ? { ...o, title: objForm.title, description: objForm.description, owner: objForm.owner, quarter: objForm.quarter } : o));
    } else {
      const n: OKRObjective = { id: `obj_${Date.now()}`, title: objForm.title, description: objForm.description, owner: objForm.owner, status: "on_track", quarter: objForm.quarter, keyResults: [] };
      setObjectives(prev => [...prev, n]); setExpandedObj(prev => [...prev, n.id]);
    }
    setShowObjModal(false); setEditingObj(null); setObjForm({ title: "", description: "", owner: "u1", quarter: selectedQuarter });
  };

  const handleDeleteObj = (id: string) => { setObjectives(prev => prev.filter(o => o.id !== id)); setDeleteConfirm(null); };

  const handleCheckIn = () => {
    if (!checkInKr) return;
    const nv = parseFloat(checkInValue); if (isNaN(nv)) return;
    setObjectives(prev => prev.map(o => {
      if (o.id !== checkInKr.objId) return o;
      return { ...o, keyResults: o.keyResults.map(kr => {
        if (kr.id !== checkInKr.kr.id) return kr;
        const pct = Math.min(100, Math.round((nv / Math.max(1, kr.target)) * 100));
        const ns: OKRKeyResult["status"] = pct >= 100 ? "done" : pct >= 70 ? "on_track" : pct >= 40 ? "at_risk" : "behind";
        return { ...kr, current: nv, status: ns };
      })};
    }));
    setCheckInKr(null); setCheckInValue("");
  };

  const handleAddKr = () => {
    if (!addKrFor || !krForm.title.trim() || !krForm.target) return;
    const nk: OKRKeyResult = { id: `kr_${Date.now()}`, title: krForm.title, current: 0, target: parseFloat(krForm.target), unit: krForm.unit || "", status: "behind" };
    setObjectives(prev => prev.map(o => o.id === addKrFor ? { ...o, keyResults: [...o.keyResults, nk] } : o));
    setAddKrFor(null); setKrForm({ title: "", target: "", unit: "" });
  };

  const handleDeleteKr = (objId: string, krId: string) => setObjectives(prev => prev.map(o => o.id === objId ? { ...o, keyResults: o.keyResults.filter(kr => kr.id !== krId) } : o));

  const openEditObj = (obj: OKRObjective) => {
    setEditingObj(obj); setObjForm({ title: obj.title, description: obj.description, owner: obj.owner, quarter: obj.quarter });
    setShowObjModal(true); setContextMenu(null);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setContextMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-gray-900 tracking-tight flex items-center gap-2"><Target className="w-5 h-5 text-cyan-600" /> OKR — Mục tiêu & Kết quả then chốt</h2>
            <p className="text-[12px] text-gray-400 mt-1">Theo dõi mục tiêu chiến lược của dự án</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {([{ k: "all" as const, l: "Tất cả" }, { k: "on_track" as const, l: "Đúng" }, { k: "at_risk" as const, l: "Rủi ro" }, { k: "behind" as const, l: "Chậm" }]).map(f => (
                <button key={f.k} onClick={() => setFilterStatus(f.k)} className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${filterStatus === f.k ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>{f.l}</button>
              ))}
            </div>
            <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
              <option value="all">Tất cả owner</option>
              {ownerIds.map(uid => { const m = teamMembers.find(t => t.id === uid); return m ? <option key={uid} value={uid}>{m.name}</option> : null; })}
            </select>
            <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
              <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option>
            </select>
            <button onClick={() => { setEditingObj(null); setObjForm({ title: "", description: "", owner: "u1", quarter: selectedQuarter }); setShowObjModal(true); }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[12px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Thêm OKR
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl text-cyan-700 tracking-tight">{overallProgress}%</p>
            <p className="text-[11px] text-gray-500 mt-1">Tổng tiến độ</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all" style={{ width: `${overallProgress}%` }} /></div>
          </div>
          {[{ l: "Đúng tiến độ", c: onTrackCount, cl: "text-emerald-600" }, { l: "Có rủi ro", c: atRiskCount, cl: "text-amber-600" }, { l: "Chậm tiến độ", c: behindCount, cl: "text-red-600" }].map(s => (
            <div key={s.l} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm"><p className={`text-2xl tracking-tight ${s.cl}`}>{s.c}</p><p className="text-[11px] text-gray-500 mt-1">{s.l}</p></div>
          ))}
        </div>

        {/* OKR List */}
        <div className="space-y-4">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Target className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-[13px]">Không có OKR nào phù hợp bộ lọc</p></div>}
          {filtered.map(obj => {
            const owner = teamMembers.find(m => m.id === obj.owner);
            const progress = getObjProgress(obj);
            const sc = okrStatusCfg[getObjStatus(progress)];
            const isExp = expandedObj.includes(obj.id);
            return (
              <div key={obj.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group/obj">
                <div className="p-5 cursor-pointer hover:bg-gray-50/50 transition-all" onClick={() => toggleExpand(obj.id)}>
                  <div className="flex items-start gap-3">
                    <button className="mt-0.5 shrink-0 text-gray-400">{isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-cyan-600 shrink-0" />
                        <h3 className="text-[14px] text-gray-800 tracking-tight">{obj.title}</h3>
                        <span className="text-[9px] px-2 py-0.5 rounded-full border" style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}>{sc.label}</span>
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{obj.keyResults.length} KR</span>
                      </div>
                      <p className="text-[11px] text-gray-500 ml-6">{obj.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {owner && <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: owner.color }}>{owner.name.charAt(0)}</div><span className="text-[11px] text-gray-500">{owner.name}</span></div>}
                      <p className="text-[16px] tracking-tight" style={{ color: sc.color }}>{progress}%</p>
                      <button onClick={e => { e.stopPropagation(); setContextMenu(contextMenu?.objId === obj.id ? null : { objId: obj.id, x: e.clientX, y: e.clientY }); }}
                        className="opacity-0 group-hover/obj:opacity-100 transition-all p-1 hover:bg-gray-100 rounded-lg"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                    </div>
                  </div>
                  <div className="mt-3 ml-7 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: sc.color }} /></div>
                </div>
                {isExp && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    {obj.keyResults.map((kr, ki) => {
                      const ks = okrStatusCfg[kr.status];
                      const pct = kr.target === 0 ? (kr.current === 0 ? 100 : 0) : Math.min(100, Math.round((kr.current / kr.target) * 100));
                      return (
                        <div key={kr.id} className={`flex items-center gap-4 px-5 py-3 ml-7 group/kr hover:bg-gray-50 transition-all ${ki < obj.keyResults.length - 1 ? "border-b border-gray-100" : ""}`}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ks.bg }}>
                            {kr.status === "done" ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ks.color }} /> : <TrendingUp className="w-3 h-3" style={{ color: ks.color }} />}
                          </div>
                          <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-700">{kr.title}</p></div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => { setCheckInKr({ objId: obj.id, kr }); setCheckInValue(String(kr.current)); }}
                              className="opacity-0 group-hover/kr:opacity-100 text-[9px] text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md hover:bg-cyan-100 transition-all">Check-in</button>
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ks.color }} /></div>
                            <span className="text-[10px] w-[90px] text-right tabular-nums" style={{ color: ks.color }}>{kr.current} / {kr.target} {kr.unit}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md min-w-[36px] text-center" style={{ color: ks.color, backgroundColor: ks.bg }}>{pct}%</span>
                            <button onClick={() => handleDeleteKr(obj.id, kr.id)} className="opacity-0 group-hover/kr:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"><X className="w-3 h-3" /></button>
                          </div>
                        </div>
                      );
                    })}
                    {addKrFor === obj.id ? (
                      <div className="px-5 py-3 ml-7 border-t border-gray-100 flex items-center gap-2">
                        <input value={krForm.title} onChange={e => setKrForm(p => ({ ...p, title: e.target.value }))} placeholder="Tên Key Result..." className="flex-1 text-[12px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400" autoFocus />
                        <input value={krForm.target} onChange={e => setKrForm(p => ({ ...p, target: e.target.value }))} type="number" placeholder="Mục tiêu" className="w-20 text-[12px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400" />
                        <input value={krForm.unit} onChange={e => setKrForm(p => ({ ...p, unit: e.target.value }))} placeholder="Đơn vị" className="w-16 text-[12px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400" />
                        <button onClick={handleAddKr} className="text-[11px] text-white bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 rounded-lg transition-all">Thêm</button>
                        <button onClick={() => { setAddKrFor(null); setKrForm({ title: "", target: "", unit: "" }); }} className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1.5">Hủy</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddKrFor(obj.id)} className="w-full text-left px-5 py-2.5 ml-7 border-t border-gray-100 text-[11px] text-gray-400 hover:text-cyan-600 hover:bg-gray-50 transition-all flex items-center gap-1.5"><Plus className="w-3 h-3" /> Thêm Key Result</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[160px]" style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { const o = objectives.find(o => o.id === contextMenu.objId); if (o) openEditObj(o); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-all"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Chỉnh sửa</button>
          <button onClick={() => { setDeleteConfirm(contextMenu.objId); setContextMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /> Xóa Objective</button>
        </div>
      )}

      {/* Add/Edit Objective Modal */}
      {showObjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowObjModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] text-gray-800 tracking-tight">{editingObj ? "Chỉnh sửa Objective" : "Thêm Objective mới"}</h3>
              <button onClick={() => setShowObjModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[11px] text-gray-500 mb-1.5 block">Tiêu đề *</label>
                <input value={objForm.title} onChange={e => setObjForm(p => ({ ...p, title: e.target.value }))} className="w-full text-[13px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" placeholder="VD: Tăng trưởng doanh thu Q2" autoFocus /></div>
              <div><label className="text-[11px] text-gray-500 mb-1.5 block">Mô tả</label>
                <textarea value={objForm.description} onChange={e => setObjForm(p => ({ ...p, description: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 resize-none h-20" placeholder="Mô tả chi tiết..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-gray-500 mb-1.5 block">Người sở hữu</label>
                  <select value={objForm.owner} onChange={e => setObjForm(p => ({ ...p, owner: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400">
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className="text-[11px] text-gray-500 mb-1.5 block">Quarter</label>
                  <select value={objForm.quarter} onChange={e => setObjForm(p => ({ ...p, quarter: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400">
                    <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option></select></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowObjModal(false)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all">Hủy</button>
              <button onClick={handleSaveObj} className="text-[12px] text-white bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm">{editingObj ? "Lưu thay đổi" : "Tạo Objective"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {checkInKr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setCheckInKr(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] text-gray-800 tracking-tight">Check-in Key Result</h3>
              <button onClick={() => setCheckInKr(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[12px] text-gray-600 mb-4">{checkInKr.kr.title}</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1"><label className="text-[10px] text-gray-400 mb-1 block">Giá trị hiện tại</label>
                <input value={checkInValue} onChange={e => setCheckInValue(e.target.value)} type="number" step="any" className="w-full text-[14px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" autoFocus /></div>
              <div><label className="text-[10px] text-gray-400 mb-1 block">Mục tiêu</label>
                <div className="text-[14px] text-gray-500 py-2.5 px-3">{checkInKr.kr.target} {checkInKr.kr.unit}</div></div>
            </div>
            {(() => { const nv = parseFloat(checkInValue); const pct = isNaN(nv) ? 0 : Math.min(100, Math.round((nv / Math.max(1, checkInKr.kr.target)) * 100)); return (
              <div className="mb-5"><div className="flex items-center justify-between text-[10px] text-gray-400 mb-1"><span>Tiến độ mới</span><span>{pct}%</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} /></div></div>
            ); })()}
            <div className="flex justify-end gap-2">
              <button onClick={() => setCheckInKr(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all">Hủy</button>
              <button onClick={handleCheckIn} className="text-[12px] text-white bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm">Cập nhật</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-[14px] text-gray-800">Xóa Objective?</h3><p className="text-[11px] text-gray-500 mt-0.5">Hành động này không thể hoàn tác.</p></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all">Hủy</button>
              <button onClick={() => handleDeleteObj(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl transition-all shadow-sm">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MEETING VIEW — Họp trực tuyến
   ================================================================ */
interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: "video" | "audio" | "screen";
  status: "upcoming" | "live" | "ended";
  organizer: string;
  participants: string[];
  agenda?: string[];
  recording?: boolean;
  notes?: string;
}

const mockMeetings: Meeting[] = [
  {
    id: "m1", title: "Sprint Planning - Sprint 8", date: "2026-03-17", time: "09:00",
    duration: "1h", type: "video", status: "live", organizer: "u1",
    participants: ["u1", "u2", "u3", "u4", "u5"],
    agenda: ["Review Sprint 7", "Xác định scope Sprint 8", "Assign tasks", "Timeline & deadlines"],
    recording: true,
  },
  {
    id: "m2", title: "Design Review - Homepage", date: "2026-03-17", time: "14:00",
    duration: "45m", type: "video", status: "upcoming", organizer: "u2",
    participants: ["u2", "u1", "u3"],
    agenda: ["Review wireframes", "Feedback design system", "Next steps"],
  },
  {
    id: "m3", title: "Tech Sync - API Architecture", date: "2026-03-17", time: "16:00",
    duration: "30m", type: "audio", status: "upcoming", organizer: "u3",
    participants: ["u3", "u4"],
    agenda: ["Review microservices", "Database optimization", "Performance benchmarks"],
  },
  {
    id: "m4", title: "Daily Standup", date: "2026-03-18", time: "09:00",
    duration: "15m", type: "video", status: "upcoming", organizer: "u1",
    participants: ["u1", "u2", "u3", "u4", "u5"],
  },
  {
    id: "m5", title: "Retrospective Sprint 7", date: "2026-03-16", time: "15:00",
    duration: "1h", type: "video", status: "ended", organizer: "u1",
    participants: ["u1", "u2", "u3", "u4", "u5"],
    recording: true,
    notes: "- Cần cải thiện code review process\n- Auto-deploy hoạt động tốt\n- Estimation accuracy cần nâng cao",
  },
  {
    id: "m6", title: "1-on-1: Minh & Phúc", date: "2026-03-16", time: "10:00",
    duration: "30m", type: "audio", status: "ended", organizer: "u1",
    participants: ["u1", "u3"],
    notes: "Thảo luận về career path và training plan Q2",
  },
];

export function MeetingView() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const upcoming = mockMeetings.filter(m => m.status !== "ended");
  const past = mockMeetings.filter(m => m.status === "ended");

  const liveMeeting = mockMeetings.find(m => m.status === "live");

  const typeIcons = { video: <Video className="w-3.5 h-3.5" />, audio: <Phone className="w-3.5 h-3.5" />, screen: <Monitor className="w-3.5 h-3.5" /> };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900 tracking-tight flex items-center gap-2">
              <Video className="w-5 h-5 text-violet-600" /> Họp trực tuyến
            </h2>
            <p className="text-[12px] text-gray-400 mt-1">Quản lý cuộc họp, ghi chú & bản ghi</p>
          </div>
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[12px] px-4 py-2 rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all shadow-sm">
            <Video className="w-3.5 h-3.5" /> Tạo cuộc họp
          </button>
        </div>

        {/* Live meeting banner */}
        {liveMeeting && (
          <div className="mb-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-3 right-4 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] text-white/90">TRỰC TIẾP</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] tracking-tight">{liveMeeting.title}</h3>
                <p className="text-[12px] text-white/80 mt-0.5">
                  Bắt đầu lúc {liveMeeting.time} · {liveMeeting.duration} · {liveMeeting.participants.length} người tham gia
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {liveMeeting.participants.map(pid => {
                    const m = teamMembers.find(u => u.id === pid);
                    return m ? (
                      <div key={pid} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white border-2 border-white/30" style={{ backgroundColor: m.color }}>
                        {m.name.charAt(0)}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                  <Mic className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                  <Video className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                  <Monitor className="w-4 h-4" />
                </button>
                <button className="px-4 py-2.5 bg-white text-red-600 text-[12px] rounded-xl hover:bg-gray-100 transition-all ml-2">
                  Tham gia
                </button>
              </div>
            </div>
            {liveMeeting.agenda && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-[10px] text-white/60 uppercase mb-1.5">Chương trình họp</p>
                <div className="flex flex-wrap gap-2">
                  {liveMeeting.agenda.map((a, i) => (
                    <span key={i} className="text-[11px] bg-white/15 px-2.5 py-1 rounded-lg">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab switch */}
        <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-lg p-0.5 w-fit">
          <button onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-1.5 text-[12px] rounded-md transition-all ${activeTab === "upcoming" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
            Sắp tới ({upcoming.length})
          </button>
          <button onClick={() => setActiveTab("past")}
            className={`px-4 py-1.5 text-[12px] rounded-md transition-all ${activeTab === "past" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
            Đã kết thúc ({past.length})
          </button>
        </div>

        {/* Meeting list */}
        <div className="space-y-3">
          {(activeTab === "upcoming" ? upcoming : past).map(meeting => {
            const org = teamMembers.find(m => m.id === meeting.organizer);
            return (
              <div key={meeting.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer shadow-sm"
                onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    meeting.status === "live" ? "bg-red-50 text-red-500" : meeting.status === "ended" ? "bg-gray-100 text-gray-400" : "bg-violet-50 text-violet-500"
                  }`}>
                    {typeIcons[meeting.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] text-gray-800">{meeting.title}</h4>
                      {meeting.status === "live" && (
                        <span className="text-[9px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                        </span>
                      )}
                      {meeting.recording && <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">REC</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {meeting.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meeting.time}</span>
                      <span>{meeting.duration}</span>
                      {org && <span>Tổ chức bởi {org.name}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {meeting.participants.slice(0, 5).map(pid => {
                        const m = teamMembers.find(u => u.id === pid);
                        return m ? (
                          <div key={pid} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white border-2 border-white shadow-sm" style={{ backgroundColor: m.color }}>
                            {m.name.charAt(0)}
                          </div>
                        ) : null;
                      })}
                      {meeting.participants.length > 5 && (
                        <span className="text-[10px] text-gray-400 ml-1">+{meeting.participants.length - 5}</span>
                      )}
                    </div>
                  </div>
                  {meeting.status === "upcoming" && (
                    <button className="px-3 py-1.5 text-[11px] bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-all border border-violet-100">
                      Tham gia
                    </button>
                  )}
                </div>

                {/* Expanded details */}
                {selectedMeeting?.id === meeting.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {meeting.agenda && (
                      <div className="mb-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Chương trình họp</p>
                        <div className="space-y-1.5">
                          {meeting.agenda.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-[12px] text-gray-600">
                              <div className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center text-[9px] text-violet-500 shrink-0">{i + 1}</div>
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {meeting.notes && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Ghi chú cuộc họp</p>
                        <div className="bg-gray-50 rounded-xl p-3 text-[12px] text-gray-600 whitespace-pre-wrap border border-gray-100">
                          {meeting.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   DOCS PROJECT VIEW — Tài liệu dự án (FULL)
   ================================================================ */
interface DocItem {
  id: string; title: string; type: "doc" | "wiki" | "spec" | "note" | "folder"; author: string;
  updatedAt: string; status: "draft" | "review" | "published"; views: number; icon: string; color: string;
  content?: string; pinned?: boolean;
}

const initialDocs: DocItem[] = [
  { id: "d1", title: "Product Requirements Document", type: "spec", author: "u1", updatedAt: "2h ago", status: "published", views: 42, icon: "📋", color: "#0891b2", pinned: true,
    content: "## Tổng quan\nTài liệu mô tả yêu cầu sản phẩm v2.0.\n\n### Mục tiêu\n- Tăng tốc độ xử lý 50%\n- Hỗ trợ đa ngôn ngữ\n- Tích hợp AI assistant\n\n### Phạm vi\nÁp dụng cho tất cả module từ Q2/2026.\n\n### Timeline\n| Phase | Thời gian | Nội dung |\n| Phase 1 | T4/2026 | Core features |\n| Phase 2 | T5/2026 | AI integration |" },
  { id: "d2", title: "API Documentation v2", type: "doc", author: "u3", updatedAt: "5h ago", status: "review", views: 28, icon: "🔗", color: "#059669",
    content: "## API Endpoints\n\n### Authentication\n`POST /api/auth/login` — Đăng nhập\n`POST /api/auth/register` — Đăng ký\n\n### Tasks\n`GET /api/tasks` — Lấy danh sách\n`POST /api/tasks` — Tạo task mới\n`PUT /api/tasks/:id` — Cập nhật\n`DELETE /api/tasks/:id` — Xóa" },
  { id: "d3", title: "Design System Guidelines", type: "wiki", author: "u2", updatedAt: "1d ago", status: "published", views: 67, icon: "🎨", color: "#7c3aed", pinned: true,
    content: "## Nguyên tắc thiết kế\n\n### Colors\n- Primary: Cyan (#0891b2)\n- Success: Emerald (#059669)\n- Warning: Amber (#d97706)\n\n### Typography\n- Font: Inter\n- Heading: 600 weight\n- Body: 400 weight" },
  { id: "d4", title: "Sprint Retro Notes - Sprint 7", type: "note", author: "u1", updatedAt: "1d ago", status: "published", views: 15, icon: "📝", color: "#d97706",
    content: "## Sprint 7 Retrospective\n\n### Went well ✅\n- Deploy automation hoạt động tốt\n- Team collaboration cải thiện\n\n### Needs improvement ⚠️\n- Code review chậm\n- Estimation cần nâng cao\n\n### Action items\n1. Setup auto-review bot\n2. Training estimation" },
  { id: "d5", title: "Architecture Decision Records", type: "wiki", author: "u3", updatedAt: "3d ago", status: "published", views: 31, icon: "🏗️", color: "#4f46e5",
    content: "## ADR-001: Chọn React + TypeScript\n**Status:** Accepted\n**Context:** Cần framework scalable\n**Decision:** React 18 + TypeScript 5\n\n## ADR-002: Database\n**Status:** Accepted\n**Decision:** PostgreSQL + Supabase" },
  { id: "d6", title: "Onboarding Checklist", type: "doc", author: "u1", updatedAt: "1w ago", status: "published", views: 89, icon: "✅", color: "#db2777",
    content: "## Checklist thành viên mới\n\n- [ ] Setup dev environment\n- [ ] Đọc Design System Guidelines\n- [ ] Clone repositories\n- [ ] Tham gia Slack channels\n- [ ] Review Product Requirements\n- [ ] Pair programming session" },
  { id: "d7", title: "Database Schema Design", type: "spec", author: "u4", updatedAt: "2d ago", status: "draft", views: 8, icon: "🗄️", color: "#0891b2",
    content: "## Schema v2\n\n### Users table\n- id (UUID)\n- email (VARCHAR)\n- name (VARCHAR)\n- role (ENUM)\n\n### Tasks table\n- id (UUID)\n- title (VARCHAR)\n- status (ENUM)\n- assignee_id (FK → Users)" },
  { id: "d8", title: "Testing Strategy", type: "doc", author: "u5", updatedAt: "4d ago", status: "review", views: 12, icon: "🧪", color: "#dc2626",
    content: "## Testing Strategy\n\n### Unit Tests\n- Jest + React Testing Library\n- Coverage target: 85%\n\n### E2E Tests\n- Playwright\n- Critical user flows" },
];

const docTemplates = [
  { id: "t1", title: "Tài liệu trống", icon: "📄", content: "" },
  { id: "t2", title: "PRD Template", icon: "📋", content: "## Tổng quan\n\n## Mục tiêu\n\n## User Stories\n\n## Acceptance Criteria\n\n## Timeline" },
  { id: "t3", title: "Meeting Notes", icon: "📝", content: "## Cuộc họp: [Tên]\n**Ngày:** \n**Người tham gia:** \n\n## Nội dung\n\n## Quyết định\n\n## Action Items\n- [ ] " },
  { id: "t4", title: "API Spec", icon: "🔗", content: "## API: [Tên]\n\n### Endpoint\n`METHOD /path`\n\n### Request\n```json\n{}\n```\n\n### Response\n```json\n{}\n```" },
  { id: "t5", title: "ADR Template", icon: "🏗️", content: "## ADR-XXX: [Tiêu đề]\n\n**Status:** Proposed\n\n### Context\n\n### Decision\n\n### Consequences" },
];

export function ProjectDocsView() {
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | DocItem["type"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | DocItem["status"]>("all");
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ title: "", type: "doc" as DocItem["type"] });
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ docId: string; x: number; y: number } | null>(null);

  const dStatusCfg = { draft: { label: "Bản nháp", color: "#94a3b8", bg: "#f1f5f9" }, review: { label: "Đang review", color: "#d97706", bg: "#fefce8" }, published: { label: "Đã xuất bản", color: "#059669", bg: "#ecfdf5" } };
  const dTypeCfg: Record<string, { label: string; icon: string }> = { doc: { label: "Tài liệu", icon: "📄" }, wiki: { label: "Wiki", icon: "📖" }, spec: { label: "Spec", icon: "📋" }, note: { label: "Ghi chú", icon: "📝" }, folder: { label: "Thư mục", icon: "📁" } };

  const filtered = docs.filter(d => {
    if (!d.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filterType !== "all" && d.type !== filterType) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  });
  const pinnedDocs = filtered.filter(d => d.pinned);
  const unpinnedDocs = filtered.filter(d => !d.pinned);

  const handleCreate = (templateContent: string) => {
    if (!createForm.title.trim()) return;
    const nd: DocItem = { id: `d_${Date.now()}`, title: createForm.title, type: createForm.type, author: "u1", updatedAt: "Vừa xong", status: "draft", views: 0, icon: dTypeCfg[createForm.type]?.icon || "📄", color: "#0891b2", content: templateContent };
    setDocs(prev => [nd, ...prev]); setShowCreateModal(false); setCreateForm({ title: "", type: "doc" });
    setSelectedDoc(nd); setEditingDoc(nd); setEditContent(templateContent); setEditTitle(nd.title);
  };
  const handleSaveEdit = () => { if (!editingDoc) return; setDocs(prev => prev.map(d => d.id === editingDoc.id ? { ...d, title: editTitle, content: editContent, updatedAt: "Vừa xong" } : d)); setSelectedDoc({ ...editingDoc, title: editTitle, content: editContent, updatedAt: "Vừa xong" }); setEditingDoc(null); };
  const handleDelete = (id: string) => { setDocs(prev => prev.filter(d => d.id !== id)); if (selectedDoc?.id === id) setSelectedDoc(null); setDeleteConfirm(null); };
  const togglePin = (id: string) => { setDocs(prev => prev.map(d => d.id === id ? { ...d, pinned: !d.pinned } : d)); setCtxMenu(null); };
  const cycleStatus = (id: string) => { const o: DocItem["status"][] = ["draft", "review", "published"]; setDocs(prev => prev.map(d => d.id !== id ? d : { ...d, status: o[(o.indexOf(d.status) + 1) % 3] })); setCtxMenu(null); };

  const renderContent = (content: string) => content.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="text-[15px] text-gray-800 mt-4 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-[13px] text-gray-700 mt-3 mb-1.5">{line.slice(4)}</h3>;
    if (line.startsWith("- [ ] ")) return <div key={i} className="flex items-center gap-2 py-0.5 ml-2"><div className="w-3.5 h-3.5 border border-gray-300 rounded" /><span className="text-[12px] text-gray-600">{line.slice(6)}</span></div>;
    if (line.startsWith("- ")) return <div key={i} className="flex items-start gap-2 py-0.5 ml-2"><span className="text-gray-400 mt-0.5">•</span><span className="text-[12px] text-gray-600">{line.slice(2)}</span></div>;
    if (line.startsWith("`") && line.endsWith("`")) return <code key={i} className="block text-[11px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded my-0.5">{line.slice(1, -1)}</code>;
    if (line.startsWith("|")) return <div key={i} className="text-[11px] text-gray-600 font-mono bg-gray-50 px-2 py-0.5 border-b border-gray-100">{line}</div>;
    if (line.startsWith("**") && line.includes(":**")) { const parts = line.split(":**"); return <div key={i} className="text-[12px] py-0.5"><span className="text-gray-700">{parts[0].replace(/\*/g, "")}:</span><span className="text-gray-500">{parts[1]}</span></div>; }
    if (line.match(/^\d+\. /)) return <div key={i} className="text-[12px] text-gray-600 ml-2 py-0.5">{line}</div>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} className="text-[12px] text-gray-600 leading-relaxed">{line}</p>;
  });

  const DocCard = ({ doc }: { doc: DocItem }) => {
    const author = teamMembers.find(m => m.id === doc.author);
    const sc = dStatusCfg[doc.status];
    return (
      <div onClick={() => { setSelectedDoc(doc); setEditingDoc(null); }}
        className={`bg-white rounded-xl border p-3.5 hover:shadow-md transition-all cursor-pointer group/doc ${selectedDoc?.id === doc.id ? "border-cyan-300 shadow-md ring-1 ring-cyan-100" : "border-gray-200 shadow-sm"}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2"><span className="text-lg">{doc.icon}</span>{doc.pinned && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}</div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
            <button onClick={e => { e.stopPropagation(); setCtxMenu({ docId: doc.id, x: e.clientX, y: e.clientY }); }} className="opacity-0 group-hover/doc:opacity-100 p-0.5 hover:bg-gray-100 rounded"><MoreHorizontal className="w-3 h-3 text-gray-400" /></button>
          </div>
        </div>
        <h4 className="text-[12px] text-gray-800 mb-1 leading-snug">{doc.title}</h4>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-[9px] text-gray-400">{author && <><div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: author.color }}>{author.name.charAt(0)}</div><span>{author.name}</span></>}</div>
          <div className="flex items-center gap-2 text-[9px] text-gray-400"><span>{doc.updatedAt}</span><span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{doc.views}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50/50" onClick={() => setCtxMenu(null)}>
      {/* Left panel */}
      <div className={`flex flex-col overflow-hidden ${selectedDoc ? "w-[380px] border-r border-gray-200" : "flex-1"}`}>
        <div className="p-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-gray-900 tracking-tight flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Tài liệu dự án</h2><p className="text-[12px] text-gray-400 mt-1">Wiki, specs & tài liệu kỹ thuật</p></div>
            <button onClick={() => { setCreateForm({ title: "", type: "doc" }); setShowCreateModal(true); }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[12px] px-3.5 py-1.5 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 transition-all"><Plus className="w-3.5 h-3.5" /> Tạo mới</button>
          </div>
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm tài liệu..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {([{ k: "all" as const, l: "Tất cả" }, { k: "doc" as const, l: "📄" }, { k: "wiki" as const, l: "📖" }, { k: "spec" as const, l: "📋" }, { k: "note" as const, l: "📝" }]).map(f => (
                <button key={f.k} onClick={() => setFilterType(f.k)} className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${filterType === f.k ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>{f.l}</button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {([{ k: "all" as const, l: "Tất cả" }, { k: "draft" as const, l: "Nháp" }, { k: "review" as const, l: "Review" }, { k: "published" as const, l: "Xuất bản" }]).map(f => (
                <button key={f.k} onClick={() => setFilterStatus(f.k)} className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${filterStatus === f.k ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>{f.l}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-2">
            <span>{docs.length} tài liệu</span><span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {docs.reduce((s, d) => s + d.views, 0)}</span><span className="text-emerald-500">{docs.filter(d => d.status === "published").length} xuất bản</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-5 pb-5">
          {pinnedDocs.length > 0 && <><p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Đã ghim</p>
            <div className={`mb-4 ${selectedDoc ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}`}>{pinnedDocs.map(d => <DocCard key={d.id} doc={d} />)}</div></>}
          {unpinnedDocs.length > 0 && <>{pinnedDocs.length > 0 && <p className="text-[10px] text-gray-400 mb-2">Tất cả tài liệu</p>}
            <div className={`${selectedDoc ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}`}>
              {unpinnedDocs.map(d => <DocCard key={d.id} doc={d} />)}
              <div onClick={() => { setCreateForm({ title: "", type: "doc" }); setShowCreateModal(true); }}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all cursor-pointer min-h-[100px]">
                <Plus className="w-5 h-5 text-cyan-400" /><p className="text-[11px] text-gray-400">Tạo tài liệu mới</p></div>
            </div></>}
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-[13px]">Không tìm thấy tài liệu</p></div>}
        </div>
      </div>

      {/* Right panel — Document detail */}
      {selectedDoc && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedDoc.icon}</span>
                <div>
                  {editingDoc ? <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-[15px] text-gray-800 border-b border-cyan-300 focus:outline-none bg-transparent w-full" />
                    : <h3 className="text-[15px] text-gray-800 tracking-tight">{selectedDoc.title}</h3>}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span>{dTypeCfg[selectedDoc.type]?.label}</span><span>·</span><span>{selectedDoc.updatedAt}</span><span>·</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {selectedDoc.views}</span><span>·</span>
                    {(() => { const a = teamMembers.find(m => m.id === selectedDoc.author); return a ? <span className="flex items-center gap-1"><div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: a.color }}>{a.name.charAt(0)}</div>{a.name}</span> : null; })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ color: dStatusCfg[selectedDoc.status].color, backgroundColor: dStatusCfg[selectedDoc.status].bg }}>{dStatusCfg[selectedDoc.status].label}</span>
                {editingDoc ? <>
                  <button onClick={handleSaveEdit} className="text-[11px] text-white bg-cyan-500 hover:bg-cyan-600 px-3 py-1 rounded-lg transition-all">Lưu</button>
                  <button onClick={() => setEditingDoc(null)} className="text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1">Hủy</button>
                </> : <>
                  <button onClick={() => { setEditingDoc(selectedDoc); setEditContent(selectedDoc.content || ""); setEditTitle(selectedDoc.title); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit3 className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Share2 className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Download className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedDoc(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </>}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-6 py-5">
            {editingDoc ? <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              className="w-full h-full text-[12px] text-gray-700 leading-relaxed focus:outline-none resize-none font-mono bg-gray-50 rounded-xl p-4 border border-gray-200" placeholder="Nhập nội dung (Markdown)..." />
            : <div className="max-w-3xl">{selectedDoc.content ? renderContent(selectedDoc.content) : <div className="text-center py-12 text-gray-300"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-[12px]">Tài liệu trống. Click ✏️ để viết.</p></div>}</div>}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[160px]" style={{ left: Math.min(ctxMenu.x, window.innerWidth - 180), top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { const d = docs.find(x => x.id === ctxMenu.docId); if (d) { setSelectedDoc(d); setEditingDoc(d); setEditContent(d.content || ""); setEditTitle(d.title); } setCtxMenu(null); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Chỉnh sửa</button>
          <button onClick={() => togglePin(ctxMenu.docId)} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Star className="w-3.5 h-3.5 text-amber-400" /> {docs.find(d => d.id === ctxMenu.docId)?.pinned ? "Bỏ ghim" : "Ghim"}</button>
          <button onClick={() => cycleStatus(ctxMenu.docId)} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Circle className="w-3.5 h-3.5 text-gray-400" /> Đổi trạng thái</button>
          <button onClick={() => { setDeleteConfirm(ctxMenu.docId); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[15px] text-gray-800 tracking-tight">Tạo tài liệu mới</h3><button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-4">
              <div><label className="text-[11px] text-gray-500 mb-1.5 block">Tiêu đề *</label>
                <input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} className="w-full text-[13px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" placeholder="Tên tài liệu..." autoFocus /></div>
              <div><label className="text-[11px] text-gray-500 mb-1.5 block">Loại tài liệu</label>
                <div className="flex items-center gap-2">{(["doc", "wiki", "spec", "note"] as const).map(t => (
                  <button key={t} onClick={() => setCreateForm(p => ({ ...p, type: t }))} className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg border transition-all ${createForm.type === t ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>{dTypeCfg[t].icon} {dTypeCfg[t].label}</button>
                ))}</div></div>
              <div><label className="text-[11px] text-gray-500 mb-2 block">Chọn template</label>
                <div className="grid grid-cols-3 gap-2">{docTemplates.map(tmpl => (
                  <button key={tmpl.id} onClick={() => handleCreate(tmpl.content)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all"><span className="text-xl">{tmpl.icon}</span><span className="text-[10px] text-gray-600">{tmpl.title}</span></button>
                ))}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Xóa tài liệu?</h3><p className="text-[11px] text-gray-500 mt-0.5">Không thể hoàn tác.</p></div></div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Hủy</button><button onClick={() => handleDelete(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Xóa</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   EMBED VIEW — Nhúng trang web (FULL)
   ================================================================ */
interface EmbedItem {
  id: string; title: string; url: string;
  type: "website" | "figma" | "miro" | "notion" | "google" | "youtube" | "loom" | "custom";
  icon: string; addedBy: string; addedAt: string; description?: string; pinned?: boolean;
}

const initialEmbeds: EmbedItem[] = [
  { id: "e1", title: "Figma - Homepage Design", url: "https://figma.com/file/abc123", type: "figma", icon: "🎨", addedBy: "u2", addedAt: "2d ago", description: "Wireframe & UI design cho homepage v2", pinned: true },
  { id: "e2", title: "Miro - Sprint Board", url: "https://miro.com/board/xyz", type: "miro", icon: "📋", addedBy: "u1", addedAt: "1w ago", description: "Sprint planning & retro board" },
  { id: "e3", title: "Google Sheets - Budget", url: "https://docs.google.com/spreadsheets/d/abc", type: "google", icon: "📊", addedBy: "u1", addedAt: "3d ago", description: "Q2 budget tracking", pinned: true },
  { id: "e4", title: "Notion - Team Wiki", url: "https://notion.so/team-wiki", type: "notion", icon: "📖", addedBy: "u6", addedAt: "5d ago", description: "Knowledge base & SOPs" },
  { id: "e5", title: "API Status Page", url: "https://status.example.com", type: "website", icon: "🌐", addedBy: "u3", addedAt: "1w ago", description: "Uptime monitoring" },
  { id: "e6", title: "Product Demo Video", url: "https://youtube.com/watch?v=demo123", type: "youtube", icon: "▶️", addedBy: "u1", addedAt: "4d ago", description: "Demo v1.5 features" },
  { id: "e7", title: "Loom - Design Review", url: "https://loom.com/share/review456", type: "loom", icon: "🎥", addedBy: "u2", addedAt: "6d ago", description: "Design system walkthrough" },
];

const embedTypeCfg: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  figma: { label: "Figma", color: "#a259ff", bg: "#f3e8ff", icon: "🎨" },
  miro: { label: "Miro", color: "#ffd02f", bg: "#fefce8", icon: "📋" },
  google: { label: "Google", color: "#4285f4", bg: "#eff6ff", icon: "📊" },
  notion: { label: "Notion", color: "#000000", bg: "#f5f5f5", icon: "📖" },
  youtube: { label: "YouTube", color: "#ff0000", bg: "#fef2f2", icon: "▶️" },
  loom: { label: "Loom", color: "#625df5", bg: "#eef2ff", icon: "🎥" },
  website: { label: "Website", color: "#0891b2", bg: "#ecfeff", icon: "🌐" },
  custom: { label: "Custom", color: "#6b7280", bg: "#f9fafb", icon: "🔗" },
};

function detectEmbedType(url: string): { type: EmbedItem["type"]; icon: string } {
  const u = url.toLowerCase();
  if (u.includes("figma.com")) return { type: "figma", icon: "🎨" };
  if (u.includes("miro.com")) return { type: "miro", icon: "📋" };
  if (u.includes("notion.so") || u.includes("notion.site")) return { type: "notion", icon: "📖" };
  if (u.includes("docs.google") || u.includes("sheets.google") || u.includes("drive.google")) return { type: "google", icon: "📊" };
  if (u.includes("youtube.com") || u.includes("youtu.be")) return { type: "youtube", icon: "▶️" };
  if (u.includes("loom.com")) return { type: "loom", icon: "🎥" };
  return { type: "website", icon: "🌐" };
}

function validateEmbedUrl(url: string): { valid: boolean; message: string } {
  if (!url.trim()) return { valid: false, message: "URL không được để trống" };
  try { const u = new URL(url); if (!["http:", "https:"].includes(u.protocol)) return { valid: false, message: "Phải bắt đầu bằng http(s)://" }; return { valid: true, message: "" }; }
  catch { return { valid: false, message: "URL không hợp lệ" }; }
}

export function EmbedView() {
  const [embeds, setEmbeds] = useState<EmbedItem[]>(initialEmbeds);
  const [selectedEmbed, setSelectedEmbed] = useState<EmbedItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingEmbed, setEditingEmbed] = useState<EmbedItem | null>(null);
  const [addForm, setAddForm] = useState({ title: "", url: "", description: "" });
  const [addError, setAddError] = useState("");
  const [detectedType, setDetectedType] = useState<{ type: EmbedItem["type"]; icon: string } | null>(null);
  const [emCtx, setEmCtx] = useState<{ id: string; x: number; y: number } | null>(null);
  const [editForm, setEditForm] = useState({ title: "", url: "", description: "" });

  const filtered = embeds.filter(e => {
    if (!e.title.toLowerCase().includes(searchQ.toLowerCase()) && !e.url.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    return true;
  });
  const pinnedEm = filtered.filter(e => e.pinned);
  const unpinnedEm = filtered.filter(e => !e.pinned);

  const handleUrlChange = (url: string) => { setAddForm(p => ({ ...p, url })); if (url.trim()) { setDetectedType(detectEmbedType(url)); setAddError(""); } else { setDetectedType(null); } };

  const handleAdd = () => {
    const v = validateEmbedUrl(addForm.url);
    if (!v.valid) { setAddError(v.message); return; }
    if (!addForm.title.trim()) { setAddError("Tiêu đề không được để trống"); return; }
    const dt = detectEmbedType(addForm.url);
    setEmbeds(prev => [{ id: `e_${Date.now()}`, title: addForm.title, url: addForm.url, type: dt.type, icon: dt.icon, addedBy: "u1", addedAt: "Vừa xong", description: addForm.description }, ...prev]);
    setShowAddModal(false); setAddForm({ title: "", url: "", description: "" }); setDetectedType(null); setAddError("");
  };

  const handleDeleteEm = (id: string) => { setEmbeds(prev => prev.filter(e => e.id !== id)); if (selectedEmbed?.id === id) setSelectedEmbed(null); setDeleteConfirm(null); };
  const togglePinEm = (id: string) => { setEmbeds(prev => prev.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e)); setEmCtx(null); };

  const handleSaveEditEm = () => {
    if (!editingEmbed) return;
    if (!validateEmbedUrl(editForm.url).valid || !editForm.title.trim()) return;
    const dt = detectEmbedType(editForm.url);
    setEmbeds(prev => prev.map(e => e.id === editingEmbed.id ? { ...e, title: editForm.title, url: editForm.url, description: editForm.description, type: dt.type, icon: dt.icon } : e));
    if (selectedEmbed?.id === editingEmbed.id) setSelectedEmbed({ ...editingEmbed, title: editForm.title, url: editForm.url, description: editForm.description, type: dt.type, icon: dt.icon } as EmbedItem);
    setEditingEmbed(null);
  };

  const typeSet = new Set(embeds.map(e => e.type));

  const EmbedCard = ({ embed }: { embed: EmbedItem }) => {
    const adder = teamMembers.find(m => m.id === embed.addedBy);
    const tc = embedTypeCfg[embed.type] || embedTypeCfg.website;
    return (
      <div onClick={() => setSelectedEmbed(embed)} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group/e shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: tc.bg }}>{embed.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5"><h4 className="text-[12px] text-gray-800 truncate">{embed.title}</h4>{embed.pinned && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}</div>
            <p className="text-[9px] text-gray-400 truncate">{embed.url}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); setEmCtx({ id: embed.id, x: e.clientX, y: e.clientY }); }} className="opacity-0 group-hover/e:opacity-100 p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="w-3 h-3 text-gray-400" /></button>
        </div>
        {embed.description && <p className="text-[10px] text-gray-500 mb-2 truncate">{embed.description}</p>}
        <div className="flex items-center justify-between text-[9px] text-gray-400 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded-full" style={{ color: tc.color, backgroundColor: tc.bg }}>{tc.label}</span>{adder && <span>{adder.name}</span>}</div>
          <span>{embed.addedAt}</span>
        </div>
      </div>
    );
  };

  // Preview panel
  if (selectedEmbed) {
    const tc = embedTypeCfg[selectedEmbed.type] || embedTypeCfg.website;
    const adder = teamMembers.find(m => m.id === selectedEmbed.addedBy);
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white" onClick={() => setEmCtx(null)}>
        <div className="h-[52px] border-b border-gray-200 flex items-center px-5 gap-3 bg-white shrink-0">
          <button onClick={() => setSelectedEmbed(null)} className="flex items-center gap-1 text-[12px] text-cyan-600 hover:text-cyan-700"><ChevronDown className="w-3.5 h-3.5 rotate-90" /> Quay lại</button>
          <div className="h-5 w-px bg-gray-200" /><span className="text-lg">{selectedEmbed.icon}</span>
          <div className="flex-1 min-w-0"><span className="text-[13px] text-gray-700 truncate block">{selectedEmbed.title}</span></div>
          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ color: tc.color, backgroundColor: tc.bg }}>{tc.label}</span>
          <button onClick={() => { setEditingEmbed(selectedEmbed); setEditForm({ title: selectedEmbed.title, url: selectedEmbed.url, description: selectedEmbed.description || "" }); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => togglePinEm(selectedEmbed.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Star className={`w-3.5 h-3.5 ${selectedEmbed.pinned ? "text-amber-400 fill-amber-400" : ""}`} /></button>
          <a href={selectedEmbed.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100"><ExternalLink className="w-3 h-3" /> Mở ngoài</a>
          <button onClick={() => setDeleteConfirm(selectedEmbed.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50/50 p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4" style={{ backgroundColor: tc.bg }}>{selectedEmbed.icon}</div>
            <h3 className="text-[16px] text-gray-800 mb-1.5">{selectedEmbed.title}</h3>
            {selectedEmbed.description && <p className="text-[12px] text-gray-500 mb-3">{selectedEmbed.description}</p>}
            <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2"><Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span className="text-[11px] text-cyan-600 truncate">{selectedEmbed.url}</span></div>
              <div className="flex items-center gap-4 text-[10px] text-gray-400"><span style={{ color: tc.color }}>{tc.label}</span>{adder && <span>Bởi {adder.name}</span>}<span>{selectedEmbed.addedAt}</span></div>
            </div>
            <div className="bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl border border-amber-200 text-[11px] mb-4">Iframe bị giới hạn trong demo. Click "Mở ngoài" để xem.</div>
            <a href={selectedEmbed.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[12px] px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"><ExternalLink className="w-4 h-4" /> Mở trong tab mới</a>
          </div>
        </div>
        {editingEmbed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingEmbed(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] text-gray-800">Chỉnh sửa embed</h3><button onClick={() => setEditingEmbed(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Tiêu đề</label><input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">URL</label><input value={editForm.url} onChange={e => setEditForm(p => ({ ...p, url: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Mô tả</label><input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-5"><button onClick={() => setEditingEmbed(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button><button onClick={handleSaveEditEm} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Lưu</button></div>
            </div>
          </div>
        )}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Xóa embed?</h3><p className="text-[11px] text-gray-500 mt-0.5">Không thể hoàn tác.</p></div></div>
              <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Hủy</button><button onClick={() => handleDeleteEm(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Xóa</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setEmCtx(null)}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="text-gray-900 tracking-tight flex items-center gap-2"><Globe className="w-5 h-5 text-gray-600" /> Nhúng trang web</h2><p className="text-[12px] text-gray-400 mt-1">Figma, Miro, Google, YouTube, Loom & website</p></div>
          <button onClick={() => { setAddForm({ title: "", url: "", description: "" }); setDetectedType(null); setAddError(""); setShowAddModal(true); }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[12px] px-4 py-2 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 transition-all"><Plus className="w-3.5 h-3.5" /> Thêm trang</button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm embed..." className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setFilterType("all")} className={`px-2.5 py-0.5 text-[10px] rounded-md transition-all ${filterType === "all" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>Tất cả</button>
            {Array.from(typeSet).map(t => { const tc = embedTypeCfg[t]; return <button key={t} onClick={() => setFilterType(t)} className={`px-2.5 py-0.5 text-[10px] rounded-md transition-all ${filterType === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{tc?.icon} {tc?.label}</button>; })}
          </div>
          <span className="text-[10px] text-gray-400 ml-auto">{embeds.length} embeds</span>
        </div>

        {pinnedEm.length > 0 && (<div className="mb-5"><p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Đã ghim</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{pinnedEm.map(e => <EmbedCard key={e.id} embed={e} />)}</div></div>)}

        {pinnedEm.length > 0 && unpinnedEm.length > 0 && <p className="text-[10px] text-gray-400 mb-2">Tất cả</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {unpinnedEm.map(e => <EmbedCard key={e.id} embed={e} />)}
          <div onClick={() => { setAddForm({ title: "", url: "", description: "" }); setDetectedType(null); setAddError(""); setShowAddModal(true); }}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all cursor-pointer min-h-[120px]"><Link2 className="w-5 h-5 text-gray-300" /><p className="text-[11px] text-gray-400">Thêm trang nhúng</p></div>
        </div>
        {filtered.length === 0 && <div className="text-center py-12"><Globe className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-[13px] text-gray-400">Không tìm thấy embed</p></div>}
      </div>

      {emCtx && (
        <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[160px]" style={{ left: Math.min(emCtx.x, window.innerWidth - 180), top: emCtx.y }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { const em = embeds.find(x => x.id === emCtx.id); if (em) setSelectedEmbed(em); setEmCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Eye className="w-3.5 h-3.5 text-gray-400" /> Xem</button>
          <button onClick={() => { const em = embeds.find(x => x.id === emCtx.id); if (em) { setEditingEmbed(em); setEditForm({ title: em.title, url: em.url, description: em.description || "" }); setSelectedEmbed(em); } setEmCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Chỉnh sửa</button>
          <button onClick={() => togglePinEm(emCtx.id)} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Star className="w-3.5 h-3.5 text-amber-400" /> {embeds.find(x => x.id === emCtx.id)?.pinned ? "Bỏ ghim" : "Ghim"}</button>
          <button onClick={() => { const em = embeds.find(x => x.id === emCtx.id); if (em) copyToClipboard(em.url); setEmCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Copy className="w-3.5 h-3.5 text-gray-400" /> Sao chép URL</button>
          <button onClick={() => { setDeleteConfirm(emCtx.id); setEmCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-[15px] text-gray-800 tracking-tight">Thêm trang nhúng</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">URL *</label>
                <input value={addForm.url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://figma.com/file/... hoặc bất kỳ URL"
                  className={`w-full text-[12px] border rounded-xl px-3 py-2.5 focus:outline-none ${addError ? "border-red-300" : "border-gray-200 focus:border-cyan-400"}`} autoFocus />
                {addError && <p className="text-[10px] text-red-500 mt-1">{addError}</p>}
                {detectedType && !addError && <div className="mt-1.5"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: embedTypeCfg[detectedType.type].color, backgroundColor: embedTypeCfg[detectedType.type].bg }}>{detectedType.icon} {embedTypeCfg[detectedType.type].label} detected</span></div>}</div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Tiêu đề *</label><input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} placeholder="Tên hiển thị..." className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Mô tả</label><input value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn..." className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div>
            </div>
            <div className="flex items-center gap-2 mt-5 pt-3 border-t border-gray-100">
              <div className="flex-1 flex flex-wrap gap-1">{["Figma", "Miro", "Notion", "Google", "YouTube", "Loom"].map(s => <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">{s}</span>)}</div>
              <button onClick={() => setShowAddModal(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button>
              <button onClick={handleAdd} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Xóa embed?</h3><p className="text-[11px] text-gray-500 mt-0.5">Không thể hoàn tác.</p></div></div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Hủy</button><button onClick={() => handleDeleteEm(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Xóa</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   MAP VIEW — Bản đồ dự án (FULL)
   ================================================================ */
interface MapLocation {
  id: string; name: string; lat: number; lng: number;
  type: "office" | "client" | "event" | "team_member";
  detail: string; color: string; phone?: string; note?: string; pinned?: boolean;
}

const initialLocations: MapLocation[] = [
  { id: "loc1", name: "Văn phòng chính", lat: 21.028, lng: 105.854, type: "office", detail: "Tầng 12, Tòa nhà Lotte, Hà Nội", color: "#0891b2", phone: "024-1234-5678", note: "Giờ: 8:30-17:30", pinned: true },
  { id: "loc2", name: "Khách hàng - TechCorp", lat: 10.823, lng: 106.629, type: "client", detail: "Quận 1, TP.HCM", color: "#7c3aed", phone: "028-9876-5432", note: "Contact: Mr. Tuấn" },
  { id: "loc3", name: "Co-working Đà Nẵng", lat: 16.054, lng: 108.202, type: "office", detail: "Hải Châu, Đà Nẵng", color: "#059669", note: "Hot desk + meeting room" },
  { id: "loc4", name: "Tech Conference 2026", lat: 21.022, lng: 105.816, type: "event", detail: "20-22/04, Mỹ Đình", color: "#d97706", note: "Booth #42" },
  { id: "loc5", name: "Nguyễn Minh (Remote)", lat: 21.035, lng: 105.865, type: "team_member", detail: "Hoàn Kiếm, Hà Nội", color: "#0891b2", note: "Frontend Lead" },
  { id: "loc6", name: "Trần Hương (Remote)", lat: 10.780, lng: 106.700, type: "team_member", detail: "Quận 3, TP.HCM", color: "#7c3aed", note: "UI/UX Designer" },
  { id: "loc7", name: "Khách hàng - FinBank", lat: 21.010, lng: 105.830, type: "client", detail: "Cầu Giấy, Hà Nội", color: "#7c3aed", phone: "024-5555-1234", note: "Banking App" },
  { id: "loc8", name: "Team Building Retreat", lat: 20.930, lng: 107.080, type: "event", detail: "15-16/05, Hạ Long", color: "#d97706", note: "2 ngày, 25 người" },
];

const mTypeLabels: Record<string, string> = { office: "Văn phòng", client: "Khách hàng", event: "Sự kiện", team_member: "Thành viên" };
const mTypeEmoji: Record<string, string> = { office: "🏢", client: "🤝", event: "📅", team_member: "👤" };
const mTypeColors: Record<string, string> = { office: "#0891b2", client: "#7c3aed", event: "#d97706", team_member: "#059669" };

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - 102) / 8) * 280 + 20;
  const y = ((23.5 - lat) / 15) * 440 + 30;
  return { x: Math.max(20, Math.min(300, x)), y: Math.max(30, Math.min(470, y)) };
}

export function MapView() {
  const [locations, setLocations] = useState<MapLocation[]>(initialLocations);
  const [selectedLoc, setSelectedLoc] = useState<MapLocation | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<MapLocation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: "", type: "office" as MapLocation["type"], detail: "", phone: "", note: "", lat: "21.028", lng: "105.854" });
  const [editForm, setEditForm] = useState({ name: "", type: "office" as MapLocation["type"], detail: "", phone: "", note: "" });
  const [mapCtx, setMapCtx] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  const filtered = locations.filter(l => {
    if (searchQ && !l.name.toLowerCase().includes(searchQ.toLowerCase()) && !l.detail.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filter !== "all" && l.type !== filter) return false;
    return true;
  });

  const typeCounts = { office: locations.filter(l => l.type === "office").length, client: locations.filter(l => l.type === "client").length, event: locations.filter(l => l.type === "event").length, team_member: locations.filter(l => l.type === "team_member").length };

  const handleAddLoc = () => {
    if (!addForm.name.trim() || !addForm.detail.trim()) return;
    const nl: MapLocation = { id: `loc_${Date.now()}`, name: addForm.name, type: addForm.type, detail: addForm.detail, phone: addForm.phone, note: addForm.note, lat: parseFloat(addForm.lat) || 21.028, lng: parseFloat(addForm.lng) || 105.854, color: mTypeColors[addForm.type] };
    setLocations(prev => [...prev, nl]); setShowAddModal(false);
    setAddForm({ name: "", type: "office", detail: "", phone: "", note: "", lat: "21.028", lng: "105.854" }); setSelectedLoc(nl);
  };

  const handleSaveEditLoc = () => {
    if (!editingLoc || !editForm.name.trim()) return;
    const upd = { ...editingLoc, name: editForm.name, type: editForm.type, detail: editForm.detail, phone: editForm.phone, note: editForm.note, color: mTypeColors[editForm.type] };
    setLocations(prev => prev.map(l => l.id === editingLoc.id ? upd : l));
    if (selectedLoc?.id === editingLoc.id) setSelectedLoc(upd); setEditingLoc(null);
  };

  const handleDeleteLoc = (id: string) => { setLocations(prev => prev.filter(l => l.id !== id)); if (selectedLoc?.id === id) setSelectedLoc(null); setDeleteConfirm(null); };
  const togglePinLoc = (id: string) => { setLocations(prev => prev.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l)); setMapCtx(null); };

  const MapTypeIcon = ({ type }: { type: string }) => {
    if (type === "office") return <Layers className="w-4 h-4" />;
    if (type === "client") return <Users className="w-4 h-4" />;
    if (type === "event") return <Calendar className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white" onClick={() => setMapCtx(null)}>
      {/* Sidebar */}
      <div className="w-[320px] border-r border-gray-200 flex flex-col bg-white shrink-0">
        <div className="p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] text-gray-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-green-600" /> Vị trí dự án</h3>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-[11px] bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2.5 py-1 rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all"><Plus className="w-3 h-3" /> Thêm</button>
          </div>
          <div className="relative mb-2.5"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm vị trí..." className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={() => setFilter("all")} className={`px-2 py-0.5 text-[9px] rounded-md transition-all ${filter === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>Tất cả ({locations.length})</button>
            {(["office", "client", "event", "team_member"] as const).map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-2 py-0.5 text-[9px] rounded-md transition-all ${filter === t ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
                style={filter === t ? { backgroundColor: mTypeColors[t] } : {}}>{mTypeEmoji[t]} {typeCounts[t]}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 && <div className="p-8 text-center text-gray-400"><MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-[11px]">Không tìm thấy</p></div>}
          {filtered.map(loc => (
            <div key={loc.id} onClick={() => setSelectedLoc(loc)} onMouseEnter={() => setHoveredPin(loc.id)} onMouseLeave={() => setHoveredPin(null)}
              className={`p-3.5 border-b border-gray-100 cursor-pointer transition-all group/loc ${selectedLoc?.id === loc.id ? "bg-cyan-50/50 border-l-2 border-l-cyan-500" : "hover:bg-gray-50"}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: loc.color + "15", color: loc.color }}><MapTypeIcon type={loc.type} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><p className="text-[12px] text-gray-800 truncate">{loc.name}</p>{loc.pinned && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />}</div>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{loc.detail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-md" style={{ color: loc.color, backgroundColor: loc.color + "15" }}>{mTypeLabels[loc.type]}</span>
                    {loc.phone && <span className="text-[8px] text-gray-400 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{loc.phone}</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); setMapCtx({ id: loc.id, x: e.clientX, y: e.clientY }); }} className="opacity-0 group-hover/loc:opacity-100 p-1 hover:bg-gray-100 rounded shrink-0"><MoreHorizontal className="w-3 h-3 text-gray-400" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 bg-gray-50/50 shrink-0">
          <div className="flex items-center justify-between text-[9px] text-gray-400">
            {(["office", "client", "event", "team_member"] as const).map(t => <span key={t} className="flex items-center gap-1">{mTypeEmoji[t]} {typeCounts[t]}</span>)}
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative bg-gradient-to-br from-cyan-50/30 to-blue-50/30" style={{ backgroundImage: "radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="320" height="500" viewBox="0 0 320 500" className="opacity-80">
            <path d="M160 20 L185 45 L200 60 L215 75 L220 80 L215 100 L210 120 L225 150 L230 160 L225 180 L220 200 L205 215 L200 220 L195 240 L190 260 L195 280 L200 300 L208 330 L210 340 L205 360 L200 380 L185 395 L180 400 L175 415 L170 430 L165 445 L160 460 L155 475 L150 480 L145 470 L140 460 L135 440 L130 420 L125 400 L120 380 L125 360 L130 340 L125 320 L120 300 L125 280 L130 260 L125 240 L120 220 L125 200 L130 180 L135 160 L140 140 L135 120 L130 100 L135 80 L140 60 L150 40 Z"
              fill="#f0fdfa" stroke="#99f6e4" strokeWidth="1.5" />
            <text x="160" y="75" textAnchor="middle" className="text-[8px] fill-gray-300">Miền Bắc</text>
            <text x="170" y="230" textAnchor="middle" className="text-[8px] fill-gray-300">Miền Trung</text>
            <text x="175" y="420" textAnchor="middle" className="text-[8px] fill-gray-300">Miền Nam</text>
            {filtered.map(loc => {
              const { x, y } = latLngToXY(loc.lat, loc.lng);
              const isSel = selectedLoc?.id === loc.id;
              const isHov = hoveredPin === loc.id;
              const r = isSel ? 10 : isHov ? 8 : 6;
              return (
                <g key={loc.id} className="cursor-pointer" onClick={() => setSelectedLoc(loc)} onMouseEnter={() => setHoveredPin(loc.id)} onMouseLeave={() => setHoveredPin(null)}>
                  {isSel && <><circle cx={x} cy={y} r="16" fill="none" stroke={loc.color} strokeWidth="1.5" opacity="0.3"><animate attributeName="r" values="10;20" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.4;0" dur="1.5s" repeatCount="indefinite" /></circle></>}
                  <circle cx={x} cy={y + 2} r={r} fill="black" opacity="0.1" />
                  <circle cx={x} cy={y} r={r} fill={loc.color} stroke="white" strokeWidth={isSel ? 3 : 2} opacity={0.95} />
                  {isSel && <circle cx={x} cy={y} r="3" fill="white" opacity="0.9" />}
                  {isHov && !isSel && <><rect x={x - 50} y={y - 32} width="100" height="22" rx="6" fill="white" stroke="#e5e7eb" /><text x={x} y={y - 17} textAnchor="middle" className="text-[9px] fill-gray-700">{loc.name.length > 16 ? loc.name.slice(0, 16) + "…" : loc.name}</text></>}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm">
          <p className="text-[9px] text-gray-400 mb-1.5">Chú thích</p>
          {(["office", "client", "event", "team_member"] as const).map(t => (
            <div key={t} className="flex items-center gap-2 py-0.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mTypeColors[t] }} /><span className="text-[9px] text-gray-600">{mTypeLabels[t]}</span></div>
          ))}
        </div>
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-2 shadow-sm"><p className="text-[9px] text-gray-400">{filtered.length} / {locations.length} vị trí</p></div>

        {selectedLoc && (
          <div className="absolute bottom-5 left-5 right-5 max-w-lg">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: selectedLoc.color + "15", color: selectedLoc.color }}><MapTypeIcon type={selectedLoc.type} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h4 className="text-[14px] text-gray-800">{selectedLoc.name}</h4>{selectedLoc.pinned && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedLoc.detail}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-md" style={{ color: selectedLoc.color, backgroundColor: selectedLoc.color + "15" }}>{mTypeLabels[selectedLoc.type]}</span>
                    {selectedLoc.phone && <span className="text-[9px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedLoc.phone}</span>}
                  </div>
                  {selectedLoc.note && <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">{selectedLoc.note}</p>}
                  <div className="text-[9px] text-gray-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedLoc.lat.toFixed(3)}°N, {selectedLoc.lng.toFixed(3)}°E</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => { setEditingLoc(selectedLoc); setEditForm({ name: selectedLoc.name, type: selectedLoc.type, detail: selectedLoc.detail, phone: selectedLoc.phone || "", note: selectedLoc.note || "" }); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => togglePinLoc(selectedLoc.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Star className={`w-3.5 h-3.5 ${selectedLoc.pinned ? "text-amber-400 fill-amber-400" : ""}`} /></button>
                  <button onClick={() => setDeleteConfirm(selectedLoc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setSelectedLoc(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {mapCtx && (
        <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[160px]" style={{ left: Math.min(mapCtx.x, window.innerWidth - 180), top: mapCtx.y }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { const l = locations.find(x => x.id === mapCtx.id); if (l) setSelectedLoc(l); setMapCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Eye className="w-3.5 h-3.5 text-gray-400" /> Xem</button>
          <button onClick={() => { const l = locations.find(x => x.id === mapCtx.id); if (l) { setEditingLoc(l); setEditForm({ name: l.name, type: l.type, detail: l.detail, phone: l.phone || "", note: l.note || "" }); setSelectedLoc(l); } setMapCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Sửa</button>
          <button onClick={() => togglePinLoc(mapCtx.id)} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Star className="w-3.5 h-3.5 text-amber-400" /> {locations.find(l => l.id === mapCtx.id)?.pinned ? "Bỏ ghim" : "Ghim"}</button>
          <button onClick={() => { setDeleteConfirm(mapCtx.id); setMapCtx(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-[15px] text-gray-800">Thêm vị trí</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Tên *</label><input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" autoFocus /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Loại</label>
                <div className="flex gap-1.5">{(["office", "client", "event", "team_member"] as const).map(t => (
                  <button key={t} onClick={() => setAddForm(p => ({ ...p, type: t }))} className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg border transition-all ${addForm.type === t ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-500"}`}>{mTypeEmoji[t]} {mTypeLabels[t]}</button>))}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Địa chỉ *</label><input value={addForm.detail} onChange={e => setAddForm(p => ({ ...p, detail: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Vĩ độ</label><input value={addForm.lat} onChange={e => setAddForm(p => ({ ...p, lat: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-mono" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Kinh độ</label><input value={addForm.lng} onChange={e => setAddForm(p => ({ ...p, lng: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 font-mono" /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Điện thoại</label><input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Ghi chú</label><input value={addForm.note} onChange={e => setAddForm(p => ({ ...p, note: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setShowAddModal(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button><button onClick={handleAddLoc} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Thêm</button></div>
          </div>
        </div>
      )}

      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingLoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] text-gray-800">Chỉnh sửa vị trí</h3><button onClick={() => setEditingLoc(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Tên</label><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Loại</label>
                <div className="flex gap-1.5">{(["office", "client", "event", "team_member"] as const).map(t => (
                  <button key={t} onClick={() => setEditForm(p => ({ ...p, type: t }))} className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg border transition-all ${editForm.type === t ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-500"}`}>{mTypeEmoji[t]} {mTypeLabels[t]}</button>))}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Địa chỉ</label><input value={editForm.detail} onChange={e => setEditForm(p => ({ ...p, detail: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Điện thoại</label><input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Ghi chú</label><input value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setEditingLoc(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button><button onClick={handleSaveEditLoc} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Lưu</button></div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Xóa vị trí?</h3><p className="text-[11px] text-gray-500 mt-0.5">Không thể hoàn tác.</p></div></div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Hủy</button><button onClick={() => handleDeleteLoc(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Xóa</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   DASHBOARD PROJECT VIEW — Tổng quan dự án
   ================================================================ */
export function ProjectDashboardView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const inReview = tasks.filter(t => t.status === "in_review").length;
  const todo = tasks.filter(t => t.status === "todo").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== "done").length;
  const urgent = tasks.filter(t => t.priority === "urgent" && t.status !== "done").length;

  const priorityData = [
    { name: "Khẩn cấp", count: tasks.filter(t => t.priority === "urgent").length, color: "#dc2626" },
    { name: "Cao", count: tasks.filter(t => t.priority === "high").length, color: "#f59e0b" },
    { name: "Bình thường", count: tasks.filter(t => t.priority === "normal").length, color: "#3b82f6" },
    { name: "Thấp", count: tasks.filter(t => t.priority === "low").length, color: "#94a3b8" },
  ];

  const weeklyData = [
    { week: "T1 (24/2)", done: 2, added: 5 },
    { week: "T2 (3/3)", done: 3, added: 4 },
    { week: "T3 (10/3)", done: 4, added: 3 },
    { week: "T4 (17/3)", done: done, added: 2 },
  ];

  const tagCounts: Record<string, number> = {};
  tasks.forEach(t => t.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const tagColors = ["#0891b2", "#7c3aed", "#059669", "#d97706", "#db2777", "#4f46e5", "#0d9488", "#dc2626", "#6366f1", "#ec4899"];

  const upcomingDeadlines = tasks
    .filter(t => t.dueDate && t.status !== "done")
    .map(t => { const diff = Math.ceil((new Date(t.dueDate!).getTime() - today.getTime()) / 86400000); return { ...t, daysLeft: diff }; })
    .sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 6);

  const activityItems: { text: string; time: string; color: string; icon: string }[] = [];
  tasks.forEach(t => {
    t.activityLog?.forEach(a => { const u = teamMembers.find(m => m.id === a.userId); if (u) activityItems.push({ text: `${u.name} ${a.action === "changed" ? `đổi ${a.field} → ${a.newValue}` : a.action} "${t.title}"`, time: a.timestamp, color: u.color, icon: u.name.charAt(0) }); });
    t.comments?.slice(-1).forEach(c => { const u = teamMembers.find(m => m.id === c.userId); if (u) activityItems.push({ text: `${u.name} comment "${t.title}"`, time: c.timestamp, color: u.color, icon: u.name.charAt(0) }); });
  });
  activityItems.sort((a, b) => b.time.localeCompare(a.time));

  const memberStats = teamMembers.map(m => {
    const mT = tasks.filter(t => t.assignee?.id === m.id); const mD = mT.filter(t => t.status === "done").length;
    return { ...m, total: mT.length, done: mD, pct: mT.length > 0 ? Math.round((mD / mT.length) * 100) : 0 };
  }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct);

  const totalEstimate = tasks.reduce((s, t) => s + (t.timeEstimate || 0), 0);
  const totalSpent = tasks.reduce((s, t) => s + (t.timeSpent || 0), 0);
  const timePct = totalEstimate > 0 ? Math.round((totalSpent / totalEstimate) * 100) : 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="text-gray-900 tracking-tight flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Tổng quan dự án</h2><p className="text-[12px] text-gray-400 mt-1">Biểu đồ, thống kê & tiến độ tổng thể</p></div>
          <span className="text-[11px] text-gray-400">Cập nhật: 17/03/2026</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[{ l: "Tổng tasks", v: total, c: "#0891b2", s: `${done} hoàn thành` }, { l: "Đang xử lý", v: inProgress + inReview, c: "#7c3aed", s: `${inProgress} làm · ${inReview} review` }, { l: "Quá hạn", v: overdue, c: "#dc2626", s: `${urgent} khẩn cấp` }, { l: "Thời gian", v: `${Math.round(totalSpent / 60)}h`, c: "#059669", s: `/ ${Math.round(totalEstimate / 60)}h ước tính` }].map(s => (
            <div key={s.l} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-2xl tracking-tight" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.l}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.s}</p>
            </div>
          ))}
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-4">Tiến độ tổng thể</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#pdGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${pct * 3.14} ${314 - pct * 3.14}`} />
                  <defs><linearGradient id="pdGrad"><stop offset="0%" stopColor="#0891b2" /><stop offset="100%" stopColor="#0d9488" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl text-gray-800 tracking-tight">{pct}%</span></div>
              </div>
              <div className="space-y-2 flex-1">
                {[{ l: "Hoàn thành", v: done, c: "bg-emerald-500" }, { l: "Đang làm", v: inProgress, c: "bg-cyan-500" }, { l: "Đang review", v: inReview, c: "bg-violet-500" }, { l: "Chưa làm", v: todo, c: "bg-gray-400" }].map(x => (
                  <div key={x.l} className="flex items-center justify-between text-[12px]"><span className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${x.c}`} /> {x.l}</span><span className="text-gray-600">{x.v}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-4">Phân bổ theo mức ưu tiên</h3>
            <div className="space-y-3">
              {priorityData.map(p => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><Flag className="w-3 h-3" style={{ color: p.color }} /><span className="text-[11px] text-gray-700">{p.name}</span></div><span className="text-[11px] text-gray-500">{p.count} · {total > 0 ? Math.round((p.count / total) * 100) : 0}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? (p.count / total) * 100 : 0}%`, backgroundColor: p.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-4">Tiến độ theo tuần</h3>
            <div className="flex items-end gap-4 h-[140px]">
              {weeklyData.map((w, i) => {
                const mx = Math.max(...weeklyData.map(x => Math.max(x.done, x.added)), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-[100px] w-full justify-center">
                      <div className="w-5 rounded-t-md bg-emerald-400 transition-all" style={{ height: `${(w.done / mx) * 100}%` }} />
                      <div className="w-5 rounded-t-md bg-cyan-300 transition-all" style={{ height: `${(w.added / mx) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1">{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span className="text-[10px] text-gray-500">Hoàn thành</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-300" /><span className="text-[10px] text-gray-500">Thêm mới</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-4">Tags phổ biến</h3>
            <div className="flex flex-wrap gap-2">
              {tagEntries.map(([tag, count], i) => (
                <span key={tag} className={`rounded-full border cursor-default transition-all hover:shadow-sm ${count >= 4 ? "text-[13px] px-3 py-1.5" : count >= 2 ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-0.5"}`}
                  style={{ color: tagColors[i % tagColors.length], backgroundColor: `${tagColors[i % tagColors.length]}10`, borderColor: `${tagColors[i % tagColors.length]}30` }}>
                  #{tag} <span className="opacity-60">({count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-3">Hiệu suất thành viên</h3>
            <div className="space-y-2.5">
              {memberStats.map(m => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5"><span className="text-[10px] text-gray-700 truncate">{m.name}</span><span className="text-[9px] text-gray-400">{m.done}/{m.total}</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: m.color }} /></div>
                  </div>
                  <span className="text-[10px] w-8 text-right" style={{ color: m.color }}>{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500" /> Deadline sắp tới</h3>
            <div className="space-y-2">
              {upcomingDeadlines.map(t => (
                <div key={t.id} className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${t.daysLeft < 0 ? "bg-red-50/70" : t.daysLeft <= 2 ? "bg-amber-50/50" : "hover:bg-gray-50"}`}>
                  <div className={`w-1.5 h-8 rounded-full shrink-0 ${t.daysLeft < 0 ? "bg-red-400" : t.daysLeft <= 2 ? "bg-amber-400" : t.daysLeft <= 5 ? "bg-cyan-400" : "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0"><p className="text-[11px] text-gray-700 truncate">{t.title}</p><p className="text-[9px] text-gray-400">{t.dueDate ? `${new Date(t.dueDate).getDate()}/${new Date(t.dueDate).getMonth()+1}` : ""}</p></div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 ${t.daysLeft < 0 ? "bg-red-100 text-red-600" : t.daysLeft <= 2 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                    {t.daysLeft < 0 ? `Quá ${Math.abs(t.daysLeft)}d` : t.daysLeft === 0 ? "Hôm nay" : `Còn ${t.daysLeft}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-violet-500" /> Hoạt động gần đây</h3>
            <div className="space-y-2.5 max-h-[220px] overflow-auto">
              {activityItems.slice(0, 8).map((a, i) => {
                const d = new Date(a.time);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0 mt-0.5" style={{ backgroundColor: a.color }}>{a.icon}</div>
                    <div className="flex-1 min-w-0"><p className="text-[10px] text-gray-600 leading-relaxed">{a.text}</p><p className="text-[9px] text-gray-400">{d.getDate()}/{d.getMonth()+1} {d.getHours().toString().padStart(2,"0")}:{d.getMinutes().toString().padStart(2,"0")}</p></div>
                  </div>
                );
              })}
              {activityItems.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Chưa có hoạt động</p>}
            </div>
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-cyan-500" /> Thời gian dự án</h3>
            <div className="flex items-center gap-5">
              <div className="flex-1">
                <div className="flex justify-between text-[11px] mb-1.5"><span className="text-gray-500">Đã dùng</span><span className="text-cyan-700">{Math.round(totalSpent/60)}h / {Math.round(totalEstimate/60)}h</span></div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${timePct > 100 ? "bg-red-400" : "bg-gradient-to-r from-cyan-400 to-teal-400"}`} style={{ width: `${Math.min(timePct, 100)}%` }} /></div>
                <div className="flex justify-between mt-1.5 text-[10px] text-gray-400"><span>0h</span><span>{Math.round(totalEstimate/60)}h</span></div>
              </div>
              <div className="text-center shrink-0"><p className={`text-2xl tracking-tight ${timePct > 100 ? "text-red-500" : "text-cyan-700"}`}>{timePct}%</p><p className="text-[9px] text-gray-400 mt-0.5">{timePct > 100 ? "Vượt budget!" : "Sử dụng"}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-[13px] text-gray-800 mb-3 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-red-500" /> Cần chú ý ({urgent + overdue})</h3>
            <div className="space-y-1.5 max-h-[140px] overflow-auto">
              {tasks.filter(t => (t.priority === "urgent" || (t.dueDate && new Date(t.dueDate) < today)) && t.status !== "done").slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50/50 border border-red-100">
                  <Flag className="w-3 h-3 text-red-500 shrink-0" />
                  <span className="text-[11px] text-gray-700 flex-1 truncate">{t.title}</span>
                  {t.priority === "urgent" && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">Khẩn</span>}
                  {t.dueDate && new Date(t.dueDate) < today && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">Quá hạn</span>}
                </div>
              ))}
              {urgent + overdue === 0 && <p className="text-[11px] text-emerald-600 text-center py-3">Không có vấn đề cần chú ý</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SPRINTS PROJECT VIEW (FULL)
   ================================================================ */
interface SprintData {
  id: string; name: string; start: string; end: string;
  status: "completed" | "active" | "planned";
  goal: string; velocity?: number; storyPoints: number; completedPoints: number;
  taskIds: string[]; retro?: string; burndown: number[];
}

const initialSprints: SprintData[] = [
  { id: "sp5", name: "Sprint 5", start: "02/02", end: "15/02", status: "completed", goal: "User onboarding & notifications", velocity: 87, storyPoints: 34, completedPoints: 30, taskIds: [], retro: "Tốt: CI/CD pipeline ổn định. Cải thiện: Cần estimate chính xác hơn.", burndown: [34,32,29,26,23,20,17,14,11,8,6,4,3,2] },
  { id: "sp6", name: "Sprint 6", start: "17/02", end: "02/03", status: "completed", goal: "Payment integration & security", velocity: 92, storyPoints: 38, completedPoints: 35, taskIds: [], retro: "Tốt: Team collaboration xuất sắc. Cải thiện: Testing coverage cần tăng.", burndown: [38,36,33,30,27,24,20,16,13,10,7,5,3,1] },
  { id: "sp7", name: "Sprint 7", start: "03/03", end: "16/03", status: "completed", goal: "Auth system & Design foundations", velocity: 85, storyPoints: 32, completedPoints: 27, taskIds: [], retro: "Tốt: Auth flow hoàn thiện. Cải thiện: Design review cần sớm hơn.", burndown: [32,30,28,25,23,20,18,16,13,10,8,6,5,3] },
  { id: "sp8", name: "Sprint 8", start: "17/03", end: "30/03", status: "active", goal: "API optimization & Homepage redesign", storyPoints: 36, completedPoints: 14, taskIds: ["t1","t2","t3","t4","t5","t6","t7","t8"], burndown: [36,34,31,28,26,24,22] },
  { id: "sp9", name: "Sprint 9", start: "31/03", end: "13/04", status: "planned", goal: "Dashboard & Analytics", storyPoints: 30, completedPoints: 0, taskIds: [], burndown: [] },
  { id: "sp10", name: "Sprint 10", start: "14/04", end: "27/04", status: "planned", goal: "Mobile responsive & Performance", storyPoints: 0, completedPoints: 0, taskIds: [], burndown: [] },
];

export function ProjectSprintsView({ tasks }: { tasks: Task[] }) {
  const [sprints, setSprints] = useState<SprintData[]>(initialSprints);
  const [selectedSprint, setSelectedSprint] = useState<SprintData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<SprintData | null>(null);
  const [spDeleteConfirm, setSpDeleteConfirm] = useState<string | null>(null);
  const [sprintFilter, setSprintFilter] = useState<"all" | "active" | "completed" | "planned">("all");
  const [showRetroModal, setShowRetroModal] = useState<SprintData | null>(null);
  const [retroText, setRetroText] = useState("");
  const [spCreateForm, setSpCreateForm] = useState({ name: "", goal: "", start: "", end: "", storyPoints: "" });
  const [spEditForm, setSpEditForm] = useState({ name: "", goal: "", start: "", end: "", storyPoints: "" });
  const [detailTab, setDetailTab] = useState<"tasks" | "burndown" | "retro">("tasks");

  const activeSprint = sprints.find(s => s.status === "active");
  const completedSprints = sprints.filter(s => s.status === "completed");
  const avgVelocity = completedSprints.length > 0 ? Math.round(completedSprints.reduce((a, s) => a + (s.velocity || 0), 0) / completedSprints.length) : 0;
  const filteredSprints = sprintFilter === "all" ? sprints : sprints.filter(s => s.status === sprintFilter);
  const getSprintTasks = (sp: SprintData) => tasks.filter(t => sp.taskIds.includes(t.id));

  const spStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: "Hoàn thành", color: "#059669", bg: "#ecfdf5" },
    active: { label: "Đang chạy", color: "#0891b2", bg: "#ecfeff" },
    planned: { label: "Kế hoạch", color: "#6b7280", bg: "#f9fafb" },
  };

  const spTaskCfg: Record<string, { label: string; color: string }> = {
    todo: { label: "To Do", color: "#6b7280" }, in_progress: { label: "Đang làm", color: "#0891b2" },
    in_review: { label: "Review", color: "#7c3aed" }, done: { label: "Xong", color: "#059669" },
  };

  const handleSpCreate = () => {
    if (!spCreateForm.name.trim() || !spCreateForm.goal.trim()) return;
    setSprints(prev => [...prev, { id: `sp_${Date.now()}`, name: spCreateForm.name, goal: spCreateForm.goal, start: spCreateForm.start || "TBD", end: spCreateForm.end || "TBD", status: "planned", storyPoints: parseInt(spCreateForm.storyPoints) || 0, completedPoints: 0, taskIds: [], burndown: [] }]);
    setShowCreateModal(false); setSpCreateForm({ name: "", goal: "", start: "", end: "", storyPoints: "" });
  };

  const handleSpSaveEdit = () => {
    if (!editingSprint || !spEditForm.name.trim()) return;
    const pts = parseInt(spEditForm.storyPoints) || editingSprint.storyPoints;
    setSprints(prev => prev.map(s => s.id === editingSprint.id ? { ...s, name: spEditForm.name, goal: spEditForm.goal, start: spEditForm.start, end: spEditForm.end, storyPoints: pts } : s));
    if (selectedSprint?.id === editingSprint.id) setSelectedSprint({ ...editingSprint, name: spEditForm.name, goal: spEditForm.goal, start: spEditForm.start, end: spEditForm.end, storyPoints: pts });
    setEditingSprint(null);
  };

  const handleSpStart = (id: string) => setSprints(prev => prev.map(s => {
    if (s.id === id) return { ...s, status: "active" as const };
    if (s.status === "active") return { ...s, status: "completed" as const, velocity: Math.round((s.completedPoints / Math.max(s.storyPoints, 1)) * 100) };
    return s;
  }));

  const handleSpComplete = (id: string) => {
    setSprints(prev => prev.map(s => s.id === id ? { ...s, status: "completed" as const, velocity: Math.round((s.completedPoints / Math.max(s.storyPoints, 1)) * 100) } : s));
    const upd = sprints.find(s => s.id === id); if (upd && selectedSprint?.id === id) setSelectedSprint({ ...upd, status: "completed", velocity: Math.round((upd.completedPoints / Math.max(upd.storyPoints, 1)) * 100) });
  };

  const handleSpDelete = (id: string) => { setSprints(prev => prev.filter(s => s.id !== id)); if (selectedSprint?.id === id) setSelectedSprint(null); setSpDeleteConfirm(null); };

  const handleSpSaveRetro = () => {
    if (!showRetroModal) return;
    setSprints(prev => prev.map(s => s.id === showRetroModal.id ? { ...s, retro: retroText } : s));
    if (selectedSprint?.id === showRetroModal.id) setSelectedSprint({ ...showRetroModal, retro: retroText });
    setShowRetroModal(null);
  };

  const SpBurndown = ({ sprint }: { sprint: SprintData }) => {
    const data = sprint.burndown;
    if (!data.length) return <div className="flex items-center justify-center h-48 text-gray-400 text-[12px]">Chưa có dữ liệu</div>;
    const mx = Math.max(...data, sprint.storyPoints), td = 14, w = 400, h = 180, px = 40, py = 20, cw = w - px * 2, ch = h - py * 2;
    const idealL = Array.from({ length: td + 1 }, (_, i) => `${px + (i / td) * cw},${py + (1 - (sprint.storyPoints * (1 - i / td)) / mx) * ch}`).join(" ");
    const actualL = data.map((v, i) => `${px + (i / td) * cw},${py + (1 - v / mx) * ch}`).join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
        {[0,.25,.5,.75,1].map(r => <g key={r}><line x1={px} y1={py + r * ch} x2={w - px} y2={py + r * ch} stroke="#f3f4f6" /><text x={px - 5} y={py + r * ch + 3} textAnchor="end" className="text-[8px] fill-gray-400">{Math.round(mx * (1 - r))}</text></g>)}
        <polyline points={idealL} fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" />
        <polyline points={actualL} fill="none" stroke="#0891b2" strokeWidth="2" />
        {data.map((v, i) => <circle key={i} cx={px + (i / td) * cw} cy={py + (1 - v / mx) * ch} r="3" fill="#0891b2" stroke="white" strokeWidth="1.5" />)}
        <text x={px} y={h - 2} className="text-[8px] fill-gray-400">Ngày 1</text><text x={w - px} y={h - 2} textAnchor="end" className="text-[8px] fill-gray-400">Ngày {td}</text>
        <line x1={w - px - 80} y1={10} x2={w - px - 65} y2={10} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" /><text x={w - px - 62} y={13} className="text-[7px] fill-gray-400">Lý tưởng</text>
        <line x1={w - px - 80} y1={22} x2={w - px - 65} y2={22} stroke="#0891b2" strokeWidth="2" /><text x={w - px - 62} y={25} className="text-[7px] fill-gray-400">Thực tế</text>
      </svg>
    );
  };

  // Detail panel
  if (selectedSprint) {
    const sp = sprints.find(s => s.id === selectedSprint.id) || selectedSprint;
    const spTasks = getSprintTasks(sp);
    const sc = spStatusCfg[sp.status];
    const prog = sp.storyPoints > 0 ? Math.round((sp.completedPoints / sp.storyPoints) * 100) : 0;
    const byStatus = { todo: spTasks.filter(t => t.status === "todo"), in_progress: spTasks.filter(t => t.status === "in_progress"), in_review: spTasks.filter(t => t.status === "in_review"), done: spTasks.filter(t => t.status === "done") };

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="h-[52px] border-b border-gray-200 flex items-center px-5 gap-3 shrink-0">
          <button onClick={() => setSelectedSprint(null)} className="flex items-center gap-1 text-[12px] text-cyan-600 hover:text-cyan-700"><ChevronDown className="w-3.5 h-3.5 rotate-90" /> Quay lại</button>
          <div className="h-5 w-px bg-gray-200" /><Zap className="w-4 h-4 text-amber-500" /><span className="text-[13px] text-gray-700">{sp.name}</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
          <div className="flex-1" />
          <button onClick={() => { setEditingSprint(sp); setSpEditForm({ name: sp.name, goal: sp.goal, start: sp.start, end: sp.end, storyPoints: String(sp.storyPoints) }); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit3 className="w-3.5 h-3.5" /></button>
          {sp.status === "planned" && <button onClick={() => handleSpStart(sp.id)} className="text-[11px] bg-cyan-500 text-white px-3 py-1 rounded-lg hover:bg-cyan-600"><Play className="w-3 h-3 inline mr-1" />Bắt đầu</button>}
          {sp.status === "active" && <button onClick={() => handleSpComplete(sp.id)} className="text-[11px] bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 inline mr-1" />Kết thúc</button>}
          <button onClick={() => setSpDeleteConfirm(sp.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-6"><div>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100"><p className="text-[9px] text-gray-400 mb-1">Story Points</p><p className="text-xl text-gray-800 tracking-tight">{sp.storyPoints}</p></div>
            <div className="bg-cyan-50/50 rounded-xl p-3.5 border border-cyan-100"><p className="text-[9px] text-gray-400 mb-1">Hoàn thành</p><p className="text-xl text-cyan-700 tracking-tight">{sp.completedPoints} <span className="text-[10px] text-gray-400">pts</span></p></div>
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100"><p className="text-[9px] text-gray-400 mb-1">Tiến độ</p><p className="text-xl text-emerald-700 tracking-tight">{prog}%</p></div>
            <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100"><p className="text-[9px] text-gray-400 mb-1">Velocity</p><p className="text-xl text-amber-700 tracking-tight">{sp.velocity ?? "—"}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4"><p className="text-[10px] text-gray-400 mb-1">Mục tiêu Sprint</p><p className="text-[13px] text-gray-700">{sp.goal}</p><p className="text-[10px] text-gray-400 mt-2">{sp.start} → {sp.end}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5"><div className="flex items-center justify-between text-[11px] text-gray-500 mb-2"><span>{sp.completedPoints} / {sp.storyPoints} pts</span><span>{prog}%</span></div><div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all" style={{ width: `${prog}%` }} /></div></div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">{([["tasks","Tasks"],["burndown","Burndown"],["retro","Retro"]] as const).map(([k,l]) => <button key={k} onClick={() => setDetailTab(k)} className={`px-3 py-1 text-[11px] rounded-md transition-all ${detailTab === k ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{l}</button>)}</div>

          {detailTab === "tasks" && <div className="space-y-3">
            {(["in_progress","todo","in_review","done"] as const).map(st => {
              const ts = byStatus[st]; if (!ts.length && sp.taskIds.length > 0) return null; const c = spTaskCfg[st];
              return <div key={st}><p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />{c.label} ({ts.length})</p>
                {!ts.length && <p className="text-[11px] text-gray-300 ml-3.5 mb-2">Không có task</p>}
                {ts.map(t => { const a = teamMembers.find(m => m.id === t.assignee); return <div key={t.id} className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100 mb-1.5 hover:border-gray-200"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} /><span className="text-[12px] text-gray-700 flex-1 truncate">{t.title}</span>{t.priority && <span className={`text-[8px] px-1.5 py-0.5 rounded ${t.priority === "high" ? "bg-red-50 text-red-500" : t.priority === "medium" ? "bg-amber-50 text-amber-500" : "bg-gray-100 text-gray-500"}`}>{t.priority}</span>}{a && <span className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white text-[8px] flex items-center justify-center shrink-0" title={a.name}>{a.name.charAt(0)}</span>}</div>; })}
              </div>;
            })}
            {!sp.taskIds.length && <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><Layers className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-[12px] text-gray-400 mb-1">Chưa có task</p><p className="text-[10px] text-gray-300">Gán tasks từ Board/List view</p></div>}
          </div>}

          {detailTab === "burndown" && <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center justify-between mb-3"><p className="text-[12px] text-gray-700">Burndown Chart</p><span className="text-[9px] text-gray-400">Ngày {sp.burndown.length}/14</span></div><SpBurndown sprint={sp} /></div>}

          {detailTab === "retro" && <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3"><p className="text-[12px] text-gray-700 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-gray-400" /> Retrospective</p><button onClick={() => { setShowRetroModal(sp); setRetroText(sp.retro || ""); }} className="text-[11px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Sửa</button></div>
            {sp.retro ? <div className="space-y-3">{sp.retro.split(". ").filter(Boolean).map((line, i) => <div key={i} className="flex items-start gap-2"><span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-0.5 ${line.startsWith("Tốt") ? "bg-emerald-50 text-emerald-500" : line.startsWith("Cải thiện") ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400"}`}>{line.startsWith("Tốt") ? "✓" : "↑"}</span><p className="text-[12px] text-gray-600">{line.endsWith(".") ? line : line + "."}</p></div>)}</div>
            : <div className="text-center py-6 bg-gray-50 rounded-lg"><MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-[12px] text-gray-400">Chưa có retro</p><button onClick={() => { setShowRetroModal(sp); setRetroText(""); }} className="text-[11px] text-cyan-600 mt-2">+ Thêm</button></div>}
          </div>}
        </div></div>

        {editingSprint && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingSprint(null)}><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] text-gray-800">Chỉnh sửa Sprint</h3><button onClick={() => setEditingSprint(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
          <div className="space-y-3">
            <div><label className="text-[10px] text-gray-500 mb-1 block">Tên</label><input value={spEditForm.name} onChange={e => setSpEditForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
            <div><label className="text-[10px] text-gray-500 mb-1 block">Mục tiêu</label><input value={spEditForm.goal} onChange={e => setSpEditForm(p => ({ ...p, goal: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-gray-500 mb-1 block">Bắt đầu</label><input value={spEditForm.start} onChange={e => setSpEditForm(p => ({ ...p, start: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div><div><label className="text-[10px] text-gray-500 mb-1 block">Kết thúc</label><input value={spEditForm.end} onChange={e => setSpEditForm(p => ({ ...p, end: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div></div>
            <div><label className="text-[10px] text-gray-500 mb-1 block">Story Points</label><input value={spEditForm.storyPoints} onChange={e => setSpEditForm(p => ({ ...p, storyPoints: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" type="number" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-5"><button onClick={() => setEditingSprint(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button><button onClick={handleSpSaveEdit} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Lưu</button></div>
        </div></div>}

        {spDeleteConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSpDeleteConfirm(null)}><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Xóa Sprint?</h3><p className="text-[11px] text-gray-500 mt-0.5">Tasks sẽ được gỡ.</p></div></div>
          <div className="flex justify-end gap-2 mt-5"><button onClick={() => setSpDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Hủy</button><button onClick={() => handleSpDelete(spDeleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Xóa</button></div>
        </div></div>}

        {showRetroModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowRetroModal(null)}><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] text-gray-800">Retrospective — {showRetroModal.name}</h3><button onClick={() => setShowRetroModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
          <p className="text-[10px] text-gray-400 mb-2">Ghi: Tốt: ... Cải thiện: ...</p>
          <textarea value={retroText} onChange={e => setRetroText(e.target.value)} rows={6} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 text-gray-700 resize-none" placeholder="Tốt: ... Cải thiện: ..." />
          <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowRetroModal(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button><button onClick={handleSpSaveRetro} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Lưu</button></div>
        </div></div>}
      </div>
    );
  }

  // Main list view
  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="text-gray-900 tracking-tight flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Sprints</h2><p className="text-[12px] text-gray-400 mt-1">Quản lý sprint & theo dõi velocity</p></div>
          <button onClick={() => { setSpCreateForm({ name: `Sprint ${sprints.length + 3}`, goal: "", start: "", end: "", storyPoints: "" }); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[12px] px-4 py-2 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 transition-all"><Plus className="w-3.5 h-3.5" /> Tạo Sprint</button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm"><p className="text-[9px] text-gray-400 mb-1">Tổng Sprints</p><p className="text-xl text-gray-800 tracking-tight">{sprints.length}</p></div>
          <div className="bg-white rounded-xl border border-cyan-200 p-3.5 shadow-sm"><p className="text-[9px] text-gray-400 mb-1">Hiện tại</p><p className="text-xl text-cyan-700 tracking-tight">{activeSprint?.name || "—"}</p></div>
          <div className="bg-white rounded-xl border border-emerald-200 p-3.5 shadow-sm"><p className="text-[9px] text-gray-400 mb-1">Avg Velocity</p><p className="text-xl text-emerald-700 tracking-tight">{avgVelocity}%</p></div>
          <div className="bg-white rounded-xl border border-amber-200 p-3.5 shadow-sm"><p className="text-[9px] text-gray-400 mb-1">Đã xong</p><p className="text-xl text-amber-700 tracking-tight">{completedSprints.length}</p></div>
        </div>

        {completedSprints.length > 0 && <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-5">
          <p className="text-[11px] text-gray-600 mb-3 flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-gray-400" /> Velocity History</p>
          <div className="flex items-end gap-2 h-20">{completedSprints.map(sp => <div key={sp.id} className="flex-1 flex flex-col items-center gap-1"><span className="text-[8px] text-gray-500">{sp.velocity}%</span><div className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-teal-400" style={{ height: `${(sp.velocity || 0) * 0.7}px` }} /><span className="text-[7px] text-gray-400 truncate max-w-full">{sp.name.replace("Sprint ", "S")}</span></div>)}</div>
        </div>}

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">{([["all","Tất cả"],["active","Đang chạy"],["completed","Hoàn thành"],["planned","Kế hoạch"]] as const).map(([k,l]) => <button key={k} onClick={() => setSprintFilter(k)} className={`px-2.5 py-0.5 text-[10px] rounded-md transition-all ${sprintFilter === k ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{l}</button>)}</div>
          <span className="text-[10px] text-gray-400 ml-auto">{filteredSprints.length} sprints</span>
        </div>

        {activeSprint && sprintFilter !== "completed" && sprintFilter !== "planned" && (
          <div className="bg-white rounded-2xl border-2 border-cyan-200 p-5 shadow-sm mb-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedSprint(activeSprint)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center"><Zap className="w-5 h-5 text-cyan-600" /></div>
                <div><h3 className="text-[14px] text-gray-800">{activeSprint.name} <span className="text-[9px] bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full border border-cyan-100 ml-2">Active</span></h3><p className="text-[11px] text-gray-500">{activeSprint.start} → {activeSprint.end} · {activeSprint.goal}</p></div></div>
              <div className="text-right"><p className="text-2xl text-cyan-700 tracking-tight">{activeSprint.storyPoints > 0 ? Math.round((activeSprint.completedPoints / activeSprint.storyPoints) * 100) : 0}%</p><p className="text-[10px] text-gray-400">Tiến độ</p></div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all" style={{ width: `${activeSprint.storyPoints > 0 ? Math.round((activeSprint.completedPoints / activeSprint.storyPoints) * 100) : 0}%` }} /></div>
            <div className="flex items-center justify-between text-[11px] text-gray-500"><span>{activeSprint.completedPoints} / {activeSprint.storyPoints} pts</span><span className="text-[10px] text-cyan-600">Xem chi tiết →</span></div>
          </div>
        )}

        <div className="space-y-2.5">
          {filteredSprints.filter(s => s.id !== activeSprint?.id || sprintFilter !== "all").map(sp => {
            const sc = spStatusCfg[sp.status]; const prog = sp.storyPoints > 0 ? Math.round((sp.completedPoints / sp.storyPoints) * 100) : 0;
            return <div key={sp.id} onClick={() => setSelectedSprint(sp)} className={`bg-white rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${sp.status === "active" && sprintFilter !== "all" ? "border-cyan-200" : "border-gray-200 shadow-sm"}`}>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>{sp.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-[13px] text-gray-800">{sp.name}</p><span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span></div><p className="text-[10px] text-gray-500 mt-0.5">{sp.start} → {sp.end} · {sp.goal}</p></div>
                <div className="flex items-center gap-4 shrink-0">
                  {sp.storyPoints > 0 && <div className="w-20"><div className="flex items-center justify-between text-[8px] text-gray-400 mb-0.5"><span>{sp.completedPoints}/{sp.storyPoints}</span><span>{prog}%</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${prog}%`, backgroundColor: sc.color }} /></div></div>}
                  {sp.velocity !== undefined && <span className="text-[10px] text-gray-500 w-10 text-right">{sp.velocity}%</span>}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </div>
            </div>;
          })}
        </div>

        {!filteredSprints.length && <div className="text-center py-12"><Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-[13px] text-gray-400">Không có sprint</p></div>}
      </div>

      {showCreateModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-[15px] text-gray-800 tracking-tight">Tạo Sprint mới</h3><button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
          <div className="space-y-3">
            <div><label className="text-[10px] text-gray-500 mb-1 block">Tên *</label><input value={spCreateForm.name} onChange={e => setSpCreateForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" autoFocus /></div>
            <div><label className="text-[10px] text-gray-500 mb-1 block">Mục tiêu *</label><input value={spCreateForm.goal} onChange={e => setSpCreateForm(p => ({ ...p, goal: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" placeholder="Mục tiêu chính..." /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-gray-500 mb-1 block">Bắt đầu</label><input value={spCreateForm.start} onChange={e => setSpCreateForm(p => ({ ...p, start: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" placeholder="DD/MM" /></div><div><label className="text-[10px] text-gray-500 mb-1 block">Kết thúc</label><input value={spCreateForm.end} onChange={e => setSpCreateForm(p => ({ ...p, end: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" placeholder="DD/MM" /></div></div>
            <div><label className="text-[10px] text-gray-500 mb-1 block">Story Points</label><input value={spCreateForm.storyPoints} onChange={e => setSpCreateForm(p => ({ ...p, storyPoints: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" type="number" placeholder="0" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-5"><button onClick={() => setShowCreateModal(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Hủy</button><button onClick={handleSpCreate} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Tạo Sprint</button></div>
        </div>
      </div>}
    </div>
  );
}
