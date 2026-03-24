import { useState } from 'react';
import PageHeader from '@/src/components/ui/PageHeader';
import { Network, HandCoins, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '@/src/lib/utils';
import { useFirestore } from '@/src/hooks/useFirestore';
import type { Party, Expense, Payment } from '@/src/types';

export default function Parties() {
  const { data: parties, loading: partiesLoading } = useFirestore<Party>('parties');
  const { data: expenses, loading: expensesLoading } = useFirestore<Expense>('expenses');
  const { data: payments, loading: paymentsLoading } = useFirestore<Payment>('payments');

  if (partiesLoading || expensesLoading || paymentsLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Ledgers...</div>;
  }

  const getPartyLedger = (partyName: string) => {
    const given = expenses
      .filter(e => e.partyName?.toLowerCase() === partyName.toLowerCase())
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const received = payments
      .filter(p => p.partyName?.toLowerCase() === partyName.toLowerCase())
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { given, received, net: received - given };
  };

  const ledgers = parties
    .map(p => ({ ...p, ...getPartyLedger(p.name) }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)); // Highest balances first

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader 
        title="Parties Ledger" 
        subtitle="Dynamic Telegram-synced balances for Clients and Vendors"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ledgers.length === 0 ? (
          <div className="col-span-full bg-[#111520] border border-[#1e2a40] rounded-2xl p-10 text-center">
            <Network className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No parties recorded yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Sync your Telegram sheet to automatically generate Party ledgers.</p>
          </div>
        ) : (
          ledgers.map((party, i) => (
            <motion.div 
              key={party.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-[#111520] border rounded-2xl overflow-hidden flex flex-col ${party.net > 0 ? 'border-emerald-500/30' : party.net < 0 ? 'border-rose-500/30' : 'border-[#1e2a40]'}`}
            >
              <div className="p-5 border-b border-[#1e2a40]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{party.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{party.type || 'Vendor/Client'}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${party.net > 0 ? 'bg-emerald-500/10 text-emerald-400' : party.net < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-[#1e2a40] text-gray-400'}`}>
                    <HandCoins className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <div className="text-left">
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-bold uppercase mb-1">
                      <ArrowUpRight className="w-3 h-3 text-rose-400" /> Given
                    </div>
                    <p className="text-sm font-semibold text-white">{formatCurrency(party.given)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-gray-500 font-bold uppercase mb-1">
                      Received <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">{formatCurrency(party.received)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-[#0b0e14] flex-1 flex flex-col justify-center">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Net Balance</p>
                <div className="flex items-end gap-2">
                  <p className={`text-3xl font-black ${party.net > 0 ? 'text-emerald-400' : party.net < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                    {formatCurrency(Math.abs(party.net))}
                  </p>
                  <span className="text-sm text-gray-500 font-medium mb-1 uppercase">
                    {party.net > 0 ? 'We Receive' : party.net < 0 ? 'We Owe' : 'Settled'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
