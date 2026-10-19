// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Home() {
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [entranceResult, setEntranceResult] = useState<any>(null);
  
  const [scanResult, setScanResult] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [records, setRecords] = useState<{ spots: any[], sessions: any[], transactions: any[] }>({ spots: [], sessions: [], transactions: [] });

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      if (data.success) {
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/entrance/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_type: vehicleType }),
      });
      const data = await res.json();
      setEntranceResult(data);
      setScanResult(null);
      setPaymentResult(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanTicket = async (ticketIdToScan: string) => {
    try {
      const res = await fetch('/api/exit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketIdToScan }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;
    try {
      const res = await fetch('/api/exit/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: scanResult.session_id,
          amount_due: scanResult.amount_due,
          amount_paid: parseFloat(amountPaid),
          payment_method: 'Cash',
          attendant_name: 'Maria Santos'
        }),
      });
      const data = await res.json();
      setPaymentResult(data);
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    setScanResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("BROWSER BLOCK: Camera API disabled on HTTP. Please enable the insecure origin flag in chrome://flags.");
      return;
    }

    setIsScanning(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current = null;
          setIsScanning(false);
          await handleScanTicket(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraError(err?.message || "Failed to start camera. Ensure permissions are granted.");
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.error(e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', color: '#333' }}>
      <h1 style={{ color: '#111' }}>Naga Smart Park - Operations Dashboard</h1>

      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: '#fff' }}>
        <h2 style={{ color: '#222' }}>1. Entrance Kiosk (Issue Ticket)</h2>
        <form onSubmit={handleIssueTicket}>
          <label style={{ color: '#333' }}>Vehicle Type: </label>
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ padding: '0.4rem', color: '#000' }}>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Car">Car</option>
            <option value="Van">Van</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit" style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>Issue Ticket</button>
        </form>

        {entranceResult && entranceResult.success && (
          <div style={{ marginTop: '1rem', background: '#f4f4f4', padding: '1rem', borderRadius: '6px', textAlign: 'center', border: '1px solid #ddd' }}>
            <p style={{ color: '#000', margin: '0 0 0.5rem 0' }}><strong>Ticket ID:</strong> {entranceResult.ticket.ticket_id}</p>
            <div style={{ marginTop: '0.5rem', background: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '4px', border: '1px solid #ccc' }}>
              <QRCodeCanvas value={entranceResult.ticket.ticket_id} size={150} />
              <div style={{ marginTop: '0.75rem', fontSize: '1.4rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
                {entranceResult.spot_number}
              </div>
            </div>
          </div>
        )}
        {entranceResult && !entranceResult.success && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>{entranceResult.error}</p>
        )}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: '#fff' }}>
        <h2 style={{ color: '#222' }}>2. Exit Terminal (Live Camera Scanner)</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          {!isScanning ? (
            <button onClick={startScanner} style={{ padding: '0.6rem 1.2rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Scan Ticket
            </button>
          ) : (
            <button onClick={stopScanner} style={{ padding: '0.4rem 0.8rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Stop Camera
            </button>
          )}
        </div>

        <div id="reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto', display: isScanning ? 'block' : 'none', background: '#000', minHeight: '250px' }}></div>

        {cameraError && (
          <div style={{ marginTop: '1rem', background: '#fde8e8', border: '1px solid #f8b4b4', padding: '0.75rem', borderRadius: '6px' }}>
            <p style={{ color: '#c53030', margin: 0, fontSize: '0.9rem' }}><strong>Camera Error:</strong> {cameraError}</p>
          </div>
        )}

        {scanResult && scanResult.success && (
          <div style={{ marginTop: '1rem', background: '#e6f4ea', padding: '1rem', borderRadius: '6px', border: '1px solid #ceead6' }}>
            <p style={{ color: '#137333', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>✓ Scanned Successfully</p>
            <p style={{ color: '#000', margin: '0.2rem 0' }}><strong>Spot:</strong> {scanResult.spot_number} ({scanResult.vehicle_type})</p>
            <p style={{ color: '#000', margin: '0.2rem 0' }}><strong>Duration:</strong> {scanResult.duration_mins} mins</p>
            <p style={{ color: '#000', margin: '0.2rem 0' }}><strong>Amount Due:</strong> ₱{scanResult.amount_due}</p>
          </div>
        )}
        {scanResult && !scanResult.success && (
          <p style={{ color: 'red', marginTop: '1rem' }}>{scanResult.error}</p>
        )}
      </section>

      {scanResult && scanResult.success && (
        <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: '#fafafa' }}>
          <h2 style={{ color: '#222' }}>3. Complete Payment</h2>
          <form onSubmit={handlePayment}>
            <label style={{ color: '#000', fontWeight: 'bold' }}>Cash Tendered: ₱</label>
            <input 
              type="number" 
              value={amountPaid} 
              onChange={(e) => setAmountPaid(e.target.value)} 
              placeholder="0.00" 
              style={{ padding: '0.4rem', marginLeft: '0.5rem', color: '#000' }}
            />
            <button type="submit" style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Process Payment & Release Spot
            </button>
          </form>
          {paymentResult && paymentResult.success && (
            <div style={{ marginTop: '1rem', background: '#e6f4ea', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ceead6' }}>
              <p style={{ color: '#137333', fontWeight: 'bold', margin: '0 0 0.3rem 0' }}>Payment Completed!</p>
              <p style={{ color: '#000', margin: 0 }}>Change: ₱{paymentResult.change}</p>
            </div>
          )}
        </section>
      )}

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#222', margin: 0 }}>4. Live Database Records Dashboard</h2>
          <button onClick={fetchRecords} style={{ padding: '0.4rem 0.8rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Refresh Records
          </button>
        </div>

        <h3 style={{ color: '#444', marginTop: '1rem' }}>Spots ({records.spots.length})</h3>
        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', fontSize: '0.85rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}><th style={{ padding: '4px' }}>Spot</th><th style={{ padding: '4px' }}>Type</th><th style={{ padding: '4px' }}>Status</th></tr>
            </thead>
            <tbody>
              {records.spots.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{s.spot_number}</td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{s.vehicle_type}</td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ color: '#444', marginTop: '1rem' }}>Sessions ({records.sessions.length})</h3>
        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', fontSize: '0.85rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}><th style={{ padding: '4px' }}>Ticket ID</th><th style={{ padding: '4px' }}>Status</th><th style={{ padding: '4px' }}>Time In</th></tr>
            </thead>
            <tbody>
              {records.sessions.map(ses => (
                <tr key={ses.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{ses.ticket_id}</td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{ses.status}</td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{ses.time_in}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}