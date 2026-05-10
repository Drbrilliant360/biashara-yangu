import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Shop {
  id: string; name: string; location: string | null; phone: string | null;
  email: string | null; currency: string; owner_id: string; is_active: boolean; created_at: string;
}

const AdminShopsPage: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Shop | null>(null);
  const [deleting, setDeleting] = useState<Shop | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
    setShops((data as Shop[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = shops.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.location?.toLowerCase().includes(q.toLowerCase()));

  const toggleActive = async (s: Shop) => {
    const { error } = await supabase.from("shops").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setShops(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !s.is_active } : x));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("shops").update({
      name: editing.name, location: editing.location, phone: editing.phone,
      email: editing.email, currency: editing.currency, is_active: editing.is_active,
    }).eq("id", editing.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Shop updated" });
    setEditing(null); load();
  };

  const doDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("shops").delete().eq("id", deleting.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Shop deleted" });
    setDeleting(null); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">All shops on the platform</p>
      <AdminNav />

      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input placeholder="Search shops…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No shops</TableCell></TableRow>
            ) : filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.location || "-"}</TableCell>
                <TableCell>{s.phone || "-"}</TableCell>
                <TableCell>{s.currency}</TableCell>
                <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} /></TableCell>
                <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(s)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Shop</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Currency</Label><Input value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Active</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shop {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the shop and may affect related products and sales.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminShopsPage;
