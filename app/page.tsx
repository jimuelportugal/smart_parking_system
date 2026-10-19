// app/page.tsx
'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">Smart Parking System</h1>
        
        <Link
          href="/entrance"
          className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-lg text-center font-medium hover:bg-slate-50 transition-colors"
        >
          Entrance
        </Link>

        <Link
          href="/exit"
          className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-lg text-center font-medium hover:bg-slate-50 transition-colors"
        >
          Exit
        </Link>

        <Link
          href="/records"
          className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-lg text-center font-medium hover:bg-slate-50 transition-colors"
        >
          Parking Records
        </Link>
      </div>
    </main>
  );
}