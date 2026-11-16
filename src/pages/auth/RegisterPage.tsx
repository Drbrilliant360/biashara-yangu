import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Lock, Eye, EyeOff, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import registerHero from '@/assets/register-hero.png';
import { validate, registerSchema, type FieldErrors } from '@/lib/validation';
import { FieldError, invalidProps } from '@/components/ui/field-error';
import logo from '@/assets/logo.png';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = validate(registerSchema, { name, email, password });
    const next: FieldErrors = result.ok ? {} : { ...result.errors };
    if (!next.password && password !== confirmPassword) next.confirmPassword = 'Passwords do not match. Type the same password again.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsLoading(true);
    const success = await register({ name, email, password });
    setIsLoading(false);
    if (success) navigate('/shops/add');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Helmet>
        <title>Create account — Biashara Yangu</title>
        <meta name="description" content="Sign up for Biashara Yangu and start managing stock, sales, and insights across your shops." />
        <link rel="canonical" href="https://www.biashara-yangu.co.tz/register" />
        <meta property="og:title" content="Create account — Biashara Yangu" />
        <meta property="og:url" content="https://www.biashara-yangu.co.tz/register" />
      </Helmet>
      <div className="w-full max-w-6xl bg-card rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 relative">
        {/* Left: Form */}
        <div className="p-8 md:p-12 flex flex-col bg-gradient-to-br from-background to-muted/50">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border">
              <img src={logo} alt="Biashara Yangu" className="h-6 w-6 object-contain" />
              <span className="text-sm font-medium">Biashara Yangu</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold mb-2">Create an account</h1>
              <p className="text-sm text-muted-foreground">Sign up and start managing your business</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Full name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" {...invalidProps('name', errors.name)} className={`pl-11 h-12 rounded-full bg-background border-border ${errors.name ? 'border-destructive' : ''}`} />
                </div>
                <FieldError id="name-error" message={errors.name} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" {...invalidProps('email', errors.email)} className={`pl-11 h-12 rounded-full bg-background border-border ${errors.email ? 'border-destructive' : ''}`} />
                </div>
                <FieldError id="email-error" message={errors.email} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters, letters and a number" autoComplete="new-password" {...invalidProps('password', errors.password)} className={`pl-11 pr-11 h-12 rounded-full bg-background border-border ${errors.password ? 'border-destructive' : ''}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError id="password-error" message={errors.password} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" autoComplete="new-password" {...invalidProps('confirmPassword', errors.confirmPassword)} className={`pl-11 h-12 rounded-full bg-background border-border ${errors.confirmPassword ? 'border-destructive' : ''}`} />
                </div>
                <FieldError id="confirmPassword-error" message={errors.confirmPassword} />
              </div>

              <Button type="submit" loading={isLoading} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-medium">
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mt-6">
            <span>
              Have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-primary underline font-medium">Sign in</button>
            </span>
            <span className="flex gap-3">
              <Link to="/terms" className="underline hover:text-primary">Terms</Link>
              <Link to="/privacy" className="underline hover:text-primary">Privacy</Link>
            </span>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative hidden md:block">
          <img src={registerHero} alt="Marketplace" className="absolute inset-0 w-full h-full object-cover" />
          <button className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
