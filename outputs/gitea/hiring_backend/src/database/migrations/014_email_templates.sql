-- Migration 014: Email templates for organizations
-- Allows HR to define reusable email templates (e.g., interview cancellation)
-- Rollback: DROP TABLE IF EXISTS email_templates;

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_org_type ON email_templates(organization_id, type);
