import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide cursor-pointer transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-[1px] border border-primary/20",
        destructive: "bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-[1px]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-surface hover:text-foreground hover:border-primary/50 transition-colors",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:shadow-md border border-secondary/20",
        ghost: "hover:bg-surface hover:text-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-corp hover:shadow-elev hover:-translate-y-[1px] border border-primary/50 relative overflow-hidden after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-4 text-xs",
        lg: "h-11 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
