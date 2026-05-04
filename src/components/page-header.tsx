import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  className,
  action,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between border-b border-border bg-background/80 px-4 py-4 backdrop-blur",
        className,
      )}
      style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
