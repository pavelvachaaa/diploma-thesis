'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { StatusHistoryEntry } from '@/lib/api/interviews';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface InterviewTimelineProps {
  statusHistory: StatusHistoryEntry[];
}

export default function InterviewTimeline({ statusHistory }: InterviewTimelineProps) {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Naplánováno',
      confirmed: 'Potvrzeno',
      cancelled: 'Zrušeno',
      completed: 'Dokončeno',
      no_show: 'Nedostavil se',
    };
    return labels[status] || status;
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'completed':
        return 'secondary';
      case 'cancelled':
      case 'no_show':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historie změn statusu
          <Badge variant="secondary" className="ml-2">
            {statusHistory.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Zatím nebyla zaznamenaná žádná historie</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[21px] top-0 bottom-0 w-px bg-border" />

            {sortedHistory.map((entry, index) => {
              const isLast = index === sortedHistory.length - 1;

              return (
                <div key={entry.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${!isLast ? 'pb-8' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            Status změn
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {entry.old_status && (
                            <>
                              <Badge variant={getStatusBadgeVariant(entry.old_status)}>
                                {getStatusLabel(entry.old_status)}
                              </Badge>
                              <span className="text-muted-foreground">&#8594;</span>
                            </>
                          )}
                          <Badge variant={getStatusBadgeVariant(entry.new_status)}>
                            {getStatusLabel(entry.new_status)}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(entry.changed_at), "d. MMMM yyyy 'v' HH:mm", {
                                locale: cs,
                              })}
                            </span>
                          </div>

                          {entry.changed_by_name && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span className="font-medium">
                                {entry.changed_by_name} {entry.changed_by_surname}
                              </span>
                            </div>
                          )}

                          {entry.notes && (
                            <div className="flex items-start gap-2 mt-2">
                              <FileText className="h-3 w-3 mt-0.5" />
                              <div className="p-2 bg-muted/50 rounded text-xs flex-1">
                                {entry.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
