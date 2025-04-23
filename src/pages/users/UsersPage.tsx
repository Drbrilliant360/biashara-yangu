
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useShop } from "@/context/ShopContext";
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage";
import { User } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  UserPlus, 
  Mail, 
  UserIcon, 
  Lock, 
  Shield,
  X,
  Check
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { currentShop } = useShop();
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  // New user form state
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    password: string;
    pin: string;
    role: "owner" | "manager" | "cashier";
    phone: string;
    permissions: {
      viewSales: boolean;
      viewProducts: boolean;
      viewReports: boolean;
      managePurchases: boolean;
      manageExpenses: boolean;
    }
  }>({
    name: "",
    email: "",
    password: "",
    pin: "",
    role: "cashier",
    phone: "",
    permissions: {
      viewSales: true,
      viewProducts: true,
      viewReports: false,
      managePurchases: false,
      manageExpenses: false
    }
  });

  // Load users from storage
  useEffect(() => {
    const allUsers = getItem<User[]>(STORAGE_KEYS.USERS, []);
    setUsers(allUsers);
  }, []);

  // Check if current user is authorized to manage users
  const canManageUsers = currentUser?.role === "owner" || currentUser?.role === "manager";

  const handleAddUser = () => {
    // Validate form
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.pin) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if email is already in use
    if (users.some(u => u.email === newUser.email)) {
      toast({
        title: "Email already in use",
        description: "Please use a different email address",
        variant: "destructive"
      });
      return;
    }

    // Check if PIN is already in use
    if (users.some(u => u.pin === newUser.pin)) {
      toast({
        title: "PIN already in use",
        description: "Please use a different PIN",
        variant: "destructive"
      });
      return;
    }

    // Create new user
    const newUserData: User = {
      id: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      pin: newUser.pin,
      password: newUser.password,
      role: newUser.role,
      shops: currentShop ? [currentShop.id] : [],
      phone: newUser.phone,
      permissions: newUser.permissions
    };

    // Update storage
    const updatedUsers = [...users, newUserData];
    setUsers(updatedUsers);
    setItem(STORAGE_KEYS.USERS, updatedUsers);

    // Reset form and hide it
    setNewUser({
      name: "",
      email: "",
      password: "",
      pin: "",
      role: "cashier",
      phone: "",
      permissions: {
        viewSales: true,
        viewProducts: true,
        viewReports: false,
        managePurchases: false,
        manageExpenses: false
      }
    });
    setShowNewUserForm(false);

    toast({
      title: "User Added",
      description: `${newUserData.name} has been added as a ${newUserData.role}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        
        {canManageUsers && (
          <Button onClick={() => setShowNewUserForm(!showNewUserForm)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Add User Form */}
      {showNewUserForm && canManageUsers && (
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Add New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Create Password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input 
                id="pin"
                value={newUser.pin}
                onChange={(e) => setNewUser({...newUser, pin: e.target.value})}
                placeholder="4-6 Digit PIN"
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select 
                id="role"
                className="w-full border rounded px-3 py-2"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as "owner" | "manager" | "cashier"})}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                {currentUser?.role === "owner" && <option value="owner">Owner</option>}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input 
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="Phone Number"
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="viewSales"
                  checked={newUser.permissions.viewSales}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, viewSales: e.target.checked }
                  })}
                />
                <Label htmlFor="viewSales">View Sales</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="viewProducts"
                  checked={newUser.permissions.viewProducts}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, viewProducts: e.target.checked }
                  })}
                />
                <Label htmlFor="viewProducts">View Products</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="viewReports"
                  checked={newUser.permissions.viewReports}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, viewReports: e.target.checked }
                  })}
                />
                <Label htmlFor="viewReports">View Reports</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="managePurchases"
                  checked={newUser.permissions.managePurchases}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, managePurchases: e.target.checked }
                  })}
                />
                <Label htmlFor="managePurchases">Manage Purchases</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="manageExpenses"
                  checked={newUser.permissions.manageExpenses}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, manageExpenses: e.target.checked }
                  })}
                />
                <Label htmlFor="manageExpenses">Manage Expenses</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAddUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline" onClick={() => setShowNewUserForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Users List */}
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No users found. Add your first user.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="capitalize inline-flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-3 text-xs">
                      {user.permissions ? (
                        <>
                          <span title="View Sales">
                            {user.permissions.viewSales ? 
                              <Check size={16} className="text-green-500" /> : 
                              <X size={16} className="text-red-500" />}
                          </span>
                          <span title="View Products">
                            {user.permissions.viewProducts ? 
                              <Check size={16} className="text-green-500" /> : 
                              <X size={16} className="text-red-500" />}
                          </span>
                          <span title="View Reports">
                            {user.permissions.viewReports ? 
                              <Check size={16} className="text-green-500" /> : 
                              <X size={16} className="text-red-500" />}
                          </span>
                        </>
                      ) : (
                        <span>Full access</span>
                      )}
                    </div>
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
