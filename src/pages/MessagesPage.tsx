import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPartnerId = searchParams.get("with") || "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>(initialPartnerId);
  const [selectedPartnerName, setSelectedPartnerName] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (selectedPartner) fetchMessages(selectedPartner);
  }, [selectedPartner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (msg.sender_id === selectedPartner || msg.receiver_id === selectedPartner) {
            setMessages((prev) => [...prev, msg]);
          }
          fetchConversations();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedPartner]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: allMsgs } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMsgs) { setLoading(false); return; }

    const convMap = new Map<string, Conversation>();
    allMsgs.forEach((m: any) => {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const partnerName = m.sender_id === user.id
        ? (m.receiver as any)?.full_name || "User"
        : (m.sender as any)?.full_name || "User";
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: m.content,
          lastTime: m.created_at,
          unread: (!m.read_at && m.receiver_id === user.id) ? 1 : 0,
        });
      } else {
        const existing = convMap.get(partnerId)!;
        if (!m.read_at && m.receiver_id === user.id) existing.unread++;
      }
    });

    const convs = Array.from(convMap.values());
    setConversations(convs);

    if (initialPartnerId && !selectedPartnerName) {
      const found = convs.find(c => c.partnerId === initialPartnerId);
      if (found) setSelectedPartnerName(found.partnerName);
    }

    setLoading(false);
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // Mark unread as read
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", user.id)
      .eq("sender_id", partnerId)
      .is("read_at", null);
  };

  const sendMessage = async () => {
    if (!user || !selectedPartner || !newMessage.trim()) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedPartner,
      content: newMessage.trim(),
    });
    if (error) toast.error(error.message);
    else setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-display text-2xl font-bold">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Conversation list */}
          <div className="bg-card rounded-xl border overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.partnerId}
                  onClick={() => { setSelectedPartner(c.partnerId); setSelectedPartnerName(c.partnerName); }}
                  className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${selectedPartner === c.partnerId ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {c.partnerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{c.partnerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                      </div>
                    </div>
                    {c.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unread}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="md:col-span-2 bg-card rounded-xl border flex flex-col">
            {selectedPartner ? (
              <>
                <div className="px-4 py-3 border-b">
                  <p className="font-semibold text-foreground">{selectedPartnerName}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.sender_id === user?.id
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}>
                        {m.content}
                        <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MessagesPage;
