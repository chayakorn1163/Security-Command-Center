import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("guard_name, employee_id, position")
      .neq("guard_name", "(ว่าง)")
      .order("guard_name");
    if (error) throw new Error(error.message);

    const map = {};
    (rows || []).forEach((row) => {
      const name = (row.guard_name || "").trim();
      if (!name) return;
      const key = `${name}|${row.employee_id || ""}`;
      if (!map[key]) map[key] = { name, id: row.employee_id || "", position: row.position };
    });

    const result = Object.values(map).sort((a, b) => a.name.localeCompare(b.name, "th"));
    return NextResponse.json({ success: true, personnel: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
