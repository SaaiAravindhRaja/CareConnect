import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { Heart, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
          Reset Password
        </h2>
        <p className="mt-3 text-center text-sm text-[#5C5550]/80 leading-relaxed">
          {success ? "Check your email for instructions" : "Enter your email to receive reset instructions"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated" padding="lg">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#D4DCC9] to-[#E8ECE4] mx-auto">
                <CheckCircle className="h-9 w-9 text-[#8B9A7C]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#2D312A]" style={{ fontFamily: 'var(--font-display)' }}>
                  Check Your Email
                </h3>
                <p className="text-sm text-[#5C5550]/80 leading-relaxed px-4">
                  We've sent password reset instructions to{' '}
                  <span className="font-semibold text-[#D4725A]">{email}</span>.
                  Click the link in the email to reset your password.
                </p>
                <div className="pt-4 border-t border-[#D4725A]/10">
                  <p className="text-xs text-[#8B7355] italic">
                    The link will expire in 1 hour. If you don't see the email, check your spam folder.
                  </p>
                </div>
              </div>
              <Link to="/login" className="block pt-4">
                <Button variant="primary" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 text-red-700 text-sm leading-relaxed">
                  <p className="font-semibold mb-1">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting}
                disabled={!email}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-[#D4725A] hover:text-[#C85A44] transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-[#8B7355] handwritten-note">
        CareConnect - Bringing joy and dignity to caregiving
      </p>
    </div>
  );
}
