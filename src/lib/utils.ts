import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getMoodEmoji(rating: number): string {
  const emojis: Record<number, string> = {
    1: '😢',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😊',
  };
  return emojis[rating] || '😐';
}

export function getMoodLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Excellent',
  };
  return labels[rating] || 'Unknown';
}

export function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    conversation: '💬',
    activity: '🎯',
    meal: '🍽️',
    outing: '🚶',
    exercise: '🏃',
    relaxation: '😌',
    social: '👥',
    other: '📝',
  };
  return icons[type] || '📝';
}

export function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    conversation: 'bg-blue-100 text-blue-800',
    activity: 'bg-purple-100 text-purple-800',
    meal: 'bg-orange-100 text-orange-800',
    outing: 'bg-green-100 text-green-800',
    exercise: 'bg-red-100 text-red-800',
    relaxation: 'bg-teal-100 text-teal-800',
    social: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return crypto.randomUUID();
}
