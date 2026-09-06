import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadButton({
  url,
  filename = "oply-image.png",
}: {
  url: string;
  filename?: string;
}) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={url} download={filename} target="_blank" rel="noopener noreferrer">
        <Download />
        Download
      </a>
    </Button>
  );
}
