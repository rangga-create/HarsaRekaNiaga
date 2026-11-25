import { v4 as uuid } from "uuid";

export type SupplierType =
  | "Manufacturer"
  | "Factory"
  | "Distributor"
  | "Trading Company"
  | "Exporter";

export type VerificationStatus =
  | "Unverified"
  | "Under Review"
  | "Verified"
  | "Rejected";

export type PartnershipStatus =
  | "Prospect"
  | "Contacted"
  | "Negotiation"
  | "Partner"
  | "Inactive";

export type BuyerStatus =
  | "New Lead"
  | "Contacted"
  | "Responded"
  | "Qualified"
  | "Negotiation"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export type ProductCategory =
  | "Agricultural Products"
  | "Charcoal and Briquettes"
  | "Food Ingredients"
  | "Industrial Materials"
  | "Other Commodities";

export type AvailabilityStatus =
  | "Available"
  | "Limited"
  | "Discontinued"
  | "Pre-Order";

export type CommissionType =
  | "Percentage of Transaction Value"
  | "Fixed Fee"
  | "Fee per Ton";

export type CommissionStatus =
  | "Potential"
  | "Agreed"
  | "Earned"
  | "Payable"
  | "Paid"
  | "Cancelled";

export type Incoterm = "EXW" | "FCA" | "FOB" | "CFR" | "CIF";

export type DealStatus = "Prospecting" | "Negotiation" | "Closed Won" | "Closed Lost";

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  supplierType: SupplierType;
  productCategories: string[];
  moq: string;
  productionCapacity: string;
  verificationStatus: VerificationStatus;
  partnershipStatus: PartnershipStatus;
  dateAdded: string;
  documents: string[];
  internalNotes: string;
  demo: boolean;
}

export interface Product {
  id: string;
  productName: string;
  productCategory: ProductCategory;
  productDescription: string;
  productImages: string[];
  associatedSupplierId: string;
  originCountry: string;
  moq: string;
  indicativePrice: number;
  currency: "IDR" | "USD";
  packaging: string;
  availabilityStatus: AvailabilityStatus;
  specifications: Record<string, string | number>;
  internalNotes: string;
  demo: boolean;
}

export interface Buyer {
  id: string;
  companyName: string;
  contactPerson: string;
  country: string;
  city: string;
  website: string;
  email: string;
  whatsapp: string;
  interestedProducts: string[];
  estimatedOrderVolume: string;
  leadSource: string;
  buyerStatus: BuyerStatus;
  lastContact: string;
  nextFollowUp: string;
  demo: boolean;
}

export interface BuyerInteraction {
  id: string;
  buyerId: string;
  type: "Call" | "Email" | "WhatsApp" | "Meeting" | "Note";
  note: string;
  createdAt: string;
  demo: boolean;
}

export interface FollowUp {
  id: string;
  buyerId: string;
  note: string;
  scheduledAt: string;
  completedAt: string | null;
  createdBy: string;
  demo: boolean;
}

export interface Deal {
  id: string;
  name: string;
  buyerId: string;
  supplierId: string;
  productId: string | null;
  dealValue: number;
  dealStatus: DealStatus;
  expectedClose: string;
  currency: "IDR" | "USD";
  demo: boolean;
}

export interface CalculatorScenario {
  id: string;
  name: string;
  mode: "Commission" | "Trader";
  payload: Record<string, unknown>;
  createdAt: string;
  demo: boolean;
}

export interface Commission {
  id: string;
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
  demo: boolean;
}

export interface CommissionDistribution {
  id: string;
  partnerAShare: number;
  partnerBShare: number;
  operationalReserve: number;
  updatedAt: string;
  demo: boolean;
}

export type ActivityEntity = "Supplier" | "Buyer" | "Product" | "Commission" | "Calculator" | "Deal" | "Request";

export type RequestStatus = "Open" | "Sourcing" | "Found" | "Matched" | "Closed";
export type FindingStatus = "Submitted" | "Reviewed" | "Matched" | "Rejected";

export interface MediaAttachment {
  id: string;
  url: string;
  path: string; // Cloudinary public_id; legacy Firebase Storage path for old records
  type: "image" | "video" | "document";
  name: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  resourceType?: "image" | "video" | "raw";
  provider?: "cloudinary" | "firebase";
}

