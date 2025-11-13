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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {showHeader && <PageHeader />}
      
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          {title && (
            <h1 className="text-2xl font-bold text-foreground">
              {typeof title === 'string' ? title : title}
            </h1>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
