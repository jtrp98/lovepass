"use client";

import { Button, Card, EmptyState, ErrorText, Field, Input, PageTitle, Select, Textarea, formatDate } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { AdminCouponSet, AdminCouponTemplate, GiftItemInput } from "@/types";

interface SetForm {
  name: string;
  description: string;
  isActive: boolean;
  items: GiftItemInput[];
}

const emptyForm: SetForm = { name: "", description: "", isActive: true, items: [] };

export default function AdminSetsPage() {
  const [sets, setSets] = useState<AdminCouponSet[] | null>(null);
  const [templates, setTemplates] = useState<AdminCouponTemplate[]>([]);
  const [editing, setEditing] = useState<AdminCouponSet | null>(null);
  const [form, setForm] = useState<SetForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [setList, templateList] = await Promise.all([api.admin.sets(), api.admin.templates()]);
      setSets(setList);
      setTemplates(templateList);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "โหลดรายการไม่สำเร็จ");
      setSets([]);
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

  function openEdit(set: AdminCouponSet) {
    setEditing(set);
    setForm({
      name: set.name,
      description: set.description,
      isActive: set.isActive,
      items: set.items.map((i) => ({ couponTemplateId: i.couponTemplateId, quantity: i.quantity })),
    });
    setShowForm(true);
    setError(null);
  }

  function updateItem(index: number, patch: Partial<GiftItemInput>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.items.length === 0) {
      setError("Set ต้องมีคูปองอย่างน้อย 1 รายการ");
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await api.admin.updateSet(editing.id, form);
        setNotice(`แก้ไข Set "${form.name}" เรียบร้อย`);
      } else {
        await api.admin.createSet(form);
        setNotice(`สร้าง Set "${form.name}" เรียบร้อย`);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(set: AdminCouponSet) {
    if (!window.confirm(`ลบ Set "${set.name}"?\n(soft delete — คูปองที่มอบไปแล้วไม่กระทบ)`)) return;
    setError(null);
    try {
      await api.admin.deleteSet(set.id);
      setNotice(`ลบ Set "${set.name}" เรียบร้อย (soft delete)`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Coupon Sets"
        subtitle="ชุดสำเร็จรูปให้ผู้ใช้มอบหลายใบพร้อมกัน — แก้ไขภายหลังไม่กระทบคูปองที่มอบไปแล้ว"
        action={<Button onClick={openCreate}>+ สร้าง Set</Button>}
      />

      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      <ErrorText message={error} />

      {showForm ? (
        <Card className="space-y-4 border-purple-200">
          <p className="font-bold">{editing ? `แก้ไข Set: ${editing.name}` : "สร้าง Set ใหม่"}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชื่อ Set">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
              </Field>
              <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="size-4 accent-purple-600"
                />
                Active
              </label>
            </div>
            <Field label="คำอธิบาย">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">คูปองใน Set ({form.items.reduce((s, i) => s + i.quantity, 0)} ใบ)</p>
              {form.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={item.couponTemplateId}
                    onChange={(e) => updateItem(index, { couponTemplateId: Number(e.target.value) })}
                    className="flex-1"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.emoji} {t.name} ({t.rarity})
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                  >
                    ลบ
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [...form.items, { couponTemplateId: templates[0]?.id ?? 0, quantity: 1 }],
                  })
                }
                disabled={templates.length === 0}
              >
                + เพิ่มคูปอง
              </Button>
            </div>

            <div className="flex justify-end gap-2">
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

      {!sets ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : sets.length === 0 ? (
        <EmptyState title="ยังไม่มี Set" hint="สร้างชุดแรก เช่น Romantic Set" />
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <Card key={set.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold">
                  {set.name}{" "}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${set.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {set.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  {set.description} · รวม {set.items.reduce((s, i) => s + i.quantity, 0)} ใบ · สร้าง {formatDate(set.createdAt)}
                </p>
                <p className="text-xs text-gray-400">
                  {set.items.map((i) => `${i.templateName} ×${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(set)}>
                  แก้ไข
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(set)}>
                  ลบ
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
