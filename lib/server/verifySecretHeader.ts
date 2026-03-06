
import crypto from "crypto";
import { NextRequest } from "next/server";

export function verifySecretHeader(req: NextRequest) {
  const header = req.headers.get('x-internal-api-key') ?? '';
  const secret = process.env.PRIVATE_INTERNAL_API_KEY ?? '';

  if (!header || !secret) return false;

  // constant-time compare by hashing both values to fixed-length buffers
  const h1 = crypto.createHash('sha256').update(header).digest();
  const h2 = crypto.createHash('sha256').update(secret).digest();
  return crypto.timingSafeEqual(h1, h2);
}