'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@web/components/ui/button';
import { Card, CardContent, CardHeader } from '@web/components/ui/card';
import { toast } from 'sonner';
import { AuthBackground } from '@web/components/auth/auth-background';

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authStatus = searchParams?.get('auth');
    if (authStatus === 'success') {
      toast.success('Successfully signed in with Google!');
      router.replace('/home');
    }
  }, [searchParams, router]);

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <AuthBackground>
      <Card
        className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl relative z-10 animate-auth-fade-in-up hover:shadow-[0_20px_40px_rgba(0,255,65,0.1)] transition-shadow duration-300"
        style={{ willChange: 'transform' }}
      >
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl text-primary font-light tracking-wide">
              MONEY APP
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-light">
            Ready to take control of your finances?
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-light flex items-center justify-center gap-3 h-12"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground text-center font-light leading-relaxed">
                <span className="text-primary font-light block mb-2">
                  Secure Authentication
                </span>
                Sign in instantly with Google for fast, secure access!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthBackground>
  );
};

export default Login;
