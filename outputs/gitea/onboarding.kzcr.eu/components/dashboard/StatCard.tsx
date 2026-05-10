'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-500',
    text: 'text-blue-600',
    value: 'text-blue-700'
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-500',
    text: 'text-green-600',
    value: 'text-green-700'
  },
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-500',
    text: 'text-orange-600',
    value: 'text-orange-700'
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-500',
    text: 'text-purple-600',
    value: 'text-purple-700'
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-500',
    text: 'text-red-600',
    value: 'text-red-700'
  },
  gray: {
    bg: 'bg-gray-50',
    iconBg: 'bg-gray-500',
    text: 'text-gray-600',
    value: 'text-gray-700'
  }
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color, 
  loading = false,
  onClick 
}: StatCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-0 shadow-sm hover:shadow-md",
        colors.bg,
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className={cn("text-sm font-medium", colors.text)}>
              {title}
            </p>
            <p className={cn("text-3xl font-bold", colors.value)}>
              {typeof value === 'number' ? value.toLocaleString('cs-CZ') : value}
            </p>
            {subtitle && (
              <p className={cn("text-xs", colors.text, "opacity-75")}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              colors.iconBg
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}