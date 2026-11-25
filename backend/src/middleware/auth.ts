import { onCall, HttpsError } from "firebase-functions/v2/https";
import { auth } from "@/config/firebase";

export const adminAuth = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Tidak terautentikasi.");
  }

  try {
    const userRecord = await auth.getUser(uid);
    const email = (userRecord.email ?? "").toLowerCase();

    const allowedEmails = ["rangga@harsarekaniaga.id", "hafids@harsarekaniaga.id"];
    if (!allowedEmails.includes(email)) {
      throw new HttpsError("permission-denied", "Akses hanya untuk admin yang diizinkan.");
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
