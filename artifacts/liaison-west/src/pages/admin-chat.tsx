import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  useListChatRooms, useGetChatMessages, useSendChatMessage, useUpdateChatRoom,
  getListChatRoomsQueryKey, getGetChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Bot, User as UserIcon, ShieldCheck, Circle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type ChatRoom = { id: number; userId: number; agentId: number | null; status: string; subject: string; lastMessageAt: string; userName?: string; userEmail?: string };
type ChatMessage = { id: number; roomId: number; senderId: number; senderRole: string; senderName: string; message: string; createdAt: string };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  assigned: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  closed: "bg-white/10 text-white/40 border-white/10",
};

export default function AdminChat() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useListChatRooms({
    query: { queryKey: getListChatRoomsQueryKey(), refetchInterval: 5000 },
  });

  const { data: messages = [] } = useGetChatMessages(selectedRoom?.id ?? 0, {
    query: {
      queryKey: getGetChatMessagesQueryKey(selectedRoom?.id ?? 0),
      enabled: !!selectedRoom,
      refetchInterval: selectedRoom ? 3000 : false,
    },
  }) as { data: ChatMessage[] };

  const sendMsg = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        setText("");
        if (selectedRoom) qc.invalidateQueries({ queryKey: getGetChatMessagesQueryKey(selectedRoom.id) });
        qc.invalidateQueries({ queryKey: getListChatRoomsQueryKey() });
      },
    },
  });

  const updateRoom = useUpdateChatRoom({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListChatRoomsQueryKey() });
        toast.success("Room updated");
      },
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim() || !selectedRoom) return;
    sendMsg.mutate({ id: selectedRoom.id, data: { message: text.trim() } });
  };

  const handleClose = (roomId: number) => {
    updateRoom.mutate({ id: roomId, data: { status: "closed" } });
    if (selectedRoom?.id === roomId) setSelectedRoom(null);
  };

  return (
    <AdminLayout title="Chat Support">
      <div className="flex gap-0 h-[calc(100vh-180px)] bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">

        {/* Rooms list */}
        <div className="w-72 flex-shrink-0 border-r border-white/8 flex flex-col">
          <div className="p-4 border-b border-white/8">
            <p className="text-white font-semibold text-sm">{(rooms as ChatRoom[]).length} Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
            ) : (rooms as ChatRoom[]).length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">No conversations yet</div>
            ) : (
              (rooms as ChatRoom[]).map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-colors hover:bg-white/5 ${selectedRoom?.id === room.id ? "bg-white/8" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-white text-sm font-medium truncate">{room.userName || "Customer"}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[room.status] ?? ""} flex-shrink-0`}>
                      {room.status}
                    </Badge>
                  </div>
                  <p className="text-white/40 text-xs truncate">{room.subject}</p>
                  <p className="text-white/25 text-[10px] mt-1">{formatDate(room.lastMessageAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedRoom ? (
          <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{selectedRoom.userName || "Customer"}</p>
                <p className="text-white/40 text-xs">{selectedRoom.userEmail} · Room #{selectedRoom.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[selectedRoom.status] ?? ""}`}>
                  {selectedRoom.status}
                </Badge>
                {selectedRoom.status !== "closed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClose(selectedRoom.id)}
                    className="text-white/40 hover:text-white text-xs h-7"
                  >
                    Close Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              {(messages as ChatMessage[]).map((msg) => {
                const isStaff = msg.senderRole === "admin" || msg.senderRole === "agent";
                const isSystem = msg.senderRole === "system";
                if (isSystem) return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[11px] text-white/25 px-3 py-1 bg-white/5 rounded-full">{msg.message}</span>
                  </div>
                );
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isStaff ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isStaff ? "bg-white" : "bg-white/10"}`}>
                      {isStaff
                        ? <ShieldCheck className="w-4 h-4 text-black" />
                        : <UserIcon className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`flex flex-col gap-1 ${isStaff ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-white/30">{msg.senderName}</span>
                      <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isStaff
                          ? "bg-white text-black rounded-tr-sm"
                          : "bg-white/8 text-white border border-white/10 rounded-tl-sm"
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-white/20">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {selectedRoom.status !== "closed" ? (
              <div className="px-5 py-3 border-t border-white/8 flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={`Reply as ${user?.role === "admin" ? "Admin" : "Agent"}...`}
                  className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!text.trim() || sendMsg.isPending}
                  className="h-10 w-10 bg-white text-black hover:bg-white/90 rounded-xl flex-shrink-0"
                >
                  {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div className="px-5 py-3 border-t border-white/8 text-center text-white/30 text-sm">
                This conversation is closed.
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
