import { useState } from 'react';
import { useRecipients } from '../hooks/useRecipient';
import { usePreferences } from '../hooks/usePreferences';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
} from '../components/ui';
import { Heart, Plus, Check, Sparkles, X, AlertCircle } from 'lucide-react';
import type { PreferenceCategory } from '../types';

const categoryOptions: { value: PreferenceCategory; label: string; icon: string }[] = [
  { value: 'activity', label: 'Activities', icon: '🎯' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'routine', label: 'Routine', icon: '📅' },
  { value: 'dignity', label: 'Dignity & Respect', icon: '🙏' },
  { value: 'food', label: 'Food', icon: '🍽️' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'social', label: 'Social', icon: '👥' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export function Preferences() {
  const { recipients, loading: recipientsLoading } = useRecipients();
  const activeRecipient = recipients[0];
  const {
    preferences,
    byCategory,
    highConfidence,
    needsConfirmation,
    loading: preferencesLoading,
    addPreference,
    confirmPreference,
  } = usePreferences(activeRecipient?.id);

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'activity' as PreferenceCategory,
    preference_key: '',
    preference_value: '',
  });

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addPreference({
        category: formData.category,
        preference_key: formData.preference_key,
        preference_value: formData.preference_value,
        confidence_score: 1.0,
        source: 'manual',
      });
      setShowAddForm(false);
      setFormData({ category: 'activity', preference_key: '', preference_value: '' });
    } catch (error) {
      console.error('Failed to add preference:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (preferenceId: string) => {
    try {
      await confirmPreference(preferenceId);
    } catch (error) {
      console.error('Failed to confirm preference:', error);
    }
  };

  if (recipientsLoading || preferencesLoading) {
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
          icon={<Heart className="h-8 w-8" />}
          title="No care recipient selected"
          description="Add a care recipient first to track their preferences."
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
          <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
          <p className="text-gray-600">
            What {activeRecipient.name} likes and how to care for them best
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Preference
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="elevated" padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{preferences.length}</p>
            <p className="text-sm text-gray-500">Total Preferences</p>
          </div>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{highConfidence.length}</p>
            <p className="text-sm text-gray-500">High Confidence</p>
          </div>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">
              {preferences.filter((p) => p.source === 'ai_learned').length}
            </p>
            <p className="text-sm text-gray-500">AI Learned</p>
          </div>
        </Card>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card variant="gradient" padding="lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New Preference</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={handleAddPreference}>
            <CardContent className="space-y-4">
              <Select
                label="Category"
                options={categoryOptions.map((c) => ({
                  value: c.value,
                  label: `${c.icon} ${c.label}`,
                }))}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as PreferenceCategory })
                }
                required
              />

              <Input
                label="Name"
                value={formData.preference_key}
                onChange={(e) => setFormData({ ...formData, preference_key: e.target.value })}
                placeholder="e.g., Favorite music"
                required
              />

              <Input
                label="Value"
                value={formData.preference_value}
                onChange={(e) => setFormData({ ...formData, preference_value: e.target.value })}
                placeholder="e.g., Classical music, especially Bach"
                required
              />

              <div className="flex gap-3">
                <Button type="submit" loading={isSubmitting}>
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {/* Needs Confirmation */}
      {needsConfirmation.length > 0 && (
        <Card variant="elevated" padding="lg" className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>Needs Confirmation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              These preferences were learned by AI or haven't been confirmed recently. Please
              verify they're still accurate.
            </p>
            <div className="space-y-2">
              {needsConfirmation.slice(0, 5).map((pref) => (
                <div
                  key={pref.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{pref.preference_key}</p>
                    <p className="text-sm text-gray-600">{pref.preference_value}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleConfirm(pref.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Confirm
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences by Category */}
      {preferences.length === 0 ? (
        <Card variant="elevated" padding="lg">
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="No preferences yet"
            description={`Add preferences manually or log interactions to help AI learn what ${activeRecipient.name} likes.`}
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {categoryOptions.map((category) => {
            const categoryPrefs = byCategory[category.value] || [];
            if (categoryPrefs.length === 0) return null;

            return (
              <Card key={category.value} variant="elevated" padding="lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <CardTitle>{category.label}</CardTitle>
                    <Badge variant="outline" size="sm">
                      {categoryPrefs.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryPrefs.map((pref) => (
                      <div key={pref.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{pref.preference_key}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{pref.preference_value}</p>
                          </div>
                          {pref.source === 'ai_learned' && (
                            <Badge variant="primary" size="sm">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${pref.confidence_score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(pref.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
