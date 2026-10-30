"use client";
import { GiftViews } from "@/components/nav";
import { PageTitle } from "@/components/ui";
import { PackComposer } from "@/components/pack-composer";

export default function NewPackPage() {
  return <div className="space-y-6"><PageTitle title="จัดชุดของขวัญให้คนพิเศษ" subtitle="เขียนการ์ด แล้วเลือกคูปองหรือซองตามระดับใส่ชุดให้เธอ" /><GiftViews /><PackComposer /></div>;
}
