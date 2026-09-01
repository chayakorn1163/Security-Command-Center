import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ABSENT_STATUSES } from "@/lib/constants";

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || 7);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("site, position, status, rate")
      .gte("report_date", fmt(cutoff))
      .in("status", ABSENT_STATUSES);
    if (error) throw new Error(error.message);

    const map = {};
    (rows || []).forEach((row) => {
      const key = `${row.site} - ${row.position}`;
      if (!map[key]) map[key] = { site: row.site, position: row.position, count: 0, deduct: 0 };
      map[key].count++;
      map[key].deduct += row.status === "ทิ้งจุด" ? 500 : Number(row.rate) || 0;
    });

    const result = Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({ success: true, absentees: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
