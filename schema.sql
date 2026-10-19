CREATE TABLE IF NOT EXISTS rates (
    id SERIAL PRIMARY KEY,
    vehicle_category VARCHAR(50) UNIQUE NOT NULL,
    initial_fee DECIMAL(10,2) NOT NULL,
    initial_duration_mins INT NOT NULL,
    additional_increment_mins INT NOT NULL,
    additional_rate DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spots (
    id SERIAL PRIMARY KEY,
    spot_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    spot_id INT REFERENCES spots(id),
    rate_id INT REFERENCES rates(id),
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    time_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_out TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(id),
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    attendant_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);