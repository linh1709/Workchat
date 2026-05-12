import { useState, useEffect, useRef } from "react";
import { useCrmInvoices, type CrmInvoice } from "../context/CrmInvoiceContext";
import { toast } from "sonner";
import {
  Plus, X, Search, ArrowLeft, Edit2, Trash2, Check,
  Phone, Mail, Calendar, Building2, User, ChevronDown,
  CheckCircle2, Star, Clock, FileText, MoreHorizontal,
  Receipt, FileCheck, ChevronsRight
} from "lucide-react";

/* ═══════════ Types ═══════════ */
interface CrmCompany {
  id: string; name: string;
  type: "customer" | "vendor" | "partner";
  industry: string; size: string; address: string;
  website: string; phone: string; email: string; owner: string;
  status: "active" | "inactive";
  revenue: number; contacts: number; createdAt: string;
}
interface CrmContact {
  id: string; companyId: string; companyName: string; name: string; title: string;
  email: string; phone: string; status: "active" | "inactive"; owner: string;
  lastContact: string; avatar: string; tier: "normal" | "vip";
}
interface CrmLead {
  id: string; name: string; company: string; email: string; phone: string;
  source: string;
  stage: "new" | "contacted" | "qualified" | "converted" | "disqualified";
  status: "open" | "converted" | "disqualified";
  score: number; value: number; owner: string; createdAt: string; avatar: string;
}
interface CrmOpportunity {
  id: string; title: string; companyId: string; companyName: string;
  contactName: string; value: number;
  stage: "prospect" | "demo" | "proposal" | "negotiation" | "closed";
  status: "open" | "won" | "lost";
  probability: number; closeDate: string; owner: string; avatar: string;
}
interface CrmActivity {
  id: string; type: "call" | "meeting" | "email" | "note" | "task";
  entityType: "lead" | "opportunity" | "contact" | "company";
  entityId: string; entityName: string; title: string; description: string;
  date: string; status: string; owner: string; priority?: string; dueDate?: string;
}
// CrmInvoice type is imported from CrmInvoiceContext
interface CrmContract {
  id: string; entityType: "company" | "lead"; entityId: string; entityName: string;
  contractNo: string; title: string;
  startDate: string; endDate: string; value: number;
  type: "sale" | "partnership" | "service" | "nda" | "other";
  status: "draft" | "active" | "expired" | "cancelled";
  description: string; signedBy: string; owner: string;
}

/* ═══════════ Initial Data ═══════════ */
const initCompanies: CrmCompany[] = [
  // Partners / Vendors
  { id:"co1", name:"TechVision JSC",    type:"partner",  industry:"CNTT",      size:"50-200",   address:"Q.1, TP.HCM",       website:"techvision.vn",   email:"contact@techvision.vn",  phone:"028 1234 5678", owner:"Phạm Thu Hà",   status:"active",  revenue:450_000_000,   contacts:3, createdAt:"10/01/2025" },
  { id:"co2", name:"FPT Software",      type:"partner",  industry:"CNTT",      size:"1000+",    address:"Q.Cầu Giấy, HN",    website:"fpt.com",         email:"biz@fpt.com",             phone:"028 7300 7300", owner:"Nguyễn Lan Anh",status:"active",  revenue:3_500_000_000, contacts:4, createdAt:"12/03/2024" },
  { id:"co3", name:"Masan Group",       type:"partner",  industry:"FMCG",      size:"500-1000", address:"Q.1, TP.HCM",       website:"masan.vn",        email:"corp@masan.vn",           phone:"028 3930 0631", owner:"Lê Văn Nam",    status:"active",  revenue:950_000_000,   contacts:2, createdAt:"03/12/2024" },
  { id:"co4", name:"An Phat Holdings",  type:"vendor",   industry:"Sản xuất",  size:"200-500",  address:"Hải Dương",          website:"anphat.vn",       email:"info@anphat.vn",          phone:"0225 3855 555", owner:"Nguyễn Lan Anh",status:"active",  revenue:620_000_000,   contacts:1, createdAt:"15/11/2024" },
  { id:"co5", name:"Saigon Foods Corp", type:"vendor",   industry:"F&B",       size:"200-500",  address:"Q.12, TP.HCM",      website:"saigonfood.vn",   email:"partner@saigonfood.vn",  phone:"028 8765 4321", owner:"Lê Văn Nam",    status:"inactive",revenue:1_200_000_000, contacts:2, createdAt:"05/06/2024" },
  // Customers
  { id:"co6",  name:"Nova Real Estate",  type:"customer", industry:"Bất động sản",size:"200-500",address:"Q.7, TP.HCM",       website:"novare.vn",       email:"bd@novare.vn",             phone:"028 5555 6666", owner:"Trần Đức Minh", status:"active",  revenue:1_850_000_000, contacts:3, createdAt:"01/09/2022" },
  { id:"co7",  name:"Hoa Sen Group",     type:"customer", industry:"Sản xuất",  size:"1000+",    address:"Bình Dương",         website:"hoasen.vn",       email:"purchase@hoasen.vn",      phone:"028 9999 0000", owner:"Trần Đức Minh", status:"active",  revenue:3_200_000_000, contacts:2, createdAt:"15/02/2022" },
  { id:"co8",  name:"Mirae Asset VN",    type:"customer", industry:"Tài chính", size:"500-1000", address:"Q.1, TP.HCM",       website:"miraeasset.vn",   email:"info@miraeasset.vn",      phone:"028 4444 5555", owner:"Phạm Thu Hà",   status:"active",  revenue:2_600_000_000, contacts:2, createdAt:"20/01/2023" },
  { id:"co9",  name:"Hoàng Anh Gia Lai", type:"customer", industry:"Đa ngành",  size:"1000+",    address:"Gia Lai",            website:"hagl.vn",         email:"corporate@hagl.vn",       phone:"059 3822 282",  owner:"Trần Đức Minh", status:"active",  revenue:4_100_000_000, contacts:3, createdAt:"10/06/2021" },
  { id:"co10", name:"Vinamilk",          type:"customer", industry:"FMCG",      size:"1000+",    address:"Q.10, TP.HCM",      website:"vinamilk.com.vn", email:"partner@vinamilk.com.vn",phone:"028 5416 5888", owner:"Trần Đức Minh", status:"active",  revenue:2_800_000_000, contacts:3, createdAt:"20/01/2024" },
  { id:"co11", name:"Công ty TNHH ABC",  type:"customer", industry:"Bán lẻ",    size:"50-200",   address:"Q.3, TP.HCM",       website:"abc-co.vn",       email:"info@abc-co.vn",          phone:"028 3333 4444", owner:"Lê Văn Nam",    status:"active",  revenue:320_000_000,   contacts:1, createdAt:"12/03/2023" },
  { id:"co12", name:"CloudBase Systems", type:"customer", industry:"CNTT",      size:"50-200",   address:"Q.Phú Nhuận, HCM",  website:"cloudbase.vn",   email:"sales@cloudbase.vn",      phone:"0933 990 001",  owner:"Nguyễn Lan Anh",status:"active",  revenue:145_000_000,   contacts:1, createdAt:"05/05/2024" },
  { id:"co13", name:"GreenTech VN",      type:"customer", industry:"Công nghệ", size:"<50",      address:"Hà Nội",             website:"greentech.vn",   email:"hello@greentech.vn",      phone:"028 7777 8888", owner:"Lê Văn Nam",    status:"inactive",revenue:210_000_000,   contacts:1, createdAt:"10/11/2023" },
  { id:"co14", name:"TMS Logistics",     type:"customer", industry:"Logistics", size:"50-200",   address:"Q.12, TP.HCM",      website:"tmslogistics.vn",email:"ops@tmslogistics.vn",     phone:"028 2222 3333", owner:"Nguyễn Lan Anh",status:"inactive",revenue:0,             contacts:0, createdAt:"15/04/2026" },
  { id:"co15", name:"Bamboo Airways",    type:"customer", industry:"Hàng không",size:"500-1000", address:"Hà Nội",             website:"bambooairway.vn",email:"biz@bamboo.vn",           phone:"028 7107 0888", owner:"Trần Đức Minh", status:"inactive",revenue:180_000_000,   contacts:2, createdAt:"08/07/2023" },
  { id:"co16", name:"Startup Dev Hub",   type:"customer", industry:"Startup",   size:"<50",      address:"Q.Tân Bình, HCM",   website:"devhub.io",       email:"team@devhub.io",          phone:"0966 556 677",  owner:"Phạm Thu Hà",   status:"active",  revenue:95_000_000,    contacts:1, createdAt:"22/08/2024" },
  { id:"co17", name:"VietJet Air",       type:"customer", industry:"Hàng không",size:"1000+",    address:"Q.Tân Bình, HCM",   website:"vietjetair.com",  email:"partner@vietjet.com",     phone:"028 3827 6600", owner:"Phạm Thu Hà",   status:"inactive",revenue:320_000_000,   contacts:2, createdAt:"14/04/2023" },
  { id:"co18", name:"Startup XYZ",       type:"customer", industry:"Startup",   size:"<50",      address:"Q.1, TP.HCM",       website:"xyz.io",          email:"hello@xyz.io",            phone:"0912 345 678",  owner:"Phạm Thu Hà",   status:"inactive",revenue:80_000_000,    contacts:1, createdAt:"01/02/2025" },
];

const initContacts: CrmContact[] = [
  { id:"ct1",  companyId:"co1", companyName:"TechVision JSC",   name:"Nguyễn Minh Tuấn",  title:"CTO",              email:"tuan@techvision.vn",   phone:"0912 345 678", status:"active",   owner:"Phạm Thu Hà",   lastContact:"2 ngày trước",  avatar:"NT", tier:"normal" },
  { id:"ct2",  companyId:"co2", companyName:"Saigon Foods",     name:"Trần Thị Mai",       title:"Giám đốc mua hàng",email:"mai@saigonfood.vn",    phone:"0987 654 321", status:"active",   owner:"Lê Văn Nam",    lastContact:"Hôm nay",       avatar:"TM", tier:"vip" },
  { id:"ct3",  companyId:"co3", companyName:"FPT Software",     name:"Phạm Quang Đức",     title:"VP Engineering",   email:"duc@fpt.com",          phone:"0963 111 222", status:"active",   owner:"Nguyễn Lan Anh",lastContact:"1 ngày trước",  avatar:"PD", tier:"vip" },
  { id:"ct4",  companyId:"co4", companyName:"Vinamilk",         name:"Lê Thị Hoa",         title:"IT Director",      email:"hoa@vinamilk.com",     phone:"0978 888 999", status:"active",   owner:"Trần Đức Minh", lastContact:"3 ngày trước",  avatar:"LH", tier:"vip" },
  { id:"ct5",  companyId:"co5", companyName:"Masan Group",      name:"Hoàng Thị Lan",      title:"Tech Lead",        email:"lan@masan.vn",         phone:"0932 456 789", status:"active",   owner:"Lê Văn Nam",    lastContact:"1 tuần trước",  avatar:"HL", tier:"normal" },
  { id:"ct6",  companyId:"co6", companyName:"An Phat Holdings", name:"Bùi Văn An",         title:"CISO",             email:"an@anphat.vn",         phone:"0945 678 901", status:"active",   owner:"Nguyễn Lan Anh",lastContact:"2 ngày trước",  avatar:"BA", tier:"normal" },
  { id:"ct7",  companyId:"co7", companyName:"Startup XYZ",      name:"Võ Thanh Long",      title:"CEO",              email:"long@xyz.io",          phone:"0901 234 567", status:"active",   owner:"Phạm Thu Hà",   lastContact:"5 ngày trước",  avatar:"VL", tier:"normal" },
  { id:"ct8",  companyId:"co8", companyName:"Bamboo Airways",   name:"Đỗ Thị Thanh",       title:"IT Manager",       email:"thanh@bamboo.vn",      phone:"0956 789 012", status:"inactive", owner:"Trần Đức Minh", lastContact:"2 tháng trước", avatar:"DT", tier:"normal" },
  { id:"ct9",  companyId:"co9", companyName:"VietJet Air",      name:"Ngô Văn Hùng",       title:"CTO",              email:"hung@vietjet.com",     phone:"0967 890 123", status:"inactive", owner:"Phạm Thu Hà",   lastContact:"45 ngày trước", avatar:"NH", tier:"normal" },
  { id:"ct10", companyId:"co3", companyName:"FPT Software",     name:"Trần Bình",          title:"Project Manager",  email:"binh@fpt.com",         phone:"0977 222 333", status:"active",   owner:"Nguyễn Lan Anh",lastContact:"4 ngày trước",  avatar:"TB", tier:"normal" },
  { id:"ct11", companyId:"co1", companyName:"TechVision JSC",   name:"Phạm Lan",           title:"Head of Sales",    email:"lan@techvision.vn",    phone:"0988 444 555", status:"active",   owner:"Phạm Thu Hà",   lastContact:"1 tuần trước",  avatar:"PL", tier:"normal" },
  { id:"ct12", companyId:"co4", companyName:"Vinamilk",         name:"Nguyễn Hoài Nam",    title:"Procurement Mgr",  email:"hoainam@vinamilk.com", phone:"0911 666 777", status:"active",   owner:"Trần Đức Minh", lastContact:"6 ngày trước",  avatar:"NH", tier:"normal" },
];

const initLeads: CrmLead[] = [
  { id:"ld1", name:"Đinh Văn Khoa",   company:"Nova Group",        email:"khoa@nova.vn",       phone:"0933 111 222", source:"Website",      stage:"new",          status:"open",        score:72, value:800_000_000,   owner:"Phạm Thu Hà",   createdAt:"10/04/2026", avatar:"DK" },
  { id:"ld2", name:"Lý Thị Thu",      company:"GreenTech VN",      email:"thu@greentech.vn",   phone:"0944 333 444", source:"Referral",     stage:"new",          status:"open",        score:65, value:350_000_000,   owner:"Lê Văn Nam",    createdAt:"11/04/2026", avatar:"LT" },
  { id:"ld3", name:"Trần Công Minh",  company:"Đất Xanh Group",    email:"minh@datxanh.vn",    phone:"0955 555 666", source:"LinkedIn",     stage:"new",          status:"open",        score:80, value:1_200_000_000, owner:"Nguyễn Lan Anh",createdAt:"12/04/2026", avatar:"TM" },
  { id:"ld4", name:"Nguyễn Thu Hằng", company:"VNG Corporation",   email:"hang@vng.vn",        phone:"0966 777 888", source:"Cold email",   stage:"contacted",    status:"open",        score:55, value:600_000_000,   owner:"Trần Đức Minh", createdAt:"05/04/2026", avatar:"NH" },
  { id:"ld5", name:"Phạm Hữu Nghĩa",  company:"Thế Giới Di Động",  email:"nghia@tgdd.vn",      phone:"0977 999 000", source:"Exhibition",   stage:"contacted",    status:"open",        score:88, value:2_000_000_000, owner:"Phạm Thu Hà",   createdAt:"06/04/2026", avatar:"PN" },
  { id:"ld6", name:"Bùi Thị Hương",   company:"Hoa Sen Group",     email:"huong@hoasen.vn",    phone:"0988 001 002", source:"Referral",     stage:"contacted",    status:"open",        score:61, value:450_000_000,   owner:"Lê Văn Nam",    createdAt:"07/04/2026", avatar:"BH" },
  { id:"ld7", name:"Hoàng Anh Tuấn",  company:"Viettel",           email:"tuan@viettel.vn",    phone:"0999 003 004", source:"Inbound call", stage:"qualified",    status:"open",        score:91, value:5_000_000_000, owner:"Nguyễn Lan Anh",createdAt:"01/04/2026", avatar:"HT" },
  { id:"ld8", name:"Đặng Thị Nga",    company:"BIDV",              email:"nga@bidv.vn",        phone:"0911 005 006", source:"Website",      stage:"qualified",    status:"open",        score:78, value:1_800_000_000, owner:"Trần Đức Minh", createdAt:"02/04/2026", avatar:"DN" },
  { id:"ld9", name:"Vũ Tiến Dũng",    company:"Techcombank",       email:"dung@tcb.vn",        phone:"0922 007 008", source:"LinkedIn",     stage:"qualified",    status:"open",        score:84, value:2_500_000_000, owner:"Phạm Thu Hà",   createdAt:"03/04/2026", avatar:"VD" },
];

