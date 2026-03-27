
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Filter, Search, Wallet, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Expense, TimeRange } from '@/types';

const expenseCategories = ['utilities', 'rent', 'salaries', 'transportation', 'supplies', 'marketing', 'maintenance', 'other'];

const ExpensesPage: React.FC = () => {
  const { toast } = useToast();
  const { currentShop } = useShop();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('utilities');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (currentShop) loadExpenses();
    else setExpenses([]);
  }, [currentShop]);

  const loadExpenses = async () => {
    if (!currentShop) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('shop_id', currentShop.id)
      .order('created_at', { ascending: false });

    if (!error && data) setExpenses(data as Expense[]);
    setLoading(false);
  };

  const addExpense = async () => {
    if (!currentShop || !user) {
      toast({ title: "Error", description: "Shop or user data missing", variant: "destructive" });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('expenses').insert({
      shop_id: currentShop.id,
      user_id: user.id,
      amount: parseFloat(amount),
      category,
      description: description || null,
      payment_method: 'cash',
      expense_date: new Date().toISOString().split('T')[0],
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setAmount(''); setCategory('utilities'); setDescription('');
    setIsAddExpenseOpen(false);
    loadExpenses();
    toast({ title: "Expense added", description: `${currentShop.currency} ${amount} expense recorded` });
  };

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description || '');
    setIsEditExpenseOpen(true);
  };

  const updateExpense = async () => {
    if (!currentExpense) return;

    const { error } = await supabase.from('expenses')
      .update({ amount: parseFloat(amount), category, description: description || null })
      .eq('id', currentExpense.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setIsEditExpenseOpen(false);
    loadExpenses();
    toast({ title: "Expense updated" });
  };

  const deleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    loadExpenses();
    toast({ title: "Expense deleted" });
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exp => exp.description?.toLowerCase().includes(term) || exp.category.toLowerCase().includes(term));
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }

    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'yesterday': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    }

    filtered = filtered.filter(exp => new Date(exp.created_at) >= startDate);
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currentShop?.currency || 'KES', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      utilities: 'bg-blue-100 text-blue-800', rent: 'bg-purple-100 text-purple-800',
      salaries: 'bg-green-100 text-green-800', transportation: 'bg-yellow-100 text-yellow-800',
      supplies: 'bg-orange-100 text-orange-800', marketing: 'bg-pink-100 text-pink-800',
      maintenance: 'bg-indigo-100 text-indigo-800', other: 'bg-gray-100 text-gray-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  const totalExpenses = filterExpenses().reduce((sum, exp) => sum + exp.amount, 0);

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">You need to select a shop before managing expenses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => setIsAddExpenseOpen(true)}><Plus size={18} className="mr-1" /> Add Expense</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
              <SelectTrigger className="w-[140px]"><Filter size={16} className="mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]"><Wallet size={16} className="mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border">
        <div className="p-4 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Expense List <span className="text-sm font-normal text-muted-foreground ml-2">({filterExpenses().length} expenses)</span></h2>
            <div className="text-md font-semibold">Total: {formatCurrency(totalExpenses)}</div>
          </div>
        </div>

        {filterExpenses().length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filterExpenses().map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.created_at)}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>{expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</span></TableCell>
                  <TableCell className="max-w-[300px] truncate">{expense.description || "No description"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEditExpense(expense)}><Edit size={16} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteExpense(expense.id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={48} className="text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No expenses found</p>
            <Button variant="link" onClick={() => setIsAddExpenseOpen(true)} className="mt-2">Add your first expense</Button>
          </div>
        )}
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Amount ({currentShop.currency})</label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{expenseCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter expense details" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
            <Button onClick={addExpense}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Amount ({currentShop.currency})</label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{expenseCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter expense details" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>Cancel</Button>
            <Button onClick={updateExpense}>Update Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
