import type {
  Supplier,
  Buyer,
  BuyerInteraction,
  FollowUp,
  Deal,
  SupplierType,
  VerificationStatus,
  PartnershipStatus,
  BuyerStatus,
  Commission,
  CommissionType,
  CommissionStatus,
  Product,
  ProductCategory,
  AvailabilityStatus,
} from "@/lib/data";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { ReactNode } from "react";

export function formatDate(
  date: string | Date | null | undefined,
  fmt = "dd MMM yyyy"
): string {
  if (!date) return "—";
  try {
    return format(parseISO(date as string), fmt);
  } catch {
    return String(date);
  }
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  try {
    return isBefore(parseISO(date), new Date());
  } catch {
    return false;
  }
}

export function isUpcoming(date: string | null | undefined): boolean {
  if (!date) return false;
  try {
    return (
      isAfter(parseISO(date), new Date()) &&
      isBefore(
        parseISO(date),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      )
    );
  } catch {
    return false;
  }
}

export function supplierTypeLabel(type: SupplierType): string {
  return type;
}

export function verificationLabel(status: VerificationStatus): string {
  return status;
}

export function partnershipLabel(status: PartnershipStatus): string {
  return status;
}

export function buyerStatusLabel(status: BuyerStatus): string {
  return status;
}

export function commissionTypeLabel(type: CommissionType): string {
  const labels: Record<CommissionType, string> = {
    "Percentage of Transaction Value": "Persentase Nilai Transaksi",
    "Fixed Fee": "Biaya Tetap",
    "Fee per Ton": "Biaya per Ton",
  };
  return labels[type] ?? type;
}

export function commissionStatusLabel(status: CommissionStatus): string {
  const labels: Record<CommissionStatus, string> = {
    Potential: "Potensial",
    Agreed: "Disepakati",
    Earned: "Diperoleh",
    Payable: "Tertanggung",
    Paid: "Lunas",
    Cancelled: "Dibatalkan",
  };
  return labels[status] ?? status;
}

export function productCategoryLabel(cat: ProductCategory): string {
  return cat;
}

export function availabilityLabel(status: AvailabilityStatus): string {
  return status;
}

export function statusBadgeClass(status?: string | null): string {
  const lower = (status ?? "").toLowerCase();
  if (
    lower.includes("verified") ||
    lower.includes("partner") ||
    lower.includes("won") ||
    lower.includes("paid") ||
    lower.includes("active")
  ) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (
    lower.includes("rejected") ||
    lower.includes("lost") ||
    lower.includes("cancelled") ||
    lower.includes("inactive") ||
    lower.includes("unverified")
  ) {
    return "bg-red-50 text-red-800 border-red-200";
  }
  if (
    lower.includes("under review") ||
    lower.includes("negotiation") ||
    lower.includes("proposal") ||
    lower.includes("earned") ||
    lower.includes("payable") ||
    lower.includes("limited") ||
    lower.includes("pre-order")
  ) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (
    lower.includes("prospect") ||
    lower.includes("new lead") ||
    lower.includes("contacted") ||
    lower.includes("responded") ||
    lower.includes("qualified") ||
    lower.includes("potential") ||
    lower.includes("available")
  ) {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function statusDotClass(status?: string | null): string {
  const lower = (status ?? "").toLowerCase();
  if (
    lower.includes("verified") ||
    lower.includes("partner") ||
    lower.includes("won") ||
    lower.includes("paid") ||
    lower.includes("active") ||
    lower.includes("available")
  ) {
    return "bg-emerald-500";
  }
  if (
    lower.includes("rejected") ||
    lower.includes("lost") ||
    lower.includes("cancelled") ||
    lower.includes("inactive") ||
    lower.includes("unverified") ||
    lower.includes("discontinued")
  ) {
    return "bg-red-500";
  }
  if (
    lower.includes("under review") ||
    lower.includes("negotiation") ||
    lower.includes("proposal") ||
    lower.includes("earned") ||
    lower.includes("payable") ||
    lower.includes("limited") ||
    lower.includes("pre-order")
  ) {
    return "bg-amber-500";
  }
  return "bg-sky-500";
}

export function globalSearch<T extends { id: string; demo?: boolean }>(
  query: string,
  items: T[],
  fields: (keyof T)[],
  labelKey: keyof T
): { item: T; label: string; _score: number }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: { item: T; label: string; _score: number }[] = [];
  for (const item of items) {
    let bestScore = 0;
    let bestLabel = "";
    for (const field of fields) {
      const val = item[field];
      const str = val == null ? "" : String(val);
      if (str.toLowerCase().includes(q)) {
        const score =
          str.toLowerCase() === q
            ? 100
            : str.toLowerCase().startsWith(q)
              ? 50
              : 10;
        if (score > bestScore) {
          bestScore = score;
          bestLabel = String(item[labelKey] ?? "");
        }
      }
    }
    if (bestScore > 0) {
      results.push({ item, label: bestLabel, _score: bestScore });
    }
  }
  results.sort(
    (a, b) =>
      b._score - a._score || a.label.localeCompare(b.label)
  );
  return results.slice(0, 12);
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1
    ? `${count} ${singular}`
    : `${count} ${plural ?? singular + "s"}`;
}

export function currencySymbol(currency: "IDR" | "USD"): string {
  return currency === "IDR" ? "IDR" : "USD";
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function entityLabel(
  entity: "Supplier" | "Buyer" | "Product" | "Deal" | "Commission"
): string {
  return entity;
}

export function activityIcon(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("created") || lower.includes("added")) return "Plus";
  if (lower.includes("updated") || lower.includes("changed") || lower.includes("set"))
    return "Edit";
  if (lower.includes("status") || lower.includes("moved")) return "GitBranch";
  if (lower.includes("payment") || lower.includes("received")) return "CurrencyDollar";
  return "Circle";
}

export function activityColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("created") || lower.includes("added") || lower.includes("won"))
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (lower.includes("status") || lower.includes("changed") || lower.includes("moved") || lower.includes("updated"))
    return "text-amber-700 bg-amber-50 border-amber-200";
  if (lower.includes("payment") || lower.includes("received") || lower.includes("paid"))
    return "text-sky-700 bg-sky-50 border-sky-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export function emptyStateIllustration(
  kind: "suppliers" | "buyers" | "products" | "deals" | "commissions" | "activity" | "search"
): string {
  return kind;
}

export function demoTag(): ReactNode {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 tracking-wide">
      DEMO
    </span>
  );
}

export { cn } from "cn";
