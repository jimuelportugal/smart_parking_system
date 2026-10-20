// components/exit-kiosk.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ExitKiosk({ initialTicketId }: { initialTicketId?: string }) {
  const [scanResult, setScanResult] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleScanTicket = async (ticketIdToScan: string) => {
    setError('');
    setScanResult(null);
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/checkout?ticket_id=${encodeURIComponent(ticketIdToScan)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ticket not found');
      setScanResult(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketIdParam = params.get('ticket_id');
    if (ticketIdParam && ticketIdParam !== 'undefined') {
      handleScanTicket(ticketIdParam);
    }
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    setScanResult(null);
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
      setCameraError(err?.message || "Failed to start camera.");
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

  const handlePayment = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: scanResult.id,
          amount_paid: parseFloat(amountPaid),
          payment_method: 'Cash',
          attendant_name: 'System Admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      setSuccessMsg(`Payment successful! Change: ₱${data.change_amount}`);
      setScanResult(null);
      setAmountPaid('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Exit - Live Camera Scan & Checkout</h2>
      
      <div className="space-y-4">
        <div>
          {!isScanning ? (
            <button
              onClick={startScanner}
              className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start Live Camera Scan
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="w-full py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Camera
            </button>
          )}
        </div>

        <div id="reader" className={`w-full overflow-hidden rounded-lg bg-black ${isScanning ? 'block min-h-[250px]' : 'hidden'}`}></div>

        {cameraError && (
          <p className="text-red-600 text-sm"><strong>Camera Error:</strong> {cameraError}</p>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {successMsg && <p className="text-emerald-600 font-medium text-sm">{successMsg}</p>}

        {scanResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
            <p className="text-xs font-bold text-emerald-800 uppercase">✓ Ticket Scanned Successfully</p>
            <p className="text-sm text-slate-800"><strong>Slot:</strong> {scanResult.spot_number}</p>
            <p className="text-sm text-slate-800"><strong>Duration:</strong> {scanResult.duration_mins} mins</p>
            <p className="text-base font-bold text-slate-900"><strong>Amount Due:</strong> ₱{scanResult.amount_due}</p>
            
            <div className="pt-3 border-t border-emerald-200 space-y-2">
              <input
                type="number"
                placeholder="Cash Tendered"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 text-sm"
              />
              <button
                onClick={handlePayment}
                className="w-full py-2 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 transition-colors text-sm"
              >
                Complete Payment & Exit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}