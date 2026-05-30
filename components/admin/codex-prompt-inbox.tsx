"use client";

import { Clipboard, Inbox, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { BuildPromptRecord } from "@/lib/build-prompts";

export function CodexPromptInbox() {
  const [prompts, setPrompts] = useState<BuildPromptRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState("");

  const loadPrompts = useCallback(async () => {
    const response = await fetch("/api/admin/prompts", { cache: "no-store" });

    if (response.ok) {
      const data = (await response.json()) as { prompts: BuildPromptRecord[] };
      setPrompts(data.prompts);
      setSelectedId((current) => current || data.prompts[0]?.id || "");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadPrompts();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [loadPrompts]);

  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedId) ?? prompts[0],
    [prompts, selectedId]
  );

  const copyPrompt = async () => {
    if (!selectedPrompt) return;

    try {
      await navigator.clipboard.writeText(selectedPrompt.prompt);
      setCopyState("Prompt copied.");
    } catch {
      setCopyState("Copy failed. Select the text manually.");
    }
  };

  return (
    <Card className="codex-prompt-inbox">
      <div className="chat-console-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> Codex prompt inbox
          </span>
          <h2>One-shot build prompts from customer orders.</h2>
        </div>
        <StatusIndicator label={loading ? "Loading prompts" : `${prompts.length} generated`} tone={prompts.length ? "good" : "active"} />
      </div>

      {loading ? (
        <div className="portal-loading">
          <Loader2 aria-hidden size={22} />
          <span>Loading generated prompts...</span>
        </div>
      ) : prompts.length ? (
        <div className="prompt-inbox-grid">
          <div className="prompt-list">
            {prompts.map((prompt) => (
              <button
                className={prompt.id === selectedPrompt?.id ? "active" : undefined}
                key={prompt.id}
                onClick={() => {
                  setCopyState("");
                  setSelectedId(prompt.id);
                }}
                type="button"
              >
                <span>
                  <strong>{prompt.serviceName}</strong>
                  <small>{prompt.customerName || prompt.customerEmail}</small>
                </span>
                <span>
                  {prompt.orderReference}
                  <small>{new Date(prompt.createdAt).toLocaleDateString("en-GB")}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="prompt-reader">
            <div className="prompt-reader-top">
              <div>
                <h3>{selectedPrompt?.title}</h3>
                <p>
                  {selectedPrompt?.customerName} - {selectedPrompt?.orderReference}
                </p>
              </div>
              <Button icon={Clipboard} onClick={copyPrompt} type="button" variant="secondary">
                Copy prompt
              </Button>
            </div>
            {copyState ? <p className="helper">{copyState}</p> : null}
            <textarea
              aria-label="Generated Codex one-shot prompt"
              className="textarea prompt-textarea"
              readOnly
              value={selectedPrompt?.prompt ?? ""}
            />
          </div>
        </div>
      ) : (
        <div className="empty-prompt-inbox">
          <Inbox aria-hidden size={26} />
          <p>No prompts yet. The next order, checkout, or custom offer will generate one automatically.</p>
        </div>
      )}
    </Card>
  );
}
