import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "@/config/firebase";

// Calculate commission server-side (validated)
export const calculateCommission = onCall(async (request) => {
  const { transactionValue, commissionType, commissionRate, quantity, currency } = request.data as {
    transactionValue: number;
    commissionType: "Percentage of Transaction Value" | "Fixed Fee" | "Fee per Ton";
    commissionRate: number;
    quantity?: number;
    currency: "IDR" | "USD";
  };

  if (transactionValue < 0) {
    throw new HttpsError("invalid-argument", "Nilai transaksi tidak boleh negatif.");
  }
  if (commissionRate < 0) {
    throw new HttpsError("invalid-argument", "Tarif komisi tidak boleh negatif.");
  }

  let estimatedCommission = 0;
  let commissionPercentage: number | null = null;
  let commissionPerUnit: number | null = null;

  switch (commissionType) {
    case "Percentage of Transaction Value":
      commissionPercentage = commissionRate;
      estimatedCommission = transactionValue * (commissionRate / 100);
      break;
    case "Fixed Fee":
      estimatedCommission = commissionRate;
      break;
    case "Fee per Ton": {
      if (!quantity || quantity <= 0) {
        throw new HttpsError("invalid-argument", "Kuantitas wajib diisi untuk Fee per Ton.");
      }
      commissionPerUnit = commissionRate;
      estimatedCommission = commissionRate * quantity;
      break;
    }
  }

  if (quantity && quantity > 0) {
    commissionPerUnit = commissionPerUnit ?? estimatedCommission / quantity;
  }

  return {
    totalTransactionValue: transactionValue,
    commissionPercentage,
    estimatedCommission,
    commissionPerUnit: commissionPerUnit ?? null,
    estimatedTotalCommission: estimatedCommission,
    currency,
  };
});

// Trigger activity log when commission is created
export const onCommissionCreated = onDocumentCreated("commissions/{commissionId}", async (event) => {
  const commission = event.data?.data();
  if (!commission) return;

  await db.collection("activityLogs").add({
    action: "Commission created",
    entity: "Commission",
    entityId: event.params.commissionId,
    description: `Komisi baru dibuat: ${commission.dealName ?? "-"}`,
    userId: commission.userId || "system",
    createdAt: new Date(),
  });
});

// Trigger activity log when commission status changes
export const onCommissionStatusChanged = onDocumentUpdated("commissions/{commissionId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  if (before.commissionStatus !== after.commissionStatus) {
    await db.collection("activityLogs").add({
      action: "Commission status updated",
      entity: "Commission",
      entityId: event.params.commissionId,
      description: `Status komisi berubah dari ${before.commissionStatus} menjadi ${after.commissionStatus}`,
      userId: after.userId || "system",
      createdAt: new Date(),
    });
  }
});
