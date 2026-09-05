"use client";

import {
  AlignLeft,
  Braces,
  Briefcase,
  Clapperboard,
  Code2,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  LayoutTemplate,
  ListTree,
  Mail,
  Megaphone,
  MessageSquareReply,
  PenLine,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Target,
  Wand2,
  Wrench,
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icons are stored as names in the tool registry, so a new tool can pick one
 * from configuration without importing anything.
 */
const ICONS: Record<string, LucideIcon> = {
  AlignLeft,
  Braces,
  Briefcase,
  Clapperboard,
  Code2,
  FileText,
  HelpCircle,
  Image: ImageIcon,
  LayoutTemplate,
  ListTree,
  Mail,
  Megaphone,
  MessageSquareReply,
  PenLine,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Target,
  Wand2,
  Wrench,
  Youtube,
  Zap,
};

export function ToolIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
}
