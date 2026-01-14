import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { analyzeCaregiverBurnout, type BurnoutAnalysis } from '../lib/openai';
import { useRecipients } from '../hooks/useRecipient';
import { useInteractions } from '../hooks/useInteractions';
import { usePreferences } from '../hooks/usePreferences';
import { BurnoutWarning } from '../components/BurnoutWarning';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Avatar,
  Badge,
  EmptyState,
  Spinner,
  StatCardSkeleton,
  InteractionCardSkeleton,
} from '../components/ui';
import {
  Plus,
  BookOpen,
  Lightbulb,
  Heart,
  TrendingUp,
  Star,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { formatRelativeTime, getMoodEmoji, getActivityIcon } from '../lib/utils';

export function Dashboard() {
  const { recipients, loading: recipientsLoading } = useRecipients();
  const activeRecipient = recipients[0];
  const { interactions, stats, loading: interactionsLoading, refresh } = useInteractions(activeRecipient?.id);
  const { highConfidence } = usePreferences(activeRecipient?.id);
  const [copied, setCopied] = useState(false);
  const [burnoutAnalysis, setBurnoutAnalysis] = useState<BurnoutAnalysis | null>(null);

  const handleShareWithFamily = async () => {
    if (!activeRecipient) return;

    const shareUrl = `${window.location.origin}/family/${activeRecipient.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback: show alert with the link
      alert(`Share this link with family:\n${shareUrl}`);
    }
  };

  // Real-time subscription for live updates
  useEffect(() => {
    if (!activeRecipient?.id) return;

    const channel = supabase
      .channel('interactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: `recipient_id=eq.${activeRecipient.id}`,
        },
        () => {
          // Show toast notification for new moment
          toast.success('📝 New moment logged!', {
            duration: 4000,
          });

          // Refresh interactions to update stats and list
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRecipient?.id, refresh]);

  // Analyze caregiver burnout
  useEffect(() => {
    if (interactions.length >= 7) {
      analyzeCaregiverBurnout(interactions)
        .then(setBurnoutAnalysis)
        .catch((error) => {
          console.error('Failed to analyze burnout:', error);
        });
    }
  }, [interactions]);

  if (recipientsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activeRecipient) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card variant="gradient" padding="lg">
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="Welcome to CareConnect!"
            description="Start by adding a care recipient to begin your caregiving journey."
            action={{
              label: 'Add Care Recipient',
              onClick: () => (window.location.href = '/profile'),
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Good day! 👋</h1>
            <Badge variant="success" size="sm" className="animate-pulse">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></div>
              Live
            </Badge>
          </div>
          <p className="text-gray-600">Here's how {activeRecipient.name}'s care is going</p>
        </div>
        <Link to="/memory-book/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Interaction
          </Button>
        </Link>
      </div>

      {/* Burnout Warning */}
      {burnoutAnalysis && activeRecipient && (
        <BurnoutWarning analysis={burnoutAnalysis} recipientName={activeRecipient.name} />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {recipientsLoading || interactionsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                  <p className="text-xs text-gray-500">This week</p>
                </div>
              </div>
            </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-gray-500">Avg mood</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <Star className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.beautifulMoments.length}</p>
              <p className="text-xs text-gray-500">Beautiful moments</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{highConfidence.length}</p>
              <p className="text-xs text-gray-500">Preferences learned</p>
            </div>
          </div>
        </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Care Recipient Card */}
        <Card variant="gradient" padding="lg" className="lg:col-span-1">
          <div className="text-center">
            <Avatar
              src={activeRecipient.profile_photo}
              fallback={activeRecipient.name}
              size="xl"
              className="mx-auto"
            />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">{activeRecipient.name}</h2>
            {activeRecipient.age && (
              <p className="text-gray-500">{activeRecipient.age} years old</p>
            )}
            {activeRecipient.communication_style && (
              <Badge variant="primary" className="mt-3">
                {activeRecipient.communication_style}
              </Badge>
            )}
          </div>

          {activeRecipient.important_notes && (
            <div className="mt-6 p-4 bg-white/60 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-1">Important Notes</p>
              <p className="text-sm text-gray-600">{activeRecipient.important_notes}</p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Button variant="primary" className="w-full" onClick={handleShareWithFamily}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share with Family
                </>
              )}
            </Button>
            <Link to="/profile" className="block">
              <Button variant="outline" className="w-full">
                View Full Profile
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Interactions */}
        <Card variant="elevated" padding="lg" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Moments</CardTitle>
              <Link to="/memory-book">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {interactionsLoading ? (
              <div className="space-y-3">
                <InteractionCardSkeleton />
                <InteractionCardSkeleton />
                <InteractionCardSkeleton />
              </div>
            ) : interactions.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-6 w-6" />}
                title="No moments logged yet"
                description="Start capturing meaningful moments with your care recipient."
              />
            ) : (
              <div className="space-y-3">
                {interactions.slice(0, 5).map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl">{getActivityIcon(interaction.activity_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {interaction.title || interaction.activity_type}
                        </p>
                        {interaction.mood_rating && (
                          <span className="text-lg">{getMoodEmoji(interaction.mood_rating)}</span>
                        )}
                      </div>
                      {interaction.description && (
                        <p className="text-sm text-gray-500 truncate">{interaction.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(interaction.created_at)}
                      </p>
                    </div>
                    {interaction.success_level && interaction.success_level >= 4 && (
                      <Badge variant="success" size="sm">
                        <Star className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & AI Suggestions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Preferences */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <CardTitle>What {activeRecipient.name} Loves</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {highConfidence.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Preferences will appear here as you log more interactions.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {highConfidence.slice(0, 8).map((pref) => (
                  <Badge key={pref.id} variant="primary">
                    {pref.preference_value}
                  </Badge>
                ))}
              </div>
            )}
            <Link to="/preferences" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View All Preferences
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Suggestions Teaser */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle>AI Suggestions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Get personalized activity suggestions based on {activeRecipient.name}'s preferences
              and what's worked well before.
            </p>
            <Link to="/suggestions">
              <Button className="w-full">
                <Lightbulb className="h-4 w-4 mr-2" />
                Get Suggestions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
