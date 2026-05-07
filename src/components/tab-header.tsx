import { ProfileBadge } from "@/components/profile-badge";
import { RotatingPhrase } from "@/components/rotating-phrase";

interface TabHeaderProps {
  avatarUrl: string | null;
  initials: string;
  /** Display name — rendered as `Hey, {name}.` */
  name: string;
  /** Optional second line — typically the date or page-specific context. */
  subtitle?: string;
}

/**
 * Unified header used on every tab. Format is fixed:
 *   "Hey, {name}. {rotating phrase}"
 * where the phrase is picked once per browser session and held in
 * sessionStorage so all tabs show the same line until the PWA is
 * closed. Avatar links to /me.
 */
export function TabHeader({
  avatarUrl,
  initials,
  name,
  subtitle,
}: TabHeaderProps) {
  return (
    <div className="flex items-start gap-3 pt-4">
      <ProfileBadge avatarUrl={avatarUrl} initials={initials} size={48} />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-tight text-primary">
          Hey, {name}. <RotatingPhrase />
        </p>
        {subtitle && (
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
