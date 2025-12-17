import { TranslationHistory as TranslationHistoryType } from '@/types/translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Languages, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TranslationHistoryProps {
  translations: TranslationHistoryType[];
  onSelectTranslation: (translation: TranslationHistoryType) => void;
}

export const TranslationHistoryList = ({ translations, onSelectTranslation }: TranslationHistoryProps) => {
  if (translations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No translation history</p>
            <p className="text-sm text-muted-foreground mt-2">Upload and process a sitemap to see it here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: TranslationHistoryType['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Translation History
        </CardTitle>
        <CardDescription>
          View and manage previously translated sitemaps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {translations.map((translation) => (
            <button
              key={translation.id}
              onClick={() => onSelectTranslation(translation)}
              className={cn(
                'w-full text-left p-4 rounded-lg border transition-all',
                'hover:border-primary hover:bg-accent/50',
                'bg-card'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(translation.status)}
                    <h3 className="font-semibold truncate">{translation.sitemapName}</h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Languages className="h-3.5 w-3.5" />
                      <span>
                        {translation.sourceLanguage.toUpperCase()} → {translation.targetLanguage.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{translation.blocks.length} blocks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Processed {format(translation.processedAt, 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};



