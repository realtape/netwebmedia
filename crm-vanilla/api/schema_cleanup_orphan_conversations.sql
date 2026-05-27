-- Delete 1221 orphaned conversations (and their messages) seeded against
-- contact_ids 1-6 which no longer exist. Safe to re-run: DELETE WHERE
-- returns 0 rows if already clean.

DELETE FROM messages
WHERE conversation_id IN (
    SELECT id FROM conversations WHERE contact_id IN (1,2,3,4,5,6)
);

DELETE FROM conversations
WHERE contact_id IN (1,2,3,4,5,6);
