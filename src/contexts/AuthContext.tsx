import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userRoles: string[];
  profile: any;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  userRoles: [],
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("*, universities(*)").eq("user_id", userId).single(),
      ]);
      
      if (rolesResult.error) {
        console.error("Error fetching user roles:", rolesResult.error);
        setUserRoles([]);
        setUserRole(null);
        return;
      }
      
      if (profileResult.error) {
        console.error("Error fetching user profile:", profileResult.error);
        setProfile(null);
        return;
      }
      
      const roles = rolesResult.data || [];
      const prof = profileResult.data;
      const allRoles = roles.map((r: any) => r.role);
      setUserRoles(allRoles);
      
      let activeRole = null;
      if (typeof window !== "undefined") {
        const storedRole = localStorage.getItem("activeRole");
        if (storedRole && allRoles.includes(storedRole)) {
          activeRole = storedRole;
        }
      }
      
      if (!activeRole) {
        // Prioritize: admin > host > student
        activeRole = allRoles.includes("admin") ? "admin" : allRoles.includes("host") ? "host" : allRoles[0] || null;
      }
      
      setUserRole(activeRole);
      setProfile(prof);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUserRoles([]);
      setUserRole(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setUserRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserRoles([]);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, userRoles, profile, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
