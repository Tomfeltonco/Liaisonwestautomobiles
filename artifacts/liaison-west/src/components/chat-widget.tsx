import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateChatRoom, useSendChatMessage, useGetChatMessages,
  getGetChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Loader2, Bot, User as UserIcon, Minimize2 } from "lucide-react";

type ChatMessage = {
  id: number; roomId: number; senderId: number;
  senderRole: string; senderName: string; message: string; createdAt: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function ChatWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const createRoom = useCreateChatRoom({
    mutation: {
      onSuccess: (room) => {
        setRoomId(room.id);
      },
    },
  });

  const sendMsg = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        setText("");
        if (roomId) qc.invalidateQueries({ queryKey: getGetChatMessagesQueryKey(roomId) });
      },
    },
  });

  const { data: messagesData } = useGetChatMessages(roomId ?? 0, {
    query: {
      queryKey: getGetChatMessagesQueryKey(roomId ?? 0),
      enabled: !!roomId && isOpen,
      refetchInterval: isOpen && roomId ? 3000 : false,
    },
  });

  const messages = (messagesData ?? []) as ChatMessage[];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Only show for regular customers
  if (!user || user.role !== "user") return null;

  const handleOpen = () => {
    setIsOpen(true);
    if (!roomId) {
      createRoom.mutate({ data: {} });
    }
  };

  const handleSend = () => {
    if (!text.trim() || !roomId || sendMsg.isPending) return;
    sendMsg.mutate({ id: roomId, data: { message: text.trim() } });
  };

  const hasAgentReply = messages.some((m) => m.senderRole === "agent" || m.senderRole === "admin");

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="w-[360px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white text-black flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">Liaison West Support</p>
                <p className="text-[11px] text-black/50 mt-0.5">
                  {roomId ? "Connected to concierge" : "Connecting..."}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-60 transition-opacity">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {createRoom.isPending && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
              </div>
            )}
            {!createRoom.isPending && messages.length === 0 && roomId && (
              <div className="flex justify-center">
                <span className="text-[11px] text-white/25 px-3 py-1 bg-white/5 rounded-full">
                  Send a message to begin the conversation
                </span>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderRole === "user";
              const isSystem = msg.senderRole === "system";
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[11px] text-white/25 px-3 py-1 bg-white/5 rounded-full">
                      {msg.message}
                    </span>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? "bg-white" : "bg-white/10"}`}>
                    {isMe
                      ? <UserIcon className="w-3.5 h-3.5 text-black" />
                      : <Bot className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`max-w-[240px] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-white text-black rounded-tr-sm"
                        : "bg-white/8 text-white rounded-tl-sm border border-white/10"
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-white/25">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/8 flex-shrink-0 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              disabled={!roomId || sendMsg.isPending}
              className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!text.trim() || !roomId || sendMsg.isPending}
              className="h-10 w-10 bg-white text-black hover:bg-white/90 rounded-xl flex-shrink-0"
            >
              {sendMsg.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && hasAgentReply && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
        )}
      </button>
    </div>
  );
}
