import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";
import { SITE_NAMES, classifyPosition } from "@/lib/constants";
import { uploadImageToDrive } from "@/lib/googleDrive";
import { sendTelegramMessage } from "@/lib/telegram";

function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<[^>]+>/g, "").trim();
}

function validatePayload(payload) {
  const errors = [];
  if (!payload.date) errors.push("กรุณาระบุวันที่");
  if (!payload.shift) errors.push("กรุณาระบุกะการทำงาน");
  if (!payload.site || !SITE_NAMES.includes(payload.site)) errors.push("ข้อมูลคลังสินค้าไม่ถูกต้อง");

  const reportDate = new Date(payload.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reportDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) errors.push("ไม่อนุญาตให้ส่งรายงานย้อนหลังเกิน 30 วัน");
  if (daysDiff < 0) errors.push("ไม่อนุญาตให้ส่งรายงานล่วงหน้าในอนาคต");
  if (!payload.roster || payload.roster.length === 0) errors.push("ไม่พบรายชื่อ รปภ.");

  if (errors.length > 0) throw new Error(errors.join("\n"));
}

async function logError(supabase, functionName, error, payload) {
  try {
    await supabase.from("error_log").insert({
      function_name: functionName,
      error_message: error.toString(),
      payload,
      user_ref: "web",
    });
  } catch (e) {
    console.error("Logging failed:", e);
  }
}

export async function POST(req) {
  const supabase = getSupabaseAdmin();
  let payload;
  try {
    payload = await req.json();

    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    validatePayload(payload);
    payload.reporterName = sanitizeInput(payload.reporterName);
    payload.meetingTopics = sanitizeInput(payload.meetingTopics);

    // 📷 Upload images to Drive
    let sigUrl = "";
    let meetUrls = [];
    const folderName = "Security_Images_" + payload.site;
    if (payload.signatureImg) sigUrl = await uploadImageToDrive(payload.signatureImg, folderName, "SIG_" + payload.date);
    if (payload.meetingImgs && payload.meetingImgs.length) {
      for (let idx = 0; idx < payload.meetingImgs.length; idx++) {
        const url = await uploadImageToDrive(payload.meetingImgs[idx], folderName, `MEET_${payload.date}_${idx + 1}`);
        meetUrls.push(url);
      }
    }

    // 👨‍✈️ Get current rates
    const { data: rateRows } = await supabase.from("config_rates").select("position_type, day_rate, night_rate");
    const rates = {};
    (rateRows || []).forEach((r) => {
      rates[r.position_type] = { day: Number(r.day_rate) || 0, night: Number(r.night_rate) || 0 };
    });

    const isNight = payload.shift === "กลางคืน";
    let totalPresent = 0, totalAbsent = 0, totalBillable = 0, totalDeduct = 0;
    const entryRows = [];

    payload.roster.forEach((guard) => {
      const posType = classifyPosition(guard.position);
      const rateToday = isNight ? rates[posType]?.night || 0 : rates[posType]?.day || 0;
      const nameVal = guard.name ? String(guard.name).trim() : "";

      let earnToday = rateToday, deductToday = 0, statusText = "มา";

      if (nameVal === "ทิ้งจุด") {
        earnToday = 0; deductToday = 500; statusText = "ทิ้งจุด";
      } else if (nameVal === "ขาดจุด" || nameVal === "ลาป่วย" || nameVal === "ลากิจ" || nameVal === "") {
        earnToday = 0; deductToday = rateToday; statusText = nameVal === "" ? "ขาดจุด" : nameVal;
      }

      if (statusText === "มา") totalPresent++; else totalAbsent++;
      totalBillable += earnToday;
      totalDeduct += deductToday;

      entryRows.push({
        report_date: payload.date,
        site: payload.site,
        shift: payload.shift,
        position: guard.position,
        guard_name: nameVal || "(ว่าง)",
        employee_id: guard.id || "",
        pos_type: posType,
        rate: rateToday,
        earned: earnToday,
        status: statusText,
      });
    });

    // 💾 Insert the report header first (unique constraint blocks duplicate submissions)
    const { data: reportRow, error: reportErr } = await supabase
      .from("shift_reports")
      .insert({
        report_date: payload.date,
        site: payload.site,
        shift: payload.shift,
        reporter_name: payload.reporterName,
        reporter_phone: payload.reporterPhone,
        meeting_topics: payload.meetingTopics || "-",
        external_link: payload.externalLink || null,
        signature_url: sigUrl,
        meeting_urls: meetUrls,
        total_present: totalPresent,
        total_absent: totalAbsent,
        total_billable: totalBillable,
        total_deduct: totalDeduct,
      })
      .select()
      .single();

    if (reportErr) {
      if (reportErr.code === "23505") {
        return NextResponse.json({
          success: false,
          message: `⚠️ มีการส่งรายงานของ ${payload.site} ประจำวันที่ ${payload.date} [กะ${payload.shift}] ไปแล้วครับ! (ไม่อนุญาตให้ส่งซ้ำ)`,
        });
      }
      throw new Error(reportErr.message);
    }

    entryRows.forEach((r) => (r.report_id = reportRow.id));
    const { error: entriesErr } = await supabase.from("shift_entries").insert(entryRows);
    if (entriesErr) throw new Error(entriesErr.message);

    // 📲 Telegram
    payload.sigUrl = sigUrl;
    payload.meetUrls = meetUrls;
    await sendTelegramMessage(payload, totalPresent, totalAbsent);

    return NextResponse.json({ success: true, message: "บันทึกข้อมูลและอัปโหลดรูปภาพสำเร็จ!" });
  } catch (err) {
    await logError(supabase, "saveShiftReport", err, payload);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในระบบ: " + err.toString() });
  }
}
