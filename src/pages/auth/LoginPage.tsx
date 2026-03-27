
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-biashara-background">
      <div className="w-full max-w-md p-4">
        <Card className="border-2 border-biashara-primary/10 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold text-biashara-primary">
              Biashara Yangu
            </CardTitle>
            <CardDescription>
              Log in to access your business
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2.5 text-gray-500 focus:outline-none" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading || !email || !password}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Button type="button" variant="link" onClick={() => navigate('/register')}>
              Don't have an account? Register
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