const initOpportunities: CrmOpportunity[] = [
  { id:"op1", title:"Triển khai ERP VinGroup",     companyId:"co4", companyName:"VinGroup",        contactName:"Lê Thị Hoa",   value:2_500_000_000, stage:"prospect",    status:"open", probability:20,  closeDate:"30/06/2026", owner:"Phạm Thu Hà",   avatar:"VG" },
  { id:"op2", title:"Nâng cấp CRM FPT",            companyId:"co3", companyName:"FPT Software",    contactName:"Phạm Q.Đức",   value:850_000_000,   stage:"prospect",    status:"open", probability:25,  closeDate:"15/05/2026", owner:"Nguyễn Lan Anh",avatar:"FP" },
  { id:"op3", title:"Cloud Migration Masan",       companyId:"co5", companyName:"Masan Group",     contactName:"Hoàng T.Lan",  value:1_400_000_000, stage:"demo",        status:"open", probability:40,  closeDate:"20/05/2026", owner:"Lê Văn Nam",    avatar:"MS" },
  { id:"op4", title:"SaaS License TechVision",     companyId:"co1", companyName:"TechVision JSC",  contactName:"Ng.M.Tuấn",    value:360_000_000,   stage:"demo",        status:"open", probability:55,  closeDate:"30/04/2026", owner:"Phạm Thu Hà",   avatar:"TV" },
  { id:"op5", title:"Data Analytics Saigon Foods", companyId:"co2", companyName:"Saigon Foods",    contactName:"Trần Thị Mai", value:680_000_000,   stage:"proposal",    status:"open", probability:65,  closeDate:"10/05/2026", owner:"Lê Văn Nam",    avatar:"SF" },
  { id:"op6", title:"Security Audit An Phat",      companyId:"co6", companyName:"An Phat Holdings",contactName:"Bùi Văn An",   value:480_000_000,   stage:"proposal",    status:"open", probability:70,  closeDate:"25/04/2026", owner:"Nguyễn Lan Anh",avatar:"AP" },
  { id:"op7", title:"Bảo mật hệ thống Vinamilk",  companyId:"co4", companyName:"Vinamilk",        contactName:"Lê Thị Hoa",   value:920_000_000,   stage:"negotiation", status:"open", probability:80,  closeDate:"20/04/2026", owner:"Trần Đức Minh", avatar:"VL" },
  { id:"op8", title:"Helpdesk System Bamboo",      companyId:"co8", companyName:"Bamboo Airways",  contactName:"Đỗ T.Thanh",   value:290_000_000,   stage:"closed",      status:"won",  probability:100, closeDate:"01/03/2026", owner:"Trần Đức Minh", avatar:"BA" },
  { id:"op9", title:"Mobile App VietJet",          companyId:"co9", companyName:"VietJet Air",     contactName:"Ngô V.Hùng",   value:650_000_000,   stage:"closed",      status:"won",  probability:100, closeDate:"15/02/2026", owner:"Phạm Thu Hà",   avatar:"VJ" },
];

const initActivities: CrmActivity[] = [
  { id:"av1",  type:"call",    entityType:"opportunity", entityId:"op7", entityName:"Vinamilk",         title:"Gọi xác nhận điều khoản hợp đồng",      description:"Hai bên thống nhất SLA 99.9%, triển khai 3 tháng.",      date:"15/04/2026", status:"done",       owner:"Trần Đức Minh" },
  { id:"av2",  type:"meeting", entityType:"opportunity", entityId:"op5", entityName:"Saigon Foods",     title:"Demo Analytics Dashboard",               description:"Khách hàng hài lòng, yêu cầu thêm module export Excel.", date:"14/04/2026", status:"done",       owner:"Lê Văn Nam" },
  { id:"av3",  type:"email",   entityType:"lead",        entityId:"ld7", entityName:"Viettel",          title:"Gửi đề xuất gói Enterprise",             description:"Đã gửi proposal 3 gói: Basic / Pro / Enterprise.",       date:"13/04/2026", status:"sent",       owner:"Nguyễn Lan Anh" },
  { id:"av4",  type:"note",    entityType:"contact",     entityId:"ct3", entityName:"Phạm Quang Đức",   title:"Ghi chú sau buổi gặp",                  description:"Anh Đức muốn demo thêm tính năng CI/CD integration.",    date:"12/04/2026", status:"done",       owner:"Nguyễn Lan Anh" },
  { id:"av5",  type:"call",    entityType:"lead",        entityId:"ld5", entityName:"Thế Giới Di Động", title:"Gọi follow-up sau triển lãm",            description:"Hẹn gặp ngày 18/04 để trình bày giải pháp chi tiết.",   date:"12/04/2026", status:"done",       owner:"Phạm Thu Hà" },
  { id:"av6",  type:"task",    entityType:"opportunity", entityId:"op5", entityName:"Saigon Foods",     title:"Chuẩn bị đề xuất module export",         description:"",                                                        date:"20/04/2026", status:"pending",    owner:"Lê Văn Nam",    priority:"high",   dueDate:"18/04/2026" },
  { id:"av7",  type:"task",    entityType:"opportunity", entityId:"op7", entityName:"Vinamilk",         title:"Review bản thảo hợp đồng",              description:"",                                                        date:"16/04/2026", status:"in_progress",owner:"Trần Đức Minh",priority:"urgent", dueDate:"16/04/2026" },
  { id:"av8",  type:"task",    entityType:"lead",        entityId:"ld7", entityName:"Viettel",          title:"Chuẩn bị demo cho Viettel",             description:"",                                                        date:"20/04/2026", status:"pending",    owner:"Nguyễn Lan Anh",priority:"high",   dueDate:"20/04/2026" },
  { id:"av9",  type:"task",    entityType:"lead",        entityId:"ld1", entityName:"Nova Group",       title:"Gửi email giới thiệu sản phẩm",         description:"",                                                        date:"17/04/2026", status:"pending",    owner:"Phạm Thu Hà",   priority:"normal", dueDate:"17/04/2026" },
  { id:"av10", type:"meeting", entityType:"opportunity", entityId:"op7", entityName:"Vinamilk",         title:"Ký kết hợp đồng tại trụ sở Vinamilk",   description:"Cần mang theo 2 bản hợp đồng, stamp công ty.",          date:"17/04/2026", status:"scheduled",  owner:"Trần Đức Minh" },
  { id:"av11", type:"call",    entityType:"lead",        entityId:"ld9", entityName:"Techcombank",      title:"Gọi xác nhận nhu cầu",                  description:"",                                                        date:"16/04/2026", status:"pending",    owner:"Phạm Thu Hà" },
  { id:"av12", type:"email",   entityType:"opportunity", entityId:"op6", entityName:"An Phat Holdings", title:"Gửi báo giá Security Audit",             description:"Đã gửi 2 phương án: Onsite audit & Remote assessment.",  date:"15/04/2026", status:"sent",       owner:"Nguyễn Lan Anh" },
  { id:"av13", type:"email",   entityType:"lead",        entityId:"ld8", entityName:"BIDV",             title:"Nhận yêu cầu RFP từ BIDV",               description:"BIDV yêu cầu nộp RFP trước 25/04/2026.",                date:"14/04/2026", status:"received",   owner:"Trần Đức Minh" },
  { id:"av14", type:"note",    entityType:"company",     entityId:"co1", entityName:"TechVision JSC",   title:"KH đang xem xét mở rộng hợp đồng",      description:"Tiềm năng upsell ~500M vào Q4/2026.",                    date:"11/04/2026", status:"done",       owner:"Phạm Thu Hà" },
  { id:"av15", type:"meeting", entityType:"lead",        entityId:"ld5", entityName:"Thế Giới Di Động", title:"Buổi trình bày giải pháp",               description:"",                                                        date:"18/04/2026", status:"scheduled",  owner:"Phạm Thu Hà" },
];

// initInvoices moved to CrmInvoiceContext (shared with Finance module)

const initContracts: CrmContract[] = [
  { id:"hd1", entityType:"company", entityId:"co1",  entityName:"TechVision JSC",   contractNo:"HĐ-2025-001", title:"Hợp đồng hợp tác phân phối",      startDate:"10/01/2025", endDate:"09/01/2027", value:900_000_000,    type:"partnership", status:"active",  description:"Hợp tác phân phối tại miền Nam",           signedBy:"Nguyễn M.Tuấn", owner:"Phạm Thu Hà" },
  { id:"hd2", entityType:"company", entityId:"co2",  entityName:"FPT Software",     contractNo:"HĐ-2024-002", title:"Hợp đồng hợp tác kỹ thuật",       startDate:"12/03/2024", endDate:"11/03/2026", value:7_000_000_000,  type:"partnership", status:"expired", description:"Phát triển và tích hợp giải pháp phần mềm", signedBy:"Phạm Q.Đức",    owner:"Nguyễn Lan Anh" },
  { id:"hd3", entityType:"company", entityId:"co3",  entityName:"Masan Group",      contractNo:"HĐ-2024-003", title:"Thỏa thuận liên doanh sản phẩm",  startDate:"03/12/2024", endDate:"02/12/2026", value:1_900_000_000,  type:"partnership", status:"active",  description:"Liên doanh phát triển nền tảng TMĐT",       signedBy:"Hoàng T.Lan",   owner:"Lê Văn Nam" },
  { id:"hd4", entityType:"company", entityId:"co4",  entityName:"An Phat Holdings", contractNo:"HĐ-2024-004", title:"Hợp đồng cung cấp vật tư",        startDate:"15/11/2024", endDate:"14/11/2026", value:1_240_000_000,  type:"service",     status:"active",  description:"Cung cấp nguyên vật liệu và thiết bị",      signedBy:"Bùi Văn An",    owner:"Nguyễn Lan Anh" },
  { id:"hd5", entityType:"company", entityId:"co6",  entityName:"Nova Real Estate", contractNo:"HĐ-2022-005", title:"Hợp đồng dịch vụ phần mềm 3 năm", startDate:"15/09/2022", endDate:"14/09/2025", value:5_550_000_000,  type:"service",     status:"expired", description:"Cung cấp và bảo trì phần mềm QL BĐS",       signedBy:"CEO Nova",       owner:"Trần Đức Minh" },
  { id:"hd6", entityType:"company", entityId:"co7",  entityName:"Hoa Sen Group",    contractNo:"HĐ-2022-006", title:"Hợp đồng bảo mật dài hạn",        startDate:"15/02/2022", endDate:"14/02/2025", value:9_600_000_000,  type:"service",     status:"expired", description:"Dịch vụ bảo mật và giám sát hệ thống",      signedBy:"CISO Hoa Sen",   owner:"Trần Đức Minh" },
  { id:"hd7", entityType:"company", entityId:"co8",  entityName:"Mirae Asset VN",   contractNo:"HĐ-2023-007", title:"Hợp đồng license phần mềm",       startDate:"20/01/2023", endDate:"19/01/2026", value:7_800_000_000,  type:"sale",        status:"expired", description:"License nền tảng quản lý đầu tư",            signedBy:"IT Director",    owner:"Phạm Thu Hà" },
  { id:"hd8", entityType:"company", entityId:"co6",  entityName:"Nova Real Estate", contractNo:"HĐ-2026-008", title:"Hợp đồng dịch vụ phần mềm 2026",  startDate:"01/04/2026", endDate:"31/03/2027", value:1_920_000_000,  type:"service",     status:"active",  description:"Gia hạn và nâng cấp phần mềm quản lý",      signedBy:"CEO Nova",       owner:"Trần Đức Minh" },
  { id:"hd9", entityType:"lead",    entityId:"ld7",  entityName:"Viettel",          contractNo:"HĐ-2026-009", title:"Đề xuất hợp đồng Enterprise",     startDate:"13/04/2026", endDate:"12/04/2029", value:15_000_000_000, type:"service",     status:"draft",   description:"Gói Enterprise 3 năm toàn diện",             signedBy:"Đang chờ ký",    owner:"Nguyễn Lan Anh" },
];

/* ═══════════ Helpers ═══════════ */
const fmt = (n: number) =>
  n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + " tỷ"
  : n >= 1_000_000   ? (n / 1_000_000).toFixed(0) + " tr"
  : n.toLocaleString("vi-VN");

const avatarColors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-pink-500"];

const INDUSTRIES = ["CNTT","F&B","FMCG","Sản xuất","Hàng không","Tài chính","Bất động sản","Startup","Bán lẻ","Logistics"];

/* ═══════════ Props ═══════════ */
interface CRMViewProps {
  itemId: string;
  onClose: () => void;
  onNavigate?: (itemId: string) => void;
}

