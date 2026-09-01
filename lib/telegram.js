const GROUP_IDS = {
  CDC: process.env.TELEGRAM_GROUP_CDC,
  MKF: process.env.TELEGRAM_GROUP_MKF,
  MKD2: process.env.TELEGRAM_GROUP_MKD2,
  MKD3: process.env.TELEGRAM_GROUP_MKD3,
};

export async function sendTelegramMessage(payload, totalPresent, totalAbsent) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = GROUP_IDS[payload.site];
  if (!token || !chatId) return;

  let rosterText = "👤 <b>รายชื่อผู้ปฏิบัติงาน:</b>\n";
  let absentText = "\n🔴 <b>จุดที่ขาดงาน:</b>\n";
  let hasAbsent = false;

  (payload.roster || []).forEach((item) => {
    if (item.name && item.name.trim() !== "") {
      rosterText += `🔹 ${item.position}: <b>${item.name}</b>\n`;
    } else {
      absentText += `❌ ${item.position}\n`;
      hasAbsent = true;
    }
  });

  let message = `📋 <b>Security Report:</b> <code>${payload.site}</code>\n`;
  message += `🗓 วันที่: ${payload.date} | 🌙 กะ: ${payload.shift}\n`;
  message += `➖➖➖➖➖➖➖➖➖➖\n`;
  message += `✅ มา: <b>${totalPresent}</b> | ❌ ขาด: <b>${totalAbsent}</b>\n`;
  message += `➖➖➖➖➖➖➖➖➖➖\n${rosterText}`;
  if (hasAbsent) message += absentText;
  message += `➖➖➖➖➖➖➖➖➖➖\n`;
  message += `💬 <b>หัวข้อประชุม:</b>\n${payload.meetingTopics || "-"}\n`;
  if (payload.externalLink) message += `\n🔗 <a href="${payload.externalLink}">ลิงก์แนบเพิ่มเติม</a>\n`;
  message += `➖➖➖➖➖➖➖➖➖➖\n`;
  message += `✍️ <b>ผู้รายงาน:</b> ${payload.reporterName}\n📞 <b>โทร:</b> ${payload.reporterPhone || "-"}`;

  const botUrl = `https://api.telegram.org/bot${token}/`;

  // If there are uploaded images, send the signature as the lead photo with the caption;
  // Drive URLs are public (anyone-with-link) so Telegram can fetch them directly.
  if (payload.sigUrl) {
    await fetch(botUrl + "sendPhoto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: payload.sigUrl, caption: message, parse_mode: "HTML" }),
    });
  } else {
    await fetch(botUrl + "sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
  }
}
