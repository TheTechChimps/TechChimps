import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "soft";
type ButtonSize = "sm" | "md" | "lg";

const sizeClass: Record<ButtonSize, string> = {
  sm: "button-sm",
  md: "",
  lg: "button-lg"
};

type SharedButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & SharedButtonProps) {
  return (
    <button className={cn("button", `button-${variant}`, sizeClass[size], className)} {...props}>
      {Icon && iconPosition === "left" ? <Icon aria-hidden size={18} /> : null}
      {children}
      {Icon && iconPosition === "right" ? <Icon aria-hidden size={18} /> : null}
    </button>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & SharedButtonProps) {
  return (
    <a className={cn("button", `button-${variant}`, sizeClass[size], className)} {...props}>
      {Icon && iconPosition === "left" ? <Icon aria-hidden size={18} /> : null}
      {children}
      {Icon && iconPosition === "right" ? <Icon aria-hidden size={18} /> : null}
    </a>
  );
}
