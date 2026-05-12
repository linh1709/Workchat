import type { DocFolder, Doc } from "./docs-types";

export const docIcons = ["📄","📋","🔌","📝","🔄","🏗️","🚀","📚","🎨","🎯","🗄️","📊","📈","🔒","💡","⚙️","🧪","📐","🎮","💬","📦","🔧","📎","🗂️","✨","🌟","💎","🔥"];

export const templates = [
  { id: "blank", name: "Tài liệu trống", desc: "Bắt đầu từ trang trắng", icon: "📄", color: "#6b7280", content: "" },
  { id: "prd", name: "Product Requirements", desc: "Mẫu PRD chi tiết", icon: "📋", color: "#0891b2", content: "# Product Requirements Document\n\n## Tổng quan\n...\n\n## Mục tiêu\n...\n\n## User Stories\n...\n\n## Yêu cầu chức năng\n...\n\n## Yêu cầu phi chức năng\n..." },
  { id: "api", name: "API Documentation", desc: "Mẫu tài liệu API", icon: "🔌", color: "#059669", content: "# API Documentation\n\n## Authentication\n...\n\n## Endpoints\n\n### GET /api/v1/...\n...\n\n## Error Codes\n..." },
  { id: "meeting", name: "Meeting Notes", desc: "Ghi chú cuộc họp", icon: "📝", color: "#d97706", content: "# Meeting Notes\n\n**Ngày:** ...\n**Người tham gia:** ...\n\n## Nội dung thảo luận\n...\n\n## Action Items\n- [ ] ...\n\n## Kết luận\n..." },
  { id: "retro", name: "Sprint Retrospective", desc: "Retro cuối sprint", icon: "🔄", color: "#7c3aed", content: "# Sprint Retrospective\n\n## Went Well 🟢\n...\n\n## Needs Improvement 🟡\n...\n\n## Action Items 🔴\n..." },
  { id: "rfc", name: "RFC / Design Doc", desc: "Đề xuất kỹ thuật", icon: "🏗️", color: "#db2777", content: "# RFC: [Title]\n\n## Status: Draft\n\n## Context\n...\n\n## Proposed Solution\n...\n\n## Alternatives Considered\n...\n\n## Implementation Plan\n..." },
  { id: "onboard", name: "Onboarding Guide", desc: "Hướng dẫn thành viên mới", icon: "🚀", color: "#ea580c", content: "# Onboarding Guide\n\n## Chào mừng!\n...\n\n## Setup môi trường\n...\n\n## Quy trình làm việc\n...\n\n## Contacts\n..." },
  { id: "wiki", name: "Wiki / Knowledge Base", desc: "Kiến thức nội bộ", icon: "📚", color: "#4f46e5", content: "# Wiki: [Topic]\n\n## Giới thiệu\n...\n\n## Chi tiết\n...\n\n## FAQ\n...\n\n## Tài liệu tham khảo\n..." },
];

export const recentActivities = [
  { id: 1, user: "Nguyễn Minh", initials: "NM", color: "#0891b2", action: "đã chỉnh sửa", doc: "Product Requirements Document", time: "2 giờ trước", type: "edit" as const },
  { id: 2, user: "Trần Hương", initials: "TH", color: "#7c3aed", action: "đã bình luận trong", doc: "Product Requirements Document", time: "1 giờ trước", type: "comment" as const },
  { id: 3, user: "Lê Phúc", initials: "LP", color: "#059669", action: "đã tạo mới", doc: "API Documentation v2", time: "1 ngày trước", type: "create" as const },
  { id: 4, user: "Trần Hương", initials: "TH", color: "#7c3aed", action: "đã cập nhật", doc: "Design System Guide", time: "2 ngày trước", type: "edit" as const },
  { id: 5, user: "Phạm Lan", initials: "PL", color: "#d97706", action: "đã chia sẻ", doc: "Onboarding Checklist", time: "3 ngày trước", type: "share" as const },
  { id: 6, user: "Hoàng Đức", initials: "HĐ", color: "#db2777", action: "đã tạo mới", doc: "Meeting Notes - Q1 Review", time: "1 tuần trước", type: "create" as const },
  { id: 7, user: "Lê Phúc", initials: "LP", color: "#059669", action: "đã cập nhật", doc: "Database Schema v2", time: "2 tuần trước", type: "edit" as const },
  { id: 8, user: "Nguyễn Minh", initials: "NM", color: "#0891b2", action: "đã đánh dấu ⭐", doc: "Design System Guide", time: "2 tuần trước", type: "star" as const },
];