export interface BuyerRequest {
  id: string;
  buyerId: string | null;
  buyerName: string;
  title: string;
  quantity: number | null;
  unit: string;
  specs: string;
  requestMedia: MediaAttachment[];
  status: RequestStatus;
  neededBy: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  demo: boolean;
}

export interface RequestFinding {
  id: string;
  requestId: string;
  supplierName: string;
  foundSpecs: string;
  foundMedia: MediaAttachment[];
  price: string;
  availability: string;
  moq: string;
  status: FindingStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
  demo: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: ActivityEntity;
  entityId: string;
  description: string;
  createdAt: string;
  demo: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: "Partner A" | "Partner B" | "Admin";
  email: string;
  avatar: string;
  demo: boolean;
}

// Descriptions for building products
const productDescriptionsMeta: Record<string, {
  category: ProductCategory;
  description: string;
  origin: string;
  moq: string;
  price: number;
  currency: "IDR" | "USD";
  packaging: string;
}> = {
  "Coconut Shell Charcoal Briquettes (35mm)": {
    category: "Charcoal and Briquettes",
    description:
      "High-density coconut shell charcoal briquettes, 35mm diameter, suitable for BBQ and hookah export markets.",
    origin: "Indonesia",
    moq: "500 kg",
    price: 1850000,
    currency: "IDR",
    packaging: "25 kg vacuum-packed bags",
  },
  "Instant Coconut Water Powder": {
    category: "Food Ingredients",
    description:
      "Freeze-dried coconut water powder with consistent sweetness for beverage manufacturers.",
    origin: "Indonesia",
    moq: "100 kg",
    price: 4200000,
    currency: "IDR",
    packaging: "25 kg sealed cartons",
  },
  "Cassava Chips (Industrial Grade)": {
    category: "Agricultural Products",
    description:
      "Industrial-grade cassava chips for starch and animal feed processing.",
    origin: "Indonesia",
    moq: "1 container (approx. 20 tons)",
    price: 980,
    currency: "USD",
    packaging: "50 kg jute bags",
  },
  "Raw Cashew Nuts (W320)": {
    category: "Agricultural Products",
    description:
      "Raw cashew nuts, W320 grade, sorted and dried for export processing.",
    origin: "Indonesia",
    moq: "5 MT",
    price: 2450000,
    currency: "IDR",
    packaging: "10 kg vacuum bags",
  },
  "Bamboo Charcoal Powder": {
    category: "Charcoal and Briquettes",
    description:
      "Fine bamboo charcoal powder for filtration and cosmetic applications.",
    origin: "Indonesia",
    moq: "200 kg",
    price: 3100000,
    currency: "IDR",
    packaging: "25 kg moisture-proof bags",
  },
};

// Specifications per product
const productSpecs: Record<string, Record<string, string | number>> = {
  "Coconut Shell Charcoal Briquettes (35mm)": {
    RawMaterial: "Coconut shell",
    Shape: "Round briquette",
    Size: "35mm diameter x 18mm height",
    MoistureContent: "8%",
    AshContent: "3%",
    FixedCarbon: "82%",
    VolatileMatter: "9%",
    CalorificValue: "7200 kcal/kg",
    BurningTime: "3.5 hours",
    Packaging: "25 kg vacuum-packed bags",
  },
  "Instant Coconut Water Powder": {
    ProductType: "Freeze-dried powder",
    MoistureContent: "3%",
    Grade: "Food-grade",
    Size: "Fine powder",
    Packaging: "25 kg sealed cartons",
    Origin: "Indonesia",
  },
  "Cassava Chips (Industrial Grade)": {
    ProductType: "Sun-dried cassava chips",
    MoistureContent: "12% max",
    Grade: "Industrial",
    Size: "Chips 10-25mm",
    Packaging: "50 kg jute bags",
    Origin: "Indonesia",
  },
  "Raw Cashew Nuts (W320)": {
    ProductType: "Raw cashew nuts",
    MoistureContent: "9% max",
    Grade: "W320",
    Size: "Standard W320",
    Packaging: "10 kg vacuum bags",
    Origin: "Indonesia",
  },
  "Bamboo Charcoal Powder": {
    RawMaterial: "Bamboo",
    Shape: "Fine powder",
    Size: "80 mesh",
    MoistureContent: "5%",
    AshContent: "4%",
    FixedCarbon: "88%",
    VolatileMatter: "5%",
    CalorificValue: "7400 kcal/kg",
    Packaging: "25 kg moisture-proof bags",
  },
};

