import { NextResponse } from "next/server";
import { createHash } from "crypto";



type Body = { publicId?: string; resourceType?: "image" | "video" | "raw" };

async function verifyFirebaseToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY belum dikonfigurasi.");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { users?: Array<{ localId?: string }> } | null;
  return data?.users?.[0]?.localId ?? null;
}

function sign(params: Record<string, string>, secret: string) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(sorted + secret).digest("hex");
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const idToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!idToken) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const uid = await verifyFirebaseToken(idToken);
    if (!uid) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null) as Body | null;
    const publicId = body?.publicId?.trim();
    const resourceType = body?.resourceType === "video" || body?.resourceType === "raw" ? body.resourceType : "image";
    if (!publicId) return NextResponse.json({ ok: false, error: "publicId wajib." }, { status: 400 });

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ ok: false, error: "Cloudinary server env belum lengkap." }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign({ public_id: publicId, timestamp }, apiSecret);
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: "POST", body: form });
    const data = await res.json().catch(() => null) as { result?: string; error?: { message?: string } } | null;
    if (!res.ok) return NextResponse.json({ ok: false, error: data?.error?.message || "Gagal hapus Cloudinary." }, { status: 502 });
    if (data?.result === "ok" || data?.result === "not found") return NextResponse.json({ ok: true, result: data.result });
    return NextResponse.json({ ok: false, error: data?.result || "Gagal hapus Cloudinary." }, { status: 502 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
