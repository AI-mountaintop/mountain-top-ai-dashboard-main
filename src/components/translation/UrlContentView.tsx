import { TranslationBlock } from '@/types/translation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Download } from 'lucide-react';
import { TranslationViewer } from './TranslationViewer';
import { TranslationDownloadService } from '@/services/translationDownload';
import { toast } from 'sonner';

interface UrlContentViewProps {
  url: string;
  blocks: TranslationBlock[];
  sitemapName: string;
  sourceLanguage: string;
  targetLanguage: string;
  onBack: () => void;
}

export const UrlContentView = ({
  url,
  blocks,
  sitemapName,
  sourceLanguage,
  targetLanguage,
  onBack,
}: UrlContentViewProps) => {
  const handleDownload = async () => {
    try {
      toast.loading('Generating page translation...', { id: 'download-page' });
      await TranslationDownloadService.downloadTranslation({
        sitemapName,
        sourceLanguage,
        targetLanguage,
        blocks,
        url,
      });
      toast.success('Page translation downloaded successfully!', { id: 'download-page' });
    } catch (error) {
      toast.error('Failed to download page translation', {
        id: 'download-page',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{url}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()} • {blocks.length} blocks
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onBack}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to URLs
              </Button>
              <Button
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Translation
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <TranslationViewer
        blocks={blocks}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onBlocksChange={() => {}}
      />
    </div>
  );
};



