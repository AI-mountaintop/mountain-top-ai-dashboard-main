import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
    return (
        <div className="mb-12">
            <h1 className="text-4xl font-semibold mb-3 tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-base">{description}</p>
        </div>
    );
};
