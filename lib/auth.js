import bcrypt from "bcryptjs";

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export { signSession, verifySession, getSessionFromRequest, SESSION_COOKIE } from "./session";

