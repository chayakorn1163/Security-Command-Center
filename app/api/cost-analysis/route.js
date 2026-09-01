import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SITE_NAMES, ABSENT_STATUSES } from "@/lib/constants";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "yyyy-MM"
    if (!month) return NextResponse.json({ success: false, message: "กรุณาระบุเดือน" });

    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const endDate = new Date(y, m, 0); // last day of month
    const end = endDate.toISOString().slice(0, 10);

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("shift_entries")
      .select("site, status, earned, rate, pos_type, shift")
      .gte("report_date", start)
      .lte("report_date", end);
    if (error) throw new Error(error.message);

    const costData = {
      totalBillable: 0,
      totalDeduct: 0,
      netBillable: 0,
      bySite: {},
      byPosition: { หัวหน้าชุด: 0, "Security Guard": 0 },
      byShift: { กลางวัน: 0, กลางคืน: 0 },
    };
    SITE_NAMES.filter((s) => s !== "Agriworld").forEach((s) => {
      costData.bySite[s] = { billable: 0, deduct: 0, present: 0, absent: 0 };
    });

    (rows || []).forEach((row) => {
      if (!costData.bySite[row.site]) return;
      const billable = Number(row.earned) || 0;
      const isAbsent = ABSENT_STATUSES.includes(row.status);
      const deduct = isAbsent ? (row.status === "ทิ้งจุด" ? 500 : Number(row.rate) || 0) : 0;

      costData.totalBillable += billable;
      costData.totalDeduct += deduct;
      costData.bySite[row.site].billable += billable;
      costData.bySite[row.site].deduct += deduct;

      if (row.status === "มา") {
        costData.bySite[row.site].present++;
        costData.byPosition[row.pos_type] = (costData.byPosition[row.pos_type] || 0) + billable;
        costData.byShift[row.shift] = (costData.byShift[row.shift] || 0) + billable;
      } else if (isAbsent) {
        costData.bySite[row.site].absent++;
      }
    });

    costData.netBillable = costData.totalBillable - costData.totalDeduct;
    return NextResponse.json({ success: true, cost: costData });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
