import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || 30);

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("report_date, status")
      .gte("report_date", fmt(startDate))
      .lte("report_date", fmt(today));
    if (error) throw new Error(error.message);

    const byDate = {};
    (rows || []).forEach((r) => {
      const d = r.report_date;
      if (!byDate[d]) byDate[d] = { present: 0, absent: 0 };
      if (r.status === "มา") byDate[d].present++;
      else byDate[d].absent++;
    });

    const trends = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const key = fmt(d);
      const entry = byDate[key] || { present: 0, absent: 0 };
      const total = entry.present + entry.absent;
      trends.push({
        date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        present: entry.present,
        absent: entry.absent,
        attendanceRate: total > 0 ? Math.round((entry.present / total) * 100) : 0,
      });
    }

    return NextResponse.json({ success: true, trends });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
