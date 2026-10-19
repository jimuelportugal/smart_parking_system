// app/api/exit/pay/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
    const client = await pool.connect();
    try {
        const { session_id, amount_due, amount_paid, payment_method, attendant_name } = await request.json();

        if (amount_paid < amount_due) {
            return NextResponse.json({ success: false, error: 'Insufficient payment' }, { status: 400 });
        }

        const changeAmount = amount_paid - amount_due;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSeq = Math.floor(1000 + Math.random() * 9000);
        const transaction_id = `TXN-${dateStr}-${randomSeq}`;

        await client.query('BEGIN');

        const txResult = await client.query(
            `INSERT INTO transactions (session_id, transaction_id, amount_due, amount_paid, change_amount, payment_method, attendant_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [session_id, transaction_id, amount_due, amount_paid, changeAmount, payment_method, attendant_name]
        );

        const sessionUpdate = await client.query(
            `UPDATE sessions SET status = 'completed', time_out = CURRENT_TIMESTAMP WHERE id = $1 RETURNING spot_id`,
            [session_id]
        );

        const spotId = sessionUpdate.rows[0].spot_id;

        await client.query(
            `UPDATE spots SET status = 'available' WHERE id = $1`,
            [spotId]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            transaction: txResult.rows[0],
            change: changeAmount.toFixed(2)
        });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}