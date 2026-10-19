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
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
    } catch (err) {
      console.error("Issue Ticket Error:", err);
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
      console.error("Scan Error:", err);
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
    } catch (err) {
      console.error("Payment Error:", err);
    }
  };

  const startCameraScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await handleScanTicket(decodedText);
            await html5QrCode.stop();
            scannerRef.current = null;
            setIsScanning(false);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera start failed:", err);
        setIsScanning(false);
      }
    }, 100);
  };

  const stopCameraScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        console.error(e);
      }
    }
    setIsScanning(false);
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Naga Smart Park - Operations Dashboard</h1>

      {/* 1. Entrance Section */}
      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
        <h2>1. Entrance Kiosk (Issue Ticket)</h2>
        <form onSubmit={handleIssueTicket}>
          <label>Vehicle Type: </label>
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Car">Car</option>
            <option value="Van">Van</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit" style={{ marginLeft: '1rem' }}>Issue Ticket</button>
        </form>

        {entranceResult && entranceResult.success && (
          <div style={{ marginTop: '1rem', background: '#f4f4f4', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <p style={{ color: '#000' }}><strong>Ticket ID:</strong> {entranceResult.ticket.ticket_id}</p>
            <div style={{ marginTop: '1rem', background: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '4px' }}>
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

      {/* 2. Exit Scan Section */}
      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
        <h2>2. Exit Terminal (Camera Scanner)</h2>
        
        {!isScanning ? (
          <button 
            onClick={startCameraScan}
            style={{ padding: '0.6rem 1.2rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Open Camera to Scan QR
          </button>
        ) : (
          <div>
            <button 
              onClick={stopCameraScan}
              style={{ marginBottom: '0.75rem', padding: '0.4rem 0.8rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close Camera
            </button>
            <div id="reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}></div>
          </div>
        )}

        {scanResult && scanResult.success && (
          <div style={{ marginTop: '1rem', background: '#e6f4ea', padding: '1rem', borderRadius: '6px' }}>
            <p style={{ color: '#137333', fontWeight: 'bold' }}>✓ Scanned Successfully</p>
            <p><strong>Spot:</strong> {scanResult.spot_number} ({scanResult.vehicle_type})</p>
            <p><strong>Duration:</strong> {scanResult.duration_mins} mins</p>
            <p><strong>Amount Due:</strong> ₱{scanResult.amount_due}</p>
          </div>
        )}
        {scanResult && !scanResult.success && (
          <p style={{ color: 'red', marginTop: '1rem' }}>{scanResult.error}</p>
        )}
      </section>

      {/* 3. Payment Section */}
      {scanResult && scanResult.success && (
        <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', background: '#fafafa' }}>
          <h2>3. Complete Payment</h2>
          <form onSubmit={handlePayment}>
            <label>Cash Tendered: ₱</label>
            <input 
              type="number" 
              value={amountPaid} 
              onChange={(e) => setAmountPaid(e.target.value)} 
              placeholder="0.00" 
            />
            <button type="submit" style={{ marginLeft: '1rem' }}>Process Payment & Release Spot</button>
          </form>
          {paymentResult && paymentResult.success && (
            <div style={{ marginTop: '1rem', background: '#e6f4ea', padding: '0.8rem', borderRadius: '4px' }}>
              <p style={{ color: '#137333', fontWeight: 'bold' }}>Payment Completed!</p>
              <p>Change: ₱{paymentResult.change}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}