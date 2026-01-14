import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { Heart, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  // Validate reset token on mount
  useEffect(() => {
    const validateToken = async () => {
      // Check for the token_hash or code in the URL
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const code = searchParams.get('code');

      // Debug: Log all URL parameters
      console.log('Reset password URL params:', {
        tokenHash,
        type,
        code,
        allParams: Object.fromEntries(searchParams.entries())
      });

      // For password recovery, Supabase might send different parameters
      if (!code && !tokenHash && type !== 'recovery') {
        console.error('Missing required parameters');
        setError('Invalid or missing reset token. Please request a new password reset link.');
        setIsValidating(false);
        return;
      }

      // If we have a code, exchange it for a session
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Token exchange error:', exchangeError);
            setError('Invalid or expired reset link. Please request a new password reset.');
          } else if (data?.session) {
            console.log('Session established successfully');
          }
        } catch (err) {
          console.error('Token validation error:', err);
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      }

      setIsValidating(false);
    };

    validateToken();
  }, [searchParams]);

  const validatePasswordStrength = (pwd: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (pwd.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) {
      score++;
    } else {
      feedback.push('Mix of uppercase and lowercase letters');
    }

    if (/\d/.test(pwd)) {
      score++;
    } else {
      feedback.push('At least one number');
    }

    if (/[^a-zA-Z0-9]/.test(pwd)) {
      score++;
    } else {
      feedback.push('At least one special character (!@#$%^&*)');
    }

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please follow the requirements below.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score <= 1) return 'bg-red-500';
    if (passwordStrength.score === 2) return 'bg-orange-500';
    if (passwordStrength.score === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score === 2) return 'Fair';
    if (passwordStrength.score === 3) return 'Good';
    return 'Strong';
  };

  if (isValidating) {
    return (
      <div className="min-h-screen gradient-warmth flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#D4725A] border-r-transparent"></div>
          <p className="mt-4 text-[#5C5550]">Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warmth flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4725A] to-[#C85A44] flex items-center justify-center shadow-xl">
            <Heart className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold text-[#2D312A]" style={{ fontFamily: 'var(--font-display)' }}>
          Create New Password
        </h2>
        <p className="mt-3 text-center text-sm text-[#5C5550]/80 leading-relaxed">
          Choose a strong password for your account
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
                  Password Reset Successful!
                </h3>
                <p className="text-sm text-[#5C5550]/80 leading-relaxed px-4">
                  Your password has been updated. Redirecting you to sign in...
                </p>
              </div>
            </div>
          ) : error && error.includes('Invalid or expired') ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-orange-100 mx-auto">
                <AlertCircle className="h-9 w-9 text-red-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#2D312A]" style={{ fontFamily: 'var(--font-display)' }}>
                  Reset Link Invalid
                </h3>
                <p className="text-sm text-[#5C5550]/80 leading-relaxed px-4">
                  {error}
                </p>
              </div>
              <Link to="/forgot-password" className="block pt-4">
                <Button variant="primary" className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && !error.includes('Invalid or expired') && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 text-red-700 text-sm leading-relaxed">
                  <p className="font-semibold mb-1">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                <Input
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Create a strong password"
                  className="pl-10"
                  required
                />
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#5C5550]">
                        {getStrengthText()}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#FEF8F5] border border-[#D4725A]/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-[#D4725A] flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-[#5C5550] space-y-1">
                            <p className="font-semibold">Password requirements:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {passwordStrength.feedback.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                <Input
                  label="Confirm New Password"
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
                loading={isSubmitting}
                disabled={!password || !confirmPassword || passwordStrength.score < 3}
              >
                Reset Password
              </Button>
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