export const teamMembers = [
  { name: "Nguyễn Minh", initials: "NM", color: "#0891b2", role: "Product Manager", online: true, lastDoc: "Product Requirements Document" },
  { name: "Trần Hương", initials: "TH", color: "#7c3aed", role: "UI/UX Designer", online: true, lastDoc: "Design System Guide" },
  { name: "Lê Phúc", initials: "LP", color: "#059669", role: "Backend Developer", online: true, lastDoc: "API Documentation v2" },
  { name: "Phạm Lan", initials: "PL", color: "#d97706", role: "HR Manager", online: false, lastDoc: "Onboarding Checklist" },
  { name: "Hoàng Đức", initials: "HĐ", color: "#db2777", role: "Engineering Lead", online: false, lastDoc: "Meeting Notes - Q1 Review" },
  { name: "Vũ Anh", initials: "VA", color: "#ea580c", role: "Frontend Developer", online: true, lastDoc: "Brand Guidelines" },
];

export const initialFolders: DocFolder[] = [
  { id: "f1", name: "Product Specs", color: "#0891b2", parentId: null },
  { id: "f1a", name: "PRD", color: "#0891b2", parentId: "f1" },
  { id: "f1b", name: "Roadmap", color: "#0e7490", parentId: "f1" },
  { id: "f2", name: "Technical Docs", color: "#059669", parentId: null },
  { id: "f2a", name: "API", color: "#059669", parentId: "f2" },
  { id: "f2b", name: "Database", color: "#047857", parentId: "f2" },
  { id: "f3", name: "Design", color: "#7c3aed", parentId: null },
  { id: "f3a", name: "UI Components", color: "#6d28d9", parentId: "f3" },
  { id: "f4", name: "Meeting Notes", color: "#d97706", parentId: null },
  { id: "f5", name: "Processes", color: "#db2777", parentId: null },
  { id: "f6", name: "Wiki", color: "#4f46e5", parentId: null },
  { id: "f7", name: "Templates", color: "#ea580c", parentId: null },
  { id: "f8", name: "Archive", color: "#6b7280", parentId: null },
];

