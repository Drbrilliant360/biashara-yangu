
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { DialogFooter } from '@/components/ui/dialog';

interface ForgotPasswordFormProps {
  onComplete: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { verifySecurityQuestion, resetPassword } = useAuth();
  
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const result = await verifySecurityQuestion(email);
    setLoading(false);
    
    if (result.success && result.question) {
      setSecurityQuestion(result.question);
      setStep(2);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    const success = await resetPassword(email, securityAnswer, newPassword);
    setLoading(false);
    
    if (success) {
      onComplete();
    }
  };
  
  return (
    <div className="space-y-4 py-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {step === 1 ? (
        <form onSubmit={handleVerifyEmail}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={loading || !email}>
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Security Question</Label>
              <p className="text-sm font-medium">{securityQuestion}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="security-answer">Your Answer</Label>
              <Input
                id="security-answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your answer"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !securityAnswer || !newPassword || !confirmPassword}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      )}
    </div>
  );
};
