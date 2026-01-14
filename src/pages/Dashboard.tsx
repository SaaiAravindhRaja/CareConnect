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
  Input,
  Textarea,
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
  User,
  Save,
  X,
  Edit2
} from 'lucide-react';
import { formatRelativeTime, getMoodEmoji, getActivityIcon } from '../lib/utils';

export function Dashboard() {
  const { recipients, loading: recipientsLoading, addRecipient, updateRecipient, refresh: refreshRecipients } = useRecipients();
  const activeRecipient = recipients[0]; // Currently defaulting to the first one for simplicity
  const { interactions, stats, loading: interactionsLoading, refresh } = useInteractions(activeRecipient?.id);
  const { highConfidence } = usePreferences(activeRecipient?.id);
  const [copied, setCopied] = useState(false);
  const [burnoutAnalysis, setBurnoutAnalysis] = useState<BurnoutAnalysis | null>(null);

  // Recipient Management State
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    communication_style: '',
    important_notes: '',
  });

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addRecipient({
        name: formData.name,
        age: formData.age && !isNaN(parseInt(formData.age)) ? parseInt(formData.age) : undefined,
        communication_style: formData.communication_style || undefined,
        important_notes: formData.important_notes || undefined,
      });
      setShowAddForm(false);
      setFormData({ name: '', age: '', communication_style: '', important_notes: '' });
      toast.success('Recipient added successfully!');
      refreshRecipients();
    } catch (error) {
      console.error('Failed to add recipient:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add recipient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecipient) return;
    setIsSubmitting(true);
    try {
      await updateRecipient(activeRecipient.id, {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        communication_style: formData.communication_style || undefined,
        important_notes: formData.important_notes || undefined,
      });
      setIsEditingRecipient(false);
      toast.success('Recipient details updated!');
      refreshRecipients();
    } catch (error) {
      console.error('Failed to update recipient:', error);
      toast.error('Failed to update recipient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    if (activeRecipient) {
      setFormData({
        name: activeRecipient.name,
        age: activeRecipient.age?.toString() || '',
        communication_style: activeRecipient.communication_style || '',
        important_notes: activeRecipient.important_notes || '',
      });
      setIsEditingRecipient(true);
    }
  };

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

  if (showAddForm) {
    return (
      <div className="max-w-xl mx-auto py-12 dashboard-enter">
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Care Recipient</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={handleAddRecipient}>
            <CardContent className="space-y-6">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name"
                required
              />
              <Input
                label="Age (optional)"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Age"
              />
              <Input
                label="Communication Style (optional)"
                value={formData.communication_style}
                onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
                placeholder="e.g. Verbal, Non-verbal"
              />
              <Textarea
                label="Important Notes (optional)"
                value={formData.important_notes}
                onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
                placeholder="Any special needs or preferences"
                rows={4}
              />
              <div className="flex justify-end gap-3 pt-4">
                 <Button variant="outline" type="button" onClick={() => setShowAddForm(false)}>Cancel</Button>
                 <Button type="submit" loading={isSubmitting}>Save Recipient</Button>
              </div>
            </CardContent>
          </form>
        </Card>
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
              onClick: () => setShowAddForm(true),
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-12 dashboard-enter">
      {/* Header - Apple Store Style */}
      <div className="relative pt-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-6 border-b border-[#d2d2d7]">
          <div className="space-y-2">
            <h1 className="text-[48px] font-bold text-[#1d1d1f] leading-tight tracking-tight">
              Dashboard.
              <span className="block text-[#86868b]">Overview for {activeRecipient.name}.</span>
            </h1>
          </div>
          <Link to="/memory-book/new">
            <Button size="lg" className="shadow-none text-[17px]">
              <Plus className="h-5 w-5 mr-2" />
              Capture a Moment
            </Button>
          </Link>
        </div>
      </div>

      {/* Burnout Warning */}
      {burnoutAnalysis && activeRecipient && (
        <BurnoutWarning analysis={burnoutAnalysis} recipientName={activeRecipient.name} />
      )}

      {/* Stats Grid - Cleaner grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {recipientsLoading || interactionsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card variant="elevated" padding="lg" className="group hover:-translate-y-0.5 transition-transform duration-300">
              <div className="flex flex-col h-full justify-between gap-4">
                <BookOpen className="h-8 w-8 text-[#0071e3]" />
                <div>
                  <p className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight">{stats.thisWeek}</p>
                  <p className="text-[13px] font-medium text-[#86868b]">Moments this week</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg" className="group hover:-translate-y-0.5 transition-transform duration-300">
              <div className="flex flex-col h-full justify-between gap-4">
                <TrendingUp className="h-8 w-8 text-[#30b0c7]" />
                <div>
                  <p className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight">
                    {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '-'}
                  </p>
                  <p className="text-[13px] font-medium text-[#86868b]">Average Mood</p>
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

            <Card variant="elevated" padding="lg" className="group hover:-translate-y-0.5 transition-transform duration-300">
              <div className="flex flex-col h-full justify-between gap-4">
                <Star className="h-8 w-8 text-[#bf5af2]" />
                <div>
                  <p className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight">{highConfidence.length}</p>
                  <p className="text-[13px] font-medium text-[#86868b]">Preferences</p>
                </div>
              </div>
            </Card>

             <Card variant="elevated" padding="lg" className="group hover:-translate-y-0.5 transition-transform duration-300">
              <div className="flex flex-col h-full justify-between gap-4">
                <Sparkles className="h-8 w-8 text-[#ff9500]" />
                <div>
                   {/* Placeholder for a 4th stat if we want it, or just keep 3 and adjust grid */}
                   {/* Let's verify if there is a 4th metric. The skeleton suggests 4. */}
                   {/* I'll duplicate the logic for now or add a dummy one for "Streak" or similar, or just close the fragment */}
                   <p className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight">Active</p>
                   <p className="text-[13px] font-medium text-[#86868b]">Status</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card variant="elevated" padding="lg" className="lg:col-span-1 h-fit">
          {isEditingRecipient ? (
            <div className="space-y-4">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-[#1d1d1f]">Edit Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingRecipient(false)}><X className="h-4 w-4" /></Button>
               </div>
               <form onSubmit={handleUpdateRecipient} className="space-y-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                  <Input
                    label="Communication Style"
                    value={formData.communication_style}
                    onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
                  />
                  <Textarea
                    label="Important Notes"
                    value={formData.important_notes}
                    onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
                    rows={3}
                  />
                   <Button type="submit" loading={isSubmitting} className="w-full">Save Changes</Button>
               </form>
            </div>
          ) : (
            <>
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <Avatar
                    src={activeRecipient.profile_photo}
                    fallback={activeRecipient.name}
                    size="xl"
                    className="mx-auto shadow-md"
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-[24px] font-bold text-[#1d1d1f] tracking-tight">
                    {activeRecipient.name}
                  </h2>
                  {activeRecipient.age && (
                    <p className="text-[#86868b] text-[15px]">{activeRecipient.age} years old</p>
                  )}
                </div>

                {activeRecipient.communication_style && (
                  <div className="pt-2">
                    <Badge variant="secondary" className="bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]">
                      {activeRecipient.communication_style}
                    </Badge>
                  </div>
                  )}
              </div>

              {activeRecipient.important_notes && (
                <div className="mt-8 p-6 bg-[#f5f5f7] rounded-[20px]">
                  <p className="text-[11px] font-semibold text-[#86868b] mb-2 uppercase tracking-wide">Important Notes</p>
                  <p className="text-[15px] text-[#1d1d1f] leading-relaxed">{activeRecipient.important_notes}</p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Button variant="primary" className="w-full justify-center" onClick={handleShareWithFamily}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Link Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </>
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="outline" className="justify-center" onClick={startEditing}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                   </Button>
                   <Button variant="outline" className="justify-center" onClick={() => {
                      setFormData({ name: '', age: '', communication_style: '', important_notes: '' });
                      setShowAddForm(true);
                   }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                   </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Recent Moments */}
        <Card variant="elevated" padding="lg" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[24px] font-bold text-[#1d1d1f] tracking-tight mb-0">Recent Moments</CardTitle>
                <p className="text-[13px] text-[#86868b] font-medium mt-1">Latest collected memories</p>
              </div>
              <Link to="/memory-book">
                <Button variant="ghost" size="sm" className="text-[#0071e3]">
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
               <div className="divide-y divide-[#e8e8ed]">
                {interactions.slice(0, 5).map((interaction, idx) => (
                  <div
                    key={interaction.id}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 h-12 w-12 rounded-[14px] bg-[#f5f5f7] flex items-center justify-center text-2xl">
                      {getActivityIcon(interaction.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[15px] text-[#1d1d1f] truncate">
                          {interaction.title || interaction.activity_type}
                        </p>
                        {interaction.mood_rating && (
                          <span className="text-lg">
                            {getMoodEmoji(interaction.mood_rating)}
                          </span>
                        )}
                      </div>
                      {interaction.description && (
                        <p className="text-[13px] text-[#86868b] leading-relaxed line-clamp-2">
                          {interaction.description}
                        </p>
                      )}
                      <p className="text-[11px] text-[#86868b]/70 font-medium mt-1.5">
                        {formatRelativeTime(interaction.created_at)}
                      </p>
                    </div>
                    {interaction.success_level && interaction.success_level >= 4 && (
                      <Badge variant="success" size="sm" className="flex-shrink-0 bg-[#e3ffe3] text-[#1d811d]">
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
