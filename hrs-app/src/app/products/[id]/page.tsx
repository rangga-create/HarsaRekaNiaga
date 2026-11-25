"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Package,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProducts, useSuppliers } from "@/lib/firebase-store";
import { cn, statusBadgeClass } from "@/lib/utils";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { list: products } = useProducts();
  const { list: suppliers } = useSuppliers();
  const product = products.find((item) => item.id === id);
  const supplier = product
    ? suppliers.find((item) => item.id === product.associatedSupplierId)
    : undefined;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-forest/10">
          <Package className="h-6 w-6 text-black" />
        </div>
        <h1 className="mb-1 text-xl font-semibold text-black">Product not found</h1>
        <p className="mb-4 text-sm text-[#333]">
          This product may have been deleted or the record doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    );
  }

  const currency = product.currency === "USD" ? "USD" : "IDR";
  const price = new Intl.NumberFormat(
    currency === "IDR" ? "id-ID" : "en-US",
    {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }
  ).format(product.indicativePrice ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 mt-1"
            aria-label="Back to products"
            onClick={() => router.push("/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-forest/10">
            <Package className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {product.productName}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#333]">
              <span>{product.productCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {product.originCountry || "Origin not specified"}
              </span>
            </div>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn("text-[11px]", statusBadgeClass(product.availabilityStatus))}
        >
          {product.availabilityStatus}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Indicative price</p>
            <p className="mt-1 text-lg font-semibold text-black">{price}</p>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Minimum order</p>
            <p className="mt-1 font-medium text-brand-foreground">{product.moq || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Packaging</p>
            <p className="mt-1 font-medium text-brand-foreground">{product.packaging || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-black">
          <CardContent>
            <p className="text-xs uppercase tracking-wider text-[#333]">Supplier</p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-brand-foreground">
              <Building2 className="h-4 w-4 text-[#333]" />
              {supplier?.companyName ?? "Not assigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-black">
          <CardContent className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold text-black">
              <Package className="h-4 w-4" />
              Product overview
            </h2>
            <p className="text-sm leading-6 text-brand-foreground">
              {product.productDescription || "No product description available."}
            </p>
            <div className="flex items-center gap-2 pt-2 text-sm text-[#333]">
              <Tag className="h-4 w-4" />
              <span>{product.productCategory}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black">
          <CardContent className="space-y-3">
            <h2 className="font-semibold text-black">Specifications</h2>
            {Object.keys(product.specifications).length ? (
              <dl className="divide-y divide-brand-border">
                {Object.entries(product.specifications).map(([label, value]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <dt className="text-[#333]">{label}</dt>
                    <dd className="font-medium text-brand-foreground">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-[#333]">No specifications have been added.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {product.internalNotes && (
        <Card className="border-black">
          <CardContent className="space-y-2">
            <h2 className="font-semibold text-black">Internal notes</h2>
            <p className="text-sm leading-6 text-brand-foreground">{product.internalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
