import { onCall, HttpsError } from "firebase-functions/v2/https";
import { auth } from "@/config/firebase";

// Whitelist of allowed admin emails
const ALLOWED_EMAILS = ["rangga@harsarekaniaga.id", "hafids@harsarekaniaga.id"];

export const login = onCall(async (request) => {
  const { email, password } = request.data as { email: string; password: string };

  if (!email || !password) {
    throw new HttpsError("invalid-argument", "Email dan password wajib diisi.");
  }

  // Check if email is in whitelist
  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
    throw new HttpsError("permission-denied", "Akses hanya untuk Rangga dan Hafids.");
  }

  try {
    // Verify user exists in Firebase Auth
    const userRecord = await auth.getUserByEmail(email);

    // Create custom token for client-side sign-in
    // In production, client signs in with email/password via Firebase Auth SDK
    // This function validates the user is allowed
    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      role: "admin",
      message: "Login berhasil",
    };
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "User tidak ditemukan.");
    }
    throw new HttpsError("internal", "Terjadi kesalahan saat login.");
  }
});

export const verifyAdmin = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Tidak terautentikasi.");
  }

  try {
    const userRecord = await auth.getUser(uid);
    const email = userRecord.email?.toLowerCase() ?? "";

    if (!ALLOWED_EMAILS.includes(email)) {
      throw new HttpsError("permission-denied", "Bukan admin yang diizinkan.");
    }

    return {
      success: true,
      uid,
      email,
      role: "admin",
    };
  } catch (error: any) {
    throw new HttpsError("internal", "Gagal verifikasi admin.");
  }
});
