'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@web/components/ui/button';
import { useAcceptFriendRequestByToken } from '@web/lib/client/mutations/friendMutations';

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
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
        {status === 'success' ? (
          <CheckCircle className="h-7 w-7" />
        ) : status === 'error' ? (
          <XCircle className="h-7 w-7 text-loss" />
        ) : (
          <UserPlus className="h-7 w-7" />
        )}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Friend request</h1>
      <p className="mt-1.5 text-sm text-muted">
        {status === 'loading' && 'Checking your session…'}
        {status === 'login-required' &&
          'Sign in with Google to accept this invite.'}
        {status === 'accepting' && 'Accepting your friend request…'}
        {status === 'success' && "You're in. Redirecting to your friends list."}
        {status === 'error' && 'We couldn’t accept this invite.'}
      </p>

      <div className="mt-8">
        {status === 'loading' || status === 'accepting' ? (
          <div className="flex justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          </div>
        ) : null}

        {status === 'login-required' && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleLogin}
          >
            Continue with Google
          </Button>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/friends')}
            >
              Go to Friends
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptFriendPage() {
  return (
    <Suspense fallback={null}>
      <AcceptFriendContent />
    </Suspense>
  );
}
