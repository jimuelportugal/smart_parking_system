// components/entrance-kiosk.tsx
'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function EntranceKiosk() {
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGetTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleType) {
      setError('Please select a vehicle type');
      return;
    }
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_type: vehicleType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get ticket');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const vehicleTypes = ['Motorcycle', 'Car', 'Van', 'Other'];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Entrance - Get Ticket</h2>
      <form onSubmit={handleGetTicket} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase mb-2">Select Vehicle Type</label>
          <div className="grid grid-cols-2 gap-3">
            {vehicleTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleType(type)}
                className={`py-3 px-4 border rounded-lg font-medium transition-colors ${
                  vehicleType === type
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Get Ticket
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      {result && (
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold">Ticket ID: {result.ticket_id}</p>
          <div className="my-3 p-3 bg-white inline-block border border-slate-200 rounded">
            <QRCodeCanvas value={result.ticket_id} size={160} />
          </div>
          <p className="text-xl font-bold text-slate-900 uppercase">Slot: {result.spot_number}</p>
        </div>
      )}
    </div>
  );
}