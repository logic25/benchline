'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paperclip, Send, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Message, MessageAttachment } from '@/lib/types';

interface MessageThreadProps {
  appearanceId: string;
  currentUserId: string;
}

const ATTACHMENTS_BUCKET = 'appearance-attachments';

export function MessageThread({ appearanceId, currentUserId }: MessageThreadProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<MessageAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('appearance_id', appearanceId)
        .order('created_at', { ascending: true });
      if (active && data) setMessages(data as Message[]);
    }
    load();

    const channel = supabase
      .channel(`messages:${appearanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `appearance_id=eq.${appearanceId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [appearanceId, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${currentUserId}/${appearanceId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(ATTACHMENTS_BUCKET)
          .upload(path, file, { contentType: file.type || 'application/octet-stream' });
        if (upErr) {
          setError(upErr.message);
          continue;
        }
        setPending((prev) => [
          ...prev,
          { path, name: file.name, size: file.size, content_type: file.type || 'application/octet-stream' },
        ]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removePending(path: string) {
    setPending((prev) => prev.filter((p) => p.path !== path));
  }

  async function handleSend() {
    if (sending) return;
    if (text.trim().length === 0 && pending.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appearanceId, body: text.trim(), attachments: pending }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Could not send');
        return;
      }
      // Optimistically add (realtime will dedupe on id).
      if (json.message) {
        setMessages((prev) => (prev.some((m) => m.id === json.message.id) ? prev : [...prev, json.message]));
      }
      setText('');
      setPending([]);
    } finally {
      setSending(false);
    }
  }

  async function attachmentUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(path, 60 * 10);
    return data?.signedUrl ?? null;
  }

  async function openAttachment(path: string) {
    const url = await attachmentUrl(path);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card>
      <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((a) => (
                        <button
                          key={a.path}
                          type="button"
                          onClick={() => openAttachment(a.path)}
                          className="flex items-center gap-1 text-xs underline underline-offset-2"
                        >
                          <Paperclip className="h-3 w-3" />{a.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className={`mt-1 text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {format(new Date(m.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <span key={p.path} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs">
                <Paperclip className="h-3 w-3" />{p.name}
                <button type="button" onClick={() => removePending(p.path)} aria-label="Remove attachment">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            rows={2}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach file">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="button" onClick={handleSend} disabled={sending || uploading} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