export const DEMO_IDS = {
  suppliers: ["sup-1", "sup-2", "sup-3"] as const,
  buyers: ["byr-1", "byr-2", "byr-3", "byr-4", "byr-5"] as const,
  products: ["prd-1", "prd-2", "prd-3", "prd-4", "prd-5"] as const,
  deals: ["deal-1", "deal-2", "deal-3", "deal-4"] as const,
  commissions: ["com-1", "com-2", "com-3", "com-4", "com-5"] as const,
};

export const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    companyName: "PT Bengawan Arang Bersih",
    contactPerson: "Basuki Rahardja",
    email: "bp@bengawanarang.demo",
    whatsapp: "+62 812 0000 1111",
    country: "Indonesia",
    city: "Surakarta",
    supplierType: "Manufacturer",
    productCategories: ["Charcoal and Briquettes"],
    moq: "500 kg",
    productionCapacity: "2 tons/day",
    verificationStatus: "Verified",
    partnershipStatus: "Partner",
    dateAdded: "2025-02-10",
    documents: ["factory-license-demo.pdf", "product-spec-demo.pdf"],
    internalNotes: "Reliable partner for coconut shell charcoal. Demo record — not a real company.",
    demo: true,
  },
  {
    id: "sup-2",
    companyName: "CV Mutiara Nusantara Abadi",
    contactPerson: "Najwa Anggraini",
    email: "najwa@mutiarademo.demo",
    whatsapp: "+62 813 0000 2222",
    country: "Indonesia",
    city: "Medan",
    supplierType: "Trading Company",
    productCategories: ["Agricultural Products", "Food Ingredients"],
    moq: "1 container",
    productionCapacity: "Export handling, not production",
    verificationStatus: "Under Review",
    partnershipStatus: "Negotiation",
    dateAdded: "2025-06-01",
    documents: ["trade-license-demo.pdf"],
    internalNotes: "Strong source for cassava chips and food ingredients. Demo record — not a real company.",
    demo: true,
  },
  {
    id: "sup-3",
    companyName: "UD Maju Sentosa",
    contactPerson: "Risky Mahendra",
    email: "rukmadam@dummysentosa.demo",
    whatsapp: "+62 814 0000 3333",
    country: "Indonesia",
    city: "Makassar",
    supplierType: "Factory",
    productCategories: ["Food Ingredients", "Other Commodities"],
    moq: "50 kg",
    productionCapacity: "500 kg/day",
    verificationStatus: "Unverified",
    partnershipStatus: "Prospect",
    dateAdded: "2025-09-14",
    documents: [],
    internalNotes: "Small factory with flexible packaging. Demo record — not a real company.",
    demo: true,
  },
];

