"use client";

import React, { useState } from "react";

import { motion } from "framer-motion";
import {
  Home,
  LineChart,
  CreditCard,
  MessageCircle,
  Trophy,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type NavItem = {
  id?: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

const defaultNavItems: NavItem[] = [
  { label: "Home", icon: Home },
  { label: "Portfolio", icon: LineChart },
  { label: "Transactions", icon: CreditCard },
  { label: "Messages", icon: MessageCircle },
  { label: "Rewards", icon: Trophy },
  { label: "Profile", icon: User },
];

const MOBILE_LABEL_WIDTH = 72;

export type BottomNavBarProps = {
  className?: string;
  defaultIndex?: number;
  stickyBottom?: boolean;
  items?: NavItem[];
  activeIndex?: number;
  onChange?: (index: number) => void;
};

export function BottomNavBar({
  className,
  defaultIndex = 0,
  stickyBottom = false,
  items = defaultNavItems,
  activeIndex: controlledIndex,
  onChange,
}: BottomNavBarProps) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex);

  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const handleSelect = (idx: number) => {
    if (controlledIndex === undefined) {
      setInternalIndex(idx);
    }
    onChange?.(idx);
  };

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bg-white/95 dark:bg-card border border-[#E9DFDC] dark:border-sidebar-border rounded-full flex items-center p-1.5 shadow-[0_8px_28px_rgba(64,56,58,0.12)] space-x-1 min-w-[300px] max-w-[95vw] h-[52px]",
        stickyBottom && "fixed inset-x-0 bottom-4 mx-auto z-50 w-fit",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;

        return (
          <motion.button
            key={item.id || item.label}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[40px] max-h-[44px] cursor-pointer",
              isActive
                ? "bg-[#FFF5F7] text-[#B94862] gap-2 border border-[#FFD3DD]"
                : "bg-transparent text-[#918689] hover:bg-[#FAF8F5]",
              "focus:outline-none focus-visible:ring-0",
            )}
            onClick={() => handleSelect(idx)}
            aria-label={item.label}
            type="button"
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.2 : 1.8}
              aria-hidden
              className={cn("transition-colors duration-200 shrink-0", isActive ? "text-[#B94862]" : "text-[#918689]")}
            />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? "auto" : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "6px" : "0px",
              }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
              className="overflow-hidden flex items-center whitespace-nowrap"
            >
              <span
                className={cn(
                  "font-semibold text-xs sm:text-xs text-[#B94862] whitespace-nowrap select-none tracking-tight",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
