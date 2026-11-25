"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Globe,
  Mail,
  MapPin,
  Package,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProducts, useSuppliers } from "@/lib/firebase-store";
import { cn, formatDate, statusBadgeClass } from "@/lib/utils";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { list: suppliers } = useSuppliers();
  const { list: products } = useProducts();
  const supplier = suppliers.find((item) => item.id === id);
  const supplierProducts = products.filter(
    (product) => product.associatedSupplierId === id
  );

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-forest/10">
          <Building2 className="h-6 w-6 text-black" />
        </div>
        <h1 className="mb-1 text-xl font-semibold text-black">Supplier not found</h1>
        <p className="mb-4 text-sm text-[#333]">
          This supplier may have been deleted or the record doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/suppliers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 mt-1"
            aria-label="Back to suppliers"
            onClick={() => router.push("/suppliers")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-forest/10">
            <Building2 className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {supplier.companyName}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#333]">
              <span>{supplier.supplierType}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {supplier.country}{supplier.city ? `, ${supplier.city}` : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className={cn("text-[11px]", statusBadgeClass(supplier.verificationStatus))}
          >
            {supplier.verificationStatus}
          </Badge>
          <Badge
            variant="secondary"
            className={cn("text-[11px]", statusBadgeClass(supplier.partnershipStatus))}
          >
            {supplier.partnershipStatus}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Contact person</p>
            <p className="mt-1 font-medium text-brand-foreground">{supplier.contactPerson || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Minimum order</p>
            <p className="mt-1 font-medium text-brand-foreground">{supplier.moq || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Production capacity</p>
            <p className="mt-1 font-medium text-brand-foreground">{supplier.productionCapacity || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Date added</p>
            <p className="mt-1 font-medium text-brand-foreground">{formatDate(supplier.dateAdded)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-black">
          <CardContent className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-black">
              <Building2 className="h-4 w-4" />
              Company information
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#333]">Supplier type</dt>
                <dd className="mt-1 font-medium text-brand-foreground">{supplier.supplierType}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#333]">Location</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-brand-foreground">
                  <MapPin className="h-4 w-4 text-[#333]" />
                  {supplier.city ? `${supplier.city}, ` : ""}{supplier.country || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#333]">Product categories</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {(supplier.productCategories?.length ?? 0) ? (supplier.productCategories ?? []).map((category) => (
                    <Badge key={category} variant="outline">{category}</Badge>
                  )) : <span className="text-sm text-brand-foreground">—</span>}
                </dd>
              </div>
            </dl>
            <Separator />
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-black">
                <Phone className="h-4 w-4" />
                Contact information
              </h3>
              <p className="flex items-center gap-2 text-sm text-brand-foreground">
                <Mail className="h-4 w-4 shrink-0 text-[#333]" />
                {supplier.email ? (
                  <a className="break-all underline-offset-4 hover:underline" href={`mailto:${supplier.email}`}>
                    {supplier.email}
                  </a>
                ) : "—"}
              </p>
              <p className="flex items-center gap-2 text-sm text-brand-foreground">
                <Phone className="h-4 w-4 shrink-0 text-[#333]" />
                {supplier.whatsapp || "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black">
          <CardContent className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold text-black">
              <Package className="h-4 w-4" />
              Product portfolio
            </h2>
            {supplierProducts.length ? (
              <div className="space-y-2">
                {supplierProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between gap-3 rounded-[4px] border border-black p-3 transition-colors hover:bg-[#ffe66d]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-foreground">{product.productName}</p>
                      <p className="mt-1 text-xs text-[#333]">{product.productCategory}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("shrink-0 text-[11px]", statusBadgeClass(product.availabilityStatus))}
                    >
                      {product.availabilityStatus}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#333]">No products are linked to this supplier.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {supplier.internalNotes && (
        <Card className="border-black">
          <CardContent className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold text-black">
              <FileText className="h-4 w-4" />
              Internal notes
            </h2>
            <p className="rounded-[4px] bg-brand-muted/20 p-3 text-sm leading-6 text-brand-foreground">
              {supplier.internalNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {(supplier.documents?.length ?? 0) > 0 && (
        <Card className="border-black">
          <CardContent className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold text-black">
              <FileText className="h-4 w-4" />
              Documents
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(supplier.documents ?? []).map((document) => (
                <li
                  key={document}
                  className="flex min-w-0 items-center gap-2 rounded-[4px] border border-black p-3 text-sm text-brand-foreground"
                >
                  <FileText className="h-4 w-4 shrink-0 text-black" />
                  <span className="truncate">{document}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
