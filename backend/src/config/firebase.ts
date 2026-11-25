import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    }),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;
