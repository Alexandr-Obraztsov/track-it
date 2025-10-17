import { Button } from '@/components/ui/button';
import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <Button onClick={action.onClick} size="sm">
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

