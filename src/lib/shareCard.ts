/** Client-side verse share card (PNG). */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type VerseCardOptions = {
  text: string;
  cite: string;
  versionLabel?: string;
};

export async function renderVerseCard(opts: VerseCardOptions): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // Background
  ctx.fillStyle = "#FAF9F6";
  ctx.fillRect(0, 0, W, H);

  // Soft top band
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, "#1E3A8A");
  grad.addColorStop(1, "#243f96");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 280);

  // Gold line
  ctx.fillStyle = "#D4AF37";
  ctx.fillRect(80, 280, W - 160, 6);

  // Brand
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 36px 'Source Sans 3', system-ui, sans-serif";
  ctx.fillText("Bible", 80, 120);
  ctx.font = "400 28px 'Source Sans 3', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText("A quiet place for God’s Word", 80, 170);

  // Verse body
  const maxWidth = W - 160;
  ctx.fillStyle = "#152238";
  ctx.font = "400 46px 'Source Serif 4', Georgia, serif";
  const lines = wrapText(ctx, opts.text, maxWidth);
  const lineHeight = 68;
  const blockHeight = lines.length * lineHeight;
  let y = Math.max(420, (H - blockHeight) / 2 - 40);

  for (const line of lines.slice(0, 14)) {
    ctx.fillText(line, 80, y);
    y += lineHeight;
  }

  // Citation
  y += 36;
  ctx.fillStyle = "#D4AF37";
  ctx.font = "600 32px 'Source Sans 3', system-ui, sans-serif";
  ctx.fillText(opts.cite, 80, y);

  if (opts.versionLabel) {
    y += 48;
    ctx.fillStyle = "#718096";
    ctx.font = "400 26px 'Source Sans 3', system-ui, sans-serif";
    ctx.fillText(opts.versionLabel, 80, y);
  }

  // Footer
  ctx.fillStyle = "#E6E2D9";
  ctx.fillRect(80, H - 120, W - 160, 2);
  ctx.fillStyle = "#718096";
  ctx.font = "400 24px 'Source Sans 3', system-ui, sans-serif";
  ctx.fillText("Read · Reflect · Return tomorrow", 80, H - 70);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))),
      "image/png",
      0.92,
    );
  });
}

export async function shareOrDownloadCard(
  opts: VerseCardOptions,
  shareText: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = await renderVerseCard(opts);
  const fileName = `${opts.cite.replace(/[^\w.-]+/g, "-")}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  try {
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: opts.cite,
        text: shareText,
      });
      return "shared";
    }
  } catch (err) {
    // User cancelled share sheet — don't force a download.
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
  }

  // Download fallback when image share isn't supported
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
