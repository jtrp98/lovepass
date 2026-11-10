#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const newVersion = process.argv[2]?.trim();

if (!newVersion) {
  console.error("ข้อผิดพลาด: โปรดระบุเลขเวอร์ชันใหม่");
  console.error("การใช้งาน: node scripts/release.mjs <x.y.z>");
  console.error("ตัวอย่าง:  node scripts/release.mjs 1.5.0");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`ข้อผิดพลาด: รูปแบบเวอร์ชัน '${newVersion}' ไม่ถูกต้อง (ต้องเป็น x.y.z เช่น 1.5.0 หรือ 1.4.5)`);
  process.exit(1);
}

console.log(`🌸 กำลังเตรียม Release LOVE PASS เวอร์ชัน ${newVersion}...`);

// 1. frontend/package.json
const frontendPkgPath = resolve(root, "frontend/package.json");
const frontendPkg = JSON.parse(readFileSync(frontendPkgPath, "utf8"));
const oldVersion = frontendPkg.version;
frontendPkg.version = newVersion;
writeFileSync(frontendPkgPath, JSON.stringify(frontendPkg, null, 2) + "\n", "utf8");
console.log(`  ✓ อัปเดต frontend/package.json (${oldVersion} → ${newVersion})`);

// 2. frontend/package-lock.json
const frontendLockPath = resolve(root, "frontend/package-lock.json");
try {
  const frontendLock = JSON.parse(readFileSync(frontendLockPath, "utf8"));
  frontendLock.version = newVersion;
  if (frontendLock.packages?.[""]) {
    frontendLock.packages[""].version = newVersion;
  }
  writeFileSync(frontendLockPath, JSON.stringify(frontendLock, null, 2) + "\n", "utf8");
  console.log(`  ✓ อัปเดต frontend/package-lock.json`);
} catch (err) {
  console.warn(`  ! ไม่สามารถอัปเดต frontend/package-lock.json ได้ (${err.message})`);
}

// 3. backend/Directory.Build.props
const backendPropsPath = resolve(root, "backend/Directory.Build.props");
try {
  let props = readFileSync(backendPropsPath, "utf8");
  props = props.replace(/<Version>[^<]+<\/Version>/, `<Version>${newVersion}</Version>`);
  writeFileSync(backendPropsPath, props, "utf8");
  console.log(`  ✓ อัปเดต backend/Directory.Build.props`);
} catch (err) {
  console.warn(`  ! ไม่สามารถอัปเดต backend/Directory.Build.props ได้ (${err.message})`);
}

// 4. docs/guides/release-workflow.md
const releaseWorkflowPath = resolve(root, "docs/guides/release-workflow.md");
try {
  let doc = readFileSync(releaseWorkflowPath, "utf8");
  doc = doc.replace(/Current version: \*\*[^*]+\*\*\./, `Current version: **${newVersion}**.`);
  writeFileSync(releaseWorkflowPath, doc, "utf8");
  console.log(`  ✓ อัปเดต docs/guides/release-workflow.md`);
} catch (err) {
  console.warn(`  ! ไม่สามารถอัปเดต docs/guides/release-workflow.md ได้ (${err.message})`);
}

console.log(`\n🎉 อัปเดตไฟล์เวอร์ชัน ${newVersion} เรียบร้อยแล้ว!`);
console.log(`ขั้นตอนถัดไปสำหรับการปล่อย Release:`);
console.log(`  1. ตรวจสอบโค้ด: npm --prefix frontend test && dotnet test backend`);
console.log(`  2. บันทึกและสร้าง Tag: git commit -am "Release LOVE PASS ${newVersion}" && git tag ${newVersion}`);
