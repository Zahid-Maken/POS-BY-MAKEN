/*
  # Initial POS System Schema

  1. Tables
    - users (handled by Supabase Auth)
    - products
      - id (uuid, primary key)
      - name (text)
      - price (numeric)
      - stock (integer)
      - category (text)
      - image_url (text, optional)
    - orders
      - id (uuid, primary key)
      - total (numeric)
      - cashier_id (uuid, references auth.users)
      - created_at (timestamp with time zone)
    - order_items
      - id (uuid, primary key)
      - order_id (uuid, references orders)
      - product_id (uuid, references products)
      - quantity (integer)
      - price (numeric)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and cashier access
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total numeric NOT NULL CHECK (total >= 0),
  cashier_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for products
CREATE POLICY "Admin can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Cashiers can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'cashier');

-- Policies for orders
CREATE POLICY "Admin can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Cashiers can manage their own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'cashier' AND
    cashier_id = auth.uid()
  );

-- Policies for order_items
CREATE POLICY "Admin can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Cashiers can manage their order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'cashier' AND
    order_id IN (
      SELECT id FROM orders WHERE cashier_id = auth.uid()
    )
  );