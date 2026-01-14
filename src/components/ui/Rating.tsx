import { cn } from '../../lib/utils';
import { Star, Smile, Meh, Frown, Heart } from 'lucide-react';

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'stars' | 'mood' | 'hearts';
  label?: string;
  readonly?: boolean;
}

export function Rating({
  value,
  onChange,
  max = 5,
  size = 'md',
  variant = 'stars',
  label,
  readonly = false,
}: RatingProps) {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const getMoodIcon = (rating: number, isActive: boolean) => {
    const icons = {
      1: Frown,
      2: Frown,
      3: Meh,
      4: Smile,
      5: Smile,
    };
    const Icon = icons[rating as keyof typeof icons] || Meh;
    return <Icon className={cn(sizes[size], isActive ? 'fill-current' : '')} />;
  };

  const getMoodColor = (rating: number, isActive: boolean) => {
    if (!isActive) return 'text-gray-300';
    const colors = {
      1: 'text-red-500',
      2: 'text-orange-500',
      3: 'text-yellow-500',
      4: 'text-lime-500',
      5: 'text-green-500',
    };
    return colors[rating as keyof typeof colors] || 'text-gray-400';
  };

  const renderStar = (rating: number) => {
    const isActive = rating <= value;
    return (
      <button
        key={rating}
        type="button"
        onClick={() => !readonly && onChange?.(rating)}
        disabled={readonly}
        aria-label={`Rate ${rating} out of ${max} stars`}
        aria-pressed={isActive}
        className={cn(
          'transition-all duration-200',
          !readonly && 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded',
          isActive ? 'text-yellow-400' : 'text-gray-300'
        )}
      >
        <Star className={cn(sizes[size], isActive && 'fill-current')} aria-hidden="true" />
      </button>
    );
  };

  const renderMood = (rating: number) => {
    const isActive = rating === value;
    const moodLabels = { 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Excellent' };
    return (
      <button
        key={rating}
        type="button"
        onClick={() => !readonly && onChange?.(rating)}
        disabled={readonly}
        aria-label={`Set mood to ${moodLabels[rating as keyof typeof moodLabels]}`}
        aria-pressed={isActive}
        className={cn(
          'transition-all duration-200',
          !readonly && 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded',
          getMoodColor(rating, isActive)
        )}
      >
        {getMoodIcon(rating, isActive)}
      </button>
    );
  };

  const renderHeart = (rating: number) => {
    const isActive = rating <= value;
    return (
      <button
        key={rating}
        type="button"
        onClick={() => !readonly && onChange?.(rating)}
        disabled={readonly}
        aria-label={`Rate ${rating} out of ${max} hearts`}
        aria-pressed={isActive}
        className={cn(
          'transition-all duration-200',
          !readonly && 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded',
          isActive ? 'text-pink-500' : 'text-gray-300'
        )}
      >
        <Heart className={cn(sizes[size], isActive && 'fill-current')} aria-hidden="true" />
      </button>
    );
  };

  return (
    <div>
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div className="flex gap-1">
        {variant === 'stars' &&
          Array.from({ length: max }, (_, i) => renderStar(i + 1))}
        {variant === 'mood' &&
          Array.from({ length: max }, (_, i) => renderMood(i + 1))}
        {variant === 'hearts' &&
          Array.from({ length: max }, (_, i) => renderHeart(i + 1))}
      </div>
    </div>
  );
}