/* ═══════════ Main Component ═══════════ */
export function CRMView({ itemId, onClose, onNavigate }: CRMViewProps) {
  /* ── data state (always at top, unconditional) ── */
  const [companies, setCompanies]         = useState<CrmCompany[]>(initCompanies);
  const [contacts, setContacts]           = useState<CrmContact[]>(initContacts);
  const [leads, setLeads]                 = useState<CrmLead[]>(initLeads);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>(initOpportunities);
  const [activities, setActivities]       = useState<CrmActivity[]>(initActivities);
  /* invoices are shared with the Finance module via CrmInvoiceContext */
  const { crmInvoices: invoices, setCrmInvoices: setInvoices } = useCrmInvoices();
  const [contracts, setContracts]         = useState<CrmContract[]>(initContracts);

  /* ── modal state ── */
  const [modal, setModal] = useState<{
    type: "company" | "contact" | "lead" | "opportunity" | "activity" | "invoice" | "contract";
    data: Record<string, string | number>;
    isEdit: boolean;
    editId?: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ entity: string; id: string; name: string } | null>(null);

  /* ── per-view local state (all declared unconditionally to satisfy Rules of Hooks) ── */
  const [compTab,      setCompTab]    = useState("customer");
  const [compStatus,   setCompStatus] = useState("all");
  const [compSearch,   setCompSearch] = useState("");
  const [contSearch,   setContSearch] = useState("");
  const [leadSearch,   setLeadSearch] = useState("");
  const [leadTab,      setLeadTab]    = useState<"all"|"new"|"contacted"|"qualified"|"converted"|"disqualified">("all");
  const [oppSearch,      setOppSearch]      = useState("");
  const [oppStatusFilter, setOppStageFilter] = useState<"all"|CrmOpportunity["status"]>("all");
  const [oppOwnerFilter,  setOppOwnerFilter] = useState("all");
  const [oppSortBy,       setOppSortBy]      = useState<"value" | "closeDate">("value");
  const [oppSortDir,      setOppSortDir]     = useState<"asc" | "desc">("desc");
  const [dragging,     setDragging]   = useState<string | null>(null);
  const [dragOver,     setDragOver]   = useState<string | null>(null);
  const [showDone,     setShowDone]   = useState(false);
  const [detailView,   setDetailView] = useState<{ entityType: "company"|"lead"|"contact"|"opportunity"|"activity"; id: string } | null>(null);
  const [actTab,       setActTab]     = useState("all");
  const [actSearch,    setActSearch]  = useState("");
  const [stgPipeline,  setStgPipeline] = useState(["Prospect","Demo","Proposal","Negotiation","Closed"]);
  const [oppCloseModal, setOppCloseModal] = useState<{ id: string } | null>(null);
  const [stgProducts,  setStgProducts] = useState([{name:"Phần mềm CRM",price:"500,000,000"},{name:"Dịch vụ triển khai",price:"200,000,000"},{name:"Bảo trì hàng năm",price:"80,000,000"},{name:"Tư vấn chiến lược",price:"150,000,000"}]);
  const [stgSources,   setStgSources]  = useState(["Website","Referral","LinkedIn","Cold email","Exhibition","Inbound call","Social media","Partner"]);
  const [stgUsers,     setStgUsers]    = useState([{name:"Phạm Thu Hà",role:"Sales Manager"},{name:"Lê Văn Nam",role:"Sales Executive"},{name:"Nguyễn Lan Anh",role:"Sales Executive"},{name:"Trần Đức Minh",role:"Account Manager"}]);
  const [stgNewInput,  setStgNewInput] = useState("");
  const [detailTab,    setDetailTab]  = useState<"info"|"invoices"|"contracts">("info");
  const [invSearch,    setInvSearch]  = useState("");
  const [ctcSearch,    setCtcSearch]  = useState("");
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    setDetailView(null);
    setDetailTab("info");
    setInvSearch("");
    setCtcSearch("");
  }, [itemId]);

  const closeModal = () => setModal(null);

  /* ── shared mini-components ── */
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex gap-2">
      <span className="text-[11px] text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-[12px] text-gray-800 font-medium flex-1 min-w-0 break-all">{value || "—"}</span>
    </div>
  );
  const SumBar = ({ items }: { items: { label: string; value: number; onClick: () => void }[] }) => (
    <div className="flex gap-2 pt-2 border-t border-gray-100">
      {items.map(item => (
        <button key={item.label} onClick={item.onClick}
          className="flex-1 flex flex-col items-center py-2 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all group">
          <p className="text-[16px] font-bold text-gray-800 group-hover:text-blue-600">{item.value}</p>
          <p className="text-[10px] text-gray-500 group-hover:text-blue-500">{item.label} <ChevronsRight className="w-3 h-3 inline" /></p>
        </button>
      ))}
    </div>
  );

  /* ── nav bar ── */
  const NavBar = () => (
    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-2">
      <button onClick={onClose} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-white transition-all">
        <ArrowLeft className="w-3.5 h-3.5" /> CRM
      </button>
    </div>
  );

  /* ═══════════ OPP CLOSE MODAL (Won / Lost) ═══════════ */
  if (oppCloseModal) {
    const opp = opportunities.find(o => o.id === oppCloseModal.id);
    return (
      <div className="h-full flex items-center justify-center bg-white p-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 max-w-sm w-full text-center">
          <p className="text-[15px] font-semibold text-gray-900 mb-1">Đóng cơ hội</p>
          <p className="text-[12px] text-gray-500 mb-1 font-medium truncate">{opp?.title}</p>
          <p className="text-[11px] text-gray-400 mb-5">Chọn kết quả để hoàn tất</p>
          <div className="flex gap-2">
            <button onClick={() => {
              setOpportunities(p => p.map(o => o.id === oppCloseModal.id ? { ...o, stage:"closed", status:"won", probability:100 } : o));
              toast.success("Deal Closed — Won!");
              setOppCloseModal(null);
            }} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-all">
              Won — Thắng
            </button>
            <button onClick={() => {
              setOpportunities(p => p.map(o => o.id === oppCloseModal.id ? { ...o, stage:"closed", status:"lost", probability:0 } : o));
              toast.success("Deal Closed — Lost");
              setOppCloseModal(null);
            }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-medium hover:bg-gray-50 transition-all">
              Lost — Thua
            </button>
          </div>
          <button onClick={() => setOppCloseModal(null)} className="mt-3 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">Hủy</button>
        </div>
      </div>
    );
  }

  /* ═══════════ DELETE CONFIRM ═══════════ */
  if (deleteConfirm) {
    return (
      <div className="h-full flex items-center justify-center bg-white p-8">
        <div className="bg-white rounded-2xl border border-red-100 shadow-xl p-6 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-900 mb-1">Xóa {deleteConfirm.entity}?</p>
          <p className="text-[12px] text-gray-500 mb-5">"{deleteConfirm.name}" sẽ bị xóa vĩnh viễn.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-all">Hủy</button>
            <button onClick={() => {
              const { entity, id } = deleteConfirm;
              if (entity === "đối tác") setCompanies(p => p.filter(c => c.id !== id));
              else if (entity === "liên hệ") setContacts(p => p.filter(c => c.id !== id));
              else if (entity === "lead") setLeads(p => p.filter(c => c.id !== id));
              else if (entity === "cơ hội") setOpportunities(p => p.filter(c => c.id !== id));
              else if (entity === "hoạt động") setActivities(p => p.filter(c => c.id !== id));
              else if (entity === "hóa đơn") setInvoices(p => p.filter(c => c.id !== id));
              else if (entity === "hợp đồng") setContracts(p => p.filter(c => c.id !== id));
              toast.success("Đã xóa thành công");
              setDeleteConfirm(null);
              goBack();
            }} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-all">Xóa</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ MODAL FORM ═══════════ */
  if (modal) {
    const f = modal.data;
    const set = (k: string, v: string | number) => setModal(m => m ? { ...m, data: { ...m.data, [k]: v } } : m);

    const saveCompany = () => {
      if (!f.name) return toast.error("Nhập tên công ty");
      const company: CrmCompany = {
        id: modal.editId || `co${Date.now()}`,
        name: String(f.name || ""),
        type: (f.type as CrmCompany["type"]) || "customer",
        industry: String(f.industry || "CNTT"),
        size: String(f.size || "<50"),
        address: String(f.address || ""),
        website: String(f.website || ""),
        email: String(f.email || ""), phone: String(f.phone || ""),
        owner: String(f.owner || stgUsers[0]?.name || ""),
        status: (f.status as CrmCompany["status"]) || "inactive",
        revenue: Number(f.revenue) || 0, contacts: Number(f.contacts) || 0,
        createdAt: modal.isEdit ? String(f.createdAt || "") : new Date().toLocaleDateString("vi-VN"),
      };
      if (modal.isEdit) { setCompanies(p => p.map(c => c.id === modal.editId ? company : c)); toast.success("Đã cập nhật công ty"); }
      else { setCompanies(p => [...p, company]); toast.success("Đã thêm công ty mới"); }
      closeModal();
    };

    const saveContact = () => {
      if (!f.name) return toast.error("Nhập tên liên hệ");
      const contact: CrmContact = {
        id: modal.editId || `ct${Date.now()}`,
        companyId: String(f.companyId || ""), companyName: String(f.companyName || ""),
        name: String(f.name || ""), title: String(f.title || ""),
        email: String(f.email || ""), phone: String(f.phone || ""),
        status: (f.status as CrmContact["status"]) || "active",
        owner: String(f.owner || stgUsers[0]?.name || ""),
        lastContact: modal.isEdit ? String(f.lastContact || "") : "Hôm nay",
        avatar: String(f.name || "").slice(0, 2).toUpperCase(),
        tier: (f.tier as CrmContact["tier"]) || "normal",
      };
      if (modal.isEdit) { setContacts(p => p.map(c => c.id === modal.editId ? contact : c)); toast.success("Đã cập nhật liên hệ"); }
      else { setContacts(p => [...p, contact]); toast.success("Đã thêm liên hệ mới"); }
      closeModal();
    };

    const saveLead = () => {
      if (!f.name) return toast.error("Nhập tên lead");
      const stage = (f.stage as CrmLead["stage"]) || "new";
      const status: CrmLead["status"] = stage === "disqualified" ? "disqualified" : stage === "converted" ? "converted" : "open";
      const lead: CrmLead = {
        id: modal.editId || `ld${Date.now()}`,
        name: String(f.name || ""), company: String(f.company || ""),
        email: String(f.email || ""), phone: String(f.phone || ""),
        source: String(f.source || stgSources[0] || ""),
        stage, status,
        score: Number(f.score) || 50, value: Number(f.value) || 0,
        owner: String(f.owner || stgUsers[0]?.name || ""),
        createdAt: modal.isEdit ? String(f.createdAt || "") : new Date().toLocaleDateString("vi-VN"),
        avatar: String(f.name || "").slice(0, 2).toUpperCase(),
      };
      if (modal.isEdit) { setLeads(p => p.map(c => c.id === modal.editId ? lead : c)); toast.success("Đã cập nhật lead"); }
      else { setLeads(p => [...p, lead]); toast.success("Đã thêm lead mới"); }
      closeModal();
    };

    const saveOpportunity = () => {
      if (!f.title)       return toast.error("Nhập tên cơ hội");
      if (!f.companyName) return toast.error("Cơ hội phải có Công ty");
      if (!f.contactName) return toast.error("Cơ hội phải có Người liên hệ");
      if (!Number(f.value)) return toast.error("Cơ hội phải có Giá trị (> 0)");
      const stage = (f.stage as CrmOpportunity["stage"]) || "prospect";
      const status: CrmOpportunity["status"] = stage === "closed" ? ((f.status as CrmOpportunity["status"]) || "won") : "open";
      const opp: CrmOpportunity = {
        id: modal.editId || `op${Date.now()}`,
        title: String(f.title || ""), companyId: String(f.companyId || ""),
        companyName: String(f.companyName || ""), contactName: String(f.contactName || ""),
        value: Number(f.value) || 0,
        stage, status,
        probability: Number(f.probability) || 10,
        closeDate: String(f.closeDate || ""), owner: String(f.owner || stgUsers[0]?.name || ""),
        avatar: String(f.companyName || "").slice(0, 2).toUpperCase(),
      };
      if (modal.isEdit) { setOpportunities(p => p.map(c => c.id === modal.editId ? opp : c)); toast.success("Đã cập nhật cơ hội"); }
      else { setOpportunities(p => [...p, opp]); toast.success("Đã thêm cơ hội mới"); }
      closeModal();
    };

    const saveActivity = () => {
      if (!f.title) return toast.error("Nhập tiêu đề");
      const act: CrmActivity = {
        id: modal.editId || `av${Date.now()}`,
        type: (f.type as CrmActivity["type"]) || "task",
        entityType: (f.entityType as CrmActivity["entityType"]) || "company",
        entityId: String(f.entityId || ""), entityName: String(f.entityName || ""),
        title: String(f.title || ""), description: String(f.description || ""),
        date: String(f.date || new Date().toLocaleDateString("vi-VN")),
        status: String(f.status || "pending"),
        owner: String(f.owner || stgUsers[0]?.name || ""),
        priority: String(f.priority || "normal"),
        dueDate: String(f.dueDate || ""),
      };
      if (modal.isEdit) { setActivities(p => p.map(c => c.id === modal.editId ? act : c)); toast.success("Đã cập nhật"); }
      else { setActivities(p => [...p, act]); toast.success("Đã thêm mới"); }
      closeModal();
    };

    const saveInvoice = () => {
      if (!f.invoiceNo) return toast.error("Nhập mã hóa đơn");
      const inv: CrmInvoice = {
        id: modal.editId || `inv${Date.now()}`,
        entityType: (f.entityType as CrmInvoice["entityType"]) || "customer",
        entityId: String(f.entityId || ""), entityName: String(f.entityName || ""),
        invoiceNo: String(f.invoiceNo || ""), issueDate: String(f.issueDate || ""),
        dueDate: String(f.dueDate || ""), amount: Number(f.amount) || 0,
        tax: Number(f.tax) || 10,
        status: (f.status as CrmInvoice["status"]) || "draft",
        description: String(f.description || ""), owner: String(f.owner || stgUsers[0]?.name || ""),
      };
      if (modal.isEdit) { setInvoices(p => p.map(i => i.id === modal.editId ? inv : i)); toast.success("Đã cập nhật hóa đơn"); }
      else { setInvoices(p => [...p, inv]); toast.success("Đã tạo hóa đơn mới"); }
      closeModal();
    };

    const saveContract = () => {
      if (!f.contractNo) return toast.error("Nhập mã hợp đồng");
      const ct: CrmContract = {
        id: modal.editId || `ct${Date.now()}`,
        entityType: (f.entityType as CrmContract["entityType"]) || "customer",
        entityId: String(f.entityId || ""), entityName: String(f.entityName || ""),
        contractNo: String(f.contractNo || ""), title: String(f.title || ""),
        startDate: String(f.startDate || ""), endDate: String(f.endDate || ""),
        value: Number(f.value) || 0,
        type: (f.type as CrmContract["type"]) || "service",
        status: (f.status as CrmContract["status"]) || "draft",
        description: String(f.description || ""),
        signedBy: String(f.signedBy || ""), owner: String(f.owner || stgUsers[0]?.name || ""),
      };
      if (modal.isEdit) { setContracts(p => p.map(c => c.id === modal.editId ? ct : c)); toast.success("Đã cập nhật hợp đồng"); }
      else { setContracts(p => [...p, ct]); toast.success("Đã tạo hợp đồng mới"); }
      closeModal();
    };

    const handleSave = () => {
      // Prevent double-click/rapid save
      const now = Date.now();
      if (now - lastSaveRef.current < 300) return;
      lastSaveRef.current = now;

      if (modal.type === "company") saveCompany();
      else if (modal.type === "contact") saveContact();
      else if (modal.type === "lead") saveLead();
      else if (modal.type === "opportunity") saveOpportunity();
      else if (modal.type === "invoice") saveInvoice();
      else if (modal.type === "contract") saveContract();
      else saveActivity();
    };

    const field = (label: string, children: React.ReactNode) => (
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
        {children}
      </div>
    );
    const inp = (k: string, placeholder?: string, type = "text") => (
      <input type={type} value={String(f[k] || "")} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white" />
    );
    const sel = (k: string, options: { value: string; label: string }[]) => (
      <select value={String(f[k] || "")} onChange={e => set(k, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );

    const titleMap: Record<string, string> = {
      company:  modal.isEdit ? "Sửa Công ty"  : "Thêm Công ty",
      invoice:  modal.isEdit ? "Sửa Hóa đơn" : "Tạo Hóa đơn",
      contract: modal.isEdit ? "Sửa Hợp đồng"  : "Tạo Hợp đồng",
      contact: modal.isEdit ? "Sửa Liên hệ" : "Thêm Liên hệ",
      lead: modal.isEdit ? "Sửa Lead" : "Thêm Lead mới",
      opportunity: modal.isEdit ? "Sửa Cơ hội" : "Thêm Cơ hội",
      activity: modal.isEdit ? "Sửa Hoạt động" : "Thêm Hoạt động",
    };

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <button onClick={closeModal} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
            <X className="w-4 h-4" />
          </button>
          <p className="text-[15px] font-semibold text-gray-900 flex-1">{titleMap[modal.type]}</p>
          <button onClick={handleSave} className="px-4 py-1.5 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Lưu
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {modal.type === "company" && <>
            {field("Tên công ty *", inp("name", "VD: Công ty ABC"))}
            <div className="grid grid-cols-2 gap-3">
              {field("Loại", sel("type", [{value:"customer",label:"Khách hàng"},{value:"vendor",label:"Nhà cung cấp"},{value:"partner",label:"Đối tác"}]))}
              {field("Trạng thái", sel("status", [{value:"active",label:"Đang hợp tác"},{value:"inactive",label:"Không HĐ"}]))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Ngành nghề", sel("industry", INDUSTRIES.map(i => ({ value: i, label: i }))))}
              {field("Quy mô", sel("size", ["<50","50-200","200-500","500-1000","1000+"].map(s => ({ value: s, label: s }))))}
            </div>
            {field("Địa chỉ", inp("address", "Quận/Tỉnh, Thành phố"))}
            {field("Website", inp("website", "example.com"))}
            <div className="grid grid-cols-2 gap-3">
              {field("Email", inp("email", "contact@company.com"))}
              {field("Điện thoại", inp("phone", "028 xxxx xxxx"))}
            </div>
            {field("Doanh thu (VNĐ)", inp("revenue", "0", "number"))}
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
          </>}

          {modal.type === "contact" && <>
            {field("Họ tên *", inp("name", "Nguyễn Văn A"))}
            {field("Chức danh", inp("title", "CTO, Giám đốc..."))}
            {field("Tên công ty", inp("companyName", "Công ty..."))}
            <div className="grid grid-cols-2 gap-3">
              {field("Email", inp("email", "email@company.com"))}
              {field("Điện thoại", inp("phone", "09xx xxx xxx"))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Loại", sel("tier", [{value:"normal",label:"Thường"},{value:"vip",label:"VIP"}]))}
              {field("Trạng thái", sel("status", [{value:"active",label:"Hoạt động"},{value:"inactive",label:"Không HĐ"}]))}
            </div>
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
          </>}

          {modal.type === "lead" && <>
            {field("Tên lead *", inp("name", "Nguyễn Văn A"))}
            {field("Công ty", inp("company", "Tên công ty"))}
            <div className="grid grid-cols-2 gap-3">
              {field("Email", inp("email", "email@..."))}
              {field("Điện thoại", inp("phone", "09xx..."))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Nguồn", sel("source", stgSources.map(s => ({ value: s, label: s }))))}
              {field("Giai đoạn", (() => {
                const stageLbl: Record<string,string> = { new:"Mới", contacted:"Đã liên hệ", qualified:"Đủ điều kiện", converted:"Đã chuyển đổi", disqualified:"Loại bỏ" };
                const stageColor: Record<string,string> = { new:"bg-blue-50 border-blue-100 text-blue-700", contacted:"bg-amber-50 border-amber-100 text-amber-700", qualified:"bg-purple-50 border-purple-100 text-purple-700", converted:"bg-emerald-50 border-emerald-100 text-emerald-700", disqualified:"bg-gray-50 border-gray-200 text-gray-500" };
                const cur = String(f.stage || "new");
                return <div className={`flex items-center h-9 px-3 rounded-lg border ${stageColor[cur] || stageColor.new}`}>
                  <span className="text-[12px] font-semibold">{stageLbl[cur] || cur}</span>
                  <span className="ml-2 text-[10px] opacity-60">(thay đổi qua nút tiến)</span>
                </div>;
              })())}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Giá trị (VNĐ)", inp("value", "0", "number"))}
              {field("Score (0-100)", inp("score", "50", "number"))}
            </div>
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
          </>}

          {modal.type === "opportunity" && <>
            {field("Tên cơ hội *", inp("title", "VD: Triển khai ERP..."))}
            {field("Công ty *", inp("companyName", "Tên công ty..."))}
            {field("Người liên hệ *", inp("contactName", "Tên người liên hệ"))}
            <div className="grid grid-cols-2 gap-3">
              {field("Stage", sel("stage", [
                {value:"prospect",    label:"Prospect"},
                {value:"demo",        label:"Demo"},
                {value:"proposal",    label:"Proposal"},
                {value:"negotiation", label:"Negotiation"},
                {value:"closed",      label:"Closed"},
              ]))}
              {field("Xác suất (%)", inp("probability", "10", "number"))}
            </div>
            {String(f.stage) === "closed" && field("Status *", sel("status", [{value:"won",label:"Won — Thắng"},{value:"lost",label:"Lost — Thua"}]))}
            <div className="grid grid-cols-2 gap-3">
              {field("Giá trị (VNĐ) *", inp("value", "0", "number"))}
              {field("Ngày dự kiến đóng", inp("closeDate", "DD/MM/YYYY"))}
            </div>
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
            <div className="px-3 py-2 bg-blue-50 rounded-lg text-[11px] text-blue-600">
              <span className="font-semibold">Stage</span> = bước pipeline · <span className="font-semibold">Status</span> tự động (Open / Won / Lost)
            </div>
          </>}

          {modal.type === "activity" && <>
            {field("Tiêu đề *", inp("title", "Tiêu đề hoạt động..."))}
            <div className="grid grid-cols-2 gap-3">
              {field("Loại", sel("type", [
                {value:"task",label:"Công việc"},{value:"call",label:"Cuộc gọi"},
                {value:"meeting",label:"Cuộc họp"},{value:"email",label:"Email"},
                {value:"note",label:"Ghi chú"},
              ]))}
              {field("Trạng thái", sel("status", [
                {value:"pending",label:"Chờ xử lý"},{value:"in_progress",label:"Đang làm"},
                {value:"scheduled",label:"Đã lên lịch"},{value:"done",label:"Hoàn thành"},
                {value:"sent",label:"Đã gửi"},{value:"received",label:"Đã nhận"},
              ]))}
            </div>
            {field("Liên quan đến", inp("entityName", "Tên khách hàng/lead..."))}
            <div className="grid grid-cols-2 gap-3">
              {field("Ngày", inp("date", "DD/MM/YYYY"))}
              {field("Deadline", inp("dueDate", "DD/MM/YYYY"))}
            </div>
            {field("Ưu tiên", sel("priority", [
              {value:"urgent",label:"Khẩn cấp"},{value:"high",label:"Cao"},
              {value:"normal",label:"Bình thường"},{value:"low",label:"Thấp"},
            ]))}
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
            {field("Ghi chú", <textarea value={String(f.description || "")} onChange={e => set("description", e.target.value)}
              rows={3} placeholder="Mô tả chi tiết..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white resize-none" />)}
          </>}

          {modal.type === "invoice" && <>
            <div className="px-3 py-2 bg-blue-50 rounded-lg text-[12px] text-blue-700 font-medium">
              {f.entityName ? `Hóa đơn cho: ${f.entityName}` : "Hóa đơn mới"}
            </div>
            {field("Mã hóa đơn *", inp("invoiceNo", "VD: HD-2026-010"))}
            <div className="grid grid-cols-2 gap-3">
              {field("Ngày phát hành", inp("issueDate", "DD/MM/YYYY"))}
              {field("Hạn thanh toán", inp("dueDate", "DD/MM/YYYY"))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Số tiền (VNĐ)", inp("amount", "0", "number"))}
              {field("Thuế (%)", inp("tax", "10", "number"))}
            </div>
            {Number(f.amount) > 0 && (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-[12px] text-gray-600">
                Tổng cộng: <span className="font-bold text-blue-600">{fmt(Number(f.amount) * (1 + Number(f.tax || 0) / 100))}</span>
              </div>
            )}
            {field("Trạng thái", sel("status", [
              {value:"draft",label:"Nháp"},{value:"sent",label:"Đã gửi"},
              {value:"paid",label:"Đã thanh toán"},{value:"overdue",label:"Quá hạn"},{value:"cancelled",label:"Đã hủy"},
            ]))}
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
            {field("Mô tả", <textarea value={String(f.description || "")} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="Nội dung hóa đơn..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white resize-none" />)}
          </>}

          {modal.type === "contract" && <>
            <div className="px-3 py-2 bg-emerald-50 rounded-lg text-[12px] text-emerald-700 font-medium">
              {f.entityName ? `Hợp đồng với: ${f.entityName}` : "Hợp đồng mới"}
            </div>
            {field("Mã hợp đồng *", inp("contractNo", "VD: HĐ-KH-2026-001"))}
            {field("Tên hợp đồng", inp("title", "VD: Hợp đồng dịch vụ phần mềm"))}
            <div className="grid grid-cols-2 gap-3">
              {field("Loại HĐ", sel("type", [
                {value:"sale",label:"Mua bán"},{value:"service",label:"Dịch vụ"},
                {value:"partnership",label:"Hợp tác"},{value:"nda",label:"NDA"},{value:"other",label:"Khác"},
              ]))}
              {field("Trạng thái", sel("status", [
                {value:"draft",label:"Nháp"},{value:"active",label:"Đang hiệu lực"},
                {value:"expired",label:"Hết hạn"},{value:"cancelled",label:"Đã hủy"},
              ]))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Ngày bắt đầu", inp("startDate", "DD/MM/YYYY"))}
              {field("Ngày kết thúc", inp("endDate", "DD/MM/YYYY"))}
            </div>
            {field("Giá trị hợp đồng (VNĐ)", inp("value", "0", "number"))}
            {field("Người ký", inp("signedBy", "Tên người ký"))}
            {field("Phụ trách", sel("owner", stgUsers.map(u => ({ value: u.name, label: u.name }))))}
            {field("Mô tả", <textarea value={String(f.description || "")} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="Nội dung hợp đồng..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white resize-none" />)}
          </>}
        </div>
      </div>
    );
  }

  /* ═══════════ ENTITY DETAIL VIEW ═══════════ */
  if (detailView) {
    const { entityType, id } = detailView;
    const goBack = () => { setDetailView(null); setDetailTab("info"); setInvSearch(""); setCtcSearch(""); };

    /* ── CONTACT DETAIL ── */
    if (entityType === "contact") {
      const c = contacts.find(x => x.id === id);
      if (!c) { goBack(); return null; }
      return (
        <div className="h-full flex flex-col bg-white">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 shrink-0">
            <button onClick={goBack} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{c.name}</p>
              <p className="text-[10px] text-gray-400">Liên hệ</p>
            </div>
            <button onClick={() => setModal({ type:"contact", isEdit:true, editId:c.id, data:{...c as unknown as Record<string,string|number>} })}
              className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleteConfirm({ entity:"liên hệ", id:c.id, name:c.name })}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <Row label="Công ty"       value={c.companyName} />
            <Row label="Chức vụ"       value={c.title} />
            <Row label="Email"         value={c.email} />
            <Row label="Điện thoại"    value={c.phone} />
            <div className="flex gap-2 items-center">
              <span className="text-[11px] text-gray-400 w-28 shrink-0">Hạng</span>
              {c.tier === "vip"
                ? <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">VIP</span>
                : <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-500">Thường</span>}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[11px] text-gray-400 w-28 shrink-0">Trạng thái</span>
              {c.status === "active"
                ? <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-700">Hoạt động</span>
                : <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-500">Không HĐ</span>}
            </div>
            <Row label="Phụ trách"     value={c.owner} />
            <Row label="Liên hệ cuối"  value={c.lastContact} />
          </div>
        </div>
      );
    }

    /* ── ACTIVITY DETAIL ── */
    if (entityType === "activity") {
      const a = activities.find(x => x.id === id);
      if (!a) { goBack(); return null; }
      const actTypeLbl: Record<string,string> = { task:"Công việc", call:"Cuộc gọi", meeting:"Cuộc họp", email:"Email", note:"Ghi chú" };
      const actStatusCfg: Record<string,{label:string;color:string;bg:string}> = {
        pending:     { label:"Chờ xử lý",   color:"text-amber-700",   bg:"bg-amber-100"   },
        in_progress: { label:"Đang làm",    color:"text-blue-700",    bg:"bg-blue-100"    },
        scheduled:   { label:"Đã lên lịch", color:"text-purple-700",  bg:"bg-purple-100"  },
        done:        { label:"Hoàn thành",  color:"text-emerald-700", bg:"bg-emerald-100" },
        sent:        { label:"Đã gửi",      color:"text-emerald-700", bg:"bg-emerald-100" },
        received:    { label:"Đã nhận",     color:"text-emerald-700", bg:"bg-emerald-100" },
      };
      const actPriorityCfg: Record<string,{label:string;color:string;bg:string}> = {
        urgent: { label:"Khẩn cấp", color:"text-red-700",   bg:"bg-red-100"   },
        high:   { label:"Cao",      color:"text-amber-700", bg:"bg-amber-100" },
        normal: { label:"Bình thường", color:"text-gray-600",  bg:"bg-gray-100"  },
        low:    { label:"Thấp",     color:"text-blue-600",  bg:"bg-blue-100"  },
      };
      const isDone = ["done","sent","received"].includes(a.status);
      const sc = actStatusCfg[a.status] || actStatusCfg.pending;
      const pc = a.priority ? actPriorityCfg[a.priority] : null;
      return (
        <div className="h-full flex flex-col bg-white">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 shrink-0">
            <button onClick={goBack} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{a.title}</p>
              <p className="text-[10px] text-gray-400">Hoạt động</p>
            </div>
            <button onClick={() => setModal({ type:"activity", isEdit:true, editId:a.id, data:{...a as unknown as Record<string,string|number>} })}
              className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleteConfirm({ entity:"hoạt động", id:a.id, name:a.title })}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <Row label="Loại"          value={actTypeLbl[a.type] || a.type} />
            <Row label="Liên quan đến" value={a.entityName} />
            <div className="flex gap-2 items-center">
              <span className="text-[11px] text-gray-400 w-28 shrink-0">Trạng thái</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
            </div>
            {pc && (
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-gray-400 w-28 shrink-0">Ưu tiên</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${pc.bg} ${pc.color}`}>{pc.label}</span>
              </div>
            )}
            <Row label="Ngày"          value={a.date} />
            {a.dueDate && <Row label="Deadline" value={a.dueDate} />}
            <Row label="Phụ trách"     value={a.owner} />
            {a.description && <Row label="Mô tả" value={a.description} />}
            {!isDone && (
              <button onClick={() => {
                setActivities(p => p.map(x => x.id === a.id ? { ...x, status:"done" } : x));
                toast.success("Đã đánh dấu hoàn thành");
                goBack();
              }} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Đánh dấu hoàn thành
              </button>
            )}
          </div>
        </div>
      );
    }

    /* ── OPPORTUNITY DETAIL ── */
    if (entityType === "opportunity") {
      const o = opportunities.find(x => x.id === id);
      if (!o) { goBack(); return null; }
      const oppStageLbl: Record<string,string> = { prospect:"Prospect", demo:"Demo", proposal:"Proposal", negotiation:"Negotiation", closed:"Closed" };
      const oppStatusCfg: Record<string,{label:string;color:string;bg:string}> = {
        open: { label:"Đang mở", color:"text-blue-700",    bg:"bg-blue-100"    },
        won:  { label:"Thắng",   color:"text-emerald-700", bg:"bg-emerald-100" },
        lost: { label:"Thua",    color:"text-gray-500",    bg:"bg-gray-100"    },
      };
      const stc = oppStatusCfg[o.status] || oppStatusCfg.open;
      const entInvOpp  = invoices.filter(inv => inv.entityId === o.id);
      const entCtOpp   = contracts.filter(ct => ct.entityId === o.id);
      return (
        <div className="h-full flex flex-col bg-white">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 shrink-0">
            <button onClick={goBack} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{o.title}</p>
              <p className="text-[10px] text-gray-400">Cơ hội</p>
            </div>
            <button onClick={() => setModal({ type:"opportunity", isEdit:true, editId:o.id, data:{...o as unknown as Record<string,string|number>} })}
              className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleteConfirm({ entity:"cơ hội", id:o.id, name:o.title })}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex border-b border-gray-100 shrink-0">
            {[{ key:"info", label:"Thông tin" }, { key:"invoices", label:`Hóa đơn (${entInvOpp.length})` }, { key:"contracts", label:`Hợp đồng (${entCtOpp.length})` }].map(t => (
              <button key={t.key} onClick={() => setDetailTab(t.key as typeof detailTab)}
                className={`flex-1 py-2.5 text-[11.5px] font-medium border-b-2 transition-all ${detailTab === t.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
            ))}
          </div>
          {detailTab === "info" && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <Row label="Công ty"      value={o.companyName} />
              <Row label="Liên hệ"      value={o.contactName} />
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-gray-400 w-28 shrink-0">Stage / Status</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    o.stage === "prospect" ? "bg-blue-100 text-blue-700" :
                    o.stage === "demo" ? "bg-amber-100 text-amber-700" :
                    o.stage === "proposal" ? "bg-purple-100 text-purple-700" :
                    o.stage === "negotiation" ? "bg-orange-100 text-orange-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>{oppStageLbl[o.stage] || o.stage}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${stc.bg} ${stc.color}`}>{stc.label}</span>
                </div>
              </div>
              <Row label="Giá trị"      value={fmt(o.value)} />
              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-gray-400 w-28 shrink-0">Xác suất</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width:`${o.probability}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 shrink-0">{o.probability}%</span>
                </div>
              </div>
              <Row label="Ngày đóng dự kiến" value={o.closeDate} />
              <Row label="Phụ trách"    value={o.owner} />
              {o.status === "open" && (() => {
                const oppStages = [
                  { key:"prospect",    label:"Prospect",    prob:20  },
                  { key:"demo",        label:"Demo",        prob:40  },
                  { key:"proposal",    label:"Proposal",    prob:60  },
                  { key:"negotiation", label:"Negotiation", prob:80  },
                ];
                const nextStage: Record<string,{key:string,label:string,prob:number}|undefined> = {
                  prospect:    { key:"demo",        label:"Demo",        prob:40 },
                  demo:        { key:"proposal",    label:"Proposal",    prob:60 },
                  proposal:    { key:"negotiation", label:"Negotiation", prob:80 },
                  negotiation: undefined,
                };
                const curIdx   = oppStages.findIndex(s => s.key === o.stage);
                const next     = nextStage[o.stage];
                return (
                  <div className="pt-2 space-y-3">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        {oppStages.map((s, i) => (
                          <span key={s.key} className={`text-[10px] font-medium ${i <= curIdx ? "text-blue-600" : "text-gray-400"}`}>
                            {s.label}
                          </span>
                        ))}
                      </div>
                      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${curIdx < 0 ? 0 : ((curIdx + 1) / oppStages.length) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        {oppStages.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= curIdx ? "bg-blue-500" : "bg-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    {/* Next stage button */}
                    {next && (
                      <button
                        onClick={() => {
                          setOpportunities(p => p.map(x => x.id === o.id
                            ? { ...x, stage: next.key, probability: next.prob }
                            : x));
                          toast.success(`Chuyển sang ${next.label}`);
                        }}
                        className="w-full py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-all"
                      >
                        Tiếp theo: {next.label} →
                      </button>
                    )}
                    {/* Won only at negotiation; Lost available at any stage */}
                    <div className="flex gap-2">
                      {o.stage === "negotiation" && (
                        <button onClick={() => {
                          setOpportunities(p => p.map(x => x.id === o.id ? { ...x, stage:"closed", status:"won", probability:100 } : x));
                          toast.success("Đã đóng - Thắng!");
                          goBack();
                        }} className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-all">
                          Đóng - Thắng
                        </button>
                      )}
                      <button onClick={() => {
                        setOpportunities(p => p.map(x => x.id === o.id ? { ...x, stage:"closed", status:"lost", probability:0 } : x));
                        toast.success("Đã đóng - Thua");
                        goBack();
                      }} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-medium hover:bg-gray-50 transition-all">
                        Đóng - Thua
                      </button>
                    </div>
                  </div>
                );
              })()}
              <SumBar items={[
                { label:"Hóa đơn", value:entInvOpp.length, onClick:() => setDetailTab("invoices") },
                { label:"Hợp đồng", value:entCtOpp.length, onClick:() => setDetailTab("contracts") },
              ]} />
            </div>
          )}
          {detailTab === "invoices" && (
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {entInvOpp.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Chưa có hóa đơn</p>}
            </div>
          )}
          {detailTab === "contracts" && (
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {entCtOpp.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Chưa có hợp đồng</p>}
            </div>
          )}
        </div>
      );
    }

    const company  = entityType === "company" ? companies.find(c => c.id === id) : null;
    const lead     = entityType === "lead"    ? leads.find(l => l.id === id)     : null;
    const entityName = company?.name || lead?.name || "";

    const entInvoices  = invoices.filter(inv => inv.entityId === id).filter(inv => !invSearch || inv.invoiceNo.toLowerCase().includes(invSearch.toLowerCase()) || inv.description.toLowerCase().includes(invSearch.toLowerCase()));
    const entContracts = contracts.filter(ct => ct.entityId === id).filter(ct => !ctcSearch || ct.contractNo.toLowerCase().includes(ctcSearch.toLowerCase()) || ct.title.toLowerCase().includes(ctcSearch.toLowerCase()));

    const invStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
      draft:     { label: "Nháp",         color: "text-gray-600",    bg: "bg-gray-100"    },
      sent:      { label: "Đã gửi",       color: "text-blue-700",    bg: "bg-blue-100"    },
      paid:      { label: "Đã TT",        color: "text-emerald-700", bg: "bg-emerald-100" },
      overdue:   { label: "Quá hạn",      color: "text-red-700",     bg: "bg-red-100"     },
      cancelled: { label: "Đã hủy",       color: "text-gray-400",    bg: "bg-gray-50"     },
    };
    const ctStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
      draft:     { label: "Nháp",         color: "text-gray-600",    bg: "bg-gray-100"    },
      active:    { label: "Hiệu lực",     color: "text-emerald-700", bg: "bg-emerald-100" },
      expired:   { label: "Hết hạn",      color: "text-amber-700",   bg: "bg-amber-100"   },
      cancelled: { label: "Đã hủy",       color: "text-gray-400",    bg: "bg-gray-50"     },
    };
    const ctTypeLabel: Record<string, string> = { sale:"Mua bán", service:"Dịch vụ", partnership:"Hợp tác", nda:"NDA", other:"Khác" };

    const allInvForEntity = invoices.filter(inv => inv.entityId === id);
    const allCtForEntity  = contracts.filter(ct => ct.entityId === id);

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 shrink-0">
          <button onClick={goBack}
            className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{entityName}</p>
            <p className="text-[10px] text-gray-400">{entityType === "company" ? "Công ty" : "Lead"}</p>
          </div>
          <button onClick={() => {
            if (company) setModal({ type:"company", isEdit:true, editId:company.id, data:{...company as unknown as Record<string,string|number>} });
            if (lead)    setModal({ type:"lead",    isEdit:true, editId:lead.id,    data:{...lead    as unknown as Record<string,string|number>} });
          }} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => {
            const entity = entityType === "company" ? "công ty" : "lead";
            setDetailView(null);
            setDeleteConfirm({ entity, id, name: entityName });
          }} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {[
            { key:"info",      label:"Thông tin" },
            { key:"invoices",  label:`Hóa đơn (${allInvForEntity.length})` },
            { key:"contracts", label:`Hợp đồng (${allCtForEntity.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setDetailTab(t.key as typeof detailTab)}
              className={`flex-1 py-2.5 text-[11.5px] font-medium border-b-2 transition-all ${detailTab === t.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── INFO TAB ── */}
        {detailTab === "info" && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {company && <>
              <Row label="Loại"         value={company.type === "customer" ? "Khách hàng" : company.type === "vendor" ? "Nhà cung cấp" : "Đối tác"} />
              <Row label="Ngành nghề"   value={`${company.industry} · ${company.size} nhân viên`} />
              <Row label="Trạng thái"   value={company.status === "active" ? "Đang hợp tác" : "Không HĐ"} />
              <Row label="Doanh thu"    value={fmt(company.revenue)} />
              <Row label="Website"      value={company.website} />
              <Row label="Email"        value={company.email} />
              <Row label="Điện thoại"   value={company.phone} />
              <Row label="Địa chỉ"      value={company.address} />
              <Row label="Phụ trách"    value={company.owner} />
              <Row label="Từ ngày"      value={company.createdAt} />
              <SumBar
                items={[
                  { label:"Hóa đơn", value:allInvForEntity.length, onClick:() => setDetailTab("invoices") },
                  { label:"Hợp đồng",value:allCtForEntity.length,  onClick:() => setDetailTab("contracts") },
                ]}
              />
            </>}
            {lead && (() => {
              const leadStageLbl: Record<string, string> = { new:"Mới", contacted:"Đã liên hệ", qualified:"Đủ điều kiện", converted:"Đã chuyển đổi", disqualified:"Loại bỏ" };
              const leadStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
                open:         { label: "Mở",             color: "text-blue-700",    bg: "bg-blue-100"    },
                converted:    { label: "Đã chuyển đổi", color: "text-emerald-700", bg: "bg-emerald-100" },
                disqualified: { label: "Loại bỏ",       color: "text-gray-500",    bg: "bg-gray-100"    },
              };
              const sc = leadStatusCfg[lead.status] || leadStatusCfg.open;
              return <>
                <Row label="Công ty"    value={lead.company} />
                <Row label="Email"      value={lead.email} />
                <Row label="Điện thoại" value={lead.phone} />
                <Row label="Nguồn"      value={lead.source} />
                <div className="flex gap-2">
                  <p className="text-[11px] text-gray-400 w-28 shrink-0">Giai đoạn</p>
                  <p className="text-[12px] text-gray-800">{leadStageLbl[lead.stage] || lead.stage}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <p className="text-[11px] text-gray-400 w-28 shrink-0">Trạng thái</p>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                </div>
                <Row label="Lead Score" value={String(lead.score)} />
                <Row label="Giá trị"    value={fmt(lead.value)} />
                <Row label="Phụ trách"  value={lead.owner} />
                <Row label="Ngày tạo"   value={lead.createdAt} />
                {lead.status === "open" && (
                  <div className="pt-1 space-y-2">
                    {/* Stage progression bar */}
                    <div className="flex items-center gap-0.5 text-[9px]">
                      {(["new","contacted","qualified"] as const).map((s, i) => {
                        const labels: Record<string,string> = { new:"Mới", contacted:"Đã liên hệ", qualified:"Đủ điều kiện" };
                        const isPast    = ["new","contacted","qualified"].indexOf(lead.stage) > i;
                        const isCurrent = lead.stage === s;
                        return (
                          <div key={s} className="flex items-center flex-1">
                            <div className={`flex-1 h-1 rounded-full ${isPast || isCurrent ? "bg-blue-500" : "bg-gray-200"}`} />
                            <div className={`w-2 h-2 rounded-full border-2 shrink-0 ${isCurrent ? "border-blue-500 bg-blue-500" : isPast ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"}`} />
                            {i === 2 && <div className={`flex-1 h-1 rounded-full ${lead.stage === "converted" ? "bg-emerald-500" : "bg-gray-200"}`} />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 px-0.5">
                      <span>Mới</span><span>Đã liên hệ</span><span>Đủ điều kiện</span>
                    </div>

                    {/* Next stage button */}
                    {lead.stage === "new" && (
                      <button onClick={() => {
                        setLeads(p => p.map(l => l.id === lead.id ? { ...l, stage:"contacted" } : l));
                        toast.success("Stage → Đã liên hệ");
                      }} className="w-full py-2 rounded-xl bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5">
                        <ChevronsRight className="w-3.5 h-3.5" /> Đã liên hệ
                      </button>
                    )}
                    {lead.stage === "contacted" && (
                      <button onClick={() => {
                        setLeads(p => p.map(l => l.id === lead.id ? { ...l, stage:"qualified" } : l));
                        toast.success("Stage → Đủ điều kiện");
                      }} className="w-full py-2 rounded-xl bg-purple-600 text-white text-[12px] font-semibold hover:bg-purple-700 transition-all flex items-center justify-center gap-1.5">
                        <ChevronsRight className="w-3.5 h-3.5" /> Đủ điều kiện
                      </button>
                    )}
                    {lead.stage === "qualified" && (() => {
                      const existingOpps = opportunities.filter(o => o.contactName === lead.name && o.companyName === lead.company);
                      return (
                        <div className="space-y-1.5">
                          {existingOpps.length > 0 && (
                            <div className="px-2.5 py-1.5 bg-blue-50 rounded-lg text-[10.5px] text-blue-600">
                              {existingOpps.length} cơ hội đã tạo từ lead này
                            </div>
                          )}
                          <button onClick={() => {
                            const newOpp: CrmOpportunity = {
                              id: `op${Date.now()}`, title: `Cơ hội từ ${lead.name}`,
                              companyId: "", companyName: lead.company, contactName: lead.name,
                              value: lead.value, stage: "prospect", status: "open",
                              probability: 20, closeDate: "", owner: lead.owner, avatar: lead.avatar,
                            };
                            setOpportunities(p => [...p, newOpp]);
                            // Lead stays at "qualified" — can create multiple opportunities
                            toast.success("Đã tạo Cơ hội mới — Stage: Prospect");
                          }} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Tạo cơ hội mới
                          </button>
                        </div>
                      );
                    })()}

                    <button onClick={() => {
                      setLeads(p => p.map(l => l.id === lead.id ? { ...l, stage: "disqualified", status: "disqualified" } : l));
                      toast.success("Đã loại bỏ lead");
                    }} className="w-full py-1.5 rounded-xl border border-gray-200 text-gray-500 text-[12px] font-medium hover:bg-gray-50 transition-all">
                      Loại bỏ
                    </button>
                  </div>
                )}
                <SumBar
                  items={[
                    { label:"Hóa đơn / BG", value:allInvForEntity.length, onClick:() => setDetailTab("invoices") },
                    { label:"Hợp đồng",     value:allCtForEntity.length,  onClick:() => setDetailTab("contracts") },
                  ]}
                />
              </>;
            })()}
          </div>
        )}

        {/* ── INVOICES TAB (read-only, click → go to Finance) ── */}
        {detailTab === "invoices" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header hint */}
            <div className="px-3 py-2 border-b border-gray-100 shrink-0 space-y-1.5">
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                <Search className="w-3 h-3 text-gray-400 shrink-0" />
                <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Tìm hóa đơn..."
                  className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
                {invSearch && <button onClick={() => setInvSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
              </div>
              <p className="text-[10.5px] text-gray-400 px-0.5">
                Click vào hóa đơn để xem chi tiết trong{" "}
                <button onClick={() => onNavigate?.("fi-invoice")}
                  className="text-blue-500 hover:text-blue-700 font-medium underline-offset-2 hover:underline transition-colors">
                  Tài chính kế toán →
                </button>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {entInvoices.map(inv => {
                const sc = invStatusCfg[inv.status] || invStatusCfg.draft;
                const total = inv.amount * (1 + inv.tax / 100);
                return (
                  <div key={inv.id} onClick={() => onNavigate?.("fi-invoice")}
                    className="rounded-xl border border-gray-100 p-3 hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[12px] font-semibold text-gray-900">{inv.invoiceNo}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{inv.description}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[12px] font-bold text-blue-600">{fmt(total)}</span>
                          <span className="text-[10px] text-gray-400">Thuế {inv.tax}%</span>
                          <span className="text-[10px] text-gray-400">Hạn: {inv.dueDate}</span>
                        </div>
                      </div>
                      <ChevronsRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
                    </div>
                  </div>
                );
              })}
              {entInvoices.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[12px] text-gray-400">Chưa có hóa đơn</p>
                  <button onClick={() => onNavigate?.("fi-invoice")}
                    className="mt-2 text-[12px] text-blue-500 hover:text-blue-700 transition-colors">
                    Tạo trong Tài chính kế toán →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTRACTS TAB ── */}
        {detailTab === "contracts" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                <Search className="w-3 h-3 text-gray-400 shrink-0" />
                <input value={ctcSearch} onChange={e => setCtcSearch(e.target.value)} placeholder="Tìm hợp đồng..."
                  className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
                {ctcSearch && <button onClick={() => setCtcSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {entContracts.map(ct => {
                const sc = ctStatusCfg[ct.status] || ctStatusCfg.draft;
                return (
                  <div key={ct.id} className="rounded-xl border border-gray-100 p-3 hover:border-emerald-200 hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[12px] font-semibold text-gray-900">{ct.contractNo}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">{ctTypeLabel[ct.type]}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 truncate mt-0.5 font-medium">{ct.title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[12px] font-bold text-emerald-600">{fmt(ct.value)}</span>
                          <span className="text-[10px] text-gray-400">{ct.startDate} → {ct.endDate}</span>
                        </div>
                        {ct.signedBy && <p className="text-[10px] text-gray-400 mt-0.5">✍️ {ct.signedBy}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => setModal({ type:"contract", isEdit:true, editId:ct.id, data:{...ct as unknown as Record<string,string|number>} })}
                          className="w-6 h-6 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ entity:"hợp đồng", id:ct.id, name:ct.contractNo })}
                          className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {entContracts.length === 0 && <p className="text-[12px] text-gray-400 text-center py-6">Chưa có hợp đồng</p>}
            </div>
            <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
              <button onClick={() => setModal({ type:"contract", isEdit:false, data:{ entityType, entityId:id, entityName, type:"service", status:"draft", tax:0, owner:stgUsers[0]?.name || "" } })}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-all">
                <Plus className="w-4 h-4" /> Tạo hợp đồng
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════ COMPANIES ═══════════ */
  if (itemId === "crm-companies") {
    const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
      active:   { label: "Đang hợp tác", color: "text-emerald-700", bg: "bg-emerald-100" },
      inactive: { label: "Không HĐ",     color: "text-gray-500",    bg: "bg-gray-100"    },
    };
    const typeCfg: Record<string, { label: string; color: string; bg: string }> = {
      customer: { label: "Khách hàng",   color: "text-blue-700",   bg: "bg-blue-50"   },
      vendor:   { label: "Nhà cung cấp", color: "text-violet-700", bg: "bg-violet-50" },
      partner:  { label: "Đối tác",      color: "text-amber-700",  bg: "bg-amber-50"  },
    };
    // default tab to "customer" if somehow "all" is selected (removed)
    const activeType = compTab === "all" ? "customer" : compTab;
    const typePool = companies.filter(c => c.type === activeType);
    const filtered = typePool.filter(c =>
      (compStatus === "all" || c.status === compStatus) &&
      (!compSearch || c.name.toLowerCase().includes(compSearch.toLowerCase()) ||
       c.industry.toLowerCase().includes(compSearch.toLowerCase()))
    );
    const statusSubTabs: [string, string, number][] = [
      ["all",      "Tất cả",       typePool.length],
      ["active",   "Đang hợp tác", typePool.filter(c => c.status === "active").length],
      ["inactive", "Không HĐ",     typePool.filter(c => c.status === "inactive").length],
    ];
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        {/* Search */}
        <div className="px-3 pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Tìm công ty..."
              className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            {compSearch && <button onClick={() => setCompSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
        </div>
        {/* Type tabs — no "Tất cả" */}
        <div className="flex border-b border-gray-100 shrink-0 px-1">
          {([["customer","Khách hàng"],["vendor","Nhà cung cấp"],["partner","Đối tác"]] as [string,string][]).map(([k,l]) => (
            <button key={k} onClick={() => { setCompTab(k); setCompStatus("all"); }}
              className={`flex-1 py-2 text-[11px] font-medium border-b-2 transition-all ${activeType === k ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {l}
            </button>
          ))}
        </div>
        {/* Status sub-tabs (secondary) */}
        <div className="flex gap-1.5 px-3 py-1.5 border-b border-gray-50 shrink-0 overflow-x-auto">
          {statusSubTabs.map(([k, l, count]) => (
            <button key={k} onClick={() => setCompStatus(k)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium whitespace-nowrap transition-all shrink-0 ${
                compStatus === k
                  ? k === "active"   ? "bg-emerald-500 text-white"
                  : k === "prospect" ? "bg-sky-500 text-white"
                  : k === "inactive" ? "bg-gray-400 text-white"
                  : "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {l}
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${compStatus === k ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600"}`}>{count}</span>
            </button>
          ))}
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {filtered.map((c, idx) => {
            const sc = statusCfg[c.status] || statusCfg.inactive;
            const tc = typeCfg[c.type] || typeCfg.customer;
            return (
              <div key={c.id} onClick={() => { setDetailView({ entityType:"company", id:c.id }); setDetailTab("info"); }}
                className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-[13px] font-bold shrink-0`}>
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{c.industry} · {c.size} nhân viên</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {c.revenue > 0 && <span className="text-[11px] font-semibold text-blue-600">💰 {fmt(c.revenue)}</span>}
                      <span className="text-[11px] text-gray-400">{invoices.filter(i=>i.entityId===c.id).length} HĐ · {contracts.filter(i=>i.entityId===c.id).length} HĐồng</span>
                      <span className="text-[11px] text-gray-400">{c.owner}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setModal({ type: "company", isEdit: true, editId: c.id, data: { ...c as unknown as Record<string, string | number> } })}
                      className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ entity: "công ty", id: c.id, name: c.name })}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Không có dữ liệu</p>}
        </div>
        <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
          <button onClick={() => setModal({ type: "company", isEdit: false, data: { type: activeType, status: "inactive", industry: "CNTT", size: "<50", owner: stgUsers[0]?.name || "" } })}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" /> Thêm {activeType === "customer" ? "khách hàng" : activeType === "vendor" ? "nhà cung cấp" : "đối tác"}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════ CONTACTS ═══════════ */
  if (itemId === "crm-contacts") {
    const filtered = contacts.filter(c =>
      !contSearch || c.name.toLowerCase().includes(contSearch.toLowerCase()) ||
      c.companyName.toLowerCase().includes(contSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contSearch.toLowerCase())
    );
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
          {[
            { label: "Tổng",      value: contacts.length, color: "text-blue-600" },
            { label: "VIP",       value: contacts.filter(c => c.tier === "vip").length, color: "text-amber-600" },
            { label: "Hoạt động", value: contacts.filter(c => c.status === "active").length, color: "text-emerald-600" },
          ].map((s, i) => (
            <div key={i} className="py-3 text-center">
              <p className={`text-[20px] font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="px-3 pt-2 pb-2 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={contSearch} onChange={e => setContSearch(e.target.value)} placeholder="Tìm liên hệ..."
              className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            {contSearch && <button onClick={() => setContSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {filtered.map((c, idx) => (
            <div key={c.id} onClick={() => { setDetailView({ entityType:"contact", id:c.id }); setDetailTab("info"); }}
              className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
              <div className="flex items-start gap-2.5">
                <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[12px] font-bold text-white shrink-0`}>
                  {c.avatar || c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                    {c.tier === "vip" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">VIP</span>}
                    {c.status === "inactive" && <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">Không HĐ</span>}
                  </div>
                  <p className="text-[11px] text-gray-500">{c.title} · {c.companyName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Liên hệ cuối: {c.lastContact} · {c.owner}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setModal({ type: "contact", isEdit: true, editId: c.id, data: { ...c as unknown as Record<string, string | number> } })}
                    className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm({ entity: "liên hệ", id: c.id, name: c.name })}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Không có dữ liệu</p>}
        </div>
        <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
          <button onClick={() => setModal({ type: "contact", isEdit: false, data: { status: "active", tier: "normal", owner: stgUsers[0]?.name || "" } })}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" /> Thêm liên hệ
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════ LEADS ═══════════ */
  if (itemId === "crm-leads") {
    const stageCfg: Record<string, { label: string; color: string; bg: string; activeColor: string }> = {
      new:          { label: "Mới",            color: "text-blue-700",    bg: "bg-blue-100",    activeColor: "bg-blue-500"    },
      contacted:    { label: "Đã liên hệ",    color: "text-amber-700",   bg: "bg-amber-100",   activeColor: "bg-amber-500"   },
      qualified:    { label: "Đủ điều kiện",  color: "text-purple-700",  bg: "bg-purple-100",  activeColor: "bg-purple-500"  },
      converted:    { label: "Đã chuyển đổi",color: "text-emerald-700", bg: "bg-emerald-100", activeColor: "bg-emerald-500" },
      disqualified: { label: "Loại bỏ",       color: "text-gray-500",    bg: "bg-gray-100",    activeColor: "bg-gray-400"    },
    };
    const stageTabs: { key: typeof leadTab; label: string; count: number }[] = [
      { key: "all",          label: "Tất cả",          count: leads.length },
      { key: "new",          label: "Mới",             count: leads.filter(l => l.stage === "new").length },
      { key: "contacted",    label: "Đã liên hệ",     count: leads.filter(l => l.stage === "contacted").length },
      { key: "qualified",    label: "Đủ điều kiện",   count: leads.filter(l => l.stage === "qualified").length },
      { key: "disqualified", label: "Loại bỏ",        count: leads.filter(l => l.stage === "disqualified").length },
    ];
    const filtered = leads.filter(l =>
      (leadTab === "all" || l.stage === leadTab) &&
      (!leadSearch || l.name.toLowerCase().includes(leadSearch.toLowerCase()) || l.company.toLowerCase().includes(leadSearch.toLowerCase()))
    );
    const scoreCls = (s: number) => s >= 80 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-500";
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        {/* Single stage tab bar */}
        <div className="flex gap-1 px-3 py-2 border-b border-gray-100 shrink-0 overflow-x-auto">
          {stageTabs.map(t => (
            <button key={t.key} onClick={() => setLeadTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all ${
                leadTab === t.key
                  ? t.key === "all"          ? "bg-gray-800 text-white"
                  : t.key === "new"          ? "bg-blue-500 text-white"
                  : t.key === "contacted"    ? "bg-amber-500 text-white"
                  : t.key === "qualified"    ? "bg-purple-500 text-white"
                  : t.key === "converted"    ? "bg-emerald-500 text-white"
                  :                           "bg-gray-400 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {t.label}
              <span className={`text-[10px] font-bold ${leadTab === t.key ? "opacity-75" : "text-gray-400"}`}>{t.count}</span>
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Tìm lead..."
              className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            {leadSearch && <button onClick={() => setLeadSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {filtered.map((l, idx) => {
            const sc = stageCfg[l.stage] || stageCfg.new;
            return (
              <div key={l.id} onClick={() => { setDetailView({ entityType:"lead", id:l.id }); setDetailTab("info"); }}
                className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white`}>{l.avatar || l.name.slice(0, 2)}</div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${scoreCls(l.score)} flex items-center justify-center text-[8px] font-bold text-white border border-white`}>{l.score}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-gray-900">{l.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">{l.source}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{l.company}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-blue-600">{fmt(l.value)}</span>
                      <span className="text-[11px] text-gray-400">{invoices.filter(i=>i.entityId===l.id).length} BG · {contracts.filter(i=>i.entityId===l.id).length} HĐ</span>
                      <span className="text-[10px] text-gray-400">{l.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setModal({ type: "lead", isEdit: true, editId: l.id, data: { ...l as unknown as Record<string, string | number> } })}
                      className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ entity: "lead", id: l.id, name: l.name })}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Không có dữ liệu</p>}
        </div>
        {(leadTab === "all" || leadTab === "new") && (
          <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
            <button onClick={() => setModal({ type: "lead", isEdit: false, data: { stage: "new", source: stgSources[0] || "", score: 50, value: 0, owner: stgUsers[0]?.name || "" } })}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" /> Thêm lead mới
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════ PIPELINE ═══════════ */
  if (itemId === "crm-pipeline") {
    const pipeStages: { key: CrmOpportunity["stage"]; label: string; border: string; hdr: string }[] = [
      { key: "prospect",    label: "Prospect",    border: "border-blue-200",    hdr: "bg-blue-50"    },
      { key: "demo",        label: "Demo",        border: "border-amber-200",   hdr: "bg-amber-50"   },
      { key: "proposal",    label: "Proposal",    border: "border-purple-200",  hdr: "bg-purple-50"  },
      { key: "negotiation", label: "Negotiation", border: "border-orange-200",  hdr: "bg-orange-50"  },
      { key: "closed",      label: "Closed",      border: "border-emerald-200", hdr: "bg-emerald-50" },
    ];
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Pipeline Bán hàng</p>
          <p className="text-[11px] text-gray-400">Kéo thả để chuyển giai đoạn · Cơ hội được tạo từ Lead đủ điều kiện</p>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-2.5 px-3 py-3 h-full" style={{ minWidth: "max-content" }}>
            {pipeStages.map(st => {
              const deals = opportunities.filter(o => o.stage === st.key);
              const total = deals.reduce((s, o) => s + o.value, 0);
              return (
                <div key={st.key}
                  className={`flex flex-col w-52 h-full rounded-xl border-2 ${dragOver === st.key ? "border-blue-400 bg-blue-50/30" : st.border} overflow-hidden shrink-0 transition-all`}
                  onDragOver={e => { e.preventDefault(); setDragOver(st.key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(null);
                    if (dragging) {
                      const draggingOpp = opportunities.find(o => o.id === dragging);
                      const stageOrder = { prospect: 0, demo: 1, proposal: 2, negotiation: 3, closed: 4 };
                      const currentStageIdx = stageOrder[draggingOpp?.stage as keyof typeof stageOrder] ?? -1;
                      const targetStageIdx = stageOrder[st.key as keyof typeof stageOrder] ?? -1;

                      // Prevent backward movement (can only move forward in pipeline)
                      if (targetStageIdx < currentStageIdx) {
                        toast.error("Không thể chuyển lùi giai đoạn — chỉ có thể tiến về phía trước");
                        setDragging(null);
                        return;
                      }

                      if (st.key === "closed") {
                        setOppCloseModal({ id: dragging });
                      } else {
                        setOpportunities(prev => prev.map(o => o.id === dragging
                          ? { ...o, stage: st.key, status: "open", probability: st.key === "negotiation" ? 80 : st.key === "proposal" ? 65 : st.key === "demo" ? 40 : 20 }
                          : o));
                        toast.success(`Chuyển sang ${st.label}`);
                      }
                      setDragging(null);
                    }
                  }}>
                  <div className={`${st.hdr} px-3 py-2 shrink-0`}>
                    <p className="text-[12px] font-bold text-gray-700">{st.label}</p>
                    <p className="text-[10px] text-gray-500">{deals.length} deal · {fmt(total)}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 bg-gray-50/40">
                    {deals.map(d => (
                      <div key={d.id}
                        draggable
                        onDragStart={() => setDragging(d.id)}
                        onDragEnd={() => setDragging(null)}
                        onClick={() => { setDetailView({ entityType:"opportunity", id:d.id }); setDetailTab("info"); }}
                        className={`rounded-lg border border-gray-100 bg-white p-2.5 hover:shadow-sm transition-all cursor-pointer group ${dragging === d.id ? "opacity-40" : ""}`}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-gray-800 leading-snug">{d.title}</p>
                            {d.stage === "closed" && (
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${d.status === "won" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                {d.status === "won" ? "Won" : "Lost"}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setModal({ type: "opportunity", isEdit: true, editId: d.id, data: { ...d as unknown as Record<string, string | number> } })}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => setDeleteConfirm({ entity: "cơ hội", id: d.id, name: d.title })}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{d.companyName}</p>
                        <p className="text-[12px] font-bold text-blue-600 mt-1">{fmt(d.value)}</p>
                        <div className="mt-1.5">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[9px] text-gray-400">Prob.</span>
                            <span className="text-[9px] font-medium text-gray-600">{d.probability}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.probability}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-gray-400">{d.closeDate}</span>
                          <div className={`w-5 h-5 rounded-full ${avatarColors[stgUsers.findIndex(u => u.name === d.owner) % avatarColors.length]} flex items-center justify-center text-[8px] font-bold text-white`}>{d.avatar || d.owner.slice(0, 2)}</div>
                        </div>
                      </div>
                    ))}
                    {deals.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4">Kéo deal vào đây</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ OPPORTUNITIES ═══════════ */
  if (itemId === "crm-opps") {
    const OPP_STAGE_CFG: Record<string, { label: string; color: string; bg: string; pill: string }> = {
      prospect:    { label: "Prospect",    color: "text-blue-700",    bg: "bg-blue-50",    pill: "bg-blue-500"    },
      demo:        { label: "Demo",        color: "text-amber-700",   bg: "bg-amber-50",   pill: "bg-amber-500"   },
      proposal:    { label: "Proposal",    color: "text-purple-700",  bg: "bg-purple-50",  pill: "bg-purple-500"  },
      negotiation: { label: "Negotiation", color: "text-orange-700",  bg: "bg-orange-50",  pill: "bg-orange-500"  },
      closed:      { label: "Closed",      color: "text-emerald-700", bg: "bg-emerald-50", pill: "bg-emerald-600" },
    };

    /* ── filters ── */
    const searched = opportunities.filter(o =>
      (!oppSearch || o.title.toLowerCase().includes(oppSearch.toLowerCase()) || o.companyName.toLowerCase().includes(oppSearch.toLowerCase())) &&
      (oppStatusFilter === "all" || o.status === oppStatusFilter) &&
      (oppOwnerFilter === "all" || o.owner === oppOwnerFilter)
    );
    const sorted = [...searched].sort((a, b) => {
      if (oppSortBy === "value") return oppSortDir === "desc" ? b.value - a.value : a.value - b.value;
      return oppSortDir === "desc"
        ? b.closeDate.localeCompare(a.closeDate)
        : a.closeDate.localeCompare(b.closeDate);
    });

    /* ── summary stats ── */
    const openDeals  = opportunities.filter(o => o.status === "open");
    const wonDeals   = opportunities.filter(o => o.status === "won");
    const pipelineVal = openDeals.reduce((s, o) => s + o.value, 0);
    const wonVal      = wonDeals.reduce((s, o) => s + o.value, 0);

    const statusTabs = [
      { key: "all",  label: "Tất cả", count: opportunities.length,                               color: "bg-gray-800" },
      { key: "open", label: "Open",   count: opportunities.filter(o => o.status === "open").length,  color: "bg-blue-500" },
      { key: "won",  label: "Won",    count: opportunities.filter(o => o.status === "won").length,   color: "bg-emerald-500" },
      { key: "lost", label: "Lost",   count: opportunities.filter(o => o.status === "lost").length,  color: "bg-gray-400" },
    ];

    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />

        {/* ── Summary ── */}
        <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
          {[
            { label: "Pipeline",  value: fmt(pipelineVal), sub: `${openDeals.length} deal`, color: "text-blue-600" },
            { label: "Won",       value: fmt(wonVal),       sub: `${wonDeals.length} deal`,  color: "text-emerald-600" },
            { label: "Tổng",      value: String(opportunities.length), sub: "cơ hội",        color: "text-gray-700" },
          ].map((s, i) => (
            <div key={i} className="py-2.5 text-center">
              <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-gray-400">{s.sub} · {s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="px-3 pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={oppSearch} onChange={e => setOppSearch(e.target.value)} placeholder="Tìm tên cơ hội, công ty..."
              className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            {oppSearch && <button onClick={() => setOppSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
        </div>

        {/* ── Status tabs ── */}
        <div className="flex gap-1.5 px-3 py-1.5 border-b border-gray-100 shrink-0">
          {statusTabs.map(t => (
            <button key={t.key} onClick={() => setOppStageFilter(t.key as typeof oppStatusFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all ${
                oppStatusFilter === t.key ? `${t.color} text-white` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {t.label}
              <span className={`text-[10px] font-bold ${oppStatusFilter === t.key ? "opacity-75" : "text-gray-400"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Owner + Sort filters ── */}
        <div className="flex gap-2 px-3 pb-2 shrink-0 border-b border-gray-100">
          <select value={oppOwnerFilter} onChange={e => setOppOwnerFilter(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-blue-300">
            <option value="all">Tất cả phụ trách</option>
            {stgUsers.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
          </select>
          <select value={`${oppSortBy}-${oppSortDir}`}
            onChange={e => { const [f, d] = e.target.value.split("-"); setOppSortBy(f as typeof oppSortBy); setOppSortDir(d as typeof oppSortDir); }}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-blue-300">
            <option value="value-desc">Giá trị ↓</option>
            <option value="value-asc">Giá trị ↑</option>
            <option value="closeDate-asc">Ngày đóng ↑</option>
            <option value="closeDate-desc">Ngày đóng ↓</option>
          </select>
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {sorted.map((o, idx) => {
            const sc = OPP_STAGE_CFG[o.stage] || OPP_STAGE_CFG.prospect;
            return (
              <div key={o.id} onClick={() => { setDetailView({ entityType:"opportunity", id:o.id }); setDetailTab("info"); }}
                className="rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                    {o.avatar || o.companyName.slice(0, 2)}
                  </div>

                  {/* Title + company */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-900 truncate">{o.title}</p>
                    <p className="text-[10.5px] text-gray-400 truncate">{o.companyName}</p>
                  </div>

                  {/* Stage badge + quick-change dropdown */}
                  <div onClick={e => e.stopPropagation()} className="shrink-0">
                    <select value={o.stage}
                      onChange={e => {
                        const newStage = e.target.value as CrmOpportunity["stage"];
                        if (newStage === "closed") { setOppCloseModal({ id: o.id }); return; }
                        setOpportunities(p => p.map(x => x.id === o.id
                          ? { ...x, stage: newStage, status: "open",
                              probability: newStage === "negotiation" ? 80 : newStage === "proposal" ? 65 : newStage === "demo" ? 40 : 20 }
                          : x));
                        toast.success(`Stage → ${newStage}`);
                      }}
                      className={`text-[10px] font-semibold border-0 rounded-full px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300 ${sc.bg} ${sc.color}`}>
                      <option value="prospect">Prospect</option>
                      <option value="demo">Demo</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed">Closed</option>
                    </select>
                    {o.stage === "closed" && (
                      <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === "won" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {o.status === "won" ? "Won" : "Lost"}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0 min-w-[52px]">
                    <p className="text-[12px] font-bold text-blue-600">{fmt(o.value)}</p>
                    <p className="text-[9px] text-gray-400">{o.closeDate || "—"}</p>
                  </div>

                  {/* Owner avatar */}
                  <div className={`w-6 h-6 rounded-full ${avatarColors[stgUsers.findIndex(u => u.name === o.owner) % avatarColors.length]} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}
                    title={o.owner}>
                    {o.owner.split(" ").pop()?.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setModal({ type:"opportunity", isEdit:true, editId:o.id, data:{...o as unknown as Record<string,string|number>} })}
                      className="w-6 h-6 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ entity:"cơ hội", id:o.id, name:o.title })}
                      className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[13px] font-medium text-gray-400">Chưa có cơ hội nào</p>
              <p className="text-[11px] text-gray-300 mt-1">Chuyển đổi lead đủ điều kiện để tạo cơ hội</p>
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-gray-100 shrink-0 text-center">
          <p className="text-[10.5px] text-gray-400">Tìm thấy <span className="font-semibold text-gray-600">{sorted.length}</span> / {opportunities.length} cơ hội</p>
        </div>
      </div>
    );
  }

  /* ═══════════ ACTIVITIES (unified view with type tabs) ═══════════ */
  if (itemId === "crm-activities") {
    const typeTabMap: { key: string; label: string; type: CrmActivity["type"] | "all" }[] = [
      { key: "all",     label: "Tất cả",    type: "all"     },
      { key: "task",    label: "Công việc", type: "task"    },
      { key: "call",    label: "Cuộc gọi",  type: "call"    },
      { key: "meeting", label: "Cuộc họp",  type: "meeting" },
      { key: "email",   label: "Email",     type: "email"   },
      { key: "note",    label: "Ghi chú",   type: "note"    },
    ];
    const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
      pending:     { label: "Chờ xử lý",   color: "text-amber-700",   bg: "bg-amber-100"   },
      in_progress: { label: "Đang làm",    color: "text-blue-700",    bg: "bg-blue-100"    },
      scheduled:   { label: "Đã lên lịch", color: "text-purple-700",  bg: "bg-purple-100"  },
      done:        { label: "Xong",         color: "text-emerald-700", bg: "bg-emerald-100" },
      sent:        { label: "Đã gửi",      color: "text-emerald-700", bg: "bg-emerald-100" },
      received:    { label: "Đã nhận",     color: "text-emerald-700", bg: "bg-emerald-100" },
    };
    const priorityCfg: Record<string, { label: string; color: string; bg: string }> = {
      urgent: { label: "Khẩn cấp", color: "text-red-700",   bg: "bg-red-100"   },
      high:   { label: "Cao",      color: "text-amber-700", bg: "bg-amber-100" },
      normal: { label: "BT",       color: "text-gray-600",  bg: "bg-gray-100"  },
      low:    { label: "Thấp",     color: "text-blue-600",  bg: "bg-blue-100"  },
    };
    const typeIcon: Record<string, React.ReactNode> = {
      call:    <Phone        className="w-4 h-4 text-blue-500"    />,
      meeting: <Calendar     className="w-4 h-4 text-purple-500"  />,
      email:   <Mail         className="w-4 h-4 text-amber-500"   />,
      note:    <FileText     className="w-4 h-4 text-gray-400"    />,
      task:    <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    };
    const doneStatuses = ["done","sent","received","completed"];
    const byType = actTab === "all" ? activities : activities.filter(a => a.type === actTab);
    const filtered = byType.filter(a =>
      !actSearch || a.title.toLowerCase().includes(actSearch.toLowerCase()) ||
      a.entityName.toLowerCase().includes(actSearch.toLowerCase())
    );
    const pending  = filtered.filter(a => !doneStatuses.includes(a.status));
    const done     = filtered.filter(a =>  doneStatuses.includes(a.status));
    const displayed = showDone ? filtered : pending;
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
          {[
            { label: "Tổng", value: activities.length, color: "text-blue-600" },
            { label: "Chờ",  value: activities.filter(a => !doneStatuses.includes(a.status)).length, color: "text-amber-600" },
            { label: "Xong", value: activities.filter(a => doneStatuses.includes(a.status)).length,  color: "text-emerald-600" },
          ].map((s, i) => (
            <div key={i} className="py-3 text-center">
              <p className={`text-[20px] font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Type tabs */}
        <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
          {typeTabMap.map(t => (
            <button key={t.key} onClick={() => setActTab(t.key)}
              className={`flex-1 min-w-fit px-2 py-2 text-[10.5px] font-medium border-b-2 transition-all whitespace-nowrap ${actTab === t.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t.label}
              <span className={`ml-1 text-[9px] ${actTab === t.key ? "text-blue-400" : "text-gray-400"}`}>
                {t.key === "all" ? activities.length : activities.filter(a => a.type === t.key).length}
              </span>
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100 shrink-0 space-y-1.5">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={actSearch} onChange={e => setActSearch(e.target.value)} placeholder="Tìm hoạt động..."
              className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            {actSearch && <button onClick={() => setActSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
          <button onClick={() => setShowDone(!showDone)}
            className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors">
            {showDone ? "Ẩn đã hoàn thành" : `Hiện cả ${done.length} đã hoàn thành`}
          </button>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {displayed.map(a => {
            const sc = statusCfg[a.status] || statusCfg.pending;
            const pc = a.priority ? priorityCfg[a.priority] : null;
            const isDone = doneStatuses.includes(a.status);
            return (
              <div key={a.id} onClick={() => setDetailView({ entityType:"activity", id:a.id })}
                className={`rounded-xl border p-3 bg-white hover:shadow-sm transition-all group cursor-pointer ${isDone ? "border-gray-100 opacity-70" : "border-gray-100 hover:border-blue-200"}`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {typeIcon[a.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>{a.title}</p>
                    <p className="text-[11px] text-gray-500">{a.entityName}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      {pc && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pc.bg} ${pc.color}`}>{pc.label}</span>}
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="w-3 h-3" /> {a.dueDate || a.date}</span>
                      <span className="text-[10px] text-gray-400">{a.owner}</span>
                    </div>
                    {a.description && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{a.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                    {!isDone && (
                      <button onClick={() => {
                        setActivities(prev => prev.map(act => act.id === a.id ? { ...act, status: "done" } : act));
                        toast.success("Đã đánh dấu hoàn thành");
                      }} className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-all" title="Đánh dấu xong">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setModal({ type: "activity", isEdit: true, editId: a.id, data: { ...a as unknown as Record<string, string | number> } })}
                      className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ entity: "hoạt động", id: a.id, name: a.title })}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {displayed.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Không có dữ liệu</p>}
        </div>
        <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
          <button onClick={() => setModal({ type: "activity", isEdit: false, data: { type: actTab === "all" ? "task" : actTab, status: "pending", priority: "normal", owner: stgUsers[0]?.name || "", entityType: "company" } })}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" /> Thêm hoạt động
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════ REPORTS ═══════════ */
  if (itemId === "crm-report-revenue") {
    const allMonths = [
      { m: "T9/25",  revenue: 2900000000, target: 3500000000, won: 1 },
      { m: "T10/25", revenue: 3400000000, target: 3500000000, won: 2 },
      { m: "T11/25", revenue: 3800000000, target: 4000000000, won: 2 },
      { m: "T12/25", revenue: 5100000000, target: 4500000000, won: 3 },
      { m: "T1/26",  revenue: 4600000000, target: 4500000000, won: 2 },
      { m: "T2/26",  revenue: 4200000000, target: 4500000000, won: 2 },
      { m: "T3/26",  revenue: 4900000000, target: 5000000000, won: 3 },
      { m: "T4/26",  revenue: 3100000000, target: 5000000000, won: 1 },
    ];
    const [revRange, setRevRange] = useState<"3m"|"6m"|"all">("6m");
    const [revOwner, setRevOwner] = useState("all");

    const months = revRange === "3m" ? allMonths.slice(-3) : revRange === "6m" ? allMonths.slice(-6) : allMonths;
    const maxVal = Math.max(...months.flatMap(m => [m.revenue, m.target]));
    const CHART_H = 120;

    const wonOpps = opportunities.filter(o => o.status === "won" && (revOwner === "all" || o.owner === revOwner));
    const lostOpps = opportunities.filter(o => o.status === "lost" && (revOwner === "all" || o.owner === revOwner));
    const openOpps = opportunities.filter(o => o.status === "open" && (revOwner === "all" || o.owner === revOwner));
    const totalWon  = wonOpps.reduce((s, o) => s + o.value, 0);
    const totalOpen = openOpps.reduce((s, o) => s + o.value * o.probability / 100, 0);
    const winRate   = (wonOpps.length + lostOpps.length) > 0
      ? Math.round(wonOpps.length / (wonOpps.length + lostOpps.length) * 100) : 0;

    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const totalTarget  = months.reduce((s, m) => s + m.target, 0);
    const vsTarget     = totalTarget > 0 ? Math.round(totalRevenue / totalTarget * 100) : 0;

    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />

        {/* Header + filters */}
        <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900 mb-2">Báo cáo Doanh thu</p>
          <div className="flex gap-2">
            {/* Period toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-medium">
              {(["3m","6m","all"] as const).map(r => (
                <button key={r} onClick={() => setRevRange(r)}
                  className={`px-2.5 py-1 transition-all ${revRange === r ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                  {r === "3m" ? "3 tháng" : r === "6m" ? "6 tháng" : "Tất cả"}
                </button>
              ))}
            </div>
            {/* Owner filter */}
            <select value={revOwner} onChange={e => setRevOwner(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-700 bg-white focus:outline-none">
              <option value="all">Tất cả sales</option>
              {stgUsers.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-1">Won — Đã chốt</p>
              <p className="text-[20px] font-bold text-emerald-700">{fmt(totalWon)}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">{wonOpps.length} deal · Tỷ lệ thắng {winRate}%</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mb-1">Pipeline — Dự báo</p>
              <p className="text-[20px] font-bold text-blue-700">{fmt(totalOpen)}</p>
              <p className="text-[10px] text-blue-500 mt-0.5">{openOpps.length} deal đang mở (weighted)</p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-gray-700">Doanh thu thực tế vs Mục tiêu</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vsTarget >= 100 ? "bg-emerald-100 text-emerald-700" : vsTarget >= 80 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                {vsTarget}% mục tiêu
              </span>
            </div>

            {/* Y-axis labels + bars */}
            <div className="flex gap-1.5">
              {/* Y labels */}
              <div className="flex flex-col justify-between text-right shrink-0 pb-4" style={{ height: `${CHART_H + 16}px` }}>
                {[1, 0.75, 0.5, 0.25, 0].map(p => (
                  <span key={p} className="text-[8px] text-gray-300 leading-none">{fmt(maxVal * p)}</span>
                ))}
              </div>
              {/* Bars + grid */}
              <div className="flex-1 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                  {[0,1,2,3,4].map(i => <div key={i} className="border-t border-gray-100 w-full" />)}
                </div>
                {/* Bars */}
                <div className="flex items-end gap-1 pb-4" style={{ height: `${CHART_H + 16}px` }}>
                  {months.map(m => {
                    const revH = Math.max(4, Math.round((m.revenue / maxVal) * CHART_H));
                    const tarH = Math.max(2, Math.round((m.target  / maxVal) * CHART_H));
                    const hit = m.revenue >= m.target;
                    return (
                      <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] rounded px-1.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div>TT: {fmt(m.revenue)}</div>
                          <div>MT: {fmt(m.target)}</div>
                        </div>
                        <div className="w-full flex items-end gap-px" style={{ height: `${CHART_H}px` }}>
                          <div className={`flex-1 rounded-t transition-all ${hit ? "bg-emerald-500" : "bg-blue-500"}`} style={{ height: `${revH}px` }} />
                          <div className="flex-1 bg-gray-200 rounded-t" style={{ height: `${tarH}px` }} />
                        </div>
                        <p className="text-[8px] text-gray-400 truncate w-full text-center">{m.m}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-1 pt-2 border-t border-gray-50">
              <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> Đạt mục tiêu</span>
              <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" /> Chưa đạt</span>
              <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2.5 h-2.5 bg-gray-200 rounded-sm inline-block" /> Mục tiêu</span>
            </div>
          </div>

          {/* Period summary */}
          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Tổng kỳ ({months[0]?.m} – {months[months.length-1]?.m})</p>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-gray-600">Thực tế</span>
              <span className="text-[12px] font-bold text-gray-900">{fmt(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-gray-600">Mục tiêu</span>
              <span className="text-[12px] font-bold text-gray-400">{fmt(totalTarget)}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${vsTarget >= 100 ? "bg-emerald-500" : vsTarget >= 80 ? "bg-amber-400" : "bg-blue-500"}`}
                style={{ width: `${Math.min(vsTarget, 100)}%` }} />
            </div>
          </div>

          {/* Won deals list */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Deal đã chốt — Won</p>
          {wonOpps.map((o, idx) => (
            <div key={o.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                {o.avatar || o.companyName.slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 truncate">{o.title}</p>
                <p className="text-[10px] text-gray-400">{o.companyName} · {o.owner}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-bold text-emerald-600">{fmt(o.value)}</p>
                <p className="text-[9px] text-gray-400">{o.closeDate}</p>
              </div>
            </div>
          ))}
          {wonOpps.length === 0 && <p className="text-[12px] text-gray-400 text-center py-4">Chưa có deal nào được chốt</p>}
        </div>
      </div>
    );
  }

  if (itemId === "crm-report-conversion") {
    const funnelStages = [
      { key: "new",          label: "Mới",             color: "bg-blue-500"    },
      { key: "contacted",    label: "Đã liên hệ",     color: "bg-amber-500"   },
      { key: "qualified",    label: "Đủ điều kiện",   color: "bg-purple-500"  },
      { key: "converted",    label: "Đã chuyển đổi", color: "bg-emerald-500" },
      { key: "disqualified", label: "Loại bỏ",        color: "bg-gray-400"    },
    ];
    const stageCounts = funnelStages.map(s => ({ ...s, count: leads.filter(l => l.stage === s.key).length }));
    const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
    const leadSources = Array.from(new Set(leads.map(l => l.source))).map(src => ({
      source: src, total: leads.filter(l => l.source === src).length,
      won: leads.filter(l => l.source === src && l.status === "converted").length,
    }));
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.status === "converted").length;
    const lostLeads = leads.filter(l => l.status === "disqualified").length;
    const winRate = totalLeads ? Math.round(wonLeads / totalLeads * 100) : 0;
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Tỷ lệ Chuyển đổi</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="rounded-xl border border-gray-100 p-3 bg-white">
            <p className="text-[11px] font-semibold text-gray-500 mb-3">Phễu chuyển đổi</p>
            <div className="space-y-2">
              {stageCounts.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <p className="text-[10px] text-gray-500 w-20 shrink-0 text-right">{s.label}</p>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div className={`h-full ${s.color} rounded-lg flex items-center px-2`} style={{ width: `${Math.max(10, Math.round(s.count / maxCount * 100))}%` }}>
                      <span className="text-[10px] font-bold text-white">{s.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 w-10 shrink-0">
                    {i > 0 && stageCounts[i-1].count > 0 ? Math.round(s.count / stageCounts[i-1].count * 100) + "%" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 p-3 bg-white">
            <p className="text-[11px] font-semibold text-gray-500 mb-2">Tỷ lệ chuyển đổi</p>
            <div className="flex items-center gap-3">
              <p className="text-[24px] font-bold text-emerald-600">{winRate}%</p>
              <div className="flex-1">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winRate}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-400">Chuyển đổi: {wonLeads}</span>
                  <span className="text-[9px] text-gray-400">Loại bỏ: {lostLeads}</span>
                  <span className="text-[9px] text-gray-400">Tổng: {totalLeads}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase">Nguồn Lead</p>
            </div>
            <div className="divide-y divide-gray-50">
              {leadSources.map(s => (
                <div key={s.source} className="flex items-center gap-2 px-3 py-2">
                  <p className="text-[12px] text-gray-700 flex-1">{s.source}</p>
                  <p className="text-[11px] text-gray-500">{s.total} leads</p>
                  <p className="text-[11px] font-semibold text-emerald-600 w-10 text-right">{s.total ? Math.round(s.won / s.total * 100) : 0}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (itemId === "crm-report-perf") {
    const salesReps = [
      { name: "Phạm Thu Hà",    avatar: "PH", dealsWon: 3, revenue: 3360000000, winRate: 72 },
      { name: "Lê Văn Nam",     avatar: "LN", dealsWon: 3, revenue: 2780000000, winRate: 65 },
      { name: "Nguyễn Lan Anh", avatar: "NA", dealsWon: 2, revenue: 1330000000, winRate: 80 },
      { name: "Trần Đức Minh",  avatar: "TM", dealsWon: 2, revenue: 1210000000, winRate: 68 },
    ];
    const rankBadge = (i: number) => i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-400";
    const rankLabel = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i+1);
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Hiệu suất Sales</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Tỷ lệ thắng TB",  value: Math.round(salesReps.reduce((s,r) => s + r.winRate, 0) / salesReps.length) + "%", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "Deal chốt",    value: String(salesReps.reduce((s,r) => s + r.dealsWon, 0)),                              color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
              { label: "DT tổng",      value: fmt(salesReps.reduce((s,r) => s + r.revenue, 0)),                                  color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-100"  },
            ].map((k, i) => (
              <div key={i} className={`rounded-xl border ${k.border} ${k.bg} p-3 text-center`}>
                <p className={`text-[14px] font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Bảng xếp hạng</p>
          {[...salesReps].sort((a, b) => b.revenue - a.revenue).map((rep, i) => (
            <div key={rep.name} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 transition-all">
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold ${rankBadge(i)} shrink-0`}>{rankLabel(i)}</span>
                <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>{rep.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">{rep.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-500">{rep.dealsWon} deal đã chốt</span>
                    <span className="text-[11px] font-bold text-blue-600">{fmt(rep.revenue)}</span>
                  </div>
                  <div className="mt-1.5">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-gray-400">Tỷ lệ thắng</span>
                      <span className="text-[9px] font-medium text-gray-600">{rep.winRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${rep.winRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════ SETTINGS ═══════════ */
  if (itemId === "crm-settings-pipeline") {
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Giai đoạn Pipeline</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Quản lý các giai đoạn trong quy trình bán hàng</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {stgPipeline.map((stage, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 bg-white hover:border-blue-200 group">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-blue-600">{i + 1}</span>
              </div>
              <p className="flex-1 text-[13px] text-gray-800">{stage}</p>
              <button onClick={() => setStgPipeline(prev => prev.filter((_, j) => j !== i))}
                className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 space-y-2 shrink-0">
          <div className="flex gap-2">
            <input value={stgNewInput} onChange={e => setStgNewInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && stgNewInput.trim()) { setStgPipeline(p => [...p, stgNewInput.trim()]); setStgNewInput(""); } }}
              placeholder="Tên giai đoạn mới..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white" />
            <button onClick={() => { if (stgNewInput.trim()) { setStgPipeline(p => [...p, stgNewInput.trim()]); setStgNewInput(""); } }}
              className="px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (itemId === "crm-settings-products") {
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Sản phẩm / Dịch vụ</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Danh mục sản phẩm và dịch vụ của công ty</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {stgProducts.map((p, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 bg-white hover:border-blue-200 group">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-800">{p.name}</p>
                <p className="text-[11px] text-gray-400">{p.price ? `${p.price} ₫` : "—"}</p>
              </div>
              <button onClick={() => setStgProducts(prev => prev.filter((_, j) => j !== i))}
                className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 space-y-2 shrink-0">
          <div className="flex gap-2">
            <input value={stgNewInput} onChange={e => setStgNewInput(e.target.value)}
              placeholder="Tên sản phẩm / dịch vụ..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white" />
            <button onClick={() => { if (stgNewInput.trim()) { setStgProducts(p => [...p, { name: stgNewInput.trim(), price: "" }]); setStgNewInput(""); } }}
              className="px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (itemId === "crm-settings-sources") {
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Nguồn Lead</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Các kênh dẫn nguồn khách hàng tiềm năng</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {stgSources.map((src, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 bg-white hover:border-blue-200 group">
              <span className="text-[13px] text-gray-800 flex-1">{src}</span>
              <span className="text-[11px] text-gray-400">{leads.filter(l => l.source === src).length} leads</span>
              <button onClick={() => setStgSources(prev => prev.filter((_, j) => j !== i))}
                className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 space-y-2 shrink-0">
          <div className="flex gap-2">
            <input value={stgNewInput} onChange={e => setStgNewInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && stgNewInput.trim()) { setStgSources(p => [...p, stgNewInput.trim()]); setStgNewInput(""); } }}
              placeholder="Tên nguồn lead mới..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white" />
            <button onClick={() => { if (stgNewInput.trim()) { setStgSources(p => [...p, stgNewInput.trim()]); setStgNewInput(""); } }}
              className="px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (itemId === "crm-settings-users") {
    return (
      <div className="h-full flex flex-col bg-white">
        <NavBar />
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[14px] font-semibold text-gray-900">Người dùng CRM</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Thành viên có quyền truy cập CRM</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {stgUsers.map((u, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 bg-white hover:border-blue-200 group">
              <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-800">{u.name}</p>
                <p className="text-[11px] text-gray-400">{u.role}</p>
              </div>
              <button onClick={() => setStgUsers(prev => prev.filter((_, j) => j !== i))}
                className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 space-y-2 shrink-0">
          <div className="flex gap-2">
            <input value={stgNewInput} onChange={e => setStgNewInput(e.target.value)}
              placeholder="Tên người dùng..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 bg-white" />
            <button onClick={() => { if (stgNewInput.trim()) { setStgUsers(p => [...p, { name: stgNewInput.trim(), role: "Sales Executive" }]); setStgNewInput(""); } }}
              className="px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ FALLBACK ═══════════ */
  return (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="text-center text-gray-400">
        <p className="text-[13px]">Chưa có nội dung cho mục này</p>
        <button onClick={onClose} className="mt-2 text-[12px] text-blue-500 hover:text-blue-700">← Quay lại</button>
      </div>
    </div>
  );
}
