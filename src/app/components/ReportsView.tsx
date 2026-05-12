import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Download, RefreshCw, ChevronDown, Clock,
  Bug, Zap, Target, CheckCircle2, Circle, AlertTriangle,
  Users, Layers, Activity, PieChart, ArrowRight, Eye,
  FileText, Printer, Share2, Maximize2, X
} from "lucide-react";

interface ReportsViewProps {
  tasks?: any[];
}

type ReportTab = "burndown" | "velocity" | "cycle_time" | "bugs" | "sprint";

const SPRINT_DATA = [
  { name: "Sprint 1", planned: 34, completed: 30, velocity: 30, bugs: 5, startDate: "01/02", endDate: "14/02" },
  { name: "Sprint 2", planned: 36, completed: 33, velocity: 33, bugs: 3, startDate: "15/02", endDate: "28/02" },
  { name: "Sprint 3", planned: 38, completed: 35, velocity: 35, bugs: 7, startDate: "01/03", endDate: "14/03" },
  { name: "Sprint 4", planned: 40, completed: 28, velocity: 28, bugs: 9, startDate: "15/03", endDate: "28/03" },
];

const BURNDOWN_DAYS = Array.from({ length: 14 }, (_, i) => {
  const ideal = 40 - (40 / 14) * (i + 1);
  const actual = 40 - Math.floor(Math.random() * 4 + (40 / 14) * (i + 1) * 0.7);
  return { day: i + 1, date: `${i + 1}/03`, ideal: Math.max(0, Math.round(ideal)), actual: Math.max(0, Math.min(40, actual > 0 ? actual : 0)) };
});

const CYCLE_TIME_DATA = [
  { status: "Backlog → Todo", avg: 2.3, median: 1.5, p90: 5.0, color: "#94a3b8" },
  { status: "Todo → In Progress", avg: 1.1, median: 0.8, p90: 3.2, color: "#0891b2" },
  { status: "In Progress → Review", avg: 3.5, median: 2.8, p90: 7.1, color: "#7c3aed" },
  { status: "Review → Done", avg: 0.8, median: 0.5, p90: 2.0, color: "#059669" },
  { status: "Tổng cộng", avg: 7.7, median: 5.6, p90: 17.3, color: "#6366f1" },
];

const BUG_CATEGORIES = [
  { name: "UI/UX", count: 12, severity: { critical: 1, major: 3, minor: 8 }, color: "#7c3aed" },
  { name: "API/Backend", count: 8, severity: { critical: 2, major: 4, minor: 2 }, color: "#0891b2" },
  { name: "Performance", count: 5, severity: { critical: 1, major: 2, minor: 2 }, color: "#d97706" },
  { name: "Security", count: 3, severity: { critical: 2, major: 1, minor: 0 }, color: "#dc2626" },
  { name: "Data/Logic", count: 6, severity: { critical: 0, major: 3, minor: 3 }, color: "#059669" },
];

const TEAM_PERFORMANCE = [
  { name: "Nguyễn Văn An", tasksCompleted: 18, storyPoints: 34, avgCycleTime: 2.1, bugs: 2, avatar: "NA" },
  { name: "Trần Thị Bình", tasksCompleted: 22, storyPoints: 41, avgCycleTime: 1.8, bugs: 1, avatar: "TB" },
  { name: "Lê Hoàng Cường", tasksCompleted: 15, storyPoints: 28, avgCycleTime: 3.2, bugs: 4, avatar: "LC" },
  { name: "Phạm Minh Đức", tasksCompleted: 20, storyPoints: 37, avgCycleTime: 2.5, bugs: 3, avatar: "PD" },
  { name: "Hoàng Thu Hà", tasksCompleted: 25, storyPoints: 45, avgCycleTime: 1.5, bugs: 1, avatar: "TH" },
];

