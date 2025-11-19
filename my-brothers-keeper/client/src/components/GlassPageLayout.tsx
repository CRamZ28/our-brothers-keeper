import { PageHeader } from "./PageHeader";
import { ReactNode } from "react";

interface GlassPageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string | ReactNode;
  actions?: ReactNode;
}

export function GlassPageLayout({ 
  children, 
  showHeader = true,
  title,
  actions 
}: GlassPageLayoutProps) {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto min-w-0">
      {showHeader && <PageHeader />}
      
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 min-w-0">
          {title && (
            <h1 className="text-2xl font-bold text-foreground break-words min-w-0">
              {typeof title === 'string' ? title : title}
            </h1>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      
      <div className="space-y-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
