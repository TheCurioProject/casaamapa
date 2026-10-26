-- Reconstruct schema changes that previously reached production outside Prisma
-- migrations, then add durable payment/webhook state. Every catch-up operation is
-- idempotent so this migration can be deployed safely to the existing database.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "add_stripe_commission" BOOLEAN NOT NULL DEFAULT false,
    "is_whole_house" BOOLEAN NOT NULL DEFAULT false,
    "ical_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

INSERT INTO "units" ("id", "name", "price", "is_whole_house", "created_at", "updated_at") VALUES
    ('tierra', 'Tierra', 4000, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('aire', 'Aire', 2000, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('agua', 'Agua', 2000, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('amapa', 'Amapa', 11000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "add_stripe_commission" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "is_whole_house" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "ical_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "daily_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_prices_apartment_id_date_key"
    ON "daily_prices"("apartment_id", "date");

CREATE TABLE IF NOT EXISTS "blocked_dates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apartment_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "is_ota_block" BOOLEAN NOT NULL DEFAULT false,
    "ota_source" TEXT,
    "external_uid" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "blocked_dates" ADD COLUMN IF NOT EXISTS "is_ota_block" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "blocked_dates" ADD COLUMN IF NOT EXISTS "ota_source" TEXT;
ALTER TABLE "blocked_dates" ADD COLUMN IF NOT EXISTS "external_uid" TEXT;
CREATE INDEX IF NOT EXISTS "blocked_dates_start_date_end_date_idx" ON "blocked_dates"("start_date", "end_date");
CREATE INDEX IF NOT EXISTS "blocked_dates_apartment_id_idx" ON "blocked_dates"("apartment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "blocked_dates_apartment_id_ota_source_external_uid_key"
    ON "blocked_dates"("apartment_id", "ota_source", "external_uid");

CREATE TABLE IF NOT EXISTS "sync_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "admin_email" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "key" TEXT NOT NULL DEFAULT 'default';
CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_key" ON "settings"("key");

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "id_photo_url" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deposit_percentage" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "total_price" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_brand" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_last4" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "is_manual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_amount_cents" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "amount_paid_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'mxn';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_failure_reason" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "admin_notification_sent_at" TIMESTAMPTZ;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "notification_error" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_stripe_payment_intent_id_key"
    ON "bookings"("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "bookings_status_expires_at_idx" ON "bookings"("status", "expires_at");

ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "no_overlapping_bookings";
ALTER TABLE "bookings" ADD CONSTRAINT "no_overlapping_bookings" EXCLUDE USING gist (
    "apartment_id" WITH =,
    daterange("check_in", "check_out", '[)') WITH &&
) WHERE ("status" IN ('pending', 'processing', 'confirmed'));

ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_valid_dates";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_valid_dates" CHECK ("check_out" > "check_in");
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_valid_status";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_valid_status" CHECK (
    "status" IN ('pending', 'processing', 'confirmed', 'payment_failed', 'expired', 'cancelled', 'attention_required')
);
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_nonnegative_amounts";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_nonnegative_amounts" CHECK (
    COALESCE("payment_amount_cents", 0) >= 0 AND "amount_paid_cents" >= 0
);

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payment_intent_id" TEXT,
    "booking_id" UUID,
    "error" TEXT,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_payment_intent_id_idx"
    ON "stripe_webhook_events"("payment_intent_id");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_booking_id_idx"
    ON "stripe_webhook_events"("booking_id");

DO $$ BEGIN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_apartment_id_fkey"
        FOREIGN KEY ("apartment_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "daily_prices" ADD CONSTRAINT "daily_prices_apartment_id_fkey"
        FOREIGN KEY ("apartment_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_apartment_id_fkey"
        FOREIGN KEY ("apartment_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
