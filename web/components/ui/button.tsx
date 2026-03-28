"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-sans font-bold text-[15px] no-underline cursor-pointer transition-all duration-150 outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/25 bg-primary text-primary-foreground hover:bg-[var(--accent-hover)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(212,115,74,0.2)] active:translate-y-0",
        ghost:
          "border border-border bg-transparent text-foreground hover:bg-secondary hover:shadow-[0_4px_16px_rgba(35,25,18,0.06)]",
        outline:
          "border border-border bg-background text-foreground hover:bg-secondary",
        success:
          "border border-success bg-success text-white hover:bg-success hover:translate-y-0 hover:shadow-none",
        link: "text-muted-foreground no-underline text-sm font-semibold hover:text-foreground p-0 border-none",
      },
      size: {
        default: "px-7 py-3.5",
        sm: "px-4 py-1.5 text-[13px]",
        lg: "px-8 py-4 text-base",
        copy: "px-7 py-3.5 min-w-[180px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
