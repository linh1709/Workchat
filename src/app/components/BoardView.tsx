import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Maximize2, Calendar, CalendarDays, User, Search, Filter, X, AlertTriangle, ArrowUpDown, MessageSquare, Clock, CheckSquare, ChevronRight, ChevronLeft, ChevronDown, Paperclip, Bug, BookOpen, Zap, CheckSquare2, Layers, Flag, Check } from "lucide-react";
import { type Task, type TaskType, type Sprint, statusConfig, priorityConfig, taskTypeConfig, projects, tagColors, teamMembers, epics, sprints as staticSprints } from "./data";
import type { CustomStatusMap } from "../App";

function TaskTypeIcon({ type }: { type?: Task["type"] }) {
  if (type === "bug")   return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-red-500 shrink-0"><Bug      className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "story") return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-emerald-500 shrink-0"><BookOpen className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "epic")  return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-violet-500 shrink-0"><Zap      className="w-2.5 h-2.5 text-white" /></span>;
  return                       <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-blue-500 shrink-0"><CheckSquare2 className="w-2.5 h-2.5 text-white" /></span>;
}
import { useTaskFilter } from "../hooks/useTaskFilter";
import { useTaskGroupBy } from "../hooks/useTaskGroupBy";

interface BoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onAddTask: (title: string, status: Task["status"]) => void;
  onSaveTask?: (task: Task) => void;
  selectedProject: string | null;
  customStatuses?: CustomStatusMap;
  onCustomStatusChange?: (s: CustomStatusMap) => void;
  sprints?: Sprint[];
}

const WIP_LIMITS: Record<string, number> = { todo: 10, in_progress: 5, in_review: 4, done: 999 };

const today = new Date(); today.setHours(0, 0, 0, 0);

