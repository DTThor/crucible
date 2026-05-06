import { ProfileBadge } from "@/components/profile-badge";

interface TabHeaderProps {
  avatarUrl: string | null;
  initials: string;
  /** Big primary line, e.g. "Good afternoon, Dylan". */
  greeting: string;
  /** Optional second line — typically the date or page-specific context. */
  subtitle?: string;
}

/**
 * Unified header used on every tab. Avatar links to /me. Replaces the
 * older sticky `<PageHeader>` on the four primary tabs so content can
 * start higher on the page.
 */
export function TabHeader({
  avatarUrl,
  initials,
  greeting,
  subtitle,
}: TabHeaderProps) {
  return (
    <div className="flex items-start gap-3 pt-4">
      <ProfileBadge avatarUrl={avatarUrl} initials={initials} size={48} />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-tight text-primary">
          {greeting}
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
