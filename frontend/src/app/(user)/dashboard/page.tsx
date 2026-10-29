"use client";
import { Button, Card, ErrorState, LinkButton, PageTitle, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import Link from "next/link";
export default function DashboardPage() {
  const stats = useResource(api.coupons.dashboard),
    couple = useResource(api.couples.me);
  const data = stats.data;
  return (
    <div className="space-y-6">
      <PageTitle
        title="บ้านของเรา"
        subtitle={
          couple.data
            ? `สมุดตั๋วของคุณกับ ${couple.data.partnerDisplayName}`
            : "ความสุขเล็ก ๆ ที่ให้กันได้ทุกวัน"
        }
      />
      {couple.error ? (
        <ErrorState message={couple.error} retry={couple.retry} />
      ) : couple.loading ? (
        <Skeleton />
      ) : couple.data === null ? (
        <Card className="space-y-3 !bg-mint-soft">
          <h2 className="text-xl">เริ่มสมุดตั๋วของสองเรา</h2>
          <p>ชวนแฟนมาใช้ด้วยกัน แล้วเริ่มมอบคำสัญญาเล็ก ๆ ให้กัน</p>
          <LinkButton href="/couple">ชวนแฟนมาใช้ด้วยกัน</LinkButton>
        </Card>
      ) : stats.error ? (
        <ErrorState message={stats.error} retry={stats.retry} />
      ) : stats.loading ? (
        <Skeleton />
      ) : (
        <Card className="space-y-3 !bg-love-soft">
          <h2 className="text-xl">
            {data?.pendingRequests
              ? "มีคำขอที่รอคุณยืนยัน"
              : data?.expiringSoon
                ? "อย่าลืมใช้ความสุขก่อนหมดอายุ"
                : data?.receivedCoupons
                  ? "วันนี้อยากใช้คูปองใบไหนดี?"
                  : "ส่งความสุขใบแรกให้แฟน"}
          </h2>
          <p>
            {data?.pendingRequests
              ? `มี ${data.pendingRequests} คำขอ เปิดดูรายละเอียดก่อนให้ใช้สิทธิ์`
              : "เลือกเวลาที่ใช่ แล้วทำตามคำสัญญาของสองเรา"}
          </p>
          <LinkButton
            href={data?.pendingRequests ? "/requests" : data?.receivedCoupons ? "/my-coupons" : "/catalog"}
          >
            {data?.pendingRequests
              ? "พิจารณาคำขอ"
              : data?.receivedCoupons
                ? "ดูคูปองของฉัน"
                : "เลือกของขวัญให้แฟน"}
          </LinkButton>
        </Card>
      )}
      <section className="space-y-3" aria-label="ข้อมูลคูปองล่าสุด">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2>ตั๋วของเรา</h2>
          <Button variant="ghost" disabled={stats.loading} onClick={stats.retry}>
            รีเฟรชข้อมูล
          </Button>
        </div>
        {stats.error ? (
          couple.data ? null : (
            <ErrorState message={stats.error} retry={stats.retry} />
          )
        ) : stats.loading ? (
          <Skeleton />
        ) : (
          data && (
            <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-love-soft bg-surface p-4 sm:grid-cols-4">
              {[
                { label: "ได้รับแล้ว", value: data.receivedCoupons, href: "/my-coupons" },
                { label: "ใช้ไปแล้ว", value: data.usedCoupons, href: "/history" },
                { label: "ใกล้หมดอายุ", value: data.expiringSoon, href: "/my-coupons" },
                { label: "คำขอรอพิจารณา", value: data.pendingRequests, href: "/requests" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-muted">{item.label}</dt>
                  <dd>
                    <Link
                      className="inline-flex min-h-12 items-center text-xl font-semibold text-love"
                      href={item.href}
                    >
                      {item.value}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          )
        )}
      </section>
      <Card className="space-y-2 !bg-butter-soft">
        <h2>ความใส่ใจไม่ต้องรอวันพิเศษ</h2>
        <p>เลือกคูปองเอง หรือเลือกชุดที่เตรียมไว้ แล้วตรวจของขวัญก่อนส่ง</p>
        <LinkButton href="/catalog" variant="secondary">
          เลือกของขวัญให้แฟน
        </LinkButton>
      </Card>
    </div>
  );
}
