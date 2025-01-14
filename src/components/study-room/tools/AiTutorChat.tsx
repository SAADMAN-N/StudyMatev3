import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Send, Bot } from "lucide-react";
import { generateAIResponse } from "@/lib/openai";

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

const AiTutorChat = () => {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("openai_api_key")
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI study buddy. How can I help you today? I can help you understand complex topics, solve problems, or answer any questions you have.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant' | 'system', content: string }>>([]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const generateResponse = async (userMessage: string) => {
    if (!apiKey) return "Please connect your OpenAI account first.";
    try {
      const updatedHistory: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];
      setConversationHistory(updatedHistory);

      const response = await generateAIResponse(updatedHistory, apiKey);

      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: response || 'I apologize, but I could not generate a response.' }
      ]);

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await generateResponse(inputValue);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full bg-background border-none">
      {!apiKey ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
          <Bot className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Connect to OpenAI</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            To use the AI Tutor, please connect your OpenAI account by providing your API key.
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const key = formData.get('apiKey') as string;
            if (key) {
              localStorage.setItem("openai_api_key", key);
              setApiKey(key);
            }
          }} className="w-full max-w-sm space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                name="apiKey"
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers.
                Get your API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Dashboard
                </a>
              </p>
            </div>
            <Button type="submit" className="w-full">
              Connect
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4">
            <ScrollArea 
              className="h-[calc(100vh-200px)]"
              ref={scrollAreaRef}
            >
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
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-medium text-secondary-foreground">You</span>
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-50 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>



          <div className="p-4 border-t flex justify-between items-center">
            <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask your study question..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !inputValue.trim() || !apiKey}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => {
                localStorage.removeItem("openai_api_key");
                setApiKey(null);
              }}
            >
              Disconnect OpenAI
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default AiTutorChat;
