
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { initiatePayment, checkOrderStatus } from '@/lib/palmPesaService';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export function PaymentDialog({ open, onOpenChange, onPaymentSuccess }: PaymentDialogProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  
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
        amount: 5000, // TZS 5,000
      });
      
      if (response.status === 'PENDING' && response.orderId) {
        setPaymentStatus('pending');
        setPaymentMessage(response.message || 'Please check your phone to complete the payment.');
        setOrderId(response.orderId);
        
        toast({
          title: "Payment Initiated",
          description: "Please check your phone to complete your payment",
        });
        
        // Start polling for payment status
        startPaymentStatusCheck(response.orderId);
      } else {
        throw new Error(response.error || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentStatus('error');
      setPaymentMessage('There was an issue initiating the payment. Please try again.');
      
      toast({
        title: "Payment Error",
        description: "There was an issue initiating the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentStatusCheck = async (paymentOrderId: string) => {
    // In a real implementation, this would poll the status endpoint
    // For demo purposes, we'll simulate a successful payment after a delay
    setTimeout(() => {
      setPaymentStatus('success');
      setPaymentMessage('Payment completed successfully! Your subscription has been renewed.');
      
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed and your subscription has been renewed.",
      });
    }, 10000); // 10 seconds delay to simulate user entering PIN on their phone
  };

  const handleCloseDialog = () => {
    // Reset form when closing
    if (!isLoading) {
      setPaymentStatus('idle');
      setPaymentMessage('');
      setOrderId('');
      onOpenChange(false);
    }
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'pending':
        return (
          <div className="space-y-6 py-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <Clock className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {paymentMessage}
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Waiting for payment confirmation...</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Order Reference: {orderId}</p>
              <p>Please enter your PIN on your phone to complete the payment.</p>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="space-y-6 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">
                {paymentMessage}
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-lg font-medium text-green-600">Thank you!</p>
              <p className="text-sm text-muted-foreground">
                Your subscription has been renewed until 30 days from now.
              </p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleCloseDialog}
            >
              Close
            </Button>
          </div>
        );
        
      case 'error':
        return (
          <div className="space-y-6 py-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">
                {paymentMessage}
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setPaymentStatus('idle')}
            >
              Try Again
            </Button>
          </div>
        );
        
      default:
        return (
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
                placeholder="e.g. 0710698702"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the phone number you wish to use for payment (e.g. 0710698702)
              </p>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Processing..." : "Pay Now (TZS 5,000)"}
              </Button>
            </DialogFooter>
          </form>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay Subscription</DialogTitle>
          <DialogDescription>
            Make a payment of TZS 5,000 for your monthly subscription
          </DialogDescription>
        </DialogHeader>
        
        {renderPaymentStatus()}
      </DialogContent>
    </Dialog>
  );
}
