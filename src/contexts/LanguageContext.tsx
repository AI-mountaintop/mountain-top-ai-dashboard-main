import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'en' | 'nl' | 'de' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys for analytics page
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'page.title': 'Independent Analytics',
    'header.lastUpdated': 'Last updated',
    'header.refreshNow': 'Refresh Now',
    'header.generateReport': 'Generate Report',
    
    // Metrics
    'metric.totalVisitors': 'Total Visitors',
    'metric.totalViews': 'Total Views',
    'metric.totalSessions': 'Total Sessions',
    'metric.newVisitors': 'New Visitors',
    'metric.returningVisitors': 'Returning Visitors',
    'metric.bounceRate': 'Bounce Rate',
    'metric.viewsPerSession': 'Views per Session',
    'metric.engagementRate': 'Engagement Rate',
    
    // Charts
    'chart.trafficOverview': 'Traffic Overview',
    'chart.dailyTrend': 'Daily views and sessions trend',
    'chart.trafficSources': 'Traffic Sources',
    'chart.deviceTypes': 'Device Types',
    'chart.browserDistribution': 'Browser Distribution',
    'chart.topPerformingPages': 'Top Performing Pages',
    'chart.operatingSystems': 'Operating Systems',
    'chart.weeklyEngagementRate': 'Weekly Engagement Rate',
    'chart.clicksOverTime': 'Clicks Over Time',
    'chart.views': 'Views',
    'chart.sessions': 'Sessions',
    'chart.clicks': 'Clicks',
    
    // Tables
    'table.topPages': 'Top Pages',
    'table.referrers': 'Referrers',
    'table.locations': 'Locations',
    'table.rowsPerPage': 'Rows per page',
    'table.page': 'Page',
    'table.of': 'of',
    
    // Geographic
    'geo.title': 'Geographic Traffic',
    'geo.last30Days': 'Last 30 Days',
    
    // Messages
    'message.noSiteSelected': 'No Site Selected',
    'message.selectSite': 'Please select a site from the sidebar to view analytics',
    'message.loading': 'Loading analytics data',
    'message.failedToLoad': 'Failed to Load Analytics Data',
    'message.unableToFetch': 'Unable to fetch data from',
    'message.checkEndpoint': 'Please check:',
    'message.apiEndpointCorrect': 'The API endpoint URL is correct',
    'message.siteAccessible': 'The WordPress site is accessible',
    'message.pluginActive': 'Independent Analytics plugin is installed and active',
    'message.corsConfigured': 'CORS is properly configured',
    'message.tryAgain': 'Try again',
    'message.dataRefreshed': 'Data refreshed successfully',
    'message.allMetricsUpdated': 'All metrics have been updated',
    'message.noDataAvailable': 'No data available to generate report',
    'message.reportDownloaded': 'Report downloaded successfully',
    'message.checkDownloads': 'Check your downloads folder',
    'message.failedToGenerate': 'Failed to generate report',
    
    // Report
    'report.analyticsReport': 'Analytics Report',
    'report.overview': 'Overview',
    'report.metric': 'Metric',
    'report.value': 'Value',
    'report.pageTitle': 'Page Title',
    'report.source': 'Source',
    'report.trafficSourcesDetail': 'Traffic Sources Detail',
    'report.page': 'Page',
    'report.website': 'Website',
    'report.generatedOn': 'Generated on',
    'report.geographicDistribution': 'Geographic Distribution',
    'report.country': 'Country',
    'report.city': 'City',
    'report.trafficTrend': 'Traffic Trend (Last 14 Days)',
    'report.deviceDistribution': 'Device Distribution',
    'report.device': 'Device',
    'report.os': 'OS',
    'report.browser': 'Browser',
    'report.topTrafficSources': 'Top Traffic Sources',
    'report.clicksOverTime': 'Clicks Over Time',
    'report.clicksDetail': 'Clicks Detail',
    'report.date': 'Date',
    'report.chartNotAvailable': 'Chart not available',
    'report.noClicksData': 'No clicks data available',
    'report.geographicAndDevices': 'Geographic & Devices',
  },
  nl: {
    // Header
    'page.title': 'Onafhankelijke Analytics',
    'header.lastUpdated': 'Laatst bijgewerkt',
    'header.refreshNow': 'Nu vernieuwen',
    'header.generateReport': 'Rapport genereren',
    
    // Metrics
    'metric.totalVisitors': 'Totaal Bezoekers',
    'metric.totalViews': 'Totaal Weergaven',
    'metric.totalSessions': 'Totaal Sessies',
    'metric.newVisitors': 'Nieuwe Bezoekers',
    'metric.returningVisitors': 'Terugkerende Bezoekers',
    'metric.bounceRate': 'Bouncepercentage',
    'metric.viewsPerSession': 'Weergaven per Sessie',
    'metric.engagementRate': 'Betrokkenheidspercentage',
    
    // Charts
    'chart.trafficOverview': 'Verkeersoverzicht',
    'chart.dailyTrend': 'Dagelijkse weergaven en sessies trend',
    'chart.trafficSources': 'Verkeersbronnen',
    'chart.deviceTypes': 'Apparaattypen',
    'chart.browserDistribution': 'Browserverdeling',
    'chart.topPerformingPages': 'Beste Presterende Pagina\'s',
    'chart.operatingSystems': 'Besturingssystemen',
    'chart.weeklyEngagementRate': 'Wekelijkse Betrokkenheidspercentage',
    'chart.clicksOverTime': 'Klikken in de Tijd',
    'chart.views': 'Weergaven',
    'chart.sessions': 'Sessies',
    'chart.clicks': 'Klikken',
    
    // Tables
    'table.topPages': 'Top Pagina\'s',
    'table.referrers': 'Verwijzers',
    'table.locations': 'Locaties',
    'table.rowsPerPage': 'Rijen per pagina',
    'table.page': 'Pagina',
    'table.of': 'van',
    
    // Geographic
    'geo.title': 'Geografisch Verkeer',
    'geo.last30Days': 'Laatste 30 Dagen',
    
    // Messages
    'message.noSiteSelected': 'Geen Site Geselecteerd',
    'message.selectSite': 'Selecteer een site uit de zijbalk om analytics te bekijken',
    'message.loading': 'Analyticsgegevens laden',
    'message.failedToLoad': 'Analyticsgegevens laden mislukt',
    'message.unableToFetch': 'Kan geen gegevens ophalen van',
    'message.checkEndpoint': 'Controleer:',
    'message.apiEndpointCorrect': 'De API-eindpunt-URL is correct',
    'message.siteAccessible': 'De WordPress-site is toegankelijk',
    'message.pluginActive': 'Independent Analytics plugin is geïnstalleerd en actief',
    'message.corsConfigured': 'CORS is correct geconfigureerd',
    'message.tryAgain': 'Probeer opnieuw',
    'message.dataRefreshed': 'Gegevens succesvol vernieuwd',
    'message.allMetricsUpdated': 'Alle statistieken zijn bijgewerkt',
    'message.noDataAvailable': 'Geen gegevens beschikbaar om rapport te genereren',
    'message.reportDownloaded': 'Rapport succesvol gedownload',
    'message.checkDownloads': 'Controleer uw downloadsmap',
    'message.failedToGenerate': 'Rapport genereren mislukt',
    
    // Report
    'report.analyticsReport': 'Analytics Rapport',
    'report.overview': 'Overzicht',
    'report.metric': 'Statistiek',
    'report.value': 'Waarde',
    'report.pageTitle': 'Paginatitel',
    'report.source': 'Bron',
    'report.trafficSourcesDetail': 'Verkeersbronnen Detail',
    'report.page': 'Pagina',
    'report.website': 'Website',
    'report.generatedOn': 'Gegenereerd op',
    'report.geographicDistribution': 'Geografische Verdeling',
    'report.country': 'Land',
    'report.city': 'Stad',
    'report.trafficTrend': 'Verkeerstrend (Laatste 14 Dagen)',
    'report.deviceDistribution': 'Apparaatverdeling',
    'report.device': 'Apparaat',
    'report.os': 'Besturingssysteem',
    'report.browser': 'Browser',
    'report.topTrafficSources': 'Top Verkeersbronnen',
    'report.clicksOverTime': 'Klikken in de Tijd',
    'report.clicksDetail': 'Klikken Detail',
    'report.date': 'Datum',
    'report.chartNotAvailable': 'Grafiek niet beschikbaar',
    'report.noClicksData': 'Geen klikgegevens beschikbaar',
    'report.geographicAndDevices': 'Geografisch & Apparaten',
  },
  de: {
    // Header
    'page.title': 'Unabhängige Analytik',
    'header.lastUpdated': 'Zuletzt aktualisiert',
    'header.refreshNow': 'Jetzt aktualisieren',
    'header.generateReport': 'Bericht erstellen',
    
    // Metrics
    'metric.totalVisitors': 'Gesamtbesucher',
    'metric.totalViews': 'Gesamtaufrufe',
    'metric.totalSessions': 'Gesamtsitzungen',
    'metric.newVisitors': 'Neue Besucher',
    'metric.returningVisitors': 'Wiederkehrende Besucher',
    'metric.bounceRate': 'Absprungrate',
    'metric.viewsPerSession': 'Aufrufe pro Sitzung',
    'metric.engagementRate': 'Engagement-Rate',
    
    // Charts
    'chart.trafficOverview': 'Verkehrsübersicht',
    'chart.dailyTrend': 'Tägliche Aufrufe und Sitzungen Trend',
    'chart.trafficSources': 'Verkehrsquellen',
    'chart.deviceTypes': 'Gerätetypen',
    'chart.browserDistribution': 'Browser-Verteilung',
    'chart.topPerformingPages': 'Top-Leistungsseiten',
    'chart.operatingSystems': 'Betriebssysteme',
    'chart.weeklyEngagementRate': 'Wöchentliche Engagement-Rate',
    'chart.clicksOverTime': 'Klicks im Zeitverlauf',
    'chart.views': 'Aufrufe',
    'chart.sessions': 'Sitzungen',
    'chart.clicks': 'Klicks',
    
    // Tables
    'table.topPages': 'Top-Seiten',
    'table.referrers': 'Verweise',
    'table.locations': 'Standorte',
    'table.rowsPerPage': 'Zeilen pro Seite',
    'table.page': 'Seite',
    'table.of': 'von',
    
    // Geographic
    'geo.title': 'Geografischer Verkehr',
    'geo.last30Days': 'Letzte 30 Tage',
    
    // Messages
    'message.noSiteSelected': 'Keine Site ausgewählt',
    'message.selectSite': 'Bitte wählen Sie eine Site aus der Seitenleiste aus, um Analytics anzuzeigen',
    'message.loading': 'Analytics-Daten werden geladen',
    'message.failedToLoad': 'Analytics-Daten konnten nicht geladen werden',
    'message.unableToFetch': 'Daten können nicht abgerufen werden von',
    'message.checkEndpoint': 'Bitte überprüfen Sie:',
    'message.apiEndpointCorrect': 'Die API-Endpunkt-URL ist korrekt',
    'message.siteAccessible': 'Die WordPress-Site ist erreichbar',
    'message.pluginActive': 'Independent Analytics Plugin ist installiert und aktiv',
    'message.corsConfigured': 'CORS ist ordnungsgemäß konfiguriert',
    'message.tryAgain': 'Erneut versuchen',
    'message.dataRefreshed': 'Daten erfolgreich aktualisiert',
    'message.allMetricsUpdated': 'Alle Metriken wurden aktualisiert',
    'message.noDataAvailable': 'Keine Daten verfügbar, um Bericht zu erstellen',
    'message.reportDownloaded': 'Bericht erfolgreich heruntergeladen',
    'message.checkDownloads': 'Überprüfen Sie Ihren Downloads-Ordner',
    'message.failedToGenerate': 'Bericht konnte nicht erstellt werden',
    
    // Report
    'report.analyticsReport': 'Analytics-Bericht',
    'report.overview': 'Übersicht',
    'report.metric': 'Metrik',
    'report.value': 'Wert',
    'report.pageTitle': 'Seitentitel',
    'report.source': 'Quelle',
    'report.trafficSourcesDetail': 'Verkehrsquellen Detail',
    'report.page': 'Seite',
    'report.website': 'Website',
    'report.generatedOn': 'Erstellt am',
    'report.geographicDistribution': 'Geografische Verteilung',
    'report.country': 'Land',
    'report.city': 'Stadt',
    'report.trafficTrend': 'Verkehrstrend (Letzte 14 Tage)',
    'report.deviceDistribution': 'Geräteverteilung',
    'report.device': 'Gerät',
    'report.os': 'Betriebssystem',
    'report.browser': 'Browser',
    'report.topTrafficSources': 'Top Verkehrsquellen',
    'report.clicksOverTime': 'Klicks im Zeitverlauf',
    'report.clicksDetail': 'Klicks Detail',
    'report.date': 'Datum',
    'report.chartNotAvailable': 'Diagramm nicht verfügbar',
    'report.noClicksData': 'Keine Klickdaten verfügbar',
    'report.geographicAndDevices': 'Geografisch & Geräte',
  },
  fr: {
    // Header
    'page.title': 'Analytique Indépendante',
    'header.lastUpdated': 'Dernière mise à jour',
    'header.refreshNow': 'Actualiser maintenant',
    'header.generateReport': 'Générer le rapport',
    
    // Metrics
    'metric.totalVisitors': 'Total des visiteurs',
    'metric.totalViews': 'Total des vues',
    'metric.totalSessions': 'Total des sessions',
    'metric.newVisitors': 'Nouveaux visiteurs',
    'metric.returningVisitors': 'Visiteurs de retour',
    'metric.bounceRate': 'Taux de rebond',
    'metric.viewsPerSession': 'Vues par session',
    'metric.engagementRate': 'Taux d\'engagement',
    
    // Charts
    'chart.trafficOverview': 'Aperçu du trafic',
    'chart.dailyTrend': 'Tendance des vues et sessions quotidiennes',
    'chart.trafficSources': 'Sources de trafic',
    'chart.deviceTypes': 'Types d\'appareils',
    'chart.browserDistribution': 'Distribution des navigateurs',
    'chart.topPerformingPages': 'Pages les plus performantes',
    'chart.operatingSystems': 'Systèmes d\'exploitation',
    'chart.weeklyEngagementRate': 'Taux d\'engagement hebdomadaire',
    'chart.clicksOverTime': 'Clics au fil du temps',
    'chart.views': 'Vues',
    'chart.sessions': 'Sessions',
    'chart.clicks': 'Clics',
    
    // Tables
    'table.topPages': 'Pages principales',
    'table.referrers': 'Référents',
    'table.locations': 'Emplacements',
    'table.rowsPerPage': 'Lignes par page',
    'table.page': 'Page',
    'table.of': 'de',
    
    // Geographic
    'geo.title': 'Trafic géographique',
    'geo.last30Days': '30 derniers jours',
    
    // Messages
    'message.noSiteSelected': 'Aucun site sélectionné',
    'message.selectSite': 'Veuillez sélectionner un site dans la barre latérale pour afficher les analyses',
    'message.loading': 'Chargement des données d\'analyse',
    'message.failedToLoad': 'Échec du chargement des données d\'analyse',
    'message.unableToFetch': 'Impossible de récupérer les données de',
    'message.checkEndpoint': 'Veuillez vérifier:',
    'message.apiEndpointCorrect': 'L\'URL du point de terminaison API est correcte',
    'message.siteAccessible': 'Le site WordPress est accessible',
    'message.pluginActive': 'Le plugin Independent Analytics est installé et actif',
    'message.corsConfigured': 'CORS est correctement configuré',
    'message.tryAgain': 'Réessayer',
    'message.dataRefreshed': 'Données actualisées avec succès',
    'message.allMetricsUpdated': 'Toutes les métriques ont été mises à jour',
    'message.noDataAvailable': 'Aucune donnée disponible pour générer le rapport',
    'message.reportDownloaded': 'Rapport téléchargé avec succès',
    'message.checkDownloads': 'Vérifiez votre dossier de téléchargements',
    'message.failedToGenerate': 'Échec de la génération du rapport',
    
    // Report
    'report.analyticsReport': 'Rapport d\'analyse',
    'report.overview': 'Aperçu',
    'report.metric': 'Métrique',
    'report.value': 'Valeur',
    'report.pageTitle': 'Titre de la page',
    'report.source': 'Source',
    'report.trafficSourcesDetail': 'Détail des sources de trafic',
    'report.page': 'Page',
    'report.website': 'Site Web',
    'report.generatedOn': 'Généré le',
    'report.geographicDistribution': 'Distribution géographique',
    'report.country': 'Pays',
    'report.city': 'Ville',
    'report.trafficTrend': 'Tendance du trafic (14 derniers jours)',
    'report.deviceDistribution': 'Distribution des appareils',
    'report.device': 'Appareil',
    'report.os': 'OS',
    'report.browser': 'Navigateur',
    'report.topTrafficSources': 'Principales sources de trafic',
    'report.clicksOverTime': 'Clics au fil du temps',
    'report.clicksDetail': 'Détail des clics',
    'report.date': 'Date',
    'report.chartNotAvailable': 'Graphique non disponible',
    'report.noClicksData': 'Aucune donnée de clics disponible',
    'report.geographicAndDevices': 'Géographique et Appareils',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

