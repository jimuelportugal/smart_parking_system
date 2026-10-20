// components/records-table.tsx
'use client';

import { useState, useEffect } from 'react';

export default function RecordsTable() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || 'Failed to load dashboard data');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 text-center text-slate-600">Loading Dashboard...</div>;
  if (error) return <div className="p-4 text-center text-red-600">Error: {error}</div>;

  const { stats, spots, payments } = data;

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Free / Occupied Slots</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.freeSlots} Free / {stats.occupiedSlots} Occupied</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Vehicles Entered</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.totalVehiclesEntered}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">₱{stats.totalRevenue}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Capacity</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.totalSlots} Spots</p>
        </div>
      </div>

      {/* Parking Spaces Status */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Parking Spaces Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {spots.map((spot: any) => (
            <div 
              key={spot.id} 
              className={`p-2.5 rounded border text-center ${
                spot.status === 'occupied' 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <p className="font-bold text-xs">{spot.spot_number}</p>
              <p className="text-[10px] uppercase opacity-80">{spot.status}</p>
              <p className="text-[9px] opacity-60">{spot.vehicle_type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Records */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Payment Records</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="p-3">Txn ID</th>
                <th className="p-3">Ticket</th>
                <th className="p-3">Spot</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Method</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                payments.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs text-slate-900">{tx.transaction_id}</td>
                    <td className="p-3 text-xs">{tx.ticket_id || 'N/A'}</td>
                    <td className="p-3 font-semibold">{tx.spot_number || 'N/A'}</td>
                    <td className="p-3 font-bold text-emerald-600">₱{tx.amount_paid}</td>
                    <td className="p-3">{tx.payment_method}</td>
                    <td className="p-3 text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}