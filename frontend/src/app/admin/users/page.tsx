"use client";

import { Button, EmptyState, ErrorText, PageTitle, formatDate } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { AdminUser } from "@/types";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      setUsers(await api.admin.users());
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "โหลดรายการไม่สำเร็จ");
      setUsers([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(target: AdminUser) {
    if (
      !window.confirm(
        `ลบผู้ใช้ "${target.displayName}" (${target.email})?\n(soft delete — บัญชีล็อกอินไม่ได้ทันที คู่ถูกยุติ แต่ประวัติคูปองคงเดิม)`,
      )
    )
      return;
    setError(null);
    try {
      await api.admin.deleteUser(target.id);
      setNotice(`ลบ "${target.displayName}" เรียบร้อย (soft delete)`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title="ผู้ใช้ทั้งหมด" subtitle="บัญชีในระบบและสิทธิ์การใช้งาน" />

      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      <ErrorText message={error} />

      {!users ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : users.length === 0 ? (
        <EmptyState title="ยังไม่มีผู้ใช้" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">สิทธิ์</th>
                <th className="px-4 py-3">สมัครเมื่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const protectedRow = user.role === "Admin" || user.id === me?.id;
                return (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-400">{user.id}</td>
                    <td className="px-4 py-3 font-semibold">{user.displayName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          user.role === "Admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {protectedRow ? (
                        <span className="text-xs text-gray-300">ลบไม่ได้</span>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => handleDelete(user)}>
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
