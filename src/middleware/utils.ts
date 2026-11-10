import { getTelegramSession } from "../services/auth.services.js";

export async function ensureOwner(telegramId: number) {
  const session = await getTelegramSession(telegramId);
  return session?.role === "OWNER" && session.status === "ACTIVE";
}

export function formatOptions(title: string, values: string[]) {
  return `${title}:\n\n${values.length ? values.map((value) => `• ${value}`).join("\n") : "هنوز موردی ثبت نشده است."}`;
}
