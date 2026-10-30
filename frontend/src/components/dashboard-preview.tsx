import { LoveDoodle } from "./love-doodle";
import { StationeryIcon, type StationeryIconName } from "./stationery";
import type { Rarity } from "@/types";

const stats = [
  { label: "ได้รับแล้ว", value: 8 },
  { label: "ใช้ไปแล้ว", value: 3 },
  { label: "ใกล้หมดอายุ", value: 1 },
  { label: "คำขอรอพิจารณา", value: 1 },
];
const tickets: { name: string; rarity: Rarity; status: string; state: "available" | "pending" | "used" }[] = [
  { name: "ตั๋วกอดไม่อั้น", rarity: "COMMON", status: "พร้อมใช้ 2 ใบ", state: "available" },
  { name: "มื้อพิเศษสำหรับสองเรา", rarity: "RARE", status: "รอแฟนยืนยัน", state: "pending" },
  { name: "ตั๋วขอพร 1 ข้อ", rarity: "EPIC", status: "ใช้แล้ว 14 ต.ค.", state: "used" },
];
const nav: { icon: StationeryIconName; label: string }[] = [
  { icon: "hearts", label: "บ้านของเรา" },
  { icon: "gift", label: "เลือกของขวัญ" },
  { icon: "ticket", label: "คูปองฉัน" },
  { icon: "letter", label: "คำขอ" },
];

/**
 * A static, clearly labelled picture of the signed-in home page for visitors.
 * Built from the real journal/stat/ticket styles but holds no live data or controls.
 */
export function DashboardPreview() {
  return (
    <figure className="dashboard-preview">
      <span className="dashboard-preview-tag" aria-hidden="true">ตัวอย่าง</span>
      <div className="dashboard-preview-page" inert>
        <header className="dashboard-preview-header">
          <span className="brand-heart" aria-hidden="true">♡</span>
          <div>
            <p className="dashboard-preview-title">บ้านของเรา</p>
            <p className="dashboard-preview-subtitle">สมุดตั๋วของคุณกับ เธอคนโปรด</p>
          </div>
        </header>
        <div className="paper-card journal-welcome dashboard-preview-welcome" data-material="journal">
          <LoveDoodle />
          <p className="dashboard-preview-heading">มีคำขอที่รอคุณยืนยัน</p>
          <p>เธอคนโปรดฉีกหางตั๋ว “มื้อพิเศษสำหรับสองเรา” ขอใช้เย็นนี้</p>
          <span className="ui-button ui-button-primary dashboard-preview-button">พิจารณาคำขอ</span>
        </div>
        <dl className="journal-stats dashboard-preview-stats">
          {stats.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
        <ul className="dashboard-preview-tickets" aria-label="ตั๋วในสมุด">
          {tickets.map((ticket) => (
            <li key={ticket.name} className="mini-ticket" data-rarity={ticket.rarity} data-state={ticket.state}>
              <span className="mini-ticket-name">{ticket.name}</span>
              <span className="mini-ticket-status">{ticket.status}</span>
            </li>
          ))}
        </ul>
        <nav className="dashboard-preview-nav" aria-label="เมนูตัวอย่าง">
          {nav.map((item, index) => (
            <span key={item.label} data-current={index === 0 || undefined}><StationeryIcon name={item.icon} />{item.label}</span>
          ))}
        </nav>
      </div>
      <figcaption>หน้าบ้านของเราหลังเข้าสู่ระบบ ข้อมูลในภาพเป็นตัวอย่าง</figcaption>
    </figure>
  );
}
