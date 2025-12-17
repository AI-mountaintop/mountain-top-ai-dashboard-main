export interface TranslationBlock {
  id: string;
  original: {
    url: string;
    content: string;
    element: string; // h1, p, etc.
  };
  translated: {
    content: string;
    language: string;
  };
}

export interface TranslationResponse {
  success: boolean;
  data: TranslationBlock[];
  metadata?: {
    sourceLanguage: string;
    targetLanguage: string;
    totalBlocks: number;
    processedAt: string;
  };
}

export interface TranslationHistory {
  id: string;
  sitemapName: string;
  uploadedAt: Date;
  processedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  blocks: TranslationBlock[];
  sourceLanguage: string;
  targetLanguage: string;
}