export const DEMO_BUYERS: Buyer[] = [
  {
    id: "byr-1",
    companyName: "Meridian Trading Co.",
    contactPerson: "Daniel Vos",
    country: "South Korea",
    city: "Busan",
    website: "https://example.meridiantrading.demo",
    email: "d.vos@meridiantrading.demo",
    whatsapp: "+82 10 0000 1111",
    interestedProducts: ["Coconut Shell Charcoal Briquettes (35mm)"],
    estimatedOrderVolume: "5 tons/month",
    leadSource: "Trade fair",
    buyerStatus: "Negotiation",
    lastContact: "2025-10-28",
    nextFollowUp: "2025-11-10",
    demo: true,
  },
  {
    id: "byr-2",
    companyName: "Harbor Wholesale Ltd.",
    contactPerson: "Rashid Al-Mansoori",
    country: "United Arab Emirates",
    city: "Dubai",
    website: "https://example.harborwholesale.demo",
    email: "rashid@harborwholesale.demo",
    whatsapp: "+971 50 0000 2222",
    interestedProducts: ["Cassava Chips (Industrial Grade)", "Bamboo Charcoal Powder"],
    estimatedOrderVolume: "1 container/month",
    leadSource: "Referral",
    buyerStatus: "Qualified",
    lastContact: "2025-10-20",
    nextFollowUp: "2025-11-04",
    demo: true,
  },
  {
    id: "byr-3",
    companyName: "Sentosa Global Sourcing",
    contactPerson: "Mei Lin Tan",
    country: "Singapore",
    city: "Singapore",
    website: "https://example.sentosaglobalsourcing.demo",
    email: "meilin@sentosaglobalsourcing.demo",
    whatsapp: "+65 9000 0003",
    interestedProducts: ["Instant Coconut Water Powder", "Raw Cashew Nuts (W320)"],
    estimatedOrderVolume: "2 tons/month",
    leadSource: "Cold outreach",
    buyerStatus: "Contacted",
    lastContact: "2025-10-15",
    nextFollowUp: "2025-11-12",
    demo: true,
  },
  {
    id: "byr-4",
    companyName: "Aurora Naturals",
    contactPerson: "Klaus Bauer",
    country: "Germany",
    city: "Berlin",
    website: "https://example.auroranaturals.demo",
    email: "klaus@auroranaturals.demo",
    whatsapp: "+49 151 0000 4444",
    interestedProducts: ["Coconut Shell Charcoal Briquettes (35mm)", "Bamboo Charcoal Powder"],
    estimatedOrderVolume: "2.5 tons/month",
    leadSource: "Organic market listing",
    buyerStatus: "New Lead",
    lastContact: "",
    nextFollowUp: "2025-11-06",
    demo: true,
  },
  {
    id: "byr-5",
    companyName: "Pacific Rim Exporters",
    contactPerson: "Hannah Stone",
    country: "Australia",
    city: "Sydney",
    website: "https://example.pacrimrim.demo",
    email: "h.stone@pacrimrim.demo",
    whatsapp: "+61 400 0000 5555",
    interestedProducts: ["Coconut Shell Charcoal Briquettes (35mm)", "Cassava Chips (Industrial Grade)"],
    estimatedOrderVolume: "3 tons/month",
    leadSource: "LinkedIn",
    buyerStatus: "Proposal Sent",
    lastContact: "2025-10-26",
    nextFollowUp: "2025-11-09",
    demo: true,
  },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prd-1",
    productName: "Coconut Shell Charcoal Briquettes (35mm)",
    productCategory: "Charcoal and Briquettes",
    productDescription:
      "High-density coconut shell charcoal briquettes, 35mm diameter, suitable for BBQ and hookah export markets.",
    productImages: ["briquette-demo-1.jpg", "briquette-demo-2.jpg"],
    associatedSupplierId: "sup-1",
    originCountry: "Indonesia",
    moq: "500 kg",
    indicativePrice: 1850000,
    currency: "IDR",
    packaging: "25 kg vacuum-packed bags",
    availabilityStatus: "Available",
    specifications: productSpecs["Coconut Shell Charcoal Briquettes (35mm)"] as Product["specifications"],
    internalNotes: "Primary charcoal product. Indicative price only, not a confirmed quotation.",
    demo: true,
  },
  {
    id: "prd-2",
    productName: "Instant Coconut Water Powder",
    productCategory: "Food Ingredients",
    productDescription:
      "Freeze-dried coconut water powder with consistent sweetness for beverage manufacturers.",
    productImages: ["coconut-water-demo.jpg"],
    associatedSupplierId: "sup-2",
    originCountry: "Indonesia",
    moq: "100 kg",
    indicativePrice: 4200000,
    currency: "IDR",
    packaging: "25 kg sealed cartons",
    availabilityStatus: "Available",
    specifications: productSpecs["Instant Coconut Water Powder"] as Product["specifications"],
    internalNotes: "New product entry for food ingredient buyers. Indicative price only.",
    demo: true,
  },
  {
    id: "prd-3",
    productName: "Cassava Chips (Industrial Grade)",
    productCategory: "Agricultural Products",
    productDescription:
      "Industrial-grade cassava chips for starch and animal feed processing.",
    productImages: ["cassava-demo.jpg"],
    associatedSupplierId: "sup-2",
    originCountry: "Indonesia",
    moq: "1 container (approx. 20 tons)",
    indicativePrice: 980,
    currency: "USD",
    packaging: "50 kg jute bags",
    availabilityStatus: "Available",
    specifications: productSpecs["Cassava Chips (Industrial Grade)"] as Product["specifications"],
    internalNotes: "Strong export volume potential. Indicative USD price.",
    demo: true,
  },
  {
    id: "prd-4",
    productName: "Raw Cashew Nuts (W320)",
    productCategory: "Agricultural Products",
    productDescription:
      "Raw cashew nuts, W320 grade, sorted and dried for export processing.",
    productImages: ["cashew-demo.jpg"],
    associatedSupplierId: "sup-2",
    originCountry: "Indonesia",
    moq: "5 MT",
    indicativePrice: 2450000,
    currency: "IDR",
    packaging: "10 kg vacuum bags",
    availabilityStatus: "Limited",
    specifications: productSpecs["Raw Cashew Nuts (W320)"] as Product["specifications"],
    internalNotes: "Seasonal availability. Indicative price only.",
    demo: true,
  },
  {
    id: "prd-5",
    productName: "Bamboo Charcoal Powder",
    productCategory: "Charcoal and Briquettes",
    productDescription:
      "Fine bamboo charcoal powder for filtration and cosmetic applications.",
    productImages: ["bamboo-demo.jpg"],
    associatedSupplierId: "sup-3",
    originCountry: "Indonesia",
    moq: "200 kg",
    indicativePrice: 3100000,
    currency: "IDR",
    packaging: "25 kg moisture-proof bags",
    availabilityStatus: "Available",
    specifications: productSpecs["Bamboo Charcoal Powder"] as Product["specifications"],
    internalNotes: "Niche product for filtration buyers. Indicative price only.",
    demo: true,
  },
];

