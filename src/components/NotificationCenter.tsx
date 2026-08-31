import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { enhancedNotificationsAPI, notificationsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, filter]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await enhancedNotificationsAPI.getNotificationsWithDetails(user.id, 100);
      setNotifications(data);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = notifications.filter((n) => !n.is_read);
    } else if (filter === "read") {
      filtered = notifications.filter((n) => n.is_read);
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await enhancedNotificationsAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await enhancedNotificationsAPI.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    try {
      await Promise.all(notifications.map((n) => enhancedNotificationsAPI.deleteNotification(n.id)));
      setNotifications([]);
    } catch (err) {
      console.error("Error deleting all:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return "📅";
      case "message":
        return "💬";
      case "review":
        return "⭐";
      case "verification":
        return "✓";
      case "payment":
        return "💳";
      default:
        return "🔔";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-100 text-blue-800";
      case "message":
        return "bg-purple-100 text-purple-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "verification":
        return "bg-green-100 text-green-800";
      case "payment":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications Center</CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "All notifications read"}
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>

            {["all", "unread", "read"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {tab === "unread"
                        ? "No unread notifications"
                        : tab === "read"
                        ? "No read notifications"
                        : "No notifications yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                          !notif.is_read ? "bg-muted/30 border-primary/30" : ""
                        }`}
                      >
                        <div className="flex gap-4">
                          <span className="text-2xl">{getNotificationIcon(notif.type)}</span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <p className="font-medium">{notif.message}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge className={getTypeColor(notif.type)}>
                                    {notif.type}
                                  </Badge>
                                  {!notif.is_read && (
                                    <Badge variant="outline">Unread</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex gap-1">
                            {!notif.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notif.id)}
                                title="Mark as read"
                              >
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notif.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {notifications.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              className="w-full gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Notifications
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
