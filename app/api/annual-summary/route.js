import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("site, earned, report_date")
      .gte("report_date", `${year}-01-01`)
      .lte("report_date", `${year}-12-31`);
    if (error) throw new Error(error.message);

    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const buckets = Array.from({ length: 12 }, (_, i) => ({ month: months[i], CDC: 0, MKF: 0, MKD2: 0, MKD3: 0, total: 0 }));

    (rows || []).forEach((row) => {
      const monthIdx = Number(row.report_date.slice(5, 7)) - 1;
      const bucket = buckets[monthIdx];
      if (!bucket || !(row.site in bucket)) return;
      const bill = Number(row.earned) || 0;
      bucket[row.site] += bill;
      bucket.total += bill;
    });

    const total = buckets.reduce((sum, b) => sum + b.total, 0);
    return NextResponse.json({ success: true, year, data: buckets, total });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
