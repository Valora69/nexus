'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { Loader2, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAcceptFriendRequestByToken } from '@web/lib/client/mutations/friendMutations';
import { AuthBackground } from '@web/components/auth/auth-background';

type Status = 'loading' | 'login-required' | 'accepting' | 'success' | 'error';

function AcceptFriendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasFiredRef = useRef(false);

  const acceptMutation = useAcceptFriendRequestByToken({
    onSuccess: () => {
      setStatus('success');
      toast.success('Friend added successfully!');
      setTimeout(() => router.push('/friends'), 2000);
    },
    onError: (error) => {
      setStatus('error');
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invite link — no token provided.');
      return;
    }

    if (hasFiredRef.current) return;

    const checkAuth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/api/auth/profile`, {
          credentials: 'include',
        });

        if (res.ok) {
          if (hasFiredRef.current) return;
          hasFiredRef.current = true;
          setStatus('accepting');
          acceptMutation.mutate({ data: { token } });
        } else {
          setStatus('login-required');
        }
      } catch {
        setStatus('login-required');
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogin = () => {
    if (token) {
      sessionStorage.setItem('friendRequestToken', token);
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const returnUrl = encodeURIComponent(`/friends/accept?token=${token}`);
    window.location.href = `${apiUrl}/api/auth/google?redirect=${returnUrl}`;
  };

  return (
    <AuthBackground>
      <Card
        className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl relative z-10 animate-auth-fade-in-up hover:shadow-[0_20px_40px_rgba(0,255,65,0.1)] transition-shadow duration-300"
        style={{ willChange: 'transform' }}
      >
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-light tracking-wide">
            Friend Request
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm font-light">
                Checking authentication...
              </p>
            </div>
          )}

          {status === 'login-required' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-center text-muted-foreground text-sm font-light">
                Sign in with Google to accept this friend request
              </p>
              <Button
                onClick={handleLogin}
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
            </div>
          )}

          {status === 'accepting' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm font-light">
                Accepting friend request...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-12 w-12 text-primary" />
              <div className="text-center space-y-1">
                <p className="text-lg font-light text-foreground">
                  Friend Added
                </p>
                <p className="text-muted-foreground text-sm font-light">
                  Redirecting to your friends list...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="text-center space-y-1">
                <p className="text-lg font-light text-foreground">
                  Unable to accept
                </p>
                <p className="text-muted-foreground text-sm font-light">
                  {errorMessage}
                </p>
              </div>
              <Button
                variant="outline"
                className="font-light"
                onClick={() => router.push('/friends')}
              >
                Go to Friends
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthBackground>
  );
}

export default function AcceptFriendPage() {
  return (
    <Suspense fallback={null}>
      <AcceptFriendContent />
    </Suspense>
  );
}
