import { useState } from "react";
import {
  GitBranch, GitCommit, GitPullRequest, GitMerge, GitFork,
  CheckCircle2, Circle, Clock, AlertTriangle, XCircle,
  Play, Pause, RotateCcw, ExternalLink, Copy, Eye,
  ChevronDown, ChevronRight, Filter, Search, RefreshCw,
  Box, Server, Cloud, Shield, Zap, ArrowRight,
  User, Calendar, Tag, MoreHorizontal, Check, X,
  AlertCircle, Loader2, Rocket, Database, Globe
} from "lucide-react";

const BRANCHES = [
  { name: "main", status: "protected", lastCommit: "2h trước", author: "Hoàng Thu Hà", ahead: 0, behind: 0, pipeline: "passed" },
  { name: "develop", status: "default", lastCommit: "45m trước", author: "Trần Thị Bình", ahead: 3, behind: 0, pipeline: "passed" },
  { name: "feature/user-auth", status: "active", lastCommit: "20m trước", author: "Nguyễn Văn An", ahead: 8, behind: 2, pipeline: "running" },
  { name: "feature/dashboard-v2", status: "active", lastCommit: "1h trước", author: "Phạm Minh Đức", ahead: 12, behind: 5, pipeline: "passed" },
  { name: "feature/api-optimization", status: "active", lastCommit: "3h trước", author: "Lê Hoàng Cường", ahead: 5, behind: 1, pipeline: "failed" },
  { name: "hotfix/login-bug", status: "active", lastCommit: "30m trước", author: "Hoàng Thu Hà", ahead: 2, behind: 0, pipeline: "passed" },
  { name: "release/v2.1.0", status: "release", lastCommit: "6h trước", author: "Trần Thị Bình", ahead: 0, behind: 3, pipeline: "passed" },
];

const COMMITS = [
  { hash: "a3f8e2d", message: "feat: implement JWT refresh token rotation", author: "Nguyễn Văn An", avatar: "NA", time: "20 phút trước", branch: "feature/user-auth", files: 5, additions: 142, deletions: 23 },
  { hash: "b7c1f4a", message: "fix: resolve login redirect loop on expired session", author: "Hoàng Thu Hà", avatar: "TH", time: "30 phút trước", branch: "hotfix/login-bug", files: 3, additions: 28, deletions: 45 },
  { hash: "d2e5a9b", message: "refactor: optimize dashboard query with pagination", author: "Phạm Minh Đức", avatar: "PD", time: "1 giờ trước", branch: "feature/dashboard-v2", files: 8, additions: 256, deletions: 198 },
  { hash: "e4f7b3c", message: "feat: add real-time notification WebSocket handler", author: "Trần Thị Bình", avatar: "TB", time: "2 giờ trước", branch: "develop", files: 4, additions: 89, deletions: 12 },
  { hash: "f1a2c8d", message: "perf: implement Redis caching for API responses", author: "Lê Hoàng Cường", avatar: "LC", time: "3 giờ trước", branch: "feature/api-optimization", files: 6, additions: 167, deletions: 34 },
  { hash: "c9d3e7f", message: "test: add integration tests for payment module", author: "Nguyễn Văn An", avatar: "NA", time: "5 giờ trước", branch: "develop", files: 3, additions: 234, deletions: 0 },
  { hash: "g5h8i2j", message: "docs: update API documentation for v2.1", author: "Hoàng Thu Hà", avatar: "TH", time: "6 giờ trước", branch: "release/v2.1.0", files: 2, additions: 45, deletions: 12 },
];

const PULL_REQUESTS = [
  { id: "#142", title: "feat: JWT refresh token rotation", author: "Nguyễn Văn An", avatar: "NA", branch: "feature/user-auth → develop", status: "open", reviewers: ["TB", "TH"], approvals: 1, comments: 5, changes: "+142 / -23", checks: "running", created: "2h trước", labels: ["feature", "security"] },
  { id: "#141", title: "fix: login redirect loop", author: "Hoàng Thu Hà", avatar: "TH", branch: "hotfix/login-bug → main", status: "approved", reviewers: ["NA", "TB"], approvals: 2, comments: 3, changes: "+28 / -45", checks: "passed", created: "4h trước", labels: ["hotfix", "urgent"] },
  { id: "#140", title: "refactor: dashboard query optimization", author: "Phạm Minh Đức", avatar: "PD", branch: "feature/dashboard-v2 → develop", status: "changes_requested", reviewers: ["LC", "TH"], approvals: 0, comments: 8, changes: "+256 / -198", checks: "passed", created: "1d trước", labels: ["refactor", "performance"] },
  { id: "#139", title: "feat: WebSocket notification handler", author: "Trần Thị Bình", avatar: "TB", branch: "develop → main", status: "merged", reviewers: ["NA", "PD"], approvals: 2, comments: 2, changes: "+89 / -12", checks: "passed", created: "2d trước", labels: ["feature"] },
  { id: "#138", title: "perf: Redis caching layer", author: "Lê Hoàng Cường", avatar: "LC", branch: "feature/api-optimization → develop", status: "open", reviewers: ["TB"], approvals: 0, comments: 4, changes: "+167 / -34", checks: "failed", created: "2d trước", labels: ["performance", "backend"] },
];

