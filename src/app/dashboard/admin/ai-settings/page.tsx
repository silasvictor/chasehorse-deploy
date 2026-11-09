"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AISettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("");
  const [message, setMessage] = useState({ text: "", type: "info" as "info" | "error" | "success" });

  useEffect(() => {
    fetch("/api/admin/ai-settings")
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          setSettings(data);
          setProvider(data.activeProvider || "gemini");
          setModel(data.activeModel || "");
        } else {
          setMessage({ text: data.error || "Failed to load settings", type: "error" });
        }
        setLoading(false);
      })
      .catch((err) => {
        setMessage({ text: err instanceof Error ? err.message : "Network error", type: "error" });
        setLoading(false);
      });
  }, []);

  async function save() {
    setMessage({ text: "", type: "info" });
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSettings({ ...settings, activeProvider: provider, activeModel: model });
      setMessage({ text: "AI provider settings saved.", type: "success" });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to save settings", type: "error" });
    }
  }

  const providers: { id: string; label: string; env: string }[] = [
    { id: "gemini", label: "Google Gemini", env: "GEMINI_API_KEY" },
    { id: "openai", label: "OpenAI", env: "OPENAI_API_KEY" },
    { id: "anthropic", label: "Anthropic", env: "ANTHROPIC_API_KEY" },
  ];

  if (loading) return <div className="p-4 text-slate-text">Loading settings…</div>;

  const configured = settings?.providers?.find((p: any) => p.provider === provider)?.configured || false;

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="flex items-center gap-2">
          <Settings size={20} />
          <CardTitle className="text-2xl font-bold">AI provider settings</CardTitle>
        </CardHeader>
        <CardDescription>
          Select the active AI provider and model. Changes take effect immediately
          for the AI Operations Assistant and document intelligence.
        </CardDescription>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setModel(settings?.providers?.find((p: any) => p.provider === e.target.value)?.model || "");
              }}
              className="border border-border-grey rounded-md bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gemini-1.5-flash-latest"
            />
            <p className="text-xs text-slate-text">
              Select a model based on current availability, cost, and latency.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${configured ? "bg-success-teal" : "bg-slate-400"}`} />
            <span className="text-sm">
              {configured ? "Provider configured" : "Provider not configured — set its API key in .env"} ({providers.find((p) => p.id === provider)?.env})
            </span>
          </div>
          <Button onClick={save} disabled={!configured}>
            Save provider &amp; model
          </Button>
          {!configured && (
            <p className="text-xs text-slate-text mt-2">
              Cannot activate an unconfigured provider. Add the API key to your
              <code className="font-mono text-xs">.env</code> file and restart the server.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {settings?.providers?.map((p: any) => (
              <div key={p.provider} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.configured ? "bg-success-teal" : "bg-slate-400"}`} />
                  <span className="text-slate-text">{p.provider.charAt(0).toUpperCase() + p.provider.slice(1)}</span>
                </div>
                <Badge variant="default" className={p.configured ? "bg-green-50 text-success-teal border-green-200" : "bg-slate-100 text-slate-text border-slate-200"}>
                  {p.configured ? "Configured" : "Not configured"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "error" ? "bg-red-50 text-error-red border border-red-100" : "bg-green-50 text-success-teal border border-green-100"}`}>
          {message.text}
        </div>
      )}

      <div className="p-4 rounded-lg border border-border-grey bg-bg-cloud text-sm">
        <p className="font-semibold text-navy-midnight mb-2">Security notes</p>
        <ul className="list-disc list-inside text-slate-text space-y-1">
          <li>API keys are stored server-side in environment variables only.</li>
          <li>Keys are never exposed to the browser or included in API responses.</li>
          <li>The application starts even if no AI provider is configured.</li>
          <li>An administrator must explicitly activate a provider; there is no silent fallback.</li>
        </ul>
      </div>
    </div>
  );
}
