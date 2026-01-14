import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui';
import { Heart, Mail, Lock, User, CheckCircle } from 'lucide-react';

export function Signup() {
  const { user, signUp, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSignupSuccess(false);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    // Strong password validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setFormError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password, name);
      setSignupSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create account');
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
          Join CareConnect
        </h2>
        <p className="mt-3 text-center text-sm text-[#5C5550]/80 leading-relaxed">
          Start your journey of compassionate caregiving
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated" padding="lg">
          {signupSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#D4DCC9] to-[#E8ECE4] mx-auto">
                <CheckCircle className="h-9 w-9 text-[#8B9A7C]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#2D312A]" style={{ fontFamily: 'var(--font-display)' }}>
                  Check Your Email!
                </h3>
                <p className="text-sm text-[#5C5550]/80 leading-relaxed px-4">
                  We've sent a verification link to <span className="font-semibold text-[#D4725A]">{email}</span>.
                  Please click the link in the email to verify your account before signing in.
                </p>
                <div className="pt-4 border-t border-[#D4725A]/10">
                  <p className="text-xs text-[#8B7355] italic">
                    Don't see the email? Check your spam folder or wait a few moments.
                  </p>
                </div>
              </div>
              <Link to="/login" className="block pt-4">
                <Button variant="primary" className="w-full">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {(formError || error) && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {formError || error}
                </div>
              )}

            <div className="relative">
              <User className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Your Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="pl-10"
                required
              />
            </div>

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
                placeholder="Create a password"
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="pl-10"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting || loading}
              disabled={!name || !email || !password || !confirmPassword}
            >
              Create Account
            </Button>
          </form>
          )}

          {!signupSuccess && (
            <div className="mt-6 text-center">
              <p className="text-sm text-[#5C5550]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#D4725A] hover:text-[#C85A44] transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-[#8B7355] handwritten-note">
        CareConnect - Bringing joy and dignity to caregiving
      </p>
    </div>
  );
}
