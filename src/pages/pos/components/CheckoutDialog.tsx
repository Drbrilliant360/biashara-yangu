
import React, { useState } from 'react';
import { BanknoteIcon, CreditCard, Phone, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types';

interface CheckoutDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  cartItems: CartItem[];
  cartTotal: number;
  handleCheckout: (paymentMethod: 'cash' | 'mpesa' | 'card' | 'credit', amountPaid?: number) => void;
  currencyCode: string;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  setIsOpen,
  cartItems,
  cartTotal,
  handleCheckout,
  currencyCode,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'credit'>('cash');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-medium mb-2">Payment Method</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
              className="flex-col h-20 gap-1"
              onClick={() => setSelectedPaymentMethod('cash')}
            >
              <BanknoteIcon />
              <span>Cash</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === 'mpesa' ? 'default' : 'outline'}
              className="flex-col h-20 gap-1"
              onClick={() => setSelectedPaymentMethod('mpesa')}
            >
              <Phone />
              <span>M-Pesa</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
              className="flex-col h-20 gap-1"
              onClick={() => setSelectedPaymentMethod('card')}
            >
              <CreditCard />
              <span>Card</span>
            </Button>
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({cartItems.length} items):</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleCheckout(selectedPaymentMethod, cartTotal)}
            className="bg-biashara-primary hover:bg-biashara-primary/90"
          >
            Complete Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
