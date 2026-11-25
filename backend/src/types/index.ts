export type Incoterm = "EXW" | "FCA" | "FOB" | "CFR" | "CIF";

export type CommissionType = "Percentage of Transaction Value" | "Fixed Fee" | "Fee per Ton";
export type CommissionStatus = "Potential" | "Agreed" | "Earned" | "Payable" | "Paid" | "Cancelled";

export interface User {
  uid: string;
  email: string;
  name: string;
  role: "admin";
  createdAt: any;
}

export interface Supplier {
  id: string;
  companyName: string;
  country: string;
  contact: string;
  createdAt: any;
}

export interface Buyer {
  id: string;
  companyName: string;
  country: string;
  contact: string;
  createdAt: any;
}

export interface Product {
  id: string;
  productName: string;
  productCategory: string;
  price: number;
  createdAt: any;
}

export interface Deal {
  id: string;
  buyerId: string;
  supplierId: string;
  productId: string | null;
  transactionValue: number;
  status: string;
  createdAt: any;
}

export interface Commission {
  id: string;
  dealId: string;
  dealName: string;
  buyerId: string;
  supplierId: string;
  productId: string | null;
  transactionValue: number;
  commissionType: CommissionType;
  commissionRate: number;
  commissionAmount: number;
  payer: string;
  expectedPaymentDate: string;
  actualPaymentDate: string | null;
  commissionStatus: CommissionStatus;
  internalNotes: string;
  currency: "IDR" | "USD";
  userId: string;
  createdAt: any;
}

export interface CalculatorScenario {
  id: string;
  name: string;
  mode: "Commission" | "Trader";
  payload: any;
  userId: string;
  createdAt: any;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  userId: string;
  createdAt: any;
}

export interface CommissionDistribution {
  partnerAShare: number;
  partnerBShare: number;
  operationalReserve: number;
}