export const DEMO_DEALS: Deal[] = [
  {
    id: "deal-1",
    name: "Meridian — Coconut Charcoal Project",
    buyerId: "byr-1",
    supplierId: "sup-1",
    productId: "prd-1",
    dealValue: 4500000000,
    dealStatus: "Negotiation",
    expectedClose: "2025-12-15",
    currency: "IDR",
    demo: true,
  },
  {
    id: "deal-2",
    name: "Harbor Wholesale — Cassava & Bamboo",
    buyerId: "byr-2",
    supplierId: "sup-2",
    productId: "prd-3",
    dealValue: 98000,
    dealStatus: "Prospecting",
    expectedClose: "2026-01-31",
    currency: "USD",
    demo: true,
  },
  {
    id: "deal-3",
    name: "Pacific Rim — Charcoal Consolidation",
    buyerId: "byr-5",
    supplierId: "sup-1",
    productId: "prd-1",
    dealValue: 7200000000,
    dealStatus: "Negotiation",
    expectedClose: "2025-11-30",
    currency: "IDR",
    demo: true,
  },
  {
    id: "deal-4",
    name: "Sentosa — Coconut Water Powder",
    buyerId: "byr-3",
    supplierId: "sup-2",
    productId: "prd-2",
    dealValue: 8400000,
    dealStatus: "Closed Won",
    expectedClose: "2025-10-25",
    currency: "IDR",
    demo: true,
  },
];

