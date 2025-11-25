import { Quote } from 'lucide-react';

interface MemorialQuoteProps {
  quote: string;
  attribution?: string;
}

export default function MemorialQuote({ quote, attribution }: MemorialQuoteProps) {
  if (!quote) return null;

  return (
    <div 
      className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      <div className="mb-4">
        <Quote className="w-8 h-8" style={{ color: '#2DB5A8' }} />
      </div>
      
      <blockquote 
        className="text-xl md:text-2xl lg:text-3xl italic leading-relaxed mb-4 px-4"
        style={{
          fontFamily: "'Pinyon Script', cursive",
          color: '#2d5a57',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          lineHeight: '1.6',
          fontWeight: '400'
        }}
      >
        "{quote}"
      </blockquote>
      
      {attribution && (
        <cite 
          className="not-italic text-sm font-medium"
          style={{ 
            color: '#2DB5A8',
            fontFamily: 'Georgia, serif'
          }}
        >
          — {attribution}
        </cite>
      )}
    </div>
  );
}
