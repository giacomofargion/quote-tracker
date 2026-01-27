"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatefulButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  className?: string;
  /** Optional error handler called when onClick throws an error */
  onError?: (error: unknown) => void;
}

export const StatefulButton = ({
  children,
  onClick,
  className,
  disabled,
  onError,
  ...props
}: StatefulButtonProps) => {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || state !== "idle") return;

    setState("loading");

    try {
      await onClick?.(e);
      setState("success");

      // Reset to idle after showing success state
      timeoutRef.current = setTimeout(() => {
        setState("idle");
        timeoutRef.current = null;
      }, 2000);
    } catch (error) {
      setState("idle");
      // Surface error via callback or console, but don't rethrow to avoid unhandled rejections
      onError?.(error);
      if (!onError) {
        console.error("StatefulButton onClick error:", error);
      }
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || state !== "idle"}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 px-6 py-3",
        "text-sm font-medium rounded-lg",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors",
        "overflow-hidden",
        className
      )}
      whileHover={state === "idle" ? { scale: 1.02 } : {}}
      whileTap={state === "idle" ? { scale: 0.98 } : {}}
      {...props}
    >
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </motion.div>
        )}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>Success!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
