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
  Select,
  Textarea,
  formatDate,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
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
    setSets(null);
    setLoadError(null);
    try {
      const [setList, templateList] = await Promise.all([api.admin.sets(), api.admin.templates()]);
      setSets(setList);
      setTemplates(templateList);
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
    setFieldErrors({});
    if (mutationLock.current) return;
    setError(null);

    if (form.items.length === 0) {
      setError("ชุดคูปอง ต้องมีคูปองอย่างน้อย 1 รายการ");
      return;
    }

    if (
      form.items.some(
        (i) =>
          !templates.some((t) => t.id === i.couponTemplateId) ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > 100,
      ) ||
      new Set(form.items.map((i) => i.couponTemplateId)).size !== form.items.length
    ) {
      setError("เลือกคูปองไม่ซ้ำกัน และระบุจำนวน 1–100 ใบในแต่ละรายการ");
      return;
    }
    mutationLock.current = true;
    setBusy(true);
    try {
      if (editing) {
        await api.admin.updateSet(editing.id, form);
        setNotice(`แก้ไข ชุดคูปอง "${form.name}" เรียบร้อย`);
      } else {
        await api.admin.createSet(form);
        setNotice(`สร้างชุดคูปอง "${form.name}" เรียบร้อย`);
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

  async function handleDelete(set: AdminCouponSet) {
    if (mutationLock.current) return;
    if (!window.confirm(`ลบ ชุดคูปอง "${set.name}"?\n(คูปองที่มอบไปแล้วไม่กระทบ)`)) return;
    mutationLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await api.admin.deleteSet(set.id);
      setNotice(`ลบ ชุดคูปอง "${set.name}" เรียบร้อย `);
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
        title="ชุดคูปอง"
        subtitle="ชุดสำเร็จรูปให้ผู้ใช้มอบหลายใบพร้อมกัน — แก้ไขภายหลังไม่กระทบคูปองที่มอบไปแล้ว"
        action={
          <Button disabled={busy || deleting} onClick={openCreate}>
            + สร้างชุดคูปอง
          </Button>
        }
      />

      {notice && <Notice>{notice}</Notice>}
      <ErrorText message={error} />
      {deleting && <p role="status">กำลังลบรายการ…</p>}

      {showForm ? (
        <Card className="space-y-4 border-control">
          <p className="font-semibold">
            {editing ? `แก้ไข ชุดคูปอง: ${editing.name}` : "สร้างชุดคูปอง ใหม่"}
          </p>
          <form aria-busy={busy} ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชื่อชุดคูปอง" error={fieldErrors.name?.[0]}>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={100}
                />
              </Field>
              <label className="mt-6 flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="size-4 accent-purple-600"
                />
                เปิดให้เลือก
              </label>
            </div>
            <Field label="คำอธิบาย" error={fieldErrors.description?.[0]}>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
              />
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted">
                คูปองในชุดคูปอง ({form.items.reduce((s, i) => s + i.quantity, 0)} ใบ)
              </p>
              {form.items.map((item, index) => (
                <div
                  key={index}
                  className="grid min-w-0 gap-3 rounded-xl border border-control p-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto]"
                >
                  <Field
                    label={`คูปองรายการที่ ${index + 1}`}
                    error={fieldErrors[`items[${index}].coupontemplateid`]?.[0]}
                  >
                    <Select
                      value={item.couponTemplateId}
                      onChange={(e) => updateItem(index, { couponTemplateId: Number(e.target.value) })}
                      className="min-w-0"
                    >
                      {templates.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={form.items.some((i, row) => row !== index && i.couponTemplateId === t.id)}
                        >
                          {t.emoji} {t.name} ({t.rarity})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="จำนวน (ใบ)" error={fieldErrors[`items[${index}].quantity`]?.[0]}>
                    <Input
                      required
                      type="number"
                      min={1}
                      max={100}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      inputMode="numeric"
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    aria-label={`ลบคูปองรายการที่ ${index + 1}`}
                    className="self-end"
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
                onClick={() => {
                  const next = templates.find((t) => !form.items.some((i) => i.couponTemplateId === t.id));
                  if (!next) return;
                  setForm({ ...form, items: [...form.items, { couponTemplateId: next.id, quantity: 1 }] });
                  requestAnimationFrame(() => {
                    const selects = formRef.current?.querySelectorAll("select");
                    selects?.[selects.length - 1]?.focus();
                  });
                }}
                disabled={busy || templates.every((t) => form.items.some((i) => i.couponTemplateId === t.id))}
              >
                + เพิ่มคูปอง
              </Button>
            </div>

            <div className="flex justify-end gap-2">
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
      ) : !sets ? (
        <Skeleton />
      ) : sets.length === 0 ? (
        <EmptyState title="ยังไม่มี ชุดคูปอง" hint="สร้างชุดแรก เช่น Romantic ชุดคูปอง" />
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <Card key={set.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold">
                  {set.name}{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${set.isActive ? "bg-mint-soft text-mint-ink" : "bg-canvas text-muted"}`}
                  >
                    {set.isActive ? "เปิดให้เลือก" : "ซ่อนไว้"}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  {set.description} · รวม {set.items.reduce((s, i) => s + i.quantity, 0)} ใบ · สร้าง{" "}
                  {formatDate(set.createdAt)}
                </p>
                <p className="text-sm text-muted">
                  {set.items.map((i) => `${i.templateName} ×${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || deleting}
                  onClick={() => openEdit(set)}
                >
                  แก้ไข
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy || deleting}
                  onClick={() => handleDelete(set)}
                >
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
