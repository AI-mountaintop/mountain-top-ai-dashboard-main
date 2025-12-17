export interface Site {
  id: string;
  name: string;
  url: string;
  apiEndpoint: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SiteContextType {
  sites: Site[];
  activeSite: Site | null;
  setActiveSite: (site: Site) => void;
  addSite: (site: Omit<Site, 'id' | 'createdAt'>) => void;
  removeSite: (id: string) => void;
}
