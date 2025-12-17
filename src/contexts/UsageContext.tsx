import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UsageContextType {
  usageStats: {
    analytics: number;
    translation: number;
    audit: number;
  };
  incrementUsage: (feature: 'analytics' | 'translation' | 'audit') => void;
  getUsageStats: () => {
    analytics: number;
    translation: number;
    audit: number;
  };
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export const UsageProvider = ({ children }: { children: ReactNode }) => {
  const [usageStats, setUsageStats] = useState(() => {
    const saved = localStorage.getItem('usage-stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { analytics: 0, translation: 0, audit: 0 };
      }
    }
    return { analytics: 0, translation: 0, audit: 0 };
  });

  useEffect(() => {
    localStorage.setItem('usage-stats', JSON.stringify(usageStats));
  }, [usageStats]);

  const incrementUsage = (feature: 'analytics' | 'translation' | 'audit') => {
    setUsageStats((prev) => ({
      ...prev,
      [feature]: (prev[feature] || 0) + 1,
    }));
  };

  const getUsageStats = () => usageStats;

  return (
    <UsageContext.Provider value={{ usageStats, incrementUsage, getUsageStats }}>
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within UsageProvider');
  }
  return context;
};



