import { useState, useEffect } from 'react';
import { useRecipients } from '../hooks/useRecipient';
import { useInteractions } from '../hooks/useInteractions';
import { usePreferences } from '../hooks/usePreferences';
import { generateActivitySuggestions } from '../lib/openai';
import { createSuggestion, updateSuggestionStatus, getSuggestions } from '../lib/supabase';
import { getTimeOfDay } from '../lib/utils';
import {
  Card,
  Button,
  Badge,
  Spinner,
  EmptyState,
} from '../components/ui';
import {
  Lightbulb,
  RefreshCw,
  Check,
  X,
  Clock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from 'lucide-react';
import type { ActivitySuggestion } from '../types';

export function Suggestions() {
  const { recipients, loading: recipientsLoading } = useRecipients();
  const activeRecipient = recipients[0];
  const { interactions } = useInteractions(activeRecipient?.id);
  const { preferences } = usePreferences(activeRecipient?.id);

  const [suggestions, setSuggestions] = useState<
    {
      activity: string;
      reasoning: string;
      estimated_duration: string;
      confidence: number;
      id?: string;
      status?: string;
    }[]
  >([]);
  const [savedSuggestions, setSavedSuggestions] = useState<ActivitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeRecipient) {
      loadSavedSuggestions();
    }
  }, [activeRecipient]);

  const loadSavedSuggestions = async () => {
    if (!activeRecipient) return;
    try {
      const data = await getSuggestions(activeRecipient.id);
      setSavedSuggestions(data as ActivitySuggestion[]);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const generateSuggestions = async () => {
    if (!activeRecipient) return;

    setLoading(true);
    setError(null);

    try {
      const timeOfDay = getTimeOfDay();
      const result = await generateActivitySuggestions(
        activeRecipient.name,
        interactions.slice(0, 10),
        preferences,
        undefined,
        timeOfDay
      );

      setSuggestions(result.suggestions);

      // Save suggestions to database
      for (const suggestion of result.suggestions) {
        try {
          await createSuggestion({
            recipient_id: activeRecipient.id,
            suggestion_text: suggestion.activity,
            reasoning: suggestion.reasoning,
            context: {
              time_of_day: timeOfDay,
              confidence: suggestion.confidence,
              estimated_duration: suggestion.estimated_duration,
            },
          });
        } catch (err) {
          console.error('Failed to save suggestion:', err);
        }
      }

      await loadSavedSuggestions();
    } catch (err) {
      setError('Failed to generate suggestions. Please try again.');
      console.error('Failed to generate suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (suggestionId: string) => {
    try {
      await updateSuggestionStatus(suggestionId, 'accepted');
      await loadSavedSuggestions();
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      await updateSuggestionStatus(suggestionId, 'rejected');
      await loadSavedSuggestions();
    } catch (err) {
      console.error('Failed to reject suggestion:', err);
    }
  };

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
          icon={<Lightbulb className="h-8 w-8" />}
          title="No care recipient selected"
          description="Add a care recipient first to get activity suggestions."
          action={{
            label: 'Add Care Recipient',
            onClick: () => (window.location.href = '/profile'),
          }}
        />
      </Card>
    );
  }

  const pendingSuggestions = savedSuggestions.filter((s) => s.status === 'pending');
  const acceptedSuggestions = savedSuggestions.filter((s) => s.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Suggestions</h1>
          <p className="text-gray-600">
            AI-powered ideas for {activeRecipient.name}
          </p>
        </div>
        <Button onClick={generateSuggestions} disabled={loading}>
          {loading ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {suggestions.length > 0 ? 'Get New Suggestions' : 'Generate Suggestions'}
        </Button>
      </div>

      {/* Context Card */}
      <Card variant="gradient" padding="md">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Personalized for {activeRecipient.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              Based on {interactions.length} logged interactions and {preferences.length} learned
              preferences. It's currently {getTimeOfDay()}, so suggestions are tailored for this
              time of day.
            </p>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>
      )}

      {/* New Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fresh Suggestions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} variant="elevated" padding="lg" hover>
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="primary">
                    <Zap className="h-3 w-3 mr-1" />
                    {Math.round(suggestion.confidence * 100)}% match
                  </Badge>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">{suggestion.estimated_duration}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{suggestion.activity}</h3>
                <p className="text-sm text-gray-600 mb-4">{suggestion.reasoning}</p>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Try This
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Suggestions */}
      {pendingSuggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Suggestions</h2>
          <div className="space-y-3">
            {pendingSuggestions.map((suggestion) => (
              <Card key={suggestion.id} variant="elevated" padding="md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{suggestion.suggestion_text}</h3>
                    {suggestion.reasoning && (
                      <p className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAccept(suggestion.id)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(suggestion.id)}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Suggestions */}
      {acceptedSuggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accepted Activities</h2>
          <div className="space-y-3">
            {acceptedSuggestions.slice(0, 5).map((suggestion) => (
              <Card key={suggestion.id} variant="default" padding="md">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{suggestion.suggestion_text}</h3>
                    <p className="text-xs text-gray-500">Accepted</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && savedSuggestions.length === 0 && !loading && (
        <Card variant="elevated" padding="lg">
          <EmptyState
            icon={<Lightbulb className="h-8 w-8" />}
            title="No suggestions yet"
            description={`Click "Generate Suggestions" to get personalized activity ideas for ${activeRecipient.name}.`}
          />
        </Card>
      )}
    </div>
  );
}