const PIPELINES = [
  { id: "#289", branch: "feature/user-auth", commit: "a3f8e2d", status: "running", trigger: "Push", author: "NA", duration: "2m 34s", stages: [
    { name: "Build", status: "passed", duration: "45s" },
    { name: "Test", status: "running", duration: "1m 20s" },
    { name: "Lint", status: "pending", duration: "-" },
    { name: "Deploy", status: "pending", duration: "-" },
  ]},
  { id: "#288", branch: "hotfix/login-bug", commit: "b7c1f4a", status: "passed", trigger: "Push", author: "TH", duration: "4m 12s", stages: [
    { name: "Build", status: "passed", duration: "42s" },
    { name: "Test", status: "passed", duration: "2m 05s" },
    { name: "Lint", status: "passed", duration: "35s" },
    { name: "Deploy", status: "passed", duration: "50s" },
  ]},
  { id: "#287", branch: "feature/api-optimization", commit: "f1a2c8d", status: "failed", trigger: "Push", author: "LC", duration: "3m 08s", stages: [
    { name: "Build", status: "passed", duration: "40s" },
    { name: "Test", status: "failed", duration: "2m 28s" },
    { name: "Lint", status: "skipped", duration: "-" },
    { name: "Deploy", status: "skipped", duration: "-" },
  ]},
  { id: "#286", branch: "develop", commit: "e4f7b3c", status: "passed", trigger: "Merge", author: "TB", duration: "5m 45s", stages: [
    { name: "Build", status: "passed", duration: "48s" },
    { name: "Test", status: "passed", duration: "3m 12s" },
    { name: "Lint", status: "passed", duration: "30s" },
    { name: "Deploy", status: "passed", duration: "1m 15s" },
  ]},
];

const DEPLOYMENTS = [
  { env: "Production", version: "v2.0.8", status: "active", deployedAt: "15/03 14:30", deployedBy: "Trần Thị Bình", uptime: "99.97%", url: "app.vwork.io", icon: <Rocket className="w-4 h-4" />, color: "#059669" },
  { env: "Staging", version: "v2.1.0-rc.2", status: "active", deployedAt: "18/03 09:15", deployedBy: "Hoàng Thu Hà", uptime: "99.5%", url: "staging.vwork.io", icon: <Globe className="w-4 h-4" />, color: "#0891b2" },
  { env: "Development", version: "v2.1.0-dev.34", status: "deploying", deployedAt: "18/03 10:45", deployedBy: "Nguyễn Văn An", uptime: "-", url: "dev.vwork.io", icon: <Server className="w-4 h-4" />, color: "#7c3aed" },
];

type GitTab = "commits" | "branches" | "prs" | "pipelines" | "deployments";

const statusIcon = (status: string) => {
  switch (status) {
    case "passed": case "active": case "merged": case "approved": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "running": case "deploying": return <Loader2 className="w-3.5 h-3.5 text-cyan-500 animate-spin" />;
    case "failed": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    case "pending": case "skipped": return <Circle className="w-3.5 h-3.5 text-gray-300" />;
    case "open": return <GitPullRequest className="w-3.5 h-3.5 text-cyan-500" />;
    case "changes_requested": return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
    default: return <Circle className="w-3.5 h-3.5 text-gray-400" />;
  }
};

const statusLabel = (status: string) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    passed: { label: "Passed", bg: "bg-emerald-50", text: "text-emerald-700" },
    running: { label: "Running", bg: "bg-cyan-50", text: "text-cyan-700" },
    failed: { label: "Failed", bg: "bg-red-50", text: "text-red-700" },
    pending: { label: "Pending", bg: "bg-gray-50", text: "text-gray-500" },
    open: { label: "Open", bg: "bg-cyan-50", text: "text-cyan-700" },
    approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700" },
    merged: { label: "Merged", bg: "bg-violet-50", text: "text-violet-700" },
    changes_requested: { label: "Changes Requested", bg: "bg-amber-50", text: "text-amber-700" },
    active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700" },
    deploying: { label: "Deploying", bg: "bg-cyan-50", text: "text-cyan-700" },
  };
  const s = map[status] || { label: status, bg: "bg-gray-50", text: "text-gray-500" };
  return <span className={`${s.bg} ${s.text} px-2 py-0.5 rounded-md text-[10px]`}>{s.label}</span>;
};

