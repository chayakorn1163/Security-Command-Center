export const SITE_NAMES = ["CDC", "MKF", "MKD2", "MKD3", "Agriworld"];

export const SITE_LABELS = {
  CDC: "แม็คโคร ซีดีซี วังน้อย",
  MKF: "คลังสินค้า MKF",
  MKD2: "คลังสินค้า MKD2",
  MKD3: "คลังสินค้า MKD3",
  Agriworld: "คลังสินค้า Agriworld",
};

export const SITE_TARGETS = { CDC: 16, MKF: 6, MKD2: 1, MKD3: 1 };

export const LEADER_KEYWORDS = ["หัวหน้า", "commander", "supervisor"];

export const ABSENT_STATUSES = ["ขาด", "ขาดจุด", "ทิ้งจุด", "ลาป่วย", "ลากิจ"];

export const SITE_CONFIG = {
  CDC: [
    "ตำแหน่ง หัวหน้าชุด1", "ตำแหน่ง หัวหน้าชุด Dry", "จุดคอนโทรลรูม 1", "จุดคอนโทรลรูม 2", "จุดคอนโทรลรูม 3",
    "จุดจราจรขาออก 1", "จุดจราจรขาออก 2", "จุดจราจรขาออก 3", "จุดคัดกรอง แคนทีน", "จุดคัดกรอง FV",
    "จุดคัดกรอง SF", "จุดคัดกรอง Dry 1", "จุดคัดกรอง Dry 2", "จุดคัดกรอง CFC 1", "จุดคัดกรอง CFC 2",
    "จุดคัดกรอง Frozen",
  ],
  MKF: ["ตำแหน่ง : หัวหน้าชุด", "ป้อมหน้าขาออก 1", "ป้อมหน้าขาออก 2", "ป้อมเล็ก(จยย)", "จุดตรวจค้นพนักงาน"],
  MKD2: ["ป้อมหน้าขาออก", "ป้อมหน้าขาเข้า", "จุดคัดกรอง"],
  MKD3: ["ป้อมหน้าขาออก"],
  Agriworld: ["จราจร ขาออก"],
};

// Same classification rule as _classifyPosition() in Code.gs
export function classifyPosition(posName) {
  const name = String(posName || "").toLowerCase();
  for (const kw of LEADER_KEYWORDS) {
    if (name.indexOf(kw.toLowerCase()) !== -1) return "หัวหน้าชุด";
  }
  return "Security Guard";
}
