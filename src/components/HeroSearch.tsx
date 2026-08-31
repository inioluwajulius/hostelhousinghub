import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface HeroSearchProps {
  compact?: boolean;
}

const HeroSearch = ({ compact }: HeroSearchProps) => {
  const [university, setUniversity] = useState("");
  const [universities, setUniversities] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.from("universities").select("*").order("name")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading universities:", error);
          setUniversities([]);
        } else {
          setUniversities(data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load universities:", err);
        setUniversities([]);
      });
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (university) params.set("university", university);
    router.push(`/search?${params.toString()}`);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-card rounded-full shadow-card border px-2 py-1.5 max-w-xl w-full">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <select value={university} onChange={(e) => setUniversity(e.target.value)} className="flex-1 bg-transparent text-sm text-foreground outline-none font-body">
          <option value="">Search by university...</option>
          {universities.map((u) => (<option key={u.id} value={u.short_name}>{u.name}</option>))}
        </select>
        <Button size="sm" className="rounded-full px-4" onClick={handleSearch}>Search</Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-hero p-2 max-w-2xl w-full">
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <select value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full bg-transparent text-foreground outline-none font-body text-sm">
            <option value="">Select your university...</option>
            {universities.map((u) => (<option key={u.id} value={u.short_name}>{u.name} ({u.short_name})</option>))}
          </select>
        </div>
        <Button size="lg" className="rounded-xl px-8 font-semibold text-sm" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />Find Housing
        </Button>
      </div>
    </div>
  );
};

export default HeroSearch;
