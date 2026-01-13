
import React, { useState, useEffect } from 'react';
import { Plus, FileText, Filter, Search, Wallet, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { Expense, TimeRange } from '@/types';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // New expense form state
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('utilities');
  const [description, setDescription] = useState<string>('');

  // Define expense categories
  const expenseCategories = [
    'utilities', 
    'rent', 
    'salaries', 
    'transportation', 
    'supplies', 
    'marketing', 
    'maintenance', 
    'other'
  ];

  useEffect(() => {
    if (currentShop) {
      loadExpenses();
    } else {
      setExpenses([]);
    }
  }, [currentShop]);

  const loadExpenses = () => {
    if (!currentShop) return;
    
    const allExpenses = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, [])
      .filter(expense => expense.shop_id === currentShop.id);
    
    setExpenses(allExpenses);
  };

  const addExpense = () => {
    if (!currentShop || !user) {
      toast({
        title: "Error",
        description: "Shop or user data missing",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      shop_id: currentShop.id,
      user_id: user.id,
      amount: parseFloat(amount),
      category,
      description,
      payment_method: 'cash',
      expense_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedExpenses = [...getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []), newExpense];
    setItem(STORAGE_KEYS.EXPENSES, updatedExpenses);
    loadExpenses();
    
    // Reset form
    setAmount('');
    setCategory('utilities');
    setDescription('');
    setIsAddExpenseOpen(false);
    
    toast({
      title: "Expense added",
      description: `${currentShop.currency} ${amount} expense recorded successfully`,
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description || '');
    setIsEditExpenseOpen(true);
  };

  const updateExpense = () => {
    if (!currentExpense || !currentShop) return;
    
    const updatedExpense: Expense = {
      ...currentExpense,
      amount: parseFloat(amount),
      category,
      description,
      updated_at: new Date().toISOString(),
    };

    const allExpenses = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const updatedExpenses = allExpenses.map(exp => 
      exp.id === currentExpense.id ? updatedExpense : exp
    );
    
    setItem(STORAGE_KEYS.EXPENSES, updatedExpenses);
    loadExpenses();
    setIsEditExpenseOpen(false);
    
    toast({
      title: "Expense updated",
      description: "Expense details have been updated",
    });
  };

  const deleteExpense = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    const allExpenses = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const updatedExpenses = allExpenses.filter(exp => exp.id !== id);
    
    setItem(STORAGE_KEYS.EXPENSES, updatedExpenses);
    loadExpenses();
    
    toast({
      title: "Expense deleted",
      description: "Expense has been removed",
    });
  };

  const filterExpenses = () => {
    if (!expenses.length) return [];
    
    let filtered = [...expenses];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description?.toLowerCase().includes(term) || 
        exp.category.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }
    
    // Filter by time range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        // For 'all' or 'custom', don't filter by date
        break;
    }
    
    filtered = filtered.filter(exp => new Date(exp.created_at) >= startDate);
    
    // Sort by newest first
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      utilities: 'bg-blue-100 text-blue-800',
      rent: 'bg-purple-100 text-purple-800',
      salaries: 'bg-green-100 text-green-800',
      transportation: 'bg-yellow-100 text-yellow-800',
      supplies: 'bg-orange-100 text-orange-800',
      marketing: 'bg-pink-100 text-pink-800',
      maintenance: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const totalExpenses = filterExpenses().reduce((sum, exp) => sum + exp.amount, 0);
  
  // Don't show the page if no shop is selected
  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You need to select a shop before you can manage expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-biashara-primary">
          <Plus size={18} className="mr-1" /> Add Expense
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="p-4 flex-1">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search size={18} className="text-gray-500" />
              <Input 
                placeholder="Search expenses..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px]">
                  <Wallet size={16} className="mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="overflow-hidden border">
        <div className="p-4 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Expense List 
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filterExpenses().length} expenses)
              </span>
            </h2>
            <div className="text-md font-semibold">
              Total: {formatCurrency(totalExpenses)}
            </div>
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
              {filterExpenses().map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.created_at)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {expense.description || "No description"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => deleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
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
            <Button
              variant="link"
              onClick={() => setIsAddExpenseOpen(true)}
              className="mt-2"
            >
              Add your first expense
            </Button>
          </div>
        )}
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount ({currentShop.currency})
              </label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense details"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addExpense} className="bg-biashara-primary">
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-amount" className="text-sm font-medium">
                Amount ({currentShop.currency})
              </label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="edit-category" className="text-sm font-medium">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense details"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateExpense} className="bg-biashara-primary">
              Update Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