export function GitDevOpsView() {
  const [activeTab, setActiveTab] = useState<GitTab>("commits");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { key: GitTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "commits", label: "Commits", icon: <GitCommit className="w-3.5 h-3.5" />, count: COMMITS.length },
    { key: "branches", label: "Branches", icon: <GitBranch className="w-3.5 h-3.5" />, count: BRANCHES.length },
    { key: "prs", label: "Pull Requests", icon: <GitPullRequest className="w-3.5 h-3.5" />, count: PULL_REQUESTS.filter(p => p.status !== "merged").length },
    { key: "pipelines", label: "CI/CD Pipelines", icon: <Play className="w-3.5 h-3.5" />, count: PIPELINES.length },
    { key: "deployments", label: "Deployments", icon: <Rocket className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 h-full overflow-auto bg-gray-50/50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] text-gray-900">Git & DevOps</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Source code, CI/CD pipelines & deployments</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[11px] text-gray-500">
              <GitBranch className="w-3.5 h-3.5" />
              <span>github.com/vwork-pro/app</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Commits (tuần)", value: "47", icon: <GitCommit className="w-4 h-4" />, color: "text-gray-600" },
            { label: "Open PRs", value: PULL_REQUESTS.filter(p => p.status === "open").length.toString(), icon: <GitPullRequest className="w-4 h-4" />, color: "text-cyan-600" },
            { label: "Active Branches", value: BRANCHES.filter(b => b.status === "active").length.toString(), icon: <GitBranch className="w-4 h-4" />, color: "text-violet-600" },
            { label: "Pipeline Pass Rate", value: "75%", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600" },
            { label: "Deploy (tháng)", value: "12", icon: <Rocket className="w-4 h-4" />, color: "text-amber-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[16px] text-gray-900">{stat.value}</p>
                <p className="text-[9px] text-gray-400">{stat.label}</p>
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
                activeTab === tab.key ? "bg-cyan-50 text-cyan-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
              {tab.count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-cyan-200 text-cyan-800" : "bg-gray-100 text-gray-500"}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Commits Tab */}
        {activeTab === "commits" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input placeholder="Tìm commit..." className="flex-1 text-[11px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                <GitBranch className="w-3.5 h-3.5" /> All branches <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {COMMITS.map((commit, i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-50/50 transition-all flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-[9px] shrink-0 mt-0.5">{commit.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] text-gray-800 hover:text-cyan-700 cursor-pointer transition-all">{commit.message}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{commit.time}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <code className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded font-mono cursor-pointer hover:bg-cyan-100">{commit.hash}</code>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" />{commit.branch}</span>
                      <span className="text-[10px] text-gray-400">{commit.author}</span>
                      <span className="text-[10px] text-emerald-600">+{commit.additions}</span>
                      <span className="text-[10px] text-red-500">-{commit.deletions}</span>
                      <span className="text-[10px] text-gray-400">{commit.files} files</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === "branches" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {BRANCHES.map((branch, i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-50/50 transition-all flex items-center gap-3">
                  <GitBranch className={`w-4 h-4 shrink-0 ${branch.status === "protected" ? "text-amber-500" : branch.status === "release" ? "text-violet-500" : "text-cyan-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[12px] text-gray-800 font-mono">{branch.name}</code>
                      {branch.status === "protected" && <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Protected</span>}
                      {branch.status === "release" && <span className="text-[9px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" /> Release</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-400">{branch.author} — {branch.lastCommit}</span>
                      {branch.ahead > 0 && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑{branch.ahead} ahead</span>}
                      {branch.behind > 0 && <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">↓{branch.behind} behind</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(branch.pipeline)}
                    {statusLabel(branch.pipeline)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pull Requests Tab */}
        {activeTab === "prs" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {["all", "open", "approved", "changes_requested", "merged"].map(f => (
                <button key={f} className={`px-3 py-1.5 rounded-lg text-[11px] transition-all ${f === "all" ? "bg-cyan-50 text-cyan-700" : "text-gray-500 hover:bg-gray-50"}`}>
                  {f === "all" ? "Tất cả" : f === "open" ? "Open" : f === "approved" ? "Approved" : f === "changes_requested" ? "Changes" : "Merged"}
                </button>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {PULL_REQUESTS.map((pr, i) => (
                <div key={i} className="px-4 py-4 hover:bg-gray-50/50 transition-all">
                  <div className="flex items-start gap-3">
                    {statusIcon(pr.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[12px] text-gray-800 hover:text-cyan-700 cursor-pointer">{pr.title}</span>
                          <span className="text-[11px] text-gray-400 ml-2">{pr.id}</span>
                        </div>
                        {statusLabel(pr.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" />{pr.branch}</span>
                        <span className="text-[10px] text-gray-400">{pr.author}</span>
                        <span className="text-[10px] text-gray-400">{pr.created}</span>
                        <span className="text-[10px] text-emerald-600">{pr.changes.split("/")[0].trim()}</span>
                        <span className="text-[10px] text-red-500">{pr.changes.split("/")[1].trim()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {pr.labels.map(l => (
                          <span key={l} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{l}</span>
                        ))}
                        <span className="text-[9px] text-gray-400 ml-2">💬 {pr.comments}</span>
                        <span className="text-[9px] text-emerald-600">✓ {pr.approvals}/{pr.reviewers.length}</span>
                        <div className="flex -space-x-1 ml-2">
                          {pr.reviewers.map(r => (
                            <div key={r} className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 border border-white">{r}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pipelines Tab */}
        {activeTab === "pipelines" && (
          <div className="space-y-3">
            {PIPELINES.map((pipeline, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3">
                  {statusIcon(pipeline.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-800">Pipeline {pipeline.id}</span>
                      {statusLabel(pipeline.status)}
                      <span className="text-[10px] text-gray-400 ml-auto">{pipeline.duration}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded font-mono">{pipeline.commit}</code>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" />{pipeline.branch}</span>
                      <span className="text-[10px] text-gray-400">{pipeline.trigger} by {pipeline.author}</span>
                    </div>
                  </div>
                  <button className="px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 rounded-lg"><RotateCcw className="w-3 h-3" /></button>
                </div>
                {/* Pipeline stages */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1">
                    {pipeline.stages.map((stage, si) => (
                      <div key={si} className="flex items-center gap-1 flex-1">
                        <div className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] ${
                          stage.status === "passed" ? "bg-emerald-50 text-emerald-700" :
                          stage.status === "running" ? "bg-cyan-50 text-cyan-700" :
                          stage.status === "failed" ? "bg-red-50 text-red-700" :
                          "bg-gray-50 text-gray-400"
                        }`}>
                          {stage.status === "running" ? <Loader2 className="w-3 h-3 animate-spin" /> : statusIcon(stage.status)}
                          {stage.name}
                          <span className="ml-auto text-[9px] opacity-70">{stage.duration}</span>
                        </div>
                        {si < pipeline.stages.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === "deployments" && (
          <div className="space-y-4">
            {DEPLOYMENTS.map((dep, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: dep.color }}>
                    {dep.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-gray-900">{dep.env}</span>
                      {statusLabel(dep.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1"><Tag className="w-3 h-3" />{dep.version}</span>
                      <span className="text-[11px] text-gray-400">{dep.deployedAt}</span>
                      <span className="text-[11px] text-gray-400">by {dep.deployedBy}</span>
                      {dep.uptime !== "-" && <span className="text-[11px] text-emerald-600">Uptime: {dep.uptime}</span>}
                    </div>
                  </div>
                  <a href="#" className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-cyan-600 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-all">
                    <Globe className="w-3.5 h-3.5" /> {dep.url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}

            {/* Deployment History */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-[14px] text-gray-900 mb-4">Lịch sử triển khai gần đây</h3>
              <div className="space-y-2">
                {[
                  { env: "Production", version: "v2.0.8", time: "15/03 14:30", by: "TB", status: "success" },
                  { env: "Staging", version: "v2.1.0-rc.1", time: "14/03 16:00", by: "TH", status: "success" },
                  { env: "Production", version: "v2.0.7", time: "10/03 11:20", by: "NA", status: "success" },
                  { env: "Staging", version: "v2.0.8-rc.3", time: "09/03 09:45", by: "PD", status: "rollback" },
                  { env: "Development", version: "v2.1.0-dev.28", time: "08/03 17:30", by: "LC", status: "failed" },
                ].map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100/80 transition-all">
                    {h.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : h.status === "rollback" ? <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    <span className="text-[11px] text-gray-600 w-24">{h.env}</span>
                    <code className="text-[10px] text-gray-800 font-mono">{h.version}</code>
                    <span className="text-[10px] text-gray-400 ml-auto">{h.time} — {h.by}</span>
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
