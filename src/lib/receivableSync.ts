import type { Receivable, Site } from '@/src/types';

type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
};

const AUTO_TAG = '[AUTO_SITE_PENDING]';

export const upsertReceivablesFromSites = async (
  sites: Site[],
  receivables: Receivable[],
  addReceivable: (value: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | void>,
  updateReceivable: (id: string, value: Partial<Omit<Receivable, 'id'>>) => Promise<void>
): Promise<SyncResult> => {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  const pendingByClient = sites.reduce<Record<string, { pending: number; siteNames: string[] }>>((acc, site) => {
    const client = (site.clientName || site.clientId || '').trim();
    const pending = site.amountPending || 0;
    if (!client || pending <= 0) return acc;
    if (!acc[client]) acc[client] = { pending: 0, siteNames: [] };
    acc[client].pending += pending;
    acc[client].siteNames.push(site.name);
    return acc;
  }, {});

  for (const [client, payload] of Object.entries(pendingByClient)) {
    const existing = receivables.find((r) =>
      r.partyName.trim().toLowerCase() === client.toLowerCase() &&
      (r.notes || '').includes(AUTO_TAG)
    );

    const note = `${AUTO_TAG} Pending from sites: ${payload.siteNames.join(', ')}`;
    const amountCollected = 0;

    if (existing?.id) {
      await updateReceivable(existing.id, {
        amount: payload.pending,
        dueDate: existing.dueDate || new Date().toISOString().split('T')[0],
        amountCollected,
        status: payload.pending > 0 ? 'Pending' : 'Collected',
        notes: note,
      });
      updated++;
    } else {
      await addReceivable({
        partyName: client,
        amount: payload.pending,
        dueDate: new Date().toISOString().split('T')[0],
        amountCollected,
        status: payload.pending > 0 ? 'Pending' : 'Collected',
        notes: note,
      });
      added++;
    }
  }

  if (Object.keys(pendingByClient).length === 0) skipped++;
  return { added, updated, skipped };
};

