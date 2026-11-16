import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, MessageSquare, Send, Inbox } from 'lucide-react';
import { useConfirm } from '@/components/feedback/ConfirmDialog';
import { LoadingState, TableSkeletonRows } from '@/components/feedback/LoadingState';
import { friendlyError } from '@/lib/errors';
import { PageHead } from '@/components/seo/PageHead';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const statusVariant = (status: string) =>
  status === 'resolved' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline';

const AdminSupportPage: React.FC = () => {
  const confirm = useConfirm();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replies, setReplies] = useState<Record<string, string>>({});

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, user_id, shop_id, name, email, phone, category, subject, message, status, admin_response, responded_at, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tickets as any[]).filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesSearch =
        !q ||
        [t.subject, t.message, t.name, t.email, t.phone].some((v: string) =>
          (v || '').toLowerCase().includes(q)
        );
      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const counts = useMemo(() => {
    const list = tickets as any[];
    return {
      total: list.length,
      open: list.filter((t) => t.status === 'open').length,
      inProgress: list.filter((t) => t.status === 'in_progress').length,
      resolved: list.filter((t) => t.status === 'resolved').length,
    };
  }, [tickets]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: friendlyError(error, error.message), variant: 'destructive' });
      return;
    }
    toast({ title: 'Status updated' });
    refresh();
  };

  const sendReply = async (id: string) => {
    const text = (replies[id] || '').trim();
    if (!text) return;
    const { error } = await supabase
      .from('support_tickets')
      .update({
        admin_response: text,
        responded_at: new Date().toISOString(),
        responded_by: user?.id ?? null,
        status: 'resolved',
      })
      .eq('id', id);
    if (error) {
      toast({ title: 'Reply failed', description: friendlyError(error, error.message), variant: 'destructive' });
      return;
    }
    setReplies((prev) => ({ ...prev, [id]: '' }));
    toast({ title: 'Reply sent', description: 'The user will see your response in Help & Contact.' });
    refresh();
  };

  const deleteTicket = async (id: string) => {
    if (!(await confirm({ title: 'Delete this query?', description: 'The customer message will be permanently removed.', destructive: true }))) return;
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: friendlyError(error, error.message), variant: 'destructive' });
      return;
    }
    toast({ title: 'Query deleted' });
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHead title="Support Queries" description="Admin inbox for user questions and complaints." path="/admin/support" />
      <AdminNav />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Queries &amp; Complaints</h1>
        <p className="text-muted-foreground text-sm">Respond to messages sent from the Help &amp; Contact page.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Open', value: counts.open },
          { label: 'In progress', value: counts.inProgress },
          { label: 'Resolved', value: counts.resolved },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="h-5 w-5" /> Inbox
          </CardTitle>
          <CardDescription>Search and filter incoming queries.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Input
              placeholder="Search subject, message, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState label="Loading queries..." className="py-10" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="mx-auto h-10 w-10 mb-3" />
              <p className="text-sm">No queries found.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filtered.map((t: any) => (
                <li key={t.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.name || 'Unknown user'} · {t.email || 'no email'} {t.phone ? `· ${t.phone}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()} · {t.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(t.status)}>{String(t.status).replace('_', ' ')}</Badge>
                      <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => deleteTicket(t.id)} aria-label="Delete query">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-wrap">{t.message}</p>

                  {t.admin_response && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-semibold mb-1">
                        Your reply {t.responded_at ? `· ${new Date(t.responded_at).toLocaleString()}` : ''}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{t.admin_response}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      placeholder="Write a reply to this user..."
                      value={replies[t.id] || ''}
                      onChange={(e) => setReplies((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => sendReply(t.id)} disabled={!(replies[t.id] || '').trim()}>
                      <Send className="mr-2 h-4 w-4" /> Send reply
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupportPage;
