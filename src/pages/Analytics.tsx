import { useMemo } from 'react';
import { useRecipients } from '../hooks/useRecipient';
import { useInteractions } from '../hooks/useInteractions';
import { Card, CardHeader, CardTitle, CardContent, Spinner, EmptyState } from '../components/ui';
import { TrendingUp, Activity, Calendar, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../lib/utils';

const COLORS = {
  conversation: '#8b5cf6',
  activity: '#ec4899',
  meal: '#f97316',
  outing: '#10b981',
  exercise: '#ef4444',
  relaxation: '#06b6d4',
  social: '#f59e0b',
  other: '#6b7280',
};

export function Analytics() {
  const { recipients } = useRecipients();
  const activeRecipient = recipients[0];
  const { interactions, stats, loading } = useInteractions(activeRecipient?.id);

  // Mood trend over time (last 30 days)
  const moodTrendData = useMemo(() => {
    if (!interactions.length) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dataByDate = interactions.reduce(
      (acc, interaction) => {
        const date = interaction.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { moods: [], success: [], energy: [] };
        }
        if (interaction.mood_rating) acc[date].moods.push(interaction.mood_rating);
        if (interaction.success_level) acc[date].success.push(interaction.success_level);
        if (interaction.energy_level) acc[date].energy.push(interaction.energy_level);
        return acc;
      },
      {} as Record<string, { moods: number[]; success: number[]; energy: number[] }>
    );

    return last30Days.map((date) => {
      const data = dataByDate[date];
      if (!data || data.moods.length === 0) return { date, mood: null, success: null, energy: null };

      return {
        date: formatDate(date),
        mood: (data.moods.reduce((a, b) => a + b, 0) / data.moods.length).toFixed(1),
        success: (data.success.reduce((a, b) => a + b, 0) / data.success.length).toFixed(1),
        energy: (data.energy.reduce((a, b) => a + b, 0) / data.energy.length).toFixed(1),
      };
    });
  }, [interactions]);

  // Activity distribution
  const activityDistribution = useMemo(() => {
    return Object.entries(stats.byActivityType).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: COLORS[type as keyof typeof COLORS] || COLORS.other,
    }));
  }, [stats.byActivityType]);

  // Success rate by activity type
  const successByType = useMemo(() => {
    const grouped = interactions.reduce(
      (acc, interaction) => {
        if (!acc[interaction.activity_type]) {
          acc[interaction.activity_type] = { total: 0, successful: 0 };
        }
        acc[interaction.activity_type].total++;
        if ((interaction.success_level || 0) >= 4) {
          acc[interaction.activity_type].successful++;
        }
        return acc;
      },
      {} as Record<string, { total: number; successful: number }>
    );

    return Object.entries(grouped).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      successRate: ((data.successful / data.total) * 100).toFixed(0),
      total: data.total,
    }));
  }, [interactions]);

  // Time of day analysis
  const timeOfDayData = useMemo(() => {
    const hours = { morning: 0, afternoon: 0, evening: 0 };
    interactions.forEach((interaction) => {
      const hour = new Date(interaction.created_at).getHours();
      if (hour >= 5 && hour < 12) hours.morning++;
      else if (hour >= 12 && hour < 17) hours.afternoon++;
      else hours.evening++;
    });

    return [
      { time: 'Morning', interactions: hours.morning },
      { time: 'Afternoon', interactions: hours.afternoon },
      { time: 'Evening', interactions: hours.evening },
    ];
  }, [interactions]);

  if (loading) {
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
          icon={<TrendingUp className="h-8 w-8" />}
          title="No care recipient selected"
          description="Add a care recipient first to see analytics."
        />
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card variant="elevated" padding="lg">
        <EmptyState
          icon={<Activity className="h-8 w-8" />}
          title="No data yet"
          description="Start logging interactions to see analytics and insights."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600">
          Data-driven insights for {activeRecipient.name}'s care
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Moments</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-gray-500">Avg Mood</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageSuccess > 0 ? stats.averageSuccess.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-gray-500">Avg Success</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mood Trend */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Mood Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={6} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#8b5cf6"
                  name="Mood"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#10b981"
                  name="Success"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate by Activity */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Success Rate by Activity Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={successByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successRate" fill="#10b981" name="Success Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time of Day */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Best Times for Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="interactions" fill="#f97316" name="Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
