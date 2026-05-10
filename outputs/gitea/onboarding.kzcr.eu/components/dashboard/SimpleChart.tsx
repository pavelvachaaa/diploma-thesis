'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'bar' | 'line';
  height?: number;
  showTrend?: boolean;
  loading?: boolean;
}

export function SimpleChart({ 
  title, 
  data, 
  type = 'bar', 
  height = 200, 
  showTrend = false,
  loading = false 
}: SimpleChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className={`bg-gray-200 rounded animate-pulse`} style={{ height: `${height}px` }}></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-gray-500 text-sm">Žádná data k zobrazení</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  // Calculate trend for the last two data points
  const trend = showTrend && data.length >= 2 
    ? data[data.length - 1].value - data[data.length - 2].value 
    : 0;
  
  const getTrendIcon = () => {
    if (!showTrend || trend === 0) return <Minus className="w-4 h-4" />;
    return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };
  
  const getTrendColor = () => {
    if (!showTrend || trend === 0) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {showTrend && (
            <Badge variant="outline" className={`${getTrendColor()}`}>
              <span className="flex items-center gap-1">
                {getTrendIcon()}
                {Math.abs(trend)}
              </span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: `${height}px` }}>
          {type === 'bar' ? (
            <div className="flex items-end justify-between h-full gap-2">
              {data.map((point, index) => {
                const barHeight = maxValue > 0 ? (point.value / maxValue) * (height - 40) : 0;
                const color = point.color || 'bg-blue-500';
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 max-w-16">
                    <div className="w-full flex flex-col items-center">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        {point.value.toLocaleString('cs-CZ')}
                      </div>
                      <div
                        className={`w-full ${color} rounded-t transition-all duration-500 ease-out hover:opacity-80`}
                        style={{ 
                          height: `${Math.max(barHeight, 4)}px`,
                          minHeight: '4px'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-2 text-center break-words leading-tight">
                      {point.label}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Simple line chart using CSS
            <div className="relative h-full">
              <svg width="100%" height="100%" className="absolute inset-0">
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  points={data
                    .map((point, index) => {
                      const x = (index / (data.length - 1)) * 100;
                      const y = 100 - (point.value / maxValue) * 80;
                      return `${x}%,${y}%`;
                    })
                    .join(' ')
                  }
                />
                {data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - (point.value / maxValue) * 80;
                  return (
                    <circle
                      key={index}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="#3B82F6"
                      className="hover:r-6 transition-all"
                    />
                  );
                })}
              </svg>
              
              {/* Labels */}
              <div className="absolute bottom-0 w-full flex justify-between">
                {data.map((point, index) => (
                  <div key={index} className="text-xs text-gray-600 text-center">
                    {point.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}