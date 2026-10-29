"use client";

import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  ErrorState,
  Skeleton,
  Notice,
  Field,
  Input,
  PageTitle,
  RarityBadge,
  Select,
  Textarea,
  formatDate,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import type { AdminCouponTemplate, Rarity } from "@/types";
import { couponCategories, resolveCategory, type CouponCategory } from "@/lib/coupon-categories";
import { TicketIllustration } from "@/components/ticket-illustration";

interface TemplateForm {
  name: string;
  description: string;
  terms: string;
  rarity: Rarity;
  category: CouponCategory;
  emoji: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm: TemplateForm = {
  name: "",
  description: "",
  terms: "",
  rarity: "COMMON",
  category: "OTHER",
  emoji: "🎟️",
  imageUrl: "",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [templates, setTemplates] = useState<AdminCouponTemplate[] | null>(null);
  const [editing, setEditing] = useState<AdminCouponTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mutationLock = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (showForm) {
      formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
      formRef.current?.scrollIntoView({ block: "start" });
    }
  }, [showForm, editing]);
  async function load() {
    setTemplates(null);
    setLoadError(null);
    try {
      setTemplates(await api.admin.templates());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.displayMessage : "โหลดรายการไม่สำเร็จ");
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
      category: resolveCategory(template.category),
      emoji: template.emoji ?? "",
      imageUrl: template.imageUrl ?? "",
      isActive: template.isActive,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    if (mutationLock.current) return;
    setError(null);
    mutationLock.current = true;
    setBusy(true);

    const body = {
      name: form.name,
      description: form.description,
      terms: form.terms,
      rarity: form.rarity,
      category: form.category,
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
      if (err instanceof ApiError && err.errors) setFieldErrors(err.fieldMessages);
      setError(err instanceof ApiError ? err.displayMessage : "บันทึกไม่สำเร็จ");
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  async function handleDelete(template: AdminCouponTemplate) {
    if (mutationLock.current) return;
    if (!window.confirm(`ลบ "${template.name}"?\n(คูปองที่มอบไปแล้วยังใช้ได้ตามเงื่อนไขเดิม)`)) return;
    mutationLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await api.admin.deleteTemplate(template.id);
      setNotice(`ลบ "${template.name}" เรียบร้อย `);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ลบไม่สำเร็จ");
    } finally {
      mutationLock.current = false;
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="ต้นแบบคูปอง"
        subtitle="ต้นแบบคูปองกลาง — คูปองที่ออกไปแล้วคงเงื่อนไขเดิม"
        action={
          <Button disabled={busy || deleting} onClick={openCreate}>
            + สร้างต้นแบบคูปอง
          </Button>
        }
      />

      {notice && <Notice>{notice}</Notice>}
      <ErrorText message={error} />
      {deleting && <p role="status">กำลังลบรายการ…</p>}

      {showForm ? (
        <Card className="space-y-4 border-control">
          <p className="font-semibold">{editing ? `แก้ไข: ${editing.name}` : "สร้างต้นแบบคูปอง ใหม่"}</p>
          <form aria-busy={busy} ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อคูปอง" error={fieldErrors.name?.[0]}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
              />
            </Field>
            <Field label="ประเภทความพิเศษ">
              <Select
                value={form.rarity}
                onChange={(e) => setForm({ ...form, rarity: e.target.value as Rarity })}
              >
                <option value="COMMON">อบอุ่น · COMMON</option>
                <option value="RARE">พิเศษ · RARE</option>
                <option value="EPIC">สุดพิเศษ · EPIC</option>
                <option value="LEGENDARY">ล้ำค่า · LEGENDARY</option>
              </Select>
            </Field>
            <Field label="หมวดหมู่คูปอง" hint="ไอคอนใช้ตามหมวด ส่วนสีใช้ตามระดับความพิเศษ" error={fieldErrors.category?.[0]}>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CouponCategory })}>
                {Object.entries(couponCategories).map(([value, category]) => <option key={value} value={value}>{category.label}</option>)}
              </Select>
            </Field>
            <div className="category-icon-preview pocket-detail" data-rarity={form.rarity}>
              <TicketIllustration category={form.category} />
              <p>{couponCategories[form.category].label}<span>ใช้รูปเดิมได้ทุกคูปองในหมวดนี้</span></p>
            </div>
            <Field label="Emoji">
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                maxLength={16}
                placeholder="🤗"
              />
            </Field>
            <Field label="Image URL (ไม่บังคับ)">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="คำอธิบาย" error={fieldErrors.description?.[0]}>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="เงื่อนไขการใช้งาน" error={fieldErrors.terms?.[0]}>
                <Textarea
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  maxLength={1000}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 accent-purple-600"
              />
              เปิดให้เลือกในคลังคูปอง
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy || deleting}
                onClick={() => setShowForm(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loadError ? (
        <ErrorState message={loadError} retry={load} />
      ) : !templates ? (
        <Skeleton />
      ) : templates.length === 0 ? (
        <EmptyState title="ยังไม่มีต้นแบบคูปอง" hint="กดสร้างต้นแบบคูปอง แรกของระบบ" />
      ) : (
        <div className="admin-table overflow-x-auto rounded-xl border border-control bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-control bg-canvas text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">คูปอง</th>
                <th className="px-4 py-3">หมวด / ระดับ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">สร้างเมื่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b border-control last:border-0">
                  <td data-label="คูปอง" className="px-4 py-3">
                    <span className="mr-2 text-lg">{template.emoji ?? "🎟️"}</span>
                    <span className="font-semibold">{template.name}</span>
                  </td>
                  <td data-label="ประเภท" className="px-4 py-3">
                    <p className="mb-1">{couponCategories[resolveCategory(template.category)].label}</p>
                    <RarityBadge rarity={template.rarity} />
                  </td>
                  <td data-label="สถานะ" className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        template.isActive ? "bg-mint-soft text-mint-ink" : "bg-canvas text-muted"
                      }`}
                    >
                      {template.isActive ? "เปิดให้เลือก" : "ซ่อนไว้"}
                    </span>
                  </td>
                  <td data-label="สร้างเมื่อ" className="px-4 py-3 text-muted">
                    {formatDate(template.createdAt)}
                  </td>
                  <td data-label="จัดการ" className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy || deleting}
                        onClick={() => openEdit(template)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy || deleting}
                        onClick={() => handleDelete(template)}
                      >
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
