import { useState, useRef } from 'react';
import { TranslationBlock } from '@/types/translation';
import { ContentBlock } from './ContentBlock';
import { Languages } from 'lucide-react';

interface TranslationViewerProps {
  blocks: TranslationBlock[];
  sourceLanguage?: string;
  targetLanguage?: string;
  onBlocksChange?: (blocks: TranslationBlock[]) => void;
}

export const TranslationViewer = ({
  blocks,
  sourceLanguage = 'en',
  targetLanguage = 'nl',
  onBlocksChange,
}: TranslationViewerProps) => {
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [localBlocks, setLocalBlocks] = useState<TranslationBlock[]>(blocks);
  const originalScrollRef = useRef<HTMLDivElement>(null);
  const translatedScrollRef = useRef<HTMLDivElement>(null);

  // Sync scroll between panels
  const handleOriginalScroll = () => {
    if (originalScrollRef.current && translatedScrollRef.current) {
      const originalScroll = originalScrollRef.current;
      const translatedScroll = translatedScrollRef.current;
      
      const scrollRatio = originalScroll.scrollTop / (originalScroll.scrollHeight - originalScroll.clientHeight);
      translatedScroll.scrollTop = scrollRatio * (translatedScroll.scrollHeight - translatedScroll.clientHeight);
    }
  };

  const handleTranslatedScroll = () => {
    if (originalScrollRef.current && translatedScrollRef.current) {
      const originalScroll = originalScrollRef.current;
      const translatedScroll = translatedScrollRef.current;
      
      const scrollRatio = translatedScroll.scrollTop / (translatedScroll.scrollHeight - translatedScroll.clientHeight);
      originalScroll.scrollTop = scrollRatio * (originalScroll.scrollHeight - originalScroll.clientHeight);
    }
  };

  const handleBlockHover = (blockId: string) => {
    setHighlightedBlockId(blockId);
  };

  const handleBlockLeave = () => {
    setHighlightedBlockId(null);
  };

  const handleContentChange = (blockId: string, newContent: string) => {
    const updatedBlocks = localBlocks.map(block =>
      block.id === blockId
        ? { ...block, translated: { ...block.translated, content: newContent } }
        : block
    );
    setLocalBlocks(updatedBlocks);
    if (onBlocksChange) {
      onBlocksChange(updatedBlocks);
    }
  };

  if (localBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No translation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-200px)] border border-border rounded-lg overflow-hidden bg-[#1a1a1a]">
      <div className="grid grid-cols-2 h-full divide-x divide-border/50">
        {/* Original Content */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2 border-b border-border/50 bg-[#1e1e1e] flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Original ({sourceLanguage.toUpperCase()})</span>
          </div>
          <div
            ref={originalScrollRef}
            onScroll={handleOriginalScroll}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="p-6 font-mono text-sm text-foreground leading-relaxed">
              {localBlocks.map((block) => (
                <ContentBlock
                  key={`original-${block.id}`}
                  block={block}
                  isHighlighted={highlightedBlockId === block.id}
                  onMouseEnter={() => handleBlockHover(block.id)}
                  onMouseLeave={handleBlockLeave}
                  side="original"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Translated Content */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-4 py-2 border-b border-border/50 bg-[#1e1e1e] flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Translated ({targetLanguage.toUpperCase()})</span>
          </div>
          <div
            ref={translatedScrollRef}
            onScroll={handleTranslatedScroll}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="p-6 font-mono text-sm text-foreground leading-relaxed">
              {localBlocks.map((block) => (
                <ContentBlock
                  key={`translated-${block.id}`}
                  block={block}
                  isHighlighted={highlightedBlockId === block.id}
                  onMouseEnter={() => handleBlockHover(block.id)}
                  onMouseLeave={handleBlockLeave}
                  side="translated"
                  onContentChange={handleContentChange}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
