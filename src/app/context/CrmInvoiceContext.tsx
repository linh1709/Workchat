import { createContext, useContext, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";

/* ═══════════ Shared CrmInvoice Type ═══════════ */
export interface CrmInvoice {
  id: string;
  entityType: "company" | "lead";
  entityId: string;
  entityName: string;
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  tax: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  description: string;
  owner: string;
}

/* ═══════════ Initial Data ═══════════ */
export const initCrmInvoices: CrmInvoice[] = [
  { id:"inv1",  entityType:"company", entityId:"co6",  entityName:"Nova Real Estate",   invoiceNo:"HD-2026-001", issueDate:"01/03/2026", dueDate:"31/03/2026", amount:480_000_000,   tax:10, status:"paid",    description:"Phí triển khai phần mềm Q1/2026",    owner:"Trần Đức Minh" },
  { id:"inv2",  entityType:"company", entityId:"co7",  entityName:"Hoa Sen Group",      invoiceNo:"HD-2026-002", issueDate:"05/03/2026", dueDate:"04/04/2026", amount:920_000_000,   tax:10, status:"paid",    description:"Dịch vụ bảo mật hệ thống Q1/2026",   owner:"Trần Đức Minh" },
  { id:"inv3",  entityType:"company", entityId:"co8",  entityName:"Mirae Asset VN",     invoiceNo:"HD-2026-003", issueDate:"10/03/2026", dueDate:"09/04/2026", amount:650_000_000,   tax:10, status:"overdue", description:"License phần mềm năm 2026",            owner:"Phạm Thu Hà" },
  { id:"inv4",  entityType:"company", entityId:"co9",  entityName:"Hoàng Anh Gia Lai",  invoiceNo:"HD-2026-004", issueDate:"01/04/2026", dueDate:"30/04/2026", amount:820_000_000,   tax:10, status:"sent",    description:"Dịch vụ CNTT Q2/2026",               owner:"Trần Đức Minh" },
  { id:"inv5",  entityType:"company", entityId:"co1",  entityName:"TechVision JSC",     invoiceNo:"HD-2026-005", issueDate:"15/03/2026", dueDate:"14/04/2026", amount:120_000_000,   tax:10, status:"sent",    description:"Hoa hồng đối tác Q1/2026",           owner:"Phạm Thu Hà" },
  { id:"inv6",  entityType:"company", entityId:"co2",  entityName:"FPT Software",       invoiceNo:"HD-2026-006", issueDate:"20/03/2026", dueDate:"19/04/2026", amount:350_000_000,   tax:10, status:"paid",    description:"Phí hợp tác triển khai dự án",        owner:"Nguyễn Lan Anh" },
  { id:"inv7",  entityType:"company", entityId:"co16", entityName:"Startup Dev Hub",    invoiceNo:"HD-2026-007", issueDate:"01/04/2026", dueDate:"15/04/2026", amount:38_000_000,    tax:10, status:"draft",   description:"Gói Startup 3 tháng",                 owner:"Phạm Thu Hà" },
  { id:"inv8",  entityType:"lead",    entityId:"ld5",  entityName:"Thế Giới Di Động",   invoiceNo:"BG-2026-001", issueDate:"12/04/2026", dueDate:"26/04/2026", amount:2_000_000_000, tax:10, status:"draft",   description:"Báo giá giải pháp tổng thể",          owner:"Phạm Thu Hà" },
  { id:"inv9",  entityType:"lead",    entityId:"ld7",  entityName:"Viettel",            invoiceNo:"BG-2026-002", issueDate:"13/04/2026", dueDate:"27/04/2026", amount:5_000_000_000, tax:10, status:"sent",    description:"Đề xuất gói Enterprise",              owner:"Nguyễn Lan Anh" },
  { id:"inv10", entityType:"company", entityId:"co6",  entityName:"Nova Real Estate",   invoiceNo:"HD-2026-010", issueDate:"01/04/2026", dueDate:"30/04/2026", amount:560_000_000,   tax:10, status:"sent",    description:"Phí triển khai phần mềm Q2/2026",    owner:"Trần Đức Minh" },
];

/* ═══════════ Context ═══════════ */
interface CrmInvoiceContextValue {
  crmInvoices: CrmInvoice[];
  setCrmInvoices: Dispatch<SetStateAction<CrmInvoice[]>>;
}

const CrmInvoiceContext = createContext<CrmInvoiceContextValue | null>(null);

export function CrmInvoiceProvider({ children }: { children: ReactNode }) {
  const [crmInvoices, setCrmInvoices] = useState<CrmInvoice[]>(initCrmInvoices);
  return (
    <CrmInvoiceContext.Provider value={{ crmInvoices, setCrmInvoices }}>
      {children}
    </CrmInvoiceContext.Provider>
  );
}

export function useCrmInvoices() {
  const ctx = useContext(CrmInvoiceContext);
  if (!ctx) throw new Error("useCrmInvoices must be used inside CrmInvoiceProvider");
  return ctx;
}
