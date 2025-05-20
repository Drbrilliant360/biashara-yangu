
import React, { useState, ChangeEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { SECURITY_QUESTIONS } from '@/types/auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [securityQuestion, setSecurityQuestion] = useState<string>('');
  const [securityAnswer, setSecurityAnswer] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!securityQuestion || !securityAnswer.trim()) {
      setError('Please select a security question and provide an answer');
      return;
    }
    
    setIsLoading(true);
    
    const success = await register({
      name,
      email,
      password,
      role: 'owner',
      shops: [],
      profilePicture: profilePicture || undefined,
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
    });
    
    setIsLoading(false);
    
    if (success) {
      navigate('/shops/add');
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
              Create your account to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    {profilePicture ? (
                      <AvatarImage src={profilePicture} alt="Profile" />
                    ) : (
                      <AvatarFallback>
                        <User className="h-12 w-12 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    type="button"
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                    onClick={() => document.getElementById('profile-picture')?.click()}
                  >
                    <span className="sr-only">Change avatar</span>
                    <span className="text-xs font-bold">+</span>
                  </Button>
                  <input 
                    id="profile-picture" 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Business Owner Name</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password (min. 6 characters)"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2.5 text-gray-500 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="securityQuestion">Security Question</Label>
                <Select
                  value={securityQuestion}
                  onValueChange={setSecurityQuestion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_QUESTIONS.map(q => (
                      <SelectItem key={q.id} value={q.question}>
                        {q.question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="securityAnswer">Security Answer</Label>
                <Input
                  id="securityAnswer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Answer to your security question"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
