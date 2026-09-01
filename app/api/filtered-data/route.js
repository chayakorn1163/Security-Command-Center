import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get("site") || "";
    const shift = searchParams.get("shift") || "";
    const dateFrom = searchParams.get("dateFrom") || "2020-01-01";
    const dateTo = searchParams.get("dateTo") || "2100-01-01";

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("shift_entries")
      .select("report_date, site, shift, guard_name, employee_id, status, earned")
      .gte("report_date", dateFrom)
      .lte("report_date", dateTo)
      .order("report_date", { ascending: false })
      .limit(2000);
    if (site) query = query.eq("site", site);
    if (shift) query = query.eq("shift", shift);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const result = (rows || []).map((r) => ({
      date: r.report_date,
      site: r.site,
      shift: r.shift,
      name: r.guard_name || "(ว่าง)",
      id: r.employee_id || "",
      status: r.status,
      earned: Number(r.earned) || 0,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
