import { useState } from 'react';
import { useRecipients, useRecipient } from '../hooks/useRecipient';
import { useAuth } from '../context/AuthContext';
import { seedDemoData } from '../lib/seedDemoData';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Textarea,
  Avatar,
  Spinner,
  EmptyState,
} from '../components/ui';
import { Plus, User, Heart, Edit2, Save, X, Sparkles } from 'lucide-react';

export function Profile() {
  const { recipients, loading, addRecipient, refresh } = useRecipients();
  const { user, caregiver } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Form state
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
        age: formData.age ? parseInt(formData.age) : undefined,
        communication_style: formData.communication_style || undefined,
        important_notes: formData.important_notes || undefined,
      });
      setShowAddForm(false);
      setFormData({ name: '', age: '', communication_style: '', important_notes: '' });
    } catch (error) {
      console.error('Failed to add recipient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDemo = async () => {
    if (!user || !caregiver) return;
    setIsLoadingDemo(true);
    try {
      await seedDemoData(user.id, caregiver.id);
      await refresh();
    } catch (error) {
      console.error('Failed to load demo data:', error);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Care Recipients</h1>
          <p className="text-gray-600">Manage the people you care for</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Care Recipient
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card variant="gradient" padding="lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Care Recipient</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={handleAddRecipient}>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter their name"
                required
              />

              <Input
                label="Age (optional)"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter their age"
              />

              <Input
                label="Communication Style (optional)"
                value={formData.communication_style}
                onChange={(e) => setFormData({ ...formData, communication_style: e.target.value })}
                placeholder="e.g., Prefers gentle tone, needs time to respond"
              />

              <Textarea
                label="Important Notes (optional)"
                value={formData.important_notes}
                onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
                placeholder="Any important things to remember about their care, preferences, or needs"
                rows={3}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
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

      {/* Recipients List */}
      {recipients.length === 0 && !showAddForm ? (
        <Card variant="elevated" padding="lg">
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="No care recipients yet"
            description="Add your first care recipient to start tracking their preferences and moments."
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Care Recipient
            </Button>
            <Button variant="outline" onClick={handleLoadDemo} loading={isLoadingDemo}>
              <Sparkles className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {recipients.map((recipient) => (
            <RecipientCard key={recipient.id} recipientId={recipient.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipientCard({ recipientId }: { recipientId: string }) {
  const { recipient, loading } = useRecipient(recipientId);

  if (loading || !recipient) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" hover>
      <div className="flex items-start gap-4">
        <Avatar src={recipient.profile_photo} fallback={recipient.name} size="lg" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{recipient.name}</h3>
          {recipient.age && <p className="text-sm text-gray-500">{recipient.age} years old</p>}
        </div>
      </div>

      {recipient.communication_style && (
        <div className="mt-4 p-3 bg-purple-50 rounded-xl">
          <p className="text-xs font-medium text-purple-700 mb-1">Communication Style</p>
          <p className="text-sm text-purple-900">{recipient.communication_style}</p>
        </div>
      )}

      {recipient.important_notes && (
        <div className="mt-3 p-3 bg-pink-50 rounded-xl">
          <p className="text-xs font-medium text-pink-700 mb-1">Important Notes</p>
          <p className="text-sm text-pink-900">{recipient.important_notes}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="flex-1">
          <User className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </div>
    </Card>
  );
}
