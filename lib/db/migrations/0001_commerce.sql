CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_email text,
  user_name text,
  item_id text NOT NULL,
  item_title_ar text NOT NULL,
  item_title_en text NOT NULL,
  item_kind text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  paid_jod numeric(12, 2) NOT NULL,
  paypal_order_id text NOT NULL,
  paypal_capture_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS purchases_order_item_unique
  ON purchases (paypal_order_id, item_id);

CREATE TABLE IF NOT EXISTS payment_orders (
  order_id text PRIMARY KEY,
  user_id text NOT NULL,
  cart jsonb NOT NULL,
  status text NOT NULL DEFAULT 'created',
  capture_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  captured_at timestamptz
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid,
  item_id text NOT NULL,
  item_title_ar text NOT NULL,
  item_title_en text NOT NULL,
  buyer_uid text NOT NULL,
  buyer_email text,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  whatsapp_country_code text NOT NULL,
  whatsapp_number text NOT NULL,
  session_date date,
  session_time text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS purchase_id uuid;