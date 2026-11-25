import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-[4px] border-[3px] border-black bg-[#fffdf5] px-3 py-1 text-base shadow-[2px_2px_0_#111] transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground placeholder:text-muted-foreground/80 focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-[3px_3px_0_#111] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
