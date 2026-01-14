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
    <div className="space-y-10">
      {/* Hero Header - Editorial Style */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b-2 border-[#D4725A]/10">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-[#2D312A] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Good day
              </h1>
              <Badge variant="success" size="sm" className="animate-pulse">
                <div className="h-2 w-2 bg-[#8B9A7C] rounded-full mr-1.5"></div>
                Live
              </Badge>
            </div>
            <p className="text-lg text-[#5C5550]/80 max-w-2xl leading-relaxed">
              Here's how <span className="font-semibold text-[#D4725A]">{activeRecipient.name}</span>'s care is flourishing today
            </p>
            <div className="flex items-center gap-2 text-sm text-[#8B7355]">
              <Heart className="h-4 w-4" />
              <span className="handwritten-note text-base">Every moment matters</span>
            </div>
          </div>
          <Link to="/memory-book/new">
            <Button size="lg" aria-label="Log a new interaction or moment" className="shadow-xl">
              <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
              Capture a Moment
            </Button>
          </Link>
        </div>
      </div>

      {/* Burnout Warning */}
      {burnoutAnalysis && activeRecipient && (
        <BurnoutWarning analysis={burnoutAnalysis} recipientName={activeRecipient.name} />
      )}

      {/* Beautiful Stats Grid - Asymmetric Editorial Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {recipientsLoading || interactionsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card variant="elevated" padding="md" className="stagger-item group hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FBDDD0] to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative flex flex-col gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FBDDD0] to-[#FDEEE7] flex items-center justify-center shadow-lg">
                  <BookOpen className="h-6 w-6 text-[#D4725A]" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#2D312A] mb-1" style={{ fontFamily: 'var(--font-display)' }}>{stats.thisWeek}</p>
                  <p className="text-xs text-[#5C5550]/60 uppercase tracking-wider font-medium">This week</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" className="stagger-item group hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#D4DCC9] to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative flex flex-col gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#D4DCC9] to-[#E8ECE4] flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-[#8B9A7C]" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#2D312A] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '-'}
                  </p>
                  <p className="text-xs text-[#5C5550]/60 uppercase tracking-wider font-medium">Avg mood</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" className="stagger-item group hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FAECC4] to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative flex flex-col gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FAECC4] to-[#FDF5E1] flex items-center justify-center shadow-lg">
                  <Star className="h-6 w-6 text-[#E8B863]" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#2D312A] mb-1" style={{ fontFamily: 'var(--font-display)' }}>{stats.beautifulMoments.length}</p>
                  <p className="text-xs text-[#5C5550]/60 uppercase tracking-wider font-medium">Beautiful moments</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md" className="stagger-item group hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FBDDD0] to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative flex flex-col gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#D4725A] to-[#C85A44] flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#2D312A] mb-1" style={{ fontFamily: 'var(--font-display)' }}>{highConfidence.length}</p>
                  <p className="text-xs text-[#5C5550]/60 uppercase tracking-wider font-medium">Preferences learned</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Beautiful Care Recipient Card - Polaroid Style */}
        <Card variant="gradient" padding="lg" className="lg:col-span-1 stagger-item ribbon-bookmark relative">
          <div className="text-center space-y-5">
            <div className="relative inline-block">
              <Avatar
                src={activeRecipient.profile_photo}
                fallback={activeRecipient.name}
                size="xl"
                className="mx-auto ring-4 ring-white shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-gradient-to-br from-[#E8B863] to-[#D4A451] rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-[#2D312A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {activeRecipient.name}
              </h2>
              {activeRecipient.age && (
                <p className="text-[#5C5550]/70 text-sm">{activeRecipient.age} years young</p>
              )}
              {activeRecipient.communication_style && (
                <Badge variant="primary" className="mt-3">
                  {activeRecipient.communication_style}
                </Badge>
              )}
            </div>
          </div>

          {activeRecipient.important_notes && (
            <div className="mt-8 p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#D4725A]/10 shadow-inner">
              <p className="text-xs font-semibold text-[#D4725A] mb-2 uppercase tracking-wider">Important Notes</p>
              <p className="text-sm text-[#5C5550] leading-relaxed handwritten-note">{activeRecipient.important_notes}</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
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

        {/* Recent Moments - Polaroid Memory Cards */}
        <Card variant="elevated" padding="lg" className="lg:col-span-2 stagger-item">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Recent Moments</CardTitle>
                <p className="text-sm text-[#8B7355] handwritten-note">A collection of memories</p>
              </div>
              <Link to="/memory-book">
                <Button variant="ghost" size="sm" className="hover:bg-[#FEF8F5]">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {interactionsLoading ? (
              <div className="space-y-4">
                <InteractionCardSkeleton />
                <InteractionCardSkeleton />
                <InteractionCardSkeleton />
              </div>
            ) : interactions.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<BookOpen className="h-8 w-8" />}
                  title="No moments logged yet"
                  description="Start capturing meaningful moments with your care recipient."
                />
              </div>
            ) : (
              <div className="space-y-4">
                {interactions.slice(0, 5).map((interaction, idx) => (
                  <div
                    key={interaction.id}
                    className="group flex items-start gap-4 p-5 rounded-2xl hover:bg-gradient-to-br hover:from-[#FEF8F5] hover:to-[#FDEEE7] transition-all duration-500 border border-transparent hover:border-[#D4725A]/20 hover:shadow-lg cursor-pointer transform hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#FBDDD0] to-[#FDEEE7] flex items-center justify-center text-3xl shadow-md group-hover:shadow-xl transition-shadow">
                      {getActivityIcon(interaction.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-[#2D312A] text-lg truncate">
                          {interaction.title || interaction.activity_type}
                        </p>
                        {interaction.mood_rating && (
                          <span className="text-2xl transform group-hover:scale-110 transition-transform">
                            {getMoodEmoji(interaction.mood_rating)}
                          </span>
                        )}
                      </div>
                      {interaction.description && (
                        <p className="text-sm text-[#5C5550]/80 leading-relaxed mb-2 line-clamp-2">
                          {interaction.description}
                        </p>
                      )}
                      <p className="text-xs text-[#8B7355] font-medium">
                        {formatRelativeTime(interaction.created_at)}
                      </p>
                    </div>
                    {interaction.success_level && interaction.success_level >= 4 && (
                      <Badge variant="success" size="sm" className="flex-shrink-0">
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

      {/* Beautiful Preferences & AI Suggestions Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Top Preferences - Elegant Tags */}
        <Card variant="elevated" padding="lg" className="stagger-item hover:shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#FBDDD0] to-transparent rounded-full blur-3xl opacity-30"></div>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#D4725A] to-[#C85A44] flex items-center justify-center shadow-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">What {activeRecipient.name} Loves</CardTitle>
                <p className="text-xs text-[#8B7355] mt-1 handwritten-note">Learned from shared moments</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {highConfidence.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#5C5550]/60 text-sm italic">
                  Preferences will blossom here as you log more interactions
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {highConfidence.slice(0, 8).map((pref, idx) => (
                  <Badge
                    key={pref.id}
                    variant="primary"
                    className="transform hover:scale-105 hover:shadow-md transition-all"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {pref.preference_value}
                  </Badge>
                ))}
              </div>
            )}
            <Link to="/preferences" className="block mt-6">
              <Button variant="outline" size="sm" className="w-full">
                Explore All Preferences
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Suggestions - Magical Teaser */}
        <Card variant="gradient" padding="lg" className="stagger-item hover:shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#E8B863] to-transparent rounded-full blur-3xl opacity-30"></div>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#E8B863] to-[#D4A451] flex items-center justify-center shadow-lg animate-pulse">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI-Powered Suggestions</CardTitle>
                <p className="text-xs text-[#8B7355] mt-1 handwritten-note">Thoughtfully curated for you</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-[#5C5550]/80 text-sm mb-6 leading-relaxed">
              Discover personalized activity ideas based on {activeRecipient.name}'s unique preferences
              and cherished moments you've shared together.
            </p>
            <Link to="/suggestions">
              <Button className="w-full shadow-xl transform hover:scale-105 transition-all">
                <Lightbulb className="h-5 w-5 mr-2" />
                Explore Suggestions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
