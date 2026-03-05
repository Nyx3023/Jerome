-- Migration: Add prenatal and follow-up fields
-- Created: 2026-02-11
-- Description: Adds Last Menstrual Period, Follow-up Provider Type fields

-- Add last_menstrual_period to patients table (ignore error if exists)
ALTER TABLE patients 
ADD COLUMN last_menstrual_period DATE NULL 
COMMENT 'Last Menstrual Period date for prenatal tracking';

-- Add expected_delivery_date to patients table (ignore error if exists)
ALTER TABLE patients 
ADD COLUMN expected_delivery_date DATE NULL 
COMMENT 'Expected Delivery Date (EDD) for pregnant patients';

-- Add follow_up_provider_type to booking table (ignore error if exists)
ALTER TABLE booking 
ADD COLUMN follow_up_provider_type ENUM('doctor', 'midwife', 'obgyn') NULL DEFAULT 'doctor'
COMMENT 'Type of provider for follow-up appointment';
