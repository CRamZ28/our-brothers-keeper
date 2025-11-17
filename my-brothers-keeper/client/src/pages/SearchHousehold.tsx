import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Home as HomeIcon, Users } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function SearchHousehold() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: results, isLoading, refetch } = trpc.household.search.useQuery(
    { query: searchQuery },
    { enabled: false }
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
      refetch();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/waves-bg.png')" }}>
      {/* Decorative blur orbs */}
      <div className="fixed w-[600px] h-[600px] rounded-full bg-cyan-400/40 blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="fixed w-[700px] h-[700px] rounded-full bg-emerald-400/35 blur-[120px] top-1/3 right-0 pointer-events-none" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-teal-400/45 blur-[120px] bottom-0 left-1/4 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <GlassCard className="p-12 max-w-3xl w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/obk-emblem.png" alt={APP_TITLE} className="h-12 w-12" />
              <h1 className="text-3xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1a5a56' }}>
                Find a Family
              </h1>
            </div>
            <p className="text-gray-600">
              Search for a family's support page by name
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter family name (e.g., Smith, Johnson)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!searchQuery.trim() || isLoading}
                className="bg-[#2DB5A8] hover:bg-[#2DB5A8]/90 text-white h-12 px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </form>

          {/* Results */}
          {hasSearched && !isLoading && (
            <div>
              {results && results.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Found {results.length} {results.length === 1 ? 'family' : 'families'}
                  </h2>
                  {results.map((household) => (
                    <div
                      key={household.id}
                      className="p-6 rounded-2xl border border-gray-200 bg-white/50 hover:bg-white/70 transition-all cursor-pointer"
                      onClick={() => setLocation(`/${household.slug}`)}
                    >
                      <div className="flex items-center gap-4">
                        {household.photoUrl ? (
                          <img
                            src={household.photoUrl}
                            alt={household.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/50"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#2DB5A8]/20 flex items-center justify-center">
                            <Users className="h-8 w-8 text-[#2DB5A8]" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold" style={{ color: '#1a5a56' }}>
                            {household.name}
                          </h3>
                          {household.description && (
                            <p className="text-gray-600 mt-1 line-clamp-2">
                              {household.description}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="outline"
                          className="border-[#2DB5A8] text-[#2DB5A8] hover:bg-[#2DB5A8]/10"
                        >
                          View Page
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No families found
                  </h3>
                  <p className="text-gray-600">
                    Try a different search term or ask the family to share their link with you
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <HomeIcon className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              onClick={() => setLocation("/onboarding")}
              className="bg-[#2DB5A8] hover:bg-[#2DB5A8]/90 text-white"
            >
              Create New Family Page
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
