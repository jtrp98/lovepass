"use client";

import {
  Button,
  Field,
  Input,
  EmptyState,
  ErrorText,
  ErrorState,
  Skeleton,
  Notice,
  PageTitle,
  formatDate,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import type { AdminUser } from "@/types";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const mutationLock = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  async function load() {
    setUsers(null);
    setLoadError(null);
    try {
      setUsers(await api.admin.users());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.displayMessage : "โหลดรายการไม่สำเร็จ");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(target: AdminUser) {
    if (mutationLock.current) return;
    if (
      !window.confirm(
        `ลบผู้ใช้ "${target.displayName}" (${target.email})?\n(บัญชีล็อกอินไม่ได้ทันที คู่ถูกยุติ แต่ประวัติคูปองคงเดิม)`,
      )
    )
      return;
    mutationLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await api.admin.deleteUser(target.id);
      setNotice(`ลบ "${target.displayName}" เรียบร้อย `);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ลบไม่สำเร็จ");
    } finally {
      mutationLock.current = false;
      setDeleting(false);
    }
  }

  const visibleUsers = users?.filter((user) =>
    `${user.displayName} ${user.email}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <div className="space-y-6">
      <PageTitle title="ผู้ใช้ทั้งหมด" subtitle="บัญชีในระบบและสิทธิ์การใช้งาน" />

      <Field label="ค้นหาชื่อหรืออีเมล">
        <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Field>
      {notice && <Notice>{notice}</Notice>}
      <ErrorText message={error} />
      {deleting && <p role="status">กำลังลบรายการ…</p>}

      {loadError ? (
        <ErrorState message={loadError} retry={load} />
      ) : !users ? (
        <Skeleton />
      ) : visibleUsers?.length === 0 ? (
        <EmptyState
          title={search ? "ไม่พบผู้ใช้ที่ตรงกับคำค้น" : "ยังไม่มีผู้ใช้"}
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearch("")}>
                ล้างคำค้น
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="admin-table overflow-x-auto rounded-xl border border-control bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-control bg-canvas text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">สิทธิ์</th>
                <th className="px-4 py-3">สมัครเมื่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers?.map((user) => {
                const protectedRow = user.role === "Admin" || user.id === me?.id;
                return (
                  <tr key={user.id} className="border-b border-control last:border-0">
                    <td data-label="รหัส" className="px-4 py-3 text-muted">
                      {user.id}
                    </td>
                    <td data-label="ชื่อ" className="px-4 py-3 font-semibold">
                      {user.displayName}
                    </td>
                    <td data-label="อีเมล" className="px-4 py-3 text-muted">
                      {user.email}
                    </td>
                    <td data-label="สิทธิ์" className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.role === "Admin"
                            ? "bg-lavender-soft text-lavender-ink"
                            : "bg-canvas text-muted"
                        }`}
                      >
                        {user.role === "Admin" ? "ผู้ดูแล" : "ผู้ใช้"}
                      </span>
                    </td>
                    <td data-label="สมัครเมื่อ" className="px-4 py-3 text-muted">
                      {formatDate(user.createdAt)}
                    </td>
                    <td data-label="จัดการ" className="px-4 py-3 text-right">
                      {protectedRow ? (
                        <span className="text-sm text-muted">บัญชีผู้ดูแล / บัญชีของคุณ</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deleting}
                          onClick={() => handleDelete(user)}
                        >
                          ลบ
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
