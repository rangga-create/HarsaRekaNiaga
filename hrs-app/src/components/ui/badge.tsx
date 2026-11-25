import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[3px] border-2 border-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap shadow-[2px_2px_0_#111] transition-all focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-black text-white [a]:hover:bg-[#333]",
        secondary:
          "bg-[#ffcc00] text-black [a]:hover:bg-[#ffd633]",
        destructive:
          "bg-[#e53935] text-white [a]:hover:bg-[#c62828]",
        outline:
          "bg-[#fffdf5] text-black [a]:hover:bg-[#ffe66d]",
        ghost:
          "border-transparent shadow-none hover:border-black hover:bg-[#ffe66d] hover:shadow-[2px_2px_0_#111]",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
