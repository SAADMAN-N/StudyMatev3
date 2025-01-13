import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Send, Bot } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AiTutorChatProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

const defaultMessages: Message[] = [
  {
    id: "1",
    content: "Hello! I'm your AI study buddy. How can I help you today?",
    sender: "ai",
    timestamp: new Date(),
  },
  {
    id: "2",
    content: "Can you help me understand quantum mechanics?",
    sender: "user",
    timestamp: new Date(),
  },
  {
    id: "3",
    content:
      "Of course! Let's start with the basic principles of quantum mechanics...",
    sender: "ai",
    timestamp: new Date(),
  },
];

const AiTutorChat = ({
  messages = defaultMessages,
  onSendMessage = () => {},
  isLoading = false,
}: AiTutorChatProps) => {
  const [inputValue, setInputValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <Card className="flex flex-col h-full bg-background border-none">
      <div className="flex-1 p-4">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {message.sender === "ai" ? (
                    <Avatar className="h-8 w-8 bg-primary">
                      <Bot className="h-4 w-4" />
                    </Avatar>
                  ) : (
                    <Avatar className="h-8 w-8 bg-secondary">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                        alt="User"
                      />
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-50">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your study question..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default AiTutorChat;
