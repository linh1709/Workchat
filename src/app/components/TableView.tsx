import { useState } from "react";
import { ArrowUpDown, Filter, Download, Plus, ChevronDown, MoreHorizontal, Clock, Search, X, Eye, EyeOff, CheckSquare, Square, ArrowDown, ArrowUp } from "lucide-react";
import { type Task, projects, statusConfig, priorityConfig, teamMembers, tagColors } from "./data";
import { useTaskFilter } from "../hooks/useTaskFilter";
import { useTaskSort } from "../hooks/useTaskSort";

interface TableViewProps { tasks: Task[]; onTaskClick: (task: Task) => void; selectedProject: string | null; }

type Column = { key: string; label: string; width: string; visible: boolean; sortable: boolean };

const defaultColumns: Column[] = [
  { key: "title", label: "Task", width: "flex-1", visible: true, sortable: true },
  { key: "status", label: "Status", width: "100px", visible: true, sortable: true },
  { key: "priority", label: "Priority", width: "90px", visible: true, sortable: true },
  { key: "assignee", label: "Assignee", width: "130px", visible: true, sortable: true },
  { key: "dueDate", label: "Due Date", width: "95px", visible: true, sortable: true },
  { key: "estimate", label: "Estimate", width: "80px", visible: true, sortable: false },
  { key: "spent", label: "Spent", width: "80px", visible: true, sortable: false },
  { key: "project", label: "Project", width: "110px", visible: true, sortable: false },
  { key: "tags", label: "Tags", width: "120px", visible: true, sortable: false },
  { key: "created", label: "Created", width: "90px", visible: false, sortable: true },
  { key: "subtasks", label: "Subtasks", width: "80px", visible: false, sortable: false },
];

