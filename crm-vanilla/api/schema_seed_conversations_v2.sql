-- Seed conversations test data — enhanced version
-- This migration handles missing contacts and org scoping
-- Idempotent: uses INSERT IGNORE and checks for existing data

-- First, ensure the 6 required contacts exist (for conversations to reference)
-- Only insert if they don't already exist (via email uniqueness)
-- Includes organization_id = 1 for org-scoped schema
INSERT IGNORE INTO contacts (organization_id, name, email, phone, company, role, status, value, last_contact)
VALUES
  (1, 'Sofia Martinez', 'sofia@latamgroup.com', '+56 9 8765 4321', 'LATAM Group', 'Marketing Director', 'customer', 24500, '2026-04-10'),
  (1, 'Carlos Mendoza', 'carlos@techwave.cl', '+56 2 2345 6789', 'TechWave Chile', 'CEO', 'customer', 18200, '2026-04-08'),
  (1, 'Isabella Torres', 'isabella@greenleaf.com', '+56 9 1234 5678', 'GreenLeaf Organics', 'Brand Manager', 'prospect', 12800, '2026-04-07'),
  (1, 'Diego Ramirez', 'diego@novalabs.io', '+56 9 5555 1234', 'NovaLabs', 'CTO', 'lead', 8400, '2026-04-12'),
  (1, 'Valentina Cruz', 'valentina@skyport.cl', '+56 2 9876 5432', 'SkyPort Logistics', 'VP Sales', 'customer', 32100, '2026-04-05'),
  (1, 'Mateo Silva', 'mateo@andeanventures.com', '+56 9 7777 8888', 'Andean Ventures', 'Founder', 'prospect', 15600, '2026-04-09');

-- Seed conversations (assumes contact IDs 1-6 now exist)
-- Uses INSERT IGNORE for idempotence
-- Includes organization_id = 1 for org-scoped schema
INSERT IGNORE INTO conversations (organization_id, contact_id, channel, subject, unread, created_at, updated_at)
VALUES
  (1, 1, 'email', 'Q2 Campaign Strategy', 0, NOW(), NOW()),
  (1, 2, 'whatsapp', NULL, 1, NOW(), NOW()),
  (1, 3, 'email', 'Proposal Follow-up', 1, NOW(), NOW()),
  (1, 5, 'sms', NULL, 0, NOW(), NOW()),
  (1, 6, 'email', 'Brand Discovery Call', 0, NOW(), NOW()),
  (1, 4, 'whatsapp', NULL, 1, NOW(), NOW());

-- Seed messages for each conversation
-- Includes organization_id = 1 for org-scoped schema
INSERT IGNORE INTO messages (organization_id, conversation_id, sender, body, sent_at)
VALUES
  (1, 1, 'them', 'Hi! Just wanted to check in on the Q2 campaign timeline.', '2026-04-14 09:15:00'),
  (1, 1, 'me', 'Hey Sofia! We are on track. Creative briefs go out this Friday.', '2026-04-14 09:22:00'),
  (1, 1, 'them', 'Perfect. Can we add a TikTok component?', '2026-04-14 09:30:00'),
  (1, 2, 'them', 'Carlos here. The SEO report looks great, just one question about the keyword clusters.', '2026-04-13 14:00:00'),
  (1, 2, 'me', 'Sure, which cluster?', '2026-04-13 14:05:00'),
  (1, 2, 'them', 'The long-tail group for enterprise SaaS terms.', '2026-04-13 14:08:00'),
  (1, 2, 'me', 'Good catch. Let me send you the expanded analysis by EOD.', '2026-04-13 14:12:00'),
  (1, 3, 'me', 'Hi Isabella, following up on the social media proposal we sent last week.', '2026-04-12 11:00:00'),
  (1, 3, 'them', 'Thanks for following up! We are reviewing internally. Should have an answer by Wednesday.', '2026-04-12 16:30:00'),
  (1, 4, 'me', 'Hi Valentina, your ad campaign is live! Here are the first 24h metrics.', '2026-04-14 08:00:00'),
  (1, 4, 'them', 'Wow, 3.2% CTR already? That is amazing!', '2026-04-14 08:45:00'),
  (1, 5, 'them', 'Mateo from Andean Ventures. When can we schedule the brand discovery call?', '2026-04-11 10:00:00'),
  (1, 5, 'me', 'How about Thursday 2pm?', '2026-04-11 10:30:00'),
  (1, 5, 'them', 'Works for me. Send me the calendar invite.', '2026-04-11 10:35:00'),
  (1, 6, 'them', 'Hey, Diego here. Can you send me the landing page mockups?', '2026-04-14 07:30:00'),
  (1, 6, 'me', 'Sure, they are almost ready. Give me 2 hours.', '2026-04-14 07:45:00'),
  (1, 6, 'them', 'No rush, just whenever you can.', '2026-04-14 07:50:00');
