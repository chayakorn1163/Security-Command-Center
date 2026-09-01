import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const reportType = searchParams.get("type") || "daily";
    if (!startDate || !endDate) return NextResponse.json({ success: false, message: "กรุณาระบุช่วงวันที่" });

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("report_date, site, shift, guard_name, employee_id, pos_type, status, earned")
      .gte("report_date", startDate)
      .lte("report_date", endDate);
    if (error) throw new Error(error.message);

    let reportData = [];

    if (reportType === "daily") {
      const map = {};
      (rows || []).forEach((row) => {
        const key = `${row.report_date}|${row.site}|${row.shift}`;
        if (!map[key]) map[key] = { date: row.report_date, site: row.site, shift: row.shift, present: 0, absent: 0, billable: 0, deduct: 0 };
        if (row.status === "มา") map[key].present++;
        if (row.status === "ขาด" || row.status === "ขาดจุด") map[key].absent++;
        map[key].billable += Number(row.earned) || 0;
      });
      reportData = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
    } else {
      const map = {};
      (rows || []).forEach((row) => {
        const name = (row.guard_name || "").trim();
        if (!name || name === "(ว่าง)" || row.status !== "มา") return;
        const key = `${name}|${row.employee_id}|${row.site}`;
        if (!map[key]) map[key] = { name, id: row.employee_id, posType: row.pos_type, site: row.site, dayCount: 0, nightCount: 0, totalEarned: 0 };
        if (row.shift === "กลางวัน") map[key].dayCount++; else map[key].nightCount++;
        map[key].totalEarned += Number(row.earned) || 0;
      });
      reportData = Object.values(map).sort((a, b) => b.totalEarned - a.totalEarned);
    }

    return NextResponse.json({ success: true, data: reportData, reportType });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
