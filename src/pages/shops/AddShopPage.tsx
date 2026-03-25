
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const currencies = [
  { value: 'KES', label: 'Kenya Shilling (KES)' },
  { value: 'UGX', label: 'Uganda Shilling (UGX)' },
  { value: 'TZS', label: 'Tanzania Shilling (TZS)' },
  { value: 'RWF', label: 'Rwanda Franc (RWF)' },
  { value: 'USD', label: 'US Dollar (USD)' },
];

const AddShopPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [currency, setCurrency] = useState<string>('KES');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { addShop } = useShop();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Shop name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const success = await addShop({
      name,
      location: location || undefined,
      currency,
    });
    
    setIsSubmitting(false);
    
    if (success) {
      toast({
        title: "Success",
        description: "Shop added successfully",
      });
      navigate('/');
    }
  };
  
  return (
    <div className="max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Shop</CardTitle>
          <CardDescription>
            Enter the details to set up a new shop in your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter shop name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter shop location"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/shops')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Shop'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddShopPage;
