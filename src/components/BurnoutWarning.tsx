import { useState } from 'react';
import { Card, Button, Badge } from './ui';
import { AlertTriangle, X, Heart, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { BurnoutAnalysis } from '../lib/openai';

interface BurnoutWarningProps {
  analysis: BurnoutAnalysis;
  recipientName?: string;
}

export function BurnoutWarning({ analysis }: BurnoutWarningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || analysis.riskScore < 20) return null;

  const getRiskLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 60)
      return {
        label: 'High Risk',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
      };
    if (score >= 40)
      return {
        label: 'Moderate Risk',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
      };
    return {
      label: 'Low Risk',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200',
    };
  };

  const risk = getRiskLevel(analysis.riskScore);

  return (
    <Card
      variant="default"
      padding="md"
      className={`${risk.bgColor} border-2 relative`}
    >
      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss warning"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`h-10 w-10 rounded-xl ${risk.bgColor} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle className={`h-5 w-5 ${risk.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${risk.color}`}>Caregiver Wellbeing Check</h3>
              <Badge
                variant={analysis.riskScore >= 60 ? 'danger' : analysis.riskScore >= 40 ? 'warning' : 'default'}
                size="sm"
              >
                {risk.label} - {analysis.riskScore}/100
              </Badge>
            </div>

            {/* AI Insight */}
            {analysis.aiInsight && (
              <div className="flex items-start gap-2 mt-2">
                <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 italic">{analysis.aiInsight}</p>
              </div>
            )}

            {/* Summary when collapsed */}
            {!isExpanded && analysis.signals.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {analysis.signals[0]}
                {analysis.signals.length > 1 && ` (+${analysis.signals.length - 1} more signals)`}
              </p>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <div className="space-y-3 mt-4 ml-13">
            {/* Signals */}
            {analysis.signals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Detected Signals:</h4>
                <ul className="space-y-1">
                  {analysis.signals.map((signal, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className={`${risk.color} mt-0.5`}>•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Self-Care Recommendations:
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View Details & Recommendations
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
