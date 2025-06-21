import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700',
  };

  const iconColorClasses = {
    blue: 'bg-blue-200 text-blue-700',
    green: 'bg-green-200 text-green-700',
    purple: 'bg-purple-200 text-purple-700',
    yellow: 'bg-yellow-200 text-yellow-700',
    red: 'bg-red-200 text-red-700',
  };

  const valueColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    yellow: 'text-yellow-900',
    red: 'text-red-900',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${colorClasses[color]}`}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${valueColorClasses[color]}`}>
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconColorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
