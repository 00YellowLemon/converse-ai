import ChatMessage from "@/components/ChatMessage";

export default function ChatPage() {
  return (
    <div className="p-8">
      <ChatMessage message="Hello there!" isUser={false} />
      <ChatMessage message="Hi! How are you?" isUser={true} />
    </div>
  );
}
