"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A slide-in panel built on Radix Dialog, so it gets the focus trap, escape
 * handling, scroll lock and `aria-modal` semantics a hand-rolled div does not.
 *
 * Radix's own `data-state` animations are CSS transitions; this uses Framer
 * with `forceMount` instead so the panel can ride a real spring and still
 * animate on the way *out*. `useReducedMotion` is honoured here as well as by
 * the global CSS rule, which does not reach JS-driven transforms.
 */

const SheetOpenContext = React.createContext(false);

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <SheetOpenContext.Provider value={open}>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
        {children}
      </DialogPrimitive.Root>
    </SheetOpenContext.Provider>
  );
}

const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right";
    /** Class applied to the portal wrapper, e.g. to hide the sheet at lg. */
    portalClassName?: string;
  }
>(function SheetContent(
  { side = "left", className, portalClassName, children, ...props },
  ref,
) {
  const open = React.useContext(SheetOpenContext);
  const reduceMotion = useReducedMotion();
  const offscreen = side === "left" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <div className={portalClassName}>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content
              ref={ref}
              asChild
              forceMount
              /* Radix warns when a dialog has no description; these panels are
                 navigation, and their title is enough. */
              aria-describedby={undefined}
              {...props}
            >
              <motion.div
                className={cn(
                  "fixed inset-y-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-background shadow-2xl focus:outline-none",
                  side === "left"
                    ? "left-0 border-r border-border"
                    : "right-0 border-l border-border",
                  className,
                )}
                initial={reduceMotion ? { opacity: 0 } : { x: offscreen }}
                animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { x: offscreen }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 340, damping: 34, mass: 0.85 }
                }
              >
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
});

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
});

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
