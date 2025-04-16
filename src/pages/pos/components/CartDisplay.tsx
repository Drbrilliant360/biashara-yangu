
import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types';

interface CartDisplayProps {
  cartItems: CartItem[];
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  currencyCode: string;
}

export const CartDisplay: React.FC<CartDisplayProps> = ({
  cartItems,
  updateCartItemQuantity,
  removeFromCart,
  currencyCode,
}) => {
  return (
    <div className="space-y-3">
      {cartItems.map((item) => (
        <div key={item.product.id} className="flex items-center justify-between border-b pb-3">
          <div className="flex-1">
            <div className="font-medium">{item.product.name}</div>
            <div className="text-sm opacity-70">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
              }).format(item.product.price)} × {item.quantity}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
            >
              <Minus size={16} />
            </Button>
            
            <span className="w-8 text-center">{item.quantity}</span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stockQuantity}
            >
              <Plus size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeFromCart(item.product.id)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
          
          <div className="w-20 text-right font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currencyCode,
              minimumFractionDigits: 0,
            }).format(item.subtotal)}
          </div>
        </div>
      ))}
    </div>
  );
};
