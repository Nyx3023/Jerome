-- Migration: Add indexes for prenatal fields (run after add_prenatal_fields.sql)
-- Created: 2026-02-11
-- Description: Adds indexes for better query performance

-- Add index for follow_up_provider_type
ALTER TABLE booking ADD INDEX idx_booking_follow_up_provider (follow_up_provider_type);

-- Add index for last_menstrual_period
ALTER TABLE patients ADD INDEX idx_patients_lmp (last_menstrual_period);

-- Add index for expected_delivery_date
ALTER TABLE patients ADD INDEX idx_patients_edd (expected_delivery_date);
