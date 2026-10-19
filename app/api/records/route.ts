// app/api/records/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const spots = await pool.query('SELECT * FROM spots ORDER BY id');
    const sessions = await pool.query('SELECT * FROM sessions ORDER BY id DESC');
    const transactions = await pool.query('SELECT * FROM transactions ORDER BY id DESC');

    return NextResponse.json({
      success: true,
      spots: spots.rows,
      sessions: sessions.rows,
      transactions: transactions.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}