export function BoardView({ tasks, onTaskClick, onStatusChange, onAddTask, onSaveTask, selectedProject, customStatuses: customStatusesProp = {}, onCustomStatusChange, sprints: sprintsProp }: BoardViewProps) {
  const {
    filteredTasks,
    searchQ,
    setSearchQ,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    hasFilters,
    clearFilters,
  } = useTaskFilter(tasks, selectedProject);

  const [selectedCard, setSelectedCard] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddType, setQuickAddType] = useState<Task["type"]>("task");
  const [quickAddAssignee, setQuickAddAssignee] = useState<typeof teamMembers[0] | undefined>(undefined);
  const [quickAddDate, setQuickAddDate] = useState("");
  const [quickAddShowType, setQuickAddShowType] = useState(false);
  const [quickAddShowAssignee, setQuickAddShowAssignee] = useState(false);
  const [swimlane, setSwimlane] = useState<"none" | "assignee" | "priority">("none");
  const [showSwimlaneMenu, setShowSwimlaneMenu] = useState(false);
  const [wipLimitsState, setWipLimitsState] = useState<Record<string, number>>(WIP_LIMITS);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const [colOrder, setColOrder] = useState<Task["status"][]>(["todo", "in_progress", "in_review", "done"]);
  const [hiddenCols, setHiddenCols] = useState<Set<Task["status"]>>(new Set());
  const [showColMenu, setShowColMenu] = useState<string | null>(null);
  const [wipEditCol, setWipEditCol] = useState<string | null>(null);
  const [wipEditVal, setWipEditVal] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [addColText, setAddColText] = useState("");
  const [mobileCol, setMobileCol] = useState<Task["status"]>("todo");
  const allSprints = sprintsProp ?? staticSprints;

  const [selectedSprint, setSelectedSprint] = useState<string>(() => {
    const active = allSprints.find(s => s.status === "active");
    return active?.id || "all";
  });
  const [showSprintMenu, setShowSprintMenu] = useState(false);

  // Auto-switch to new active sprint when parent sprints state changes
  useEffect(() => {
    if (!sprintsProp) return;
    const active = sprintsProp.find(s => s.status === "active");
    if (active) setSelectedSprint(active.id);
  }, [sprintsProp]);

  const customStatuses = customStatusesProp;
  const statuses = colOrder.filter(s => !hiddenCols.has(s));

  const COL_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
  const mergedStatusConfig: Record<string, { label: string; color: string }> = {
    ...statusConfig,
    ...customStatuses,
  };

  const addColumn = () => {
    const label = addColText.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || `col_${Date.now()}`;
    const color = COL_COLORS[Object.keys(customStatuses).length % COL_COLORS.length];
    onCustomStatusChange?.({ ...customStatuses, [id]: { label, color } });
    setColOrder(p => [...p, id as Task["status"]]);
    setAddColText("");
    setShowAddCol(false);
  };

  const moveCol = (status: Task["status"], dir: -1 | 1) => {
    setColOrder(prev => {
      const idx = prev.indexOf(status);
      const swap = idx + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  // Filter by sprint
  const boardTasks = selectedSprint === "all"
    ? filteredTasks
    : selectedSprint === "backlog"
      ? filteredTasks.filter(t => !t.sprintId)
      : filteredTasks.filter(t => t.sprintId === selectedSprint);

  // Map swimlane to groupBy type for useTaskGroupBy
  const groupByType = swimlane === "none" ? "none" : swimlane === "assignee" ? "assignee" : "priority";
  const swimlaneGroups = useTaskGroupBy(boardTasks, groupByType);

  const currentSprint = allSprints.find(s => s.id === selectedSprint);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTaskId) onStatusChange(draggedTaskId, status);
    setDragOverCol(null);
    setDraggedTaskId(null);
  };

  const resetQuickAdd = () => {
    setQuickAddCol(null); setQuickAddText(""); setQuickAddType("task");
    setQuickAddAssignee(undefined); setQuickAddDate("");
    setQuickAddShowType(false); setQuickAddShowAssignee(false);
  };

  const submitQuickAdd = (status: Task["status"]) => {
    if (!quickAddText.trim()) return;
    if (onSaveTask) {
      onSaveTask({
        id: `t${Date.now()}`, title: quickAddText.trim(), type: quickAddType,
        status, priority: "normal", tags: [],
        createdAt: new Date().toISOString(),
        projectId: selectedProject || "p1",
        assignee: quickAddAssignee,
        dueDate: quickAddDate || undefined,
        sprintId: selectedSprint !== "all" && selectedSprint !== "backlog" ? selectedSprint : undefined,
        subtasks: [], comments: [], activityLog: [], dependencies: [], watchers: [],
      });
    } else {
      onAddTask(quickAddText.trim(), status);
    }
    resetQuickAdd();
  };

  const toggleCollapse = (colKey: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      next.has(colKey) ? next.delete(colKey) : next.add(colKey);
      return next;
    });
  };

  const totalDone = boardTasks.filter(t => t.status === "done").length;
  const pct = boardTasks.length > 0 ? Math.round((totalDone / boardTasks.length) * 100) : 0;
  const overdueCount = boardTasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== "done").length;
  const totalSP = boardTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
  const doneSP = boardTasks.filter(t => t.status === "done").reduce((s, t) => s + (t.storyPoints || 0), 0);

  /* ── Mobile board ─────────────────────────────────────────────────────────── */
  if (window.innerWidth < 768) {
    const cols = statuses;
    const colTasks = boardTasks.filter(t => t.status === mobileCol);
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Column tabs */}
        <div className="shrink-0 bg-white border-b border-gray-200 flex overflow-x-auto no-scrollbar">
          {cols.map(col => {
            const cfg = mergedStatusConfig[col];
            const count = boardTasks.filter(t => t.status === col).length;
            return (
              <button key={col} onClick={() => setMobileCol(col)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-[13px] border-b-2 transition-all ${mobileCol === col ? "border-cyan-500 text-cyan-600 font-medium" : "border-transparent text-gray-500"}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg?.color || "#94a3b8" }} />
                {cfg?.label || col}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${mobileCol === col ? "bg-cyan-50 text-cyan-600" : "bg-gray-100 text-gray-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {colTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckSquare2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-[13px]">Không có task nào</p>
            </div>
          )}
          {colTasks.map(task => {
            const pr = priorityConfig[task.priority as keyof typeof priorityConfig];
            const assigneeMember = teamMembers.find(m => m.id === task.assignee);
            const isOverdue = task.dueDate && new Date(task.dueDate) < today && task.status !== "done";
            return (
              <button key={task.id} onClick={() => onTaskClick(task)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm active:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                  <TaskTypeIcon type={task.type} />
                  <p className="flex-1 text-[13px] text-gray-800 leading-snug">{task.title}</p>
                  {assigneeMember && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                      style={{ backgroundColor: assigneeMember.color }}>
                      {assigneeMember.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {pr && <span className="text-[11px] font-medium" style={{ color: pr.color }}>{pr.label}</span>}
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                      <Calendar className="w-3 h-3" />{task.dueDate}
                    </span>
                  )}
                  {(task.comments?.length || 0) > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <MessageSquare className="w-3 h-3" />{task.comments!.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* FAB */}
        <button onClick={() => onAddTask("", mobileCol)}
          className="absolute bottom-20 right-4 w-12 h-12 rounded-full bg-cyan-500 text-white shadow-lg flex items-center justify-center active:bg-cyan-600 z-10">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-gray-200 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm task..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {filterPriority && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border"
            style={{ backgroundColor: `${priorityConfig[filterPriority as keyof typeof priorityConfig]?.color}15`, borderColor: `${priorityConfig[filterPriority as keyof typeof priorityConfig]?.color}40`, color: priorityConfig[filterPriority as keyof typeof priorityConfig]?.color }}>
            {priorityConfig[filterPriority as keyof typeof priorityConfig]?.label}
            <button onClick={() => setFilterPriority(null)} className="ml-1 hover:opacity-70"><X className="w-2.5 h-2.5" /></button>
          </div>
        )}
        {filterAssignee && (() => {
          const m = teamMembers.find(x => x.id === filterAssignee);
          return m ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] bg-gray-100 border border-gray-200 text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
              {m.name.split(" ").slice(-1)[0]}
              <button onClick={() => setFilterAssignee(null)} className="ml-0.5 hover:opacity-70"><X className="w-2.5 h-2.5" /></button>
            </div>
          ) : null;
        })()}

        {/* Sprint selector */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setShowSprintMenu(o => !o); setShowFilter(false); setShowSwimlaneMenu(false); }}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all font-medium ${selectedSprint !== "all" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Layers className="w-3 h-3" />
            {selectedSprint === "all" ? "Tất cả sprint" : selectedSprint === "backlog" ? "Backlog" : currentSprint?.name || "Sprint"}
            {currentSprint?.status === "active" && selectedSprint !== "all" && (
              <span className="px-1 py-0.5 text-[8px] bg-emerald-100 text-emerald-600 rounded-full font-semibold">Active</span>
            )}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showSprintMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 z-30 w-[240px]">
              <button
                onClick={() => { setSelectedSprint("all"); setShowSprintMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${selectedSprint === "all" ? "text-violet-600 bg-violet-50/50" : "text-gray-600"}`}
              >
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="flex-1 text-left">Tất cả sprint</span>
                {selectedSprint === "all" && <span className="text-violet-500">✓</span>}
              </button>
              <div className="h-px bg-gray-100 mx-3 my-1" />
              {allSprints.map(sprint => {
                const sprintSP = sprint.taskIds.reduce((sum, tid) => {
                  const t = tasks.find(x => x.id === tid);
                  return sum + (t?.storyPoints || 0);
                }, 0);
                const sprintDoneSP = sprint.taskIds.reduce((sum, tid) => {
                  const t = tasks.find(x => x.id === tid);
                  return sum + (t?.status === "done" ? (t?.storyPoints || 0) : 0);
                }, 0);
                const statusCfg = {
                  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-600" },
                  planning:  { label: "Planning",  cls: "bg-gray-100 text-gray-500" },
                  completed: { label: "Completed", cls: "bg-blue-100 text-blue-600" },
                }[sprint.status];
                return (
                  <button key={sprint.id}
                    onClick={() => { setSelectedSprint(sprint.id); setShowSprintMenu(false); }}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-[11px] hover:bg-gray-50 text-left ${selectedSprint === sprint.id ? "bg-violet-50/50" : ""}`}
                  >
                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${sprint.status === "active" ? "bg-emerald-500" : sprint.status === "completed" ? "bg-blue-400" : "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium ${selectedSprint === sprint.id ? "text-violet-700" : "text-gray-700"}`}>{sprint.name}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded-full font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        {new Date(sprint.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – {new Date(sprint.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                        {sprintSP > 0 && <span className="ml-2 text-violet-400">{sprintDoneSP}/{sprintSP} pts</span>}
                      </div>
                    </div>
                    {selectedSprint === sprint.id && <span className="text-violet-500 shrink-0">✓</span>}
                  </button>
                );
              })}
              <div className="h-px bg-gray-100 mx-3 my-1" />
              <button
                onClick={() => { setSelectedSprint("backlog"); setShowSprintMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${selectedSprint === "backlog" ? "text-violet-600 bg-violet-50/50" : "text-gray-500"}`}
              >
                <span className="text-gray-300">⬜</span>
                <span className="flex-1 text-left">Backlog (chưa có sprint)</span>
                {selectedSprint === "backlog" && <span className="text-violet-500">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="relative">
          <button onClick={() => { setShowFilter(!showFilter); setShowSwimlaneMenu(false); setShowSprintMenu(false); }}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${hasFilters ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Filter className="w-3 h-3" /> Filter {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
          </button>
          {showFilter && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-30 w-[180px]" onClick={e => e.stopPropagation()}>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 mb-1">Priority</p>
              {Object.entries(priorityConfig).map(([k, v]) => (
                <button key={k} onClick={() => setFilterPriority(filterPriority === k ? null : k)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${filterPriority === k ? "text-cyan-600 bg-cyan-50/50" : "text-gray-600"}`}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: v.color }} />
                  {v.label}
                  {filterPriority === k && <span className="ml-auto text-cyan-500">✓</span>}
                </button>
              ))}
              <div className="h-px bg-gray-100 my-1.5 mx-3" />
              <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 mb-1">Assignee</p>
              {teamMembers.slice(0, 5).map(m => (
                <button key={m.id} onClick={() => setFilterAssignee(filterAssignee === m.id ? null : m.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${filterAssignee === m.id ? "text-cyan-600 bg-cyan-50/50" : "text-gray-600"}`}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                  {m.name.split(" ").slice(-2).join(" ")}
                  {filterAssignee === m.id && <span className="ml-auto text-cyan-500">✓</span>}
                </button>
              ))}
              {hasFilters && (<>
                <div className="h-px bg-gray-100 my-1.5 mx-3" />
                <button onClick={clearFilters} className="w-full flex items-center gap-2 px-3 py-1 text-[11px] text-red-500 hover:bg-red-50">
                  <X className="w-3 h-3" /> Xoá tất cả filter
                </button>
              </>)}
            </div>
          )}
        </div>

        {/* Swimlane */}
        <div className="relative">
          <button onClick={() => { setShowSwimlaneMenu(!showSwimlaneMenu); setShowFilter(false); }}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${swimlane !== "none" ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <ArrowUpDown className="w-3 h-3" /> Swimlane {swimlane !== "none" && <span className="text-[9px] opacity-70">· {swimlane === "assignee" ? "Assignee" : "Priority"}</span>}
          </button>
          {showSwimlaneMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-30 w-[140px]">
              {([["none", "None"], ["assignee", "Assignee"], ["priority", "Priority"]] as ["none" | "assignee" | "priority", string][]).map(([v, l]) => (
                <button key={v} onClick={() => { setSwimlane(v); setShowSwimlaneMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] hover:bg-gray-50 ${swimlane === v ? "text-cyan-600 bg-cyan-50/50" : "text-gray-600"}`}>
                  {l} {swimlane === v && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1 text-red-400 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{overdueCount} quá hạn</span>
            </div>
          )}
          <span>{boardTasks.length} tasks</span>
          {totalSP > 0 && (
            <div className="flex items-center gap-1 text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              <Zap className="w-2.5 h-2.5" />
              <span>{doneSP}/{totalSP} pts</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-gray-500 font-medium">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Board */}
      {/* Sprint info banner */}
      {currentSprint && selectedSprint !== "all" && (
        <div className="px-5 py-2 bg-violet-50/60 border-b border-violet-100 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentSprint.status === "active" ? "bg-emerald-500 animate-pulse" : currentSprint.status === "completed" ? "bg-blue-400" : "bg-gray-300"}`} />
            <span className="text-[12px] font-semibold text-violet-800">{currentSprint.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${{ active: "bg-emerald-100 text-emerald-600", planning: "bg-gray-100 text-gray-500", completed: "bg-blue-100 text-blue-600" }[currentSprint.status]}`}>
              {{ active: "Active", planning: "Planning", completed: "Completed" }[currentSprint.status]}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-violet-500">
            <Calendar className="w-3 h-3" />
            {new Date(currentSprint.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – {new Date(currentSprint.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </div>
          {totalSP > 0 && (
            <>
              <div className="w-px h-3 bg-violet-200" />
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-violet-200 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.round((doneSP / totalSP) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-violet-600 font-medium">{doneSP}/{totalSP} pts</span>
              </div>
            </>
          )}
          <div className="flex-1" />
          {boardTasks.length > 0 && (
            <span className="text-[10px] text-violet-400">{boardTasks.length} tasks · {Math.round((boardTasks.filter(t => t.status === "done").length / boardTasks.length) * 100)}% hoàn thành</span>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
      <div className="board-scroll flex-1" style={{ overflowX: 'scroll', overflowY: 'auto', minHeight: 0 }} onClick={() => { setShowFilter(false); setShowSwimlaneMenu(false); setShowSprintMenu(false); setShowColMenu(null); }}>
        <div style={{ display: 'inline-block', verticalAlign: 'top', padding: '1rem', minWidth: '100%' }}>
        {swimlaneGroups.map(group => (
          <div key={group.key}>
            {swimlane !== "none" && (
              <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
                {"color" in group && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (group as any).color }} />}
                <span className="text-[12px] font-medium text-gray-700">{group.label}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{group.tasks.length}</span>
                <div className="flex-1 h-px bg-gray-200 ml-1" />
              </div>
            )}

            <div className="flex gap-3 min-w-max mb-4 items-start">
              {statuses.map(status => {
                const config = mergedStatusConfig[status] || { label: status, color: "#94a3b8" };
                const colKey = `${group.key}-${status}`;
                const colTasks = group.tasks.filter(t => t.status === status);
                const isDragOver = dragOverCol === colKey;
                const overWip = colTasks.length >= wipLimitsState[status] && status !== "done";
                const isCollapsed = collapsedCols.has(colKey);
                const colDone = colTasks.filter(t => t.status === "done").length;
                const colPct = colTasks.length > 0 ? Math.round((colDone / colTasks.length) * 100) : 0;
                const colEstimate = colTasks.reduce((s, t) => s + (t.timeEstimate || 0), 0);
                const colOverdue = colTasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== "done").length;

                if (isCollapsed) {
                  return (
                    <div key={colKey} className="w-[44px] flex flex-col rounded-2xl bg-gray-100/50 border border-gray-200/60 cursor-pointer hover:bg-gray-100 transition-all"
                      onClick={() => toggleCollapse(colKey)}>
                      <div className="h-1 rounded-t-2xl" style={{ backgroundColor: config.color }} />
                      <div className="flex flex-col items-center gap-2 py-3 flex-1">
                        <span className="text-[10px] font-semibold text-gray-400 [writing-mode:vertical-rl] rotate-180">{config.label}</span>
                        <span className="text-[10px] text-gray-400 bg-white rounded-full w-5 h-5 flex items-center justify-center border border-gray-200">{colTasks.length}</span>
                        <ChevronRight className="w-3 h-3 text-gray-300 mt-auto mb-1" />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={colKey}
                    className={`w-[290px] flex flex-col rounded-2xl transition-all border ${isDragOver ? "bg-cyan-50/60 border-cyan-200 ring-2 ring-cyan-100" : "bg-gray-100/50 border-gray-200/60"}`}
                    onDragOver={e => { e.preventDefault(); setDragOverCol(colKey); }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={e => handleDrop(e, status)}>

                    {/* Colored top accent */}
                    <div className="h-1 rounded-t-2xl" style={{ backgroundColor: config.color }} />

                    {/* Column header */}
                    <div className="px-3.5 pt-3 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="text-[12px] font-semibold text-gray-700 flex-1">{config.label}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${overWip ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-400 border-gray-100"}`}>
                          {colTasks.length}{status !== "done" && <span className="text-gray-300 font-normal">/{wipLimitsState[status]}</span>}
                        </span>
                        {overWip && <AlertTriangle className="w-3 h-3 text-red-400" />}
                        {colOverdue > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                            <AlertTriangle className="w-2 h-2" />{colOverdue}
                          </span>
                        )}
                        <button onClick={() => toggleCollapse(colKey)} className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-gray-300 hover:text-gray-400 transition-all">
                          <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setShowColMenu(showColMenu === colKey ? null : colKey); setWipEditCol(null); }}
                            className="w-5 h-5 rounded-lg hover:bg-white flex items-center justify-center text-gray-300 hover:text-gray-500 transition-all">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {showColMenu === colKey && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-50 w-[210px]">
                              <button
                                onClick={() => { moveCol(status, -1); setShowColMenu(null); }}
                                disabled={statuses.indexOf(status) === 0}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                                Move column left
                              </button>
                              <button
                                onClick={() => { moveCol(status, 1); setShowColMenu(null); }}
                                disabled={statuses.indexOf(status) === statuses.length - 1}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                Move column right
                              </button>
                              <div className="h-px bg-gray-100 my-1 mx-3" />
                              <button
                                onClick={() => { setWipEditCol(wipEditCol === colKey ? null : colKey); setWipEditVal(String(wipLimitsState[status] ?? "")); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700">
                                <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                                Set column limit
                                <span className="ml-auto text-[10px] text-gray-400">{wipLimitsState[status] ?? "—"}</span>
                              </button>
                              {wipEditCol === colKey && (
                                <div className="px-3 pb-2 pt-1" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5">
                                    <input autoFocus type="number" min="1" max="99"
                                      value={wipEditVal}
                                      onChange={e => setWipEditVal(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") {
                                          const v = parseInt(wipEditVal);
                                          if (!isNaN(v) && v > 0) setWipLimitsState(p => ({ ...p, [status]: v }));
                                          setWipEditCol(null); setShowColMenu(null);
                                        }
                                        if (e.key === "Escape") { setWipEditCol(null); setShowColMenu(null); }
                                      }}
                                      className="flex-1 text-[11px] border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-300"
                                      placeholder="Nhập số..." />
                                    <button
                                      onClick={() => {
                                        const v = parseInt(wipEditVal);
                                        if (!isNaN(v) && v > 0) setWipLimitsState(p => ({ ...p, [status]: v }));
                                        setWipEditCol(null); setShowColMenu(null);
                                      }}
                                      className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700">
                                      OK
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="h-px bg-gray-100 my-1 mx-3" />
                              <button
                                onClick={() => { toggleCollapse(colKey); setShowColMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 text-gray-700">
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400 rotate-90" />
                                Collapse column
                              </button>
                              <button
                                onClick={() => { setHiddenCols(prev => { const next = new Set(prev); next.add(status); return next; }); setShowColMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-red-50 text-red-500">
                                <X className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Column stats bar */}
                      {colTasks.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-[3px] bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${status === "done" ? 100 : colPct}%`, backgroundColor: config.color, opacity: 0.7 }} />
                          </div>
                          <span className="text-[8px] text-gray-400 tabular-nums">{status === "done" ? 100 : colPct}%</span>
                          {colEstimate > 0 && (
                            <span className="text-[8px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />{Math.round(colEstimate / 60)}h
                            </span>
                          )}
                          {(() => {
                            const colSP = colTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
                            return colSP > 0 ? (
                              <span className="text-[8px] text-violet-400 flex items-center gap-0.5">
                                <Zap className="w-2 h-2" />{colSP}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto px-2 pt-1 pb-1 space-y-2">
                      {colTasks.map(task => (
                        <BoardCard key={task.id} task={task} onClick={() => setSelectedCard(task)}
                          onDragStart={e => handleDragStart(e, task.id)}
                          onDragEnd={() => { setDragOverCol(null); setDraggedTaskId(null); }}
                          isDragging={draggedTaskId === task.id}
                          onSaveTask={onSaveTask} />
                      ))}
                      {colTasks.length === 0 && quickAddCol !== colKey && (
                        <div className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed transition-all ${isDragOver ? "border-cyan-300 bg-cyan-50/50" : "border-gray-200"}`}>
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                            <Plus className="w-4 h-4 text-gray-300" />
                          </div>
                          <span className="text-[10px] text-gray-300">{isDragOver ? "Thả vào đây" : "Chưa có task"}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick add form OR persistent + Create button */}
                    {quickAddCol === colKey ? (
                      <div className="px-2 pb-2.5" onClick={e => { e.stopPropagation(); setQuickAddShowType(false); setQuickAddShowAssignee(false); }}>
                        <div className="bg-white rounded-xl border border-blue-300 shadow-md overflow-visible">
                          <input autoFocus value={quickAddText} onChange={e => setQuickAddText(e.target.value)}
                            placeholder="What needs to be done?"
                            onKeyDown={e => {
                              if (e.key === "Escape") resetQuickAdd();
                              if (e.key === "Enter" && quickAddText.trim()) submitQuickAdd(status);
                            }}
                            className="w-full text-[12px] text-gray-800 placeholder-gray-400 focus:outline-none px-3 pt-3 pb-2 bg-transparent" />

                          <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
                            <div className="relative" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setQuickAddShowType(o => !o); setQuickAddShowAssignee(false); }}
                                className="flex items-center gap-0.5 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                                title="Loại task">
                                <TaskTypeIcon type={quickAddType} />
                                <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                              </button>
                              {quickAddShowType && (
                                <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-50 w-[140px]">
                                  {(["task", "story", "bug"] as Task["type"][]).map(t => (
                                    <button key={t} onClick={() => { setQuickAddType(t); setQuickAddShowType(false); }}
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left ${quickAddType === t ? "bg-gray-50" : ""}`}>
                                      <TaskTypeIcon type={t} />
                                      <span className="text-[11px] text-gray-700">{{ task: "Task", story: "Story", bug: "Bug" }[t!]}</span>
                                      {quickAddType === t && <Check className="w-3 h-3 text-blue-500 ml-auto" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="relative">
                              <label className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-gray-100 border border-gray-200 cursor-pointer" title="Deadline">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {quickAddDate && <span className="text-[10px] text-gray-600">{new Date(quickAddDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>}
                                <input type="date" value={quickAddDate} onChange={e => setQuickAddDate(e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full cursor-pointer" />
                              </label>
                            </div>

                            <div className="relative" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setQuickAddShowAssignee(o => !o); setQuickAddShowType(false); }}
                                className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-gray-100 border border-gray-200 transition-colors" title="Người phụ trách">
                                {quickAddAssignee ? (
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: quickAddAssignee.color }}>{quickAddAssignee.name.charAt(0)}</div>
                                ) : (
                                  <User className="w-3 h-3 text-gray-400" />
                                )}
                              </button>
                              {quickAddShowAssignee && (
                                <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-50 w-[180px]">
                                  <button onClick={() => { setQuickAddAssignee(undefined); setQuickAddShowAssignee(false); }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${!quickAddAssignee ? "text-blue-600 bg-blue-50/50" : "text-gray-500"}`}>
                                    <User className="w-3 h-3 text-gray-300" /> Chưa phân công
                                    {!quickAddAssignee && <Check className="w-3 h-3 ml-auto text-blue-500" />}
                                  </button>
                                  {teamMembers.map(m => (
                                    <button key={m.id} onClick={() => { setQuickAddAssignee(m); setQuickAddShowAssignee(false); }}
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${quickAddAssignee?.id === m.id ? "text-blue-600 bg-blue-50/50" : "text-gray-700"}`}>
                                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                      <span className="flex-1 truncate">{m.name}</span>
                                      {quickAddAssignee?.id === m.id && <Check className="w-3 h-3 text-blue-500 shrink-0" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex-1" />
                            <button onClick={resetQuickAdd} className="text-[10px] text-gray-400 px-2 py-1 rounded-md hover:bg-gray-100">Huỷ</button>
                            <button disabled={!quickAddText.trim()} onClick={() => submitQuickAdd(status)}
                              className="text-[10px] text-white bg-blue-600 px-2.5 py-1 rounded-md hover:bg-blue-700 disabled:opacity-40 font-medium">
                              Thêm ↵
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2 pb-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); resetQuickAdd(); setQuickAddCol(colKey); }}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all group border border-dashed border-gray-200 hover:border-blue-200">
                          <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          <span>Create</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add column button — only render once (first swimlane group) */}
              {group.key === swimlaneGroups[0].key && (
                <div className="flex flex-col pt-1">
                  {showAddCol ? (
                    <div className="w-[220px] bg-gray-100/70 rounded-2xl border border-gray-200 p-3 flex flex-col gap-2">
                      <input
                        autoFocus
                        value={addColText}
                        onChange={e => setAddColText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") addColumn();
                          if (e.key === "Escape") { setShowAddCol(false); setAddColText(""); }
                        }}
                        placeholder="Tên cột..."
                        className="text-[12px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 text-gray-800 placeholder-gray-400"
                      />
                      <div className="flex items-center gap-1.5">
                        <button onClick={addColumn} disabled={!addColText.trim()}
                          className="flex-1 text-[11px] bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
                          Thêm cột
                        </button>
                        <button onClick={() => { setShowAddCol(false); setAddColText(""); }}
                          className="text-[11px] text-gray-400 px-2 py-1.5 rounded-lg hover:bg-gray-200">
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setShowAddCol(true); }}
                      className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Hidden columns restore */}
              {hiddenCols.size > 0 && group.key === swimlaneGroups[0].key && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {colOrder.filter(s => hiddenCols.has(s)).map(s => (
                    <button key={s} onClick={() => setHiddenCols(prev => { const next = new Set(prev); next.delete(s); return next; })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-200 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all whitespace-nowrap">
                      <Plus className="w-3 h-3" />
                      {statusConfig[s]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Task side panel — layout element, not fixed overlay */}
      {selectedCard && (
        <TaskSidePanel
          task={selectedCard}
          onClose={() => setSelectedCard(null)}
          onOpenFull={() => { onTaskClick(selectedCard); setSelectedCard(null); }}
          onSave={onSaveTask ? (updated) => { onSaveTask(updated); setSelectedCard(updated); } : undefined}
          customStatusConfig={mergedStatusConfig}
          sprints={allSprints}
        />
      )}
      </div>
    </div>
  );
}

export function TaskSidePanel({ task, onClose, onOpenFull, onSave, customStatusConfig, sprints: sprintsProp }: {
  task: Task;
  onClose: () => void;
  onOpenFull: () => void;
  onSave?: (task: Task) => void;
  customStatusConfig?: Record<string, { label: string; color: string }>;
  sprints?: Sprint[];
}) {
  const allSprints = sprintsProp ?? staticSprints;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showReporterPicker, setShowReporterPicker] = useState(false);

  const effectiveStatusConfig: Record<string, { label: string; color: string }> = { ...statusConfig, ...customStatusConfig };
  const project = projects.find(p => p.id === task.projectId);
  const epic = task.epicId ? epics.find(e => e.id === task.epicId) : null;
  const taskSprint = task.sprintId ? allSprints.find(s => s.id === task.sprintId) : null;
  const priorityCfg = priorityConfig[task.priority];
  const statusCfg = effectiveStatusConfig[task.status] || effectiveStatusConfig.todo;
  const completedSubtasks = task.subtasks?.filter(s => s.done).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const closeAllMenus = () => { setShowStatusMenu(false); setShowAssigneeMenu(false); setShowPriorityMenu(false); setShowTypePicker(false); setShowReporterPicker(false); };
  const save = (patch: Partial<Task>) => onSave?.({ ...task, ...patch });

  return (
    <div
      className="w-[380px] shrink-0 flex flex-col bg-white border-l border-gray-200 shadow-lg overflow-hidden"
      style={{ animation: "slideInRight 0.2s ease" }}
      onClick={e => { e.stopPropagation(); closeAllMenus(); }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-1 min-w-0">
            {project && (
              <>
                <div className="w-4 h-4 rounded flex items-center justify-center text-[6px] text-white shrink-0" style={{ backgroundColor: project.color }}>{project.icon}</div>
                <span className="truncate font-medium text-gray-600">{project.name}</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
              </>
            )}
            <span className="font-mono text-gray-400">#{task.id}</span>
          </div>
          <button onClick={onOpenFull} title="Mở chi tiết đầy đủ"
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-6 space-y-5">
            {/* Epic */}
            {epic && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-md border font-medium" style={{ backgroundColor: epic.color + "18", color: epic.color, borderColor: epic.color + "40" }}>⚡ {epic.title}</span>
              </div>
            )}

            {/* Title */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && save({ title: title.trim() })}
              className="w-full text-[20px] font-semibold text-gray-900 bg-transparent border-none outline-none resize-none leading-tight placeholder-gray-300"
              placeholder="Tên task..."
            />

            {/* Description */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Mô tả</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => description !== (task.description || "") && save({ description })}
                placeholder="Thêm mô tả..."
                rows={3}
                className="w-full text-[12px] text-gray-700 placeholder-gray-300 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 focus:outline-none focus:border-cyan-300 resize-none"
              />
            </div>

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Subtasks</p>
                  <span className="text-[9px] text-gray-400">{completedSubtasks}/{totalSubtasks}</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full mb-3">
                  <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
                </div>
                <div className="space-y-1.5">
                  {task.subtasks?.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 text-[12px]">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${sub.done ? "bg-cyan-500 border-cyan-500" : "border-gray-300"}`}>
                        {sub.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={sub.done ? "text-gray-400 line-through" : "text-gray-700"}>{sub.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100" />

            {/* Details — same form style as List/Backlog sidebar */}
            <div className="space-y-4">

              {/* Loại công việc */}
              {(() => {
                const currentType = task.type || "task";
                const cfg = taskTypeConfig[currentType];
                return (
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-400 uppercase tracking-wider">Loại công việc</label>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { closeAllMenus(); setShowTypePicker(o => !o); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all hover:opacity-90"
                        style={{ backgroundColor: cfg.bg, borderColor: cfg.color + "50" }}>
                        <span className="text-[13px]">{cfg.icon}</span>
                        <span className="text-[11px] font-medium flex-1" style={{ color: cfg.color }}>{cfg.label}</span>
                        <ChevronDown className="w-3 h-3" style={{ color: cfg.color + "80" }} />
                      </button>
                      {showTypePicker && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                          {(["task", "story", "bug", "epic"] as TaskType[]).map(t => {
                            const c = taskTypeConfig[t];
                            return (
                              <button key={t} onClick={() => { save({ type: t }); setShowTypePicker(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 ${currentType === t ? "bg-gray-50" : ""}`}>
                                <span className="text-[13px]">{c.icon}</span>
                                <span className="text-[11px] text-gray-700 flex-1">{c.label}</span>
                                {currentType === t && <Check className="w-3 h-3 text-cyan-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="h-px bg-gray-100" />

              {/* Trạng thái */}
              <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Trạng thái</label>
                <button onClick={() => { setShowStatusMenu(o => !o); setShowPriorityMenu(false); setShowAssigneeMenu(false); setShowTypePicker(false); setShowReporterPicker(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusCfg.color }} />
                  <span className="text-[11px] text-gray-700 flex-1">{statusCfg.label}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showStatusMenu && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                    {Object.entries(effectiveStatusConfig).map(([k, v]) => (
                      <button key={k} onClick={() => { save({ status: k as Task["status"] }); setShowStatusMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${task.status === k ? "bg-cyan-50/50" : ""}`}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                        <span className="text-gray-700">{v.label}</span>
                        {task.status === k && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Độ ưu tiên */}
              <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Độ ưu tiên</label>
                <button onClick={() => { setShowPriorityMenu(o => !o); setShowStatusMenu(false); setShowAssigneeMenu(false); setShowTypePicker(false); setShowReporterPicker(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                  <span className="text-[9px] shrink-0" style={{ color: priorityCfg.color }}>{priorityCfg.icon}</span>
                  <span className="text-[11px] text-gray-700 flex-1">{priorityCfg.label}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showPriorityMenu && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                    {(Object.entries(priorityConfig) as [Task["priority"], typeof priorityConfig[Task["priority"]]][]).map(([k, v]) => (
                      <button key={k} onClick={() => { save({ priority: k }); setShowPriorityMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${task.priority === k ? "bg-cyan-50/50" : ""}`}>
                        <span className="text-[9px] shrink-0" style={{ color: v.color }}>{v.icon}</span>
                        <span className="text-gray-700">{v.label}</span>
                        {task.priority === k && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Người phụ trách */}
              <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Người phụ trách</label>
                <button onClick={() => { setShowAssigneeMenu(o => !o); setShowStatusMenu(false); setShowPriorityMenu(false); setShowTypePicker(false); setShowReporterPicker(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                  {task.assignee ? (
                    <>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>
                      <span className="text-[11px] text-gray-700 flex-1">{task.assignee.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shrink-0"><User className="w-2.5 h-2.5" /></div>
                      <span className="text-[11px] text-gray-400 flex-1">Chưa phân công</span>
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showAssigneeMenu && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                    <button onClick={() => { save({ assignee: undefined }); setShowAssigneeMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50">Chưa phân công</button>
                    {teamMembers.map(m => (
                      <button key={m.id} onClick={() => { save({ assignee: m }); setShowAssigneeMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${task.assignee?.id === m.id ? "bg-cyan-50/50" : ""}`}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                        <span className="text-gray-700 flex-1">{m.name}</span>
                        {task.assignee?.id === m.id && <Check className="w-3 h-3 text-cyan-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Người báo cáo */}
              <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Người báo cáo</label>
                {(() => {
                  const reporter = teamMembers.find(m => m.id === (task.reporterId || "u1"));
                  return (
                    <>
                      <button onClick={() => { setShowReporterPicker(o => !o); setShowStatusMenu(false); setShowPriorityMenu(false); setShowAssigneeMenu(false); setShowTypePicker(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: reporter?.color || "#94a3b8" }}>{reporter?.name.charAt(0) || "?"}</div>
                        <span className="text-[11px] text-gray-700 flex-1">{reporter?.name || "Chưa xác định"}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                      {showReporterPicker && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                          {teamMembers.map(m => (
                            <button key={m.id} onClick={() => { save({ reporterId: m.id }); setShowReporterPicker(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${(task.reporterId || "u1") === m.id ? "bg-cyan-50/50" : ""}`}>
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                              <span className="text-gray-700 flex-1">{m.name}</span>
                              {(task.reporterId || "u1") === m.id && <Check className="w-3 h-3 text-cyan-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Dự án */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Dự án</label>
                <select value={task.projectId} onChange={e => save({ projectId: e.target.value, epicId: undefined })}
                  className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Epic */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Epic</label>
                {(() => {
                  const projectEpics = epics.filter(e => e.projectId === task.projectId);
                  const selectedEpic = task.epicId ? epics.find(e => e.id === task.epicId) : null;
                  return (
                    <div>
                      <select value={task.epicId || ""} disabled={task.type === "epic"}
                        onChange={e => save({ epicId: e.target.value || undefined })}
                        className={`w-full text-[11px] border rounded-lg px-3 py-2 outline-none ${task.type === "epic" ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700 focus:border-cyan-400"}`}
                        style={task.type !== "epic" && selectedEpic ? { borderColor: selectedEpic.color + "80", color: selectedEpic.color } : {}}>
                        <option value="">{task.type === "epic" ? "Không áp dụng" : "Không có Epic"}</option>
                        {task.type !== "epic" && projectEpics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
                      </select>
                      {selectedEpic && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: selectedEpic.color }} />
                          <span className="text-[9px]" style={{ color: selectedEpic.color }}>
                            {selectedEpic.status === "done" ? "Đã xong" : selectedEpic.status === "in_progress" ? "Đang làm" : "Chưa bắt đầu"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Sprint */}
              {(() => {
                const projectSprints = allSprints.filter(s => s.status !== "completed");
                const selectedSprint = task.sprintId ? allSprints.find(s => s.id === task.sprintId) : null;
                const sprintCfg: Record<string, { label: string; color: string; bg: string; dot: string }> = {
                  active:   { label: "Đang chạy",    color: "#059669", bg: "#f0fdf4", dot: "bg-green-500 animate-pulse" },
                  planning: { label: "Lên kế hoạch", color: "#0891b2", bg: "#ecfeff", dot: "bg-cyan-400" },
                };
                return (
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Layers className="w-2.5 h-2.5" /> Sprint</label>
                    <div className="relative">
                      <select value={task.sprintId || ""} onChange={e => save({ sprintId: e.target.value || undefined })}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400 appearance-none pr-7">
                        <option value="">Backlog</option>
                        {projectSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {selectedSprint ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border"
                        style={{ backgroundColor: sprintCfg[selectedSprint.status]?.bg || "#f9fafb", borderColor: (sprintCfg[selectedSprint.status]?.color || "#e5e7eb") + "30" }}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sprintCfg[selectedSprint.status]?.dot || "bg-gray-400"}`} />
                        <span className="text-[9px] font-medium" style={{ color: sprintCfg[selectedSprint.status]?.color || "#6b7280" }}>
                          {sprintCfg[selectedSprint.status]?.label}
                        </span>
                        <span className="text-[9px] text-gray-400 ml-auto">{selectedSprint.startDate.slice(5)} → {selectedSprint.endDate.slice(5)}</span>
                      </div>
                    ) : (
                      <p className="text-[9px] text-gray-400 px-1">Chưa thuộc sprint nào</p>
                    )}
                  </div>
                );
              })()}

              {/* Ngày bắt đầu & Ngày kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" /> Bắt đầu</label>
                  <input type="date" value={task.startDate || ""}
                    onChange={e => save({ startDate: e.target.value || undefined })}
                    className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" /> Kết thúc</label>
                  <input type="date" value={task.dueDate || ""}
                    onChange={e => save({ dueDate: e.target.value || undefined })}
                    className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400" />
                </div>
              </div>

              {/* Story Points */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Zap className="w-2.5 h-2.5" /> Story Points</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 5, 8, 13].map(pt => {
                    const active = task.storyPoints === pt;
                    return (
                      <button key={pt} onClick={() => save({ storyPoints: active ? undefined : pt })}
                        className="w-8 h-8 rounded-lg text-[11px] font-semibold border transition-all"
                        style={active ? { backgroundColor: "#0891b2", color: "white", borderColor: "#0891b2" } : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }}>
                        {pt}
                      </button>
                    );
                  })}
                  <input type="number" min={1} max={100} placeholder="?"
                    value={task.storyPoints && ![1,2,3,5,8,13].includes(task.storyPoints) ? task.storyPoints : ""}
                    onChange={e => { const v = parseInt(e.target.value); save({ storyPoints: v > 0 ? v : undefined }); }}
                    className="w-10 h-8 rounded-lg text-[11px] text-center border border-gray-200 bg-white text-gray-500 outline-none focus:border-cyan-400 [appearance:textfield]"
                  />
                </div>
                {task.storyPoints && (
                  <p className="text-[9px] text-cyan-600 font-medium px-0.5">{task.storyPoints} {task.storyPoints === 1 ? "point" : "points"} được ghi nhận vào velocity</p>
                )}
              </div>

            </div>
          </div>
        </div>

      </>
    </div>
  );
}

function BoardCard({ task, onClick, onDragStart, onDragEnd, isDragging, onSaveTask }: {
  task: Task; onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onSaveTask?: (task: Task) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"assignee" | "priority" | "sprint" | null>(null);
  const project = projects.find(p => p.id === task.projectId);
  const epic = task.epicId ? epics.find(e => e.id === task.epicId) : null;
  const priorityCfg = priorityConfig[task.priority];
  const completedSubtasks = task.subtasks?.filter(s => s.done).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const totalCheckItems = (task.checklists || []).reduce((a, cl) => a + cl.items.length, 0);
  const doneCheckItems = (task.checklists || []).reduce((a, cl) => a + cl.items.filter(i => i.done).length, 0);
  const commentCount = task.comments?.length || 0;
  const watcherCount = task.watchers?.length || 0;

  const cardToday = new Date(); cardToday.setHours(0, 0, 0, 0);
  const isOverdue = task.dueDate && new Date(task.dueDate) < cardToday && task.status !== "done";
  const daysOverdue = task.dueDate ? Math.abs(Math.ceil((new Date(task.dueDate).getTime() - cardToday.getTime()) / 86400000)) : 0;
  const isDueSoon = task.dueDate && !isOverdue && Math.ceil((new Date(task.dueDate).getTime() - cardToday.getTime()) / 86400000) <= 2;

  const timeEstH = task.timeEstimate ? Math.floor(task.timeEstimate / 60) : 0;
  const timeSpentH = task.timeSpent ? Math.floor(task.timeSpent / 60) : 0;
  const timePct = task.timeEstimate ? Math.min(100, Math.round(((task.timeSpent || 0) / task.timeEstimate) * 100)) : 0;
  const isOvertime = (task.timeSpent || 0) > (task.timeEstimate || Infinity);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActiveMenu(null); }}
    >
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      className={`bg-white rounded-xl cursor-pointer transition-all group border overflow-hidden
        ${isDragging ? "opacity-40 scale-95 shadow-lg" : "shadow-sm"}
        ${isOverdue ? "border-red-200 hover:border-red-300" : "border-gray-200 hover:border-gray-300"}
        ${hovered && !isDragging ? "shadow-md -translate-y-0.5" : ""}
      `}>

      {/* Priority accent line — all priorities */}
      <div className="h-[3px] w-full" style={{ backgroundColor: priorityCfg.color, opacity: task.priority === "low" ? 0.25 : task.priority === "normal" ? 0.4 : 0.75 }} />

      <div className="p-3.5">
        {/* Epic badge */}
        {epic && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border" style={{ backgroundColor: epic.color + "18", color: epic.color, borderColor: epic.color + "40" }}>
              ⚡ {epic.title}
            </span>
          </div>
        )}
        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 3).map(tag => {
              const tc = tagColors[tag] || { bg: "#f1f5f9", text: "#64748b" };
              return <span key={tag} className="px-1.5 py-0.5 rounded-md text-[9px] font-medium" style={{ backgroundColor: tc.bg, color: tc.text }}>{tag}</span>;
            })}
            {task.tags.length > 3 && <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-gray-100 text-gray-400">+{task.tags.length - 3}</span>}
          </div>
        )}

        {/* Type + Title */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <TaskTypeIcon type={task.type} />
          <p className={`text-[13px] line-clamp-2 leading-snug font-medium ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-800"}`}>
            {task.title}
          </p>
        </div>

        {/* Description preview */}
        {task.description && task.status !== "done" && (
          <p className="text-[10px] text-gray-400 line-clamp-1 mb-2 leading-relaxed">{task.description}</p>
        )}

        {/* Overdue badge */}
        {isOverdue && (
          <div className="flex items-center gap-1 mb-2.5 bg-red-50 rounded-lg px-2 py-1 border border-red-100 w-fit">
            <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
            <span className="text-[9px] text-red-500 font-medium">Trễ {daysOverdue} ngày</span>
          </div>
        )}

        {/* Subtask progress */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-[3px] bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%`, background: "linear-gradient(90deg, #0891b2, #0d9488)" }} />
            </div>
            <span className="text-[9px] text-gray-400 tabular-nums">{completedSubtasks}/{totalSubtasks}</span>
          </div>
        )}

        {/* Time tracking */}
        {task.timeEstimate && task.timeEstimate > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex-1 h-[3px] bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${timePct}%`, backgroundColor: isOvertime ? "#dc2626" : "#8b5cf6" }} />
            </div>
            <span className={`text-[8px] tabular-nums ${isOvertime ? "text-red-400" : "text-gray-400"}`}>{timeSpentH}h/{timeEstH}h</span>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            {/* Assignee */}
            {task.assignee ? (
              <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] text-white font-medium ring-2 ring-white shadow-sm" style={{ backgroundColor: task.assignee.color }}>
                {task.assignee.name.charAt(0)}
              </div>
            ) : (
              <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center bg-gray-100 text-gray-300 ring-2 ring-white">
                <User className="w-2.5 h-2.5" />
              </div>
            )}

            {/* Priority dot */}
            <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ backgroundColor: priorityCfg.color, opacity: task.priority === "low" ? 0.4 : 1 }} title={priorityCfg.label} />

            {/* Story points */}
            {task.storyPoints != null && task.storyPoints > 0 && (
              <span className="text-[9px] text-violet-500 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded font-medium leading-none">
                {task.storyPoints}
              </span>
            )}

            {/* Meta icons */}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                <MessageSquare className="w-2.5 h-2.5" />{commentCount}
              </span>
            )}
            {totalCheckItems > 0 && (
              <span className={`flex items-center gap-0.5 text-[9px] ${doneCheckItems === totalCheckItems ? "text-teal-500" : "text-gray-400"}`}>
                <CheckSquare className="w-2.5 h-2.5" />{doneCheckItems}/{totalCheckItems}
              </span>
            )}
            {task.dependencies && task.dependencies.length > 0 && (
              <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">🔗{task.dependencies.length}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Watchers */}
            {watcherCount > 0 && (
              <span className="text-[9px] text-gray-300 flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {watcherCount}
              </span>
            )}

            {/* Task key — Jira style: type color square + project key + id */}
            {(() => {
              const projKey = project ? project.name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4) || "TASK" : "TASK";
              const idShort = task.id.length > 8 ? task.id.slice(0, 3) + ".." + task.id.slice(-2) : task.id;
              const typeColor = task.type === "bug" ? "#ef4444" : task.type === "story" ? "#10b981" : task.type === "epic" ? "#8b5cf6" : "#3b82f6";
              return (
                <div className="flex items-center gap-0.5" title={`${project?.name || ""} · ${task.type || "task"}`}>
                  <span className="inline-flex w-[10px] h-[10px] rounded-[2px] shrink-0" style={{ backgroundColor: typeColor }} />
                  <span className="text-[9px] text-gray-400 font-mono select-none">{projKey}-{idShort}</span>
                </div>
              );
            })()}

            {/* Due date */}
            {task.dueDate && (
              <span className={`flex items-center gap-0.5 text-[10px] font-medium ${isOverdue ? "text-red-500" : isDueSoon ? "text-amber-500" : "text-gray-400"}`}>
                <Calendar className="w-2.5 h-2.5" />
                {new Date(task.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Hover quick actions */}
    {hovered && !isDragging && onSaveTask && (
      <div className="absolute top-2 right-2 flex items-center gap-1 z-20" onClick={e => e.stopPropagation()}>
        <button onClick={() => setActiveMenu(activeMenu === "assignee" ? null : "assignee")}
          className={`w-6 h-6 rounded-lg shadow-sm border flex items-center justify-center transition-all ${activeMenu === "assignee" ? "bg-cyan-50 border-cyan-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}
          title="Đổi người phụ trách">
          <User className="w-3 h-3 text-gray-500" />
        </button>
        <button onClick={() => setActiveMenu(activeMenu === "priority" ? null : "priority")}
          className={`w-6 h-6 rounded-lg shadow-sm border flex items-center justify-center transition-all ${activeMenu === "priority" ? "bg-cyan-50 border-cyan-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}
          title="Đổi độ ưu tiên">
          <Flag className="w-3 h-3" style={{ color: priorityCfg.color }} />
        </button>
        <button onClick={() => setActiveMenu(activeMenu === "sprint" ? null : "sprint")}
          className={`w-6 h-6 rounded-lg shadow-sm border flex items-center justify-center transition-all ${activeMenu === "sprint" ? "bg-cyan-50 border-cyan-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}
          title="Chuyển sprint">
          <Layers className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    )}

    {/* Assignee picker */}
    {activeMenu === "assignee" && (
      <div className="absolute right-0 top-10 z-50 bg-white rounded-xl border border-gray-200 shadow-xl py-1 w-[190px]" onClick={e => e.stopPropagation()}>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 pt-1 pb-1.5">Người phụ trách</p>
        <button onClick={() => { onSaveTask({ ...task, assignee: undefined }); setActiveMenu(null); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${!task.assignee ? "text-cyan-600 bg-cyan-50/50" : "text-gray-500"}`}>
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 text-gray-300" />
          </div>
          <span className="flex-1">Chưa phân công</span>
          {!task.assignee && <Check className="w-3 h-3 text-cyan-500" />}
        </button>
        {teamMembers.map(m => (
          <button key={m.id} onClick={() => { onSaveTask({ ...task, assignee: m }); setActiveMenu(null); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${task.assignee?.id === m.id ? "text-cyan-600 bg-cyan-50/50" : "text-gray-700"}`}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
            <span className="flex-1 truncate">{m.name}</span>
            {task.assignee?.id === m.id && <Check className="w-3 h-3 text-cyan-500 shrink-0" />}
          </button>
        ))}
      </div>
    )}

    {/* Priority picker */}
    {activeMenu === "priority" && (
      <div className="absolute right-0 top-10 z-50 bg-white rounded-xl border border-gray-200 shadow-xl py-1 w-[160px]" onClick={e => e.stopPropagation()}>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 pt-1 pb-1.5">Độ ưu tiên</p>
        {(Object.entries(priorityConfig) as [Task["priority"], typeof priorityConfig[Task["priority"]]][]).map(([k, v]) => (
          <button key={k} onClick={() => { onSaveTask({ ...task, priority: k }); setActiveMenu(null); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${task.priority === k ? "bg-gray-50" : "text-gray-700"}`}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
            <span className="flex-1">{v.label}</span>
            {task.priority === k && <Check className="w-3 h-3 text-cyan-500" />}
          </button>
        ))}
      </div>
    )}

    {/* Sprint picker */}
    {activeMenu === "sprint" && (
      <div className="absolute right-0 top-10 z-50 bg-white rounded-xl border border-gray-200 shadow-xl py-1 w-[210px]" onClick={e => e.stopPropagation()}>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 pt-1 pb-1.5">Chuyển sang sprint</p>
        <button onClick={() => { onSaveTask({ ...task, sprintId: undefined }); setActiveMenu(null); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${!task.sprintId ? "text-cyan-600 bg-cyan-50/50" : "text-gray-500"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
          <span className="flex-1">Backlog</span>
          {!task.sprintId && <Check className="w-3 h-3 text-cyan-500" />}
        </button>
        {allSprints.map(sprint => (
          <button key={sprint.id} onClick={() => { onSaveTask({ ...task, sprintId: sprint.id }); setActiveMenu(null); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${task.sprintId === sprint.id ? "text-cyan-600 bg-cyan-50/50" : "text-gray-700"}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sprint.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
            <span className="flex-1 truncate">{sprint.name}</span>
            {sprint.status === "active" && <span className="text-[8px] text-emerald-500 shrink-0">Active</span>}
            {task.sprintId === sprint.id && <Check className="w-3 h-3 text-cyan-500 shrink-0" />}
          </button>
        ))}
      </div>
    )}
  </div>
  );
}
