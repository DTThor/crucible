"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileBadgeProps {
  avatarUrl: string | null;
  initials: string;
  /** Optional pixel size. Defaults to 36. */
  size?: number;
  className?: string;
  /** If true, wraps the badge in a Link to /me. */
  link?: boolean;
}

/**
 * Avatar that's clickable to /me. Always renders initials underneath; the
 * uploaded image (if any) overlays on top once it loads. If the image
 * fails for any reason, the initials show through naturally.
 */
export function ProfileBadge({
  avatarUrl,
  initials,
  size = 36,
  className,
  link = true,
}: ProfileBadgeProps) {
  const [errored, setErrored] = useState(false);

  // Reset error state if the URL changes (new avatar uploaded).
  useEffect(() => {
    setErrored(false);
  }, [avatarUrl]);

  const showImg = !!avatarUrl && !errored;

  const inner = (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-bold text-primary ring-2 ring-primary/40 select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label="Profile"
    >
      {/* Initials are always rendered as the fallback layer. */}
      <span aria-hidden>{initials}</span>
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={avatarUrl}
          src={avatarUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );

  if (!link) return inner;

  return (
    <Link href="/me" prefetch={false} aria-label="Open profile">
      {inner}
    </Link>
  );
}
