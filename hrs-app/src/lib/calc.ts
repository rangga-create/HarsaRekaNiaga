import type { Incoterm } from "@/lib/data";

export type CommissionCalcInput = {
  supplierTransactionValue: number;
  commissionType: "Percentage of Transaction Value" | "Fixed Fee" | "Fee per Ton";
  commissionRate: number;
  quantity?: number;
  currency: "IDR" | "USD";
};

export type CommissionCalcResult = {
  totalTransactionValue: number;
  commissionPercentage: number | null;
  estimatedCommission: number;
  commissionPerUnit: number | null;
  estimatedTotalCommission: number;
};

export type TraderCalcInput = {
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

export type TraderCalcResult = {
  totalEstimatedCost: number;
  costPerUnit: number;
  estimatedSellingPrice: number;
  estimatedGrossProfit: number;
  grossMargin: number;
  estimatedProfitPerUnit: number;
  exwCost: number;
  buyerPaidCosts: {
    label: string;
    amount: number;
  }[];
  sellerPaidCosts: {
    label: string;
    amount: number;
  }[];
  includedCostSummary: string;
};

export function calcCommission(input: CommissionCalcInput): CommissionCalcResult {
  const { supplierTransactionValue, commissionType, commissionRate, quantity, currency } = input;

  if (supplierTransactionValue < 0) {
    throw new Error("Transaction value cannot be negative.");
  }
  if (commissionRate < 0) {
    throw new Error("Commission rate cannot be negative.");
  }

  let estimatedCommission = 0;
  let commissionPercentage: number | null = null;
  let commissionPerUnit: number | null = null;

  switch (commissionType) {
    case "Percentage of Transaction Value":
      commissionPercentage = commissionRate;
      estimatedCommission = supplierTransactionValue * (commissionRate / 100);
      break;
    case "Fixed Fee":
      estimatedCommission = commissionRate;
      break;
    case "Fee per Ton": {
      if (!quantity || quantity <= 0) {
        throw new Error("Quantity is required for Fee per Ton mode.");
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
    totalTransactionValue: supplierTransactionValue,
    commissionPercentage,
    estimatedCommission,
    commissionPerUnit: commissionPerUnit ?? null,
    estimatedTotalCommission: estimatedCommission,
  };
}

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

  // EXW — Ex Works: seller makes goods available at premises. Buyer bears all costs from there.
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
      includedCostSummary: "EXW: costs included up to goods at seller's premises — inland transport, freight, insurance, documentation, and other costs are borne by the buyer.",
    };
  }

  // FCA — Free Carrier: seller delivers to carrier, bears costs up to that point.
  if (incoterm === "FCA") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling,
      buyerPaid: [
        { label: "Main carriage / freight", amount: freightCost },
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "FCA: seller pays to deliver goods to the named carrier, including inland transport. Freight, insurance, documentation, and other costs are borne by the buyer.",
    };
  }

  // FOB — Free On Board: seller delivers goods on board the vessel.
  if (incoterm === "FOB") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling,
      buyerPaid: [
        { label: "Ocean freight", amount: freightCost },
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "FOB: seller pays inland transport and export handling to load goods on board the vessel. Ocean freight, insurance, documentation, and other costs are borne by the buyer.",
    };
  }

  // CFR — Cost and Freight: seller pays freight to destination port.
  if (incoterm === "CFR") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling + freightCost,
      buyerPaid: [
        { label: "Insurance", amount: insurance },
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "CFR: seller pays costs and freight to the destination port. Insurance, documentation, and other costs are borne by the buyer.",
    };
  }

  // CIF — Cost, Insurance, and Freight: seller pays freight and insurance to destination port.
  if (incoterm === "CIF") {
    return {
      sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling + freightCost + insurance,
      buyerPaid: [
        { label: "Documentation", amount: documentationCost },
        { label: "Other costs", amount: otherCosts },
      ],
      includedCostSummary: "CIF: seller pays costs, freight, and insurance to the destination port. Documentation and other costs are borne by the buyer.",
    };
  }

  return {
    sellerPaid: productCost + packagingCost + inlandTransportation + exportHandling,
    buyerPaid: [],
    includedCostSummary: "",
  };
}

export function calcTrader(input: TraderCalcInput): TraderCalcResult {
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
  } = input;

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }
  if (productCost < 0 || packagingCost < 0 || inlandTransportation < 0 || exportHandling < 0 || freightCost < 0 || insurance < 0 || documentationCost < 0 || otherCosts < 0) {
    throw new Error("Cost inputs cannot be negative.");
  }
  if (desiredProfitMargin < 0 || desiredProfitMargin > 100) {
    throw new Error("Profit margin must be between 0% and 100%.");
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

  // All cost components together represent the total estimated cost to bring the goods to export-ready status.
  const totalAllCosts = Object.values(costs).reduce((a, b) => a + (b || 0), 0);
  const totalEstimatedCost = sellerPaid;

  const costPerUnit = totalEstimatedCost / quantity;
  // Selling price target includes desired profit margin applied to the seller's cost basis.
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
    exwCost: productCost + packagingCost + inlandTransportation + exportHandling,
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
  };
}

export function formatExchangeRate(rate: number): string {
  return `1 USD = ${rate.toLocaleString("id-ID", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} IDR`;
}
