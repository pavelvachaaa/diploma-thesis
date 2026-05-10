import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { trackUmamiEvent } from "@/lib/analytics/umami";

interface JobSearchProps {
  onSearch: (search: string) => void;
  initialSearch?: string;
  analyticsContext?: {
    classification?: string;
    location?: string;
    role?: string;
    contractType?: string;
  };
}

export function JobSearch({ onSearch, initialSearch = '', analyticsContext }: JobSearchProps) {
  const [search, setSearch] = useState(initialSearch);

  // Update search input when initialSearch prop changes
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackUmamiEvent("job_search_submit", {
      had_query: Boolean(search.trim()),
      classification: analyticsContext?.classification,
      location: analyticsContext?.location,
      role: analyticsContext?.role,
      contract_type: analyticsContext?.contractType,
    });
    onSearch(search);
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Název pozice, klíčová slova nebo společnost"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" className="btn-cta">
          Hledat
        </Button>
      </form>
    </div>
  );
}
