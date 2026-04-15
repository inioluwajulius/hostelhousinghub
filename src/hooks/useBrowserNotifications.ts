import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that listens for new notifications and shows browser push notifications.
 * Call this once in a top-level component (e.g. App or a layout wrapper).
 */
export const useBrowserNotifications = () => {
  const { user } = useAuth();
  const permissionRequested = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Request permission once
    if (!permissionRequested.current && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
      permissionRequested.current = true;
    }

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel("browser-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as any;
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notif.title || "UniStay", {
              body: notif.message,
              icon: "/favicon.ico",
              tag: notif.id, // Prevent duplicate notifications
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