export const initialDocs: Doc[] = [
  {
    id: "d1", title: "Product Requirements Document", content: "# Product Requirements Document\n\n## Tổng quan sản phẩm\n\nVWork là nền tảng quản lý dự án thế hệ mới, kết hợp sức mạnh của Conversational UI...\n\n## Mục tiêu\n\n1. **Tăng năng suất 40%** thông qua tự động hóa quy trình\n2. **Giảm context-switching** bằng chat-centric approach\n3. **Real-time collaboration** cho team phân tán\n\n## User Stories\n\n- Là PM, tôi muốn tạo task từ chat message để tiết kiệm thời gian\n- Là Dev, tôi muốn nhận notification trong chat khi PR cần review\n- Là Designer, tôi muốn share mockup trực tiếp trong conversation",
    folderId: "f1a", category: "specs", author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM",
    created: "01/03/2026", updated: "2 giờ trước", updatedTimestamp: Date.now() - 2 * 3600000,
    pages: 24, shared: 5, color: "#0891b2", bg: "#ecfeff", icon: "📋",
    tags: ["product", "v2", "high-priority"],
    starred: true, locked: false, archived: false, deleted: false,
    sharedWith: [
      { name: "Trần Hương", initials: "TH", color: "#7c3aed", role: "editor" },
      { name: "Lê Phúc", initials: "LP", color: "#059669", role: "viewer" },
      { name: "Phạm Lan", initials: "PL", color: "#d97706", role: "editor" },
    ],
    versions: [
      { id: 3, date: "17/03 14:30", author: "Nguyễn Minh", summary: "Cập nhật User Stories section" },
      { id: 2, date: "15/03 10:00", author: "Trần Hương", summary: "Thêm wireframes references" },
      { id: 1, date: "01/03 09:00", author: "Nguyễn Minh", summary: "Tạo document ban đầu" },
    ],
    comments: [
      { id: 1, author: "Trần Hương", initials: "TH", color: "#7c3aed", text: "Phần User Stories nên thêm edge cases cho mobile", time: "1 giờ trước" },
      { id: 2, author: "Phạm Lan", initials: "PL", color: "#d97706", text: "LGTM! Ready for review 👍", time: "3 giờ trước" },
    ],
    collaborators: [
      { name: "Trần Hương", initials: "TH", color: "#7c3aed", online: true, cursor: "Section 3" },
      { name: "Phạm Lan", initials: "PL", color: "#d97706", online: false },
    ],
  },
  {
    id: "d2", title: "API Documentation v2", content: "# API Documentation\n\n## Base URL\n`https://api.vwork.dev/v2`\n\n## Authentication\nBearer token via OAuth 2.0\n\n## Endpoints\n\n### Tasks\n```\nGET    /tasks\nPOST   /tasks\nPUT    /tasks/:id\nDELETE /tasks/:id\n```\n\n### Projects\n...",
    folderId: "f2a", category: "technical", author: "Lê Phúc", authorColor: "#059669", authorInitial: "LP",
    created: "15/02/2026", updated: "1 ngày trước", updatedTimestamp: Date.now() - 86400000,
    pages: 48, shared: 8, color: "#059669", bg: "#ecfdf5", icon: "🔌",
    tags: ["api", "v2", "backend"],
    starred: false, locked: false, archived: false, deleted: false,
    sharedWith: [
      { name: "Nguyễn Minh", initials: "NM", color: "#0891b2", role: "editor" },
      { name: "Phạm Lan", initials: "PL", color: "#d97706", role: "viewer" },
    ],
    versions: [
      { id: 2, date: "16/03 16:00", author: "Lê Phúc", summary: "Thêm endpoints mới cho Tasks v2" },
      { id: 1, date: "15/02 11:00", author: "Lê Phúc", summary: "Initial API docs" },
    ],
    comments: [],
    collaborators: [{ name: "Lê Phúc", initials: "LP", color: "#059669", online: true }],
  },
  {
    id: "d3", title: "Design System Guide", content: "# Design System Guide\n\n## Colors\n\nPrimary: Cyan (#0891b2)\nSecondary: Violet (#7c3aed)\n\n## Typography\n\nFont: Inter\nHeadings: 600 weight\nBody: 400 weight\n\n## Components\n\n### Buttons\n...\n\n### Cards\n...",
    folderId: "f3a", category: "design", author: "Trần Hương", authorColor: "#7c3aed", authorInitial: "TH",
    created: "10/02/2026", updated: "2 ngày trước", updatedTimestamp: Date.now() - 172800000,
    pages: 32, shared: 6, color: "#7c3aed", bg: "#f3e8ff", icon: "🎨",
    tags: ["design", "ui", "components"],
    starred: true, locked: false, archived: false, deleted: false,
    sharedWith: [{ name: "Nguyễn Minh", initials: "NM", color: "#0891b2", role: "viewer" }],
    versions: [
      { id: 2, date: "15/03 09:00", author: "Trần Hương", summary: "Thêm Dark mode tokens" },
      { id: 1, date: "10/02 14:00", author: "Trần Hương", summary: "Initial design system" },
    ],
    comments: [{ id: 1, author: "Nguyễn Minh", initials: "NM", color: "#0891b2", text: "Cần thêm spacing scale", time: "2 ngày trước" }],
    collaborators: [],
  },
  {
    id: "d4", title: "Sprint 12 Retrospective", content: "# Sprint 12 Retrospective\n\n## Went Well 🟢\n- CI/CD pipeline hoàn thành\n- Chat module đạt 100% features\n- Team velocity tăng 15%\n\n## Needs Improvement 🟡\n- Code review chậm\n- Documentation thiếu\n\n## Action Items 🔴\n- [ ] Implement PR review SLA\n- [ ] Doc-as-code workflow",
    folderId: "f4", category: "meeting", author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM",
    created: "14/03/2026", updated: "3 ngày trước", updatedTimestamp: Date.now() - 259200000,
    pages: 8, shared: 4, color: "#d97706", bg: "#fefce8", icon: "🔄",
    tags: ["sprint", "retro"],
    starred: false, locked: false, archived: false, deleted: false,
    sharedWith: [], versions: [{ id: 1, date: "14/03 17:00", author: "Nguyễn Minh", summary: "Sprint 12 retro notes" }],
    comments: [], collaborators: [],
  },
  {
    id: "d5", title: "Onboarding Checklist", content: "# Onboarding Checklist\n\n## Ngày 1\n- [ ] Setup dev environment\n- [ ] Access to Slack, GitHub, Figma\n- [ ] Meet the team\n\n## Tuần 1\n- [ ] Complete codebase walkthrough\n- [ ] First PR merged\n- [ ] 1:1 with manager\n\n## Tháng 1\n- [ ] Own a feature end-to-end\n- [ ] Knowledge sharing session",
    folderId: "f5", category: "process", author: "Phạm Lan", authorColor: "#d97706", authorInitial: "PL",
    created: "01/02/2026", updated: "1 tuần trước", updatedTimestamp: Date.now() - 604800000,
    pages: 12, shared: 10, color: "#db2777", bg: "#fdf2f8", icon: "🚀",
    tags: ["onboarding", "process", "hr"],
    starred: false, locked: true, archived: false, deleted: false,
    sharedWith: [], versions: [{ id: 1, date: "01/02 10:00", author: "Phạm Lan", summary: "Initial checklist" }],
    comments: [], collaborators: [],
  },
  {
    id: "d6", title: "Meeting Notes - Q1 Review", content: "# Q1 Review Meeting\n\n**Ngày:** 10/03/2026\n**Người tham gia:** All hands\n\n## Highlights\n- Revenue +32% YoY\n- 3 major features shipped\n- NPS: 72\n\n## Q2 Priorities\n1. Mobile app launch\n2. Enterprise features\n3. AI integration",
    folderId: "f4", category: "meeting", author: "Hoàng Đức", authorColor: "#db2777", authorInitial: "HĐ",
    created: "10/03/2026", updated: "1 tuần trước", updatedTimestamp: Date.now() - 604800000,
    pages: 6, shared: 8, color: "#4f46e5", bg: "#eef2ff", icon: "📝",
    tags: ["meeting", "quarterly"],
    starred: false, locked: false, archived: false, deleted: false,
    sharedWith: [], versions: [{ id: 1, date: "10/03 15:00", author: "Hoàng Đức", summary: "Q1 review notes" }],
    comments: [], collaborators: [],
  },
  {
    id: "d7", title: "Database Schema v2", content: "# Database Schema v2\n\n## Tables\n\n### users\n```sql\nCREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) UNIQUE,\n  name VARCHAR(100),\n  ...\n);\n```\n\n### tasks\n...\n\n### projects\n...\n\n## Migrations\n...",
    folderId: "f2b", category: "technical", author: "Lê Phúc", authorColor: "#059669", authorInitial: "LP",
    created: "20/01/2026", updated: "2 tuần trước", updatedTimestamp: Date.now() - 1209600000,
    pages: 16, shared: 3, color: "#059669", bg: "#ecfdf5", icon: "🗄️",
    tags: ["database", "schema", "migration"],
    starred: false, locked: false, archived: false, deleted: false,
    sharedWith: [], versions: [{ id: 1, date: "20/01 09:00", author: "Lê Phúc", summary: "Schema v2 initial" }],
    comments: [], collaborators: [],
  },
  {
    id: "d8", title: "Brand Guidelines", content: "# Brand Guidelines\n\n## Logo\nPrimary: VWork wordmark\nIcon: VW monogram\n\n## Colors\nPrimary: #0891b2 (Cyan 600)\nAccent: #7c3aed (Violet 600)\n\n## Voice & Tone\nProfessional but friendly\nClear and concise\n\n## Usage Examples\n...",
    folderId: "f3", category: "design", author: "Trần Hương", authorColor: "#7c3aed", authorInitial: "TH",
    created: "15/01/2026", updated: "2 tuần trước", updatedTimestamp: Date.now() - 1209600000,
    pages: 20, shared: 12, color: "#7c3aed", bg: "#f3e8ff", icon: "🎯",
    tags: ["brand", "design", "guidelines"],
    starred: false, locked: true, archived: false, deleted: false,
    sharedWith: [], versions: [{ id: 1, date: "15/01 10:00", author: "Trần Hương", summary: "Brand guidelines v1" }],
    comments: [], collaborators: [],
  },
];

