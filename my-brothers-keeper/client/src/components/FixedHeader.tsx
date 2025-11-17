import { ReactNode } from 'react';

interface FixedHeaderProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  zIndex?: number;
}

export function FixedHeader({ 
  children, 
  className = '',
  backgroundColor = 'rgba(255, 255, 255, 0.95)',
  zIndex = 9999 
}: FixedHeaderProps) {
  return (
    <header 
      className={`fixed top-0 left-0 right-0 ${className}`}
      style={{
        backgroundColor,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        zIndex,
      }}
    >
      {children}
    </header>
  );
}
