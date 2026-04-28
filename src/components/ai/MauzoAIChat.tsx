import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useShop } from '@/context/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'How many products are remaining in stock?',
  'Which product is selling the most this month?',
  'What is my total revenue this month?',
  'Which products are running low on stock?',
  'How much profit have I made this month?',
  'List items that are out of stock',
];

export const MauzoAIChat: React.FC = () => {
  const { currentShop } = useShop();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading || !currentShop?.id) return;

    const userMsg: Msg = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mauzo-ai`;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        toast.error('Please sign in again.');
        setLoading(false);
        return;
      }
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: next, shopId: currentShop.id }),
      });

      if (resp.status === 429) {
        toast.error('Too many requests. Please wait a moment.');
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error('AI credits exhausted. Add credits to continue.');
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error('Failed to get a response from Mauzo AI.');
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) upsert(delta);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="w-8 h-8 rounded-full bg-biashara-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-biashara-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Mauzo AI</h3>
          <p className="text-xs text-muted-foreground">
            Ask anything about {currentShop?.name ?? 'your shop'}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-full bg-biashara-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="h-7 w-7 text-biashara-primary" />
            </div>
            <h4 className="font-semibold mb-1">Karibu kwa Mauzo AI</h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Your AI business assistant. Ask about stock, sales, top products, profits and more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm p-3 rounded-md border hover:border-biashara-primary hover:bg-biashara-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2 text-sm',
                    m.role === 'user'
                      ? 'bg-biashara-primary text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1">
                      <ReactMarkdown>{m.content || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-4 border-t flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your shop..."
          disabled={loading || !currentShop?.id}
        />
        <Button type="submit" disabled={loading || !input.trim() || !currentShop?.id}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
};
