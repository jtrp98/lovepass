import Link from "next/link";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว — LOVE PASS",
  description: "ข้อมูลที่ LOVE PASS ใช้เพื่อดูแลบัญชี คูปองของคู่รัก และการแจ้งเตือนทางอีเมล",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-5 py-8 md:py-12">
      <Link href="/" className="inline-flex min-h-12 items-center font-display text-xl font-semibold text-love">
        ♡ LOVE PASS
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl leading-relaxed">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-sm text-muted">ปรับปรุงล่าสุด 30 ตุลาคม 2569</p>
        <p className="text-lg leading-relaxed">
          LOVE PASS เป็นเว็บสำหรับคู่รักที่มอบคูปองของขวัญ ขอใช้คูปอง และยืนยันให้กัน
          หน้านี้อธิบายข้อมูลที่ใช้เพื่อให้บริการและส่งอีเมลแจ้งเตือน
        </p>
      </header>
      <section className="space-y-3" aria-labelledby="account-data">
        <h2 id="account-data" className="text-xl font-semibold">ข้อมูลที่เราเก็บและใช้</h2>
        <p className="leading-relaxed">
          เราเก็บอีเมล ชื่อที่แสดง และข้อมูลยืนยันตัวตนสำหรับบัญชี รวมถึงการจับคู่ คำเชิญ
          คูปอง ข้อความที่คุณส่ง และประวัติคำขอใช้คูปอง เพื่อแสดงข้อมูลให้คุณและคู่ของคุณ
          และตรวจสอบสิทธิ์เข้าถึง ระบบเก็บรหัสผ่านในรูปแบบแฮช และเก็บรหัสเชื่อมต่อสำหรับการเข้าสู่ระบบ
        </p>
        <p className="leading-relaxed">
          ผู้ดูแลระบบสามารถเข้าถึงข้อมูลที่จำเป็นสำหรับดูแลบริการ แก้ปัญหา และจัดการบัญชี
          โปรดหลีกเลี่ยงการใส่ข้อมูลอ่อนไหวในข้อความหรือคูปอง
        </p>
      </section>
      <section className="space-y-3" aria-labelledby="google-data">
        <h2 id="google-data" className="text-xl font-semibold">การเชื่อมต่อ Google และการส่งอีเมล</h2>
        <p className="leading-relaxed">
          ผู้ดูแล LOVE PASS เชื่อมบัญชี Gmail ของผู้ส่งเพื่อส่งการแจ้งเตือนคูปอง คำขอใช้คูปอง
          ผลอนุมัติหรือปฏิเสธ และลิงก์รีเซ็ตรหัสผ่าน ระบบขอเฉพาะสิทธิ์
          <code className="mx-1 break-all">gmail.send</code>
          เพื่อส่งเมลในนามบัญชีที่อนุญาต โดยไม่ขอสิทธิ์อ่านกล่องจดหมายของบัญชีนั้น
          ผู้รับการแจ้งเตือนไม่ต้องเชื่อม Gmail ของตนเอง
        </p>
        <p className="leading-relaxed">
          เราเก็บข้อมูลเชื่อมต่อของผู้ส่ง รวมถึง refresh token ในการตั้งค่าฝั่งเซิร์ฟเวอร์
          เพื่อส่งเมลอัตโนมัติ และส่งอีเมลผู้รับพร้อมเนื้อหาแจ้งเตือนที่เกี่ยวข้องไปยัง Google
          หากเปิดใช้ปุ่มเข้าสู่ระบบด้วย Google ระบบจะใช้อีเมล ชื่อ และตัวระบุบัญชี Google
          เพื่อสร้างหรือเชื่อมบัญชี LOVE PASS
        </p>
        <p className="leading-relaxed">
          ข้อมูลจาก Google ใช้เพื่อให้บริการตามที่อธิบายไว้เท่านั้น เราไม่ขายข้อมูลดังกล่าวหรือใช้เพื่อโฆษณา
          การใช้และส่งต่อข้อมูลที่ได้รับจาก Google APIs เป็นไปตาม
          {" "}<a className="text-love underline underline-offset-4" href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>{" "}
          รวมถึงข้อกำหนด Limited Use
        </p>
      </section>
      <section className="space-y-3" aria-labelledby="providers">
        <h2 id="providers" className="text-xl font-semibold">บริการที่ช่วยประมวลผลข้อมูล</h2>
        <p className="leading-relaxed">
          LOVE PASS ใช้ Vercel ให้บริการหน้าเว็บ Render สำหรับ API Supabase สำหรับฐานข้อมูล
          และ Google สำหรับการเชื่อมบัญชีและส่งเมล ผู้ให้บริการเหล่านี้อาจประมวลผลข้อมูลทางเทคนิค
          เช่น ที่อยู่ IP และบันทึกการใช้งาน ตามที่จำเป็นต่อการให้บริการและนโยบายของแต่ละบริการ
        </p>
        <p className="leading-relaxed">
          เว็บเก็บข้อมูลการเข้าสู่ระบบและตัวเลือกการใช้งานบางอย่างในพื้นที่จัดเก็บของเบราว์เซอร์
          ออกจากระบบและล้างข้อมูลเว็บไซต์ได้จากอุปกรณ์ของคุณ
        </p>
      </section>
      <section className="space-y-3" aria-labelledby="retention">
        <h2 id="retention" className="text-xl font-semibold">ระยะเวลาเก็บข้อมูลและการถอนสิทธิ์</h2>
        <p className="leading-relaxed">
          เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ ประวัติคูปอง และการดูแลความปลอดภัย
          การปิดบัญชีอาจยังเหลือประวัติที่เกี่ยวข้องกับคู่ของคุณและข้อมูลสำรองของผู้ให้บริการ
          ติดต่อผู้ดูแลเพื่อขอเข้าถึง แก้ไข หรือลบข้อมูล และสอบถามข้อมูลที่ยังจำเป็นต้องเก็บไว้
        </p>
        <p className="leading-relaxed">
          เจ้าของบัญชี Google ถอนสิทธิ์ของ LOVE PASS ได้ที่
          {" "}<a className="text-love underline underline-offset-4" href="https://myaccount.google.com/connections">การเชื่อมต่อบัญชี Google</a>
          {" "}เมื่อถอนสิทธิ์บัญชีผู้ส่ง ระบบจะไม่สามารถส่งอีเมลผ่านบัญชีนั้นได้จนกว่าจะเชื่อมใหม่
        </p>
      </section>
      <section className="space-y-3" aria-labelledby="contact">
        <h2 id="contact" className="text-xl font-semibold">ติดต่อผู้ดูแล</h2>
        <p className="leading-relaxed">
          สอบถามเรื่องข้อมูลส่วนตัวหรือส่งคำขอเกี่ยวกับบัญชีได้ที่
          {" "}<a className="break-all text-love underline underline-offset-4" href="mailto:jaturapat.code@gmail.com">jaturapat.code@gmail.com</a>
          {" "}ผู้ดูแลอาจขอข้อมูลเพิ่มเติมเพื่อยืนยันว่าคุณเป็นเจ้าของบัญชีก่อนดำเนินการ
        </p>
      </section>
    </main>
  );
}
