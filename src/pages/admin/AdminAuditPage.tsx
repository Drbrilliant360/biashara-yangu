import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminNav } from '@/components/admin/AdminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeletonRows } from '@/components/feedback/LoadingState';
import { friendlyError } from '@/lib/errors';
import { toast } from '@/hooks/use-toast';

interface AuditRow {
  id: number;
  created_at: string;
  actor_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  shop_id: string | null;
}

const PAGE_SIZE = 50;

const AdminAuditPage: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [table, setTable] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const load = async () => {
    setLoading(true);
    let query = (supabase as unknown as { from: (t: string) => any })
      .from('audit_log')
      .select('id, created_at, actor_id, action, table_name, record_id, shop_id')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    if (table.trim()) query = query.eq('table_name', table.trim());
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      toast({ title: 'Could not load the audit log', description: friendlyError(error, error.message), variant: 'destructive' });
      return;
    }
    const list = (data || []) as AuditRow[];
    setHasMore(list.length > PAGE_SIZE);
    setRows(list.slice(0, PAGE_SIZE));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, table]);

  const variant = (a: string) => (a === 'DELETE' ? 'destructive' : a === 'INSERT' ? 'default' : 'secondary');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin — Audit Log</h1>
      <p className="text-sm text-muted-foreground mb-4">Who changed what, and when. Records cannot be edited or deleted from the app.</p>
      <AdminNav />
      <div className="flex flex-wrap gap-2 mb-3">
        <Input
          aria-label="Filter by table"
          placeholder="Filter by table, e.g. sales, products, user_roles"
          value={table}
          onChange={(e) => { setPage(0); setTable(e.target.value); }}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead className="hidden md:table-cell">Record</TableHead>
              <TableHead className="hidden md:table-cell">Who</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableSkeletonRows cols={5} /> : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No activity recorded yet</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant={variant(r.action) as 'default'}>{r.action}</Badge></TableCell>
                <TableCell>{r.table_name ?? '-'}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{r.record_id?.slice(0, 8) ?? '-'}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{r.actor_id?.slice(0, 8) ?? 'system'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div className="flex justify-between mt-3">
        <Button variant="outline" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground self-center">Page {page + 1}</span>
        <Button variant="outline" disabled={!hasMore || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
};

export default AdminAuditPage;
