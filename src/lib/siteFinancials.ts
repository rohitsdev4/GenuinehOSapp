import type { Payment, Site } from '@/src/types';

export type SiteTemplate = {
  key: string;
  name: string;
  location: string;
  clientName: string;
  projectCount: number;
  baseProjectCost: number;
  extraWorkCost: number;
  workType: string;
};

export const DEFAULT_SITE_TEMPLATES: SiteTemplate[] = [
  {
    key: 'ludhiana',
    name: 'Ludhiana',
    location: 'Ludhiana',
    clientName: 'Surgical wholesale mart',
    projectCount: 2,
    baseProjectCost: 110000,
    extraWorkCost: 94000,
    workType: 'Flooring + Ducting',
  },
  {
    key: 'bhatinda',
    name: 'Bhatinda',
    location: 'Bhatinda',
    clientName: 'Surgical wholesale mart',
    projectCount: 1,
    baseProjectCost: 110000,
    extraWorkCost: 34000,
    workType: 'Contract + Ducting Extra',
  },
  {
    key: 'kolkata-ceiling',
    name: 'Kolkata Ceiling',
    location: 'Kolkata',
    clientName: 'Surgical wholesale mart',
    projectCount: 1,
    baseProjectCost: 110000,
    extraWorkCost: 32000,
    workType: 'Contract + Ducting Extra',
  },
];

const normalize = (value?: string) => (value || '').trim().toLowerCase();

const toAmount = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(numeric) ? numeric : 0;
};

export const siteTotalValue = (site: Partial<Site>) => {
  const projectCount = site.projectCount || 1;
  const base = (site.baseProjectCost || 0) * projectCount;
  const extra = site.extraWorkCost || 0;
  return base + extra;
};

export const getSiteReceivedAmount = (site: Partial<Site>, payments: Payment[]) => {
  const siteName = normalize(site.name);
  const client = normalize(site.clientName);

  return payments.reduce((sum, payment) => {
    const party = normalize(payment.partyName);
    const paymentSite = normalize(payment.siteId);
    const notes = normalize(payment.notes);

    const matchesClient = client ? party.includes(client) : true;
    const matchesSite =
      siteName &&
      (paymentSite.includes(siteName) || notes.includes(siteName) || party.includes(siteName));

    if (matchesClient && matchesSite) {
      return sum + toAmount(payment.amount);
    }
    return sum;
  }, 0);
};

export const buildSiteFinancials = (site: Partial<Site>, payments: Payment[]) => {
  const total = siteTotalValue(site);
  const received = getSiteReceivedAmount(site, payments);
  const pending = Math.max(total - received, 0);
  return { total, received, pending };
};

