import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface Profile { id: string; user_id: string; full_name: string | null; phone: string | null; created_at: string; }
type Role = "super_admin" | "admin" | "user";

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, phone, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles" as any).select("user_id, role"),
    ]);
    setUsers((profs as Profile[]) ?? []);
    const map: Record<string, Role[]> = {};
    ((rs as any[]) ?? []).forEach((r) => { (map[r.user_id] ||= []).push(r.role); });
    setRoles(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setUserRole = async (userId: string, newRole: Role | "none") => {
    await supabase.from("user_roles" as any).delete().eq("user_id", userId);
    if (newRole !== "none") {
      const { error } = await supabase.from("user_roles" as any).insert({ user_id: userId, role: newRole });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    toast({ title: "Role updated" });
    load();
  };

  const filtered = users.filter(u =>
    !q || u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q) || u.user_id.includes(q)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Super Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">All registered users</p>
      <AdminNav />

      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input placeholder="Search by name, phone, id…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Set Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6">Loading…</TableCell></TableRow>
            ) : filtered.map((u) => {
              const userRoles = roles[u.user_id] ?? [];
              const top: Role | "none" = userRoles.includes("super_admin") ? "super_admin" : userRoles.includes("admin") ? "admin" : userRoles.includes("user") ? "user" : "none";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "-"}</TableCell>
                  <TableCell>{u.phone || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    {userRoles.length === 0 ? <Badge variant="outline">none</Badge> :
                      userRoles.map(r => <Badge key={r} className="mr-1">{r}</Badge>)}
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Select value={top} onValueChange={(v) => setUserRole(u.user_id, v as any)}>
                      <SelectTrigger className="w-36 ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
