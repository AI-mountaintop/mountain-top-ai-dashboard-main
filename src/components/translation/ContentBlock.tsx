import { useState, useRef, useEffect } from 'react';
import { TranslationBlock } from '@/types/translation';
import { cn } from '@/lib/utils';
import { Edit2, Check, X } from 'lucide-react';

interface ContentBlockProps {
  block: TranslationBlock;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  side: 'original' | 'translated';
  onContentChange?: (blockId: string, newContent: string) => void;
}

export const ContentBlock = ({
  block,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
  side,
  onContentChange,
}: ContentBlockProps) => {
  const content = side === 'original' ? block.original.content : block.translated.content;
  const element = block.original.element;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (onContentChange && side === 'translated') {
      onContentChange(block.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditedContent(content);
      setIsEditing(false);
    }
  };

  // Terminal/editor style for original content
  if (side === 'original') {
    return (
      <div
        data-block-id={block.id}
        data-side={side}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          'mb-6 transition-colors',
          isHighlighted && 'bg-primary/10'
        )}
      >
        <div className={cn(
          'whitespace-pre-wrap break-words',
          element === 'h1' || element === 'h2' || element === 'h3' 
            ? 'font-semibold mb-2' 
            : ''
        )}>
          {content}
        </div>
        <div className="text-xs text-muted-foreground/60 mt-2 font-mono">
          {block.original.url}
        </div>
      </div>
    );
  }

  // Editable terminal/editor style for translated content
  return (
    <div
      data-block-id={block.id}
      data-side={side}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'mb-6 transition-colors relative group',
        isHighlighted && 'bg-primary/10'
      )}
    >
      {!isEditing ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className={cn(
              'flex-1 whitespace-pre-wrap break-words',
              element === 'h1' || element === 'h2' || element === 'h3' 
                ? 'font-semibold mb-2' 
                : ''
            )}>
              {editedContent}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground"
              title="Edit translation"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground/60 mt-2 font-mono">
            Translated to {block.translated.language}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onInput={(e) => setEditedContent(e.currentTarget.textContent || '')}
            className={cn(
              'outline-none focus:outline-none',
              'min-h-[40px] p-2 rounded border border-primary/50 bg-background/50',
              'focus:border-primary focus:ring-1 focus:ring-primary/30',
              'whitespace-pre-wrap break-words',
              element === 'h1' || element === 'h2' || element === 'h3' 
                ? 'font-semibold' 
                : ''
            )}
          >
            {editedContent}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={() => {
                setEditedContent(content);
                setIsEditing(false);
              }}
              className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded transition-colors text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <span className="text-muted-foreground/60 ml-auto">Ctrl+Enter to save, Esc to cancel</span>
          </div>
        </div>
      )}
    </div>
  );
};
