// Fixture adapter: retain accessible image/layout props without the Next runtime.
import type { ImgHTMLAttributes } from "react";
export default function FixtureImage({ unoptimized: _unoptimized, ...props }: ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) {
  void _unoptimized;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt ?? ""} />;
}
