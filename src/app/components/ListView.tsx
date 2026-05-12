import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Calendar, Check, Search, Filter, Plus,
  CheckSquare, Square, ArrowUp, ArrowDown, ArrowUpDown, Users, X, MoreHorizontal,
  Download, Upload, AlertCircle, FileText, EyeOff, GripVertical,
  Bug, BookOpen, Zap, CheckSquare2,
  PanelRight, Send, ExternalLink, User,
  MessageSquare, Clock, Activity, ListChecks, Link2, ArrowUpRight,
  Reply, Pencil, Trash2, Layers, AlertTriangle, Play, Pause,
} from "lucide-react";
import { type Task, type TeamMember, type TaskComment, type WorkLog, type ActivityEntry, statusConfig, priorityConfig, tagColors, teamMembers, epics, taskTypeConfig, projects, sprints } from "./data";
import type { CustomStatusMap } from "../App";
import { useTaskFilter } from "../hooks/useTaskFilter";
import { useTaskSort } from "../hooks/useTaskSort";
import { useTaskGroupBy, type GroupBy } from "../hooks/useTaskGroupBy";

// ── Task type icon ────────────────────────────────────────────────────────────

function TaskTypeIcon({ type }: { type?: Task["type"] }) {
  if (type === "bug")   return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-red-500 shrink-0"><Bug      className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "story") return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-emerald-500 shrink-0"><BookOpen className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "epic")  return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-violet-500 shrink-0"><Zap      className="w-2.5 h-2.5 text-white" /></span>;
  return                       <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-blue-500 shrink-0"><CheckSquare2 className="w-2.5 h-2.5 text-white" /></span>;
}

// ── Column definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  id: string;
  label: string;
  width: string;
  sortField?: string;
  filterable?: boolean;
  fixed?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: "id",          label: "ID",           width: "60px" },
  { id: "title",       label: "Work",         width: "1fr",  sortField: "title",    fixed: true },
  { id: "assignee",    label: "Assignee",     width: "130px", sortField: "assignee", filterable: true },
  { id: "priority",    label: "Priority",     width: "106px", sortField: "priority", filterable: true },
  { id: "status",      label: "Status",       width: "148px", sortField: "status",   filterable: true },
  { id: "dueDate",     label: "Due date",     width: "96px",  sortField: "dueDate" },
  { id: "startDate",   label: "Start date",   width: "96px" },
  { id: "created",     label: "Created",      width: "86px",  sortField: "created" },
  { id: "updated",     label: "Updated",      width: "86px" },
  { id: "epic",        label: "Epic",         width: "120px", filterable: true },
  { id: "sprint",      label: "Sprint",       width: "110px", filterable: true },
  { id: "storyPoints", label: "Story Pts",    width: "72px" },
  { id: "type",        label: "Type",         width: "80px",  filterable: true },
  { id: "estimate",    label: "Estimate",     width: "80px" },
  { id: "spent",       label: "Spent",        width: "80px" },
  { id: "tags",        label: "Tags",         width: "130px" },
  { id: "project",     label: "Project",      width: "120px" },
];

const DEFAULT_VISIBLE = ["id", "title", "assignee", "priority", "status", "dueDate", "created", "updated"];

const STATUS_OPTIONS = [
  { value: "todo"        as const, label: "Todo"        },
  { value: "in_progress" as const, label: "In Progress" },
  { value: "in_review"   as const, label: "In Review"   },
  { value: "done"        as const, label: "Done"        },
];

// ── ListView ──────────────────────────────────────────────────────────────────

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onSaveTask: (task: Task) => void;
  onReorderTasks: (reordered: Task[]) => void;
  onDeleteTask: (taskId: string) => void;
  selectedProject: string | null;
  customStatusConfig?: CustomStatusMap;
}

