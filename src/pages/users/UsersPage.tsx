
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useShop } from "@/context/ShopContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageHead } from '@/components/seo/PageHead';

interface ShopUserRow {
  id: string;
  shop_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  { value: "manager", label: "Manager", hint: "Full access except shop deletion" },
  { value: "cashier", label: "Cashier", hint: "Sales and quotations" },
  { value: "stock_keeper", label: "Stock Keeper", hint: "Products and purchases" },
  { value: "accountant", label: "Accountant", hint: "Expenses and reports" },
  { value: "viewer", label: "Viewer", hint: "Read-only access" },
];

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { currentShop } = useShop();
  const [shopUsers, setShopUsers] = useState<ShopUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("cashier");

  useEffect(() => {
    if (currentShop) loadUsers();
  }, [currentShop]);

  const loadUsers = async () => {
    if (!currentShop) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('shop_users')
      .select('*')
      .eq('shop_id', currentShop.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setShopUsers(data as ShopUserRow[]);
    }
    setLoading(false);
  };

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());

  const addUser = async () => {
    if (!currentShop) return;
    if (!isUuid(newUserId)) {
      toast({ title: "Invalid user ID", description: "Paste the full user ID (UUID) of a registered user.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('shop_users').insert({
      shop_id: currentShop.id,
      user_id: newUserId.trim(),
      role: newRole,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not add user", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "User added", description: `Role set to ${newRole}.` });
    setNewUserId("");
    setNewRole("cashier");
    setShowNewUserForm(false);
    loadUsers();
  };

  const changeRole = async (row: ShopUserRow, role: string) => {
    const { error } = await supabase.from('shop_users').update({ role }).eq('id', row.id);
    if (error) {
      toast({ title: "Could not update role", description: error.message, variant: "destructive" });
      return;
    }
    setShopUsers((prev) => prev.map((r) => (r.id === row.id ? { ...r, role } : r)));
    toast({ title: "Role updated" });
  };

  const toggleActive = async (row: ShopUserRow) => {
    const { error } = await supabase.from('shop_users').update({ is_active: !row.is_active }).eq('id', row.id);
    if (error) {
      toast({ title: "Could not update status", description: error.message, variant: "destructive" });
      return;
    }
    setShopUsers((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)));
  };

  const removeUser = async (row: ShopUserRow) => {
    const { error } = await supabase.from('shop_users').delete().eq('id', row.id);
    if (error) {
      toast({ title: "Could not remove user", description: error.message, variant: "destructive" });
      return;
    }
    setShopUsers((prev) => prev.filter((r) => r.id !== row.id));
    toast({ title: "User removed from shop" });
  };

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground">Select a shop to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead title="Shop Users & Roles" description="Add team members and assign roles such as manager, cashier or accountant in Biashara Yangu." path="/customers" />
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold truncate">Shop User &amp; Role Management</h1>
        <Button onClick={() => setShowNewUserForm(!showNewUserForm)}>
          <UserPlus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Add User</span>
        </Button>
      </div>

      {showNewUserForm && (
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-medium">Add team member</h2>
          <p className="text-sm text-muted-foreground">
            The person must already have a Biashara Yangu account. Ask them for their user ID (shown in Settings) and paste it below.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-user-id">User ID</Label>
              <Input
                id="new-user-id"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label} — {r.hint}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addUser} disabled={saving}>{saving ? "Adding…" : "Add user"}</Button>
            <Button variant="outline" onClick={() => setShowNewUserForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : shopUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No team members yet. Add one to assign roles.
                </TableCell>
              </TableRow>
            ) : (
              shopUsers.map((su) => (
                <TableRow key={su.id}>
                  <TableCell className="font-medium text-sm">
                    {su.user_id.slice(0, 8)}…
                    {su.user_id === currentUser?.id && <Badge variant="outline" className="ml-2">You</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Select value={su.role} onValueChange={(v) => changeRole(su, v)}>
                        <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                          {!ROLES.some((r) => r.value === su.role) && (
                            <SelectItem value={su.role}>{su.role}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={su.is_active ? "default" : "outline"}>{su.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(su.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(su)}>
                      {su.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Remove user" onClick={() => removeUser(su)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default UsersPage;
