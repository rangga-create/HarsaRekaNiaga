import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "@/config/firebase";

export const addActivityLog = onCall(async (request) => {
  const { action, entity, entityId, description, userId } = request.data as {
    action: string;
    entity: string;
    entityId: string;
    description: string;
    userId?: string;
  };

  if (!action || !entity || !description) {
    throw new HttpsError("invalid-argument", "Action, entity, dan description wajib diisi.");
  }

  const docRef = await db.collection("activityLogs").add({
    action,
    entity,
    entityId,
    description,
    userId: userId || "system",
    createdAt: new Date(),
  });

  return {
    success: true,
    id: docRef.id,
  };
});
