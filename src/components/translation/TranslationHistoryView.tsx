import { useState, useMemo } from 'react';
import { TranslationHistory, TranslationBlock } from '@/types/translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Globe, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranslationDownloadService } from '@/services/translationDownload';
import { toast } from 'sonner';

interface TranslationHistoryViewProps {
  translation: TranslationHistory;
  onBack: () => void;
  onSelectUrl: (url: string, blocks: TranslationBlock[]) => void;
}

type ViewState = 'sitemaps' | 'urls' | 'content';

export const TranslationHistoryView = ({ 
  translation, 
  onBack, 
  onSelectUrl 
}: TranslationHistoryViewProps) => {
  const [viewState, setViewState] = useState<ViewState>('urls');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Group blocks by URL
  const blocksByUrl = useMemo(() => {
    const grouped = new Map<string, TranslationBlock[]>();
    translation.blocks.forEach(block => {
      const url = block.original.url;
      if (!grouped.has(url)) {
        grouped.set(url, []);
      }
      grouped.get(url)!.push(block);
    });
    return grouped;
  }, [translation.blocks]);

  const urls = Array.from(blocksByUrl.keys());

  const handleUrlClick = (url: string) => {
    setSelectedUrl(url);
    const urlBlocks = blocksByUrl.get(url) || [];
    onSelectUrl(url, urlBlocks);
    setViewState('content');
  };

  const handleDownloadSitemap = async () => {
    try {
      toast.loading('Generating translation report...', { id: 'download' });
      await TranslationDownloadService.downloadTranslation({
        sitemapName: translation.sitemapName,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        blocks: translation.blocks,
      });
      toast.success('Translation downloaded successfully!', { id: 'download' });
    } catch (error) {
      toast.error('Failed to download translation', {
        id: 'download',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDownloadUrl = async (url: string) => {
    try {
      toast.loading('Generating page translation...', { id: 'download-url' });
      const urlBlocks = blocksByUrl.get(url) || [];
      await TranslationDownloadService.downloadTranslation({
        sitemapName: translation.sitemapName,
        sourceLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        blocks: urlBlocks,
        url: url,
      });
      toast.success('Page translation downloaded successfully!', { id: 'download-url' });
    } catch (error) {
      toast.error('Failed to download page translation', {
        id: 'download-url',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  if (viewState === 'urls') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {translation.sitemapName}
              </CardTitle>
              <CardDescription className="mt-2">
                {translation.sourceLanguage.toUpperCase()} → {translation.targetLanguage.toUpperCase()} • {urls.length} URLs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onBack}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleDownloadSitemap}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sitemap
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {urls.map((url) => {
              const urlBlocks = blocksByUrl.get(url) || [];
              return (
                <button
                  key={url}
                  onClick={() => handleUrlClick(url)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all',
                    'hover:border-primary hover:bg-accent/50',
                    'bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium truncate text-sm">{url}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{urlBlocks.length} {urlBlocks.length === 1 ? 'block' : 'blocks'}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadUrl(url);
                      }}
                      className="gap-2"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};



