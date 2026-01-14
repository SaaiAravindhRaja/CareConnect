import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Card, Spinner, Avatar, Badge, EmptyState } from '../components/ui';
import { Heart, Calendar, Smile, TrendingUp, Star, Radio } from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { CareRecipient, Interaction } from '../types';

export function FamilyPortal() {
  const { shareId } = useParams<{ shareId: string }>();
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInteractionIds, setNewInteractionIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    avgMood: 0,
    topActivities: [] as string[],
  });

  const loadInteractionsAndStats = useCallback(async () => {
    if (!shareId) return;

    try {
      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('recipient_id', shareId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (interactionsError) throw interactionsError;
      setInteractions(interactionsData || []);

      // Calculate stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weekInteractions = (interactionsData || []).filter(
        (i) => new Date(i.created_at) >= oneWeekAgo
      );

      const avgMood =
        (interactionsData || []).reduce((sum, i) => sum + (i.mood_rating || 0), 0) /
        ((interactionsData || []).length || 1);

      const activityCounts: Record<string, number> = {};
      (interactionsData || []).forEach((i) => {
        activityCounts[i.activity_type] = (activityCounts[i.activity_type] || 0) + 1;
      });

      const topActivities = Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      setStats({
        total: (interactionsData || []).length,
        thisWeek: weekInteractions.length,
        avgMood,
        topActivities,
      });
    } catch (error) {
      console.error('Failed to load interactions:', error);
    }
  }, [shareId]);

  useEffect(() => {
    async function loadPortalData() {
      if (!shareId) return;

      try {
        // Fetch recipient
        const { data: recipientData, error: recipientError } = await supabase
          .from('care_recipients')
          .select('*')
          .eq('id', shareId)
          .single();

        if (recipientError) throw recipientError;
        setRecipient(recipientData);

        // Load interactions
        await loadInteractionsAndStats();
      } catch (error) {
        console.error('Failed to load portal data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [shareId, loadInteractionsAndStats]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!shareId) return;

    const channel = supabase
      .channel('family-portal-interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: `recipient_id=eq.${shareId}`,
        },
        (payload) => {
          // Show toast notification
          toast.success('💝 New moment just logged!', {
            duration: 5000,
            icon: '✨',
          });

          // Mark as new for pulse animation
          const newId = payload.new.id as string;
          setNewInteractionIds((prev) => new Set(prev).add(newId));

          // Remove pulse after 3 seconds
          setTimeout(() => {
            setNewInteractionIds((prev) => {
              const updated = new Set(prev);
              updated.delete(newId);
              return updated;
            });
          }, 3000);

          // Refresh interactions and stats
          loadInteractionsAndStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareId, loadInteractionsAndStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <Card variant="elevated" padding="lg">
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="Portal not found"
            description="This family portal link may be invalid or expired."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={recipient.profile_photo} fallback={recipient.name} size="lg" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {recipient.name}'s Care Journey
                  </h1>
                  <Badge variant="success" size="sm" className="animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-gray-600 mt-1">
                  Shared with love by their caregiver
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="elevated" padding="md">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Beautiful Moments</p>
            </div>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-pink-100 flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Smile className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgMood.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Avg Mood</p>
            </div>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.topActivities.length > 0 ? '✨' : '-'}
              </p>
              <p className="text-xs text-gray-500">Active Care</p>
            </div>
          </Card>
        </div>

        {/* Recent Moments */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Beautiful Moments</h2>
          {interactions.length === 0 ? (
            <Card variant="elevated" padding="lg">
              <EmptyState
                icon={<Heart className="h-8 w-8" />}
                title="No moments yet"
                description="Check back soon for updates!"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <Card
                  key={interaction.id}
                  variant="elevated"
                  padding="lg"
                  hover
                  className={newInteractionIds.has(interaction.id) ? 'animate-pulse ring-2 ring-purple-400 ring-offset-2' : ''}
                >
                  <div className="flex items-start gap-4">
                    {/* Date indicator */}
                    <div className="flex-shrink-0 text-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {new Date(interaction.created_at).getDate()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(interaction.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                        })}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {interaction.title || 'Beautiful Moment'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(interaction.created_at)}
                          </p>
                        </div>
                        {interaction.mood_rating && interaction.mood_rating >= 4 && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-5 w-5 fill-current" />
                            <span className="text-sm font-medium">
                              {interaction.mood_rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      {interaction.description && (
                        <p className="text-gray-700 mb-3">{interaction.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">
                          {interaction.activity_type
                            .split('_')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}
                        </Badge>
                        {interaction.tags?.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4 text-pink-500" />
            <span>Made with love using CareConnect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
