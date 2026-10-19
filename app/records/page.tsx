'use client';

import RecordsTable from '@/components/records-table';
import Link from 'next/link';

export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Parking Records</h1>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <RecordsTable />
        </div>
      </div>
    </main>
  );
}
