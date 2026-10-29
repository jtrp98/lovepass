"use client";

import { Button, Card, EmptyState, ErrorText, Field, Input, PageTitle, RarityBadge, Select, Textarea, formatDate } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { AdminCouponTemplate, Rarity } from "@/types";

interface TemplateForm {
  name: string;
  description: string;
  terms: string;
  rarity: Rarity;
  emoji: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm: TemplateForm = {
  name: "",
  description: "",
  terms: "",
  rarity: "COMMON",
  emoji: "🎟️",
  imageUrl: "",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [templates, setTemplates] = useState<AdminCouponTemplate[] | null>(null);
  const [editing, setEditing] = useState<AdminCouponTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setTemplates(await api.admin.templates());
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "โหลดรายการไม่สำเร็จ");
      setTemplates([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEdit(template: AdminCouponTemplate) {
    setEditing(template);
    setForm({
      name: template.name,
      description: template.description,
      terms: template.terms,
      rarity: template.rarity,
      emoji: template.emoji ?? "",
      imageUrl: template.imageUrl ?? "",
      isActive: template.isActive,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const body = {
      name: form.name,
      description: form.description,
      terms: form.terms,
      rarity: form.rarity,
      emoji: form.emoji || null,
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await api.admin.updateTemplate(editing.id, body);
        setNotice(`แก้ไข "${form.name}" เรียบร้อย`);
      } else {
        await api.admin.createTemplate(body);
        setNotice(`สร้าง "${form.name}" เรียบร้อย`);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(template: AdminCouponTemplate) {
    if (!window.confirm(`ลบ "${template.name}"?\n(soft delete — คูปองที่มอบไปแล้วยังใช้ได้ตามเงื่อนไขเดิม)`)) return;
    setError(null);
    try {
      await api.admin.deleteTemplate(template.id);
      setNotice(`ลบ "${template.name}" เรียบร้อย (soft delete)`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Coupon Templates"
        subtitle="ต้นแบบคูปองกลาง — คูปองที่ออกไปแล้วคงเงื่อนไขเดิม (snapshot)"
        action={<Button onClick={openCreate}>+ สร้าง Template</Button>}
      />

      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      <ErrorText message={error} />

      {showForm ? (
        <Card className="space-y-4 border-purple-200">
          <p className="font-bold">{editing ? `แก้ไข: ${editing.name}` : "สร้าง Template ใหม่"}</p>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อคูปอง">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            </Field>
            <Field label="Rarity">
              <Select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value as Rarity })}>
                <option value="COMMON">COMMON — เทา</option>
                <option value="RARE">RARE — ฟ้า</option>
                <option value="EPIC">EPIC — ม่วง</option>
                <option value="LEGENDARY">LEGENDARY — ทอง</option>
              </Select>
            </Field>
            <Field label="Emoji">
              <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={16} placeholder="🤗" />
            </Field>
            <Field label="Image URL (ไม่บังคับ)">
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </Field>
            <div className="sm:col-span-2">
              <Field label="คำอธิบาย">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="เงื่อนไขการใช้งาน">
                <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} maxLength={1000} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 accent-purple-600"
              />
              Active (แสดงในคลังคูปอง)
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {!templates ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : templates.length === 0 ? (
        <EmptyState title="ยังไม่มี Template" hint="กดสร้าง Template แรกของระบบ" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">คูปอง</th>
                <th className="px-4 py-3">Rarity</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">สร้างเมื่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="mr-2 text-lg">{template.emoji ?? "🎟️"}</span>
                    <span className="font-semibold">{template.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <RarityBadge rarity={template.rarity} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        template.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {template.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(template.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(template)}>
                        แก้ไข
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(template)}>
                        ลบ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
