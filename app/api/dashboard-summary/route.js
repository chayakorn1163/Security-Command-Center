import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SITE_NAMES, ABSENT_STATUSES } from "@/lib/constants";

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let targetDateStr = searchParams.get("date");
    let targetSite = searchParams.get("site") || "ALL";
    if (!targetDateStr) targetDateStr = fmt(new Date());

    const targetDateObj = new Date(targetDateStr);
    const firstDayOfMonthStr = targetDateStr.slice(0, 8) + "01";
    const weekAgo = new Date(targetDateObj);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = fmt(weekAgo);

    const rangeStart = firstDayOfMonthStr < weekAgoStr ? firstDayOfMonthStr : weekAgoStr;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("shift_entries")
      .select("site, report_date, status, earned, rate")
      .gte("report_date", rangeStart)
      .lte("report_date", targetDateStr);
    if (targetSite !== "ALL") query = query.eq("site", targetSite);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const result = { today: {}, week: {}, month: {} };
    SITE_NAMES.filter((s) => s !== "Agriworld").forEach((site) => {
      result.today[site] = { present: 0, absent: 0, billable: 0, deduct: 0 };
      result.week[site] = { present: 0, absent: 0, billable: 0, deduct: 0 };
      result.month[site] = { present: 0, absent: 0, billable: 0, deduct: 0 };
    });

    (rows || []).forEach((row) => {
      if (!result.today[row.site]) return; // skip sites not tracked on the dashboard (e.g. Agriworld)
      const isAbsent = ABSENT_STATUSES.includes(row.status);
      const deduct = isAbsent ? (row.status === "ทิ้งจุด" ? 500 : Number(row.rate) || 0) : 0;
      const bill = Number(row.earned) || 0;
      const rowDate = row.report_date;

      if (rowDate >= firstDayOfMonthStr && rowDate <= targetDateStr) {
        if (row.status === "มา") result.month[row.site].present++;
        if (isAbsent) result.month[row.site].absent++;
        result.month[row.site].billable += bill;
        result.month[row.site].deduct += deduct;
      }
      if (rowDate >= weekAgoStr && rowDate <= targetDateStr) {
        if (row.status === "มา") result.week[row.site].present++;
        if (isAbsent) result.week[row.site].absent++;
        result.week[row.site].billable += bill;
        result.week[row.site].deduct += deduct;
      }
      if (rowDate === targetDateStr) {
        if (row.status === "มา") result.today[row.site].present++;
        if (isAbsent) result.today[row.site].absent++;
        result.today[row.site].billable += bill;
        result.today[row.site].deduct += deduct;
      }
    });

    return NextResponse.json({ success: true, date: targetDateStr, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
