import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** Uploaded logo path from settings. When present, renders the logo image. */
  logoPath?: string | null;
  alt?: string;
  /** Size (px) of the logo image when shown. */
  size?: number;
  className?: string;
}

/**
 * Brand mark for Lady Greens Ashes Nursing Concierge (LGANC).
 * Renders the uploaded logo when one is configured in Settings,
 * otherwise falls back to a text wordmark.
 */
export function BrandMark({
  logoPath,
  alt = "LGANC",
  size = 48,
  className,
}: BrandMarkProps) {
  if (logoPath) {
    return (
      <Image
        src={logoPath}
        alt={alt}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("leading-none", className)}>
      <p className="font-heading text-lg font-semibold tracking-wide text-[var(--lganc-orange)]">
        LGANC
      </p>
      <p className="font-heading text-[0.7rem] tracking-[0.18em] text-[var(--lganc-muted)]">
        NURSING CONCIERGE
      </p>
    </div>
  );
}
