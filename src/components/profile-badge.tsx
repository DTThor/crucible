import Link from "next/link";
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
 * Small avatar that's clickable to /me. Falls back to initials if the user
 * hasn't uploaded an avatar yet.
 */
export function ProfileBadge({
  avatarUrl,
  initials,
  size = 36,
  className,
  link = true,
}: ProfileBadgeProps) {
  const inner = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-bold text-primary ring-2 ring-primary/40",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label="Profile"
    >
      {avatarUrl ? (
        // Plain <img> is fine here; Next/Image would need a remotePatterns config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        initials
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
