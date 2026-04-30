-- ============================================================
-- PostgreSQL Schema
-- ============================================================

-- ENUM types
CREATE TYPE currency_type AS ENUM ('SAR', 'AED', 'EGP', 'OMR');
CREATE TYPE transaction_type AS ENUM ('send', 'receive');
CREATE TYPE goal_mode AS ENUM ('monthly', 'deadline');

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255)   NOT NULL,
    email      VARCHAR(255)   NOT NULL UNIQUE,
    balance    DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency   currency_type  NOT NULL,
    created_at TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- pockets
-- ============================================================
CREATE TABLE pockets (
    id                     SERIAL PRIMARY KEY,
    user_id                INT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                   VARCHAR(255)   NOT NULL,
    is_system              BOOLEAN        NOT NULL DEFAULT FALSE,
    percentage             DECIMAL(5, 4)  NULL,     -- system pockets only (e.g. 0.5, 0.3, 0.2)
    balance                DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    last_contribution_date TIMESTAMP      NULL,

    CONSTRAINT chk_system_percentage
        CHECK (
            (is_system = TRUE  AND percentage IS NOT NULL) OR
            (is_system = FALSE AND percentage IS NULL)
        )
);

CREATE INDEX idx_pockets_user_id ON pockets(user_id);

-- ============================================================
-- pocket_goals
-- ============================================================
CREATE TABLE pocket_goals (
    id                   SERIAL PRIMARY KEY,
    pocket_id            INT            NOT NULL UNIQUE REFERENCES pockets(id) ON DELETE CASCADE,
    title                VARCHAR(255)   NOT NULL,
    target_amount        DECIMAL(15, 2) NOT NULL,
    monthly_contribution DECIMAL(15, 2) NOT NULL,
    mode                 goal_mode      NOT NULL,
    target_date          DATE           NULL,   -- deadline mode only
    start_date           DATE           NULL,
    end_date             DATE           NULL,
    contribution_day     SMALLINT       NOT NULL CHECK (contribution_day BETWEEN 1 AND 31),
    is_active            BOOLEAN        NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_deadline_target_date
        CHECK (mode != 'deadline' OR target_date IS NOT NULL)
);

-- ============================================================
-- transactions
-- ============================================================
CREATE TABLE transactions (
    id               SERIAL PRIMARY KEY,
    type             transaction_type NOT NULL,
    from_user_id     INT            NULL REFERENCES users(id) ON DELETE SET NULL,
    to_user_id       INT            NULL REFERENCES users(id) ON DELETE SET NULL,
    amount           DECIMAL(15, 2) NOT NULL,
    converted_amount DECIMAL(15, 2) NOT NULL,
    from_currency    currency_type  NOT NULL,
    to_currency      currency_type  NOT NULL,
    recipient_ref    VARCHAR(255)   NULL,   -- QR reference field
    payment_details  VARCHAR(500)   NULL,   -- optional note
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user   ON transactions(to_user_id);
CREATE INDEX idx_transactions_created   ON transactions(created_at);
