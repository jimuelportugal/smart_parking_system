// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Naga Smart Park</h1>
        <p className="text-sm text-slate-500">Select a terminal or view records below</p>
        
        <div className="space-y-3 pt-2">
          <Link 
            href="/entrance" 
            className="block w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Entrance Kiosk
          </Link>
          <Link 
            href="/exit" 
            className="block w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Exit Terminal
          </Link>
          <Link 
            href="/records" 
            className="block w-full py-3 bg-slate-200 text-slate-800 font-medium rounded-xl hover:bg-slate-300 transition-colors"
          >
            Parking Records
          </Link>
        </div>
      </div>
    </main>
  );
}