# Security Command Center — Next.js + Supabase

โปรเจกต์นี้เป็นการย้ายระบบ **CJ Logistics / CP AXTRA Security Command Center** จาก
Google Apps Script + Google Sheets มาเป็น **Next.js 14 (App Router)** + **Supabase (PostgreSQL ฟรี)**
โดยยังคงฟีเจอร์เดิมไว้ครบ: Login, Daily Entry (ลงทะเบียนกำลังพล), Dashboard (KPI, Trend, Top
Absentee, Performance Ranking, Cost Analysis, Reports/Export) พร้อมแจ้งเตือนผ่าน Telegram และ
อัปโหลดรูปภาพไปยัง Google Drive เหมือนเดิม

## 1. โครงสร้างโปรเจกต์

```
security-app/
  app/
    login/                → หน้า Login
    daily-entry/           → ฟอร์มลงทะเบียนกำลังพลรายวัน
    dashboard/              → แดชบอร์ด (5 แท็บ: Overview, Personnel, Reports, Performance, Cost)
    api/                    → API Routes (แทนฟังก์ชันใน Code.gs ทุกตัว)
  lib/                     → helper: supabase client, auth (JWT), google drive, telegram, constants
  supabase/schema.sql      → SQL schema (รันครั้งเดียวใน Supabase SQL Editor)
  middleware.js            → ป้องกันหน้า /dashboard และ /daily-entry ถ้ายังไม่ล็อกอิน
```

## 2. ตั้งค่า Supabase (Database ฟรี)

1. สมัคร/ล็อกอิน https://supabase.com แล้วสร้างโปรเจกต์ใหม่ (เลือก region สิงคโปร์ใกล้ไทยสุด)
2. เข้า **SQL Editor** → วางเนื้อหาไฟล์ `supabase/schema.sql` ทั้งหมด → กด Run
   - จะได้ตาราง `users`, `config_rates`, `shift_reports`, `shift_entries`, `error_log`
   - มี user เริ่มต้นให้: **username: `admin` / password: `123456`** (เปลี่ยนรหัสผ่านทันทีหลังใช้งานจริง
     โดย update แถวใน `users` table ด้วย hash ใหม่จาก `bcryptjs`)
3. ไปที่ **Project Settings → API** คัดลอกค่า 3 ตัวนี้ไปใส่ใน `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (ห้ามเปิดเผยฝั่ง client เด็ดขาด)

## 3. ตั้งค่า Google Drive (Service Account) สำหรับอัปโหลดรูป

Apps Script เดิมใช้ `DriveApp` ของผู้ใช้ที่ deploy ได้เลย แต่พอย้ายมาเป็นเซิร์ฟเวอร์ปกติ ต้องสร้าง
**Service Account** แทน:

1. ไปที่ https://console.cloud.google.com/ → สร้างโปรเจกต์ใหม่ (หรือใช้โปรเจกต์เดิม)
2. เปิดใช้งาน **Google Drive API**
3. ไปที่ **APIs & Services → Credentials → Create Credentials → Service Account**
4. สร้างเสร็จแล้ว เข้าไปที่ Service Account → แท็บ **Keys → Add Key → JSON** → ดาวน์โหลดไฟล์ JSON
5. เปิดไฟล์ JSON จะเจอ `client_email` และ `private_key` → ใส่ในตัวแปร:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (ต้องคง `\n` ไว้ในสตริงตามตัวอย่างใน `.env.example`)
6. ไปที่โฟลเดอร์ Google Drive หลักที่จะใช้เก็บรูป (หรือสร้างใหม่) → **Share** โฟลเดอร์นั้นให้กับอีเมลของ
   Service Account (สิทธิ์ Editor) → คัดลอก Folder ID จาก URL ใส่ใน `GOOGLE_DRIVE_PARENT_FOLDER_ID`

## 4. ตั้งค่า Telegram (เหมือนเดิม)

ใช้ `TELEGRAM_BOT_TOKEN` และ Group ID เดิมจาก Code.gs ได้เลย ใส่ในไฟล์ `.env.local`:

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_GROUP_CDC=...
TELEGRAM_GROUP_MKF=...
TELEGRAM_GROUP_MKD2=...
TELEGRAM_GROUP_MKD3=...
```

