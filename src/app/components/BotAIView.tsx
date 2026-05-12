import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Bot, Send, Sparkles, Zap, Code2, FileText, Bug, BarChart3,
  CheckCircle2, Clock, Users, GitBranch, Lightbulb, Wand2,
  ChevronDown, Copy, ThumbsUp, ThumbsDown, RotateCcw, Pause,
  Play, Settings, Plus, X, Star, Loader2, ArrowRight,
  AlertTriangle, Target, Calendar, Search, Hash, Brain,
  Shield, Database, Terminal, Layers, RefreshCw, MessageSquare,
  Eye
} from "lucide-react";

import { copyToClipboard } from "./clipboard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  typing?: boolean;
  codeBlock?: { language: string; code: string };
  actions?: { label: string; icon: React.ReactNode; onClick?: () => void }[];
  suggestions?: string[];
}

const AI_AGENTS = [
  { id: "general", name: "VWork AI Assistant", desc: "Trợ lý thông minh đa năng", icon: <Bot className="w-5 h-5" />, color: "#6366f1", status: "online" },
  { id: "coder", name: "Code Copilot", desc: "Hỗ trợ viết code, review & debug", icon: <Code2 className="w-5 h-5" />, color: "#0891b2", status: "online" },
  { id: "pm", name: "PM Agent", desc: "Quản lý dự án, sprint planning", icon: <Target className="w-5 h-5" />, color: "#7c3aed", status: "online" },
  { id: "qa", name: "QA Bot", desc: "Tạo test case, phát hiện bug", icon: <Bug className="w-5 h-5" />, color: "#d97706", status: "online" },
  { id: "doc", name: "Doc Writer", desc: "Viết tài liệu, specs, API docs", icon: <FileText className="w-5 h-5" />, color: "#059669", status: "online" },
  { id: "analyst", name: "Data Analyst", desc: "Phân tích dữ liệu & báo cáo", icon: <BarChart3 className="w-5 h-5" />, color: "#dc2626", status: "idle" },
];

const QUICK_PROMPTS = [
  { label: "Tạo sprint mới", icon: <Zap className="w-3.5 h-3.5" />, prompt: "Giúp tôi tạo sprint mới cho tuần tới với backlog hiện tại" },
  { label: "Review code", icon: <Code2 className="w-3.5 h-3.5" />, prompt: "Review đoạn code và đề xuất cải thiện" },
  { label: "Viết test case", icon: <Bug className="w-3.5 h-3.5" />, prompt: "Viết test case cho module authentication" },
  { label: "Sprint report", icon: <BarChart3 className="w-3.5 h-3.5" />, prompt: "Tạo báo cáo sprint hiện tại" },
  { label: "Viết API docs", icon: <FileText className="w-3.5 h-3.5" />, prompt: "Viết API documentation cho endpoint mới" },
  { label: "Phân tích bugs", icon: <AlertTriangle className="w-3.5 h-3.5" />, prompt: "Phân tích danh sách bugs hiện tại và đề xuất ưu tiên fix" },
  { label: "Estimate task", icon: <Clock className="w-3.5 h-3.5" />, prompt: "Ước lượng thời gian cho các task trong backlog" },
  { label: "Standup summary", icon: <Users className="w-3.5 h-3.5" />, prompt: "Tóm tắt nội dung daily standup hôm nay" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Xin chào! Tôi là **VWork AI Assistant** - trợ lý AI thông minh của bạn. Tôi có thể giúp bạn:\n\n• **Quản lý dự án**: Tạo sprint, phân công task, lên kế hoạch\n• **Viết & review code**: Suggest code, debug, code review\n• **Tài liệu**: Viết specs, API docs, meeting notes\n• **Testing**: Tạo test case, phân tích bugs\n• **Báo cáo**: Sprint report, analytics, insights\n\nBạn cần tôi hỗ trợ gì?",
    timestamp: "10:00",
    suggestions: ["Tạo sprint mới", "Review PR mới nhất", "Viết API docs cho module user", "Báo cáo tiến độ dự án"],
  },
];

