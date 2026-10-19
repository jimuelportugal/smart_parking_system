// app/admin/records/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<{ spots: any[], sessions: any[], transactions: any[] }>({ spots: [], sessions: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/records');
      const data = await res.json();
      if (data.success) {
        setRecords(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch records');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const groupedSpots = records.spots.reduce((acc: { [key: string]: any[] }, spot) => {
    const category = spot.vehicle_type || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(spot);
    return acc;
  }, {});

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto', color: '#333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#111', margin: 0 }}>Admin Database Records Viewer</h1>
          <p style={{ color: '#666', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>Protected internal management view</p>
        </div>
        <button 
          onClick={fetchRecords} 
          style={{ padding: '0.5rem 1rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Refresh Data
        </button>
      </div>

      {loading && <p>Loading records...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
            <h2 style={{ color: '#222', marginTop: 0 }}>Spots by Category ({records.spots.length} Total)</h2>
            
            {Object.keys(groupedSpots).map((category) => (
              <div key={category} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#444', borderBottom: '2px solid #eee', paddingBottom: '0.3rem' }}>
                  {category} ({groupedSpots[category].length} spots)
                </h3>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #eee', marginTop: '0.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4' }}>
                        <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Spot Number</th>
                        <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedSpots[category].map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{s.id}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>{s.spot_number}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              background: s.status === 'available' ? '#e6f4ea' : '#fde8e8',
                              color: s.status === 'available' ? '#137333' : '#c53030',
                              fontWeight: 'bold'
                            }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
            <h2 style={{ color: '#222', marginTop: 0 }}>Sessions ({records.sessions.length})</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f4f4f4' }}>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Ticket ID</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Spot ID</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Time In</th>
                  </tr>
                </thead>
                <tbody>
                  {records.sessions.map(ses => (
                    <tr key={ses.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{ses.id}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{ses.ticket_id}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{ses.spot_id}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{ses.status}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{ses.time_in}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
            <h2 style={{ color: '#222', marginTop: 0 }}>Transactions ({records.transactions.length})</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f4f4f4' }}>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Tx ID</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Amount Due</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Amount Paid</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Change</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {records.transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{tx.transaction_id}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>₱{tx.amount_due}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>₱{tx.amount_paid}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>₱{tx.change_amount}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{tx.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}
    </main>
  );
}