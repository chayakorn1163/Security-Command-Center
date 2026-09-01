import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPassword, signSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, message: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash, role, display_name")
      .eq("username", String(username).trim())
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง!" });
    }

    const ok = await verifyPassword(String(password).trim(), user.password_hash);
    if (!ok) {
      return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง!" });
    }

    const token = await signSession({ uid: user.id, username: user.username, role: user.role });
    const res = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      role: user.role,
      displayName: user.display_name,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, message: err.toString() });
  }
}
