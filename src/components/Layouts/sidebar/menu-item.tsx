import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-2xl px-3 py-2.5 font-medium text-black transition-all duration-200",
  {
    variants: {
      isActive: {
        true: "bg-[#1A4D2E]/10 text-[#1A4D2E] font-semibold",
        false:
          "hover:bg-gray-50 hover:text-black",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        // Close sidebar on clicking link if it's mobile
        onClick={() => isMobile && toggleSidebar()}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative block py-2",
          }),
          props.className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: "flex w-full items-center gap-3 py-3",
      })}
    >
      {props.children}
    </button>
  );
}