export function ListView({ tasks, onTaskClick, onSaveTask, onReorderTasks, onDeleteTask, selectedProject, customStatusConfig }: ListViewProps) {
  const effectiveStatusConfig: Record<string, { label: string; color: string }> = { ...statusConfig, ...customStatusConfig };

  // ── Separate top-level vs subtasks ────────────────────────────────────────
  const topLevelTasks = tasks.filter(t => !t.parentId);
  const getSubtasks   = (parentId: string) => tasks.filter(t => t.parentId === parentId);

  // ── Filter / sort hooks ────────────────────────────────────────────────────
  const { filteredTasks, searchQ, setSearchQ, filterPriority, setFilterPriority, filterAssignee, setFilterAssignee, hasFilters, clearFilters } = useTaskFilter(topLevelTasks, selectedProject, { searchInTags: true });
  const { sortedTasks, sortField, sortDir, toggleSort: hookToggleSort, setSortDirect } = useTaskSort(filteredTasks, { cycleMode: "3state" });

  // ── Local filter state ─────────────────────────────────────────────────────
  const [filterTypes,    setFilterTypes]    = useState<Set<string>>(new Set());
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterEpics,    setFilterEpics]    = useState<Set<string>>(new Set());

  // ── Column management ──────────────────────────────────────────────────────
  const [visibleColumns,  setVisibleColumns]  = useState<string[]>(DEFAULT_VISIBLE);
  const [columnFilters,   setColumnFilters]   = useState<Record<string, Set<string>>>({});
  const [colMenuId,       setColMenuId]       = useState<string | null>(null);
  const [colFilterId,     setColFilterId]     = useState<string | null>(null);
  const [showAddColMenu,  setShowAddColMenu]  = useState(false);

  // ── Group / selection ──────────────────────────────────────────────────────
  const [groupBy,          setGroupBy]          = useState<GroupBy>("none");
  const [collapsedGroups,  setCollapsedGroups]  = useState<Record<string, boolean>>({});
  const [selectedTasks,    setSelectedTasks]    = useState<Set<string>>(new Set());

  // ── Menu states ────────────────────────────────────────────────────────────
  const [showGroupMenu,        setShowGroupMenu]        = useState(false);
  const [showFilterMenu,       setShowFilterMenu]       = useState(false);
  const [showOptionsMenu,      setShowOptionsMenu]      = useState(false);
  const [statusMenuTaskId,     setStatusMenuTaskId]     = useState<string | null>(null);
  const [rowMenuTaskId,        setRowMenuTaskId]        = useState<string | null>(null);
  const [showBulkStatusMenu,   setShowBulkStatusMenu]   = useState(false);
  const [showBulkPriorityMenu, setShowBulkPriorityMenu] = useState(false);
  const [showBulkAssigneeMenu, setShowBulkAssigneeMenu] = useState(false);

  // ── Drag-to-reorder state ─────────────────────────────────────────────────
  const [dragTaskId,     setDragTaskId]     = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // ── Detail view state ──────────────────────────────────────────────────────
  const [viewMode,            setViewMode]            = useState<"list" | "detail">("list");
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<string | null>(null);

  // ── Import state ───────────────────────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [importParsed,    setImportParsed]    = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [importPreview,   setImportPreview]   = useState<Partial<Task>[]>([]);
  const [importError,     setImportError]     = useState<string | null>(null);
  const [isDragOver,      setIsDragOver]      = useState(false);

  // ── Inline create state ────────────────────────────────────────────────────
  const [inlineCreateGroup, setInlineCreateGroup] = useState<string | null>(null);
  const [inlineTitle,       setInlineTitle]       = useState("");
  const [inlineType,        setInlineType]        = useState<Task["type"]>("task");
  const [showInlineTypeMenu, setShowInlineTypeMenu] = useState(false);
  const inlineInputRef    = useRef<HTMLInputElement>(null);
  const inlineTypeMenuRef = useRef<HTMLDivElement>(null);

  // ── Subtask state ──────────────────────────────────────────────────────────
  const [expandedTasks,        setExpandedTasks]        = useState<Set<string>>(new Set());
  const [subtaskParentId,      setSubtaskParentId]      = useState<string | null>(null);
  const [subtaskTitle,         setSubtaskTitle]         = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // ── Mobile state ───────────────────────────────────────────────────────────
  const [mobileFilter,     setMobileFilter]     = useState<string>("all");
  const [mobileSearch,     setMobileSearch]     = useState("");
  const [mobileDetailTask, setMobileDetailTask] = useState<Task | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const groupMenuRef   = useRef<HTMLDivElement>(null);
  const filterMenuRef  = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const addColMenuRef  = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  // ── Derived values ─────────────────────────────────────────────────────────
  const toggleSet = (set: Set<string>, val: string): Set<string> => { const n = new Set(set); n.has(val) ? n.delete(val) : n.add(val); return n; };
  const projectId    = selectedProject || "p1";
  const projectEpics = epics.filter(e => e.projectId === projectId);

  const localHasFilters = filterTypes.size > 0 || filterStatuses.size > 0 || filterEpics.size > 0;
  const colHasFilters   = Object.values(columnFilters).some(s => s.size > 0);
  const anyFilter       = hasFilters || localHasFilters;
  const filterCount     = (filterPriority ? 1 : 0) + (filterAssignee ? 1 : 0) + filterTypes.size + filterStatuses.size + filterEpics.size + (searchQ ? 1 : 0);

  // Apply toolbar filters
  const localFilteredTasks = sortedTasks.filter(t => {
    if (filterTypes.size    > 0 && !filterTypes.has(t.type || "task"))  return false;
    if (filterStatuses.size > 0 && !filterStatuses.has(t.status))       return false;
    if (filterEpics.size    > 0 && !filterEpics.has(t.epicId ?? ""))    return false;
    return true;
  });

  // Apply column-level filters
  const colFilteredTasks = Object.entries(columnFilters).reduce((acc, [colId, values]) => {
    if (values.size === 0) return acc;
    return acc.filter(t => {
      switch (colId) {
        case "status":   return values.has(t.status);
        case "priority": return values.has(t.priority);
        case "assignee": return values.has(t.assignee?.id || "unassigned");
        case "epic":     return values.has(t.epicId || "__none__");
        case "type":     return values.has(t.type || "task");
        case "sprint":   return values.has(t.sprintId || "__backlog__");
        default:         return true;
      }
    });
  }, localFilteredTasks);

  const groupedTasks   = useTaskGroupBy(colFilteredTasks, groupBy);
  const visibleColDefs = visibleColumns.map(id => ALL_COLUMNS.find(c => c.id === id)!).filter(Boolean);
  const hiddenColDefs  = ALL_COLUMNS.filter(c => !visibleColumns.includes(c.id));
  const gridTemplate   = `20px 28px ${visibleColDefs.map(c => c.width).join(" ")} 52px`;

  // ── Close menus on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (groupMenuRef.current   && !groupMenuRef.current.contains(e.target as Node))   setShowGroupMenu(false);
      if (filterMenuRef.current  && !filterMenuRef.current.contains(e.target as Node))  setShowFilterMenu(false);
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) setShowOptionsMenu(false);
      if (addColMenuRef.current     && !addColMenuRef.current.contains(e.target as Node))     setShowAddColMenu(false);
      if (inlineTypeMenuRef.current && !inlineTypeMenuRef.current.contains(e.target as Node)) setShowInlineTypeMenu(false);
      // Close column menus and bulk menus on outside click
      setColMenuId(null);
      setColFilterId(null);
      setShowBulkStatusMenu(false);
      setShowBulkPriorityMenu(false);
      setShowBulkAssigneeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Column management ──────────────────────────────────────────────────────
  const addColumn    = (colId: string) => { setVisibleColumns(p => [...p, colId]); setShowAddColMenu(false); };
  const removeColumn = (colId: string) => { setVisibleColumns(p => p.filter(id => id !== colId)); setColMenuId(null); };
  const moveColumn   = (colId: string, dir: "first" | "left" | "right" | "last") => {
    setVisibleColumns(prev => {
      const arr = [...prev]; const idx = arr.indexOf(colId); if (idx < 0) return prev;
      arr.splice(idx, 1);
      if      (dir === "first") arr.unshift(colId);
      else if (dir === "last")  arr.push(colId);
      else if (dir === "left")  arr.splice(Math.max(0, idx - 1), 0, colId);
      else                      arr.splice(Math.min(arr.length, idx + 1), 0, colId);
      return arr;
    });
    setColMenuId(null);
  };

  // ── Column filters ─────────────────────────────────────────────────────────
  const toggleColFilter = (colId: string, value: string) => {
    setColumnFilters(prev => { const cur = new Set(prev[colId] || []); cur.has(value) ? cur.delete(value) : cur.add(value); return { ...prev, [colId]: cur }; });
  };
  const clearColFilter  = (colId: string) => setColumnFilters(prev => ({ ...prev, [colId]: new Set() }));

  const getColFilterOpts = (colId: string) => {
    switch (colId) {
      case "status":   return STATUS_OPTIONS.map(o => ({ value: o.value, label: statusConfig[o.value].label, color: statusConfig[o.value].color }));
      case "priority": return (["urgent","high","normal","low"] as const).map(p => ({ value: p, label: priorityConfig[p].label, color: priorityConfig[p].color }));
      case "assignee": return [{ value: "unassigned", label: "Unassigned", color: "#94a3b8" }, ...teamMembers.map(m => ({ value: m.id, label: m.name, color: m.color }))];
      case "epic":     return [{ value: "__none__", label: "No Epic", color: "#94a3b8" }, ...projectEpics.map(e => ({ value: e.id, label: e.title, color: e.color }))];
      case "type":     return (["task","story","bug"] as const).map(t => ({ value: t, label: taskTypeConfig[t].label, color: taskTypeConfig[t].color }));
      case "sprint":   return [{ value: "__backlog__", label: "Backlog", color: "#94a3b8" }, ...sprints.map(s => ({ value: s.id, label: s.name, color: "#0891b2" }))];
      default:         return [];
    }
  };

  const clearAllFilters = () => { clearFilters(); setFilterTypes(new Set()); setFilterStatuses(new Set()); setFilterEpics(new Set()); setColumnFilters({}); };

  // ── Inline create ──────────────────────────────────────────────────────────
  const openInlineCreate = (groupKey: string) => {
    setInlineCreateGroup(groupKey);
    setInlineTitle("");
    setInlineType("task");
    setShowInlineTypeMenu(false);
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  };

  const submitInlineCreate = () => {
    const title = inlineTitle.trim();
    if (!title) { setInlineCreateGroup(null); return; }

    const statusFromGroup = (["todo","in_progress","in_review","done"] as const).find(s => s === inlineCreateGroup);

    const newTask: Task = {
      id: `t${Date.now()}`,
      title,
      type: inlineType,
      status: statusFromGroup ?? "todo",
      priority: "normal",
      tags: [],
      createdAt: new Date().toISOString(),
      projectId: selectedProject || "p1",
    };
    onSaveTask(newTask);
    setInlineTitle("");
    setInlineType("task");
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  };

  const cancelInlineCreate = () => { setInlineCreateGroup(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypeMenu(false); };

  // ── Subtask helpers ────────────────────────────────────────────────────────
  const toggleExpand = (taskId: string) => setExpandedTasks(p => { const n = new Set(p); n.has(taskId) ? n.delete(taskId) : n.add(taskId); return n; });

  const openSubtaskCreate = (parentId: string) => {
    setSubtaskParentId(parentId);
    setSubtaskTitle("");
    if (!expandedTasks.has(parentId)) setExpandedTasks(p => new Set([...p, parentId]));
    setTimeout(() => subtaskInputRef.current?.focus(), 50);
  };

  const submitSubtaskCreate = () => {
    const title = subtaskTitle.trim();
    if (!title || !subtaskParentId) { setSubtaskParentId(null); return; }
    const parent = tasks.find(t => t.id === subtaskParentId);
    const newSubtask: Task = {
      id: `t${Date.now()}`,
      title,
      type: "task",
      status: "todo",
      priority: "normal",
      tags: [],
      createdAt: new Date().toISOString(),
      projectId: selectedProject || "p1",
      parentId: subtaskParentId,
      epicId: parent?.epicId,
      sprintId: parent?.sprintId,
    };
    onSaveTask(newSubtask);
    setSubtaskTitle("");
    setTimeout(() => subtaskInputRef.current?.focus(), 50);
  };

  const cancelSubtaskCreate = () => { setSubtaskParentId(null); setSubtaskTitle(""); };

  // ── Drag to reorder ────────────────────────────────────────────────────────
  const handleDrop = (targetTaskId: string) => {
    if (!dragTaskId || dragTaskId === targetTaskId) { setDragTaskId(null); setDragOverTaskId(null); return; }

    // Reorder within the visible (filtered+sorted) list
    const visibleIds = colFilteredTasks.map(t => t.id);
    const fromIdx = visibleIds.indexOf(dragTaskId);
    const toIdx   = visibleIds.indexOf(targetTaskId);
    if (fromIdx === -1 || toIdx === -1) { setDragTaskId(null); setDragOverTaskId(null); return; }

    const newVisibleIds = [...visibleIds];
    const [moved] = newVisibleIds.splice(fromIdx, 1);
    newVisibleIds.splice(toIdx, 0, moved);

    // Merge reordered visible tasks back into full array:
    // hidden tasks stay in their original slots; visible slots get filled
    // with the reordered visible list in order.
    const visibleSet = new Set(visibleIds);
    const taskMap    = new Map(tasks.map(t => [t.id, t]));
    let vPtr = 0;
    const mergedIds  = tasks.map(t => visibleSet.has(t.id) ? newVisibleIds[vPtr++] : t.id);
    const reordered  = mergedIds.map(id => taskMap.get(id)!);

    onReorderTasks(reordered);
    setDragTaskId(null);
    setDragOverTaskId(null);
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const hdrs = ["ID","Title","Type","Status","Priority","Assignee","Due Date","Start Date","Created","Epic","Tags","Story Points"];
    const rows  = colFilteredTasks.map(t => [t.id, t.title, t.type||"task", statusConfig[t.status].label, priorityConfig[t.priority].label, t.assignee?.name||"", t.dueDate||"", t.startDate||"", t.createdAt, epics.find(e=>e.id===t.epicId)?.title||"", t.tags.join(";"), t.storyPoints??""]);
    const csv   = [hdrs,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob  = new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8;"});
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a"); a.href=url; a.download=`tasks-${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    setShowOptionsMenu(false);
  };

  // ── Import CSV ─────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) { setImportError("Chỉ hỗ trợ file .csv"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed  = parseCSV(e.target?.result as string);
        if (parsed.headers.length < 1 || parsed.rows.length < 1) { setImportError("File CSV trống hoặc không hợp lệ"); return; }
        const preview = parsed.rows.slice(0,100).map(row=>csvRowToTask(parsed.headers,row,projectId)).filter(t=>t.title);
        if (preview.length === 0) { setImportError("Không tìm thấy cột 'Title' hoặc 'Name' trong file"); return; }
        setImportParsed(parsed); setImportPreview(preview); setImportError(null);
      } catch { setImportError("Không thể đọc file CSV"); }
    };
    reader.readAsText(file,"UTF-8");
  };
  const closeImport    = () => { setShowImportModal(false); setImportParsed(null); setImportPreview([]); setImportError(null); };
  const confirmImport  = () => {
    importPreview.forEach(partial => {
      if (!partial.title) return;
      const task: Task = { id: partial.id||`t${Date.now()}-${Math.random().toString(36).slice(2,5)}`, title: partial.title, description: partial.description||"", status: partial.status||"todo", priority: partial.priority||"normal", type: partial.type||"task", assignee: partial.assignee, dueDate: partial.dueDate||"", startDate: partial.startDate||"", tags: partial.tags||[], createdAt: partial.createdAt||new Date().toISOString().split("T")[0], projectId: partial.projectId||projectId, epicId: partial.epicId, storyPoints: partial.storyPoints, comments:[], activityLog:[], checklists:[], watchers:[], dependencies:[] };
      onSaveTask(task);
    });
    closeImport();
  };

  // ── Bulk change ────────────────────────────────────────────────────────────
  const applyBulkStatus   = (s: Task["status"])     => { colFilteredTasks.filter(t=>selectedTasks.has(t.id)).forEach(t=>onSaveTask({...t,status:s}));   setShowBulkStatusMenu(false);   setSelectedTasks(new Set()); };
  const applyBulkPriority = (p: Task["priority"])   => { colFilteredTasks.filter(t=>selectedTasks.has(t.id)).forEach(t=>onSaveTask({...t,priority:p})); setShowBulkPriorityMenu(false); setSelectedTasks(new Set()); };
  const applyBulkAssignee = (a: TeamMember|undefined)=> { colFilteredTasks.filter(t=>selectedTasks.has(t.id)).forEach(t=>onSaveTask({...t,assignee:a})); setShowBulkAssigneeMenu(false); setSelectedTasks(new Set()); };

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggleGroup = (key: string) => setCollapsedGroups(p => ({...p, [key]: !p[key]}));
  const toggleTask  = (id: string)  => setSelectedTasks(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll   = () => { if (selectedTasks.size === colFilteredTasks.length) setSelectedTasks(new Set()); else setSelectedTasks(new Set(colFilteredTasks.map(t=>t.id))); };
  const toggleSort  = (field: string) => hookToggleSort(field);

  const selectedDetailTask = viewMode === "detail" && selectedDetailTaskId
    ? tasks.find(t => t.id === selectedDetailTaskId) || null
    : null;

  const detailIdx        = colFilteredTasks.findIndex(t => t.id === selectedDetailTaskId);
  const prevDetailTaskId = detailIdx > 0 ? colFilteredTasks[detailIdx - 1].id : null;
  const nextDetailTaskId = detailIdx >= 0 && detailIdx < colFilteredTasks.length - 1 ? colFilteredTasks[detailIdx + 1].id : null;

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-2.5 h-2.5 opacity-20" />;
    return sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5 text-cyan-500" /> : <ArrowDown className="w-2.5 h-2.5 text-cyan-500" />;
  };

  /* ── Mobile card list ─────────────────────────────────────────────────────── */
  if (window.innerWidth < 768) {
    const mobileStatusOrder = ["todo", "in_progress", "in_review", "done"] as const;

    const filtered = colFilteredTasks.filter(t => {
      if (mobileFilter !== "all" && t.status !== mobileFilter) return false;
      if (mobileSearch && !t.title.toLowerCase().includes(mobileSearch.toLowerCase())) return false;
      return true;
    });

    if (mobileDetailTask) {
      const task = tasks.find(t => t.id === mobileDetailTask.id) || mobileDetailTask;
      const taskIdx = colFilteredTasks.findIndex(t => t.id === task.id);
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <TaskDetailPanel
            task={task} allTasks={tasks}
            prevTaskId={taskIdx > 0 ? colFilteredTasks[taskIdx - 1].id : null}
            nextTaskId={taskIdx < colFilteredTasks.length - 1 ? colFilteredTasks[taskIdx + 1].id : null}
            onNavigate={(id) => { const t = tasks.find(x => x.id === id); if (t) setMobileDetailTask(t); }}
            onClose={() => setMobileDetailTask(null)}
            onOpenFull={() => onTaskClick(task)}
            onSave={(patch) => onSaveTask({ ...task, ...patch })}
            onDelete={() => { onDeleteTask(task.id); setMobileDetailTask(null); }}
            customStatusConfig={effectiveStatusConfig}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Search + filter bar */}
        <div className="shrink-0 px-3 py-2.5 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={mobileSearch} onChange={e => setMobileSearch(e.target.value)} placeholder="Tìm task..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-400" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {[{ key: "all", label: "Tất cả" }, ...mobileStatusOrder.map(s => ({ key: s, label: effectiveStatusConfig[s]?.label || s }))].map(opt => (
              <button key={opt.key} onClick={() => setMobileFilter(opt.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-[12px] transition-all ${mobileFilter === opt.key ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckSquare2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-[13px]">Không có task nào</p>
            </div>
          )}
          {filtered.map(task => {
            const st = effectiveStatusConfig[task.status] || statusConfig[task.status as keyof typeof statusConfig];
            const pr = priorityConfig[task.priority as keyof typeof priorityConfig];
            const assigneeMember = teamMembers.find(m => m.id === task.assignee);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
            return (
              <button key={task.id} onClick={() => setMobileDetailTask(task)}
                className="w-full text-left px-4 py-3.5 active:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <TaskTypeIcon type={task.type} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] text-gray-800 leading-snug ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {st && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]" style={{ backgroundColor: st.color + "22", color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      )}
                      {pr && (
                        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: pr.color }}>
                          <ArrowUp className="w-3 h-3" style={{ color: pr.color }} />
                          {pr.label}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  {assigneeMember && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-white shrink-0"
                      style={{ backgroundColor: assigneeMember.color }} title={assigneeMember.name}>
                      {assigneeMember.name.charAt(0)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* FAB - Add task */}
        <button
          onClick={() => onTaskClick({ id: "", title: "", status: "todo", priority: "normal", type: "task" } as Task)}
          className="absolute bottom-20 right-4 w-12 h-12 rounded-full bg-cyan-500 text-white shadow-lg flex items-center justify-center active:bg-cyan-600 transition-colors z-10">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* ── Left: list panel ─────────────────────────────────────────────────── */}
      <div className={`flex flex-col overflow-hidden transition-all ${viewMode === "detail" ? "w-[42%] min-w-[360px] border-r border-gray-200" : "flex-1"}`}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-200 z-20">
        <div className="flex items-center gap-2 px-5 py-2.5">

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search work..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" />
          </div>

          {/* Assignee avatars */}
          <div className="flex items-center gap-1">
            {teamMembers.slice(0,5).map(m => (
              <button key={m.id} onClick={() => setFilterAssignee(filterAssignee === m.id ? null : m.id)} title={m.name}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-all border-2 ${filterAssignee === m.id ? "border-cyan-500 scale-110 shadow-sm" : "border-transparent opacity-40 hover:opacity-80"}`}
                style={{ backgroundColor: m.color }}>
                {m.name.charAt(0)}
              </button>
            ))}
          </div>

          {/* Filter */}
          <div className="relative" ref={filterMenuRef}>
            <button onClick={() => { setShowFilterMenu(p=>!p); setShowGroupMenu(false); }}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border transition-all ${anyFilter||colHasFilters||showFilterMenu ? "border-cyan-400 bg-cyan-50 text-cyan-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              <Filter className="w-3 h-3" />
              Filter
              {(anyFilter||colHasFilters) && (
                <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] flex items-center justify-center leading-none">
                  {filterCount + Object.values(columnFilters).filter(s=>s.size>0).length}
                </span>
              )}
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl w-72 z-40 py-3">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-[12px] font-semibold text-gray-700">Bộ lọc</span>
                  {(anyFilter||colHasFilters) && <button onClick={clearAllFilters} className="text-[11px] text-cyan-600 hover:underline">Xóa tất cả</button>}
                </div>
                {/* Assignee */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Assignee</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teamMembers.map(m => (
                      <button key={m.id} onClick={() => setFilterAssignee(filterAssignee===m.id ? null : m.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border transition-all ${filterAssignee===m.id ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{backgroundColor:m.color}}>{m.name.charAt(0)}</span>
                        {m.name.split(" ").pop()}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Type */}
                <div className="px-4 pt-2 pb-2 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Loại</p>
                  <div className="flex gap-1.5">
                    {(["task","story","bug"] as const).map(t => { const cfg=taskTypeConfig[t]; return (
                      <button key={t} onClick={() => setFilterTypes(p=>toggleSet(p,t))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${filterTypes.has(t) ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                        <TaskTypeIcon type={t} />{cfg.label}
                      </button>
                    );})}
                  </div>
                </div>
                {/* Priority */}
                <div className="px-4 pt-2 pb-2 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["urgent","high","normal","low"] as const).map(p => { const cfg=priorityConfig[p]; return (
                      <button key={p} onClick={() => setFilterPriority(filterPriority===p ? null : p)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${filterPriority===p ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:cfg.color}} />{cfg.label}
                      </button>
                    );})}
                  </div>
                </div>
                {/* Status */}
                <div className="px-4 pt-2 pb-2 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setFilterStatuses(p=>toggleSet(p,opt.value))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${filterStatuses.has(opt.value) ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                        <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor:statusConfig[opt.value].color}} />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Epic */}
                {projectEpics.length > 0 && (
                  <div className="px-4 pt-2 pb-1 border-t border-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Epic</p>
                    <div className="flex flex-wrap gap-1.5">
                      {projectEpics.map(epic => (
                        <button key={epic.id} onClick={() => setFilterEpics(p=>toggleSet(p,epic.id))}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all ${filterEpics.has(epic.id) ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{backgroundColor:epic.color}} />
                          <span className="max-w-[110px] truncate">{epic.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group */}
          <div className="relative" ref={groupMenuRef}>
            <button onClick={() => setShowGroupMenu(p=>!p)}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border transition-all ${groupBy!=="none"||showGroupMenu ? "border-cyan-400 bg-cyan-50 text-cyan-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              <Users className="w-3 h-3" />
              {groupBy==="none" ? "Group" : `Group: ${groupBy.charAt(0).toUpperCase()+groupBy.slice(1)}`}
            </button>
            {showGroupMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-30 w-[150px]">
                {([["none","None"],["status","Status"],["priority","Priority"],["assignee","Assignee"],["project","Project"],["epic","Epic"]] as [GroupBy,string][]).map(([v,l]) => (
                  <button key={v} onClick={() => { setGroupBy(v); setShowGroupMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 ${groupBy===v ? "text-cyan-600 font-medium bg-cyan-50/50" : "text-gray-600"}`}>{l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Options ... */}
          <div className="relative ml-auto" ref={optionsMenuRef}>
            <button onClick={() => setShowOptionsMenu(p=>!p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${showOptionsMenu ? "border-cyan-400 bg-cyan-50 text-cyan-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-40 w-56 py-1.5">
                <button onClick={exportCSV} className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                  <Download className="w-3.5 h-3.5 text-gray-400" /> Export as CSV
                </button>
                <button onClick={() => { setShowImportModal(true); setShowOptionsMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                  <Upload className="w-3.5 h-3.5 text-gray-400" /> Import from CSV
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={() => { toggleAll(); setShowOptionsMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                  <CheckSquare className="w-3.5 h-3.5 text-gray-400" /> Select all items
                </button>
              </div>
            )}
          </div>

          {/* View mode toggles */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} title="Chế độ danh sách"
              className={`w-8 h-8 flex items-center justify-center transition-all ${viewMode === "list" ? "bg-cyan-50 text-cyan-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
              <Square className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <button onClick={() => setViewMode("detail")} title="Chế độ chi tiết"
              className={`w-8 h-8 flex items-center justify-center transition-all ${viewMode === "detail" ? "bg-cyan-50 text-cyan-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {anyFilter && (
            <button onClick={clearAllFilters} className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-all ml-2">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {anyFilter && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-2">
            {filterAssignee && (() => { const m = teamMembers.find(x=>x.id===filterAssignee); return m ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-700">
                <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{backgroundColor:m.color}}>{m.name.charAt(0)}</span>
                {m.name.split(" ").pop()}<button onClick={()=>setFilterAssignee(null)}><X className="w-2.5 h-2.5"/></button>
              </span>) : null; })()}
            {[...filterTypes].map(t => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-700">
                {taskTypeConfig[t as Task["type"]]?.label ?? t}<button onClick={()=>setFilterTypes(p=>toggleSet(p,t))}><X className="w-2.5 h-2.5"/></button>
              </span>
            ))}
            {filterPriority && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-700">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor:priorityConfig[filterPriority as Task["priority"]].color}} />
                {priorityConfig[filterPriority as Task["priority"]].label}<button onClick={()=>setFilterPriority(null)}><X className="w-2.5 h-2.5"/></button>
              </span>
            )}
            {[...filterStatuses].map(s => (
              <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-700">
                {STATUS_OPTIONS.find(o=>o.value===s)?.label}<button onClick={()=>setFilterStatuses(p=>toggleSet(p,s))}><X className="w-2.5 h-2.5"/></button>
              </span>
            ))}
            {[...filterEpics].map(id => { const epic=epics.find(e=>e.id===id); return epic ? (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px]" style={{backgroundColor:epic.color+"18",borderColor:epic.color+"50",color:epic.color}}>
                <span className="w-2 h-2 rounded-sm shrink-0" style={{backgroundColor:epic.color}} />{epic.title}
                <button onClick={()=>setFilterEpics(p=>toggleSet(p,id))}><X className="w-2.5 h-2.5"/></button>
              </span>) : null; })}
          </div>
        )}

        {/* Bulk action bar */}
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 bg-cyan-50 border-t border-cyan-100">
            <CheckSquare className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="text-[12px] text-cyan-700 font-medium shrink-0">{selectedTasks.size} đã chọn</span>
            <div className="w-px h-4 bg-cyan-200 mx-1" />
            {/* Bulk status */}
            <div className="relative">
              <button onClick={()=>{setShowBulkStatusMenu(p=>!p);setShowBulkPriorityMenu(false);setShowBulkAssigneeMenu(false);}}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-200 bg-white text-[11px] text-gray-600 hover:border-cyan-400">
                Đổi Status <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showBulkStatusMenu && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-40 py-1 z-30">
                  {STATUS_OPTIONS.map(opt => { const cfg=statusConfig[opt.value]; return (
                    <button key={opt.value} onClick={()=>applyBulkStatus(opt.value)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:cfg.color}}/>{cfg.label}
                    </button>
                  );})}
                </div>
              )}
            </div>
            {/* Bulk priority */}
            <div className="relative">
              <button onClick={()=>{setShowBulkPriorityMenu(p=>!p);setShowBulkStatusMenu(false);setShowBulkAssigneeMenu(false);}}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-200 bg-white text-[11px] text-gray-600 hover:border-cyan-400">
                Đổi Priority <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showBulkPriorityMenu && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-36 py-1 z-30">
                  {(["urgent","high","normal","low"] as const).map(p => { const cfg=priorityConfig[p]; return (
                    <button key={p} onClick={()=>applyBulkPriority(p)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:cfg.color}}/>{cfg.label}
                    </button>
                  );})}
                </div>
              )}
            </div>
            {/* Bulk assignee */}
            <div className="relative">
              <button onClick={()=>{setShowBulkAssigneeMenu(p=>!p);setShowBulkStatusMenu(false);setShowBulkPriorityMenu(false);}}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-200 bg-white text-[11px] text-gray-600 hover:border-cyan-400">
                Đổi Assignee <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showBulkAssigneeMenu && (
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-44 py-1 z-30">
                  <button onClick={()=>applyBulkAssignee(undefined)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 italic">Bỏ phân công</button>
                  {teamMembers.map(m => (
                    <button key={m.id} onClick={()=>applyBulkAssignee(m)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{backgroundColor:m.color}}>{m.name.charAt(0)}</div>{m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1" />
            <button onClick={()=>setSelectedTasks(new Set())} className="flex items-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-800 px-2 py-1 rounded-lg hover:bg-cyan-100 transition-all">
              <X className="w-3 h-3" /> Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {/* ── Table: column headers + rows scroll together horizontally ── */}
      <div className="list-scroll flex-1 overflow-auto">
        <div style={{ minWidth: 'max-content' }}>

        {/* ── Column headers (dynamic) ──────────────────────────────────────── */}
        {viewMode !== "detail" && <div className="sticky top-0 z-10 grid gap-0 border-b border-gray-100 bg-gray-50" style={{ gridTemplateColumns: gridTemplate }}>
          {/* Drag handle placeholder */}
          <div />
          {/* Checkbox */}
          <div className="flex items-center justify-center px-2 py-1.5">
            <button onClick={toggleAll}>
              {selectedTasks.size > 0 && selectedTasks.size === colFilteredTasks.length
                ? <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />
                : <Square className="w-3.5 h-3.5 text-gray-300" />}
            </button>
          </div>

          {/* Dynamic column headers */}
          {visibleColDefs.map((col, colIdx) => {
            const isFirst = colIdx === 0;
            const isLast  = colIdx === visibleColDefs.length - 1;
            const colFilter = columnFilters[col.id];
            const hasColFilter = colFilter && colFilter.size > 0;
            const filterOpts   = col.filterable ? getColFilterOpts(col.id) : [];
            return (
              <div key={col.id} className="relative group/col flex items-center px-2 py-1.5 border-l border-gray-100 min-w-0">
                {/* Sort / label */}
                <button
                  onClick={() => col.sortField && toggleSort(col.sortField)}
                  className={`flex items-center gap-1 text-[11px] font-medium truncate transition-colors flex-1 min-w-0 ${col.sortField ? "cursor-pointer" : "cursor-default"} ${sortField===col.sortField ? "text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <span className="truncate">{col.label}</span>
                  {col.sortField && <SortIcon field={col.sortField} />}
                </button>

                {/* Column context menu icon */}
                <button
                  onClick={e => { e.stopPropagation(); setColMenuId(colMenuId===col.id ? null : col.id); setColFilterId(null); }}
                  className="shrink-0 w-4 h-4 rounded flex items-center justify-center text-gray-400 opacity-0 group-hover/col:opacity-100 hover:bg-gray-200 transition-all ml-0.5">
                  <MoreHorizontal className="w-2.5 h-2.5" />
                </button>

                {/* Column filter dropdown */}
                {colFilterId === col.id && col.filterable && (
                  <div className="absolute left-0 top-full mt-0.5 bg-white rounded-xl border border-gray-200 shadow-xl z-40 w-48 py-1.5 max-h-60 overflow-y-auto"
                    onMouseDown={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-3 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Filter by {col.label}</span>
                      {hasColFilter && <button onClick={()=>clearColFilter(col.id)} className="text-[9px] text-cyan-600 hover:underline">Clear</button>}
                    </div>
                    {filterOpts.map(opt => {
                      const active = colFilter?.has(opt.value);
                      return (
                        <button key={opt.value} onClick={()=>toggleColFilter(col.id, opt.value)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${active ? "bg-cyan-50/50" : ""}`}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:opt.color}} />
                          <span className="flex-1 text-left text-gray-700 truncate">{opt.label}</span>
                          {active && <Check className="w-3 h-3 text-cyan-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Column context menu */}
                {colMenuId === col.id && (
                  <div className="absolute right-0 top-full mt-0.5 bg-white rounded-xl border border-gray-200 shadow-xl z-40 w-52 py-1.5"
                    onMouseDown={e => e.stopPropagation()}>
                    <p className="px-3 pt-1 pb-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{col.label}</p>
                    {col.sortField && (
                      <>
                        <button onClick={()=>{ setSortDirect(col.sortField!, "asc"); setColMenuId(null); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${sortField===col.sortField&&sortDir==="asc"?"text-cyan-600 font-medium":"text-gray-700"}`}>
                          <ArrowUp className="w-3 h-3 text-gray-400" /> Sort A → Z
                        </button>
                        <button onClick={()=>{ setSortDirect(col.sortField!, "desc"); setColMenuId(null); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${sortField===col.sortField&&sortDir==="desc"?"text-cyan-600 font-medium":"text-gray-700"}`}>
                          <ArrowDown className="w-3 h-3 text-gray-400" /> Sort Z → A
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                      </>
                    )}
                    <button onClick={()=>moveColumn(col.id,"first")} disabled={isFirst} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${isFirst ? "text-gray-300" : "text-gray-700"}`}>
                      Move column to first position
                    </button>
                    <button onClick={()=>moveColumn(col.id,"left")} disabled={isFirst} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${isFirst ? "text-gray-300" : "text-gray-700"}`}>
                      Move column to left
                    </button>
                    <button onClick={()=>moveColumn(col.id,"right")} disabled={isLast} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${isLast ? "text-gray-300" : "text-gray-700"}`}>
                      Move column to right
                    </button>
                    <button onClick={()=>moveColumn(col.id,"last")} disabled={isLast} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${isLast ? "text-gray-300" : "text-gray-700"}`}>
                      Move column to last position
                    </button>
                    {!col.fixed && (
                      <>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={()=>removeColumn(col.id)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50">
                          <EyeOff className="w-3 h-3" /> Remove column
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* "+" add column button */}
          <div className="relative flex items-center justify-center border-l border-gray-100" ref={addColMenuRef}>
            <button onClick={()=>setShowAddColMenu(p=>!p)}
              className={`w-5 h-5 rounded flex items-center justify-center transition-all ${showAddColMenu ? "bg-cyan-100 text-cyan-600" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`}>
              <Plus className="w-3 h-3" />
            </button>
            {showAddColMenu && (
              <div className="absolute right-0 top-full mt-0.5 bg-white rounded-xl border border-gray-200 shadow-xl z-40 w-48 py-1.5">
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Add column</p>
                {hiddenColDefs.length === 0
                  ? <p className="px-3 py-2 text-[11px] text-gray-400 italic">All columns visible</p>
                  : hiddenColDefs.map(col => (
                    <button key={col.id} onClick={()=>addColumn(col.id)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">
                      <Plus className="w-3 h-3 text-gray-400" />{col.label}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>}

      {/* ── Rows ─────────────────────────────────────────────────────────────── */}
      <div>
        {viewMode === "detail" ? (
          /* ── Compact list for detail mode ── */
          groupedTasks.map(group => {
            const isCollapsed = collapsedGroups[group.key];
            return (
              <div key={group.key}>
                {groupBy !== "none" && (
                  <button onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 border-b border-gray-100 bg-white transition-all sticky top-0 z-10">
                    <span className="text-gray-300">{isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                    <span className="text-[12px] font-semibold text-gray-700">{group.label}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{group.tasks.length}</span>
                  </button>
                )}
                {!isCollapsed && group.tasks.map(task => (
                  <button key={task.id}
                    onClick={() => setSelectedDetailTaskId(task.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-all text-left group/cr ${selectedDetailTaskId === task.id ? "bg-blue-50 border-l-[3px] border-l-blue-500 pl-[13px]" : "border-l-[3px] border-l-transparent"}`}>
                    <TaskTypeIcon type={task.type} />
                    <span className={`flex-1 text-[13px] truncate ${selectedDetailTaskId === task.id ? "text-blue-700 font-medium" : "text-gray-700"}`}>{task.title}</span>
                    {task.assignee && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0 opacity-0 group-hover/cr:opacity-100" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</span>
                    )}
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusConfig[task.status].color }} />
                  </button>
                ))}
              </div>
            );
          })
        ) : (
        groupedTasks.map(group => {
          const isCollapsed = collapsedGroups[group.key];
          return (
            <div key={group.key}>
              {groupBy !== "none" && (
                <button onClick={()=>toggleGroup(group.key)}
                  className="w-full flex items-center gap-2.5 px-5 py-2 hover:bg-gray-50 border-b border-gray-100 bg-white transition-all sticky top-0 z-10">
                  <span className="text-gray-300">{isCollapsed ? <ChevronRight className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}</span>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:group.color}} />
                  <span className="text-[12px] font-semibold text-gray-700">{group.label}</span>
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{group.tasks.length}</span>
                </button>
              )}
              {!isCollapsed && group.tasks.map(task => {
                const subtasks = getSubtasks(task.id);
                const isExpanded = expandedTasks.has(task.id);
                const showSubtasks = isExpanded || subtaskParentId === task.id;
                return (
                  <div key={task.id}>
                    <TaskRow
                      task={task}
                      visibleColDefs={visibleColDefs}
                      gridTemplate={gridTemplate}
                      onClick={viewMode==="detail" ? ()=>setSelectedDetailTaskId(task.id) : ()=>onTaskClick(task)}
                      selected={selectedTasks.has(task.id)}
                      onToggleSelect={()=>toggleTask(task.id)}
                      statusMenuOpen={statusMenuTaskId===task.id}
                      onStatusMenuToggle={()=>setStatusMenuTaskId(p=>p===task.id ? null : task.id)}
                      onStatusMenuClose={()=>setStatusMenuTaskId(null)}
                      onStatusChange={s=>{onSaveTask({...task,status:s});setStatusMenuTaskId(null);}}
                      rowMenuOpen={rowMenuTaskId===task.id}
                      onRowMenuToggle={()=>setRowMenuTaskId(p=>p===task.id ? null : task.id)}
                      onRowMenuClose={()=>setRowMenuTaskId(null)}
                      subtaskCount={subtasks.length}
                      isExpanded={isExpanded}
                      onToggleExpand={()=>toggleExpand(task.id)}
                      onAddSubtask={()=>openSubtaskCreate(task.id)}
                      isDragging={dragTaskId===task.id}
                      isDragOver={dragOverTaskId===task.id}
                      onDragStart={sortField==="none" ? ()=>setDragTaskId(task.id) : undefined}
                      onDragOver={sortField==="none" ? ()=>setDragOverTaskId(task.id) : undefined}
                      onDragEnd={sortField==="none" ? ()=>{setDragTaskId(null);setDragOverTaskId(null);} : undefined}
                      onDrop={sortField==="none" ? ()=>handleDrop(task.id) : undefined}
                      onDeleteTask={()=>onDeleteTask(task.id)}
                      onCloneTask={()=>{const now=new Date().toISOString();onSaveTask({...task,id:`t${Date.now()}`,title:`${task.title} (copy)`,createdAt:now,updatedAt:now,parentId:undefined,startDate:undefined,dueDate:undefined,comments:[],activityLog:[]});}}
                    />
                    {/* Subtasks immediately below parent */}
                    {showSubtasks && (
                      <div className="border-b border-gray-100/60">
                        {subtasks.map(sub => (
                          <div key={sub.id} className="flex items-stretch">
                            <div className="w-10 shrink-0 flex justify-center">
                              <div className="w-px bg-gray-200 mx-auto" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <TaskRow
                                task={sub}
                                visibleColDefs={visibleColDefs}
                                gridTemplate={gridTemplate}
                                onClick={viewMode==="detail" ? ()=>setSelectedDetailTaskId(sub.id) : ()=>onTaskClick(sub)}
                                selected={selectedTasks.has(sub.id)}
                                onToggleSelect={()=>toggleTask(sub.id)}
                                statusMenuOpen={statusMenuTaskId===sub.id}
                                onStatusMenuToggle={()=>setStatusMenuTaskId(p=>p===sub.id ? null : sub.id)}
                                onStatusMenuClose={()=>setStatusMenuTaskId(null)}
                                onStatusChange={s=>{onSaveTask({...sub,status:s});setStatusMenuTaskId(null);}}
                                rowMenuOpen={rowMenuTaskId===sub.id}
                                onRowMenuToggle={()=>setRowMenuTaskId(p=>p===sub.id ? null : sub.id)}
                                onRowMenuClose={()=>setRowMenuTaskId(null)}
                                isSubtask
                                onDeleteTask={()=>onDeleteTask(sub.id)}
                                onCloneTask={()=>{const now=new Date().toISOString();onSaveTask({...sub,id:`t${Date.now()}`,title:`${sub.title} (copy)`,createdAt:now,updatedAt:now,parentId:undefined,startDate:undefined,dueDate:undefined,comments:[],activityLog:[]});}}
                              />
                            </div>
                          </div>
                        ))}
                        {/* Inline add subtask */}
                        {subtaskParentId === task.id ? (
                          <div className="flex items-center">
                            <div className="w-10 shrink-0 flex justify-center">
                              <div className="w-px bg-gray-200 mx-auto" />
                            </div>
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-cyan-50/30">
                              <div className="w-[13px] h-[13px] rounded-full border-2 border-gray-300 shrink-0" />
                              <input
                                ref={subtaskInputRef}
                                value={subtaskTitle}
                                onChange={e => setSubtaskTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") submitSubtaskCreate(); if (e.key === "Escape") cancelSubtaskCreate(); }}
                                placeholder="Subtask title..."
                                className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                              />
                              <button onClick={submitSubtaskCreate}
                                disabled={!subtaskTitle.trim()}
                                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                Create
                              </button>
                              <button onClick={cancelSubtaskCreate} className="text-gray-400 hover:text-gray-600 shrink-0">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => openSubtaskCreate(task.id)}
                            className="flex items-center gap-1 pl-12 pr-3 py-1.5 text-[11px] text-gray-400 hover:text-cyan-600 transition-colors">
                            <Plus className="w-3 h-3" /> Add subtask
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {!isCollapsed && group.tasks.length===0 && groupBy!=="none" && inlineCreateGroup !== group.key && (
                <div className="px-5 py-5 text-center text-[12px] text-gray-300 border-b border-gray-50">No tasks</div>
              )}

              {/* Inline create row */}
              {!isCollapsed && inlineCreateGroup === group.key && (
                <div className="grid gap-0 border-b border-cyan-100 bg-cyan-50/30 items-center min-h-[40px]"
                  style={{ gridTemplateColumns: gridTemplate }}>
                  <div />
                  <div className="col-span-full flex items-center gap-2 px-3 py-2" style={{ gridColumn: `2 / span ${visibleColDefs.length + 1}` }}>
                    {/* Type selector */}
                    <div className="relative shrink-0" ref={inlineTypeMenuRef}>
                      <button onClick={() => setShowInlineTypeMenu(p => !p)}
                        className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/70 transition-colors text-[13px]"
                        title="Chọn loại">
                        <TaskTypeIcon type={inlineType} />
                        <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                      </button>
                      {showInlineTypeMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 w-36">
                          {(["task","story","bug","epic"] as Task["type"][]).map(t => {
                            const cfg = taskTypeConfig[t as keyof typeof taskTypeConfig];
                            if (!cfg) return null;
                            return (
                              <button key={t} onClick={() => { setInlineType(t); setShowInlineTypeMenu(false); setTimeout(() => inlineInputRef.current?.focus(), 30); }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${inlineType === t ? "bg-cyan-50/50 text-cyan-700 font-medium" : "text-gray-700"}`}>
                                <TaskTypeIcon type={t} />{cfg.label}
                                {inlineType === t && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <input
                      ref={inlineInputRef}
                      value={inlineTitle}
                      onChange={e => setInlineTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") submitInlineCreate(); if (e.key === "Escape") cancelInlineCreate(); }}
                      placeholder="What needs to be done?"
                      className="flex-1 text-[13px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    />
                    <button onClick={submitInlineCreate}
                      disabled={!inlineTitle.trim()}
                      className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                      Create
                    </button>
                    <button onClick={cancelInlineCreate} className="text-gray-400 hover:text-gray-600 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* + Create trigger per group */}
              {!isCollapsed && inlineCreateGroup !== group.key && (
                <button onClick={() => openInlineCreate(group.key)}
                  className="w-full flex items-center gap-1.5 px-5 py-2 text-[12px] text-gray-400 hover:text-cyan-600 hover:bg-cyan-50/40 transition-all border-b border-gray-50">
                  <Plus className="w-3.5 h-3.5" /> Create
                </button>
              )}
            </div>
          );
        })
        )}
      </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-5 py-2.5 flex items-center gap-4 bg-white shrink-0">
        {inlineCreateGroup === "__footer__" ? (
          <div className="flex items-center gap-2 flex-1">
            {/* Type selector */}
            <div className="relative shrink-0" ref={inlineTypeMenuRef}>
              <button onClick={() => setShowInlineTypeMenu(p => !p)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors text-[13px]">
                <TaskTypeIcon type={inlineType} />
                <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
              </button>
              {showInlineTypeMenu && (
                <div className="absolute left-0 bottom-full mb-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 w-36">
                  {(["task","story","bug","epic"] as Task["type"][]).map(t => {
                    const cfg = taskTypeConfig[t as keyof typeof taskTypeConfig];
                    if (!cfg) return null;
                    return (
                      <button key={t} onClick={() => { setInlineType(t); setShowInlineTypeMenu(false); setTimeout(() => inlineInputRef.current?.focus(), 30); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-gray-50 ${inlineType === t ? "bg-cyan-50/50 text-cyan-700 font-medium" : "text-gray-700"}`}>
                        <TaskTypeIcon type={t} />{cfg.label}
                        {inlineType === t && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <input
              ref={inlineInputRef}
              value={inlineTitle}
              onChange={e => setInlineTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitInlineCreate(); if (e.key === "Escape") cancelInlineCreate(); }}
              placeholder="What needs to be done?"
              autoFocus
              className="flex-1 text-[13px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button onClick={submitInlineCreate}
              disabled={!inlineTitle.trim()}
              className="px-3 py-1 rounded-lg text-[11px] font-medium bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              Create
            </button>
            <button onClick={cancelInlineCreate} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => openInlineCreate(groupedTasks[0]?.key ?? "__footer__")}
            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-cyan-600 transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        )}
        <span className="text-[12px] text-gray-400 ml-auto">
          {(anyFilter||colHasFilters) ? `${colFilteredTasks.length} of ${tasks.length} items` : `${colFilteredTasks.length} items`}
        </span>
      </div>

      </div>{/* ── End left panel ── */}

      {/* ── Right: detail panel ─────────────────────────────────────────────── */}
      {viewMode === "detail" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDetailTask ? (
            <TaskDetailPanel
              task={selectedDetailTask}
              allTasks={tasks}
              onSave={onSaveTask}
              onDelete={onDeleteTask}
              onOpenFull={() => onTaskClick(selectedDetailTask)}
              onClose={() => setSelectedDetailTaskId(null)}
              prevTaskId={prevDetailTaskId}
              nextTaskId={nextDetailTaskId}
              onNavigate={setSelectedDetailTaskId}
              customStatusConfig={effectiveStatusConfig}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <PanelRight className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">Chọn một task để xem chi tiết</p>
                <p className="text-[11px] text-gray-300 mt-1">Click vào bất kỳ task nào trong danh sách</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Import Modal ──────────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeImport} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-500" />
                <span className="text-[14px] font-semibold text-gray-800">Import work items from CSV</span>
              </div>
              <button onClick={closeImport} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!importParsed && (
                <div
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${isDragOver ? "border-cyan-400 bg-cyan-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  onClick={()=>fileInputRef.current?.click()}
                  onDragOver={e=>{e.preventDefault();setIsDragOver(true);}}
                  onDragLeave={()=>setIsDragOver(false)}
                  onDrop={e=>{e.preventDefault();setIsDragOver(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}}>
                  <FileText className={`w-10 h-10 ${isDragOver?"text-cyan-400":"text-gray-300"}`}/>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-gray-600">Kéo thả file CSV vào đây</p>
                    <p className="text-[11px] text-gray-400 mt-1">hoặc click để chọn file</p>
                  </div>
                  <p className="text-[10px] text-gray-300">Hỗ trợ .csv · Tối đa 100 rows</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value="";}}/>
              {importError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0"/>
                  <span className="text-[12px] text-red-600">{importError}</span>
                </div>
              )}
              {!importParsed && !importError && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[11px] font-medium text-gray-600 mb-2">Định dạng CSV được hỗ trợ:</p>
                  <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                    Title, Status, Priority, Assignee, Due Date, Tags, Story Points<br/>
                    "Thiết kế UI", "In Progress", "High", "Nguyễn Minh", "2026-03-15", "design;frontend", 3
                  </p>
                  <button onClick={()=>{const csv=`"Title","Status","Priority","Assignee","Due Date","Tags","Story Points"\n"Tên task ví dụ","Todo","Normal","","","",""`;const blob=new Blob(["﻿"+csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="template.csv";a.click();URL.revokeObjectURL(url);}}
                    className="mt-2 text-[10px] text-cyan-600 hover:underline flex items-center gap-1">
                    <Download className="w-2.5 h-2.5"/> Tải file template
                  </button>
                </div>
              )}
              {importParsed && importPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-gray-700">Preview — {importPreview.length} tasks sẵn sàng import</p>
                    <button onClick={()=>{setImportParsed(null);setImportPreview([]);fileInputRef.current?.click();}} className="text-[11px] text-cyan-600 hover:underline">Chọn file khác</button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_100px_90px_120px] gap-0 bg-gray-50 border-b border-gray-200 px-3 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      <span>Title</span><span>Status</span><span>Priority</span><span>Assignee</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {importPreview.slice(0,10).map((t,i) => (
                        <div key={i} className="grid grid-cols-[1fr_100px_90px_120px] gap-0 px-3 py-2 text-[12px] items-center">
                          <span className="text-gray-800 truncate pr-2">{t.title}</span>
                          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:statusConfig[t.status||"todo"].color}}/><span className="text-gray-500 text-[11px]">{statusConfig[t.status||"todo"].label}</span></span>
                          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:priorityConfig[t.priority||"normal"].color}}/><span className="text-gray-500 text-[11px]">{priorityConfig[t.priority||"normal"].label}</span></span>
                          <span className="text-gray-500 text-[11px] truncate">{t.assignee?.name||"—"}</span>
                        </div>
                      ))}
                    </div>
                    {importPreview.length > 10 && <div className="px-3 py-2 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100">+{importPreview.length-10} tasks nữa</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[11px] text-gray-400">{importPreview.length>0 ? `${importPreview.length} tasks · Project: ${projects.find(p=>p.id===projectId)?.name||projectId}` : ""}</p>
              <div className="flex items-center gap-2">
                <button onClick={closeImport} className="text-[12px] text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all">Huỷ</button>
                <button onClick={confirmImport} disabled={importPreview.length===0}
                  className={`text-[12px] px-5 py-2 rounded-lg transition-all ${importPreview.length>0?"bg-cyan-500 text-white hover:bg-cyan-600":"bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                  Import {importPreview.length>0?`${importPreview.length} tasks`:""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Detail Panel ─────────────────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task;
  allTasks: Task[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenFull: () => void;
  onClose: () => void;
  prevTaskId: string | null;
  nextTaskId: string | null;
  onNavigate: (taskId: string) => void;
  customStatusConfig?: Record<string, { label: string; color: string }>;
}

function TaskDetailPanel({ task, allTasks, onSave, onDelete, onOpenFull, onClose, prevTaskId, nextTaskId, onNavigate, customStatusConfig }: TaskDetailPanelProps) {
  const effectiveStatusConfig: Record<string, { label: string; color: string }> = { ...statusConfig, ...customStatusConfig };
  const [formData, setFormData] = useState<Task>(task);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [activeTab, setActiveTab] = useState<"comments" | "checklists" | "worklog" | "activity">("comments");
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showStatusP, setShowStatusP] = useState(false);
  const [showPriorityP, setShowPriorityP] = useState(false);
  const [showAssigneeP, setShowAssigneeP] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showReporterPicker, setShowReporterPicker] = useState(false);
  const [showLinkedMenu, setShowLinkedMenu] = useState(false);
  const [linkedSearch, setLinkedSearch] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState<Record<string, string>>({});
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle2, setEditingChecklistTitle2] = useState("");
  const [editingCheckItemId, setEditingCheckItemId] = useState<string | null>(null);
  const [editingCheckItemText, setEditingCheckItemText] = useState("");
  const [showCheckItemAssignee, setShowCheckItemAssignee] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [newWorkLogDate, setNewWorkLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [newWorkLogTime, setNewWorkLogTime] = useState("");
  const [newWorkLogNote, setNewWorkLogNote] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    setFormData(task);
    setTitle(task.title);
    setDescription(task.description || "");
  }, [task.id]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const save = (updates: Partial<Task>) => {
    const next = { ...formData, ...updates };
    setFormData(next);
    onSave(next);
  };

  const fmtTime = (mins: number) => { const h = Math.floor(mins / 60); const m = mins % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; };
  const fmtTimer = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`; };

  const project = projects.find(p => p.id === formData.projectId);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = formData.dueDate && new Date(formData.dueDate) < today && formData.status !== "done";
  const daysUntilDue = formData.dueDate ? Math.ceil((new Date(formData.dueDate).getTime() - today.getTime()) / 86400000) : null;
  const totalCheckItems = (formData.checklists || []).reduce((a, cl) => a + cl.items.length, 0);
  const doneCheckItems = (formData.checklists || []).reduce((a, cl) => a + cl.items.filter(i => i.done).length, 0);
  const totalWorkLogTime = (formData.workLogs || []).reduce((s, l) => s + l.timeSpent, 0);
  const timePct = formData.timeEstimate ? Math.min(100, Math.round(((formData.timeSpent || 0) / formData.timeEstimate) * 100)) : 0;
  const stCfg = effectiveStatusConfig[formData.status] || effectiveStatusConfig.todo;
  const prCfg = priorityConfig[formData.priority];
  const commentReactionEmojis = ["👍", "❤️", "😂", "🎉", "👀", "🔥"];

  const filteredActivity = useMemo(() => {
    const log = formData.activityLog || [];
    if (activityFilter === "all") return log;
    return log.filter(e => {
      if (activityFilter === "status") return e.field === "trạng thái";
      if (activityFilter === "assignee") return e.field === "người phụ trách";
      if (activityFilter === "comment") return e.action?.includes("bình luận");
      if (activityFilter === "checklist") return e.action?.includes("checklist");
      return true;
    });
  }, [formData.activityLog, activityFilter]);

  const tabs = [
    { id: "comments" as const,   label: "Bình luận", icon: <MessageSquare className="w-3.5 h-3.5" />, count: formData.comments?.length },
    { id: "checklists" as const, label: "Checklist",  icon: <ListChecks className="w-3.5 h-3.5" />,   count: formData.checklists?.length },
    { id: "worklog" as const,    label: "Work log",   icon: <Clock className="w-3.5 h-3.5" />,         count: formData.workLogs?.length },
    { id: "activity" as const,   label: "Lịch sử",   icon: <Activity className="w-3.5 h-3.5" />,       count: formData.activityLog?.length },
  ];

  // ── Comment actions ──────────────────────────────────────────────────────────
  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: TaskComment = { id: `c${Date.now()}`, userId: "u1", content: newComment.trim(), timestamp: new Date().toISOString(), reactions: [] };
    const entry: ActivityEntry = { id: `act-${Date.now()}`, userId: "u1", action: "đã thêm bình luận", timestamp: new Date().toISOString() };
    const next = { ...formData, comments: [...(formData.comments || []), comment], activityLog: [...(formData.activityLog || []), entry] };
    setFormData(next); onSave(next); setNewComment("");
  };
  const deleteComment = (cId: string) => save({ comments: (formData.comments || []).filter(c => c.id !== cId) });
  const saveCommentEdit = () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    save({ comments: (formData.comments || []).map(c => c.id === editingCommentId ? { ...c, content: editingCommentText.trim() } : c) });
    setEditingCommentId(null);
  };
  const addReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const reply: TaskComment = { id: `c${Date.now()}`, userId: "u1", content: `↳ ${replyText.trim()}`, timestamp: new Date().toISOString(), reactions: [] };
    const comments = [...(formData.comments || [])];
    const idx = comments.findIndex(c => c.id === parentId);
    comments.splice(idx + 1, 0, reply);
    save({ comments }); setReplyingToCommentId(null); setReplyText("");
  };
  const toggleReaction = (commentId: string, emoji: string) => {
    save({ comments: (formData.comments || []).map(c => {
      if (c.id !== commentId) return c;
      const reactions = c.reactions || [];
      const ex = reactions.find(r => r.emoji === emoji);
      if (ex) {
        if (ex.userIds.includes("u1")) return { ...c, reactions: reactions.map(r => r.emoji === emoji ? { ...r, userIds: r.userIds.filter(u => u !== "u1") } : r).filter(r => r.userIds.length > 0) };
        return { ...c, reactions: reactions.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, "u1"] } : r) };
      }
      return { ...c, reactions: [...reactions, { emoji, userIds: ["u1"] }] };
    })});
  };

  // ── Checklist actions ────────────────────────────────────────────────────────
  const addChecklist = () => {
    if (!newChecklistTitle.trim()) return;
    save({ checklists: [...(formData.checklists || []), { id: `cl${Date.now()}`, title: newChecklistTitle.trim(), items: [] }] });
    setNewChecklistTitle("");
  };
  const deleteChecklist = (clId: string) => save({ checklists: (formData.checklists || []).filter(c => c.id !== clId) });
  const saveChecklistRename = () => {
    if (!editingChecklistId || !editingChecklistTitle2.trim()) return;
    save({ checklists: (formData.checklists || []).map(cl => cl.id === editingChecklistId ? { ...cl, title: editingChecklistTitle2.trim() } : cl) });
    setEditingChecklistId(null);
  };
  const addChecklistItem = (clId: string) => {
    const text = newChecklistItem[clId];
    if (!text?.trim()) return;
    save({ checklists: formData.checklists?.map(cl => cl.id === clId ? { ...cl, items: [...cl.items, { id: `cli${Date.now()}`, text: text.trim(), done: false }] } : cl) });
    setNewChecklistItem(prev => ({ ...prev, [clId]: "" }));
  };
  const toggleChecklistItem = (clId: string, itemId: string) => save({ checklists: formData.checklists?.map(cl => cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : cl) });
  const deleteChecklistItem = (clId: string, itemId: string) => save({ checklists: formData.checklists?.map(cl => cl.id === clId ? { ...cl, items: cl.items.filter(i => i.id !== itemId) } : cl) });
  const saveCheckItemEdit = (clId: string) => {
    if (!editingCheckItemId || !editingCheckItemText.trim()) return;
    save({ checklists: formData.checklists?.map(cl => cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === editingCheckItemId ? { ...i, text: editingCheckItemText.trim() } : i) } : cl) });
    setEditingCheckItemId(null);
  };
  const assignChecklistItem = (clId: string, itemId: string, userId: string | undefined) => {
    save({ checklists: formData.checklists?.map(cl => cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, assigneeId: userId } : i) } : cl) });
    setShowCheckItemAssignee(null);
  };

  // ── Work log actions ─────────────────────────────────────────────────────────
  const addWorkLog = () => {
    const mins = parseInt(newWorkLogTime);
    if (!mins || mins <= 0 || !newWorkLogDate) return;
    const log: WorkLog = { id: `wl${Date.now()}`, userId: "u1", date: newWorkLogDate, timeSpent: mins, note: newWorkLogNote.trim() || undefined };
    save({ workLogs: [...(formData.workLogs || []), log], timeSpent: (formData.timeSpent || 0) + mins });
    setNewWorkLogTime(""); setNewWorkLogNote("");
  };
  const deleteWorkLog = (id: string) => {
    const log = (formData.workLogs || []).find(l => l.id === id);
    save({ workLogs: (formData.workLogs || []).filter(l => l.id !== id), timeSpent: Math.max(0, (formData.timeSpent || 0) - (log?.timeSpent || 0)) });
  };

  // ── Linked tasks ─────────────────────────────────────────────────────────────
  const addDependency = (taskId: string) => {
    if ((formData.dependencies || []).includes(taskId)) return;
    save({ dependencies: [...(formData.dependencies || []), taskId] });
    setShowLinkedMenu(false); setLinkedSearch("");
  };
  const removeDependency = (taskId: string) => save({ dependencies: (formData.dependencies || []).filter(id => id !== taskId) });

  const saveTitle       = () => { if (title.trim() && title !== formData.title) save({ title: title.trim() }); };
  const saveDescription = () => { if (description !== (formData.description || "")) save({ description }); };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <TaskTypeIcon type={formData.type} />
        {project && <span className="text-[11px] text-gray-400 ml-1">{project.name}</span>}
        <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
        <span className="text-[11px] font-mono text-gray-500 flex-1">{formData.id}</span>
        <button onClick={() => prevTaskId && onNavigate(prevTaskId)} disabled={!prevTaskId} title="Task trước"
          className={`w-7 h-7 flex items-center justify-center rounded transition-all ${prevTaskId ? "hover:bg-gray-100 text-gray-500" : "text-gray-200 cursor-not-allowed"}`}>
          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
        </button>
        <button onClick={() => nextTaskId && onNavigate(nextTaskId)} disabled={!nextTaskId} title="Task tiếp"
          className={`w-7 h-7 flex items-center justify-center rounded transition-all ${nextTaskId ? "hover:bg-gray-100 text-gray-500" : "text-gray-200 cursor-not-allowed"}`}>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button onClick={onOpenFull} title="Mở toàn trang"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ── CENTER: main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Title + description */}
          <div className="px-6 pt-5 pb-3 shrink-0">
            <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="w-full text-[18px] font-bold text-gray-900 border-none outline-none bg-transparent placeholder-gray-300 leading-snug mb-2"
              placeholder="Tên task..." />
            <textarea value={description} onChange={e => setDescription(e.target.value)} onBlur={saveDescription}
              placeholder="Thêm mô tả..." rows={2}
              className="w-full text-[13px] text-gray-600 border-none outline-none bg-transparent resize-none placeholder-gray-300 leading-relaxed" />
          </div>

          {/* Linked tasks */}
          <div className="px-6 pb-3 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Link2 className="w-2.5 h-2.5" /> Liên kết công việc
              </span>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowLinkedMenu(o => !o)}
                  className="flex items-center gap-1 text-[9px] text-cyan-600 hover:text-cyan-700 px-1.5 py-0.5 rounded hover:bg-cyan-50 transition-all">
                  <Plus className="w-2.5 h-2.5" /> Thêm
                </button>
                {showLinkedMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-30 w-[240px]">
                    <div className="p-2 border-b border-gray-100">
                      <input type="text" placeholder="Tìm task..." value={linkedSearch} onChange={e => setLinkedSearch(e.target.value)}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" autoFocus />
                    </div>
                    <div className="max-h-[160px] overflow-y-auto py-1">
                      {allTasks.filter(t => t.id !== formData.id && !(formData.dependencies || []).includes(t.id) && (linkedSearch === "" || t.title.toLowerCase().includes(linkedSearch.toLowerCase()))).slice(0, 8).map(t => (
                        <button key={t.id} onClick={() => addDependency(t.id)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left">
                          <span className="text-[9px] text-gray-400 shrink-0">{t.id}</span>
                          <span className="text-[11px] text-gray-700 truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(formData.dependencies?.length || 0) === 0 ? (
              <p className="text-[10px] text-gray-300 italic">Chưa có công việc liên kết nào</p>
            ) : (
              <div className="space-y-1">
                {(formData.dependencies || []).map(depId => {
                  const dep = allTasks.find(t => t.id === depId);
                  return (
                    <div key={depId} className="group flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                      <ArrowUpRight className="w-3 h-3 text-gray-300 shrink-0" />
                      <span className="text-[9px] text-gray-400 shrink-0">{depId}</span>
                      <span className="text-[11px] text-gray-600 flex-1 truncate">{dep?.title || "Task đã bị xoá"}</span>
                      {dep && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: (effectiveStatusConfig[dep.status] || effectiveStatusConfig.todo).color }} />}
                      <button onClick={() => removeDependency(depId)} className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0.5 px-6 border-b border-gray-200 shrink-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] border-b-2 transition-all ${activeTab === tab.id ? "text-cyan-700 border-cyan-500" : "text-gray-500 border-transparent hover:text-gray-700"}`}>
                {tab.icon} {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-gray-100 text-gray-500 text-[9px] flex items-center justify-center">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── BÌNH LUẬN ── */}
            {activeTab === "comments" && (
              <div className="p-6">
                <div className="space-y-3 mb-5">
                  {(formData.comments || []).length === 0 && (
                    <div className="text-center py-6">
                      <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[12px] text-gray-400">Chưa có bình luận nào</p>
                    </div>
                  )}
                  {(formData.comments || []).map(comment => {
                    const user = teamMembers.find(m => m.id === comment.userId);
                    const isOwn = comment.userId === "u1";
                    const isEditing = editingCommentId === comment.id;
                    const isReplying = replyingToCommentId === comment.id;
                    return (
                      <div key={comment.id} className="group">
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: user?.color || "#94a3b8" }}>{user?.name.charAt(0) || "?"}</div>
                          <div className="flex-1 min-w-0">
                            <div className={`rounded-xl p-3 border ${isEditing ? "border-cyan-300 bg-white ring-2 ring-cyan-50" : "border-gray-100 bg-gray-50"}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] text-gray-800">{user?.name || "Unknown"}</span>
                                <span className="text-[9px] text-gray-300">{new Date(comment.timestamp).toLocaleString("vi-VN")}</span>
                                <div className="flex-1" />
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => { setReplyingToCommentId(isReplying ? null : comment.id); setReplyText(""); }}
                                    className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-gray-500">
                                    <Reply className="w-2.5 h-2.5" />
                                  </button>
                                  {isOwn && (<>
                                    <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                                      className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-cyan-500">
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                    <button onClick={() => deleteComment(comment.id)}
                                      className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400">
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </>)}
                                </div>
                              </div>
                              {isEditing ? (
                                <div>
                                  <textarea value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveCommentEdit(); } if (e.key === "Escape") setEditingCommentId(null); }}
                                    className="w-full text-[12px] text-gray-700 bg-transparent resize-none outline-none min-h-[36px]" autoFocus />
                                  <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100">
                                    <button onClick={saveCommentEdit} className="text-[9px] text-cyan-600 hover:text-cyan-700 px-2 py-0.5 rounded hover:bg-cyan-50">Lưu</button>
                                    <button onClick={() => setEditingCommentId(null)} className="text-[9px] text-gray-400 px-2 py-0.5 rounded hover:bg-gray-100">Huỷ</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[12px] text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {(comment.reactions || []).map(r => (
                                <button key={r.emoji} onClick={() => toggleReaction(comment.id, r.emoji)}
                                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${r.userIds.includes("u1") ? "bg-cyan-50 border border-cyan-200 text-cyan-700" : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                                  <span>{r.emoji}</span><span>{r.userIds.length}</span>
                                </button>
                              ))}
                              <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-all">
                                {commentReactionEmojis.slice(0, 4).map(emoji => (
                                  <button key={emoji} onClick={() => toggleReaction(comment.id, emoji)}
                                    className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-[11px] hover:scale-110 transition-all">{emoji}</button>
                                ))}
                              </div>
                            </div>
                            {isReplying && (
                              <div className="mt-2 flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[7px] text-white shrink-0 mt-1">N</div>
                                <div className="flex-1 bg-white rounded-lg border border-gray-200 focus-within:border-cyan-300">
                                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addReply(comment.id); } if (e.key === "Escape") setReplyingToCommentId(null); }}
                                    placeholder={`Trả lời ${user?.name || ""}...`}
                                    className="w-full text-[11px] text-gray-700 placeholder-gray-300 resize-none p-2 outline-none bg-transparent min-h-[28px]" autoFocus />
                                  <div className="flex items-center justify-end px-2 pb-1.5 gap-1">
                                    <button onClick={() => setReplyingToCommentId(null)} className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded hover:bg-gray-50">Huỷ</button>
                                    <button onClick={() => addReply(comment.id)} disabled={!replyText.trim()}
                                      className={`text-[9px] px-2 py-0.5 rounded transition-all ${replyText.trim() ? "text-cyan-600 hover:bg-cyan-50" : "text-gray-300"}`}>Gửi</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!newComment && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="text-[9px] text-gray-300">Gợi ý:</span>
                    {["LGTM! 👍", "Cần xem lại 🔍", "Đang xử lý ⚙️", "Đã xong ✅", "Bị block 🚫"].map(s => (
                      <button key={s} onClick={() => setNewComment(s)}
                        className="text-[9px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">{s}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-white shrink-0">N</div>
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-50">
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Viết bình luận... (⌘+Enter để gửi)"
                      onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); addComment(); } }}
                      className="w-full text-[12px] text-gray-700 placeholder-gray-300 resize-none p-3 outline-none bg-transparent min-h-[50px]" />
                    <div className="flex items-center justify-end px-3 pb-2 gap-2">
                      <span className="text-[8px] text-gray-300">⌘+Enter</span>
                      <button onClick={addComment} disabled={!newComment.trim()}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] transition-all ${newComment.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-100 text-gray-300"}`}>
                        <Send className="w-2.5 h-2.5" /> Gửi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CHECKLIST ── */}
            {activeTab === "checklists" && (
              <div className="p-6 space-y-4">
                {totalCheckItems > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>Tổng: {doneCheckItems}/{totalCheckItems}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${totalCheckItems > 0 ? (doneCheckItems / totalCheckItems) * 100 : 0}%` }} />
                    </div>
                    <span>{totalCheckItems > 0 ? Math.round((doneCheckItems / totalCheckItems) * 100) : 0}%</span>
                  </div>
                )}
                {(formData.checklists || []).length === 0 && (
                  <div className="text-center py-6">
                    <ListChecks className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-400">Chưa có checklist nào</p>
                  </div>
                )}
                {(formData.checklists || []).map(cl => {
                  const done = cl.items.filter(i => i.done).length;
                  const pct = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
                  return (
                    <div key={cl.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 group/cl">
                      <div className="flex items-center gap-2 mb-2">
                        <ListChecks className="w-4 h-4 text-cyan-500 shrink-0" />
                        {editingChecklistId === cl.id ? (
                          <input value={editingChecklistTitle2} onChange={e => setEditingChecklistTitle2(e.target.value)}
                            onBlur={saveChecklistRename}
                            onKeyDown={e => { if (e.key === "Enter") saveChecklistRename(); if (e.key === "Escape") setEditingChecklistId(null); }}
                            className="flex-1 text-[12px] text-gray-700 bg-white border border-cyan-300 rounded px-2 py-0.5 outline-none" autoFocus />
                        ) : (
                          <h4 className="text-[12px] text-gray-700 flex-1 cursor-text" onDoubleClick={() => { setEditingChecklistId(cl.id); setEditingChecklistTitle2(cl.title); }}>{cl.title}</h4>
                        )}
                        <span className="text-[9px] text-gray-400">{done}/{cl.items.length}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/cl:opacity-100 transition-all">
                          <button onClick={() => { setEditingChecklistId(cl.id); setEditingChecklistTitle2(cl.title); }}
                            className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-cyan-500"><Pencil className="w-2.5 h-2.5" /></button>
                          <button onClick={() => deleteChecklist(cl.id)}
                            className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400"><Trash2 className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                      {cl.items.length > 0 && (
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {cl.items.map(item => {
                          const assignee = item.assigneeId ? teamMembers.find(m => m.id === item.assigneeId) : null;
                          return (
                            <div key={item.id} className="group/item flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white transition-all">
                              <button onClick={() => toggleChecklistItem(cl.id, item.id)} className="shrink-0">
                                {item.done ? <CheckSquare className="w-3.5 h-3.5 text-cyan-500" /> : <Square className="w-3.5 h-3.5 text-gray-300" />}
                              </button>
                              {editingCheckItemId === item.id ? (
                                <input value={editingCheckItemText} onChange={e => setEditingCheckItemText(e.target.value)}
                                  onBlur={() => saveCheckItemEdit(cl.id)}
                                  onKeyDown={e => { if (e.key === "Enter") saveCheckItemEdit(cl.id); if (e.key === "Escape") setEditingCheckItemId(null); }}
                                  className="flex-1 text-[11px] text-gray-700 bg-white border border-cyan-300 rounded px-2 py-0.5 outline-none" autoFocus />
                              ) : (
                                <span onDoubleClick={() => { setEditingCheckItemId(item.id); setEditingCheckItemText(item.text); }}
                                  className={`text-[11px] flex-1 cursor-text ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.text}</span>
                              )}
                              <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowCheckItemAssignee(showCheckItemAssignee === item.id ? null : item.id)}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] shrink-0 transition-all ${assignee ? "" : "border border-dashed border-gray-300 text-gray-300 opacity-0 group-hover/item:opacity-100"}`}
                                  style={assignee ? { backgroundColor: assignee.color, color: "white" } : {}}>
                                  {assignee ? assignee.name.charAt(0) : <User className="w-2.5 h-2.5" />}
                                </button>
                                {showCheckItemAssignee === item.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20 w-[140px]">
                                    <button onClick={() => assignChecklistItem(cl.id, item.id, undefined)} className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-gray-400 hover:bg-gray-50">Chưa phân công</button>
                                    {teamMembers.map(m => (
                                      <button key={m.id} onClick={() => assignChecklistItem(cl.id, item.id, m.id)}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1 text-[10px] hover:bg-gray-50 ${item.assigneeId === m.id ? "bg-cyan-50/50" : ""}`}>
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                        <span className="text-gray-700">{m.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-0 opacity-0 group-hover/item:opacity-100 transition-all">
                                <button onClick={() => { setEditingCheckItemId(item.id); setEditingCheckItemText(item.text); }}
                                  className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-cyan-500"><Pencil className="w-2 h-2" /></button>
                                <button onClick={() => deleteChecklistItem(cl.id, item.id)}
                                  className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="text" placeholder="Thêm item..." value={newChecklistItem[cl.id] || ""}
                          onChange={e => setNewChecklistItem(prev => ({ ...prev, [cl.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && addChecklistItem(cl.id)}
                          className="flex-1 text-[10px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700 placeholder-gray-300" />
                        <button onClick={() => addChecklistItem(cl.id)} disabled={!newChecklistItem[cl.id]?.trim()}
                          className={`text-[9px] px-2 py-1 rounded-lg transition-all ${newChecklistItem[cl.id]?.trim() ? "text-cyan-600 hover:bg-cyan-50" : "text-gray-300"}`}>Thêm</button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Tên checklist mới..." value={newChecklistTitle}
                    onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addChecklist()}
                    className="flex-1 text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-400 text-gray-700 placeholder-gray-300" />
                  <button onClick={addChecklist} disabled={!newChecklistTitle.trim()}
                    className={`flex items-center gap-1 text-[10px] px-3 py-2 rounded-lg transition-all border ${newChecklistTitle.trim() ? "bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100" : "bg-gray-50 text-gray-300 border-gray-200"}`}>
                    <Plus className="w-3 h-3" /> Thêm Checklist
                  </button>
                </div>
              </div>
            )}

            {/* ── WORK LOG ── */}
            {activeTab === "worklog" && (
              <div className="p-6 space-y-4">
                {totalWorkLogTime > 0 && (
                  <div className="flex items-center gap-3 bg-cyan-50 rounded-xl px-4 py-3 border border-cyan-100">
                    <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                    <div>
                      <p className="text-[11px] text-cyan-700 font-medium">Tổng thời gian: {fmtTime(totalWorkLogTime)}</p>
                      {formData.timeEstimate ? <p className="text-[9px] text-cyan-500 mt-0.5">Ước lượng: {fmtTime(formData.timeEstimate)} · {Math.round((totalWorkLogTime / formData.timeEstimate) * 100)}%</p> : null}
                    </div>
                  </div>
                )}
                {(formData.workLogs || []).length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-400">Chưa có work log nào</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...(formData.workLogs || [])].sort((a, b) => b.date.localeCompare(a.date)).map(log => {
                      const user = teamMembers.find(m => m.id === log.userId);
                      return (
                        <div key={log.id} className="group flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: user?.color || "#94a3b8" }}>{user?.name.charAt(0) || "?"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-700 font-medium">{fmtTime(log.timeSpent)}</span>
                              <span className="text-[9px] text-gray-400">{user?.name}</span>
                              <span className="text-[9px] text-gray-400">{new Date(log.date).toLocaleDateString("vi-VN")}</span>
                            </div>
                            {log.note && <p className="text-[10px] text-gray-500 mt-0.5">{log.note}</p>}
                          </div>
                          <button onClick={() => deleteWorkLog(log.id)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <p className="text-[10px] text-gray-500 font-medium">Ghi thêm thời gian</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-400 mb-1 block">Ngày</label>
                      <input type="date" value={newWorkLogDate} onChange={e => setNewWorkLogDate(e.target.value)}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 mb-1 block">Thời gian (phút)</label>
                      <input type="number" min={1} placeholder="60" value={newWorkLogTime} onChange={e => setNewWorkLogTime(e.target.value)}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 mb-1 block">Ghi chú</label>
                    <input type="text" placeholder="Mô tả công việc đã làm..." value={newWorkLogNote} onChange={e => setNewWorkLogNote(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addWorkLog()}
                      className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" />
                  </div>
                  <button onClick={addWorkLog} disabled={!newWorkLogTime || parseInt(newWorkLogTime) <= 0}
                    className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg transition-all ${newWorkLogTime && parseInt(newWorkLogTime) > 0 ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                    <Plus className="w-3 h-3" /> Ghi nhận
                  </button>
                </div>
              </div>
            )}

            {/* ── LỊCH SỬ ── */}
            {activeTab === "activity" && (
              <div className="p-6">
                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                  <Filter className="w-3 h-3 text-gray-400" />
                  {[{ key: "all", label: "Tất cả" }, { key: "status", label: "Trạng thái" }, { key: "assignee", label: "Phân công" }, { key: "comment", label: "Bình luận" }, { key: "checklist", label: "Checklist" }].map(f => (
                    <button key={f.key} onClick={() => setActivityFilter(f.key)}
                      className={`px-2 py-0.5 rounded-md text-[9px] transition-all ${activityFilter === f.key ? "bg-cyan-50 text-cyan-600 border border-cyan-200" : "text-gray-400 hover:text-gray-600 border border-transparent hover:bg-gray-50"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {filteredActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-400">{activityFilter === "all" ? "Chưa có hoạt động nào" : "Không có hoạt động phù hợp bộ lọc"}</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {[...filteredActivity].reverse().map((entry, idx) => {
                      const user = teamMembers.find(m => m.id === entry.userId);
                      const isLast = idx === filteredActivity.length - 1;
                      return (
                        <div key={entry.id} className="flex items-start gap-3 relative">
                          {!isLast && <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-gray-100" />}
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0 relative z-10" style={{ backgroundColor: user?.color || "#94a3b8" }}>{user?.name.charAt(0) || "?"}</div>
                          <div className="flex-1 min-w-0 pb-4">
                            <p className="text-[11px] text-gray-600">
                              <span className="text-gray-800">{user?.name || "Unknown"}</span>{" "}{entry.action}
                              {entry.field && <span className="text-gray-800"> {entry.field}</span>}
                              {entry.oldValue && <span> từ <span className="line-through text-gray-400 bg-red-50 px-1 rounded">{entry.oldValue}</span></span>}
                              {entry.newValue && <span> thành <span className="text-cyan-600 bg-cyan-50 px-1 rounded">{entry.newValue}</span></span>}
                            </p>
                            <p className="text-[9px] text-gray-300 mt-0.5">{new Date(entry.timestamp).toLocaleString("vi-VN")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT: sidebar ── */}
        <div className="md:w-[220px] md:shrink-0 md:border-l border-t md:border-t-0 border-gray-200 overflow-y-auto bg-white">
          <div className="p-4 space-y-4">

            {/* Loại công việc */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Loại công việc</label>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowTypePicker(o => !o)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all hover:opacity-90"
                  style={{ backgroundColor: taskTypeConfig[formData.type || "task"].bg, borderColor: taskTypeConfig[formData.type || "task"].color + "50" }}>
                  <span className="text-[13px]">{taskTypeConfig[formData.type || "task"].icon}</span>
                  <span className="text-[11px] font-medium flex-1" style={{ color: taskTypeConfig[formData.type || "task"].color }}>{taskTypeConfig[formData.type || "task"].label}</span>
                  <ChevronDown className="w-3 h-3" style={{ color: taskTypeConfig[formData.type || "task"].color + "80" }} />
                </button>
                {showTypePicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                    {(["task", "story", "bug", "epic"] as const).map(t => {
                      const cfg = taskTypeConfig[t];
                      return (
                        <button key={t} onClick={() => { save({ type: t }); setShowTypePicker(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 ${formData.type === t ? "bg-gray-50" : ""}`}>
                          <span className="text-[13px]">{cfg.icon}</span>
                          <span className="text-[11px] text-gray-700 flex-1">{cfg.label}</span>
                          {formData.type === t && <Check className="w-3 h-3 text-cyan-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Trạng thái */}
            <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Trạng thái</label>
              <button onClick={() => { setShowStatusP(p => !p); setShowPriorityP(false); setShowAssigneeP(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stCfg.color }} />
                <span className="text-[11px] text-gray-700 flex-1">{stCfg.label}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showStatusP && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                  {Object.entries(effectiveStatusConfig).map(([s, v]) => (
                    <button key={s} onClick={() => { save({ status: s as Task["status"] }); setShowStatusP(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${formData.status === s ? "bg-cyan-50/50" : ""}`}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                      <span className="text-gray-700">{v.label}</span>
                      {formData.status === s && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Độ ưu tiên */}
            <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Độ ưu tiên</label>
              <button onClick={() => { setShowPriorityP(p => !p); setShowStatusP(false); setShowAssigneeP(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                <span className="text-[9px]" style={{ color: prCfg.color }}>{prCfg.icon}</span>
                <span className="text-[11px] text-gray-700 flex-1">{prCfg.label}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showPriorityP && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                  {(Object.keys(priorityConfig) as Task["priority"][]).map(p => (
                    <button key={p} onClick={() => { save({ priority: p }); setShowPriorityP(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${formData.priority === p ? "bg-cyan-50/50" : ""}`}>
                      <span className="text-[9px]" style={{ color: priorityConfig[p].color }}>{priorityConfig[p].icon}</span>
                      <span className="text-gray-700">{priorityConfig[p].label}</span>
                      {formData.priority === p && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Người phụ trách */}
            <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Người phụ trách</label>
              <button onClick={() => { setShowAssigneeP(p => !p); setShowStatusP(false); setShowPriorityP(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                {formData.assignee ? (
                  <><div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: formData.assignee.color }}>{formData.assignee.name.charAt(0)}</div>
                  <span className="text-[11px] text-gray-700 flex-1">{formData.assignee.name}</span></>
                ) : (
                  <><div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shrink-0"><User className="w-2.5 h-2.5" /></div>
                  <span className="text-[11px] text-gray-400 flex-1">Chưa phân công</span></>
                )}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showAssigneeP && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                  <button onClick={() => { save({ assignee: undefined }); setShowAssigneeP(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50">Chưa phân công</button>
                  {teamMembers.map(m => (
                    <button key={m.id} onClick={() => { save({ assignee: m }); setShowAssigneeP(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${formData.assignee?.id === m.id ? "bg-cyan-50/50" : ""}`}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                      <span className="text-gray-700 flex-1">{m.name}</span>
                      {formData.assignee?.id === m.id && <Check className="w-3 h-3 text-cyan-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Người báo cáo */}
            <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Người báo cáo</label>
              {(() => {
                const reporter = teamMembers.find(m => m.id === (formData.reporterId || "u1"));
                return (
                  <>
                    <button onClick={() => { setShowReporterPicker(o => !o); setShowStatusP(false); setShowPriorityP(false); setShowAssigneeP(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: reporter?.color || "#94a3b8" }}>{reporter?.name.charAt(0) || "?"}</div>
                      <span className="text-[11px] text-gray-700 flex-1">{reporter?.name || "Chưa xác định"}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                    {showReporterPicker && (
                      <div className="bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                        {teamMembers.map(m => (
                          <button key={m.id} onClick={() => { save({ reporterId: m.id }); setShowReporterPicker(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${(formData.reporterId || "u1") === m.id ? "bg-cyan-50/50" : ""}`}>
                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                            <span className="text-gray-700 flex-1">{m.name}</span>
                            {(formData.reporterId || "u1") === m.id && <Check className="w-3 h-3 text-cyan-500" />}
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
              <select value={formData.projectId} onChange={e => save({ projectId: e.target.value, epicId: undefined })}
                className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Epic */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Epic</label>
              {(() => {
                const projectEpics = epics.filter(e => e.projectId === formData.projectId);
                const selectedEpic = formData.epicId ? epics.find(e => e.id === formData.epicId) : null;
                return (
                  <div>
                    <select value={formData.epicId || ""} disabled={formData.type === "epic"}
                      onChange={e => save({ epicId: e.target.value || undefined })}
                      className={`w-full text-[11px] border rounded-lg px-3 py-2 outline-none ${formData.type === "epic" ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700 focus:border-cyan-400"}`}
                      style={formData.type !== "epic" && selectedEpic ? { borderColor: selectedEpic.color + "80", color: selectedEpic.color } : {}}>
                      <option value="">{formData.type === "epic" ? "Không áp dụng" : "Không có Epic"}</option>
                      {formData.type !== "epic" && projectEpics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
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
              const projectSprints = sprints.filter(s => s.status !== "completed");
              const selectedSprint = formData.sprintId ? sprints.find(s => s.id === formData.sprintId) : null;
              const sprintCfg = {
                active:   { label: "Đang chạy",     color: "#059669", bg: "#f0fdf4", dot: "bg-green-500 animate-pulse" },
                planning: { label: "Lên kế hoạch",  color: "#0891b2", bg: "#ecfeff", dot: "bg-cyan-400" },
              };
              return (
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Layers className="w-2.5 h-2.5" /> Sprint</label>
                  <div className="relative">
                    <select value={formData.sprintId || ""} onChange={e => save({ sprintId: e.target.value || undefined })}
                      className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400 appearance-none pr-7">
                      <option value="">Backlog</option>
                      {projectSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {selectedSprint && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border"
                      style={{ backgroundColor: sprintCfg[selectedSprint.status as keyof typeof sprintCfg]?.bg || "#f9fafb", borderColor: (sprintCfg[selectedSprint.status as keyof typeof sprintCfg]?.color || "#6b7280") + "30" }}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sprintCfg[selectedSprint.status as keyof typeof sprintCfg]?.dot || "bg-gray-400"}`} />
                      <span className="text-[9px] font-medium" style={{ color: sprintCfg[selectedSprint.status as keyof typeof sprintCfg]?.color || "#6b7280" }}>
                        {sprintCfg[selectedSprint.status as keyof typeof sprintCfg]?.label}
                      </span>
                      <span className="text-[9px] text-gray-400 ml-auto">{selectedSprint.startDate.slice(5)} → {selectedSprint.endDate.slice(5)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Story Points */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Zap className="w-2.5 h-2.5" /> Story Points</label>
              <div className="flex items-center gap-1 flex-wrap">
                {[1, 2, 3, 5, 8, 13].map(pt => {
                  const active = formData.storyPoints === pt;
                  return (
                    <button key={pt} onClick={() => save({ storyPoints: active ? undefined : pt })}
                      className="w-8 h-8 rounded-lg text-[11px] font-semibold border transition-all"
                      style={active ? { backgroundColor: "#0891b2", color: "white", borderColor: "#0891b2" } : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }}>
                      {pt}
                    </button>
                  );
                })}
                <input type="number" min={1} max={100} placeholder="?" value={formData.storyPoints && ![1,2,3,5,8,13].includes(formData.storyPoints) ? formData.storyPoints : ""}
                  onChange={e => { const v = parseInt(e.target.value); save({ storyPoints: v > 0 ? v : undefined }); }}
                  className="w-10 h-8 rounded-lg text-[11px] text-center border border-gray-200 bg-white text-gray-500 outline-none focus:border-cyan-400 [appearance:textfield]" />
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Ngày bắt đầu */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 uppercase tracking-wider">Ngày bắt đầu</label>
              <input type="date" value={formData.startDate || ""} onChange={e => save({ startDate: e.target.value })}
                className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400" />
            </div>

            {/* Hạn chót */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Hạn chót {isOverdue && <AlertTriangle className="w-2.5 h-2.5 text-red-500" />}
              </label>
              <input type="date" value={formData.dueDate || ""} onChange={e => save({ dueDate: e.target.value })}
                className={`w-full text-[11px] border rounded-lg px-3 py-2 bg-white outline-none focus:border-cyan-400 ${isOverdue ? "border-red-300 text-red-600" : "border-gray-200 text-gray-700"}`} />
              {daysUntilDue !== null && (
                <p className={`text-[9px] ${isOverdue ? "text-red-500" : daysUntilDue <= 2 ? "text-amber-500" : "text-gray-400"}`}>
                  {isOverdue ? `Quá hạn ${Math.abs(daysUntilDue)} ngày` : daysUntilDue === 0 ? "Hôm nay" : daysUntilDue === 1 ? "Ngày mai" : `Còn ${daysUntilDue} ngày`}
                </p>
              )}
            </div>

            {/* Labels */}
            {formData.tags.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Labels</label>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full font-medium text-white" style={{ backgroundColor: tagColors[tag] || "#94a3b8" }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-gray-100" />

            {/* Theo dõi thời gian */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Theo dõi thời gian</label>
                <button onClick={() => {
                  if (isTimerRunning) {
                    const addedMins = Math.round(timerSeconds / 60);
                    if (addedMins > 0) save({ timeSpent: (formData.timeSpent || 0) + addedMins });
                    setTimerSeconds(0);
                  }
                  setIsTimerRunning(!isTimerRunning);
                }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-all ${isTimerRunning ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200"}`}>
                  {isTimerRunning ? <><Pause className="w-2.5 h-2.5" /> Dừng</> : <><Play className="w-2.5 h-2.5" /> Bắt đầu</>}
                </button>
              </div>
              {isTimerRunning && <div className="text-[13px] font-mono text-cyan-600 text-center py-1">{fmtTimer(timerSeconds)}</div>}
              {formData.timeEstimate ? (
                <div>
                  <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                    <span>{fmtTime(formData.timeSpent || 0)}</span>
                    <span>{fmtTime(formData.timeEstimate)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${timePct}%`, backgroundColor: timePct > 100 ? "#ef4444" : "#0891b2" }} />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Xóa */}
            <div className="pt-2 border-t border-gray-100">
              <button onClick={() => { if (window.confirm(`Xóa task "${formData.title}"?`)) { onDelete(formData.id); onClose(); } }}
                className="text-[11px] text-red-400 hover:text-red-600 transition-colors">
                Xóa task này
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, visibleColDefs, gridTemplate, onClick, selected, onToggleSelect, statusMenuOpen, onStatusMenuToggle, onStatusMenuClose, onStatusChange, rowMenuOpen, onRowMenuToggle, onRowMenuClose, subtaskCount, isExpanded, onToggleExpand, onAddSubtask, isSubtask, isDragging, isDragOver, onDragStart, onDragOver, onDragEnd, onDrop, onDeleteTask, onCloneTask }: {
  task: Task;
  visibleColDefs: ColumnDef[];
  gridTemplate: string;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  statusMenuOpen: boolean;
  onStatusMenuToggle: () => void;
  onStatusMenuClose: () => void;
  onStatusChange: (s: Task["status"]) => void;
  rowMenuOpen: boolean;
  onRowMenuToggle: () => void;
  onRowMenuClose: () => void;
  subtaskCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onAddSubtask?: () => void;
  isSubtask?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
  onDeleteTask?: () => void;
  onCloneTask?: () => void;
}) {
  const menuRef    = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const typeCfg    = taskTypeConfig[task.type || "task"];
  const priorityCfg = priorityConfig[task.priority];
  const sc         = statusConfig[task.status];
  const epic       = task.epicId ? epics.find(e => e.id === task.epicId) : null;
  const sprint     = task.sprintId ? sprints.find(s => s.id === task.sprintId) : null;
  const project    = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const isOverdue  = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const fmtTime    = (mins?: number) => mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "—";

  useEffect(() => {
    if (!statusMenuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onStatusMenuClose(); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [statusMenuOpen, onStatusMenuClose]);

  useEffect(() => {
    if (!rowMenuOpen) return;
    const h = (e: MouseEvent) => { if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) onRowMenuClose(); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [rowMenuOpen, onRowMenuClose]);

  const renderCell = (col: ColumnDef) => {
    switch (col.id) {
      case "id":
        return <span className="text-[10px] text-gray-400 font-mono truncate cursor-pointer hover:text-cyan-600 transition-colors px-2" onClick={onClick}>{task.id}</span>;

      case "title":
        return (
          <div className="flex items-center gap-1.5 min-w-0 py-2 px-2">
            {/* Expand chevron — only when has subtasks */}
            {!isSubtask && (subtaskCount ?? 0) > 0 ? (
              <button
                onClick={e => { e.stopPropagation(); onToggleExpand?.(); }}
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors hover:bg-gray-100 text-gray-400"
                title="Toggle subtasks">
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <div className="shrink-0 w-4" />
            )}
            <div className="w-[15px] h-[15px] rounded-full border-2 shrink-0 flex items-center justify-center cursor-pointer" style={{borderColor:sc.color}} onClick={onClick}>
              {task.status==="done" && <Check className="w-2 h-2" style={{color:sc.color}}/>}
            </div>
            <TaskTypeIcon type={task.type} />
            <span className={`text-[13px] font-medium leading-snug truncate cursor-pointer ${isSubtask ? "text-[12px]" : ""} ${task.status==="done"?"text-gray-400 line-through decoration-gray-300":"text-gray-800"}`} onClick={onClick}>{task.title}</span>
            {!isSubtask && (subtaskCount ?? 0) > 0 && (
              <span className="shrink-0 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {subtaskCount}
              </span>
            )}
            {!isSubtask && epic && <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0" style={{backgroundColor:epic.color+"15",color:epic.color}}>{epic.title}</span>}
            {!isSubtask && task.tags.length>0 && (
              <div className="hidden xl:flex items-center gap-1 shrink-0">
                {task.tags.slice(0,2).map(tag=>{const tc=tagColors[tag]||{bg:"#f1f5f9",text:"#64748b"};return<span key={tag} className="px-1.5 py-0.5 rounded-md text-[10px]" style={{backgroundColor:tc.bg,color:tc.text}}>{tag}</span>;})}
                {task.tags.length>2 && <span className="text-[10px] text-gray-300">+{task.tags.length-2}</span>}
              </div>
            )}
          </div>
        );

      case "assignee":
        return (
          <div className="flex items-center gap-1.5 min-w-0 cursor-pointer px-2" onClick={onClick}>
            {task.assignee ? (<>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white shrink-0 font-medium" style={{backgroundColor:task.assignee.color}}>{task.assignee.name.charAt(0)}</div>
              <span className="text-[12px] text-gray-600 truncate">{task.assignee.name.split(" ").pop()}</span>
            </>) : <span className="text-[12px] text-gray-300 italic">Unassigned</span>}
          </div>
        );

      case "priority":
        return (
          <div className="flex items-center gap-1.5 cursor-pointer px-2" onClick={onClick}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:priorityCfg.color}}/>
            <span className="text-[12px] text-gray-600">{priorityCfg.label}</span>
          </div>
        );

      case "status":
        return (
          <div className="relative px-2" ref={menuRef}>
            <button onClick={e=>{e.stopPropagation();onStatusMenuToggle();}}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:opacity-80"
              style={{backgroundColor:sc.color+"18",color:sc.color}}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:sc.color}}/>
              {sc.label}<ChevronDown className="w-2.5 h-2.5 opacity-60"/>
            </button>
            {statusMenuOpen && (
              <div className="absolute left-2 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-40 py-1 z-30">
                {STATUS_OPTIONS.map(opt=>{const cfg=statusConfig[opt.value];return(
                  <button key={opt.value} onClick={()=>onStatusChange(opt.value)}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 flex items-center gap-2 ${task.status===opt.value?"font-medium":"text-gray-600"}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:cfg.color}}/>
                    <span style={task.status===opt.value?{color:cfg.color}:{}}>{cfg.label}</span>
                    {task.status===opt.value&&<Check className="w-3 h-3 ml-auto" style={{color:cfg.color}}/>}
                  </button>
                );})}
              </div>
            )}
          </div>
        );

      case "dueDate":
        return (
          <div className="flex items-center gap-1.5 cursor-pointer px-2" onClick={onClick}>
            {task.dueDate ? (<>
              <Calendar className="w-3 h-3 shrink-0" style={{color:isOverdue?"#ef4444":"#94a3b8"}}/>
              <span className={`text-[12px] font-medium ${isOverdue?"text-red-500":"text-gray-500"}`}>{formatDate(task.dueDate)}</span>
            </>) : <span className="text-[12px] text-gray-200">—</span>}
          </div>
        );

      case "startDate":
        return (
          <div className="flex items-center gap-1.5 cursor-pointer px-2" onClick={onClick}>
            {task.startDate ? (<>
              <Calendar className="w-3 h-3 text-gray-300 shrink-0"/>
              <span className="text-[12px] text-gray-500">{formatDate(task.startDate)}</span>
            </>) : <span className="text-[12px] text-gray-200">—</span>}
          </div>
        );

      case "created":
        return <span className="text-[12px] text-gray-400 px-2 cursor-pointer" onClick={onClick}>{formatDate(task.createdAt)}</span>;

      case "updated":
        return <span className="text-[12px] text-gray-400 px-2 cursor-pointer" onClick={onClick}>{task.updatedAt ? formatDate(task.updatedAt) : <span className="text-gray-200">—</span>}</span>;

      case "epic":
        return epic
          ? <span className="text-[11px] px-2 py-0.5 rounded-md truncate mx-2 cursor-pointer" style={{backgroundColor:epic.color+"15",color:epic.color}} onClick={onClick}>{epic.title}</span>
          : <span className="text-[12px] text-gray-200 px-2">—</span>;

      case "sprint":
        return sprint
          ? <span className="text-[12px] text-cyan-600 px-2 truncate cursor-pointer hover:underline" onClick={onClick}>{sprint.name}</span>
          : <span className="text-[12px] text-gray-300 px-2 italic">Backlog</span>;

      case "storyPoints":
        return task.storyPoints
          ? <span className="text-[12px] text-gray-600 px-2 font-medium cursor-pointer" onClick={onClick}>{task.storyPoints}</span>
          : <span className="text-[12px] text-gray-200 px-2">—</span>;

      case "type":
        return (
          <div className="flex items-center gap-1.5 px-2 cursor-pointer" onClick={onClick}>
            <span className="text-[11px]">{typeCfg.icon}</span>
            <span className="text-[12px] text-gray-600 truncate">{typeCfg.label}</span>
          </div>
        );

      case "estimate":
        return <span className="text-[12px] text-gray-400 px-2">{fmtTime(task.timeEstimate)}</span>;

      case "spent":
        return <span className="text-[12px] text-gray-500 px-2">{fmtTime(task.timeSpent)}</span>;

      case "tags":
        return (
          <div className="flex items-center gap-1 px-2 overflow-hidden cursor-pointer" onClick={onClick}>
            {task.tags.length > 0 ? (
              <>
                {task.tags.slice(0, 2).map(tag => {
                  const tc = tagColors[tag] || { bg: "#f1f5f9", text: "#64748b" };
                  return <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md shrink-0" style={{ backgroundColor: tc.bg, color: tc.text }}>{tag}</span>;
                })}
                {task.tags.length > 2 && <span className="text-[9px] text-gray-400 shrink-0">+{task.tags.length - 2}</span>}
              </>
            ) : <span className="text-[12px] text-gray-200">—</span>}
          </div>
        );

      case "project":
        return project
          ? <div className="flex items-center gap-1.5 px-2 cursor-pointer min-w-0" onClick={onClick}><div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: project.color }} /><span className="text-[12px] text-gray-500 truncate">{project.name}</span></div>
          : <span className="text-[12px] text-gray-200 px-2">—</span>;

      default:
        return null;
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver?.(); }}
      onDragEnd={onDragEnd}
      onDrop={e => { e.preventDefault(); onDrop?.(); }}
      className={`grid gap-0 items-center group transition-colors min-h-[42px] border-b ${isDragOver ? "border-t-2 border-t-cyan-400 border-b-gray-100/80" : "border-gray-100/80"} ${isDragging ? "opacity-40" : ""} ${selected?"bg-cyan-50/40":"bg-white hover:bg-gray-50/70"}`}
      style={{ gridTemplateColumns: gridTemplate }}>

      {/* Drag handle — only shown when drag is enabled (sort inactive) */}
      <div
        draggable={!isSubtask && !!onDragStart}
        onDragStart={onDragStart ? e => { e.stopPropagation(); e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; onDragStart(); } : undefined}
        className={`flex items-center justify-center transition-opacity ${!isSubtask && onDragStart ? "opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}>
        {!isSubtask && onDragStart && <GripVertical className="w-3.5 h-3.5 text-gray-400" />}
      </div>

      {/* Checkbox */}
      <button onClick={e=>{e.stopPropagation();onToggleSelect();}} className="flex items-center justify-center px-2">
        {selected
          ? <CheckSquare className="w-3.5 h-3.5 text-cyan-500"/>
          : <Square className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 transition-colors"/>}
      </button>

      {/* Dynamic cells */}
      {visibleColDefs.map(col => (
        <div key={col.id} className="min-w-0 flex items-center overflow-hidden">
          {renderCell(col)}
        </div>
      ))}

      {/* Row actions */}
      <div className="relative flex items-center justify-center gap-0.5 px-1" ref={rowMenuRef}>
        {!isSubtask && onAddSubtask && (
          <button onClick={e=>{e.stopPropagation();onAddSubtask();}}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600 transition-all"
            title="Add subtask">
            <Plus className="w-3.5 h-3.5"/>
          </button>
        )}
        <button onClick={e=>{e.stopPropagation();onRowMenuToggle();}}
          className="w-5 h-5 rounded flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600 transition-all">
          <MoreHorizontal className="w-3.5 h-3.5"/>
        </button>
        {rowMenuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-48 py-1 z-30">
            <button onClick={()=>{onClick();onRowMenuClose();}} className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50">Mở task</button>
            {onCloneTask && (<>
              <div className="h-px bg-gray-100 my-1"/>
              <button onClick={()=>{onCloneTask();onRowMenuClose();toast.success("Đã nhân bản task");}} className="w-full text-left px-4 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">Nhân bản</button>
            </>)}
            <div className="h-px bg-gray-100 my-1"/>
            <button onClick={()=>{navigator.clipboard.writeText(task.id).then(()=>toast.success("Đã sao chép ID")).catch(()=>toast.error("Không thể sao chép"));onRowMenuClose();}} className="w-full text-left px-4 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50">Sao chép ID</button>
            {onDeleteTask && (
              <button onClick={()=>{if(window.confirm(`Xóa task "${task.title}"?`)){onDeleteTask();}onRowMenuClose();}} className="w-full text-left px-4 py-1.5 text-[12px] text-red-500 hover:bg-red-50">Xóa</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((date.getTime()-today.getTime())/(1000*60*60*24));
  if (diffDays===0) return "Today";
  if (diffDays===1) return "Tomorrow";
  if (diffDays===-1) return "Yesterday";
  return date.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"2-digit"});
}

function parseCSV(text: string): {headers:string[];rows:string[][]} {
  const parse = (line: string): string[] => {
    const result: string[] = []; let cur=""; let inQ=false;
    for (let i=0;i<line.length;i++) {
      const ch=line[i];
      if (ch==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else{inQ=!inQ;}}
      else if(ch===","&&!inQ){result.push(cur.trim());cur="";}
      else{cur+=ch;}
    }
    result.push(cur.trim()); return result;
  };
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  return {headers:parse(lines[0]),rows:lines.slice(1).map(parse)};
}

function csvRowToTask(headers: string[], row: string[], projectId: string): Partial<Task> {
  const col = (...names: string[]) => { for(const n of names){const idx=headers.findIndex(h=>h.toLowerCase().replace(/[\s_]/g,"")===n.toLowerCase().replace(/[\s_]/g,""));if(idx>=0&&row[idx])return row[idx].trim();}return""; };
  const title = col("title","name","work","task","summary"); if(!title) return {};
  const statusMap: Record<string,Task["status"]> = {"todo":"todo","to do":"todo","inprogress":"in_progress","in progress":"in_progress","inreview":"in_review","in review":"in_review","done":"done","completed":"done","finished":"done"};
  const priorityMap: Record<string,Task["priority"]> = {"urgent":"urgent","critical":"urgent","high":"high","normal":"normal","medium":"normal","low":"low"};
  const rawStatus   = col("status").toLowerCase().replace(/[\s_-]/g," ").trim();
  const rawPriority = col("priority").toLowerCase().trim();
  const assigneeName = col("assignee","assigned to","owner");
  const assignee = assigneeName ? teamMembers.find(m=>m.name.toLowerCase().includes(assigneeName.toLowerCase())) : undefined;
  const tagsStr   = col("tags","labels","tag");
  return {
    title, status: statusMap[rawStatus]||statusMap[rawStatus.replace(/ /g,"")]||"todo",
    priority: priorityMap[rawPriority]||"normal", type:(col("type") as Task["type"])||"task",
    assignee, dueDate: col("due date","duedate","deadline","due")||undefined,
    startDate: col("start date","startdate","start")||undefined,
    tags: tagsStr?tagsStr.split(/[;,]/).map(t=>t.trim()).filter(Boolean):[],
    storyPoints: parseInt(col("story points","storypoints","points","sp"))||undefined,
    createdAt: new Date().toISOString(), projectId,
  };
}
