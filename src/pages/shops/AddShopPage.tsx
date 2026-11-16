
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
import { validate, shopSchema, type FieldErrors } from '@/lib/validation';
import { FieldError, invalidProps } from '@/components/ui/field-error';
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
  const [errors, setErrors] = useState<FieldErrors>({});
  
  const { addShop } = useShop();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validate(shopSchema, { name, email: '', phone: '' });
    setErrors(result.errors);
    if (!result.ok) return;
    
    setIsSubmitting(true);
    
    const success = await addShop({
      name,
      location: location || undefined,
      currency,
    });
    
    setIsSubmitting(false);
    
    // addShop() already shows the success / error message
    if (success) navigate('/');
  };
  
  return (
    <div className="max-w-md mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate('/shops')} className="mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Shops
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Shop</CardTitle>
          <CardDescription>
            Enter the details to set up a new shop in your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter shop name"
                {...invalidProps('name', errors.name)}
              />
              <FieldError id="name-error" message={errors.name} />
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
              <Button type="submit" loading={isSubmitting}>
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
