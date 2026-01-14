import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecipients } from '../hooks/useRecipient';
import { useInteractions } from '../hooks/useInteractions';
import {
  Card,
  Button,
  Badge,
  Select,
  Input,
  Spinner,
  EmptyState,
} from '../components/ui';
import {
  Plus,
  BookOpen,
  Search,
  Calendar,
  Image,
  Star,
} from 'lucide-react';
import {
  formatDate,
  formatTime,
  getMoodEmoji,
  getMoodLabel,
  getActivityIcon,
  getActivityColor,
} from '../lib/utils';
import type { Interaction, ActivityType } from '../types';

const activityTypes: { value: ActivityType | ''; label: string }[] = [
  { value: '', label: 'All Activities' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'activity', label: 'Activity' },
  { value: 'meal', label: 'Meal' },
  { value: 'outing', label: 'Outing' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

export function MemoryBook() {
  const { recipients, loading: recipientsLoading } = useRecipients();
  const activeRecipient = recipients[0];
  const { interactions, loading: interactionsLoading } = useInteractions(activeRecipient?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityType | ''>('');
  const [filterMood, setFilterMood] = useState<string>('');

  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch =
      !searchQuery ||
      interaction.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interaction.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = !filterType || interaction.activity_type === filterType;
    const matchesMood = !filterMood || interaction.mood_rating?.toString() === filterMood;

    return matchesSearch && matchesType && matchesMood;
  });

  // Group by date
  const groupedInteractions = filteredInteractions.reduce(
    (groups, interaction) => {
      const date = formatDate(interaction.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(interaction);
      return groups;
    },
    {} as Record<string, Interaction[]>
  );

  if (recipientsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activeRecipient) {
    return (
      <Card variant="elevated" padding="lg">
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No care recipient selected"
          description="Add a care recipient first to start logging interactions."
          action={{
            label: 'Add Care Recipient',
            onClick: () => (window.location.href = '/profile'),
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Memory Book</h1>
          <p className="text-gray-600">
            {activeRecipient.name}'s moments and interactions
          </p>
        </div>
        <Link to="/memory-book/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log New Moment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search moments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={activityTypes}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ActivityType | '')}
            className="sm:w-48"
          />
          <Select
            options={[
              { value: '', label: 'All Moods' },
              { value: '5', label: '😊 Excellent' },
              { value: '4', label: '🙂 Good' },
              { value: '3', label: '😐 Neutral' },
              { value: '2', label: '😕 Low' },
              { value: '1', label: '😢 Very Low' },
            ]}
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="sm:w-40"
          />
        </div>
      </Card>

      {/* Timeline */}
      {interactionsLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredInteractions.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title={searchQuery || filterType || filterMood ? 'No matching moments' : 'No moments yet'}
            description={
              searchQuery || filterType || filterMood
                ? 'Try adjusting your filters.'
                : `Start capturing beautiful moments with ${activeRecipient.name}.`
            }
            action={
              !searchQuery && !filterType && !filterMood
                ? {
                    label: 'Log First Moment',
                    onClick: () => (window.location.href = '/memory-book/new'),
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedInteractions).map(([date, dateInteractions]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-medium text-gray-500">{date}</h2>
              </div>
              <div className="space-y-3">
                {dateInteractions.map((interaction) => (
                  <InteractionCard key={interaction.id} interaction={interaction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InteractionCard({ interaction }: { interaction: Interaction }) {
  const isBeautifulMoment =
    (interaction.mood_rating || 0) >= 4 && (interaction.success_level || 0) >= 4;

  return (
    <Card
      variant={isBeautifulMoment ? 'gradient' : 'elevated'}
      padding="md"
      hover
      className="cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{getActivityIcon(interaction.activity_type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">
                  {interaction.title || interaction.activity_type}
                </h3>
                <Badge className={getActivityColor(interaction.activity_type)} size="sm">
                  {interaction.activity_type}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatTime(interaction.created_at)}
              </p>
            </div>
            {isBeautifulMoment && (
              <Badge variant="success" size="sm">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Beautiful Moment
              </Badge>
            )}
          </div>

          {interaction.description && (
            <p className="text-gray-600 mt-2 text-sm">{interaction.description}</p>
          )}

          {/* Ratings */}
          <div className="flex items-center gap-4 mt-3">
            {interaction.mood_rating && (
              <div className="flex items-center gap-1">
                <span className="text-lg">{getMoodEmoji(interaction.mood_rating)}</span>
                <span className="text-xs text-gray-500">{getMoodLabel(interaction.mood_rating)}</span>
              </div>
            )}
            {interaction.success_level && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  Success: {interaction.success_level}/5
                </span>
              </div>
            )}
            {interaction.energy_level && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  Energy: {interaction.energy_level}/5
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {interaction.tags && interaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {interaction.tags.map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Photos gallery */}
          {interaction.photos && interaction.photos.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                {interaction.photos.slice(0, 6).map((photoUrl, index) => (
                  <img
                    key={index}
                    src={photoUrl}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(photoUrl, '_blank')}
                  />
                ))}
              </div>
              {interaction.photos.length > 6 && (
                <p className="text-xs text-gray-500 mt-1">
                  +{interaction.photos.length - 6} more photo(s)
                </p>
              )}
            </div>
          )}

          {/* AI Insights */}
          {interaction.ai_insights && (
            <div className="mt-3 p-2 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-700">{interaction.ai_insights}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
