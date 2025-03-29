import { timingSafeEqual } from "crypto";

export function safeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(
      Buffer.from(a),
      Buffer.from(b)
    );
  } catch {
    return false;
  }
}