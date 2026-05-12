import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, NumberFormat, LevelFormat,
  convertInchesToTwip, UnderlineType
} from "docx";
import { writeFileSync } from "fs";

const BRAND = "46A3DC";
const LIGHT = "EBF5FB";
const GRAY = "F2F3F4";
const DARK = "1B2631";

const h1 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 120 },
  children: [new TextRun({ text, bold: true, size: 32, color: "1A5276", font: "Calibri" })],
});

const h2 = (text) => new Paragraph({
  spacing: { before: 280, after: 80 },
  children: [new TextRun({ text, bold: true, size: 26, color: "1F618D", font: "Calibri" })],
});

const h3 = (text) => new Paragraph({
  spacing: { before: 200, after: 60 },
  children: [new TextRun({ text, bold: true, size: 22, color: "2471A3", font: "Calibri" })],
});

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: 60, after: 60 },
  children: [new TextRun({ text, size: 22, font: "Calibri", ...opts })],
});

const bullet = (text, level = 0) => new Paragraph({
  spacing: { before: 40, after: 40 },
  indent: { left: convertInchesToTwip(0.3 * (level + 1)) },
  children: [
    new TextRun({ text: "• ", size: 22, color: "2471A3", font: "Calibri" }),
    new TextRun({ text, size: 22, font: "Calibri" }),
  ],
});

const bulletBold = (label, value) => new Paragraph({
  spacing: { before: 40, after: 40 },
  indent: { left: convertInchesToTwip(0.3) },
  children: [
    new TextRun({ text: "• ", size: 22, color: "2471A3", font: "Calibri" }),
    new TextRun({ text: label + ": ", size: 22, bold: true, font: "Calibri" }),
    new TextRun({ text: value, size: 22, font: "Calibri" }),
  ],
});

const hr = () => new Paragraph({
  spacing: { before: 120, after: 120 },
  border: { bottom: { color: "BFC9CA", space: 1, style: BorderStyle.SINGLE, size: 6 } },
  children: [],
});

const chip = (label, color = "2471A3", bg = "EBF5FB") => new TextRun({
  text: ` ${label} `,
  size: 18,
  bold: true,
  color,
  font: "Calibri",
  shading: { type: ShadingType.SOLID, color: bg },
});

const featureRow = (no, title, desc) => new TableRow({
  children: [
    new TableCell({
      width: { size: 6, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "EBF5FB" },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(no), bold: true, size: 22, color: "1F618D", font: "Calibri" })] })],
    }),
    new TableCell({
      width: { size: 30, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, color: "FDFEFE" },
      children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, font: "Calibri" })] })],
    }),
    new TableCell({
      width: { size: 64, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: desc, size: 20, font: "Calibri" })] })],
    }),
  ],
});

const tableHeader = (cols) => new TableRow({
  tableHeader: true,
  children: cols.map((c, i) => new TableCell({
    shading: { type: ShadingType.SOLID, color: "1F618D" },
    width: { size: [6, 30, 64][i] ?? 33, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: c, bold: true, size: 20, color: "FFFFFF", font: "Calibri" })] })],
  })),
});

