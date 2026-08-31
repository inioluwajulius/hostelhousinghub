import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
 * Opens the admin login page. Hidden from regular users — must be known.
 */
export const useAdminShortcut = () => {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        router.push("/admin/login");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
};
