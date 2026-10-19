import { NextResponse } from 'next/server';
import { pool } from '@/lib/db'; 

export async function POST(request: Request) {
    const client = await pool.connect();
    try {
        const { vehicle_type } = await request.json();
        
        await client.query('BEGIN');

        const spotResult = await client.query(
            `SELECT id, spot_number FROM spots 
             WHERE vehicle_type = $1 AND status = 'available' 
             ORDER BY spot_number ASC LIMIT 1 FOR UPDATE`,
            [vehicle_type]
        );

        if (spotResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Parking full for this vehicle category' }, { status: 400 });
        }

        const spot = spotResult.rows[0];

        const rateResult = await client.query(
            `SELECT id FROM rates WHERE vehicle_category = $1 ORDER BY effective_date DESC LIMIT 1`,
            [vehicle_type]
        );

        if (rateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'No rate found for this vehicle category' }, { status: 400 });
        }

        const rate = rateResult.rows[0];

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSeq = Math.floor(1000 + Math.random() * 9000);
        const ticket_id = `NSP-${dateStr}-${randomSeq}`;
        const qr_code = `QR-${ticket_id}`;

        await client.query(
            `UPDATE spots SET status = 'occupied' WHERE id = $1`,
            [spot.id]
        );

        const sessionResult = await client.query(
            `INSERT INTO sessions (spot_id, rate_id, ticket_id, qr_code, status) 
             VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
            [spot.id, rate.id, ticket_id, qr_code]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            ticket: sessionResult.rows[0],
            spot_number: spot.spot_number
        });

    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}