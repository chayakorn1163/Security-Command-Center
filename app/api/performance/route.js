import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ABSENT_STATUSES } from "@/lib/constants";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 20);

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("guard_name, employee_id, status, pos_type, earned");
    if (error) throw new Error(error.message);

    const map = {};
    (rows || []).forEach((row) => {
      const name = (row.guard_name || "").trim();
      if (!name || name === "(ว่าง)" || row.pos_type === "ยอดรวม") return;

      const key = `${name}||${row.employee_id || ""}`;
      if (!map[key]) {
        map[key] = { name, id: row.employee_id || "", totalDays: 0, presentDays: 0, absentDays: 0, attendanceRate: 0, totalEarned: 0 };
      }
      map[key].totalDays++;
      if (row.status === "มา") {
        map[key].presentDays++;
        map[key].totalEarned += Number(row.earned) || 0;
      } else if (ABSENT_STATUSES.includes(row.status)) {
        map[key].absentDays++;
      }
    });

    const result = Object.values(map)
      .map((p) => {
        p.attendanceRate = p.totalDays > 0 ? Math.round((p.presentDays / p.totalDays) * 100) : 0;
        return p;
      })
      .filter((p) => p.totalDays >= 5)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, limit);

    return NextResponse.json({ success: true, topPerformers: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