export const DEMO_COMMISSIONS: Commission[] = [
  {
    id: "com-1",
    dealName: "Meridian — Coconut Charcoal Project",
    buyerId: "byr-1",
    supplierId: "sup-1",
    productId: "prd-1",
    transactionValue: 4500000000,
    commissionType: "Percentage of Transaction Value",
    commissionRate: 3,
    commissionAmount: 135000000,
    payer: "Buyer",
    expectedPaymentDate: "2026-01-15",
    actualPaymentDate: null,
    commissionStatus: "Agreed",
    internalNotes: "3% sourcing commission agreed in principle. Demo record — not real money.",
    currency: "IDR",
    demo: true,
  },
  {
    id: "com-2",
    dealName: "Harbor Wholesale — Cassava & Bamboo",
    buyerId: "byr-2",
    supplierId: "sup-2",
    productId: "prd-3",
    transactionValue: 98000,
    commissionType: "Fixed Fee",
    commissionRate: 1200,
    commissionAmount: 1200,
    payer: "Supplier",
    expectedPaymentDate: "2026-02-28",
    actualPaymentDate: null,
    commissionStatus: "Potential",
    internalNotes: "Fixed fee per container. Demo record — not real money.",
    currency: "USD",
    demo: true,
  },
  {
    id: "com-3",
    dealName: "Pacific Rim — Charcoal Consolidation",
    buyerId: "byr-5",
    supplierId: "sup-1",
    productId: "prd-1",
    transactionValue: 7200000000,
    commissionType: "Percentage of Transaction Value",
    commissionRate: 3,
    commissionAmount: 216000000,
    payer: "Buyer",
    expectedPaymentDate: "2026-01-10",
    actualPaymentDate: null,
    commissionStatus: "Earned",
    internalNotes: "Commission earned on signed proposal. Demo record — not real money.",
    currency: "IDR",
    demo: true,
  },
  {
    id: "com-4",
    dealName: "Sentosa — Coconut Water Powder",
    buyerId: "byr-3",
    supplierId: "sup-2",
    productId: "prd-2",
    transactionValue: 8400000,
    commissionType: "Percentage of Transaction Value",
    commissionRate: 2.5,
    commissionAmount: 210000,
    payer: "Supplier",
    expectedPaymentDate: "2025-11-20",
    actualPaymentDate: null,
    commissionStatus: "Payable",
    internalNotes: "Pending invoice. Demo record — not real money.",
    currency: "IDR",
    demo: true,
  },
  {
    id: "com-5",
    dealName: "Aurora Naturals — Charcoal Trial",
    buyerId: "byr-4",
    supplierId: "sup-1",
    productId: "prd-1",
    transactionValue: 0,
    commissionType: "Fixed Fee",
    commissionRate: 350,
    commissionAmount: 350,
    payer: "Buyer",
    expectedPaymentDate: "2026-02-10",
    actualPaymentDate: null,
    commissionStatus: "Potential",
    internalNotes: "Trial order fixed fee. Demo record — not real money.",
    currency: "USD",
    demo: true,
  },
];

export const DEMO_DISTRIBUTION: CommissionDistribution = {
  id: "dist-1",
  partnerAShare: 50,
  partnerBShare: 45,
  operationalReserve: 5,
  updatedAt: new Date().toISOString(),
  demo: true,
};

export const DEMO_USERS: UserProfile[] = [
  {
    id: "user-a",
    name: "Rizal Harahap",
    role: "Partner A",
    email: "rizal@harsarekaniaga.demo",
    avatar: "",
    demo: true,
  },
  {
    id: "user-b",
    name: "Sinta Dewi",
    role: "Partner B",
    email: "sinta@harsarekaniaga.demo",
    avatar: "",
    demo: true,
  },
];

export const DEMO_ACTIVITY_LOG: ActivityLog[] = [
  {
    id: uuid(),
    action: "Commission status updated",
    entity: "Commission",
    entityId: "com-3",
    description: "Commission Pacific Rim — Charcoal Consolidation moved to Earned.",
    createdAt: "2025-10-26T09:14:00Z",
    demo: true,
  },
  {
    id: uuid(),
    action: "Deal status changed",
    entity: "Deal",
    entityId: "deal-3",
    description: "Pacific Rim — Charcoal Consolidation moved to Proposal Sent.",
    createdAt: "2025-10-26T09:10:00Z",
    demo: true,
  },
  {
    id: uuid(),
    action: "Buyer created",
    entity: "Buyer",
    entityId: "byr-4",
    description: "Aurora Naturals added as a new buyer lead.",
    createdAt: "2025-10-18T11:22:00Z",
    demo: true,
  },
  {
    id: uuid(),
    action: "Supplier updated",
    entity: "Supplier",
    entityId: "sup-2",
    description: "CV Mutiara Nusantara Abadi verification status set to Under Review.",
    createdAt: "2025-10-15T14:05:00Z",
    demo: true,
  },
  {
    id: uuid(),
    action: "Product created",
    entity: "Product",
    entityId: "prd-5",
    description: "Bamboo Charcoal Powder added to catalog.",
    createdAt: "2025-09-20T08:40:00Z",
    demo: true,
  },
];

export function formatCurrency(
  amount: number,
  currency: "IDR" | "USD"
): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}
