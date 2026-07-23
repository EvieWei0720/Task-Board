import { useState, useCallback } from "react";

export interface AgentAction {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BoardContext {
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee_id: string | null;
  }[];
  members: { id: string; name: string }[];
  labels: { id: string; name: string }[];
}

export function useAgent(getContext: () => BoardContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);
      const history = [
        ...messages,
        { role: "user" as const, content: text.trim() },
      ];
      setMessages(history);
      setLoading(true);

      try {
        console.log("[agent] sending fetch...");
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history, context: getContext() }),
          signal: AbortSignal.timeout(30000),
        });
        console.log("[agent] fetch done, status:", res.status);
        const data = await res.json();
        console.log("[agent response]", data);
        if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));

        const message = data.choices?.[0]?.message;
        if (!message) throw new Error("No response from AI");

        const toolCalls: { id: string; function: { name: string; arguments: string } }[] =
          message.tool_calls ?? [];
        const actions: AgentAction[] = toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        }));

        if (message.content) {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: message.content },
          ]);
        } else if (actions.length === 0) {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: "I'm not sure how to help with that." },
          ]);
        }
        setPending(actions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [messages, getContext],
  );

  const resolvePending = useCallback((summary: string) => {
    setMessages((m) => [...m, { role: "assistant", content: summary }]);
    setPending([]);
  }, []);

  return { messages, pending, loading, error, send, resolvePending };
}
