import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useRecipients } from '../hooks/useRecipient';
import { useInteractions } from '../hooks/useInteractions';
import { usePreferences } from '../hooks/usePreferences';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { extractPreferencesFromInteraction, generateInsightsFromInteraction } from '../lib/openai';
import { uploadPhoto, getPhotoUrl } from '../lib/supabase';
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Select,
  Rating,
  Badge,
  Spinner,
} from '../components/ui';
import { ArrowLeft, Save, Plus, Sparkles, Mic, MicOff, Camera, X as XIcon } from 'lucide-react';
import type { ActivityType, MoodLevel, InteractionFormData } from '../types';

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'conversation', label: '💬 Conversation' },
  { value: 'activity', label: '🎯 Activity' },
  { value: 'meal', label: '🍽️ Meal' },
  { value: 'outing', label: '🚶 Outing' },
  { value: 'exercise', label: '🏃 Exercise' },
  { value: 'relaxation', label: '😌 Relaxation' },
  { value: 'social', label: '👥 Social' },
  { value: 'other', label: '📝 Other' },
];

const suggestedTags = [
  'music',
  'family',
  'outdoors',
  'memory',
  'laughter',
  'calm',
  'creative',
  'food',
  'morning',
  'afternoon',
  'evening',
  'exercise',
  'reading',
  'games',
  'photos',
];

export function LogInteraction() {
  const navigate = useNavigate();
  const { recipients, loading: recipientsLoading } = useRecipients();
  const activeRecipient = recipients[0];
  const { addInteraction } = useInteractions(activeRecipient?.id);
  const { preferences, addPreference } = usePreferences(activeRecipient?.id);
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState<InteractionFormData>({
    activity_type: 'activity',
    title: '',
    description: '',
    mood_rating: 3 as MoodLevel,
    success_level: 3 as MoodLevel,
    energy_level: 3 as MoodLevel,
    tags: [],
    photos: [],
  });

  // Update description when transcript changes
  useEffect(() => {
    if (transcript) {
      setFormData((prev) => ({
        ...prev,
        description: prev.description ? `${prev.description} ${transcript}` : transcript,
      }));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeRecipient) return;

    setIsUploadingPhoto(true);
    try {
      const newPhotoUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${activeRecipient.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        await uploadPhoto(file, fileName);

        // Get public URL
        const publicUrl = getPhotoUrl(fileName);
        newPhotoUrls.push(publicUrl);
      }

      setUploadedPhotos((prev) => [...prev, ...newPhotoUrls]);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (photoUrl: string) => {
    setUploadedPhotos((prev) => prev.filter((url) => url !== photoUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecipient) return;

    setIsSubmitting(true);

    try {
      // Generate AI insight BEFORE creating interaction
      const tempInteraction = {
        ...formData,
        recipient_id: activeRecipient.id,
      };
      const aiInsight = await generateInsightsFromInteraction(tempInteraction as any);

      // Create the interaction WITH the AI insight and photos
      const interaction = await addInteraction(
        formData,
        uploadedPhotos,
        aiInsight || undefined
      );

      // Celebrate beautiful moments with confetti!
      const isBeautifulMoment =
        (formData.mood_rating >= 4 && formData.success_level >= 4) ||
        formData.mood_rating === 5 ||
        formData.success_level === 5;

      if (isBeautifulMoment) {
        // Fire confetti celebration
        const duration = 2000;
        const end = Date.now() + duration;

        const colors = ['#9333ea', '#ec4899', '#f97316', '#10b981'];

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }

      // Extract preferences in background
      if (interaction) {
        // Extract preferences from the interaction
        const newPreferences = await extractPreferencesFromInteraction(interaction, preferences);

        // Save new preferences
        for (const pref of newPreferences) {
          try {
            await addPreference({
              category: pref.category as any,
              preference_key: pref.preference_key,
              preference_value: pref.preference_value,
              confidence_score: pref.confidence_score,
              source: 'ai_learned',
            });
          } catch (err) {
            console.error('Failed to save preference:', err);
          }
        }
      }

      // Success toast
      if (isBeautifulMoment) {
        toast.success('🎉 Beautiful moment captured!');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        toast.success('Moment saved successfully!');
      }

      navigate('/memory-book');
    } catch (error) {
      toast.error('Failed to save moment. Please try again.');
      console.error('Failed to log interaction:', error);
    } finally {
      setIsSubmitting(false);
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
    navigate('/profile');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log a Moment</h1>
          <p className="text-gray-600">
            Capture an interaction with {activeRecipient.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card variant="elevated" padding="lg">
          <CardContent className="space-y-6">
            {/* Activity Type */}
            <Select
              label="Activity Type"
              options={activityTypes}
              value={formData.activity_type}
              onChange={(e) =>
                setFormData({ ...formData, activity_type: e.target.value as ActivityType })
              }
              required
            />

            {/* Title */}
            <Input
              label="Title (optional)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Give this moment a name"
            />

            {/* Description with Voice Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  What happened?
                </label>
                {isSupported && (
                  <Button
                    type="button"
                    variant={isListening ? 'primary' : 'outline'}
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className={isListening ? 'animate-pulse' : ''}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-1" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-1" />
                        Voice Input
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Textarea
                value={formData.description + (interimTranscript ? ` ${interimTranscript}` : '')}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you did together, how they responded, and any observations... Or use voice input!"
                rows={4}
                className={isListening ? 'ring-2 ring-purple-400 ring-offset-2' : ''}
              />
              {isListening && (
                <div className="flex items-center gap-2 mt-2 text-sm text-purple-600">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-medium">Listening...</span>
                </div>
              )}
            </div>

            {/* Ratings */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <Rating
                  label="Mood"
                  value={formData.mood_rating}
                  onChange={(value) =>
                    setFormData({ ...formData, mood_rating: value as MoodLevel })
                  }
                  variant="mood"
                />
                <p className="text-xs text-gray-500 mt-1">How was their mood?</p>
              </div>

              <div>
                <Rating
                  label="Success"
                  value={formData.success_level}
                  onChange={(value) =>
                    setFormData({ ...formData, success_level: value as MoodLevel })
                  }
                  variant="stars"
                />
                <p className="text-xs text-gray-500 mt-1">How well did it go?</p>
              </div>

              <div>
                <Rating
                  label="Energy"
                  value={formData.energy_level}
                  onChange={(value) =>
                    setFormData({ ...formData, energy_level: value as MoodLevel })
                  }
                  variant="hearts"
                />
                <p className="text-xs text-gray-500 mt-1">Energy level?</p>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              <div className="space-y-3">
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedPhotos.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photoUrl)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={isUploadingPhoto}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingPhoto}
                      className="w-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('photo-upload')?.click();
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isUploadingPhoto ? 'Uploading...' : 'Add Photos'}
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Capture special moments together</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="primary" removable onRemove={() => removeTag(tag)}>
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestedTags
                  .filter((tag) => !formData.tags.includes(tag))
                  .slice(0, 8)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>

            {/* AI hint */}
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">AI Learning</p>
                <p className="text-xs text-purple-700">
                  Our AI will analyze this interaction to learn {activeRecipient.name}'s
                  preferences and suggest better activities in the future.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={isSubmitting} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Moment
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
