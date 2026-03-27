
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useShop } from "@/context/ShopContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShopUserRow {
  id: string;
  shop_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null };
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { currentShop } = useShop();
  const [shopUsers, setShopUsers] = useState<ShopUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
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
      .eq('is_active', true);

    if (!error && data) {
      setShopUsers(data as ShopUserRow[]);
    }
    setLoading(false);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setShowNewUserForm(!showNewUserForm)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {showNewUserForm && (
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Add New User</h2>
          <p className="text-sm text-muted-foreground mb-4">
            To add a user, they must first register an account. Then you can add them to your shop by their user ID.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNewUserForm(false)}>Close</Button>
          </div>
        </Card>
      )}

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : shopUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No users found for this shop.
                </TableCell>
              </TableRow>
            ) : (
              shopUsers.map((su) => (
                <TableRow key={su.id}>
                  <TableCell className="font-medium text-sm">{su.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <span className="capitalize inline-flex items-center">
                      <Shield className="w-4 h-4 mr-1" /> {su.role}
                    </span>
                  </TableCell>
                  <TableCell>{su.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>{new Date(su.created_at).toLocaleDateString()}</TableCell>
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