export function TableView({ tasks, onTaskClick, selectedProject }: TableViewProps) {
  const {
    filteredTasks,
    searchQ,
    setSearchQ,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    setFilterAssignee,
    hasFilters,
    clearFilters,
  } = useTaskFilter(tasks, selectedProject, { includeStatus: true });

  const {
    sortedTasks,
    sortField,
    sortDir,
    toggleSort: hookToggleSort,
  } = useTaskSort(filteredTasks, { cycleMode: "2state" });

  const [columns, setColumns] = useState(defaultColumns);
  const [showColMenu, setShowColMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const visibleCols = columns.filter(c => c.visible);
  const paged = sortedTasks.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sortedTasks.length / pageSize);

  const toggleSort = (field: string) => {
    if (!columns.find(c => c.key === field)?.sortable) return;
    hookToggleSort(field);
  };

  const toggleCol = (key: string) => setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  const toggleRow = (id: string) => setSelectedRows(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => { if (selectedRows.size === paged.length) setSelectedRows(new Set()); else setSelectedRows(new Set(paged.map(t => t.id))); };

  const fmtTime = (mins?: number) => mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "—";

  // Stats
  const doneTasks = filteredTasks.filter(t => t.status === "done").length;
  const overdueTasks = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
      {/* Toolbar */}
      <div className="px-5 py-2 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }} placeholder="Tìm task..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-400 text-gray-700" />
        </div>

        {/* Filter */}
        <div className="relative">
          <button onClick={() => { setShowFilterMenu(!showFilterMenu); setShowColMenu(false); }}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${hasFilters ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Filter className="w-3 h-3" /> Filter {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
          </button>
          {showFilterMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-30 w-[200px]" onClick={e => e.stopPropagation()}>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 mb-1">Status</p>
              {Object.entries(statusConfig).map(([k, v]) => (
                <button key={k} onClick={() => setFilterStatus(filterStatus === k ? null : k)}
                  className={`w-full flex items-center gap-2 px-3 py-1 text-[11px] hover:bg-gray-50 ${filterStatus === k ? "text-cyan-600 bg-cyan-50/50" : "text-gray-600"}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} /> {v.label}
                </button>
              ))}
              <div className="h-px bg-gray-100 my-1.5 mx-3" />
              <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 mb-1">Priority</p>
              {Object.entries(priorityConfig).map(([k, v]) => (
                <button key={k} onClick={() => setFilterPriority(filterPriority === k ? null : k)}
                  className={`w-full flex items-center gap-2 px-3 py-1 text-[11px] hover:bg-gray-50 ${filterPriority === k ? "text-cyan-600 bg-cyan-50/50" : "text-gray-600"}`}>
                  <span className="text-[7px]" style={{ color: v.color }}>{v.icon}</span> {v.label}
                </button>
              ))}
              <div className="h-px bg-gray-100 my-1.5 mx-3" />
              <p className="text-[9px] text-gray-400 uppercase tracking-wider px-3 mb-1">Assignee</p>
              {teamMembers.slice(0, 5).map(m => (
                <button key={m.id} onClick={() => setFilterAssignee(filterAssignee === m.id ? null : m.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1 text-[11px] hover:bg-gray-50 ${filterAssignee === m.id ? "text-cyan-600 bg-cyan-50/50" : "text-gray-600"}`}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} /> {m.name.split(" ").slice(-2).join(" ")}
                </button>
              ))}
              {hasFilters && (<>
                <div className="h-px bg-gray-100 my-1.5 mx-3" />
                <button onClick={clearFilters} className="w-full flex items-center gap-2 px-3 py-1 text-[11px] text-red-500 hover:bg-red-50"><X className="w-3 h-3" /> Clear all</button>
              </>)}
            </div>
          )}
        </div>

        {/* Column visibility */}
        <div className="relative">
          <button onClick={() => { setShowColMenu(!showColMenu); setShowFilterMenu(false); }}
            className="flex items-center gap-1.5 text-[11px] text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            <Eye className="w-3 h-3" /> Columns
          </button>
          {showColMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-30 w-[160px]" onClick={e => e.stopPropagation()}>
              {columns.map(col => (
                <button key={col.key} onClick={() => toggleCol(col.key)}
                  className="w-full flex items-center gap-2 px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-50">
                  {col.visible ? <Eye className="w-3 h-3 text-cyan-500" /> : <EyeOff className="w-3 h-3 text-gray-300" />} {col.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center gap-1.5 text-[11px] text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
          <Download className="w-3 h-3" /> Export
        </button>

        <div className="flex-1" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>{sortedTasks.length} tasks</span>
          <span className="text-emerald-500">{doneTasks} done</span>
          {overdueTasks > 0 && <span className="text-red-500">{overdueTasks} overdue</span>}
        </div>

        {selectedRows.size > 0 && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
            <span className="text-[10px] text-cyan-600">{selectedRows.size} selected</span>
            <button onClick={() => setSelectedRows(new Set())} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" onClick={() => { setShowColMenu(false); setShowFilterMenu(false); }}>
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <button onClick={toggleAll} className="w-5 flex items-center justify-center shrink-0">
              {selectedRows.size === paged.length && paged.length > 0 ? <CheckSquare className="w-3 h-3 text-cyan-500" /> : <Square className="w-3 h-3 text-gray-300" />}
            </button>
            <div className="w-5 shrink-0" />
            {visibleCols.map(col => (
              <button key={col.key} onClick={() => toggleSort(col.key)}
                className={`flex items-center gap-1 text-left text-[10px] uppercase tracking-wider transition-all shrink-0 ${col.sortable ? "hover:text-gray-700 cursor-pointer" : "cursor-default"} ${sortField === col.key ? "text-cyan-600" : "text-gray-400"}`}
                style={{ width: col.width === "flex-1" ? undefined : col.width, flex: col.width === "flex-1" ? 1 : undefined }}>
                {col.label}
                {sortField === col.key && (sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
              </button>
            ))}
          </div>

          {/* Rows */}
          {paged.map((task, i) => {
            const project = projects.find(p => p.id === task.projectId);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
            const isSelected = selectedRows.has(task.id);

            return (
              <div key={task.id}
                className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-all group ${i < paged.length - 1 ? "border-b border-gray-100" : ""} ${isSelected ? "bg-cyan-50/30" : "hover:bg-cyan-50/20"}`}>
                <button onClick={e => { e.stopPropagation(); toggleRow(task.id); }} className="w-5 flex items-center justify-center shrink-0">
                  {isSelected ? <CheckSquare className="w-3 h-3 text-cyan-500" /> : <Square className="w-3 h-3 text-gray-300 group-hover:text-gray-400" />}
                </button>
                <div className="w-5 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[task.status].color }} />
                </div>

                {visibleCols.map(col => {
                  if (col.key === "title") return (
                    <div key={col.key} className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                      <p className={`text-[12px] truncate ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-700 hover:text-gray-900"}`}>{task.title}</p>
                    </div>
                  );
                  if (col.key === "status") return (
                    <div key={col.key} className="shrink-0" style={{ width: col.width }} onClick={() => onTaskClick(task)}>
                      <span className="text-[10px] px-2 py-0.5 rounded-md inline-block" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>{statusConfig[task.status].label}</span>
                    </div>
                  );
                  if (col.key === "priority") return (
                    <div key={col.key} className="shrink-0" style={{ width: col.width }} onClick={() => onTaskClick(task)}>
                      <span className="text-[10px] flex items-center gap-1" style={{ color: priorityConfig[task.priority].color }}>
                        <span className="text-[6px]">{priorityConfig[task.priority].icon}</span> {priorityConfig[task.priority].label}
                      </span>
                    </div>
                  );
                  if (col.key === "assignee") return (
                    <div key={col.key} className="shrink-0 flex items-center gap-1.5" style={{ width: col.width }} onClick={() => onTaskClick(task)}>
                      {task.assignee ? (<>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>
                        <span className="text-[11px] text-gray-600 truncate">{task.assignee.name}</span>
                      </>) : <span className="text-[11px] text-gray-300">—</span>}
                    </div>
                  );
                  if (col.key === "dueDate") return (
                    <div key={col.key} className="shrink-0" style={{ width: col.width }} onClick={() => onTaskClick(task)}>
                      <span className={`text-[11px] ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "—"}
                      </span>
                    </div>
                  );
                  if (col.key === "estimate") return <div key={col.key} className="shrink-0 text-[11px] text-gray-400" style={{ width: col.width }}>{fmtTime(task.timeEstimate)}</div>;
                  if (col.key === "spent") return <div key={col.key} className="shrink-0 text-[11px] text-gray-500" style={{ width: col.width }}>{fmtTime(task.timeSpent)}</div>;
                  if (col.key === "project") return (
                    <div key={col.key} className="shrink-0" style={{ width: col.width }} onClick={() => onTaskClick(task)}>
                      {project && <span className="text-[10px] text-gray-500 flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: project.color }} /><span className="truncate">{project.name}</span></span>}
                    </div>
                  );
                  if (col.key === "tags") return (
                    <div key={col.key} className="shrink-0 flex gap-1 overflow-hidden" style={{ width: col.width }}>
                      {task.tags.slice(0, 2).map(tag => {
                        const tc = tagColors[tag] || { bg: "#f1f5f9", text: "#64748b" };
                        return <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: tc.bg, color: tc.text }}>{tag}</span>;
                      })}
                      {task.tags.length > 2 && <span className="text-[9px] text-gray-400">+{task.tags.length - 2}</span>}
                    </div>
                  );
                  if (col.key === "created") return (
                    <div key={col.key} className="shrink-0 text-[11px] text-gray-400" style={{ width: col.width }}>
                      {new Date(task.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </div>
                  );
                  if (col.key === "subtasks") return (
                    <div key={col.key} className="shrink-0 text-[11px] text-gray-400" style={{ width: col.width }}>
                      {task.subtasks && task.subtasks.length > 0 ? `${task.subtasks.filter(s => s.done).length}/${task.subtasks.length}` : "—"}
                    </div>
                  );
                  return null;
                })}
              </div>
            );
          })}

          {sortedTasks.length === 0 && (
            <div className="text-center py-12 text-[12px] text-gray-400">
              {hasFilters ? "Không tìm thấy task nào phù hợp" : "No tasks"}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-2 bg-white border-t border-gray-200 shrink-0">
          <span className="text-[10px] text-gray-400">Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedTasks.length)} of {sortedTasks.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="text-[10px] px-2 py-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`text-[10px] w-6 h-6 rounded-md ${page === i ? "bg-cyan-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{i + 1}</button>
            ))}
            <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="text-[10px] px-2 py-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
