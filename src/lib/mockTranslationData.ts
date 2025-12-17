import { TranslationBlock } from '@/types/translation';

export const mockTranslationData: TranslationBlock[] = [
  {
    id: 'block-1',
    original: {
      url: 'https://example.com/',
      content: 'Welcome to our website',
      element: 'h1',
    },
    translated: {
      content: 'Welkom op onze website',
      language: 'nl',
    },
  },
  {
    id: 'block-2',
    original: {
      url: 'https://example.com/',
      content: 'We provide excellent services to help your business grow.',
      element: 'p',
    },
    translated: {
      content: 'Wij bieden uitstekende diensten om uw bedrijf te helpen groeien.',
      language: 'nl',
    },
  },
  {
    id: 'block-3',
    original: {
      url: 'https://example.com/about',
      content: 'About Us',
      element: 'h1',
    },
    translated: {
      content: 'Over Ons',
      language: 'nl',
    },
  },
  {
    id: 'block-4',
    original: {
      url: 'https://example.com/about',
      content: 'We are a team of dedicated professionals committed to excellence.',
      element: 'p',
    },
    translated: {
      content: 'Wij zijn een team van toegewijde professionals die streven naar excellentie.',
      language: 'nl',
    },
  },
];



