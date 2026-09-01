import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("guard_name, employee_id, pos_type, site, shift, earned, status, report_date");
    if (error) throw new Error(error.message);

    const map = {};
    (rows || []).forEach((row) => {
      const name = (row.guard_name || "").trim();
      if (!name || name === "(ว่าง)" || row.pos_type === "ยอดรวม") return;
      if (row.status !== "มา") return;

      const key = `${name}||${row.employee_id || ""}`;
      if (!map[key]) {
        map[key] = { name, id: row.employee_id || "", posType: row.pos_type, site: row.site, dayCount: 0, nightCount: 0, totalEarned: 0, lastSeen: "" };
      }
      const p = map[key];
      if (row.shift === "กลางวัน") p.dayCount++; else p.nightCount++;
      p.totalEarned += Number(row.earned) || 0;
      if (!p.lastSeen || row.report_date > p.lastSeen) p.lastSeen = row.report_date;
    });

    const result = Object.values(map).sort((a, b) => {
      if (a.site !== b.site) return a.site < b.site ? -1 : 1;
      if (a.posType !== b.posType) return a.posType === "หัวหน้าชุด" ? -1 : 1;
      return a.name.localeCompare(b.name, "th");
    });

    return NextResponse.json({ success: true, personnel: result, total: result.length });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
