import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { Incoterm } from "@/types/incoterm";

const INCOTERMS: Incoterm[] = ["EXW", "FCA", "FOB", "CFR", "CIF"];

function moneyForIncoterm(
  incoterm: Incoterm,
  costs: {
    productCost: number;
    packagingCost: number;
    inlandTransportation: number;
    exportHandling: number;
    freightCost: number;
    insurance: number;
    documentationCost: number;
    otherCosts: number;
  }
): { sellerPaid: number; buyerPaid: { label: string; amount: number }[]; includedCostSummary: string } {
  const { productCost, packagingCost, inlandTransportation, exportHandling, freightCost, insurance, documentationCost, otherCosts } = costs;

  if (incoterm === "EXW") {
    return {
      sellerPaid: productCost + packagingCost + exportHandling,
      buyerPaid: [
        { label: "Inland transportation to port", amount: inlandTransportation },
        { label: "Freight", amount: freightCost },
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "EXW: costs included up to goods at seller's premises.",
    };
  }
  if (incoterm === "FCA") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling,
      buyerPaid: [
        { label: "Main carriage / freight", amount: freightCost },
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "FCA: seller pays to deliver goods to the named carrier.",
    };
  }
  if (incoterm === "FOB") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling,
      buyerPaid: [
        { label: "Ocean freight", amount: freightCost },
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "FOB: seller pays inland transport and export handling to load goods on board.",
    };
  }
  if (incoterm === "CFR") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling + freightCost,
      buyerPaid: [
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "CFR: seller pays costs and freight to the destination port.",
    };
  }
  if (incoterm === "CIF") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling + freightCost + insurance,
      buyerPaid: [
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "CIF: seller pays costs, freight, and insurance to the destination port.",
    };
  }

  return {
    sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling,
    buyerPaid: [],
    includedCostSummary: "",
  };
}

export const calculateExportCost = onCall(async (request) => {
  const {
    productCost,
    quantity,
    packagingCost,
    inlandTransportation,
    exportHandling,
    freightCost,
    insurance,
    documentationCost,
    otherCosts,
    desiredProfitMargin,
    incoterm,
    currency,
    exchangeRate,
  } = request.data as {
    productCost: number;
    quantity: number;
    packagingCost: number;
    inlandTransportation: number;
    exportHandling: number;
    freightCost: number;
    insurance: number;
    documentationCost: number;
    otherCosts: number;
    desiredProfitMargin: number;
    incoterm: Incoterm;
    currency: "IDR" | "USD";
    exchangeRate: number;
  };

  if (!INCOTERMS.includes(incoterm)) {
    throw new HttpsError("invalid-argument", "Incoterm tidak valid.");
  }
  if (quantity <= 0) {
    throw new HttpsError("invalid-argument", "Kuantitas harus lebih dari nol.");
  }
  if (desiredProfitMargin < 0 || desiredProfitMargin > 100) {
    throw new HttpsError("invalid-argument", "Margin keuntungan harus antara 0% dan 100%.");
  }

  const costs = {
    productCost,
    packagingCost,
    inlandTransportation,
    exportHandling,
    freightCost,
    insurance,
    documentationCost,
    otherCosts,
  };

  const { sellerPaid, buyerPaid, includedCostSummary } = moneyForIncoterm(incoterm, costs);

  const totalEstimatedCost = sellerPaid;
  const costPerUnit = totalEstimatedCost / quantity;
  const estimatedSellingPrice = costPerUnit * (1 + desiredProfitMargin / 100);
  const estimatedGrossProfit = estimatedSellingPrice - costPerUnit;
  const grossMargin = desiredProfitMargin;

  return {
    totalEstimatedCost,
    costPerUnit,
    estimatedSellingPrice,
    estimatedGrossProfit,
    grossMargin,
    estimatedProfitPerUnit: estimatedGrossProfit,
    buyerPaidCosts: buyerPaid,
    sellerPaidCosts: [
      ...(incoterm === "EXW" || incoterm === "FCA" || incoterm === "FOB"
        ? [{ label: "Product cost", amount: productCost }, { label: "Packaging cost", amount: packagingCost }, { label: "Inland transportation", amount: inlandTransportation }, { label: "Export handling", amount: exportHandling }]
        : incoterm === "CFR"
        ? [{ label: "Product cost", amount: productCost }, { label: "Packaging cost", amount: packagingCost }, { label: "Inland transportation", amount: inlandTransportation }, { label: "Export handling", amount: exportHandling }, { label: "Freight", amount: freightCost }]
        : [{ label: "Product cost", amount: productCost }, { label: "Packaging cost", amount: packagingCost }, { label: "Inland transportation", amount: inlandTransportation }, { label: "Export handling", amount: exportHandling }, { label: "Freight", amount: freightCost }, { label: "Insurance", amount: insurance }]
      ),
    ],
    includedCostSummary,
    currency,
    exchangeRate,
  };
});
