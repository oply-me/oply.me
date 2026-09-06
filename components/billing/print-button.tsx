"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Print → "Save as PDF" is the PDF export; no renderer ships to the client. */
export function PrintButton() {
  return (
    <Button size="sm" variant="outline" onClick={() => window.print()}>
      <Printer />
      Print / Save as PDF
    </Button>
  );
}
