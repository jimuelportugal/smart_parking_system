// app/api/exit/scan/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
    const client = await pool.connect();
    try {
        const { ticket_id } = await request.json();

        const sessionResult = await client.query(
            `SELECT s.*, sp.spot_number, sp.vehicle_type, r.initial_fee, r.initial_duration_mins, r.additional_increment_mins, r.additional_rate
             FROM sessions s
             JOIN spots sp ON s.spot_id = sp.id
             JOIN rates r ON s.rate_id = r.id
             WHERE s.ticket_id = $1 AND s.status = 'active'`,
            [ticket_id]
        );

        if (sessionResult.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Active ticket not found' }, { status: 404 });
        }

        const session = sessionResult.rows[0];
        const timeIn = new Date(session.time_in);
        const timeNow = new Date();
        const durationMins = Math.ceil((timeNow.getTime() - timeIn.getTime()) / (1000 * 60));

        let amountDue = parseFloat(session.initial_fee);
        if (durationMins > session.initial_duration_mins) {
            const extraMins = durationMins - session.initial_duration_mins;
            const increments = Math.ceil(extraMins / session.additional_increment_mins);
            amountDue += increments * parseFloat(session.additional_rate);
        }

        return NextResponse.json({
            success: true,
            session_id: session.id,
            spot_number: session.spot_number,
            vehicle_type: session.vehicle_type,
            duration_mins: durationMins,
            amount_due: amountDue.toFixed(2)
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}