export function BotAIView() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeAgent = AI_AGENTS.find(a => a.id === selectedAgent) || AI_AGENTS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    const responses: Record<string, { content: string; codeBlock?: { language: string; code: string }; actions?: { label: string; icon: React.ReactNode }[]; suggestions?: string[] }> = {
      sprint: {
        content: "Dựa trên backlog hiện tại, tôi đề xuất **Sprint 5** như sau:\n\n📅 **Thời gian**: 19/03 — 01/04/2026 (2 tuần)\n🎯 **Sprint Goal**: Hoàn thiện module Authentication v2\n📊 **Capacity**: 35 Story Points\n\n**Danh sách tasks đề xuất:**\n\n| # | Task | SP | Assignee | Priority |\n|---|------|----|----------|----------|\n| 1 | Implement OAuth2 flow | 8 | Nguyễn Văn An | Cao |\n| 2 | Refresh token rotation | 5 | Hoàng Thu Hà | Cao |\n| 3 | Session management UI | 5 | Phạm Minh Đức | TB |\n| 4 | 2FA setup page | 8 | Trần Thị Bình | Cao |\n| 5 | Integration tests | 5 | Lê Hoàng Cường | TB |\n| 6 | API documentation | 3 | Hoàng Thu Hà | Thấp |\n| 7 | Security audit prep | 1 | Nguyễn Văn An | Thấp |",
        actions: [
          { label: "Tạo Sprint này", icon: <Zap className="w-3 h-3" /> },
          { label: "Điều chỉnh", icon: <Settings className="w-3 h-3" /> },
          { label: "Xuất Markdown", icon: <Copy className="w-3 h-3" /> },
        ],
        suggestions: ["Thêm task cho QA", "Giảm capacity xuống 30 SP", "Đổi assignee task #3"],
      },
      review: {
        content: "Tôi đã review **PR #142: JWT refresh token rotation** và có một số nhận xét:\n\n✅ **Tốt:**\n- Logic rotation token đúng chuẩn RFC 6749\n- Error handling đầy đủ\n- Unit test coverage 85%\n\n⚠️ **Cần cải thiện:**\n- Token expiry nên configurable thay vì hardcode\n- Thiếu rate limiting cho refresh endpoint\n- Nên thêm logging cho security audit\n\n🔴 **Vấn đề bảo mật:**\n- Refresh token chưa được hash trước khi lưu DB\n\nĐây là đoạn code tôi suggest sửa:",
        codeBlock: {
          language: "typescript",
          code: `// Before (insecure)
await db.tokens.create({
  refreshToken: token, // ⚠️ Plain text
  userId: user.id,
});

// After (secure)
import { createHash } from 'crypto';

const hashedToken = createHash('sha256')
  .update(token)
  .digest('hex');

await db.tokens.create({
  refreshToken: hashedToken, // ✅ Hashed
  userId: user.id,
  expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL),
});`,
        },
        actions: [
          { label: "Apply suggestion", icon: <Wand2 className="w-3 h-3" /> },
          { label: "Comment on PR", icon: <MessageSquare className="w-3 h-3" /> },
        ],
        suggestions: ["Viết thêm test cho case này", "Kiểm tra cả token revocation", "Review thêm PR #138"],
      },
      default: {
        content: "Tôi hiểu yêu cầu của bạn. Hãy để tôi phân tích và đưa ra kết quả...\n\n📊 **Phân tích nhanh:**\n\n- Dự án hiện có **40 tasks** trong sprint hiện tại\n- **28 tasks** đã hoàn thành (70%)\n- **3 tasks** đang bị trễ deadline\n- **5 bugs** mở (2 critical)\n\n💡 **Đề xuất:**\n1. Ưu tiên fix 2 bugs critical trước khi sprint kết thúc\n2. Chuyển 3 tasks chưa bắt đầu sang sprint tiếp theo\n3. Cần thêm 1 QA engineer cho đợt release sắp tới\n\nBạn muốn tôi đi sâu vào phần nào?",
        suggestions: ["Chi tiết về bugs critical", "Xem danh sách tasks trễ", "Lên kế hoạch release"],
      },
    };

    setTimeout(() => {
      const lowerMsg = userMessage.toLowerCase();
      let response;
      if (lowerMsg.includes("sprint") && (lowerMsg.includes("tạo") || lowerMsg.includes("mới") || lowerMsg.includes("lên kế hoạch"))) {
        response = responses.sprint;
      } else if (lowerMsg.includes("review") || lowerMsg.includes("code") || lowerMsg.includes("pr")) {
        response = responses.review;
      } else {
        response = responses.default;
      }

      const newMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response.content,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        codeBlock: response.codeBlock,
        actions: response.actions,
        suggestions: response.suggestions,
      };
      setMessages(prev => [...prev, newMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    simulateResponse(input.trim());
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: suggestion,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    simulateResponse(suggestion);
  };

  const handleReaction = useCallback((msgId: string, type: "up" | "down") => {
    setReactions(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }));
    const isRemoving = reactions[msgId] === type;
    if (!isRemoving) {
      toast.success(type === "up" ? "Đã đánh giá hữu ích ✓" : "Đã ghi nhận phản hồi", { duration: 1500 });
    }
  }, [reactions]);

  const handleCopyMessage = useCallback((content: string, codeBlock?: { language: string; code: string }) => {
    const textToCopy = codeBlock ? `${content}\n\n\`\`\`${codeBlock.language}\n${codeBlock.code}\n\`\`\`` : content;
    // Strip markdown bold
    const clean = textToCopy.replace(/\*\*(.*?)\*\*/g, "$1");
    copyToClipboard(clean).then(() => {
      toast.success("Đã sao chép tin nhắn", { duration: 1500 });
    }).catch(() => {
      toast.error("Không thể sao chép");
    });
  }, []);

  const handleRegenerate = useCallback((msgId: string) => {
    // Find the user message before this assistant message
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex <= 0) return;
    // Find the preceding user message
    let userMsg = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMsg = messages[i].content;
        break;
      }
    }
    if (!userMsg) return;
    // Remove the old assistant message and regenerate
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setReactions(prev => { const n = { ...prev }; delete n[msgId]; return n; });
    simulateResponse(userMsg);
    toast.success("Đang tạo lại câu trả lời...", { duration: 1500 });
  }, [messages]);

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    return text.split("\n").map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Table
      if (line.startsWith("|")) {
        return <div key={i} className="text-[11px] font-mono text-gray-600" dangerouslySetInnerHTML={{ __html: line }} />;
      }
      // Bullet
      if (line.startsWith("•") || line.startsWith("- ")) {
        return <div key={i} className="pl-2 text-[12px] text-gray-700" dangerouslySetInnerHTML={{ __html: line }} />;
      }
      // Numbered list
      if (/^\d+\./.test(line)) {
        return <div key={i} className="pl-2 text-[12px] text-gray-700" dangerouslySetInnerHTML={{ __html: line }} />;
      }
      // Empty
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <div key={i} className="text-[12px] text-gray-700" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  const CHAT_HISTORY = [
    { id: "1", title: "Sprint 4 Planning", time: "Hôm nay", agent: "PM Agent", agentId: "pm" },
    { id: "2", title: "Review PR #140", time: "Hôm qua", agent: "Code Copilot", agentId: "coder" },
    { id: "3", title: "Bug analysis report", time: "16/03", agent: "QA Bot", agentId: "qa" },
    { id: "4", title: "API documentation v2.1", time: "15/03", agent: "Doc Writer", agentId: "doc" },
    { id: "5", title: "Performance optimization", time: "14/03", agent: "Code Copilot", agentId: "coder" },
  ];

  const HISTORY_CONVERSATIONS: Record<string, ChatMessage[]> = {
    "1": [
      { id: "h1-1", role: "user", content: "Giúp tôi lên kế hoạch Sprint 4", timestamp: "09:00" },
      { id: "h1-2", role: "assistant", content: "Dựa trên backlog hiện tại, tôi đề xuất **Sprint 4** như sau:\n\n📅 **Thời gian**: 05/03 — 18/03/2026\n🎯 **Sprint Goal**: Hoàn thiện module Dashboard v2\n📊 **Capacity**: 40 Story Points\n\n**Tasks đề xuất:**\n• Dashboard redesign — 8 SP\n• Widget system — 5 SP\n• Real-time updates — 8 SP\n• Performance optimization — 5 SP\n• Unit tests — 5 SP\n• Documentation — 3 SP\n• Bug fixes backlog — 6 SP", timestamp: "09:01", suggestions: ["Điều chỉnh capacity", "Thêm task QA"] },
      { id: "h1-3", role: "user", content: "Capacity hợp lý, hãy tạo sprint này", timestamp: "09:05" },
      { id: "h1-4", role: "assistant", content: "✅ Đã tạo **Sprint 4** thành công!\n\n📋 **7 tasks** đã được thêm vào sprint\n👥 **5 thành viên** được assign\n📊 Tổng **40 Story Points**\n\nSprint sẽ bắt đầu vào ngày 05/03. Tôi đã gửi thông báo đến tất cả thành viên.", timestamp: "09:06" },
    ],
    "2": [
      { id: "h2-1", role: "user", content: "Review PR #140 cho mình", timestamp: "14:00" },
      { id: "h2-2", role: "assistant", content: "Tôi đã review **PR #140: Implement caching layer**\n\n✅ **Tốt:**\n- Sử dụng Redis cache pattern đúng chuẩn\n- TTL được config linh hoạt\n- Có cache invalidation strategy\n\n⚠️ **Cần cải thiện:**\n- Cache key naming chưa nhất quán\n- Thiếu circuit breaker khi Redis down\n- Nên thêm cache warming cho cold start\n\n🔴 **Issue:**\n- Race condition khi multiple writes cùng lúc", timestamp: "14:02",
        codeBlock: { language: "typescript", code: "// Suggest: Add distributed lock\nimport { Redlock } from 'redlock';\n\nconst lock = await redlock.acquire(\n  [`lock:${cacheKey}`],\n  5000\n);\ntry {\n  await cache.set(cacheKey, value, ttl);\n} finally {\n  await lock.release();\n}" },
        suggestions: ["Apply fix này", "Xem thêm về race condition"] },
    ],
    "3": [
      { id: "h3-1", role: "user", content: "Phân tích danh sách bugs hiện tại", timestamp: "10:30" },
      { id: "h3-2", role: "assistant", content: "📊 **Báo cáo Bug Analysis**\n\n🔴 **Critical (2):**\n• BUG-201: Memory leak trong WebSocket handler\n• BUG-198: Data loss khi concurrent edit\n\n🟡 **Medium (5):**\n• BUG-205: UI glitch trên Safari\n• BUG-203: Timezone sai cho user châu Âu\n• BUG-200: Search không index tiếng Việt\n• BUG-199: Notification delay > 30s\n• BUG-196: Avatar upload fail > 2MB\n\n🟢 **Low (3):**\n• BUG-204: Tooltip bị cắt ở edge\n• BUG-202: Dark mode color inconsistency\n• BUG-197: Typo trong email template\n\n💡 **Đề xuất ưu tiên:** Fix 2 critical bugs trước sprint end, schedule medium bugs cho sprint tiếp theo.", timestamp: "10:32", suggestions: ["Chi tiết BUG-201", "Assign bugs cho team", "Tạo sprint cho bug fixes"] },
    ],
    "4": [
      { id: "h4-1", role: "user", content: "Viết API documentation cho module User v2.1", timestamp: "11:00" },
      { id: "h4-2", role: "assistant", content: "📄 **API Documentation — User Module v2.1**\n\n**Base URL:** `/api/v2.1/users`\n\n**Endpoints:**\n\n• `GET /users` — Danh sách users (paginated)\n• `GET /users/:id` — Chi tiết user\n• `POST /users` — Tạo user mới\n• `PUT /users/:id` — Cập nhật user\n• `DELETE /users/:id` — Xóa user\n• `POST /users/:id/avatar` — Upload avatar\n• `GET /users/:id/activity` — Lịch sử hoạt động\n\n**Authentication:** Bearer token (JWT)\n**Rate limit:** 100 requests/minute", timestamp: "11:03",
        codeBlock: { language: "json", code: "// GET /users?page=1&limit=20\n{\n  \"data\": [\n    {\n      \"id\": \"usr_abc123\",\n      \"name\": \"Nguyễn Văn An\",\n      \"email\": \"an@vwork.io\",\n      \"role\": \"developer\",\n      \"avatar\": \"https://...\",\n      \"createdAt\": \"2026-01-15T08:00:00Z\"\n    }\n  ],\n  \"pagination\": {\n    \"page\": 1,\n    \"limit\": 20,\n    \"total\": 45\n  }\n}" },
        suggestions: ["Thêm error responses", "Viết cho module Project", "Export Swagger/OpenAPI"] },
    ],
    "5": [
      { id: "h5-1", role: "user", content: "Phân tích performance và đề xuất optimization", timestamp: "15:00" },
      { id: "h5-2", role: "assistant", content: "⚡ **Performance Analysis Report**\n\n**Current metrics:**\n• FCP: 1.8s (mục tiêu < 1.5s) ⚠️\n• LCP: 2.9s (mục tiêu < 2.5s) 🔴\n• TTI: 3.2s (mục tiêu < 3.0s) ⚠️\n• CLS: 0.05 ✅\n• Bundle size: 1.2MB (mục tiêu < 800KB) 🔴\n\n**Top bottlenecks:**\n1. Bundle quá lớn — thiếu code splitting\n2. Images chưa lazy load\n3. API waterfall — 6 sequential calls on mount\n4. Re-renders không cần thiết ở Dashboard\n\n💡 **Đề xuất optimization:**\n1. Implement React.lazy + Suspense cho route-based splitting\n2. Sử dụng next/image hoặc lazy loading\n3. Batch API calls với Promise.all\n4. Thêm React.memo + useMemo cho Dashboard widgets\n5. Enable gzip/brotli compression\n\n**Estimated improvement:** FCP -40%, LCP -35%, Bundle -50%", timestamp: "15:04", suggestions: ["Implement code splitting", "Setup monitoring", "Benchmark sau optimize"] },
    ],
  };

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-gray-50/50">
      {/* Left: Chat History */}
      <div className={`${showHistory ? "w-[260px]" : "w-0"} transition-all duration-200 overflow-hidden border-r border-gray-100 bg-white flex flex-col shrink-0`}>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-gray-700">Lịch sử chat</span>
            <button onClick={() => { setMessages(INITIAL_MESSAGES); setActiveChatId(null); setReactions({}); }} className="text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Mới</button>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
            <Search className="w-3 h-3 text-gray-400" />
            <input placeholder="Tìm cuộc trò chuyện..." className="flex-1 text-[11px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {CHAT_HISTORY.map(h => (
            <button
              key={h.id}
              onClick={() => {
                const conv = HISTORY_CONVERSATIONS[h.id];
                if (conv) {
                  setMessages(conv);
                  setActiveChatId(h.id);
                  setSelectedAgent(h.agentId);
                  setReactions({});
                }
              }}
              className={`w-full px-4 py-2.5 text-left transition-all ${
                activeChatId === h.id
                  ? "bg-cyan-50 border-r-2 border-cyan-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className={`text-[11px] truncate ${activeChatId === h.id ? "text-cyan-700" : "text-gray-800"}`}>{h.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-gray-400">{h.time}</span>
                <span className="text-[9px] text-cyan-500">{h.agent}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
          <button onClick={() => setShowHistory(!showHistory)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
            <Layers className="w-4 h-4" />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-all"
            style={{ backgroundColor: activeAgent.color }}
            onClick={() => setShowAgentPanel(!showAgentPanel)}
          >
            {activeAgent.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-800">{activeAgent.name}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600">Online</span>
            </div>
            <p className="text-[10px] text-gray-400">{activeAgent.desc}</p>
          </div>
          <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5" style={{ backgroundColor: activeAgent.color }}>
                  {activeAgent.icon}
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-cyan-500 text-white"
                    : "bg-white border border-gray-100 shadow-sm"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-[12px]">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  )}
                  {/* Code Block */}
                  {msg.codeBlock && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
                        <span className="text-[10px] text-gray-400">{msg.codeBlock.language}</span>
                        <button className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-all">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <pre className="px-3 py-3 bg-gray-900 overflow-x-auto">
                        <code className="text-[11px] text-gray-300 font-mono whitespace-pre">{msg.codeBlock.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
                {/* Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {msg.actions.map((action, i) => (
                      <button key={i} className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-all">
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, i) => (
                      <button key={i} onClick={() => handleSuggestionClick(sug)} className="px-3 py-1.5 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-all">
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
                {/* Timestamp + reactions */}
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-gray-400">{msg.timestamp}</span>
                    <button
                      onClick={() => handleReaction(msg.id, "up")}
                      className={`transition-all ${reactions[msg.id] === "up" ? "text-emerald-500 scale-110" : "text-gray-300 hover:text-emerald-500"}`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleReaction(msg.id, "down")}
                      className={`transition-all ${reactions[msg.id] === "down" ? "text-red-500 scale-110" : "text-gray-300 hover:text-red-500"}`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopyMessage(msg.content, msg.codeBlock)}
                      className="text-gray-300 hover:text-gray-500 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRegenerate(msg.id)}
                      className="text-gray-300 hover:text-gray-500 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {msg.role === "user" && (
                  <div className="flex justify-end mt-1"><span className="text-[9px] text-gray-400">{msg.timestamp}</span></div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: activeAgent.color }}>
                {activeAgent.icon}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] text-gray-400 ml-1">Đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-5 pb-2">
            <p className="text-[10px] text-gray-400 mb-2">Gợi ý nhanh:</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(qp.prompt)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all text-left"
                >
                  <span className="text-gray-400">{qp.icon}</span>
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-200 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Hỏi ${activeAgent.name}...`}
                rows={1}
                className="w-full px-4 py-3 text-[12px] bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 resize-none"
                style={{ maxHeight: "120px" }}
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 rounded-lg hover:bg-gray-200/50 flex items-center justify-center text-gray-400 transition-all"><Terminal className="w-3.5 h-3.5" /></button>
                  <button className="w-7 h-7 rounded-lg hover:bg-gray-200/50 flex items-center justify-center text-gray-400 transition-all"><FileText className="w-3.5 h-3.5" /></button>
                  <button className="w-7 h-7 rounded-lg hover:bg-gray-200/50 flex items-center justify-center text-gray-400 transition-all"><Database className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-400">Shift+Enter for new line</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 flex items-center justify-center text-white shadow-md shadow-cyan-200/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mb-1"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Agent Panel */}
      <div className={`${showAgentPanel ? "w-[280px]" : "w-0"} transition-all duration-200 overflow-hidden border-l border-gray-100 bg-white flex flex-col shrink-0`}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[12px] text-gray-700">AI Agents</span>
          <button onClick={() => setShowAgentPanel(false)} className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {AI_AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => { setSelectedAgent(agent.id); setShowAgentPanel(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedAgent === agent.id
                  ? "bg-cyan-50 border border-cyan-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: agent.color }}>
                {agent.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-800 truncate">{agent.name}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${agent.status === "online" ? "bg-emerald-500" : "bg-amber-400"}`} />
                </div>
                <p className="text-[9px] text-gray-400 truncate mt-0.5">{agent.desc}</p>
              </div>
              {selectedAgent === agent.id && <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />}
            </button>
          ))}
        </div>

        {/* Agent capabilities */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Khả năng</p>
          <div className="space-y-1.5">
            {[
              { label: "Đọc context dự án", icon: <Eye className="w-3 h-3" /> },
              { label: "Truy cập task & sprint", icon: <Target className="w-3 h-3" /> },
              { label: "Phân tích code", icon: <Code2 className="w-3 h-3" /> },
              { label: "Tạo & gán task", icon: <CheckCircle2 className="w-3 h-3" /> },
              { label: "Viết tài liệu", icon: <FileText className="w-3 h-3" /> },
            ].map((cap, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="text-emerald-500">{cap.icon}</span>
                {cap.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}