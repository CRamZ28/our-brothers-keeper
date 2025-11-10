import { trpc } from "@/lib/trpc";

interface PageHeaderProps {
  showFamilyName?: boolean;
}

export function PageHeader({ showFamilyName = true }: PageHeaderProps) {
  const { data: household } = trpc.household.getMy.useQuery();

  if (!showFamilyName || !household) {
    return null;
  }

  return (
    <div className="flex justify-center mb-8">
      <div 
        className="px-10 py-5 rounded-full"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      >
        <h1 
          className="text-[36px] font-semibold tracking-wide"
          style={{
            fontFamily: "'Cinzel', serif",
            color: '#0fa9a7',
            filter: 'drop-shadow(0 0 8px rgba(15,169,167,0.7))'
          }}
        >
          {household.name.split(' ').map((word: string, idx: number) => (
            <span key={idx}>
              {idx > 0 && ' '}
              <span className="text-[48px]" style={{ color: '#1fb5b0' }}>
                {word.charAt(0).toUpperCase()}
              </span>
              {word.slice(1).toLowerCase()}
            </span>
          ))}
        </h1>
      </div>
    </div>
  );
}
