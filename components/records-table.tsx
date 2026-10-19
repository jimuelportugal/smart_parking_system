// components/records-table.tsx
'use client';

import { useState, useEffect } from 'react';

export default function RecordsTable() {
  const [filter, setFilter] = useState('ALL');
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/records?status=${filter}`)
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Parking Records</h2>
        <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          {['ALL', 'ACTIVE', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3 font-medium">Ticket #</th>
              <th className="p-3 font-medium">Plate #</th>
              <th className="p-3 font-medium">Entry Time</th>
              <th className="p-3 font-medium">Exit Time</th>
              <th className="p-3 font-medium">Fee</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">No records found.</td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs">{r.ticket_id}</td>
                  <td className="p-3 font-semibold">{r.plate_number}</td>
                  <td className="p-3 text-xs">{new Date(r.time_in).toLocaleString()}</td>
                  <td className="p-3 text-xs">{r.time_out ? new Date(r.time_out).toLocaleString() : '-'}</td>
                  <td className="p-3">{r.fee ? `₱${r.fee}` : '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'active' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}