
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { initiatePayment } from '@/lib/palmPesaService';
import { Loader2 } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!email || !phone || !name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format phone number to required format if needed
      const formattedPhone = phone.startsWith('0') 
        ? `255${phone.substring(1)}` 
        : phone;
      
      const response = await initiatePayment({
        email,
        phone: formattedPhone,
        name,
        amount: 10000, // TZS 10,000
      });
      
      if (response.paymentUrl) {
        setPaymentLink(response.paymentUrl);
        toast({
          title: "Payment Initiated",
          description: "Please follow the link to complete your payment",
        });
      } else {
        throw new Error("Failed to generate payment link");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast({
        title: "Payment Error",
        description: "There was an issue initiating the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    // Reset form when closing
    if (!isLoading) {
      setPaymentLink('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay Subscription</DialogTitle>
          <DialogDescription>
            Make a payment of TZS 10,000 for your monthly subscription
          </DialogDescription>
        </DialogHeader>
        
        {!paymentLink ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="e.g. 0710123456"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number in format 0XXXXXXXXX or 255XXXXXXXXX
              </p>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Processing..." : "Continue to Payment"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="mb-2">Your payment link is ready!</p>
              <a 
                href={paymentLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary font-medium underline break-all"
              >
                {paymentLink}
              </a>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. Click the link above to complete your payment</p>
              <p>2. Once payment is successful, your subscription will be renewed</p>
              <p>3. Payment will be sent to Bryan Kachocho (0710698702)</p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleCloseDialog}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