const doc = new Document({
  creator: "VWork Dev Team",
  title: "Changelog – VWork Chat Mini-App",
  description: "Tổng hợp các thay đổi từ Version 1",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [{
    children: [
      // ══════════════════════════════════════════
      // COVER
      // ══════════════════════════════════════════
      new Paragraph({
        spacing: { before: 480, after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VWork Chat Mini-App", bold: true, size: 56, color: "1A5276", font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Changelog – Tổng hợp thay đổi từ Version 1", size: 28, color: "566573", font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [new TextRun({ text: "Ngày cập nhật: 10/04/2026", size: 22, color: "909497", font: "Calibri" })],
      }),
      hr(),

      // ══════════════════════════════════════════
      // 1. TỔNG QUAN
      // ══════════════════════════════════════════
      h1("1. Tổng quan"),
      p("Tài liệu này tổng hợp toàn bộ tính năng và thay đổi giao diện được bổ sung vào VWork Chat từ phiên bản gốc (Version 1). Các thay đổi tập trung vào 4 mảng chính:"),
      bullet("Module Tài chính – Thuế & Ngân sách"),
      bullet("Kênh Thông báo chung – Form đăng & quản lý phân loại"),
      bullet("Giao diện chi tiết thống nhất cho thông báo"),
      bullet("Trải nghiệm điều hướng & sidebar"),
      hr(),

      // ══════════════════════════════════════════
      // 2. BẢNG TỔNG HỢP
      // ══════════════════════════════════════════
      h1("2. Bảng tổng hợp thay đổi"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          tableHeader(["#", "Tính năng / Thay đổi", "Mô tả ngắn"]),
          featureRow(1,  "Hóa đơn VAT chi tiết",           "Thêm tab Đầu ra / Đầu vào trong báo cáo VAT"),
          featureRow(2,  "Card báo cáo thuế gọn",           "Chỉ hiển thị số tiền & trạng thái, bỏ bảng chi tiết"),
          featureRow(3,  'Đổi tên "Báo cáo thuế" → "Thuế"',"Rút gọn label sidebar tài chính"),
          featureRow(4,  "Ngân sách 3 tab",                 "Danh mục / Phòng ban / Dự án với progress bar"),
          featureRow(5,  "Đăng thông báo từ chat",          "Nút 📢 trong chat → publish lên sidebar"),
          featureRow(6,  "Form thông báo đầy đủ",           "Emoji, tiêu đề, danh mục, mức độ, stats, đính kèm"),
          featureRow(7,  "Giao diện thông báo thống nhất",  "Tất cả an-* dùng cùng 1 template detail view"),
          featureRow(8,  "Nhãn mức độ trên sidebar",        "Mọi thông báo trong GẦN ĐÂY đều có badge"),
          featureRow(9,  "Phân loại động + thêm mới",       "Select động & nút + để tạo phân loại ngay trong form"),
          featureRow(10, "Xem thông báo theo phân loại",    "Click PHÂN LOẠI → hiển thị danh sách filtered"),
          featureRow(11, "Nút + phân loại ở sidebar",       "Header PHÂN LOẠI có nút + để thêm trực tiếp"),
        ],
      }),
      hr(),

      // ══════════════════════════════════════════
      // 3. CHI TIẾT TỪNG THAY ĐỔI
      // ══════════════════════════════════════════
      h1("3. Chi tiết từng thay đổi"),

      // 3.1
      h2("3.1  Hóa đơn VAT chi tiết (Đầu ra / Đầu vào)"),
      p("Vị trí: Tài chính → Thuế → Tờ khai VAT → Chi tiết"),
      p("Yêu cầu gốc: 'đầu ra và đầu vào khấu trừ như nào thì cho vào chi tiết'"),
      h3("Thay đổi thực hiện"),
      bullet("Thêm 2 mảng dữ liệu outputInvoices[] và inputInvoices[] vào mỗi báo cáo VAT trong financialData.tax.reports"),
      bullet("Cấu trúc hóa đơn đầu ra: { no, date, buyer, revenue, vat, isSummary? }"),
      bullet("Cấu trúc hóa đơn đầu vào: { no, date, supplier, amount, vat, deductible, reason?, isSummary? }"),
      bullet("Thêm state vatInvoiceTab ('output' | 'input') để chuyển tab"),
      bullet("Section mới chỉ hiển thị khi selectedReport.type === 'VAT', gồm 2 tab với bảng hóa đơn chi tiết"),
      bullet("Dòng tổng hợp (isSummary: true) hiển thị in nghiêng & nền khác để phân biệt"),
      bullet("Cột 'Được khấu trừ' màu xanh/đỏ, hiển thị lý do khi không khấu trừ được"),
      p("File sửa: ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),

      // 3.2
      h2("3.2  Card báo cáo thuế gọn"),
      p("Vị trí: Tài chính → Thuế → danh sách báo cáo"),
      p("Yêu cầu gốc: 'giao diện của mỗi báo cáo thuế này chỉ cần hiển thị số tiền phải nộp và trạng thái'"),
      h3("Thay đổi thực hiện"),
      bullet("Xóa bỏ bảng breakdown chi tiết (doanh thu/thuế vào/thuế ra) ra khỏi mỗi card trong danh sách"),
      bullet("Card rút gọn còn: tên báo cáo, kỳ, hạn nộp, số tiền phải nộp (highlight), badge trạng thái, arrow icon"),
      bullet("Số tiền hiển thị to, đậm, dễ đọc; trạng thái dùng màu phân biệt Chờ nộp / Đã nộp / Đã nộp thuế"),
      p("File sửa: ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),

      // 3.3
      h2('3.3  Đổi tên "Báo cáo thuế" → "Thuế"'),
      p("Vị trí: Sidebar kênh Tài chính, section Tổng quan tài chính"),
      p("Yêu cầu gốc: 'Báo cáo thuế sửa thành Thuế'"),
      h3("Thay đổi thực hiện"),
      bullet("Cập nhật label trong financeGroups (ChannelDetailSidebar.tsx): name: 'Thuế'"),
      bullet("Cập nhật tiêu đề trong financeOverviewMap và summary card (ChannelItemDetailView.tsx)"),
      p("File sửa: ChannelDetailSidebar.tsx, ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),

      // 3.4
      h2("3.4  Ngân sách 3 tab: Danh mục / Phòng ban / Dự án"),
      p("Vị trí: Tài chính → Tổng quan ngân sách → Chi tiết"),
      p("Yêu cầu gốc: 'phần ngân sách này cần sửa lại theo Danh mục / Phòng ban / Dự án'"),
      h3("Dữ liệu bổ sung"),
      bulletBold("byCategory[]", "6 danh mục: Lương & phúc lợi, Công nghệ, Marketing, Văn phòng, R&D, Đào tạo"),
      bulletBold("byDept[]",     "6 phòng ban: Kỹ thuật, Marketing, Nhân sự, Vận hành, R&D, Ban lãnh đạo"),
      bulletBold("byProject[]",  "6 dự án với status: on-track / over-budget / slow"),
      h3("Giao diện"),
      bullet("3 nút tab ở đầu section ngân sách"),
      bullet("Mỗi tab hiển thị bảng tên, progress bar màu, số tiền đã dùng / tổng"),
      bullet("Tab Dự án thêm cột status badge màu (Đúng tiến độ / Vượt ngân sách / Chậm)"),
      p("File sửa: ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),

      // 3.5
      h2("3.5  Đăng thông báo từ chat lên sidebar"),
      p("Vị trí: Kênh Thông báo chung → hover trên tin nhắn"),
      p("Yêu cầu gốc: 'tôi muốn tin nhắn thông báo trong kênh chat nhảy sang các mục chủ đề hay xuất hiện gần đây'"),
      h3("Luồng dữ liệu"),
      bullet("App.tsx: state publishedAnnouncements[] — nguồn sự thật duy nhất"),
      bullet("ChatView nhận callback onPublishAnnouncement(title, emoji, category, badge, description, stats, attachment)"),
      bullet("ChannelDetailSidebar nhận extraItems[] → inject vào đầu nhóm GẦN ĐÂY"),
      bullet("ChannelItemDetailView nhận customAnnouncements[] → render detail khi itemId bắt đầu 'an-custom-'"),
      h3("UI"),
      bullet("Nút 📢 hiện khi hover tin nhắn trong kênh ch-announce"),
      bullet("Tin nhắn hiện tại được prefill vào trường mô tả của form"),
      p("File sửa: App.tsx, ChatView.tsx, ChannelDetailSidebar.tsx, ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),

      // 3.6
      h2("3.6  Form thông báo đầy đủ"),
      p("Vị trí: Kênh Thông báo chung → nút 📢"),
      p("Yêu cầu gốc: 'tôi cũng muốn có form nhập các thông tin đầy đủ'"),
      h3("Các trường trong form"),
      bulletBold("Icon",           "Emoji picker (input 1 ký tự)"),
      bulletBold("Tiêu đề *",      "Text input, bắt buộc — nút Đăng disabled nếu trống"),
      bulletBold("Danh mục",       "Select động + nút + thêm mới"),
      bulletBold("Mức độ",         "Select: Thông báo / Quan trọng / Thông tin"),
      bulletBold("Mô tả chi tiết", "Textarea 3 dòng"),
      bulletBold("Thông tin nổi bật", "3 cặp nhãn–giá trị tùy chọn (stats grid)"),
      bulletBold("Tệp đính kèm",   "Input tên file"),
      h3("UX"),
      bullet("Bottom-sheet modal (absolute inset-0 bg-black/40 items-end)"),
      bullet("Submit → toast thông báo thành công, item xuất hiện ngay trong sidebar"),
      p("File sửa: ChatView.tsx", { italics: true, color: "7D6608" }),

      // 3.7
      h2("3.7  Giao diện thống nhất cho tất cả thông báo"),
      p("Vị trí: Panel chi tiết bên phải khi click bất kỳ item an-* nào"),
      p("Yêu cầu gốc: 'tất cả form đăng thông báo trong kênh thông báo chung cần đồng nhất với nhau'"),
      h3("Thay đổi thực hiện"),
      bullet("Bổ sung fields vào interface DetailData: category?, badge?, publishedAt?, publishedBy?, attachment?"),
      bullet("Enrich toàn bộ an-* items trong allDetails với các field trên"),
      bullet("Thêm early-return render path: if (detail && detail.category) → dùng unified template"),
      h3("Layout unified template"),
      bullet("Header: emoji + badge label + tên danh mục + tiêu đề + nút đóng"),
      bullet("Action bar: Thích, Lưu, Chia sẻ, More"),
      bullet("Meta grid: 2 cột với các thông tin từ detail.meta[]"),
      bullet("Mô tả chi tiết"),
      bullet("Checklist (nếu có)"),
      bullet("Bảng meta: danh mục / ngày đăng / người đăng / mức độ"),
      bullet("Tệp đính kèm (nếu có)"),
      bullet("Ô nhập bình luận"),
      p("File sửa: ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),

      // 3.8
      h2("3.8  Nhãn mức độ trên tất cả thông báo trong sidebar"),
      p("Vị trí: Sidebar kênh Thông báo chung → nhóm GẦN ĐÂY"),
      p("Yêu cầu gốc: 'tất cả các thông báo cần gắn nhãn mức độ giống 'lịch nghỉ lễ' đang có'"),
      h3("Thay đổi thực hiện"),
      bullet("Thêm badge + badgeColor vào các item trong announceGroups.recent:"),
      new Paragraph({ indent: { left: convertInchesToTwip(0.6) }, spacing: { before: 30, after: 30 }, children: [new TextRun({ text: "an-move, an-salary → badge 'Quan trọng' (đỏ)", size: 20, font: "Calibri" })] }),
      new Paragraph({ indent: { left: convertInchesToTwip(0.6) }, spacing: { before: 30, after: 30 }, children: [new TextRun({ text: "an-q2plan, an-award, an-event → badge 'Thông báo' (vàng amber)", size: 20, font: "Calibri" })] }),
      bullet("Cập nhật type extraItems thêm badge?, badgeColor? để custom announcements cũng hiện badge"),
      bullet("Thêm hàm badgeFor() trong effectiveGroups để tự động tính màu badge từ giá trị badge string"),
      p("File sửa: ChannelDetailSidebar.tsx", { italics: true, color: "7D6608" }),

      // 3.9
      h2("3.9  Phân loại động & nút thêm phân loại mới"),
      p("Vị trí: Form đăng thông báo + header PHÂN LOẠI trong sidebar"),
      p("Yêu cầu gốc: 'bổ sung nút để có thể thêm phân loại khác'"),
      h3("Form (ChatView)"),
      bullet("Trường Danh mục dùng prop categories[] thay vì hardcode"),
      bullet("Nút + (viền đứt amber) cạnh select → toggle addCatMode"),
      bullet("Khi addCatMode: hiện input inline + nút ✓ / ✕"),
      bullet("Confirm → gọi onAddCategory(name) → state customCategories[] trong App.tsx"),
      h3("Sidebar (ChannelDetailSidebar)"),
      bullet("Thêm prop onAddCategory và nút + trong header nhóm PHÂN LOẠI"),
      bullet("Inline input ngay dưới header với nền đỏ nhạt khớp màu channel"),
      bullet("Custom category mới inject vào effectiveGroups với id 'an-cat-u-{name}', emoji 📁"),
      p("File sửa: ChatView.tsx, ChannelDetailSidebar.tsx, App.tsx", { italics: true, color: "7D6608" }),

      // 3.10
      h2("3.10  Xem thông báo theo phân loại"),
      p("Vị trí: Click bất kỳ item trong nhóm PHÂN LOẠI"),
      p("Yêu cầu gốc: 'khi chọn 1 phân loại nào đó có thể xem được những thông báo trong phân loại đó'"),
      h3("Thay đổi thực hiện"),
      bullet("Thêm early-return render path trong ChannelItemDetailView: if (itemId.startsWith('an-cat-'))"),
      bullet("Resolve tên danh mục: hardcoded cats → allDetails[itemId].title; custom cats → itemId.slice('an-cat-u-'.length)"),
      bullet("Filter allDetails: lấy tất cả entries có category === catName, loại trừ an-cat-* chính nó"),
      bullet("Merge với customAnnouncements có category khớp"),
      bullet("Render danh sách card: emoji + tên + ngày + badge — click → onNavigate(id)"),
      p("File sửa: ChannelItemDetailView.tsx", { italics: true, color: "7D6608" }),
      hr(),

      // ══════════════════════════════════════════
      // 4. FILE THAY ĐỔI
      // ══════════════════════════════════════════
      h1("4. Danh sách file đã thay đổi"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ shading: { type: ShadingType.SOLID, color: "1F618D" }, width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "File", bold: true, color: "FFFFFF", size: 20, font: "Calibri" })] })] }),
              new TableCell({ shading: { type: ShadingType.SOLID, color: "1F618D" }, width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Nội dung thay đổi", bold: true, color: "FFFFFF", size: 20, font: "Calibri" })] })] }),
            ],
          }),
          ...[
            ["src/app/components/ChannelItemDetailView.tsx", "File thay đổi nhiều nhất: dữ liệu tài chính/thuế/ngân sách, VAT invoices, template thống nhất thông báo, category list view"],
            ["src/app/components/ChannelDetailSidebar.tsx",   "Badge trên thông báo, kiểu extraItems, custom categories, nút + PHÂN LOẠI"],
            ["src/app/components/ChatView.tsx",               "Form đăng thông báo, select danh mục động, nút + thêm danh mục"],
            ["src/app/App.tsx",                               "State publishedAnnouncements, customCategories, wiring props giữa các component"],
          ].map(([file, desc]) => new TableRow({
            children: [
              new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: "FDFEFE" }, children: [new Paragraph({ children: [new TextRun({ text: file, size: 18, font: "Courier New", color: "7D6608" })] })] }),
              new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: desc, size: 20, font: "Calibri" })] })] }),
            ],
          })),
        ],
      }),
      hr(),

      // ══════════════════════════════════════════
      // 5. CẤU TRÚC DỮ LIỆU MỚI
      // ══════════════════════════════════════════
      h1("5. Cấu trúc dữ liệu bổ sung"),

      h2("5.1  CustomAnnouncement (type mới)"),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        shading: { type: ShadingType.SOLID, color: "F4F6F7" },
        children: [new TextRun({ text: "{ id, name, emoji, subtitle, category, badge, description, stats: [{label, value}][], attachment, createdAt }", size: 18, font: "Courier New", color: "1A5276" })],
      }),

      h2("5.2  DetailData – fields bổ sung"),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        shading: { type: ShadingType.SOLID, color: "F4F6F7" },
        children: [new TextRun({ text: "category?: string  |  badge?: string  |  publishedAt?: string  |  publishedBy?: string  |  attachment?: string", size: 18, font: "Courier New", color: "1A5276" })],
      }),

      h2("5.3  financialData.budget – fields bổ sung"),
      bulletBold("byCategory[]", "name, allocated, used, color"),
      bulletBold("byDept[]",     "dept, allocated, used, color"),
      bulletBold("byProject[]",  "name, allocated, used, color, status: 'on-track'|'over-budget'|'slow'"),

      h2("5.4  tax.reports – fields VAT bổ sung"),
      bulletBold("outputInvoices[]",  "no, date, buyer, revenue, vat, isSummary?"),
      bulletBold("inputInvoices[]",   "no, date, supplier, amount, vat, deductible, reason?, isSummary?"),
      hr(),

      // ══════════════════════════════════════════
      // 6. GHI CHÚ KỸ THUẬT
      // ══════════════════════════════════════════
      h1("6. Ghi chú kỹ thuật"),
      bullet("Stack: React + TypeScript + Tailwind CSS, Vite dev server"),
      bullet("Dev server chạy tại port 4003 (http://localhost:4003)"),
      bullet("Toast notifications dùng thư viện sonner"),
      bullet("Pattern nhận diện thông báo: itemId.startsWith('an-custom-') → custom; itemId.startsWith('an-cat-') → category view; detail.category truthy → unified template"),
      bullet("Custom categories dùng id prefix 'an-cat-u-{name}' để phân biệt với hardcoded 'an-cat-policy'..."),
      bullet("State publishedAnnouncements được lift lên App.tsx để chia sẻ giữa ChatView ↔ ChannelDetailSidebar ↔ ChannelItemDetailView"),
      hr(),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [new TextRun({ text: "— Hết tài liệu —", size: 20, color: "909497", italics: true, font: "Calibri" })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("VWork_Chat_Changelog.docx", buffer);
console.log("✓ Đã tạo VWork_Chat_Changelog.docx");
