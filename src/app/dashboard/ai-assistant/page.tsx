"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, RotateCw, Copy, X, Bot, AlertCircle, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

const SUGGESTED = [
  "Summarize today's pending inspections.",
  "Find inventory records with discrepancies.",
  "Summarize the outstanding POD documents.",
  "Generate a draft warehouse inspection report.",
  "Which tasks are overdue?",
  "Explain the most common quality issues in these records.",
];

// Demo responses when no AI provider is configured
const DEMO_RESPONSES: Record<string, string> = {
  "summarize today's pending inspections":
    "Demo mode: I can see you have pending inspections scheduled for today. In a live environment with Gemini configured, I would pull real-time data from your assignments and inspections tables. To enable live AI responses, please configure GEMINI_API_KEY in your .env file and activate Gemini in Admin → AI Provider Settings.",
  "find inventory records with discrepancies":
    "Demo mode: Inventory discrepancy tracking is available in the Stock Discrepancies section. Live AI analysis would query your inventory_items and stock_discrepancies tables to flag items where counted quantity differs from recorded quantity. Configure an AI provider to enable this.",
  "summarize the outstanding pod documents":
    "Demo mode: POD documents in pending status can be reviewed in the POD & Documents section. With an AI provider configured, I could extract key fields from your uploaded POD files and summarize compliance gaps.",
  "generate a draft warehouse inspection report":
    "Demo mode: Draft report generation is available in the Reports section. Once you configure an AI provider, I can generate structured draft reports from your actual inspection records for your review.",
  "which tasks are overdue":
    "Demo mode: Overdue task tracking is available in the Tasks section. Live AI would query your tasks table filtered by overdue status and priority.",
  "explain the most common quality issues in these records":
    "Demo mode: Quality inspection records can be reviewed in the Quality Records section. With AI configured, I could analyze failure patterns and severity levels across your inspection data.",
};

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return `Demo mode: I received your message: "${message}". To get real AI-powered answers about your logistics data, please configure an AI provider (Gemini, OpenAI, or Anthropic) in Admin → AI Provider Settings. In demo mode, I can only provide placeholder responses.`;
}

export default function AIAssistantPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    provider: string;
  } | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    loadConversations();
    checkProvider();
  }, []);

  async function loadConversations() {
    try {
      const convRes = await fetch("/api/ai/conversations");
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch {
      // conversations endpoint may not exist; start fresh
    }
  }

  async function checkProvider() {
    try {
      const res = await fetch("/api/admin/ai-settings");
      if (res.ok) {
        const data = await res.json();
        setProviderStatus({
          configured: data.providers?.some((p: any) => p.configured) ?? false,
          provider: data.activeProvider || "none",
        });
        setDemoMode(!(data.providers?.some((p: any) => p.configured) ?? false));
      } else {
        setDemoMode(true);
      }
    } catch {
      setDemoMode(true);
      setProviderStatus({ configured: false, provider: "none" });
    }
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/messages?conversationId=${encodeURIComponent(id)}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function newConversation() {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    setError(null);

    const optimistic: any = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setLoading(true);
    scrollToBottom();

    try {
      if (demoMode) {
        // Simulated AI response in demo mode
        await new Promise((r) => setTimeout(r, 1500));
        const responseText = getDemoResponse(text);
        const demoResponse: any = {
          id: "temp-" + (Date.now() + 1),
          role: "assistant",
          content: responseText,
          createdAt: new Date().toISOString(),
          provider: "demo",
          model: "demo-mode",
        };
        setMessages((prev) =>
          [...prev.filter((m) => m.id !== optimistic.id), demoResponse],
        );
        if (!activeId) setActiveId("demo-conversation");
      } else {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, conversationId: activeId || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI request failed");
        setMessages((prev) =>
          [...prev.filter((m) => m.id !== optimistic.id), data],
        );
        if (!activeId) setActiveId(data.conversationId);
        loadConversations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const configured = providerStatus?.configured === true;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Conversation sidebar */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-border-grey bg-white">
        <div className="p-4 border-b border-border-grey flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              demoMode ? "bg-amber-50 text-warning-amber" : "bg-blue-50 text-blue-600"
            }`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-navy-midnight">AI Assistant</span>
              {demoMode && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs bg-amber-100 text-warning-amber border border-amber-200">
                  Demo
                </span>
              )}
            </div>
          </div>
          <Button size="sm" onClick={newConversation}>
            <RotateCw size={16} className="mr-2" /> New
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-slate-text px-3">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeId === c.id ? "bg-blue-50 text-blue-600" : "text-slate-text hover:bg-surface-muted"}`}
            >
              <div className="flex-1 truncate">{c.title || "New conversation"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0 flex flex-col bg-bg-cloud relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={messagesEndRef}>
          {loading && (
            <div className="flex items-center gap-2 text-slate-text text-sm italic mb-4">
              <div className="w-3 h-3 rounded-full bg-slate-text animate-pulse" />
              Assistant is typing...
            </div>
          )}
          {messages.length === 0 && !loading && (
            <div className="text-center pt-20 text-slate-text">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium text-navy-midnight mb-2">
                Start a conversation
              </p>
              <p className="text-sm text-slate-text mb-6 max-w-xs mx-auto">
                Ask about inspections, inventory, PODs, tasks, or quality records.
              </p>
              <div className="grid gap-2 w-full max-w-md mx-auto">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      sendMessage();
                    }}
                    className="text-left p-3 rounded-lg border border-border-grey bg-white hover:bg-blue-50 text-sm text-slate-text hover:text-blue-600 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={m.id}
              className={`max-w-[85%] ${
                m.role === "USER" ? "ml-auto" : "mr-auto"
              } mb-4 group`}
            >
              <div
                className={`inline-block p-3 rounded-2xl text-sm shadow-sm ${
                  m.role === "USER"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-border-grey text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "ASSISTANT" && (
                <button
                  onClick={() => navigator.clipboard.writeText(m.content)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy response"
                >
                  <Copy size={14} />
                </button>
              )}
              {m.provider && m.provider !== "demo" && (
                <span className="text-[10px] text-slate-text ml-1 opacity-60">
                  {m.provider} • {m.model}
                </span>
              )}
            </div>
          ))}
          {error && (
            <div className="ml-auto max-w-[85%] p-3 rounded-2xl bg-red-50 border border-red-100 text-error-red text-sm mb-4">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-border-grey bg-white p-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                demoMode
                  ? "Type a question (demo mode responses)…"
                  : "Ask about inspections, inventory, PODs, or tasks…"
              }
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
          <p className="text-[10px] text-slate-text mt-2">
            {demoMode
              ? "Demo mode: Responses are simulated. Configure an AI provider for live answers."
              : "AI responses are drafts. Review before using in official records."}
          </p>
        </div>
      </div>
    </div>
  );
}