export interface MacroBrowserItem {
  id: string;
  category: string;
  label: string;
  desc: string;
  icon: string;
  preview: string;
  html: string;
}

export const macroBrowserItems: MacroBrowserItem[] = [
  { id: "info-panel", category: "formatting", label: "Info Panel", desc: "Hiển thị thông tin nổi bật với nền xanh dương", icon: "ℹ️", preview: `<div style="background:#DEEBFF;border-left:3px solid #0052CC;padding:12px 16px;border-radius:3px"><strong style="color:#0052CC">ℹ️ Lưu ý</strong><br><span style="color:#172B4D">Nội dung thông tin quan trọng cho người đọc.</span></div>`, html: `<div style="background:#DEEBFF;border-left:3px solid #0052CC;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#0052CC">ℹ️ Lưu ý</strong><br>Nội dung thông tin...</div><p><br></p>` },
  { id: "warning-panel", category: "formatting", label: "Warning Panel", desc: "Cảnh báo người dùng với nền vàng", icon: "⚠️", preview: `<div style="background:#FFFAE6;border-left:3px solid #FF8B00;padding:12px 16px;border-radius:3px"><strong style="color:#FF8B00">⚠️ Cảnh báo</strong><br><span style="color:#172B4D">Lưu ý quan trọng cần chú ý.</span></div>`, html: `<div style="background:#FFFAE6;border-left:3px solid #FF8B00;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#FF8B00">⚠️ Cảnh báo</strong><br>Nội dung cảnh báo...</div><p><br></p>` },
  { id: "success-panel", category: "formatting", label: "Success Panel", desc: "Hiển thị thông báo thành công", icon: "✅", preview: `<div style="background:#E3FCEF;border-left:3px solid #00875A;padding:12px 16px;border-radius:3px"><strong style="color:#00875A">✅ Thành công</strong><br><span style="color:#172B4D">Hoàn thành thao tác thành công.</span></div>`, html: `<div style="background:#E3FCEF;border-left:3px solid #00875A;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#00875A">✅ Thành công</strong><br>Nội dung thành công...</div><p><br></p>` },
  { id: "error-panel", category: "formatting", label: "Error Panel", desc: "Hiển thị thông báo lỗi nghiêm trọng", icon: "❌", preview: `<div style="background:#FFEBE6;border-left:3px solid #DE350B;padding:12px 16px;border-radius:3px"><strong style="color:#DE350B">❌ Lỗi</strong><br><span style="color:#172B4D">Đã xảy ra lỗi cần khắc phục.</span></div>`, html: `<div style="background:#FFEBE6;border-left:3px solid #DE350B;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#DE350B">❌ Lỗi</strong><br>Nội dung lỗi...</div><p><br></p>` },
  { id: "tip-panel", category: "formatting", label: "Tip Panel", desc: "Chia sẻ mẹo hữu ích cho người đọc", icon: "💡", preview: `<div style="background:#E3FCEF;border-left:3px solid #00875A;padding:12px 16px;border-radius:3px"><strong style="color:#00875A">💡 Mẹo</strong><br><span style="color:#172B4D">Mẹo giúp bạn làm việc hiệu quả hơn.</span></div>`, html: `<div style="background:#E3FCEF;border-left:3px solid #00875A;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#00875A">💡 Mẹo</strong><br>Nội dung mẹo hữu ích...</div><p><br></p>` },
  { id: "note-panel-m", category: "formatting", label: "Note Panel", desc: "Ghi chú bổ sung với nền tím", icon: "📝", preview: `<div style="background:#EAE6FF;border-left:3px solid #5243AA;padding:12px 16px;border-radius:3px"><strong style="color:#5243AA">📝 Ghi chú</strong><br><span style="color:#172B4D">Ghi chú bổ sung cho nội dung.</span></div>`, html: `<div style="background:#EAE6FF;border-left:3px solid #5243AA;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#5243AA">📝 Ghi chú</strong><br>Nội dung ghi chú...</div><p><br></p>` },
  { id: "expand-macro", category: "formatting", label: "Expand", desc: "Nội dung ẩn/hiện với tiêu đề tùy chỉnh", icon: "▶️", preview: `<details style="border:1px solid #DFE1E6;border-radius:3px;padding:0" open><summary style="padding:8px 12px;cursor:pointer;background:#FAFBFC;color:#172B4D;font-weight:500">Click để mở rộng</summary><div style="padding:12px 16px;border-top:1px solid #DFE1E6">Nội dung chi tiết bên trong expand block.</div></details>`, html: `<details style="border:1px solid #DFE1E6;border-radius:3px;margin:8px 0;padding:0"><summary style="padding:8px 12px;cursor:pointer;background:#FAFBFC;color:#172B4D;font-weight:500">Click để mở rộng</summary><div style="padding:12px 16px;border-top:1px solid #DFE1E6">Nội dung ẩn...</div></details><p><br></p>` },
  { id: "status-lozenge", category: "formatting", label: "Status Lozenge", desc: "Nhãn trạng thái có màu (TODO, IN PROGRESS, DONE...)", icon: "🏷️", preview: `<div style="display:flex;gap:8px;flex-wrap:wrap"><span style="background:#DFE1E6;color:#42526E;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;text-transform:uppercase">TO DO</span><span style="background:#DEEBFF;color:#0052CC;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;text-transform:uppercase">IN PROGRESS</span><span style="background:#E3FCEF;color:#00875A;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;text-transform:uppercase">DONE</span></div>`, html: `<span style="display:inline-block;background:#DEEBFF;color:#0052CC;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;line-height:16px;vertical-align:middle">IN PROGRESS</span>&nbsp;` },
  { id: "two-col-m", category: "layout", label: "2 Columns", desc: "Bố cục chia 2 cột bằng nhau", icon: "▥", preview: `<div style="display:flex;gap:12px"><div style="flex:1;padding:10px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;font-size:12px;color:#6B778C">Cột trái</div><div style="flex:1;padding:10px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;font-size:12px;color:#6B778C">Cột phải</div></div>`, html: `<div style="display:flex;gap:16px;margin:12px 0"><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột trái...</div><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột phải...</div></div><p><br></p>` },
  { id: "three-col-m", category: "layout", label: "3 Columns", desc: "Bố cục chia 3 cột bằng nhau", icon: "▦", preview: `<div style="display:flex;gap:8px"><div style="flex:1;padding:8px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;font-size:11px;color:#6B778C">Col 1</div><div style="flex:1;padding:8px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;font-size:11px;color:#6B778C">Col 2</div><div style="flex:1;padding:8px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;font-size:11px;color:#6B778C">Col 3</div></div>`, html: `<div style="display:flex;gap:16px;margin:12px 0"><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột 1...</div><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột 2...</div><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột 3...</div></div><p><br></p>` },
  { id: "sidebar-m", category: "layout", label: "Sidebar Layout", desc: "Nội dung chính + sidebar phải", icon: "◧", preview: `<div style="display:flex;gap:12px"><div style="flex:2;padding:10px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;font-size:12px;color:#6B778C">Main content</div><div style="flex:1;padding:10px;background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;font-size:12px;color:#6B778C">Sidebar</div></div>`, html: `<div style="display:flex;gap:16px;margin:12px 0"><div style="flex:2;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:100px">Nội dung chính...</div><div style="flex:1;padding:12px;background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;min-height:100px">Sidebar...</div></div><p><br></p>` },
  { id: "table-macro", category: "content", label: "Table", desc: "Bảng dữ liệu có header và border", icon: "📊", preview: `<table style="width:100%;border-collapse:collapse"><tr><th style="padding:6px 10px;background:#F4F5F7;border:1px solid #DFE1E6;font-size:12px;text-align:left">Cột A</th><th style="padding:6px 10px;background:#F4F5F7;border:1px solid #DFE1E6;font-size:12px;text-align:left">Cột B</th></tr><tr><td style="padding:6px 10px;border:1px solid #DFE1E6;font-size:12px">Data 1</td><td style="padding:6px 10px;border:1px solid #DFE1E6;font-size:12px">Data 2</td></tr></table>`, html: `<table style="width:100%;border-collapse:collapse;margin:8px 0"><tr><th style="padding:8px 12px;background:#F4F5F7;border:1px solid #DFE1E6;text-align:left;font-weight:600">Tiêu đề A</th><th style="padding:8px 12px;background:#F4F5F7;border:1px solid #DFE1E6;text-align:left;font-weight:600">Tiêu đề B</th><th style="padding:8px 12px;background:#F4F5F7;border:1px solid #DFE1E6;text-align:left;font-weight:600">Tiêu đề C</th></tr><tr><td style="padding:8px 12px;border:1px solid #DFE1E6">Dữ liệu 1</td><td style="padding:8px 12px;border:1px solid #DFE1E6">Dữ liệu 2</td><td style="padding:8px 12px;border:1px solid #DFE1E6">Dữ liệu 3</td></tr><tr><td style="padding:8px 12px;border:1px solid #DFE1E6">&nbsp;</td><td style="padding:8px 12px;border:1px solid #DFE1E6">&nbsp;</td><td style="padding:8px 12px;border:1px solid #DFE1E6">&nbsp;</td></tr></table><p><br></p>` },
  { id: "code-block-m", category: "content", label: "Code Block", desc: "Khối mã nguồn với syntax highlight", icon: "💻", preview: `<pre style="background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;padding:12px;font-family:monospace;font-size:12px;color:#172B4D">function hello() {\n  console.log("Hello World");\n}</pre>`, html: `<pre style="background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;padding:16px;margin:8px 0;overflow-x:auto;font-family:monospace;font-size:12px;line-height:1.6;color:#172B4D">// Code block\nfunction example() {\n  return "Hello World";\n}</pre><p><br></p>` },
  { id: "decision-m", category: "content", label: "Decision", desc: "Ghi nhận quyết định trong cuộc họp", icon: "🟢", preview: `<div style="background:#E3FCEF;border-radius:3px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px"><span style="font-size:16px">🟢</span><div><strong style="color:#006644;font-size:12px">Quyết định</strong><br><span style="color:#172B4D;font-size:12px">Chúng ta sẽ sử dụng React cho frontend.</span></div></div>`, html: `<div style="background:#E3FCEF;border-radius:3px;padding:12px 16px;margin:8px 0;display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px;line-height:1">🟢</span><div><strong style="color:#006644;display:block;margin-bottom:4px">Quyết định</strong><span style="color:#172B4D">Nội dung quyết định...</span></div></div><p><br></p>` },
  { id: "action-m", category: "content", label: "Action Item", desc: "Mục hành động cần thực hiện", icon: "⚡", preview: `<div style="background:#EAE6FF;border-radius:3px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px"><span style="font-size:16px">⚡</span><div><strong style="color:#403294;font-size:12px">Action Item</strong><br><span style="color:#172B4D;font-size:12px">Hoàn thành review code — @NguyễnAn</span></div></div>`, html: `<div style="background:#EAE6FF;border-radius:3px;padding:12px 16px;margin:8px 0;display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px;line-height:1">⚡</span><div><strong style="color:#403294;display:block;margin-bottom:4px">Action Item</strong><span style="color:#172B4D">Mô tả action item... — <em style='color:#6B778C'>@Người phụ trách</em></span></div></div><p><br></p>` },
  { id: "toc-m", category: "navigation", label: "Table of Contents", desc: "Tự động tạo mục lục từ headings", icon: "📑", preview: `<div style="background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;padding:14px"><strong style="color:#172B4D;font-size:12px;display:block;margin-bottom:6px">📑 Mục lục</strong><div style="color:#0052CC;font-size:11px;line-height:1.8">1. Introduction<br>2. Getting Started<br>3. Configuration<br>4. FAQ</div></div>`, html: `<div style="background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;padding:16px;margin:12px 0"><strong style="color:#172B4D;display:block;margin-bottom:8px">📑 Mục lục</strong><div style="color:#0052CC;font-size:13px;line-height:2">• Mục lục sẽ tự tạo từ các headings<br>• Di chuyển nhanh đến từng phần<br>• Cập nhật tự động khi chỉnh sửa</div></div><p><br></p>` },
  { id: "date-m", category: "content", label: "Date", desc: "Chèn ngày tháng hiện tại", icon: "📅", preview: `<span style="display:inline-block;background:#F4F5F7;color:#172B4D;padding:2px 8px;border-radius:3px;font-size:12px;border:1px solid #DFE1E6">📅 18/03/2026</span>`, html: "" },
  { id: "divider-m", category: "formatting", label: "Divider", desc: "Đường kẻ phân cách nội dung", icon: "➖", preview: `<hr style="border:none;border-top:1px solid #DFE1E6;margin:10px 0">`, html: "" },
  { id: "quote-m", category: "formatting", label: "Blockquote", desc: "Trích dẫn nội dung", icon: "💬", preview: `<blockquote style="border-left:2px solid #DFE1E6;padding:4px 12px;color:#6B778C;font-style:italic;font-size:12px">"Đây là nội dung trích dẫn quan trọng."</blockquote>`, html: "" },
  { id: "checklist-m", category: "content", label: "Task List", desc: "Danh sách công việc với checkbox", icon: "☑️", preview: `<div style="font-size:12px;line-height:2"><div>☑️ Task đã hoàn thành</div><div>⬜ Task cần làm</div><div>⬜ Task tiếp theo</div></div>`, html: "" },
];