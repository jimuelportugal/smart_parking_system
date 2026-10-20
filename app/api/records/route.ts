// app/api/records/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch all spots to calculate free/occupied and render statuses
    const spotsRes = await pool.query('SELECT * FROM spots ORDER BY spot_number');
    const totalSlots = spotsRes.rows.length;
    const occupiedSlots = spotsRes.rows.filter(s => s.status === 'occupied').length;
    const freeSlots = totalSlots - occupiedSlots;

    // 2. Total vehicles entered (count of all sessions)
    const sessionsRes = await pool.query('SELECT COUNT(*) as total FROM sessions');
    const totalVehiclesEntered = parseInt(sessionsRes.rows[0].total, 10);

    // 3. Total revenue from transactions
    const revenueRes = await pool.query('SELECT SUM(amount_paid) as total_revenue FROM transactions');
    const totalRevenue = parseFloat(revenueRes.rows[0].total_revenue || 0).toFixed(2);

    // 4. Payment records list joined with sessions and spots
    const paymentsRes = await pool.query(`
      SELECT 
        t.id,
        t.transaction_id,
        t.amount_paid,
        t.payment_method,
        t.created_at,
        s.ticket_id,
        sp.spot_number
      FROM transactions t
      LEFT JOIN sessions s ON t.session_id = s.id
      LEFT JOIN spots sp ON s.spot_id = sp.id
      ORDER BY t.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalSlots,
        freeSlots,
        occupiedSlots,
        totalVehiclesEntered,
        totalRevenue,
      },
      spots: spotsRes.rows,
      payments: paymentsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}