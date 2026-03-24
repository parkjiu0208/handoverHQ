import { type Icon } from '@phosphor-icons/react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-[#D6DEE8] bg-white p-16 text-center shadow-md">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F9FC] shadow-sm">
        <Icon size={22} className="text-[#5F6E82]" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#0F1E32]">{title}</h3>
      <p className="mb-6 text-sm leading-6 text-[#5F6E82]">{description}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
