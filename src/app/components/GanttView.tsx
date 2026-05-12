import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Flag, Diamond, Search, Plus, Trash2, ExternalLink, CalendarDays, MoreHorizontal, Download, Check, X } from "lucide-react";
import { type Task, type TaskType, projects, sprints, epics, teamMembers, statusConfig, priorityConfig, taskTypeConfig } from "./data";
import { TaskSidePanel } from "./BoardView";

// ── Multi-select filter dropdown ─────────────────────────────────────────────
function FilterChip<T extends string>({
  label, options, selected, onChange, colorDot,
}: {
  label: string;
  options: { value: T; label: string; color?: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  colorDot?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (v: T) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const active = selected.length > 0;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${active ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}>
        <span>{active ? `${label} (${selected.length})` : label}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          {options.map(opt => (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700">
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt.value) ? "bg-cyan-500 border-cyan-500" : "border-gray-300"}`}>
                {selected.includes(opt.value) && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              {colorDot && opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
              {opt.label}
            </button>
          ))}
          {selected.length > 0 && (
            <button onClick={() => onChange([])} className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-400 hover:text-red-500 border-t border-gray-100 mt-1">
              <X className="w-3 h-3" /> Xóa filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface GanttViewProps { tasks: Task[]; onTaskClick: (task: Task) => void; onSaveTask: (task: Task) => void; onDeleteTask: (id: string) => void; onAddTask: (title: string, status: Task["status"], parentId?: string, type?: TaskType, assigneeId?: string) => void; selectedProject: string | null; }

type ZoomLevel = "day" | "week" | "month" | "quarter";
type DragMode = "move" | "resize" | "resize-left";

export function GanttView({ tasks, onTaskClick, onSaveTask, onDeleteTask, onAddTask, selectedProject }: GanttViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("day");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => ({
    ...Object.fromEntries(epics.map(e => [e.id, true])),
    "no-epic": true,
  }));
  const [searchQ, setSearchQ] = useState("");
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"epic" | "sprint">("epic");
  const [contextMenu, setContextMenu] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [inlineCreate, setInlineCreate] = useState<{ groupKey: string } | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineType, setInlineType] = useState<TaskType>("task");
  const [showInlineTypePicker, setShowInlineTypePicker] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);
  const [filterEpic, setFilterEpic] = useState<string[]>([]);
  const [filterStatusArr, setFilterStatusArr] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [showInlineEpic, setShowInlineEpic] = useState(false);
  const [inlineEpicTitle, setInlineEpicTitle] = useState("");
  const epicSubmittedRef = useRef(false);
  const [taskRowMenu, setTaskRowMenu] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [epicMenu, setEpicMenu] = useState<{ epic: typeof epics[0]; x: number; y: number } | null>(null);
  const [dragOverride, setDragOverride] = useState<Record<string, { startDate: string; dueDate: string }>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ taskId: string; mode: DragMode; startX: number; startScrollLeft: number; origStart: string; origEnd: string } | null>(null);
  const didDragRef = useRef(false);
  const hasAutoScrolled = useRef(false);

  // ── Calculations (must be before hooks that use them) ─────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayWidth = zoomLevel === "day" ? 38 : zoomLevel === "week" ? 14 : zoomLevel === "month" ? 10 : 4;

  const filtered = useMemo(() => {
    let result = selectedProject ? tasks.filter(t => t.projectId === selectedProject) : tasks;
    if (searchQ) result = result.filter(t => t.title.toLowerCase().includes(searchQ.toLowerCase()));
    if (filterAssignee.length) result = result.filter(t => t.assignee && filterAssignee.includes(t.assignee.id));
    if (filterEpic.length) result = result.filter(t => t.epicId && filterEpic.includes(t.epicId));
    if (filterStatusArr.length) result = result.filter(t => filterStatusArr.includes(t.status));
    if (filterType.length) result = result.filter(t => filterType.includes(t.type || "task"));
    return result;
  }, [tasks, selectedProject, searchQ, filterAssignee, filterEpic, filterStatusArr, filterType]);

  const taskDates = filtered.flatMap(t => [
    t.startDate ? new Date(t.startDate) : null,
    t.dueDate ? new Date(t.dueDate) : null,
  ]).filter(Boolean) as Date[];
  const minDate = taskDates.length > 0 ? new Date(Math.min(...taskDates.map(d => d.getTime()))) : new Date(today);
  const maxDate = taskDates.length > 0 ? new Date(Math.max(...taskDates.map(d => d.getTime()))) : new Date(today);
  const startRef = new Date(Math.min(minDate.getTime(), today.getTime()));
  startRef.setDate(1);
  startRef.setMonth(startRef.getMonth() - 3); // 3 tháng buffer để cuộn về trước
  const minDays = Math.ceil((maxDate.getTime() - startRef.getTime()) / 86400000) + 14;
  const totalDays = Math.max(zoomLevel === "day" ? 35 : zoomLevel === "week" ? 84 : zoomLevel === "month" ? 180 : 365, minDays);
  const dates = Array.from({ length: totalDays }, (_, i) => { const d = new Date(startRef); d.setDate(d.getDate() + i); return d; });
  const todayIdx = Math.floor((today.getTime() - startRef.getTime()) / 86400000);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr); d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const onBarMouseDown = useCallback((e: React.MouseEvent, task: Task, mode: DragMode) => {
    e.preventDefault(); e.stopPropagation();
    didDragRef.current = false;
    const origStart = task.startDate || task.createdAt.split("T")[0];
    const origEnd = task.dueDate || addDays(origStart, 7);
    dragRef.current = { taskId: task.id, mode, startX: e.clientX, startScrollLeft: scrollRef.current?.scrollLeft ?? 0, origStart, origEnd };
  }, [dayWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { taskId, mode, startX, startScrollLeft, origStart, origEnd } = dragRef.current;
      if (Math.abs(e.clientX - startX) > 5) didDragRef.current = true;

      // Auto-scroll khi kéo gần mép trái/phải
      if (scrollRef.current) {
        const rect = scrollRef.current.getBoundingClientRect();
        const edge = 80;
        if (e.clientX < rect.left + edge) scrollRef.current.scrollLeft -= 8;
        else if (e.clientX > rect.right - edge) scrollRef.current.scrollLeft += 8;
      }

      const scrollDelta = (scrollRef.current?.scrollLeft ?? 0) - startScrollLeft;
      const deltaDays = Math.round((e.clientX - startX + scrollDelta) / dayWidth);
      if (mode === "move") {
        setDragOverride(prev => ({ ...prev, [taskId]: { startDate: addDays(origStart, deltaDays), dueDate: addDays(origEnd, deltaDays) } }));
      } else if (mode === "resize-left") {
        const newStart = addDays(origStart, deltaDays);
        if (newStart <= origEnd) setDragOverride(prev => ({ ...prev, [taskId]: { startDate: newStart, dueDate: origEnd } }));
      } else {
        const newEnd = addDays(origEnd, deltaDays);
        if (newEnd >= origStart) setDragOverride(prev => ({ ...prev, [taskId]: { startDate: origStart, dueDate: newEnd } }));
      }
    };
    const onMouseUp = () => {
      if (!dragRef.current) return;
      const { taskId } = dragRef.current;
      const override = dragOverride[taskId];
      if (override) {
        const task = tasks.find(t => t.id === taskId);
        if (task) onSaveTask({ ...task, startDate: override.startDate, dueDate: override.dueDate });
        setDragOverride(prev => { const n = { ...prev }; delete n[taskId]; return n; });
      }
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [dayWidth, dragOverride, tasks, onSaveTask]);

  const scrollToToday = useCallback(() => {
    if (!scrollRef.current) return;
    const left = todayIdx * dayWidth - scrollRef.current.clientWidth / 2;
    scrollRef.current.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [todayIdx, dayWidth]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      setContextMenu(null);
      setTaskRowMenu(null);
      setEpicMenu(null);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const exportCSV = () => {
    const rows = [["Title", "Status", "Priority", "Assignee", "Start Date", "Due Date", "Epic", "Sprint"]];
    filtered.forEach(t => {
      const epic = epics.find(e => e.id === t.epicId);
      const sprint = sprints.find(s => s.id === t.sprintId);
      rows.push([t.title, t.status, t.priority, t.assignee?.name || "", t.startDate || "", t.dueDate || "", epic?.title || "", sprint?.name || ""]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "gantt-export.csv"; a.click();
  };

  useEffect(() => {
    if (hasAutoScrolled.current || !scrollRef.current) return;
    hasAutoScrolled.current = true;
    const left = todayIdx * dayWidth - scrollRef.current.clientWidth / 2;
    scrollRef.current.scrollTo({ left: Math.max(0, left) });
  }, [todayIdx, dayWidth]);

  useEffect(() => {
    const main = scrollRef.current;
    const bar = scrollbarRef.current;
    if (!main || !bar) return;
    let syncingFromMain = false;
    let syncingFromBar = false;
    const onMainScroll = () => {
      if (syncingFromBar) return;
      syncingFromMain = true;
      bar.scrollLeft = main.scrollLeft;
      syncingFromMain = false;
    };
    const onBarScroll = () => {
      if (syncingFromMain) return;
      syncingFromBar = true;
      main.scrollLeft = bar.scrollLeft;
      syncingFromBar = false;
    };
    main.addEventListener("scroll", onMainScroll);
    bar.addEventListener("scroll", onBarScroll);
    return () => {
      main.removeEventListener("scroll", onMainScroll);
      bar.removeEventListener("scroll", onBarScroll);
    };
  }, []);

  const submitInline = () => {
    const title = inlineTitle.trim();
    if (title) onAddTask(title, "todo", undefined, inlineType);
    setInlineCreate(null);
    setInlineTitle("");
    setInlineType("task");
    setShowInlineTypePicker(false);
  };

  // ── Grid columns for week/month/quarter ───────────────────────────────────
  const gridCols = useMemo(() => {
    if (zoomLevel === "day") return [];
    const cols: { left: number; width: number; isCurrent: boolean; isAlt: boolean }[] = [];
    let colStart = 0; let curKey = ""; let idx = 0;
    dates.forEach((d, i) => {
      let key: string;
      if (zoomLevel === "week") key = `${d.getFullYear()}-W${Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000)}`;
      else if (zoomLevel === "month") key = `${d.getFullYear()}-${d.getMonth()}`;
      else key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3)}`;
      if (key !== curKey) {
        if (curKey !== "") {
          const ref = dates[colStart];
          let isCurrent = false;
          if (zoomLevel === "week") isCurrent = ref <= today && today < d;
          else if (zoomLevel === "month") isCurrent = ref.getMonth() === today.getMonth() && ref.getFullYear() === today.getFullYear();
          else isCurrent = Math.floor(ref.getMonth() / 3) === Math.floor(today.getMonth() / 3) && ref.getFullYear() === today.getFullYear();
          cols.push({ left: colStart * dayWidth, width: (i - colStart) * dayWidth, isCurrent, isAlt: idx % 2 === 1 });
          idx++;
        }
        colStart = i; curKey = key;
      }
    });
    const ref = dates[colStart];
    let isCurrent = false;
    if (zoomLevel === "month") isCurrent = ref.getMonth() === today.getMonth() && ref.getFullYear() === today.getFullYear();
    else if (zoomLevel === "quarter") isCurrent = Math.floor(ref.getMonth() / 3) === Math.floor(today.getMonth() / 3) && ref.getFullYear() === today.getFullYear();
    cols.push({ left: colStart * dayWidth, width: (dates.length - colStart) * dayWidth, isCurrent, isAlt: idx % 2 === 1 });
    return cols;
  }, [zoomLevel, dates, dayWidth, today]);

  // ── Grouped tasks ─────────────────────────────────────────────────────────
  const sortWithChildren = (tasks: Task[]): Task[] => {
    const parents = tasks.filter(t => !t.parentId);
    const childrenOf = (id: string) => tasks.filter(t => t.parentId === id);
    const result: Task[] = [];
    parents.forEach(p => { result.push(p); result.push(...childrenOf(p.id)); });
    tasks.filter(t => t.parentId && !tasks.find(p => p.id === t.parentId)).forEach(t => result.push(t));
    return result;
  };

  // Epic-based groups
  const epicGroups = useMemo(() => {
    if (groupBy !== "epic") return null;
    const visibleEpics = epics.filter(ep =>
      (!selectedProject || ep.projectId === selectedProject) &&
      (filterEpic.length === 0 || filterEpic.includes(ep.id))
    );
    const groups = visibleEpics.map(ep => ({
      epic: ep,
      tasks: sortWithChildren(filtered.filter(t => t.epicId === ep.id)),
    }));
    const noEpicTasks = filterEpic.length === 0
      ? sortWithChildren(filtered.filter(t => !t.epicId))
      : [];
    return { groups, noEpicTasks };
  }, [filtered, groupBy, selectedProject, filterEpic]);

  // Project/Sprint groups (fallback)
  const grouped = useMemo(() => {
    if (groupBy === "epic") return {};
    const map: Record<string, { color: string; icon: string; tasks: Task[]; sprint?: typeof sprints[0] }> = {};
    if (groupBy === "sprint") {
      sprints.forEach(s => { map[s.id] = { color: s.status === "active" ? "#0891b2" : s.status === "completed" ? "#059669" : "#94a3b8", icon: "🏃", tasks: [], sprint: s }; });
      map["backlog"] = { color: "#94a3b8", icon: "📋", tasks: [] };
      filtered.forEach(t => { const key = t.sprintId && map[t.sprintId] ? t.sprintId : "backlog"; map[key].tasks.push(t); });
      Object.keys(map).forEach(k => { if (map[k].tasks.length === 0 && k !== "backlog") delete map[k]; });
    } else {
      filtered.forEach(t => {
        const p = projects.find(p => p.id === t.projectId);
        const k = p?.name || "Other";
        if (!map[k]) map[k] = { color: p?.color || "#6b7280", icon: p?.icon || "📁", tasks: [] };
        map[k].tasks.push(t);
      });
    }
    Object.keys(map).forEach(k => { map[k].tasks = sortWithChildren(map[k].tasks); });
    return map;
  }, [filtered, groupBy]);

  const toggleGroup = (key: string) => setCollapsedGroups(p => ({ ...p, [key]: !p[key] }));

  const getBar = (task: Task) => {
    const override = dragOverride[task.id];
    const sStr = override?.startDate || task.startDate;
    const eStr = override?.dueDate || task.dueDate;
    if (!sStr && !eStr) return null;
    const resolvedStart = sStr || eStr!;
    const resolvedEnd = eStr || sStr!;
    const s = new Date(resolvedStart);
    const e = new Date(resolvedEnd);
    const startDay = Math.max(0, Math.floor((s.getTime() - startRef.getTime()) / 86400000));
    const endDay = Math.min(totalDays - 1, Math.floor((e.getTime() - startRef.getTime()) / 86400000));
    const width = Math.max(1, endDay - startDay + 1);
    return { left: startDay * dayWidth, width: width * dayWidth - 4, sStr: resolvedStart, eStr: resolvedEnd };
  };

  const getEpicBar = (epic: typeof epics[0]) => {
    if (!epic.startDate && !epic.dueDate) return null;
    const sStr = epic.startDate || epic.dueDate!;
    const eStr = epic.dueDate || epic.startDate!;
    const s = new Date(sStr); const e = new Date(eStr);
    const startDay = Math.max(0, Math.floor((s.getTime() - startRef.getTime()) / 86400000));
    const endDay = Math.min(totalDays - 1, Math.floor((e.getTime() - startRef.getTime()) / 86400000));
    const width = Math.max(1, endDay - startDay + 1);
    return { left: startDay * dayWidth, width: width * dayWidth - 4 };
  };

  const barColor = (t: Task) => {
    if (t.status === "done") return { bg: "rgba(5,150,105,0.2)", border: "#059669", fill: "#059669" };
    if (t.status === "in_review") return { bg: "rgba(217,119,6,0.2)", border: "#d97706", fill: "#d97706" };
    if (t.status === "in_progress") return { bg: "rgba(8,145,178,0.2)", border: "#0891b2", fill: "#0891b2" };
    return { bg: "rgba(100,116,139,0.12)", border: "#94a3b8", fill: "#94a3b8" };
  };

  const pct = (t: Task) => {
    if (t.status === "done") return 100;
    const sub = t.subtasks;
    if (sub && sub.length > 0) return Math.round((sub.filter(s => s.done).length / sub.length) * 100);
    if (t.status === "in_review") return 80;
    if (t.status === "in_progress") return 40;
    return 0;
  };

  const isCritical = (t: Task) => {
    if (!showCriticalPath) return false;
    const isOverdue = t.dueDate && new Date(t.dueDate) < today && t.status !== "done";
    const isBlocking = filtered.some(other => other.dependencies?.includes(t.id) && other.status !== "done");
    return isOverdue || (isBlocking && t.status !== "done");
  };

  const isMilestone = (t: Task) => t.tags.includes("milestone") || (t.startDate === t.dueDate && !!t.dueDate);

  const renderTopHeader = () => {
    const groups: { label: string; width: number }[] = [];
    let cur = { label: "", width: 0 };
    dates.forEach(d => {
      let label: string;
      if (zoomLevel === "month" || zoomLevel === "quarter") label = String(d.getFullYear());
      else label = d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
      if (label !== cur.label) {
        if (cur.width > 0) groups.push(cur);
        cur = { label, width: dayWidth };
      } else {
        cur.width += dayWidth;
      }
    });
    if (cur.width > 0) groups.push(cur);
    return groups.map((g, i) => (
      <div key={i} style={{ width: g.width }} className="shrink-0 flex items-center px-2 border-r border-gray-200 text-[9px] text-gray-500 font-medium capitalize">
        {g.label}
      </div>
    ));
  };

  const renderBottomHeader = () => {
    if (zoomLevel === "day") {
      return dates.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        return (
          <div key={i} style={{ width: dayWidth }} className={`shrink-0 flex flex-col items-center justify-center border-r border-gray-100 ${isToday ? "bg-cyan-50" : isWeekend ? "bg-gray-50/50" : ""}`}>
            <span className={`text-[9px] ${isToday ? "text-cyan-600" : "text-gray-400"}`}>{["CN","T2","T3","T4","T5","T6","T7"][d.getDay()]}</span>
            <span className={`text-[11px] ${isToday ? "text-white bg-cyan-500 w-5 h-5 rounded-full flex items-center justify-center" : "text-gray-600"}`}>{d.getDate()}</span>
          </div>
        );
      });
    }
    if (zoomLevel === "week") {
      const weeks: { start: Date; end: Date; days: number }[] = [];
      let weekStart = new Date(dates[0]); let weekDays = 0;
      dates.forEach((d, i) => {
        weekDays++;
        if (d.getDay() === 6 || i === dates.length - 1) {
          weeks.push({ start: new Date(weekStart), end: new Date(d), days: weekDays });
          weekStart = new Date(d); weekStart.setDate(weekStart.getDate() + 1); weekDays = 0;
        }
      });
      return weeks.map((w, i) => (
        <div key={i} style={{ width: w.days * dayWidth }} className="shrink-0 flex items-center justify-center border-r border-gray-200 text-[9px] text-gray-500">
          {w.start.getDate()}/{w.start.getMonth()+1} - {w.end.getDate()}/{w.end.getMonth()+1}
        </div>
      ));
    }
    const months: { name: string; days: number }[] = [];
    let prevMonth = -1; let monthDays = 0;
    dates.forEach((d, i) => {
      if (d.getMonth() !== prevMonth) {
        if (prevMonth !== -1) months.push({ name: new Date(d.getFullYear(), prevMonth, 1).toLocaleDateString("vi-VN", { month: "short" }), days: monthDays });
        prevMonth = d.getMonth(); monthDays = 0;
      }
      monthDays++;
      if (i === dates.length - 1) months.push({ name: new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("vi-VN", { month: "short" }), days: monthDays });
    });
    if (zoomLevel === "quarter") {
      const quarters: { label: string; width: number }[] = [];
      let cur = { label: "", width: 0 };
      dates.forEach(d => {
        const q = `Q${Math.floor(d.getMonth() / 3) + 1}`;
        if (q !== cur.label) {
          if (cur.width > 0) quarters.push(cur);
          cur = { label: q, width: dayWidth };
        } else { cur.width += dayWidth; }
      });
      if (cur.width > 0) quarters.push(cur);
      return quarters.map((q, i) => (
        <div key={i} style={{ width: q.width }} className="shrink-0 flex items-center justify-center border-r border-gray-200 text-[11px] font-medium text-gray-600">{q.label}</div>
      ));
    }
    return months.map((m, i) => (
      <div key={i} style={{ width: m.days * dayWidth }} className="shrink-0 flex items-center justify-center border-r border-gray-200 text-[10px] text-gray-500">{m.name}</div>
    ));
  };

  const renderHeader = renderBottomHeader;

  const doneTasks = filtered.filter(t => t.status === "done").length;
  const overdueTasks = filtered.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== "done").length;

  /* ── Mobile timeline list ─────────────────────────────────────────────────── */
  if (window.innerWidth < 768) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const totalMs = monthEnd.getTime() - monthStart.getTime();

    const getBar = (task: Task) => {
      if (!task.startDate && !task.dueDate) return null;
      const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
      const end = task.dueDate ? new Date(task.dueDate) : start;
      const left = Math.max(0, (start.getTime() - monthStart.getTime()) / totalMs) * 100;
      const right = Math.min(100, (end.getTime() - monthStart.getTime()) / totalMs) * 100;
      const width = Math.max(right - left, 2);
      return { left, width };
    };

    const allGroups: { label: string; color: string; tasks: Task[] }[] = [];
    if (epicGroups) {
      epicGroups.groups.forEach(g => {
        if (g.tasks.length > 0) allGroups.push({ label: g.epic.title, color: g.epic.color, tasks: g.tasks });
      });
      if (epicGroups.noEpicTasks.length > 0) allGroups.push({ label: "Không có Epic", color: "#94a3b8", tasks: epicGroups.noEpicTasks });
    }

    const todayPct = Math.min(100, Math.max(0, (now.getTime() - monthStart.getTime()) / totalMs * 100));
    const monthLabel = now.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-gray-700 capitalize">{monthLabel}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{doneTasks}/{filtered.length} task hoàn thành{overdueTasks > 0 ? ` · ${overdueTasks} quá hạn` : ""}</p>
          </div>
          <div className="relative flex-1 max-w-[140px] ml-3">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm task..."
              className="w-full pl-7 pr-2 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400" />
          </div>
        </div>

        {/* Timeline scale */}
        <div className="shrink-0 px-4 py-1.5 border-b border-gray-100 bg-gray-50/60">
          <div className="relative h-4">
            {[0, 25, 50, 75, 100].map(pct => {
              const d = new Date(monthStart.getTime() + (totalMs * pct) / 100);
              return (
                <span key={pct} className="absolute text-[10px] text-gray-400 -translate-x-1/2" style={{ left: `${pct}%` }}>
                  {d.getDate()}/{d.getMonth() + 1}
                </span>
              );
            })}
            <div className="absolute top-0 bottom-0 w-px bg-cyan-400/60" style={{ left: `${todayPct}%` }} />
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto">
          {allGroups.map(group => (
            <div key={group.label}>
              {/* Epic header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: group.color }} />
                <span className="text-[12px] font-semibold text-gray-700">{group.label}</span>
                <span className="text-[11px] text-gray-400">({group.tasks.length})</span>
              </div>
              {/* Tasks */}
              {group.tasks.map(task => {
                const bar = getBar(task);
                const st = statusConfig[task.status as keyof typeof statusConfig];
                const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "done";
                return (
                  <button key={task.id} onClick={() => onTaskClick(task)}
                    className="w-full px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px] text-gray-800 flex-1 min-w-0 truncate">{task.title}</span>
                      {st && (
                        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.color + "22", color: st.color }}>
                          {st.label}
                        </span>
                      )}
                    </div>
                    {/* Timeline bar */}
                    <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                      {bar && (
                        <div className="absolute top-0 bottom-0 rounded-full flex items-center justify-center"
                          style={{ left: `${bar.left}%`, width: `${bar.width}%`, backgroundColor: isOverdue ? "#ef4444" : group.color, opacity: task.status === "done" ? 0.4 : 0.8 }}>
                          {bar.width > 15 && (
                            <span className="text-[9px] text-white font-medium truncate px-1">
                              {task.startDate || task.dueDate} → {task.dueDate}
                            </span>
                          )}
                        </div>
                      )}
                      {!bar && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400">Chưa có ngày</span>
                        </div>
                      )}
                      {/* Today marker */}
                      <div className="absolute top-0 bottom-0 w-px bg-cyan-500/70" style={{ left: `${todayPct}%` }} />
                    </div>
                    {task.dueDate && (
                      <p className={`text-[11px] mt-1 ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                        {task.startDate ? `${task.startDate} → ` : ""}{task.dueDate}{isOverdue ? " · Quá hạn" : ""}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <CalendarDays className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-[13px]">Không có task nào</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex bg-gray-50/50">
    <div className="flex-1 overflow-hidden flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="px-5 py-2 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm task..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" />
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {([["day","Day"],["week","Week"],["month","Month"],["quarter","Quarters"]] as [ZoomLevel,string][]).map(([v,l]) => (
            <button key={v} onClick={() => setZoomLevel(v)} className={`px-2 py-1 text-[10px] rounded-md transition-all ${zoomLevel===v?"bg-white shadow-sm text-gray-800":"text-gray-500"}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setGroupBy("epic")} className={`flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-md transition-all ${groupBy==="epic"?"bg-white shadow-sm text-gray-800":"text-gray-500"}`}>
            ⚡ Epic
          </button>

          <button onClick={() => setGroupBy("sprint")} className={`flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-md transition-all ${groupBy==="sprint"?"bg-white shadow-sm text-gray-800":"text-gray-500"}`}>
            🏃 Sprint
          </button>
        </div>
        <button onClick={() => setShowCriticalPath(!showCriticalPath)}
          className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${showCriticalPath?"border-red-300 bg-red-50 text-red-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          <Flag className="w-3 h-3" /> Critical Path
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>{filtered.length} tasks</span>
          <span className="text-emerald-500">{doneTasks} done</span>
          {overdueTasks > 0 && <span className="text-red-500">{overdueTasks} overdue</span>}
        </div>
        <button onClick={scrollToToday}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
          <CalendarDays className="w-3 h-3" /> Hôm nay
        </button>
        <div ref={moreMenuRef} className="relative">
          <button onClick={e => { e.stopPropagation(); setShowMoreMenu(v => !v); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-44">
              <button onClick={() => { exportCSV(); setShowMoreMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                <Download className="w-3.5 h-3.5 text-gray-400" /> Xuất CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-5 py-1.5 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0">
        <FilterChip
          label="Assignee"
          options={teamMembers.map(m => ({ value: m.id, label: m.name.split(" ").pop()!, color: m.color }))}
          selected={filterAssignee}
          onChange={setFilterAssignee}
          colorDot
        />
        <FilterChip
          label="Epic"
          options={epics.map(e => ({ value: e.id, label: e.title, color: e.color }))}
          selected={filterEpic}
          onChange={setFilterEpic}
          colorDot
        />
        <FilterChip
          label="Status"
          options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))}
          selected={filterStatusArr}
          onChange={setFilterStatusArr}
          colorDot
        />
        <FilterChip<string>
          label="Type"
          options={(Object.entries(taskTypeConfig) as [string, { label: string; icon: string; color: string }][]).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}`, color: v.color }))}
          selected={filterType}
          onChange={setFilterType}
        />
        {(filterAssignee.length > 0 || filterEpic.length > 0 || filterStatusArr.length > 0 || filterType.length > 0) && (
          <button onClick={() => { setFilterAssignee([]); setFilterEpic([]); setFilterStatusArr([]); setFilterType([]); }}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors ml-1">
            <X className="w-3 h-3" /> Xóa tất cả
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-scroll" style={{ scrollbarWidth: "none" }}>
        <div className="flex min-w-max min-h-full">
          {/* Left: task list */}
          <div className="w-[280px] shrink-0 bg-white border-r border-gray-200 sticky left-0 z-10 min-h-full">
            <div className="h-[48px] border-b border-gray-200 px-4 flex items-center gap-2 bg-white sticky top-0 z-10">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Task</span>
              <div className="flex-1" />
              <span className="text-[9px] text-gray-300">Progress</span>
            </div>
            {/* LEFT PANEL TASK GROUPS */}
            {groupBy === "epic" && epicGroups ? (
              <>
                {epicGroups.groups.map(({ epic, tasks: epicTasks }) => {
                  const isCollapsed = collapsedGroups[epic.id];
                  const gKey = epic.id;
                  const taskList = epicTasks;
                  const epicStatus = statusConfig[epic.status];
                  return (
                    <div key={epic.id}>
                      <div className="flex items-center border-b border-gray-100 group/hdr" style={{ backgroundColor: epic.color + "12", borderLeft: `3px solid ${epic.color}` }}>
                        <button onClick={() => toggleGroup(epic.id)} className="flex-1 min-w-0 px-3 py-2 flex items-center gap-2 hover:opacity-80 transition-all">
                          {isCollapsed ? <ChevronRight className="w-3 h-3 shrink-0 text-gray-500" /> : <ChevronDown className="w-3 h-3 shrink-0 text-gray-500" />}
                          <span className="text-[12px] shrink-0">⚡</span>
                          <span className="text-[11px] font-semibold flex-1 min-w-0 text-left truncate" style={{ color: epic.color }}>{epic.title}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: epicStatus.color + "20", color: epicStatus.color }}>{epicStatus.label}</span>
                          <span className="text-[9px] text-gray-400 bg-white/60 px-1.5 py-0.5 rounded-full shrink-0">{taskList.length}</span>
                        </button>
                        <button onClick={e => { e.stopPropagation(); setEpicMenu({ epic, x: e.clientX, y: e.clientY }); }}
                          className="shrink-0 px-2 py-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover/hdr:opacity-100 transition-all">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {!isCollapsed && taskList.map(task => {
                        const progress = pct(task);
                        const critical = isCritical(task);
                        const milestone = isMilestone(task);
                        return (
                          <div key={task.id}>
                            <div
                              onMouseEnter={() => setHoveredTask(task.id)}
                              onMouseLeave={() => setHoveredTask(null)}
                              onContextMenu={e => { e.preventDefault(); setTaskRowMenu({ task, x: e.clientX, y: e.clientY }); }}
                              className={`h-[40px] flex items-center border-b border-gray-50 group/row transition-all ${task.parentId ? "pl-7 pr-4" : "px-4"} ${hoveredTask===task.id?"bg-cyan-50/40":"hover:bg-gray-50"} ${critical?"bg-red-50/30":""}`}>
                              {task.parentId && (
                                <div className="relative flex items-center shrink-0 mr-1.5">
                                  <div className="absolute -left-3 -top-5 w-px h-[30px] bg-gray-200" />
                                  <div className="absolute -left-3 top-[9px] w-2.5 h-px bg-gray-200" />
                                </div>
                              )}
                              {milestone
                                ? <Diamond className="w-3 h-3 text-amber-500 mr-2 shrink-0" />
                                : <span className="text-[12px] mr-1.5 shrink-0" style={{ color: taskTypeConfig[task.type || "task"].color }}>{taskTypeConfig[task.type || "task"].icon}</span>}
                              <span onClick={() => setSelectedTask(task)} className={`text-[12px] truncate flex-1 cursor-pointer hover:text-cyan-700 ${task.parentId ? "text-[11px]" : ""} ${task.status==="done"?"text-gray-400 line-through":"text-gray-700"} ${critical?"text-red-700":""}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {progress > 0 && <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-1"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: statusConfig[task.status].color }} /></div>}
                                {task.assignee && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>}
                                <button onClick={e => { e.stopPropagation(); setTaskRowMenu({ task, x: e.clientX, y: e.clientY }); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-gray-300 opacity-0 group-hover/row:opacity-100 hover:text-gray-600 hover:bg-gray-100 transition-all">
                                  <MoreHorizontal className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {inlineCreate?.groupKey === gKey && (
                        <div className="h-[40px] flex items-center px-4 border-b border-cyan-100 bg-cyan-50/30 gap-2">
                          <div className="relative shrink-0">
                            <button onMouseDown={e => { e.preventDefault(); setShowInlineTypePicker(v => !v); }}
                              className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[9px]"
                              style={{ backgroundColor: taskTypeConfig[inlineType].color }}>
                              {taskTypeConfig[inlineType].icon}
                            </button>
                            {showInlineTypePicker && (
                              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-30 w-28">
                                {(["task","story","bug","epic"] as TaskType[]).map(t => (
                                  <button key={t} onMouseDown={e => { e.preventDefault(); setInlineType(t); setShowInlineTypePicker(false); }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] hover:bg-gray-50 ${inlineType===t?"bg-gray-50":""}`}>
                                    <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: taskTypeConfig[t].color }}>{taskTypeConfig[t].icon}</span>
                                    {taskTypeConfig[t].label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input autoFocus value={inlineTitle} onChange={e => setInlineTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { submitInline(); }
                              if (e.key === "Escape") { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); }
                            }}
                            onBlur={() => { if (inlineTitle.trim()) submitInline(); else { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); } }}
                            placeholder="Tên task..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* No Epic section */}
                {epicGroups.noEpicTasks.length > 0 && (() => {
                  const gKey = "no-epic";
                  const isCollapsed = collapsedGroups[gKey];
                  const taskList = epicGroups.noEpicTasks;
                  return (
                    <div>
                      <div className="flex items-center bg-gray-50 border-b border-gray-100 group/hdr">
                        <button onClick={() => toggleGroup(gKey)} className="flex-1 min-w-0 px-4 py-2 flex items-center gap-2 hover:bg-gray-100 transition-all">
                          {isCollapsed ? <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" /> : <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />}
                          <div className="w-3 h-3 rounded-sm bg-gray-300 shrink-0" />
                          <span className="text-[11px] text-gray-500 flex-1 min-w-0 truncate text-left">Không có Epic</span>
                          <span className="text-[9px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full shrink-0">{taskList.length}</span>
                        </button>
                      </div>
                      {!isCollapsed && taskList.map(task => {
                        const progress = pct(task);
                        const critical = isCritical(task);
                        const milestone = isMilestone(task);
                        return (
                          <div key={task.id}>
                            <div
                              onMouseEnter={() => setHoveredTask(task.id)}
                              onMouseLeave={() => setHoveredTask(null)}
                              onContextMenu={e => { e.preventDefault(); setTaskRowMenu({ task, x: e.clientX, y: e.clientY }); }}
                              className={`h-[40px] flex items-center border-b border-gray-50 group/row transition-all ${task.parentId ? "pl-7 pr-4" : "px-4"} ${hoveredTask===task.id?"bg-cyan-50/40":"hover:bg-gray-50"} ${critical?"bg-red-50/30":""}`}>
                              {task.parentId && (
                                <div className="relative flex items-center shrink-0 mr-1.5">
                                  <div className="absolute -left-3 -top-5 w-px h-[30px] bg-gray-200" />
                                  <div className="absolute -left-3 top-[9px] w-2.5 h-px bg-gray-200" />
                                </div>
                              )}
                              {milestone
                                ? <Diamond className="w-3 h-3 text-amber-500 mr-2 shrink-0" />
                                : <span className="text-[12px] mr-1.5 shrink-0" style={{ color: taskTypeConfig[task.type || "task"].color }}>{taskTypeConfig[task.type || "task"].icon}</span>}
                              <span onClick={() => setSelectedTask(task)} className={`text-[12px] truncate flex-1 cursor-pointer hover:text-cyan-700 ${task.parentId ? "text-[11px]" : ""} ${task.status==="done"?"text-gray-400 line-through":"text-gray-700"} ${critical?"text-red-700":""}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {progress > 0 && <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-1"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: statusConfig[task.status].color }} /></div>}
                                {task.assignee && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>}
                                <button onClick={e => { e.stopPropagation(); setTaskRowMenu({ task, x: e.clientX, y: e.clientY }); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-gray-300 opacity-0 group-hover/row:opacity-100 hover:text-gray-600 hover:bg-gray-100 transition-all">
                                  <MoreHorizontal className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {inlineCreate?.groupKey === gKey && (
                        <div className="h-[40px] flex items-center px-4 border-b border-cyan-100 bg-cyan-50/30 gap-2">
                          <div className="relative shrink-0">
                            <button onMouseDown={e => { e.preventDefault(); setShowInlineTypePicker(v => !v); }}
                              className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[9px]"
                              style={{ backgroundColor: taskTypeConfig[inlineType].color }}>
                              {taskTypeConfig[inlineType].icon}
                            </button>
                            {showInlineTypePicker && (
                              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-30 w-28">
                                {(["task","story","bug","epic"] as TaskType[]).map(t => (
                                  <button key={t} onMouseDown={e => { e.preventDefault(); setInlineType(t); setShowInlineTypePicker(false); }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] hover:bg-gray-50 ${inlineType===t?"bg-gray-50":""}`}>
                                    <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: taskTypeConfig[t].color }}>{taskTypeConfig[t].icon}</span>
                                    {taskTypeConfig[t].label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input autoFocus value={inlineTitle} onChange={e => setInlineTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { submitInline(); }
                              if (e.key === "Escape") { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); }
                            }}
                            onBlur={() => { if (inlineTitle.trim()) submitInline(); else { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); } }}
                            placeholder="Tên task..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* + Tạo Epic */}
                {showInlineEpic ? (
                  <div className="flex items-center gap-2 px-4 py-2 border-t border-cyan-100 bg-cyan-50/20">
                    <span className="text-amber-500 text-[12px]">⚡</span>
                    <input autoFocus value={inlineEpicTitle} onChange={e => setInlineEpicTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { epicSubmittedRef.current = true; const t = inlineEpicTitle.trim(); if (t) onAddTask(t, "todo"); setShowInlineEpic(false); setInlineEpicTitle(""); }
                        if (e.key === "Escape") { epicSubmittedRef.current = true; setShowInlineEpic(false); setInlineEpicTitle(""); }
                      }}
                      onBlur={() => {
                        if (epicSubmittedRef.current) { epicSubmittedRef.current = false; return; }
                        const t = inlineEpicTitle.trim(); if (t) onAddTask(t, "todo");
                        setShowInlineEpic(false); setInlineEpicTitle("");
                      }}
                      placeholder="Tên epic mới..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400" />
                  </div>
                ) : (
                  <button onClick={() => { setShowInlineEpic(true); setInlineEpicTitle(""); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[11px] text-gray-400 hover:text-cyan-600 hover:bg-cyan-50/30 border-t border-gray-100 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Tạo Epic
                  </button>
                )}
              </>
            ) : (
              <>
                {Object.entries(grouped).map(([projName, group]) => {
                  const isCollapsed = collapsedGroups[projName];
                  const gKey = projName;
                  const taskList = group.tasks;
                  return (
                    <div key={projName}>
                      <div className="flex items-center bg-gray-50 border-b border-gray-100 group/hdr">
                        <button onClick={() => toggleGroup(projName)} className="flex-1 min-w-0 px-4 py-2 flex items-center gap-2 hover:bg-gray-100 transition-all">
                          {isCollapsed ? <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" /> : <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />}
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: group.color }} />
                          <span className="text-[11px] text-gray-600 flex-1 min-w-0 truncate text-left">
                            {groupBy === "sprint" && group.sprint ? group.sprint.name : projName}
                            {groupBy === "sprint" && group.sprint && <span className="ml-1.5 text-[9px] text-gray-400">{group.sprint.startDate.slice(5)} → {group.sprint.endDate.slice(5)}</span>}
                            {groupBy === "sprint" && projName === "backlog" && <span className="ml-1 text-[9px] text-gray-400">Backlog</span>}
                          </span>
                          {groupBy === "sprint" && group.sprint?.status === "active" && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 shrink-0">Active</span>}
                          <span className="text-[9px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">{taskList.length}</span>
                        </button>
                        <button onClick={() => { setInlineCreate({ groupKey: gKey }); setInlineTitle(""); setCollapsedGroups(p => ({ ...p, [gKey]: false })); }}
                          className="px-2 py-2 text-gray-400 hover:text-cyan-600 opacity-0 group-hover/hdr:opacity-100 transition-all">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {!isCollapsed && taskList.map(task => {
                        const progress = pct(task);
                        const critical = isCritical(task);
                        const milestone = isMilestone(task);
                        return (
                          <div key={task.id}>
                            <div
                              onMouseEnter={() => setHoveredTask(task.id)}
                              onMouseLeave={() => setHoveredTask(null)}
                              onContextMenu={e => { e.preventDefault(); setTaskRowMenu({ task, x: e.clientX, y: e.clientY }); }}
                              className={`h-[40px] flex items-center border-b border-gray-50 group/row transition-all ${task.parentId ? "pl-7 pr-4" : "px-4"} ${hoveredTask===task.id?"bg-cyan-50/40":"hover:bg-gray-50"} ${critical?"bg-red-50/30":""}`}>
                              {task.parentId && (
                                <div className="relative flex items-center shrink-0 mr-1.5">
                                  <div className="absolute -left-3 -top-5 w-px h-[30px] bg-gray-200" />
                                  <div className="absolute -left-3 top-[9px] w-2.5 h-px bg-gray-200" />
                                </div>
                              )}
                              {milestone
                                ? <Diamond className="w-3 h-3 text-amber-500 mr-2 shrink-0" />
                                : <span className="text-[12px] mr-1.5 shrink-0" style={{ color: taskTypeConfig[task.type || "task"].color }}>{taskTypeConfig[task.type || "task"].icon}</span>}
                              <span onClick={() => setSelectedTask(task)} className={`text-[12px] truncate flex-1 cursor-pointer hover:text-cyan-700 ${task.parentId ? "text-[11px]" : ""} ${task.status==="done"?"text-gray-400 line-through":"text-gray-700"} ${critical?"text-red-700":""}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {progress > 0 && <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-1"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: statusConfig[task.status].color }} /></div>}
                                {task.assignee && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>}
                                <button onClick={e => { e.stopPropagation(); setTaskRowMenu({ task, x: e.clientX, y: e.clientY }); }}
                                  className="w-5 h-5 flex items-center justify-center rounded text-gray-300 opacity-0 group-hover/row:opacity-100 hover:text-gray-600 hover:bg-gray-100 transition-all">
                                  <MoreHorizontal className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {inlineCreate?.groupKey === gKey && (
                        <div className="h-[40px] flex items-center px-4 border-b border-cyan-100 bg-cyan-50/30 gap-2">
                          <div className="relative shrink-0">
                            <button onMouseDown={e => { e.preventDefault(); setShowInlineTypePicker(v => !v); }}
                              className="w-4 h-4 rounded-sm flex items-center justify-center text-white text-[9px]"
                              style={{ backgroundColor: taskTypeConfig[inlineType].color }}>
                              {taskTypeConfig[inlineType].icon}
                            </button>
                            {showInlineTypePicker && (
                              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-30 w-28">
                                {(["task","story","bug","epic"] as TaskType[]).map(t => (
                                  <button key={t} onMouseDown={e => { e.preventDefault(); setInlineType(t); setShowInlineTypePicker(false); }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] hover:bg-gray-50 ${inlineType===t?"bg-gray-50":""}`}>
                                    <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: taskTypeConfig[t].color }}>{taskTypeConfig[t].icon}</span>
                                    {taskTypeConfig[t].label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input autoFocus value={inlineTitle} onChange={e => setInlineTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { submitInline(); }
                              if (e.key === "Escape") { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); }
                            }}
                            onBlur={() => { if (inlineTitle.trim()) submitInline(); else { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); } }}
                            placeholder="Tên task..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* + Tạo Epic in project/sprint mode */}
                {showInlineEpic ? (
                  <div className="flex items-center gap-2 px-4 py-2 border-t border-cyan-100 bg-cyan-50/20">
                    <span className="text-amber-500 text-[12px]">⚡</span>
                    <input autoFocus value={inlineEpicTitle} onChange={e => setInlineEpicTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { epicSubmittedRef.current = true; const t = inlineEpicTitle.trim(); if (t) onAddTask(t, "todo"); setShowInlineEpic(false); setInlineEpicTitle(""); }
                        if (e.key === "Escape") { epicSubmittedRef.current = true; setShowInlineEpic(false); setInlineEpicTitle(""); }
                      }}
                      onBlur={() => {
                        if (epicSubmittedRef.current) { epicSubmittedRef.current = false; return; }
                        const t = inlineEpicTitle.trim(); if (t) onAddTask(t, "todo");
                        setShowInlineEpic(false); setInlineEpicTitle("");
                      }}
                      placeholder="Tên epic mới..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400" />
                  </div>
                ) : (
                  <button onClick={() => { setShowInlineEpic(true); setInlineEpicTitle(""); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[11px] text-gray-400 hover:text-cyan-600 hover:bg-cyan-50/30 border-t border-gray-100 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Tạo Epic
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right: timeline grid */}
          <div className="shrink-0">
            <div style={{ width: totalDays * dayWidth }} className="relative">
              <div className="border-b border-gray-200 sticky top-0 bg-white z-[5]">
                <div className="h-[20px] flex border-b border-gray-100 bg-gray-50/80">
                  {renderTopHeader()}
                </div>
                <div className="h-[28px] flex">
                  {renderBottomHeader()}
                </div>
              </div>
              {/* RIGHT PANEL TASK GROUPS */}
              {groupBy === "epic" && epicGroups ? (
                <>
                  {epicGroups.groups.map(({ epic, tasks: epicTasks }) => {
                    const isCollapsed = collapsedGroups[epic.id];
                    const gKey = epic.id;
                    const taskList = epicTasks;
                    return (
                      <div key={epic.id}>
                        {/* Epic header bar row */}
                        <div className="h-[40px] relative border-b border-gray-100" style={{ backgroundColor: epic.color + "08" }}>
                          {gridCols.map((col, i) => (
                            <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${col.isCurrent ? "bg-blue-50/20" : col.isAlt ? "bg-gray-50/40" : ""}`}
                              style={{ left: col.left, width: col.width }} />
                          ))}
                          {todayIdx >= 0 && todayIdx < totalDays && (
                            <div className="absolute top-0 bottom-0 w-px bg-cyan-400/50 z-[2]" style={{ left: todayIdx * dayWidth + dayWidth / 2 }} />
                          )}
                          {(() => {
                            const epicBar = getEpicBar(epic);
                            if (!epicBar) return null;
                            return (
                              <div className="absolute top-[8px] h-[24px] rounded-md z-[3] flex items-center px-2"
                                style={{ left: epicBar.left + 2, width: Math.max(dayWidth, epicBar.width), backgroundColor: epic.color + "40", border: `2px solid ${epic.color}` }}>
                                <span className="text-[9px] font-medium truncate" style={{ color: epic.color }}>⚡ {epicBar.width > 60 ? epic.title : ""}</span>
                              </div>
                            );
                          })()}
                        </div>
                        {!isCollapsed && taskList.map(task => {
                          const bar = getBar(task);
                          const colors = barColor(task);
                          const progress = pct(task);
                          const deps = task.dependencies || [];
                          const critical = isCritical(task);
                          const milestone = isMilestone(task);
                          const isHovered = hoveredTask === task.id;
                          return (
                            <div key={task.id}>
                              <div className="h-[40px] relative border-b border-gray-50/50"
                                onMouseEnter={() => setHoveredTask(task.id)}
                                onMouseLeave={() => setHoveredTask(null)}>
                                {zoomLevel === "day" ? dates.map((d, i) => (
                                  <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-100/50 ${d.getDay()===0||d.getDay()===6?"bg-gray-50/30":""}`}
                                    style={{ left: i * dayWidth, width: dayWidth }} />
                                )) : gridCols.map((col, i) => (
                                  <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${col.isCurrent ? "bg-blue-50/10" : col.isAlt ? "bg-gray-50/20" : ""}`}
                                    style={{ left: col.left, width: col.width }} />
                                ))}
                                {todayIdx >= 0 && todayIdx < totalDays && (
                                  <div className="absolute top-0 bottom-0 w-px bg-cyan-400/50 z-[2]" style={{ left: todayIdx * dayWidth + dayWidth / 2 }} />
                                )}
                                {bar && (milestone ? (
                                  <div onClick={() => setSelectedTask(task)} className="absolute top-[10px] z-[3] cursor-pointer" style={{ left: bar.left + bar.width / 2 - 8 }}>
                                    <div className="w-5 h-5 rotate-45 bg-amber-400 border-2 border-amber-500 shadow-sm" />
                                  </div>
                                ) : (
                                  <div
                                    className={`absolute top-[8px] h-[24px] rounded-md z-[3] group/bar select-none ${dragOverride[task.id]?"opacity-80 shadow-lg":""} ${isHovered?"ring-2 ring-cyan-300 shadow-md":""} ${critical?"ring-2 ring-red-300":""}`}
                                    style={{ left: bar.left + 2, width: Math.max(dayWidth, bar.width), backgroundColor: colors.bg, border: `1px solid ${critical?"#ef4444":colors.border}`, cursor: dragOverride[task.id]?"grabbing":"grab" }}>
                                    <div className="h-full rounded-md" style={{ width: `${progress}%`, backgroundColor: colors.fill, opacity: 0.3 }} />
                                    <span className="absolute inset-0 flex items-center px-2 text-[9px] text-gray-700 truncate"
                                      onMouseDown={e => onBarMouseDown(e, task, "move")}
                                      onClick={e => { if (!didDragRef.current) { e.stopPropagation(); setSelectedTask(task); } }}>
                                      {bar.width > 80 ? task.title : ""}
                                    </span>
                                    {dragOverride[task.id] && (
                                      <span className="absolute -top-5 left-0 text-[8px] text-gray-700 bg-white border border-gray-300 rounded px-1.5 py-0.5 shadow-sm z-10 whitespace-nowrap">
                                        {bar.sStr} → {bar.eStr}
                                      </span>
                                    )}
                                    <div className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                      onMouseDown={e => { e.stopPropagation(); onBarMouseDown(e, task, "resize-left"); }}>
                                      <div className="w-0.5 h-3 bg-gray-500/50 rounded-full" />
                                    </div>
                                    <div className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                      onMouseDown={e => { e.stopPropagation(); onBarMouseDown(e, task, "resize"); }}>
                                      <div className="w-0.5 h-3 bg-gray-500/50 rounded-full" />
                                    </div>
                                  </div>
                                ))}
                                {bar && deps.map(depId => {
                                  const depTask = filtered.find(t => t.id === depId);
                                  if (!depTask) return null;
                                  const depBar = getBar(depTask);
                                  if (!depBar) return null;
                                  const gap = bar.left - depBar.left - depBar.width;
                                  if (gap < 0) return null;
                                  return (
                                    <div key={`dep-${task.id}-${depId}`} className="absolute top-[20px] z-[1]" style={{ left: depBar.left + depBar.width + 2 }}>
                                      <div className="flex items-center" style={{ width: gap }}>
                                        <div className="h-px flex-1" style={{ borderTop: `1px dashed ${critical?"#ef4444":"#cbd5e1"}` }} />
                                        <ArrowRight className={`w-2.5 h-2.5 ${critical?"text-red-400":"text-gray-400"}`} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {inlineCreate?.groupKey === gKey && <div className="h-[40px] border-b border-cyan-100 bg-cyan-50/10" />}
                      </div>
                    );
                  })}
                  {/* No Epic section right panel */}
                  {epicGroups.noEpicTasks.length > 0 && (() => {
                    const gKey = "no-epic";
                    const isCollapsed = collapsedGroups[gKey];
                    const taskList = epicGroups.noEpicTasks;
                    return (
                      <div>
                        {/* No-epic header row */}
                        <div className="h-[40px] relative border-b border-gray-100 bg-gray-50/50">
                          {gridCols.map((col, i) => (
                            <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${col.isCurrent ? "bg-blue-50/20" : col.isAlt ? "bg-gray-50/40" : ""}`}
                              style={{ left: col.left, width: col.width }} />
                          ))}
                        </div>
                        {!isCollapsed && taskList.map(task => {
                          const bar = getBar(task);
                          const colors = barColor(task);
                          const progress = pct(task);
                          const deps = task.dependencies || [];
                          const critical = isCritical(task);
                          const milestone = isMilestone(task);
                          const isHovered = hoveredTask === task.id;
                          return (
                            <div key={task.id}>
                              <div className="h-[40px] relative border-b border-gray-50/50"
                                onMouseEnter={() => setHoveredTask(task.id)}
                                onMouseLeave={() => setHoveredTask(null)}>
                                {zoomLevel === "day" ? dates.map((d, i) => (
                                  <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-100/50 ${d.getDay()===0||d.getDay()===6?"bg-gray-50/30":""}`}
                                    style={{ left: i * dayWidth, width: dayWidth }} />
                                )) : gridCols.map((col, i) => (
                                  <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${col.isCurrent ? "bg-blue-50/10" : col.isAlt ? "bg-gray-50/20" : ""}`}
                                    style={{ left: col.left, width: col.width }} />
                                ))}
                                {todayIdx >= 0 && todayIdx < totalDays && (
                                  <div className="absolute top-0 bottom-0 w-px bg-cyan-400/50 z-[2]" style={{ left: todayIdx * dayWidth + dayWidth / 2 }} />
                                )}
                                {bar && (milestone ? (
                                  <div onClick={() => setSelectedTask(task)} className="absolute top-[10px] z-[3] cursor-pointer" style={{ left: bar.left + bar.width / 2 - 8 }}>
                                    <div className="w-5 h-5 rotate-45 bg-amber-400 border-2 border-amber-500 shadow-sm" />
                                  </div>
                                ) : (
                                  <div
                                    className={`absolute top-[8px] h-[24px] rounded-md z-[3] group/bar select-none ${dragOverride[task.id]?"opacity-80 shadow-lg":""} ${isHovered?"ring-2 ring-cyan-300 shadow-md":""} ${critical?"ring-2 ring-red-300":""}`}
                                    style={{ left: bar.left + 2, width: Math.max(dayWidth, bar.width), backgroundColor: colors.bg, border: `1px solid ${critical?"#ef4444":colors.border}`, cursor: dragOverride[task.id]?"grabbing":"grab" }}>
                                    <div className="h-full rounded-md" style={{ width: `${progress}%`, backgroundColor: colors.fill, opacity: 0.3 }} />
                                    <span className="absolute inset-0 flex items-center px-2 text-[9px] text-gray-700 truncate"
                                      onMouseDown={e => onBarMouseDown(e, task, "move")}
                                      onClick={e => { if (!didDragRef.current) { e.stopPropagation(); setSelectedTask(task); } }}>
                                      {bar.width > 80 ? task.title : ""}
                                    </span>
                                    {dragOverride[task.id] && (
                                      <span className="absolute -top-5 left-0 text-[8px] text-gray-700 bg-white border border-gray-300 rounded px-1.5 py-0.5 shadow-sm z-10 whitespace-nowrap">
                                        {bar.sStr} → {bar.eStr}
                                      </span>
                                    )}
                                    <div className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                      onMouseDown={e => { e.stopPropagation(); onBarMouseDown(e, task, "resize-left"); }}>
                                      <div className="w-0.5 h-3 bg-gray-500/50 rounded-full" />
                                    </div>
                                    <div className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                      onMouseDown={e => { e.stopPropagation(); onBarMouseDown(e, task, "resize"); }}>
                                      <div className="w-0.5 h-3 bg-gray-500/50 rounded-full" />
                                    </div>
                                  </div>
                                ))}
                                {bar && deps.map(depId => {
                                  const depTask = filtered.find(t => t.id === depId);
                                  if (!depTask) return null;
                                  const depBar = getBar(depTask);
                                  if (!depBar) return null;
                                  const gap = bar.left - depBar.left - depBar.width;
                                  if (gap < 0) return null;
                                  return (
                                    <div key={`dep-${task.id}-${depId}`} className="absolute top-[20px] z-[1]" style={{ left: depBar.left + depBar.width + 2 }}>
                                      <div className="flex items-center" style={{ width: gap }}>
                                        <div className="h-px flex-1" style={{ borderTop: `1px dashed ${critical?"#ef4444":"#cbd5e1"}` }} />
                                        <ArrowRight className={`w-2.5 h-2.5 ${critical?"text-red-400":"text-gray-400"}`} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {inlineCreate?.groupKey === gKey && <div className="h-[40px] border-b border-cyan-100 bg-cyan-50/10" />}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  {Object.entries(grouped).map(([projName, group]) => {
                    const isCollapsed = collapsedGroups[projName];
                    const gKey = projName;
                    return (
                      <div key={projName}>
                        {/* Group header row in grid — sprint bar */}
                        <div className="h-[33px] relative border-b border-gray-100 bg-gray-50/50">
                          {gridCols.map((col, i) => (
                            <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${col.isCurrent ? "bg-blue-50/20" : col.isAlt ? "bg-gray-50/40" : ""}`}
                              style={{ left: col.left, width: col.width }} />
                          ))}
                          {groupBy === "sprint" && group.sprint && (() => {
                            const s = group.sprint;
                            const left = Math.max(0, ((new Date(s.startDate).getTime() - startRef.getTime()) / 86400000) * dayWidth);
                            const right = Math.min(totalDays * dayWidth, ((new Date(s.endDate).getTime() - startRef.getTime()) / 86400000) * dayWidth + dayWidth);
                            const width = Math.max(0, right - left);
                            if (width <= 0) return null;
                            return (
                              <div className="absolute top-[7px] h-[18px] rounded flex items-center px-2 opacity-80"
                                style={{ left, width, backgroundColor: group.color + "22", border: `1px solid ${group.color}55` }}>
                                <span className="text-[8px] truncate" style={{ color: group.color }}>{s.name}</span>
                              </div>
                            );
                          })()}
                        </div>
                        {!isCollapsed && group.tasks.map(task => {
                          const bar = getBar(task);
                          const colors = barColor(task);
                          const progress = pct(task);
                          const deps = task.dependencies || [];
                          const critical = isCritical(task);
                          const milestone = isMilestone(task);
                          const isHovered = hoveredTask === task.id;
                          return (
                            <div key={task.id} className="h-[40px] relative border-b border-gray-50/50"
                              onMouseEnter={() => setHoveredTask(task.id)}
                              onMouseLeave={() => setHoveredTask(null)}>
                              {zoomLevel === "day" ? dates.map((d, i) => (
                                <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-100/50 ${d.getDay()===0||d.getDay()===6?"bg-gray-50/30":""}`}
                                  style={{ left: i * dayWidth, width: dayWidth }} />
                              )) : gridCols.map((col, i) => (
                                <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${col.isCurrent ? "bg-blue-50/10" : col.isAlt ? "bg-gray-50/20" : ""}`}
                                  style={{ left: col.left, width: col.width }} />
                              ))}
                              {todayIdx >= 0 && todayIdx < totalDays && (
                                <div className="absolute top-0 bottom-0 w-px bg-cyan-400/50 z-[2]" style={{ left: todayIdx * dayWidth + dayWidth / 2 }} />
                              )}
                              {bar && (milestone ? (
                                <div onClick={() => setSelectedTask(task)} className="absolute top-[10px] z-[3] cursor-pointer" style={{ left: bar.left + bar.width / 2 - 8 }}>
                                  <div className="w-5 h-5 rotate-45 bg-amber-400 border-2 border-amber-500 shadow-sm" />
                                </div>
                              ) : (
                                <div
                                  className={`absolute top-[8px] h-[24px] rounded-md z-[3] group/bar select-none ${dragOverride[task.id]?"opacity-80 shadow-lg":""} ${isHovered?"ring-2 ring-cyan-300 shadow-md":""} ${critical?"ring-2 ring-red-300":""}`}
                                  style={{ left: bar.left + 2, width: Math.max(dayWidth, bar.width), backgroundColor: colors.bg, border: `1px solid ${critical?"#ef4444":colors.border}`, cursor: dragOverride[task.id]?"grabbing":"grab" }}>
                                  <div className="h-full rounded-md" style={{ width: `${progress}%`, backgroundColor: colors.fill, opacity: 0.3 }} />
                                  <span className="absolute inset-0 flex items-center px-2 text-[9px] text-gray-700 truncate"
                                    onMouseDown={e => onBarMouseDown(e, task, "move")}
                                    onClick={e => { if (!didDragRef.current) { e.stopPropagation(); setSelectedTask(task); } }}>
                                    {bar.width > 80 ? task.title : ""}
                                  </span>
                                  {dragOverride[task.id] && (
                                    <span className="absolute -top-5 left-0 text-[8px] text-gray-700 bg-white border border-gray-300 rounded px-1.5 py-0.5 shadow-sm z-10 whitespace-nowrap">
                                      {bar.sStr} → {bar.eStr}
                                    </span>
                                  )}
                                  <div className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                    onMouseDown={e => { e.stopPropagation(); onBarMouseDown(e, task, "resize-left"); }}>
                                    <div className="w-0.5 h-3 bg-gray-500/50 rounded-full" />
                                  </div>
                                  <div className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                    onMouseDown={e => { e.stopPropagation(); onBarMouseDown(e, task, "resize"); }}>
                                    <div className="w-0.5 h-3 bg-gray-500/50 rounded-full" />
                                  </div>
                                </div>
                              ))}
                              {bar && deps.map(depId => {
                                const depTask = filtered.find(t => t.id === depId);
                                if (!depTask) return null;
                                const depBar = getBar(depTask);
                                if (!depBar) return null;
                                const gap = bar.left - depBar.left - depBar.width;
                                if (gap < 0) return null;
                                return (
                                  <div key={`dep-${task.id}-${depId}`} className="absolute top-[20px] z-[1]" style={{ left: depBar.left + depBar.width + 2 }}>
                                    <div className="flex items-center" style={{ width: gap }}>
                                      <div className="h-px flex-1" style={{ borderTop: `1px dashed ${critical?"#ef4444":"#cbd5e1"}` }} />
                                      <ArrowRight className={`w-2.5 h-2.5 ${critical?"text-red-400":"text-gray-400"}`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                        {inlineCreate?.groupKey === gKey && <div className="h-[40px] border-b border-cyan-100 bg-cyan-50/10" />}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom horizontal scrollbar */}
      <div className="shrink-0 flex border-t border-gray-200">
        <div className="w-[280px] shrink-0 bg-white border-r border-gray-200" />
        <div ref={scrollbarRef} className="gantt-hscroll flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/80">
          <div style={{ width: totalDays * dayWidth, height: 1 }} />
        </div>
      </div>

      {/* Task row context menu (right-click or ... button) */}
      {(contextMenu || taskRowMenu) && (() => {
        const menu = taskRowMenu || contextMenu!;
        const close = () => { setContextMenu(null); setTaskRowMenu(null); };
        const isSubtask = !!menu.task.parentId;
        const editDates = () => {
          const task = menu.task;
          const newStart = prompt("Ngày bắt đầu (YYYY-MM-DD):", task.startDate || "");
          if (newStart === null) { close(); return; }
          const newEnd = prompt("Ngày kết thúc (YYYY-MM-DD):", task.dueDate || "");
          if (newEnd === null) { close(); return; }
          onSaveTask({ ...task, startDate: newStart || task.startDate, dueDate: newEnd || task.dueDate });
          close();
        };
        const removeDates = () => {
          if (window.confirm(`Xóa ngày của "${menu.task.title}"?`)) {
            onSaveTask({ ...menu.task, startDate: undefined, dueDate: undefined });
          }
          close();
        };
        return (
          <div className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 w-56"
            style={{ left: menu.x, top: menu.y }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setSelectedTask(menu.task); close(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> Mở task
            </button>

            {isSubtask ? (
              <>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={() => {
                  const newParentTitle = prompt("Tên task cha mới (để trống = bỏ liên kết):");
                  if (newParentTitle !== null) {
                    const found = tasks.find(t => t.title.toLowerCase().includes(newParentTitle.toLowerCase()) && !t.parentId);
                    if (found) onSaveTask({ ...menu.task, parentId: found.id });
                    else if (newParentTitle === "") onSaveTask({ ...menu.task, parentId: undefined });
                  }
                  close();
                }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" /> Đổi task cha
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={editDates}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" /> Sửa ngày
                </button>
                <button onClick={removeDates}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${menu.task.startDate || menu.task.dueDate ? "text-gray-700" : "text-gray-300 cursor-not-allowed"}`}
                  disabled={!menu.task.startDate && !menu.task.dueDate}>
                  <X className="w-3.5 h-3.5 text-gray-400" /> Xóa ngày
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={() => { if (window.confirm(`Xóa "${menu.task.title}"?`)) onDeleteTask(menu.task.id); close(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa task
                </button>
              </>
            ) : (
              <>
                <button onClick={editDates}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" /> Sửa ngày
                </button>
                <button onClick={removeDates}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${menu.task.startDate || menu.task.dueDate ? "text-gray-700" : "text-gray-300 cursor-not-allowed"}`}
                  disabled={!menu.task.startDate && !menu.task.dueDate}>
                  <X className="w-3.5 h-3.5 text-gray-400" /> Xóa ngày
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={() => { if (window.confirm(`Xóa "${menu.task.title}"?`)) onDeleteTask(menu.task.id); close(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa task
                </button>
              </>
            )}
          </div>
        );
      })()}

      {/* Epic context menu */}
      {epicMenu && (() => {
        const epic = epicMenu.epic;
        const close = () => setEpicMenu(null);
        const editEpicDates = () => {
          const newStart = prompt("Ngày bắt đầu epic (YYYY-MM-DD):", epic.startDate || "");
          if (newStart === null) { close(); return; }
          const newEnd = prompt("Ngày kết thúc epic (YYYY-MM-DD):", epic.dueDate || "");
          if (newEnd === null) { close(); return; }
          close();
        };
        return (
          <div className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 w-52"
            style={{ left: epicMenu.x, top: epicMenu.y }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setInlineCreate({ groupKey: epic.id }); setInlineTitle(""); setCollapsedGroups(p => ({ ...p, [epic.id]: false })); close(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
              <Plus className="w-3.5 h-3.5 text-gray-400" /> Tạo task
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button onClick={editEpicDates}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" /> Sửa ngày Epic
            </button>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${epic.startDate || epic.dueDate ? "text-gray-700" : "text-gray-300 cursor-not-allowed"}`}
              disabled={!epic.startDate && !epic.dueDate}
              onClick={() => { close(); }}>
              <X className="w-3.5 h-3.5 text-gray-400" /> Xóa ngày Epic
            </button>
          </div>
        );
      })()}

      {/* Footer legend */}
      <div className="flex items-center gap-4 px-5 py-1.5 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-3 text-[9px] text-gray-400">
          {Object.entries(statusConfig).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ backgroundColor: v.color }} />{v.label}</span>
          ))}
          <span className="flex items-center gap-1"><Diamond className="w-2.5 h-2.5 text-amber-500" /> Milestone</span>
          {showCriticalPath && <span className="flex items-center gap-1 text-red-500"><Flag className="w-2.5 h-2.5" /> Critical</span>}
        </div>
      </div>
    </div>

    {/* Task side panel */}
    {selectedTask && (
      <TaskSidePanel
        key={selectedTask.id}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onOpenFull={() => { onTaskClick(selectedTask); setSelectedTask(null); }}
        onSave={updated => { onSaveTask(updated); setSelectedTask(updated); }}
      />
    )}
    </div>
  );
}
