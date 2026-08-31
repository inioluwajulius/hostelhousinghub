import { useEffect, useState } from "react";
import { DatabaseZap, ServerCrash } from "lucide-react";

export default function DatabaseStatusOverlay() {
  const [isDown, setIsDown] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDatabaseHealth = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
          setIsDown(true);
          setIsChecking(false);
          return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: "GET",
          headers: {
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
          }
        });

        if (response.status === 503 || response.status === 502) {
          setIsDown(true);
        } else {
          setIsDown(false);
        }
      } catch (error) {
        console.error("Database health check failed:", error);
        setIsDown(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkDatabaseHealth();
  }, []);

  if (isChecking || !isDown) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-4 text-center">
      <div className="bg-card p-8 rounded-2xl shadow-elevated border border-border max-w-md w-full animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6 text-destructive">
          <ServerCrash size={64} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-3 text-foreground">
          System Maintenance
        </h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          The database is currently paused or unreachable. We are performing scheduled maintenance or the system is asleep.
          Please try again later or contact the administrator.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity w-full flex items-center justify-center gap-2"
        >
          <DatabaseZap size={18} />
          Retry Connection
        </button>
      </div>
    </div>
  );
}
