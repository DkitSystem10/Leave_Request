-- Simple Supabase Schema for LeaveHub
-- No RLS, No Triggers, No Functions - Just Data Storage

-- Drop existing tables if they exist (run this first to clean up)
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Employees Table
CREATE TABLE employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'manager', 'hr', 'superadmin')),
  designation VARCHAR(255),
  manager_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests Table
CREATE TABLE requests (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('leave', 'permission', 'halfday')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  half_day_session VARCHAR(20) CHECK (half_day_session IN ('morning', 'afternoon')),
  reason TEXT NOT NULL,
  alternative_employee_id VARCHAR(50) NOT NULL,
  alternative_employee_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  current_approver VARCHAR(50),
  first_approver JSONB,
  manager_approval JSONB,
  hr_approval JSONB,
  super_admin_approval JSONB,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple Indexes for better query performance
CREATE INDEX idx_requests_employee_id ON requests(employee_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_department ON requests(department);
CREATE INDEX idx_requests_start_date ON requests(start_date);
CREATE INDEX idx_requests_type ON requests(type);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_department ON employees(department);

-- Sample Employees Data
INSERT INTO employees (id, name, email, password, department, role, designation, manager_id) VALUES
('EMP001', 'John Doe', 'john@company.com', 'john123', 'Engineering', 'employee', 'Software Engineer', 'MGR001'),
('EMP002', 'Jane Smith', 'jane@company.com', 'jane123', 'Engineering', 'employee', 'Senior Software Engineer', 'MGR001'),
('EMP003', 'Bob Johnson', 'bob@company.com', 'bob123', 'Marketing', 'employee', 'Marketing Executive', 'MGR001'),
('EMP004', 'Alice Williams', 'alice@company.com', 'alice123', 'Sales', 'employee', 'Sales Representative', 'MGR001'),
('MGR001', 'Manager', 'manager@company.com', 'manager123', 'All Departments', 'manager', 'Manager', 'HR001'),
('HR001', 'HR Person', 'hr@company.com', 'hr123', 'HR', 'hr', 'HR Manager', 'ADMIN001'),
('ADMIN001', 'Super Admin', 'admin@company.com', 'admin123', 'Admin', 'superadmin', 'System Administrator', NULL)
ON CONFLICT (id) DO NOTHING;



