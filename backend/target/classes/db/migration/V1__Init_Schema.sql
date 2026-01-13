CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

CREATE TABLE call_sessions (
    id BIGSERIAL PRIMARY KEY,
    caller_id VARCHAR(255) NOT NULL,
    receiver_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP
);
