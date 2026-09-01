import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Missing Google service account env vars (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)."
    );
  }
  const auth = new google.auth.JWT(email, null, key, ["https://www.googleapis.com/auth/drive"]);
  return google.drive({ version: "v3", auth });
}

async function findOrCreateFolder(drive, parentId, folderName) {
  const q = `'${parentId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({ q, fields: "files(id, name)" });
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return created.data.id;
}

// fileObj = { name: "photo.jpg", data: "data:image/jpeg;base64,...." }
export async function uploadImageToDrive(fileObj, folderName, prefix) {
  if (!fileObj || !fileObj.data) return "";
  const drive = getDriveClient();
  const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  const folderId = await findOrCreateFolder(drive, parentId, folderName);

  const match = fileObj.data.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error("Invalid base64 image payload");
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");

  const created = await drive.files.create({
    requestBody: { name: `${prefix}_${fileObj.name}`, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });

  await drive.permissions.create({
    fileId: created.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return `https://drive.google.com/uc?export=view&id=${created.data.id}`;
}
