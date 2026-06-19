-- Migration: add notifications, po_pso_mappings, and final_results tables
-- Run this after init.sql

-- Persistent notifications (replaces mockNotifications)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    message          TEXT NOT NULL,
    type             VARCHAR(50) NOT NULL CHECK (type IN ('deadline','approval','alert','schedule')),
    priority         VARCHAR(20) NOT NULL CHECK (priority IN ('high','medium','low')),
    is_read          BOOLEAN DEFAULT FALSE,
    action_url       VARCHAR(500),
    created_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, is_read);

-- PO/PSO mapping matrix
CREATE TABLE IF NOT EXISTS po_pso_mappings (
    mapping_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_type VARCHAR(3) NOT NULL CHECK (mapping_type IN ('PO','PSO')),
    criteria_id  VARCHAR(100) NOT NULL,
    outcome_id   VARCHAR(20) NOT NULL,
    level        INT NOT NULL CHECK (level BETWEEN 0 AND 3),
    batch_year   INT NOT NULL,
    created_by   UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(mapping_type, criteria_id, outcome_id, batch_year)
);
CREATE INDEX IF NOT EXISTS idx_mappings_batch ON po_pso_mappings(batch_year, mapping_type);

-- Final computed results per group
CREATE TABLE IF NOT EXISTS final_results (
    result_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    r1_marks           NUMERIC(5,2),
    r2_marks           NUMERIC(5,2),
    r3_marks           NUMERIC(5,2),
    final_phase_marks  NUMERIC(5,2),
    final_marks        NUMERIC(5,2),
    grade              VARCHAR(3),
    computed_at        TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id)
);
CREATE INDEX IF NOT EXISTS idx_results_group ON final_results(group_id);

-- Migration: milestone_progress table (Requirement 9.1)
CREATE TABLE IF NOT EXISTS milestone_progress (
    milestone_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id      UUID REFERENCES project_groups(group_id) ON DELETE CASCADE,
    phase         VARCHAR(50),
    title         VARCHAR(255) NOT NULL,
    due_date      TIMESTAMP NOT NULL,
    completed_at  TIMESTAMP,
    status        VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_milestone_group_due ON milestone_progress(group_id, due_date);

-- Migration: add risk_level column to project_groups (Requirement 17.5)
ALTER TABLE project_groups
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10) NOT NULL DEFAULT 'ON_TRACK'
        CHECK (risk_level IN ('ON_TRACK', 'AT_RISK', 'CRITICAL'));

-- Migration: evaluation_drafts table for live grading draft auto-save (Requirements 3.1, 3.2, 3.6, 9.3)
CREATE TABLE IF NOT EXISTS evaluation_drafts (
    draft_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id      UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    phase         evaluation_phase NOT NULL,
    rubric_scores JSONB NOT NULL DEFAULT '{}',
    total_marks   NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_drafts_group_phase
    ON evaluation_drafts(group_id, phase);
