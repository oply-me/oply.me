export function ImageResultView({
  image,
}: {
  image: { url: string; width: number; height: number; mimeType: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element -- a signed Storage URL isn't a next/image-compatible static/remote source */}
        <img
          src={image.url}
          alt="Generated result"
          className="max-h-[420px] w-auto max-w-full object-contain"
        />
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">
        {image.width} × {image.height}px
      </p>
    </div>
  );
}
