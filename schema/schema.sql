-- DELETE old database
DROP DATABASE IF EXISTS fragmint_db;

-- CREATE new database
CREATE DATABASE fragmint_db;

-- For Terminal tool
\c fragmint_db;

-- For Query Tool
USE fragmint_db;

-- CREATE EXTENSION FOR UUID;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Authentication (2 Tables)

-- 1. Users Table
CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(25) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    profile_pic TEXT,
    about_info TEXT,
    account_type VARCHAR(15) CHECK (account_type IN ('Gamer', 'Organizer', 'Admin')) DEFAULT 'Gamer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Friends Table
CREATE TABLE friends(
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(15) CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (requester_id <> receiver_id),
    PRIMARY KEY (requester_id, receiver_id)
);

-- Social & Community (2 Tables)

-- 1. Rooms Table
CREATE TABLE rooms(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    room_logo_url TEXT,
    description TEXT,
    visibility VARCHAR(10) CHECK (visibility IN ('Private', 'Public')),
    password_hash TEXT,
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Room Members Table
CREATE TABLE room_members(
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('Admin', 'Moderator', 'Member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (room_id, user_id)
);

-- ─────────────────────────────────────────
-- Messages Schema
-- ─────────────────────────────────────────

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(10) CHECK (message_type IN ('text', 'image', 'system')) DEFAULT 'text',
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL DEFAULT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast room message fetching
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Council & Tournament (4 Tables)

-- 1. Council
CREATE TABLE councils(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Council Members
CREATE TABLE council_members(
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    council_id UUID REFERENCES councils(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Tournament Director', 'Moderator', 'Manager')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, council_id)
);

-- 3. Games (Master List)
CREATE TABLE games(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    system_requirements JSON NOT NULL,
    rating DECIMAL NOT NULL DEFAULT 0.0,
    added_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Events
CREATE TABLE events(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    council_id UUID REFERENCES councils(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(20) CHECK (event_type IN ('Solo', 'Team')),
    team_size INT DEFAULT NULL,
    registration_fee DECIMAL DEFAULT 0.0, -- 0.0 = FREE
    prize_pool DECIMAL DEFAULT 0.0, -- 0.0 = No Prize Pool
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    registration_deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Upcoming', 'Live', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registration & Teams (3 Tables)

-- 1. Teams
CREATE TABLE teams(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    leader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT  CURRENT_TIMESTAMP
);

-- 2. Team Members
CREATE TABLE team_members(
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id)
);

-- 3. Registration
CREATE TABLE registrations(
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE DEFAULT NULL,
    payment_status VARCHAR(10) CHECK (payment_status IN ('Pending', 'Paid', 'Failed')) DEFAULT 'Pending',
    transaction_id TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);

-- Shop & Products (3 Tables)

-- 1. Shops
CREATE TABLE shops(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rent_amount DECIMAL DEFAULT 0.0, -- 0.0 = Completely free shop
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products
CREATE TABLE products(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    images_url JSON,
    specs JSON,
    price DECIMAL DEFAULT 0.0, -- 0.0 = Free Item
    stock_quantity INT DEFAULT 0, 
    discount_percent DECIMAL DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    added_on TIMESTAMP DEFAULT CURNT_TIMESTAMP
);

-- 3. Purchases
CREATE TABLE purchases(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    unit_price DECIMAL DEFAULT 0.0,
    total_amount DECIMAL DEFAULT 0.0,
    status VARCHAR(20) CHECK (status IN ('Paid', 'Payment Pending', 'Shipped', 'Delivered', 'Cancelled')),
    shipping_address TEXT,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TOTAL TABLES = 14



-- DEMO DATA INSERTION

-- 1. USERS (Gamers, Organizers, Admin)

INSERT INTO users (id, username, email, password_hash, full_name, phone_number, account_type, is_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'shadowwalker', 'shadow@example.com', 'hashed_pass_1', 'John Doe', '1234567890', 'Gamer', TRUE),
('22222222-2222-2222-2222-222222222222', 'pixelqueen', 'pixel@example.com', 'hashed_pass_2', 'Jane Smith', '0987654321', 'Gamer', TRUE),
('33333333-3333-3333-3333-333333333333', 'gamerboy99', 'gamer99@example.com', 'hashed_pass_3', 'Mike Johnson', '1122334455', 'Gamer', FALSE),
('44444444-4444-4444-4444-444444444444', 'tour_org', 'org@fragmint.com', 'hashed_pass_4', 'Tournament Director', '5566778899', 'Organizer', TRUE),
('55555555-5555-5555-5555-555555555555', 'shop_owner', 'shop@fragmint.com', 'hashed_pass_5', 'Shop Admin', '9988776655', 'Admin', TRUE);

-- 2. FRIENDS (Social Connections)

-- Shadowwalker sends request to Pixelqueen, she accepts
INSERT INTO friends (requester_id, receiver_id, status) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Accepted');

-- Gamerboy sends request to Shadowwalker, pending
INSERT INTO friends (requester_id, receiver_id, status) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Pending');

-- 3. GAMES (Master List)

INSERT INTO games (id, name, description, system_requirements, rating) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Valorant', '5v5 Tactical Shooter', '{"cpu": "i5", "ram": "8GB", "gpu": "GTX 1050"}', 4.5),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CS2', 'Counter-Strike 2', '{"cpu": "i7", "ram": "16GB", "gpu": "RTX 2060"}', 4.7);

-- 4. COUNCILS & MEMBERS

INSERT INTO councils (id, owner_id, name, description, rank, is_verified) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'FragMint Official', 'The official FragMint tournament council', 'Legend', TRUE);

INSERT INTO council_members (user_id, council_id, role) VALUES
('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tournament Director');

-- 5. EVENTS

INSERT INTO events (id, council_id, game_id, title, description, event_type, team_size, registration_fee, prize_pool, start_time, end_time, registration_deadline, status) VALUES
-- Event 1: Team Based (Valorant)
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Valorant Winter Cup', 'Annual winter championship', 'Team', 5, 50.00, 1000.00, '2023-12-20 18:00:00', '2023-12-21 22:00:00', '2023-12-19 18:00:00', 'Upcoming'),
-- Event 2: Solo Based (CS2)
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CS2 1v1 Showdown', 'Solo dueling event', 'Solo', NULL, 10.00, 200.00, '2023-12-15 18:00:00', '2023-12-15 22:00:00', '2023-12-14 18:00:00', 'Upcoming');

-- 6. TEAMS & REGISTRATIONS

-- Create a Team for the Valorant Event
INSERT INTO teams (id, event_id, team_name, leader_id) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Team Alpha', '11111111-1111-1111-1111-111111111111');

-- Add Members to Team Alpha
INSERT INTO team_members (team_id, user_id) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111'), -- Leader joins own team
('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222'); -- Pixelqueen joins

-- a Team for Valorant Event
-- Note: user_id here is the person who PAID/registered (Leader), team_id links the roster
INSERT INTO registrations (event_id, user_id, team_id, payment_status) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Paid');

-- Register Gamerboy for Solo Event
INSERT INTO registrations (event_id, user_id, team_id, payment_status) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', NULL, 'Paid');

-- 7. ROOMS (Social Chat)

INSERT INTO rooms (id, admin_id, room_name, visibility, rules) VALUES
('12345678-1234-1234-1234-123456789012', '11111111-1111-1111-1111-111111111111', 'Chill Zone', 'Public', 'Be respectful');

INSERT INTO room_members (room_id, user_id, role) VALUES
('12345678-1234-1234-1234-123456789012', '11111111-1111-1111-1111-111111111111', 'Admin'),
('12345678-1234-1234-1234-123456789012', '22222222-2222-2222-2222-222222222222', 'Member');

-- 8. SHOP & PRODUCTS

INSERT INTO shops (id, owner_id, name, description, is_verified) VALUES
('99999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', 'Pro Gear Shop', 'Best gaming accessories', TRUE);

INSERT INTO products (id, shop_id, name, price, stock_quantity, discount_percent) VALUES
('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Gaming Mouse X', 49.99, 50, 10),
('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'Mechanical Keyboard', 89.99, 20, 0);

-- 9. PURCHASES

-- User 2 buys a mouse

-- Price after discount calculated in app logic, stored here as snapshot
INSERT INTO purchases (buyer_id, product_id, quantity, unit_price, total_amount, status, shipping_address) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 49.99, 44.99, 'Paid', '123 Gamer Street');