-- NMD Logistics Management System Database Schema
-- PostgreSQL with Supabase

-- =====================================================
-- USERS & ROLES
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'delivery_personnel');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'delivery_personnel',
  status user_status NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT email_format CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

-- Create index for email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- =====================================================
-- DELIVERY PERSONNEL
-- =====================================================

-- Vehicle types enum
CREATE TYPE vehicle_type AS ENUM ('bike', 'auto', 'car', 'van', 'truck');

-- Personnel status enum
CREATE TYPE personnel_status AS ENUM ('available', 'on_delivery', 'on_break', 'off_duty');

-- Delivery personnel table
CREATE TABLE delivery_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  vehicle_number TEXT UNIQUE NOT NULL,
  license_number TEXT UNIQUE,
  current_status personnel_status NOT NULL DEFAULT 'available',
  total_deliveries_completed INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT rating_range CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes
CREATE INDEX idx_delivery_personnel_user_id ON delivery_personnel(user_id);
CREATE INDEX idx_delivery_personnel_status ON delivery_personnel(current_status);
CREATE INDEX idx_delivery_personnel_vehicle ON delivery_personnel(vehicle_number);

-- =====================================================
-- ORDERS
-- =====================================================

-- Order status enum
CREATE TYPE order_status AS ENUM (
  'draft',
  'confirmed',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'failed',
  'cancelled'
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES users(id),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  
  -- Pickup details
  pickup_location TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  pickup_time TIMESTAMP WITH TIME ZONE,
  
  -- Delivery details
  delivery_location TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  expected_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  
  -- Package details
  package_weight DECIMAL(8, 2),
  package_dimensions TEXT,
  package_description TEXT,
  package_value DECIMAL(10, 2),
  
  -- Status and tracking
  status order_status NOT NULL DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  special_instructions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT valid_order_number CHECK (order_number ~ '^ORD-[0-9]{6,}$')
);

-- Create indexes
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_expected_delivery ON orders(expected_delivery_time);

-- =====================================================
-- ORDER ASSIGNMENTS
-- =====================================================

-- Assignment status enum
CREATE TYPE assignment_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'in_progress',
  'completed',
  'cancelled'
);

-- Order assignments table
CREATE TABLE order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES delivery_personnel(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  status assignment_status NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  estimated_duration_minutes INT,
  actual_duration_minutes INT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assignments_order ON order_assignments(order_id);
CREATE INDEX idx_assignments_personnel ON order_assignments(personnel_id);
CREATE INDEX idx_assignments_status ON order_assignments(status);
CREATE INDEX idx_assignments_assigned_at ON order_assignments(assigned_at DESC);

-- =====================================================
-- DELIVERY STATUS HISTORY
-- =====================================================

-- Status history table (audit trail)
CREATE TABLE delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES order_assignments(id) ON DELETE SET NULL,
  
  previous_status order_status,
  new_status order_status NOT NULL,
  
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_status_history_order ON delivery_status_history(order_id);
CREATE INDEX idx_status_history_created_at ON delivery_status_history(created_at DESC);

-- =====================================================
-- REPORTS
-- =====================================================

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  
  -- Report period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Report data (stored as JSON for flexibility)
  data JSONB,
  
  -- Who generated it
  generated_by UUID NOT NULL REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_generated_by ON reports(generated_by);

-- =====================================================
-- ANALYTICS METRICS
-- =====================================================

-- Daily analytics table
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  
  total_orders INT DEFAULT 0,
  completed_orders INT DEFAULT 0,
  failed_orders INT DEFAULT 0,
  average_delivery_time_minutes INT,
  
  total_personnel_active INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_analytics_date ON analytics_metrics(date DESC);

-- =====================================================
-- SETTINGS
-- =====================================================

-- Application settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  setting_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_settings_key ON settings(key);

-- =====================================================
-- AUDIT LOG
-- =====================================================

-- Audit log table for compliance and debugging
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_personnel_updated_at BEFORE UPDATE ON delivery_personnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_assignments_updated_at BEFORE UPDATE ON order_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_metrics_updated_at BEFORE UPDATE ON analytics_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for active orders with assignment info
CREATE VIEW active_orders_with_assignments AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.client_name,
  o.delivery_location,
  dp.user_id,
  dp.vehicle_number,
  oa.status as assignment_status,
  oa.assigned_at,
  u.full_name as personnel_name
FROM orders o
LEFT JOIN order_assignments oa ON o.id = oa.order_id
LEFT JOIN delivery_personnel dp ON oa.personnel_id = dp.id
LEFT JOIN users u ON dp.user_id = u.id
WHERE o.status NOT IN ('delivered', 'cancelled', 'failed');

-- View for personnel performance
CREATE VIEW personnel_performance AS
SELECT 
  dp.id,
  u.full_name,
  u.email,
  dp.total_deliveries_completed,
  dp.rating,
  COUNT(CASE WHEN oa.status = 'completed' THEN 1 END) as completed_this_week,
  AVG(oa.actual_duration_minutes) as avg_delivery_time
FROM delivery_personnel dp
JOIN users u ON dp.user_id = u.id
LEFT JOIN order_assignments oa ON dp.id = oa.personnel_id 
  AND oa.created_at > NOW() - INTERVAL '7 days'
GROUP BY dp.id, u.full_name, u.email, dp.total_deliveries_completed, dp.rating;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies will be created in the application layer via Supabase

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_assignments_personnel_status ON order_assignments(personnel_id, status);
CREATE INDEX idx_delivery_personnel_status_created ON delivery_personnel(current_status, created_at DESC);
