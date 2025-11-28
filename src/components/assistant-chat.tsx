"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    result?: any;
    error?: string;
  };
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant for the EKO Lead Dashboard. I can help you:\n\n• Check lead statistics and analytics\n• Start scraping jobs\n• Analyze leads with AI\n• Search for specific leads\n• Monitor scraping sessions\n\nWhat would you like to know or do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const executeFunction = async (functionName: string, args: any) => {
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          functionCall: {
            name: functionName,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Function execution failed");
      }

      const data = await response.json();
      return data.result;
    } catch (error: any) {
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Check if the message is asking for a function call
      const lowerInput = currentInput.toLowerCase();
      let functionToCall: string | null = null;
      let functionArgs: any = {};

      // Simple intent detection for function calls
      if (lowerInput.includes("start scraping") || lowerInput.includes("scrape")) {
        const locationMatch = currentInput.match(/(?:for|in|at)\s+([A-Za-z\s,]+(?:,\s*[A-Z]{2})?)/i);
        if (locationMatch) {
          functionToCall = "start_scraping";
          functionArgs = { location: locationMatch[1].trim() };
        }
      } else if (lowerInput.includes("analyze lead") || lowerInput.includes("analyze lead id")) {
        const idMatch = currentInput.match(/(?:lead|id)\s*#?(\d+)/i);
        if (idMatch) {
          functionToCall = "analyze_lead";
          functionArgs = { leadId: parseInt(idMatch[1]) };
        }
      } else if (lowerInput.includes("search leads") || lowerInput.includes("find leads")) {
        functionToCall = "search_leads";
        // Extract search terms
        const queryMatch = currentInput.match(/(?:search|find).*?(?:for|:)?\s*(.+)/i);
        if (queryMatch) {
          functionArgs = { query: queryMatch[1].trim() };
        }
      } else if (lowerInput.includes("lead stats") || lowerInput.includes("statistics") || lowerInput.includes("how many leads")) {
        functionToCall = "get_lead_stats";
      } else if (lowerInput.includes("scraping sessions") || lowerInput.includes("scraping status")) {
        functionToCall = "get_scraping_sessions";
      } else if (lowerInput.includes("analytics") || lowerInput.includes("performance")) {
        functionToCall = "get_analytics";
      } else if (lowerInput.includes("recent activity") || lowerInput.includes("recent leads")) {
        functionToCall = "get_recent_activity";
      }

      // Execute function if detected
      if (functionToCall) {
        const functionMessage: Message = {
          role: "system",
          content: `Executing: ${functionToCall}${Object.keys(functionArgs).length > 0 ? ` with ${JSON.stringify(functionArgs)}` : ""}`,
          timestamp: new Date(),
          functionCall: {
            name: functionToCall,
          },
        };
        setMessages((prev) => [...prev, functionMessage]);

        try {
          const result = await executeFunction(functionToCall, functionArgs);
          
          // Format result for display
          let formattedResult = "";
          if (functionToCall === "get_lead_stats") {
            formattedResult = `📊 Lead Statistics:\n\n` +
              `Total Leads: ${result.totalLeads}\n` +
              `Average Score: ${result.averageScore.toFixed(1)}/100\n\n` +
              `By Priority:\n${Object.entries(result.byPriority).map(([p, c]) => `  • ${p}: ${c}`).join("\n")}\n\n` +
              `Recent Leads:\n${result.recentLeads.slice(0, 3).map((l: any) => `  • ${l.name} (${l.location}) - Score: ${l.score}`).join("\n")}`;
          } else if (functionToCall === "get_scraping_sessions") {
            formattedResult = `🔄 Scraping Sessions:\n\n` +
              result.sessions.map((s: any) => 
                `• ${s.location} - ${s.status} (${s.totalLeadsFound} leads)`
              ).join("\n");
          } else if (functionToCall === "start_scraping") {
            formattedResult = `✅ ${result.message}\n\nSession ID: ${result.sessionId}`;
          } else if (functionToCall === "search_leads") {
            formattedResult = `🔍 Found ${result.count} leads:\n\n` +
              result.leads.slice(0, 10).map((l: any) => 
                `• ${l.name} (${l.location}) - Score: ${l.score}, Priority: ${l.priority}`
              ).join("\n");
          } else if (functionToCall === "analyze_lead") {
            formattedResult = `🤖 Lead Analysis:\n\n` +
              `Score: ${result.analysis.score}/100\n` +
              `Priority: ${result.analysis.priority}\n` +
              `Intent: ${result.analysis.intent}\n` +
              `Action Required: ${result.analysis.actionRequired}\n` +
              `Estimated Revenue: $${result.analysis.estimatedRevenue.min}-$${result.analysis.estimatedRevenue.max}`;
          } else if (functionToCall === "get_analytics") {
            formattedResult = `📈 Analytics:\n\n` +
              `Leads by Source:\n${result.leadsBySource.map((s: any) => `  • ${s.source}: ${s.totalLeads} leads (avg score: ${s.avgScore.toFixed(1)})`).join("\n")}\n\n` +
              `Session Stats:\n  • Total: ${result.sessionStats.totalSessions}\n  • Completed: ${result.sessionStats.completedSessions}\n  • Running: ${result.sessionStats.runningSessions}\n  • Avg Leads/Session: ${result.sessionStats.avgLeadsPerSession.toFixed(1)}`;
          } else if (functionToCall === "get_recent_activity") {
            formattedResult = `⚡ Recent Activity (24h):\n\n` +
              `New Leads: ${result.recentLeads.length}\n` +
              `Active Sessions: ${result.recentSessions.length}\n\n` +
              `Recent Leads:\n${result.recentLeads.slice(0, 5).map((l: any) => `  • ${l.name} (${l.location}) - ${l.priority}`).join("\n")}`;
          } else {
            formattedResult = JSON.stringify(result, null, 2);
          }

          const assistantMessage: Message = {
            role: "assistant",
            content: formattedResult,
            timestamp: new Date(),
            functionCall: {
              name: functionToCall,
              result,
            },
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
          const errorMessage: Message = {
            role: "assistant",
            content: `❌ Error executing ${functionToCall}: ${error.message}`,
            timestamp: new Date(),
            functionCall: {
              name: functionToCall,
              error: error.message,
            },
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // Regular chat completion
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message || "I'm sorry, I couldn't process that.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/60 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-gray-400">Powered by your LLM • Real-time system access</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role !== "user" && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                {message.role === "system" ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : message.role === "system"
                  ? "bg-slate-800/50 text-gray-300 border border-slate-700/60"
                  : "bg-slate-800 text-gray-100 border border-slate-700/60"
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.functionCall && (
                <div className="mt-2 pt-2 border-t border-slate-700/60">
                  <p className="text-xs opacity-70">
                    {message.functionCall.error
                      ? `❌ ${message.functionCall.name} failed`
                      : `✅ ${message.functionCall.name} executed`}
                  </p>
                </div>
              )}
              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-slate-800 text-gray-100 border border-slate-700/60 rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-700/60 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your leads, start scraping, or analyze data..."
            disabled={isLoading}
            rows={1}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700/60 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Try: "Show me lead stats", "Start scraping for Atlanta, GA", "Analyze lead #42"
        </p>
      </div>
    </div>
  );
}