export function ReportsView({ tasks = [] }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("burndown");
  const [sprintFilter, setSprintFilter] = useState("Sprint 4");
  const [dateRange, setDateRange] = useState("Tháng này");

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: "burndown", label: "Burndown", icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { key: "velocity", label: "Velocity", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "cycle_time", label: "Cycle Time", icon: <Clock className="w-3.5 h-3.5" /> },
    { key: "bugs", label: "Bug Report", icon: <Bug className="w-3.5 h-3.5" /> },
    { key: "sprint", label: "Sprint Report", icon: <Target className="w-3.5 h-3.5" /> },
  ];

  const kpis = [
    { label: "Velocity TB", value: "31.5", unit: "SP/sprint", trend: "+8%", positive: true, icon: <Zap className="w-4 h-4" /> },
    { label: "Cycle Time TB", value: "7.7", unit: "ngày", trend: "-12%", positive: true, icon: <Clock className="w-4 h-4" /> },
    { label: "Bug Rate", value: "18%", unit: "tổng tasks", trend: "+3%", positive: false, icon: <Bug className="w-4 h-4" /> },
    { label: "Hoàn thành", value: "87%", unit: "đúng hạn", trend: "+5%", positive: true, icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const maxBurndown = 40;

  return (
    <div className="flex-1 h-full overflow-auto bg-gray-50/50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] text-gray-900">Báo cáo & Phân tích</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Theo dõi tiến độ và hiệu suất dự án</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              <Calendar className="w-3.5 h-3.5" /> {dateRange} <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              <Download className="w-3.5 h-3.5" /> Xuất PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-gray-400">{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">{kpi.icon}</div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-[24px] text-gray-900 leading-none">{kpi.value}</span>
                <span className="text-[10px] text-gray-400 mb-1">{kpi.unit}</span>
              </div>
              <div className={`flex items-center gap-1 mt-2 text-[10px] ${kpi.positive ? "text-emerald-600" : "text-red-500"}`}>
                {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend} so với sprint trước
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] transition-all ${
                activeTab === tab.key
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "burndown" && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[14px] text-gray-900">Burndown Chart</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Sprint 4 — 15/03 đến 28/03/2026</p>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-gray-300 rounded" /> Ideal</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-cyan-500 rounded" /> Actual</span>
              </div>
            </div>
            {/* Chart area */}
            <div className="relative h-[300px] border-l border-b border-gray-200">
              {/* Y-axis labels */}
              {[0, 10, 20, 30, 40].reverse().map(v => (
                <div key={v} className="absolute left-0 flex items-center" style={{ bottom: `${(v / maxBurndown) * 100}%` }}>
                  <span className="text-[9px] text-gray-400 w-6 text-right -ml-7">{v}</span>
                  <div className="w-full absolute left-0 border-t border-gray-50" style={{ width: "calc(100% + 2rem)", left: "0" }} />
                </div>
              ))}
              {/* Bars / lines simulation */}
              <div className="absolute inset-0 flex items-end px-2">
                {BURNDOWN_DAYS.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 relative h-full justify-end">
                    {/* Ideal line dot */}
                    <div
                      className="absolute w-2 h-2 rounded-full bg-gray-300 border border-white z-10"
                      style={{ bottom: `${(d.ideal / maxBurndown) * 100}%` }}
                    />
                    {/* Actual bar */}
                    <div
                      className="w-[60%] rounded-t-md bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all hover:from-cyan-600 hover:to-cyan-500 cursor-pointer relative group"
                      style={{ height: `${(d.actual / maxBurndown) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded-md text-[9px] opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-20">
                        Còn lại: {d.actual} SP
                      </div>
                    </div>
                    <span className="text-[8px] text-gray-400 mt-1">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Planned</p>
                <p className="text-[16px] text-gray-900 mt-0.5">40 SP</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Completed</p>
                <p className="text-[16px] text-emerald-600 mt-0.5">28 SP</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Remaining</p>
                <p className="text-[16px] text-amber-600 mt-0.5">12 SP</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "velocity" && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[14px] text-gray-900">Velocity Chart</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Story points hoàn thành qua các sprint</p>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-200" /> Planned</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-500" /> Completed</span>
                <span className="flex items-center gap-1.5"><div className="w-8 h-0.5 bg-amber-500 rounded" /> Avg Velocity</span>
              </div>
            </div>
            <div className="relative h-[280px] border-l border-b border-gray-200">
              {/* Y-axis */}
              {[0, 10, 20, 30, 40].reverse().map(v => (
                <div key={v} className="absolute left-0" style={{ bottom: `${(v / 40) * 100}%` }}>
                  <span className="text-[9px] text-gray-400 -ml-7 w-6 text-right inline-block">{v}</span>
                </div>
              ))}
              {/* Average line */}
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400" style={{ bottom: `${(31.5 / 40) * 100}%` }}>
                <span className="absolute right-0 -top-4 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">TB: 31.5</span>
              </div>
              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-around px-8">
                {SPRINT_DATA.map((sp, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 w-24">
                    <div className="flex items-end gap-1 h-[240px]">
                      <div className="w-8 rounded-t-md bg-cyan-100 transition-all" style={{ height: `${(sp.planned / 40) * 240}px` }} />
                      <div className="w-8 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all hover:from-cyan-700 hover:to-cyan-500 cursor-pointer relative group" style={{ height: `${(sp.completed / 40) * 240}px` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded-md text-[9px] opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-20">
                          {sp.completed} SP hoàn thành
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{sp.name}</span>
                    <span className="text-[9px] text-gray-400">{sp.startDate}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Velocity stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
              {SPRINT_DATA.map((sp, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400">{sp.name}</p>
                  <p className="text-[16px] text-gray-900 mt-0.5">{sp.velocity} <span className="text-[10px] text-gray-400">SP</span></p>
                  <p className={`text-[10px] mt-0.5 ${sp.velocity >= 31.5 ? "text-emerald-600" : "text-amber-600"}`}>
                    {sp.velocity >= 31.5 ? "Trên TB" : "Dưới TB"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cycle_time" && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-[14px] text-gray-900">Cycle Time Analysis</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Thời gian trung bình để task di chuyển qua các giai đoạn</p>
            </div>
            <div className="space-y-3">
              {CYCLE_TIME_DATA.map((ct, i) => {
                const isTotal = ct.status === "Tổng cộng";
                return (
                  <div key={i} className={`p-4 rounded-xl border ${isTotal ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.color }} />
                        <span className={`text-[12px] ${isTotal ? "text-violet-800" : "text-gray-700"}`}>{ct.status}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-400">Average</p>
                          <p className={`text-[13px] ${isTotal ? "text-violet-700" : "text-gray-900"}`}>{ct.avg}d</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-gray-400">Median</p>
                          <p className="text-[13px] text-gray-700">{ct.median}d</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-gray-400">P90</p>
                          <p className="text-[13px] text-amber-600">{ct.p90}d</p>
                        </div>
                      </div>
                    </div>
                    {/* Bar visualization */}
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(ct.avg / 10) * 100}%`, backgroundColor: ct.color, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "bugs" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-[14px] text-gray-900">Bug Report</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Phân tích lỗi theo danh mục và mức độ nghiêm trọng</p>
              </div>
              {/* Bug summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                  <p className="text-[10px] text-red-400">Critical</p>
                  <p className="text-[20px] text-red-600">{BUG_CATEGORIES.reduce((s, c) => s + c.severity.critical, 0)}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                  <p className="text-[10px] text-amber-500">Major</p>
                  <p className="text-[20px] text-amber-600">{BUG_CATEGORIES.reduce((s, c) => s + c.severity.major, 0)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] text-blue-400">Minor</p>
                  <p className="text-[20px] text-blue-600">{BUG_CATEGORIES.reduce((s, c) => s + c.severity.minor, 0)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400">Tổng</p>
                  <p className="text-[20px] text-gray-900">{BUG_CATEGORIES.reduce((s, c) => s + c.count, 0)}</p>
                </div>
              </div>
              {/* Bug categories */}
              <div className="space-y-3">
                {BUG_CATEGORIES.map((cat, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[12px] text-gray-700 w-28">{cat.name}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-500" style={{ width: `${(cat.severity.critical / cat.count) * 100}%` }} />
                      <div className="h-full bg-amber-400" style={{ width: `${(cat.severity.major / cat.count) * 100}%` }} />
                      <div className="h-full bg-blue-300" style={{ width: `${(cat.severity.minor / cat.count) * 100}%` }} />
                    </div>
                    <span className="text-[12px] text-gray-900 w-8 text-right">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sprint" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-[14px] text-gray-900">Sprint Report</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Tổng kết hiệu suất sprint hiện tại và so sánh lịch sử</p>
              </div>
              {/* Sprint comparison table */}
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-gray-500">Sprint</th>
                      <th className="text-center px-4 py-3 text-gray-500">Thời gian</th>
                      <th className="text-center px-4 py-3 text-gray-500">Planned</th>
                      <th className="text-center px-4 py-3 text-gray-500">Completed</th>
                      <th className="text-center px-4 py-3 text-gray-500">Velocity</th>
                      <th className="text-center px-4 py-3 text-gray-500">Bugs</th>
                      <th className="text-center px-4 py-3 text-gray-500">Hiệu suất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SPRINT_DATA.map((sp, i) => {
                      const perf = Math.round((sp.completed / sp.planned) * 100);
                      return (
                        <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i === SPRINT_DATA.length - 1 ? "bg-cyan-50/30" : ""}`}>
                          <td className="px-4 py-3 text-gray-800">{sp.name} {i === SPRINT_DATA.length - 1 && <span className="text-[9px] text-cyan-600 bg-cyan-100 px-1.5 py-0.5 rounded ml-1">Hiện tại</span>}</td>
                          <td className="text-center px-4 py-3 text-gray-500">{sp.startDate} — {sp.endDate}</td>
                          <td className="text-center px-4 py-3 text-gray-700">{sp.planned}</td>
                          <td className="text-center px-4 py-3 text-emerald-600">{sp.completed}</td>
                          <td className="text-center px-4 py-3 text-gray-800">{sp.velocity}</td>
                          <td className="text-center px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${sp.bugs > 5 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"}`}>{sp.bugs}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${perf >= 85 ? "bg-emerald-500" : perf >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${perf}%` }} />
                              </div>
                              <span className={`text-[11px] ${perf >= 85 ? "text-emerald-600" : perf >= 70 ? "text-amber-600" : "text-red-600"}`}>{perf}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Performance */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-[14px] text-gray-900 mb-4">Hiệu suất thành viên</h3>
              <div className="space-y-2">
                {TEAM_PERFORMANCE.map((member, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-[10px] shrink-0">
                      {member.avatar}
                    </div>
                    <span className="text-[12px] text-gray-800 w-32 truncate">{member.name}</span>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">Tasks</p>
                        <p className="text-[13px] text-gray-800">{member.tasksCompleted}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">Story Points</p>
                        <p className="text-[13px] text-gray-800">{member.storyPoints}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">Cycle Time</p>
                        <p className="text-[13px] text-gray-800">{member.avgCycleTime}d</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">Bugs</p>
                        <p className={`text-[13px] ${member.bugs > 2 ? "text-amber-600" : "text-emerald-600"}`}>{member.bugs}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