> หมายเหตุ: โค้ดใหม่ส่งเป็น "รูปเดียว + แคปชั่น" ผ่าน `sendPhoto` (ใช้ URL รูปจาก Google Drive) แทนการ
> ส่ง media group แบบไฟล์แนบตรง ๆ เหมือน Apps Script เดิม เพื่อให้ทำงานได้ง่ายบน serverless — ถ้าต้องการ
> ส่งครบทุกภาพเป็นอัลบั้มเหมือนเดิม แก้ไขเพิ่มเติมได้ที่ `lib/telegram.js`

## 5. รันโปรเจกต์บนเครื่อง (VS Code)

```bash
cd security-app
cp .env.example .env.local     # แล้วกรอกค่าจริงตามข้อ 2-4
npm install
npm run dev
```

เปิด http://localhost:3000 → จะ redirect ไปหน้า Login อัตโนมัติ

## 6. Deploy ฟรีบน Vercel

1. Push โค้ดนี้ขึ้น GitHub repository
2. ไปที่ https://vercel.com → **Add New Project** → เลือก repo
3. ในหน้า **Environment Variables** ใส่ตัวแปรทั้งหมดจาก `.env.local` (ทุกตัว รวม service role key)
4. กด Deploy — เสร็จแล้วจะได้โดเมนฟรี `https://your-app.vercel.app`

Supabase free tier + Vercel free tier รองรับการใช้งานจริงของทีมขนาดเล็ก-กลางได้สบาย โดยไม่มีค่าใช้จ่าย
ตราบใดที่ไม่เกิน quota (Supabase: 500MB DB / Vercel: 100GB bandwidth ต่อเดือน)

## 7. สิ่งที่แตกต่างจากเวอร์ชัน Apps Script เดิม (ควรทราบ)

- **Rate limiting** แบบเดิม (`CacheService`) ถูกตัดออกเพราะ serverless function ไม่มี state ต่อเนื่อง —
  ถ้าต้องการป้องกันสแปม แนะนำเพิ่ม Supabase table เก็บ timestamp การส่งล่าสุดต่อผู้ใช้ หรือใช้ Vercel
  Edge Config / Upstash Redis (มี free tier เช่นกัน)
- **กันส่งซ้ำ (duplicate submission)** ใช้ `UNIQUE constraint` ในตาราง `shift_reports`
  (`report_date + site + shift`) แทนการวนลูปเช็คทุกแถวเหมือนเดิม — เร็วกว่าและชัวร์กว่า
- **Authentication** เปลี่ยนจากเทียบรหัสผ่านตรง ๆ ในชีต เป็น **bcrypt hash + JWT cookie** (ปลอดภัยกว่ามาก)
- Dashboard UI พอร์ตมาให้ครบทุกแท็บ แต่บางส่วนของ layout ปรับให้เข้ากับ React/Tailwind component แทน
  jQuery/vanilla JS เดิม — ปรับแต่งสไตล์เพิ่มเติมได้อิสระใน `app/dashboard/tabs/*`

## 8. ขั้นตอนถัดไปที่แนะนำ

- [ ] เปลี่ยนรหัสผ่าน admin เริ่มต้นทันที
- [ ] เพิ่มหน้า "จัดการผู้ใช้" และ "ตั้งค่าเรทค่าแรง" (ตอนนี้แก้ผ่าน Supabase Table Editor ได้โดยตรงก่อน)
- [ ] เพิ่ม Row Level Security (RLS) policies ใน Supabase หากต้องการเปิด public read บางส่วน
- [ ] ถ้าอยากได้ media group เต็มรูปแบบใน Telegram หรือ export PDF ฝั่งเซิร์ฟเวอร์ (แทน window.print)
      บอกได้เลยครับ ต่อยอดเพิ่มได้
