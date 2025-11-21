import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "solid";
}

export function Card({ children, className, variant = "solid" }: CardProps) {
  const variants = {
    default: "rounded-xl bg-white shadow",
    glass: "rounded-xl bg-white shadow",
    solid: "rounded-xl bg-white shadow",
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pb-4", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold text-gray-900", className)}>{children}</h2>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-gray-500 mt-1", className)}>{children}</p>;
}
