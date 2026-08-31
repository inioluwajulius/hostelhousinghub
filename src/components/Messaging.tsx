import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ConversationPartner {
  id: string;
  name: string;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt?: string;
}

interface MessagingProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  bookingId?: string;
  onClose?: () => void;
}

const Messaging = ({ recipientId, recipientName, recipientAvatar, bookingId, onClose }: MessagingProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation
  useEffect(() => {
    if (!user) return;
    loadConversation();
    const interval = setInterval(() => loadConversation(), 3000); // Poll for new messages every 3 seconds
    return () => clearInterval(interval);
  }, [user, recipientId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async () => {
    if (!user) return;
    try {
      const conv = await messagesAPI.getConversation(user.id, recipientId);
      const mappedMessages = conv.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        createdAt: msg.created_at,
        readAt: msg.read_at,
      }));
      setMessages(mappedMessages);

      // Mark unread messages as read
      for (const msg of conv) {
        if (msg.receiver_id === user.id && !msg.read_at) {
          await messagesAPI.markAsRead(msg.id).catch((err) => {
            console.error("Error marking message as read:", err);
          });
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      await messagesAPI.sendMessage(user.id, recipientId, newMessage.trim(), bookingId);
      setNewMessage("");
      await loadConversation(); // Reload to get the new message
      toast.success("Message sent");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={recipientAvatar} alt={recipientName} />
          <AvatarFallback>{recipientName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{recipientName}</h3>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderId === user?.id
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.senderId === user?.id ? "opacity-70" : "opacity-60"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t bg-card p-4 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={sending || !newMessage.trim()}
          size="sm"
          className="gap-1"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
};

export default Messaging;
