-- Rename legacy trigger_type 'deal_stage_changed' to canonical 'deal_stage'.
-- The visual builder used to store 'deal_stage_changed' but the engine
-- (and the contacts/deals trigger callers) fire 'deal_stage' — the mismatch
-- meant any builder workflow on stage change silently never ran.
-- Idempotent: re-running this is a no-op once the data is migrated.

UPDATE `workflows`
   SET `trigger_type` = 'deal_stage'
 WHERE `trigger_type` = 'deal_stage_changed';
