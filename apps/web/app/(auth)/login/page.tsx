'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@web/components/ui/button';

import { Card, CardContent, CardHeader } from '@web/components/ui/card';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useLoginUser } from '@web/lib/client/mutations/loginMutation';
import { Label } from '@radix-ui/react-label';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const { mutate: login, isPending } = useLoginUser({
    onSuccess: (data) => {
      console.log('Login successful:', data);
      // Navigate to dashboard on successful login
      router.push('/home');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setErrors({
        password: error.message || 'Login failed. Please try again.',
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // // Validate with Zod schema
    // const result = loginSchema.safeParse({ email, password });

    // if (!result.success) {
    //   const fieldErrors: { email?: string; password?: string } = {};
    //   result.error.errors.forEach((err) => {
    //     if (err.path[0] === 'email') {
    //       fieldErrors.email = err.message;
    //     } else if (err.path[0] === 'password') {
    //       fieldErrors.password = err.message;
    //     }
    //   });
    //   setErrors(fieldErrors);
    //   return;
    // }

    // Call login mutation
    login({ email, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary font-mono tracking-tight">
              MONEY_APP
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Sign in to your account
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">
                Email
              </Label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className={`bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 ${
                  errors.email ? 'border-destructive' : ''
                }`}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Password
              </Label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  className={`bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 pr-10 placeholder:text-muted-foreground/50 ${
                    errors.password ? 'border-destructive' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border/50 bg-background/50 text-primary focus:ring-primary/20"
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a
                href="#"
                className="text-primary/80 hover:text-primary transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-primary/80 hover:text-primary transition-colors font-medium"
              >
                Sign up
              </a>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground text-center">
              <span className="text-primary font-mono">Demo:</span> Use
              credentials from seeded data
              <br />
              <span className="font-mono text-xs">
                john@example.com / password123
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
