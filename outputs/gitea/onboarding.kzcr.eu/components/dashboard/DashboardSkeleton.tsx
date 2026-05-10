'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-80 mt-2 animate-pulse"></div>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>

      {/* Main Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed Skeleton */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column Skeleton */}
        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-28 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Onboarding Progress Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-28 animate-pulse mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}