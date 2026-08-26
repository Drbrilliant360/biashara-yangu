import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy, Send, Mail, Phone, MessageSquare } from 'lucide-react';
import { PageHead } from '@/components/seo/PageHead';

const CATEGORIES = [
  { value: 'general', label: 'General question' },
  { value: 'technical', label: 'Technical problem' },
  { value: 'billing', label: 'Billing / payment' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'feature', label: 'Feature request' },
];

const statusVariant = (status: string) =>
  status === 'resolved' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline';

const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'general',
    subject: '',
    message: '',
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['my-support-tickets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, subject, category, status, message, admin_response, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.subject.trim() || !form.message.trim()) {
      toast({ title: 'Missing details', description: 'Please add a subject and a message.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      shop_id: currentShop?.id ?? null,
      name: form.name || user.name || null,
      email: form.email || user.email || null,
      phone: form.phone || null,
      category: form.category,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSubmitting(false);

    if (error) {
      console.error('Error submitting ticket:', error);
      toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Message sent', description: 'Our admin team will get back to you shortly.' });
    setForm({ name: '', email: '', phone: '', category: 'general', subject: '', message: '' });
    queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Help & Contact Us"
        description="Send your questions or complaints to the Biashara Yangu support team and track their status."
        path="/help"
      />

      <div className="flex items-center gap-3">
        <LifeBuoy className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Help &amp; Contact Us</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Send a question or complaint to the admin team — Tuma swali au malalamiko yako.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Send us a message</CardTitle>
            <CardDescription>We usually reply within one business day.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    placeholder={user?.name || 'Full name'}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    placeholder="07xx xxx xxx"
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    placeholder={user?.email || 'you@example.com'}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Short summary of your issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your question or complaint in detail..."
                  required
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Sending...' : 'Send message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Other ways to reach us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>support@biashara-yangu.co.tz</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>+255 700 000 000</span>
            </div>
            <p className="text-muted-foreground pt-2">
              Mon – Sat, 8:00 – 18:00 EAT. For payment issues include your receipt reference.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your previous messages</CardTitle>
          <CardDescription>Track the status of the queries you have sent.</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="mx-auto h-10 w-10 mb-3" />
              <p className="text-sm">You have not sent any messages yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t: any) => (
                <li key={t.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{t.subject}</span>
                    <Badge variant={statusVariant(t.status)}>{String(t.status).replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(t.created_at).toLocaleString()} · {t.category}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{t.message}</p>
                  {t.admin_response && (
                    <div className="mt-3 rounded-md bg-muted p-3">
                      <p className="text-xs font-semibold mb-1">Admin reply</p>
                      <p className="text-sm whitespace-pre-wrap">{t.admin_response}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;
