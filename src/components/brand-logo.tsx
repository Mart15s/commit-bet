import Image from "next/image";
import { cn } from "@/lib/utils";

/** Authentic supplied artwork. The horizontal lockup collapses on small screens. */
export function BrandLogo({
  variant = "horizontal",
  className,
}: {
  variant?: "horizontal" | "monogram" | "stacked";
  className?: string;
}) {
  if (variant === "horizontal") {
    return (
      <span className={cn("brand-logo inline-flex shrink-0 items-center", className)}>
        <Image
          src="/brand/monogram.png"
          alt="5GieAEOU"
          width={140}
          height={124}
          unoptimized
          className="h-11 w-auto sm:hidden"
        />
        <Image
          src="/brand/horizontal.png"
          alt="5GieAEOU"
          width={368}
          height={56}
          unoptimized
          className="hidden h-auto w-[184px] sm:block"
        />
      </span>
    );
  }

  return (
    <Image
      src={`/brand/${variant === "stacked" ? "stacked" : "monogram"}.png`}
      alt="5GieAEOU"
      width={variant === "stacked" ? 300 : 140}
      height={variant === "stacked" ? 196 : 124}
      unoptimized
      className={cn("h-auto max-w-full", className)}
    />
  );
}
