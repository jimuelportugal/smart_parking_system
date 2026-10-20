// app/exit/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import ExitKiosk from '@/components/exit-kiosk';
import Link from 'next/link';
import { Suspense } from 'react';

function ExitContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticket_id') || undefined;

  return <ExitKiosk initialTicketId={ticketId} />;
}

export default function ExitPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-6 md:p-12">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Exit Terminal</h1>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <Suspense fallback={<div>Loading Exit Terminal...</div>}>
            <ExitContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}