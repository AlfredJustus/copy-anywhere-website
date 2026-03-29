import Image from "next/image";

/**
 * Per-logo inner scale factor: what fraction of the container the image content fills.
 * Logos with no natural padding (xAI) get a lower value so they don't touch the edges.
 * Logos with non-square viewBoxes (Google Docs, DeepSeek) need object-contain + scale.
 */
const INNER_SCALE: Record<string, number> = {
  "/logos/xai.svg": 0.58,       // 466×517, fills edge-to-edge — needs breathing room
  "/logos/docs.svg": 0.62,      // 64×88 portrait — object-contain will letterbox
  "/logos/deepseek.svg": 0.88,  // 35×26 landscape — object-contain will letterbox
  "/logos/notion-logo.svg": 0.82, // 100×100, artwork is tight to edges
};

const DEFAULT_SCALE = 0.80;

interface LogoIconProps {
  src: string;
  alt: string;
  /** Outer container size in px. Default: 28 */
  size?: number;
  /**
   * "circle"  — rounded-full with bg + ring (homepage flow, copy button stacks)
   * "rounded" — rounded-lg with bg + ring (SEO page headers)
   * "bare"    — no container, just a correctly-sized image (inline in buttons/lists)
   */
  shape?: "circle" | "rounded" | "bare";
  invertDark?: boolean;
  className?: string;
}

export function LogoIcon({
  src,
  alt,
  size = 28,
  shape = "circle",
  invertDark = false,
  className = "",
}: LogoIconProps) {
  const scale = INNER_SCALE[src] ?? DEFAULT_SCALE;
  const innerSize = Math.round(size * scale);
  const imgClass = `object-contain shrink-0${invertDark ? " dark:invert" : ""}`;

  if (shape === "bare") {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={alt}
          width={innerSize}
          height={innerSize}
          className={imgClass}
        />
      </span>
    );
  }

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 bg-background ring-1 ring-border overflow-hidden ${shapeClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={innerSize}
        height={innerSize}
        className={imgClass}
      />
    </span>
  );
}
