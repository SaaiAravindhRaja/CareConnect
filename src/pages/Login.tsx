import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import { Heart, Mail, Lock } from 'lucide-react';

export function Login() {
  const { user, signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';

      // Check if error is related to email verification
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('confirm')) {
        setFormError('Please verify your email address before signing in. Check your inbox for the verification link.');
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        setFormError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-warmth flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4725A] to-[#C85A44] flex items-center justify-center shadow-xl">
            <Heart className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold text-[#2D312A]" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back
        </h2>
        <p className="mt-3 text-center text-sm text-[#5C5550]/80 leading-relaxed">
          Sign in to continue caring with compassion
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {(formError || error) && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 text-red-700 text-sm leading-relaxed">
                <p className="font-semibold mb-1">Unable to sign in</p>
                <p>{formError || error}</p>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-10"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting || loading}
              disabled={!email || !password}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#5C5550]">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-[#D4725A] hover:text-[#C85A44] transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-[#8B7355] handwritten-note">
        CareConnect - Bringing joy and dignity to caregiving
      </p>
    </div>
  );
}
