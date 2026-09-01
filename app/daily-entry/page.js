"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE_CONFIG, SITE_LABELS } from "@/lib/constants";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DailyEntryPage() {
  const [personnelDb, setPersonnelDb] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [shift, setShift] = useState("กลางวัน");
  const [site, setSite] = useState("");
  const [roster, setRoster] = useState([]); // [{position, name, id}]
  const [suggestFor, setSuggestFor] = useState(null); // index of row showing suggestions
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [meetingTopics, setMeetingTopics] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [sigFile, setSigFile] = useState(null);
  const [meetFiles, setMeetFiles] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState(null); // {ok, text}

  useEffect(() => {
    fetch("/api/personnel-search")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPersonnelDb(res.personnel || []);
      })
      .catch(() => {});
  }, []);

  function onSiteChange(s) {
    setSite(s);
    if (s && SITE_CONFIG[s]) {
      setRoster(SITE_CONFIG[s].map((position) => ({ position, name: "", id: "" })));
    } else {
      setRoster([]);
    }
  }

  function updateRosterName(idx, name) {
    setRoster((prev) => prev.map((r, i) => (i === idx ? { ...r, name } : r)));
  }

  function selectPersonnel(idx, p) {
    setRoster((prev) => prev.map((r, i) => (i === idx ? { ...r, name: p.name, id: p.id } : r)));
    setSuggestFor(null);
  }

  const suggestions = useMemo(() => {
    if (suggestFor === null) return [];
    const q = (roster[suggestFor]?.name || "").trim().toLowerCase();
    if (!q) return [];
    return personnelDb
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, 10);
  }, [suggestFor, roster, personnelDb]);

  const duplicateIds = useMemo(() => {
    const seen = new Set();
    const dups = [];
    roster.forEach((r) => {
      if (r.id) {
        if (seen.has(r.id)) dups.push(r);
        seen.add(r.id);
      }
    });
    return dups;
  }, [roster]);

  function validate() {
    const errors = [];
    if (!date) errors.push("กรุณาเลือกวันที่");
    if (!shift) errors.push("กรุณาเลือกกะการทำงาน");
    if (!site) errors.push("กรุณาเลือกหน่วยงาน");
    if (!reporterName.trim()) errors.push("กรุณากรอกชื่อผู้รายงาน");
    if (!roster.some((r) => r.name.trim())) errors.push("กรุณากรอกชื่อพนักงานอย่างน้อย 1 คน");
    return errors;
  }

  function openConfirm(e) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      setResultMsg({ ok: false, text: errors.join(" / ") });
      return;
    }
    if (duplicateIds.length) {
      setResultMsg({ ok: false, text: "พบรหัสพนักงานซ้ำ กรุณาตรวจสอบ" });
      return;
    }
    setResultMsg(null);
    setShowConfirm(true);
  }

  async function submitReport() {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const signatureImg = sigFile ? await fileToBase64(sigFile) : null;
      const meetingImgs = [];
      for (const f of meetFiles.slice(0, 3)) meetingImgs.push(await fileToBase64(f));

      const payload = {
        date,
        shift,
        site,
        meetingTopics,
        externalLink,
        reporterName,
        reporterPhone,
        roster,
        signatureImg,
        meetingImgs,
      };

      const res = await fetch("/api/shift-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResultMsg({ ok: data.success, text: data.message });
      if (data.success) {
        setRoster([]);
        setSite("");
        setReporterName("");
        setReporterPhone("");
        setMeetingTopics("");
        setExternalLink("");
        setSigFile(null);
        setMeetFiles([]);
        setDate(todayStr());
      }
    } catch (err) {
      setResultMsg({ ok: false, text: "การเชื่อมต่อล้มเหลว: " + err.toString() });
    } finally {
      setSubmitting(false);
    }
  }

  const totalPeople = roster.filter((r) => r.name.trim()).length;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <nav
        className="px-6 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-md"
        style={{ background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" }}
      >
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
          <i className="fa-solid fa-shield-halved text-white"></i>
        </div>
        <div>
          <div className="text-white font-bold text-sm">CJ logistics</div>
          <div className="text-white/65 text-[10px] uppercase tracking-widest">Security Command</div>
        </div>
        <a href="/dashboard" className="ml-auto text-white/80 hover:text-white text-sm flex items-center gap-1">
          <i className="fa-solid fa-arrow-left"></i> กลับแดชบอร์ด
        </a>
      </nav>

      <div className="bg-white border-b border-gray-100 py-5">
        <div className="container mx-auto px-4">
          <h4 className="font-bold text-[#1e3c72] flex items-center gap-2">
            <i className="fa-solid fa-clipboard-user text-[#1e3c72]"></i> ลงทะเบียนกำลังพล รปภ. ประจำวัน
          </h4>
          <p className="text-gray-500 text-sm mt-1">Daily Security Personnel Registration — Command Center</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-4 mb-10 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
          <form onSubmit={openConfirm}>
            <div className="text-sm font-semibold text-gray-700 border-b-2 border-gray-100 pb-2 mb-4">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1e3c72] text-white text-xs mr-2">1</span>
              ข้อมูลทั่วไป
            </div>
            <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">วันที่ปฏิบัติงาน</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">ผลัด (กะ)</label>
                <select value={shift} onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none">
                  <option value="กลางวัน">☀️ กลางวัน</option>
                  <option value="กลางคืน">🌙 กลางคืน</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">เลือกหน่วยงาน</label>
                <select value={site} onChange={(e) => onSiteChange(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-blue-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-200 outline-none">
                  <option value="" disabled>-- กรุณาเลือกคลังสินค้า --</option>
                  {Object.keys(SITE_CONFIG).map((s) => (
                    <option key={s} value={s}>คลังสินค้า {s === "MKD2" ? "WFDC" : s}</option>
                  ))}
                </select>
              </div>
            </div>

            {roster.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-sm">{SITE_LABELS[site]} ({site})</span>
                  <span className="bg-sky-100 text-sky-700 text-sm font-bold px-4 py-1 rounded-full">
                    ยอดเป้าหมาย: {roster.length} นาย
                  </span>
                </div>

                {duplicateIds.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg px-3 py-2 mb-3">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                    พบรหัสพนักงานซ้ำ: {duplicateIds.map((d) => d.name).join(", ")}
                  </div>
                )}

                <div className="border border-gray-100 rounded-xl overflow-hidden mb-6 max-h-[480px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-gray-500 text-xs uppercase">
                        <th className="p-3 w-10">#</th>
                        <th className="p-3 text-left">ตำแหน่ง / จุดประจำการ</th>
                        <th className="p-3 text-left">ชื่อ - นามสกุล</th>
                        <th className="p-3 text-left w-32">รหัสพนักงาน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((r, idx) => (
                        <tr key={idx} className="border-t border-gray-50">
                          <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-gray-700">{r.position}</td>
                          <td className="p-3 relative">
                            <input
                              type="text"
                              value={r.name}
                              onChange={(e) => updateRosterName(idx, e.target.value)}
                              onFocus={() => setSuggestFor(idx)}
                              onBlur={() => setTimeout(() => setSuggestFor(null), 150)}
                              placeholder="ค้นหาชื่อ/รหัส..."
                              className="w-full px-2 py-1.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-300 rounded-md outline-none"
                            />
                            {suggestFor === idx && suggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                                {suggestions.map((p, si) => (
                                  <div key={si} onMouseDown={() => selectPersonnel(idx, p)}
                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                                    <div className="font-semibold text-blue-700 text-sm">{p.name}</div>
                                    <div className="text-xs text-gray-400">รหัส: {p.id} · {p.position}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <input type="text" readOnly value={r.id} placeholder="รหัส"
                              className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-md text-center text-gray-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-sm font-semibold text-gray-700 border-b-2 border-gray-100 pb-2 mb-4">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1e3c72] text-white text-xs mr-2">2</span>
                  ข้อมูลเพิ่มเติมและผู้รายงาน
                </div>

                <div className="grid md:grid-cols-2 gap-4 bg-white border border-gray-100 p-4 rounded-xl mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1.5">เอกสารลงชื่อ (1 ภาพ)</label>
                    <input type="file" accept="image/*" onChange={(e) => setSigFile(e.target.files[0] || null)}
                      className="w-full text-sm" />
                    {sigFile && <p className="text-xs text-gray-400 mt-1">{sigFile.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1.5">ภาพการประชุม (ไม่เกิน 3 ภาพ)</label>
                    <input type="file" accept="image/*" multiple
                      onChange={(e) => setMeetFiles(Array.from(e.target.files).slice(0, 3))}
                      className="w-full text-sm" />
                    {meetFiles.length > 0 && <p className="text-xs text-gray-400 mt-1">{meetFiles.length} ไฟล์ที่เลือก</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">ลิงก์แนบเพิ่มเติม (ถ้ามี)</label>
                  <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">หัวข้อประชุม (ถ้ามี)</label>
                  <textarea rows={3} value={meetingTopics} onChange={(e) => setMeetingTopics(e.target.value)}
                    placeholder="1. การแต่งกาย...&#10;2. การตรวจค้น..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">ผู้รายงาน (หัวหน้าชุด)</label>
                    <input type="text" required value={reporterName} onChange={(e) => setReporterName(e.target.value)}
                      placeholder="เช่น สุภาวดี บุญกลาง"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                    <input type="tel" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="เช่น 064-1519-xxx"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg outline-none" />
                  </div>
                </div>

                {resultMsg && (
                  <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${resultMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {resultMsg.text}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-gray-100 pt-5">
                  <button type="button" onClick={() => onSiteChange(site)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    <i className="fa-solid fa-rotate-left mr-2"></i>รีเซ็ตรายชื่อ
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2.5 bg-[#1e3c72] hover:bg-[#2a5298] disabled:opacity-60 text-white font-bold rounded-lg shadow-md">
                    <i className={`fa-solid ${submitting ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"} mr-2`}></i>
                    บันทึกและส่งรายงาน
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h5 className="font-bold text-[#1e3c72] flex items-center gap-2">
                <i className="fa-solid fa-circle-check"></i> ยืนยันการบันทึกข้อมูล
              </h5>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-50 py-2"><span className="font-semibold text-gray-600">📅 วันที่</span><span>{date}</span></div>
              <div className="flex justify-between border-b border-gray-50 py-2"><span className="font-semibold text-gray-600">🌙 กะ</span><span>{shift}</span></div>
              <div className="flex justify-between border-b border-gray-50 py-2"><span className="font-semibold text-gray-600">🏢 หน่วยงาน</span><span>{site}</span></div>
              <div className="flex justify-between border-b border-gray-50 py-2"><span className="font-semibold text-gray-600">👤 ผู้รายงาน</span><span>{reporterName}</span></div>
              <div className="flex justify-between border-b border-gray-50 py-2"><span className="font-semibold text-gray-600">👥 จำนวนคนมา</span><span className="font-bold text-emerald-600">{totalPeople} คน</span></div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={submitReport} className="px-4 py-2 bg-[#1e3c72] text-white rounded-lg font-bold hover:bg-[#2a5298]">ยืนยันและบันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
