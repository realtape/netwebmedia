// Extended mock data for HubSpot + GHL parity modules
// Keep separate from the original mock-data.ts so we can swap in real data later.

// ============ SALES HUB ============

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  revenue: string;
  owner: string;
  dealsCount: number;
  lifetimeValue: number;
  healthScore: number;
  tier: "Enterprise" | "Mid-Market" | "SMB" | "Startup";
  createdAt: string;
}

export const companies: Company[] = [
  { id: "co1", name: "Acme Corp", domain: "acmecorp.com", industry: "SaaS", size: "500-1000", revenue: "$50M-100M", owner: "John Doe", dealsCount: 3, lifetimeValue: 125000, healthScore: 92, tier: "Enterprise", createdAt: "2024-06-12" },
  { id: "co2", name: "TechStart", domain: "techstart.io", industry: "Fintech", size: "10-50", revenue: "$1M-5M", owner: "John Doe", dealsCount: 1, lifetimeValue: 8200, healthScore: 78, tier: "Startup", createdAt: "2025-02-03" },
  { id: "co3", name: "GlobalFin", domain: "globalfin.com", industry: "Finance", size: "1000+", revenue: "$100M+", owner: "Jane Smith", dealsCount: 2, lifetimeValue: 82000, healthScore: 85, tier: "Enterprise", createdAt: "2024-09-01" },
  { id: "co4", name: "RetailHub", domain: "retailhub.com", industry: "Retail", size: "50-250", revenue: "$10M-50M", owner: "John Doe", dealsCount: 4, lifetimeValue: 34500, healthScore: 68, tier: "Mid-Market", createdAt: "2024-11-22" },
  { id: "co5", name: "MediaPro", domain: "mediapro.co", industry: "Media", size: "10-50", revenue: "$5M-10M", owner: "Jane Smith", dealsCount: 2, lifetimeValue: 27000, healthScore: 72, tier: "SMB", createdAt: "2025-04-10" },
  { id: "co6", name: "ConstructX", domain: "constructx.com", industry: "Construction", size: "250-500", revenue: "$25M-50M", owner: "John Doe", dealsCount: 1, lifetimeValue: 32000, healthScore: 81, tier: "Mid-Market", createdAt: "2025-06-14" },
  { id: "co7", name: "HealthNet", domain: "healthnet.org", industry: "Healthcare", size: "1000+", revenue: "$100M+", owner: "Jane Smith", dealsCount: 5, lifetimeValue: 185000, healthScore: 95, tier: "Enterprise", createdAt: "2023-11-30" },
  { id: "co8", name: "AutoFix", domain: "autofix.com", industry: "Automotive", size: "1-10", revenue: "<$1M", owner: "John Doe", dealsCount: 1, lifetimeValue: 4200, healthScore: 35, tier: "SMB", createdAt: "2025-05-07" },
  { id: "co9", name: "EduLearn", domain: "edulearn.com", industry: "Education", size: "50-250", revenue: "$5M-10M", owner: "Jane Smith", dealsCount: 2, lifetimeValue: 19600, healthScore: 76, tier: "Mid-Market", createdAt: "2025-08-18" },
  { id: "co10", name: "FoodChain", domain: "foodchain.co", industry: "F&B", size: "250-500", revenue: "$10M-25M", owner: "John Doe", dealsCount: 1, lifetimeValue: 7500, healthScore: 62, tier: "Mid-Market", createdAt: "2026-01-05" },
];

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  recurring: "monthly" | "yearly" | "one-time";
  description: string;
  inStock: boolean;
  unitsSold: number;
}

export const products: Product[] = [
  { id: "p1", name: "NWM Starter", sku: "NWM-START", category: "Plans", price: 49, recurring: "monthly", description: "Entry-level CRM + Marketing automation", inStock: true, unitsSold: 432 },
  { id: "p2", name: "NWM Growth", sku: "NWM-GROW", category: "Plans", price: 199, recurring: "monthly", description: "Full CRM, Marketing, Service + AI", inStock: true, unitsSold: 284 },
  { id: "p3", name: "NWM Agency", sku: "NWM-AGENCY", category: "Plans", price: 499, recurring: "monthly", description: "Unlimited sub-accounts, white-label, SaaS mode", inStock: true, unitsSold: 112 },
  { id: "p4", name: "NWM Enterprise", sku: "NWM-ENT", category: "Plans", price: 1299, recurring: "monthly", description: "Custom SLAs, dedicated CSM, SSO, audit logs", inStock: true, unitsSold: 41 },
  { id: "p5", name: "Voice AI Add-on", sku: "NWM-VOICE", category: "Add-ons", price: 99, recurring: "monthly", description: "Conversational voice agents with call routing", inStock: true, unitsSold: 167 },
  { id: "p6", name: "Video Factory", sku: "NWM-VIDEO", category: "Add-ons", price: 79, recurring: "monthly", description: "AI avatar video personalization at scale", inStock: true, unitsSold: 93 },
  { id: "p7", name: "Migration (DFY)", sku: "NWM-MIG", category: "Services", price: 2500, recurring: "one-time", description: "Done-for-you migration from HubSpot/GHL/Salesforce", inStock: true, unitsSold: 58 },
  { id: "p8", name: "Fractional CMO", sku: "NWM-CMO", category: "Services", price: 4500, recurring: "monthly", description: "Dedicated fractional CMO for 3+ months", inStock: true, unitsSold: 24 },
];

export interface Quote {
  id: string;
  number: string;
  contactName: string;
  companyName: string;
  total: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  createdAt: string;
  lineItems: number;
}

export const quotes: Quote[] = [
  { id: "q1", number: "Q-2026-0142", contactName: "Sarah Johnson", companyName: "Acme Corp", total: 14990, status: "accepted", expiresAt: "2026-05-01", createdAt: "2026-04-10", lineItems: 3 },
  { id: "q2", number: "Q-2026-0143", contactName: "Mike Chen", companyName: "TechStart", total: 8200, status: "viewed", expiresAt: "2026-05-08", createdAt: "2026-04-12", lineItems: 2 },
  { id: "q3", number: "Q-2026-0144", contactName: "Emily Davis", companyName: "GlobalFin", total: 29500, status: "sent", expiresAt: "2026-05-15", createdAt: "2026-04-15", lineItems: 5 },
  { id: "q4", number: "Q-2026-0145", contactName: "Lisa Park", companyName: "MediaPro", total: 15000, status: "draft", expiresAt: "2026-05-20", createdAt: "2026-04-17", lineItems: 4 },
  { id: "q5", number: "Q-2026-0146", contactName: "David Brown", companyName: "ConstructX", total: 32000, status: "sent", expiresAt: "2026-05-22", createdAt: "2026-04-18", lineItems: 6 },
  { id: "q6", number: "Q-2026-0141", contactName: "Tom Harris", companyName: "AutoFix", total: 4200, status: "rejected", expiresAt: "2026-04-20", createdAt: "2026-04-05", lineItems: 1 },
  { id: "q7", number: "Q-2026-0147", contactName: "Rachel Kim", companyName: "EduLearn", total: 9800, status: "viewed", expiresAt: "2026-05-25", createdAt: "2026-04-19", lineItems: 2 },
  { id: "q8", number: "Q-2026-0148", contactName: "Chris Taylor", companyName: "FoodChain", total: 7500, status: "draft", expiresAt: "2026-06-01", createdAt: "2026-04-20", lineItems: 2 },
];

export interface Playbook {
  id: string;
  name: string;
  category: "Discovery" | "Demo" | "Objection" | "Closing" | "Onboarding";
  steps: number;
  usage: number;
  winRate: number;
  author: string;
  updatedAt: string;
}

export const playbooks: Playbook[] = [
  { id: "pb1", name: "Enterprise Discovery (MEDDIC)", category: "Discovery", steps: 8, usage: 142, winRate: 34, author: "Jane Smith", updatedAt: "2026-03-22" },
  { id: "pb2", name: "SaaS SMB Fast-Close", category: "Closing", steps: 5, usage: 287, winRate: 58, author: "John Doe", updatedAt: "2026-04-01" },
  { id: "pb3", name: "Product Demo — Technical", category: "Demo", steps: 6, usage: 93, winRate: 41, author: "Jane Smith", updatedAt: "2026-03-15" },
  { id: "pb4", name: "Price Objection Handler", category: "Objection", steps: 4, usage: 156, winRate: 48, author: "John Doe", updatedAt: "2026-04-10" },
  { id: "pb5", name: "Agency Onboarding (14-day)", category: "Onboarding", steps: 12, usage: 67, winRate: 92, author: "Jane Smith", updatedAt: "2026-02-28" },
  { id: "pb6", name: "Competitive Replace — HubSpot", category: "Objection", steps: 7, usage: 48, winRate: 55, author: "John Doe", updatedAt: "2026-04-14" },
  { id: "pb7", name: "Competitive Replace — GHL", category: "Objection", steps: 7, usage: 36, winRate: 61, author: "John Doe", updatedAt: "2026-04-14" },
];

export interface SequenceTemplate {
  id: string;
  name: string;
  steps: number;
  channels: string[];
  enrolled: number;
  openRate: number;
  replyRate: number;
  status: "active" | "paused" | "draft";
  createdAt: string;
}

export const sequencesList: SequenceTemplate[] = [
  { id: "sq1", name: "Cold Outreach — SaaS Founders", steps: 7, channels: ["email", "linkedin"], enrolled: 324, openRate: 48, replyRate: 12, status: "active", createdAt: "2026-01-15" },
  { id: "sq2", name: "Post-Demo Follow-up", steps: 4, channels: ["email", "sms"], enrolled: 142, openRate: 72, replyRate: 38, status: "active", createdAt: "2026-02-02" },
  { id: "sq3", name: "Re-engagement (90 days cold)", steps: 5, channels: ["email"], enrolled: 567, openRate: 31, replyRate: 7, status: "active", createdAt: "2026-01-28" },
  { id: "sq4", name: "Trial Conversion (Day 1-14)", steps: 10, channels: ["email", "in-app", "sms"], enrolled: 203, openRate: 65, replyRate: 24, status: "active", createdAt: "2025-12-10" },
  { id: "sq5", name: "Agency Partner Nurture", steps: 6, channels: ["email", "linkedin"], enrolled: 89, openRate: 54, replyRate: 18, status: "active", createdAt: "2026-03-05" },
  { id: "sq6", name: "Quarterly Check-in (Customers)", steps: 3, channels: ["email"], enrolled: 412, openRate: 81, replyRate: 29, status: "paused", createdAt: "2025-11-20" },
];

export interface ForecastRow {
  owner: string;
  pipeline: number;
  commit: number;
  best: number;
  quota: number;
  attainment: number;
  deals: number;
}

export const forecastingData: ForecastRow[] = [
  { owner: "John Doe", pipeline: 428500, commit: 184000, best: 312000, quota: 250000, attainment: 74, deals: 12 },
  { owner: "Jane Smith", pipeline: 612300, commit: 295000, best: 448000, quota: 300000, attainment: 98, deals: 15 },
  { owner: "Carlos Rivera", pipeline: 287000, commit: 98000, best: 165000, quota: 180000, attainment: 54, deals: 8 },
  { owner: "Priya Patel", pipeline: 195000, commit: 72000, best: 128000, quota: 150000, attainment: 48, deals: 6 },
  { owner: "Marcus Lee", pipeline: 341500, commit: 152000, best: 246000, quota: 220000, attainment: 69, deals: 11 },
];

// ============ MARKETING HUB ============

export interface Campaign {
  id: string;
  name: string;
  type: "Email" | "SMS" | "Social" | "Multi-channel" | "Ads";
  status: "active" | "scheduled" | "completed" | "paused" | "draft";
  audience: number;
  sent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  launchDate: string;
}

export const campaigns: Campaign[] = [
  { id: "ca1", name: "Q2 Enterprise Launch", type: "Multi-channel", status: "active", audience: 12500, sent: 12500, openRate: 42, clickRate: 8.5, conversionRate: 2.4, revenue: 128000, launchDate: "2026-04-01" },
  { id: "ca2", name: "Agency Partner Webinar", type: "Email", status: "completed", audience: 4200, sent: 4200, openRate: 58, clickRate: 12, conversionRate: 4.1, revenue: 52000, launchDate: "2026-03-15" },
  { id: "ca3", name: "Spring Feature Drop", type: "Email", status: "scheduled", audience: 18000, sent: 0, openRate: 0, clickRate: 0, conversionRate: 0, revenue: 0, launchDate: "2026-04-28" },
  { id: "ca4", name: "SMS Flash Promo", type: "SMS", status: "completed", audience: 3400, sent: 3400, openRate: 95, clickRate: 24, conversionRate: 7.8, revenue: 34500, launchDate: "2026-03-20" },
  { id: "ca5", name: "LinkedIn ABM — Fortune 500", type: "Social", status: "active", audience: 520, sent: 520, openRate: 72, clickRate: 18, conversionRate: 5.2, revenue: 185000, launchDate: "2026-04-05" },
  { id: "ca6", name: "Google Ads — CRM Intent", type: "Ads", status: "active", audience: 45000, sent: 45000, openRate: 0, clickRate: 3.8, conversionRate: 1.9, revenue: 76000, launchDate: "2026-03-01" },
  { id: "ca7", name: "Churn Win-back", type: "Multi-channel", status: "paused", audience: 890, sent: 890, openRate: 35, clickRate: 6, conversionRate: 2.1, revenue: 18500, launchDate: "2026-02-10" },
  { id: "ca8", name: "Holiday Gift Guide", type: "Email", status: "draft", audience: 0, sent: 0, openRate: 0, clickRate: 0, conversionRate: 0, revenue: 0, launchDate: "2026-11-15" },
];

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: number;
  status: "active" | "paused" | "draft";
  enrolled: number;
  completed: number;
  conversionRate: number;
  updatedAt: string;
}

export const automations: Automation[] = [
  { id: "au1", name: "New Lead → Welcome + SDR Assignment", trigger: "Form Submission", actions: 8, status: "active", enrolled: 1247, completed: 1089, conversionRate: 24, updatedAt: "2026-04-10" },
  { id: "au2", name: "Abandoned Quote → Follow-up", trigger: "Quote Viewed > 48h", actions: 5, status: "active", enrolled: 142, completed: 98, conversionRate: 32, updatedAt: "2026-03-22" },
  { id: "au3", name: "Demo Scheduled → Prep Sequence", trigger: "Calendar Booking", actions: 6, status: "active", enrolled: 287, completed: 267, conversionRate: 68, updatedAt: "2026-04-05" },
  { id: "au4", name: "Churn Risk → Rescue Play", trigger: "Health Score < 50", actions: 10, status: "active", enrolled: 46, completed: 38, conversionRate: 42, updatedAt: "2026-04-14" },
  { id: "au5", name: "Birthday / Anniversary", trigger: "Date Field Match", actions: 3, status: "active", enrolled: 892, completed: 892, conversionRate: 12, updatedAt: "2025-12-01" },
  { id: "au6", name: "Webinar Registration → Reminder Chain", trigger: "Event Signup", actions: 7, status: "active", enrolled: 524, completed: 487, conversionRate: 74, updatedAt: "2026-04-01" },
  { id: "au7", name: "Closed-Won → Onboarding Kickoff", trigger: "Deal Stage = Won", actions: 12, status: "active", enrolled: 78, completed: 72, conversionRate: 92, updatedAt: "2026-03-28" },
  { id: "au8", name: "Inactive Contact Win-back", trigger: "No Activity > 90 days", actions: 6, status: "paused", enrolled: 412, completed: 287, conversionRate: 8, updatedAt: "2026-02-15" },
];

export interface LandingPage {
  id: string;
  name: string;
  slug: string;
  template: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  status: "published" | "draft" | "archived";
  publishedAt: string;
}

export const landingPages: LandingPage[] = [
  { id: "lp1", name: "Free CRM Demo", slug: "demo", template: "Lead Capture", visits: 14280, conversions: 842, conversionRate: 5.9, status: "published", publishedAt: "2025-11-10" },
  { id: "lp2", name: "Agency Partner Program", slug: "agency", template: "Long-form Sales", visits: 8450, conversions: 312, conversionRate: 3.7, status: "published", publishedAt: "2025-12-05" },
  { id: "lp3", name: "Voice AI Beta", slug: "voice-ai-beta", template: "Waitlist", visits: 5200, conversions: 784, conversionRate: 15.1, status: "published", publishedAt: "2026-01-20" },
  { id: "lp4", name: "HubSpot Migration Offer", slug: "switch-from-hubspot", template: "Comparison", visits: 3100, conversions: 186, conversionRate: 6.0, status: "published", publishedAt: "2026-03-10" },
  { id: "lp5", name: "GHL → NWM Upgrade", slug: "upgrade-from-ghl", template: "Comparison", visits: 2240, conversions: 142, conversionRate: 6.3, status: "published", publishedAt: "2026-03-15" },
  { id: "lp6", name: "Q2 Webinar Registration", slug: "q2-webinar", template: "Event", visits: 6800, conversions: 1120, conversionRate: 16.5, status: "published", publishedAt: "2026-04-01" },
  { id: "lp7", name: "New Pricing Page (A/B)", slug: "pricing-v2", template: "Pricing", visits: 12400, conversions: 486, conversionRate: 3.9, status: "draft", publishedAt: "-" },
];

export interface Form {
  id: string;
  name: string;
  fields: number;
  submissions: number;
  conversionRate: number;
  embedLocations: number;
  status: "active" | "paused" | "draft";
  type: "lead" | "contact" | "survey" | "registration";
}

export const forms: Form[] = [
  { id: "f1", name: "Main Contact Form", fields: 5, submissions: 2480, conversionRate: 8.2, embedLocations: 14, status: "active", type: "contact" },
  { id: "f2", name: "Demo Request", fields: 7, submissions: 842, conversionRate: 5.9, embedLocations: 3, status: "active", type: "lead" },
  { id: "f3", name: "Pricing Calculator", fields: 4, submissions: 1284, conversionRate: 12.3, embedLocations: 2, status: "active", type: "lead" },
  { id: "f4", name: "Newsletter Signup", fields: 2, submissions: 4820, conversionRate: 18.5, embedLocations: 28, status: "active", type: "registration" },
  { id: "f5", name: "Partner Application", fields: 12, submissions: 187, conversionRate: 3.4, embedLocations: 1, status: "active", type: "lead" },
  { id: "f6", name: "NPS Follow-up", fields: 3, submissions: 542, conversionRate: 24.8, embedLocations: 1, status: "active", type: "survey" },
  { id: "f7", name: "Webinar Registration", fields: 4, submissions: 1120, conversionRate: 16.5, embedLocations: 4, status: "active", type: "registration" },
];

export interface ABTest {
  id: string;
  name: string;
  variant: string;
  page: string;
  status: "running" | "completed" | "paused";
  traffic: number;
  control: number;
  variantResult: number;
  lift: number;
  confidence: number;
  startedAt: string;
}

export const abTests: ABTest[] = [
  { id: "ab1", name: "CTA Copy — Get Started vs Start Free", variant: "Start Free", page: "/pricing", status: "running", traffic: 12400, control: 3.8, variantResult: 5.2, lift: 36.8, confidence: 94, startedAt: "2026-04-01" },
  { id: "ab2", name: "Hero Video vs Image", variant: "Video", page: "/", status: "completed", traffic: 48200, control: 2.9, variantResult: 4.1, lift: 41.4, confidence: 99, startedAt: "2026-02-15" },
  { id: "ab3", name: "Pricing Table 3-col vs 4-col", variant: "4 columns", page: "/pricing", status: "running", traffic: 8600, control: 3.9, variantResult: 3.6, lift: -7.7, confidence: 68, startedAt: "2026-04-10" },
  { id: "ab4", name: "Form Length — 5 vs 12 fields", variant: "5 fields", page: "/demo", status: "completed", traffic: 14800, control: 4.2, variantResult: 6.8, lift: 61.9, confidence: 98, startedAt: "2026-03-01" },
  { id: "ab5", name: "Testimonial Logo Strip Position", variant: "Above the fold", page: "/", status: "running", traffic: 22400, control: 3.1, variantResult: 3.7, lift: 19.4, confidence: 82, startedAt: "2026-04-08" },
];

export interface SMSCampaign {
  id: string;
  name: string;
  audience: number;
  sent: number;
  delivered: number;
  clicks: number;
  optOuts: number;
  status: "active" | "scheduled" | "completed" | "paused";
  compliance: "A2P 10DLC" | "Short Code" | "Toll-free";
  cost: number;
}

export const smsCampaigns: SMSCampaign[] = [
  { id: "sm1", name: "Flash Promo — 48hr Sale", audience: 3400, sent: 3400, delivered: 3352, clicks: 816, optOuts: 8, status: "completed", compliance: "A2P 10DLC", cost: 27.20 },
  { id: "sm2", name: "Appointment Reminder", audience: 142, sent: 142, delivered: 142, clicks: 0, optOuts: 0, status: "active", compliance: "A2P 10DLC", cost: 1.14 },
  { id: "sm3", name: "Abandoned Cart Recovery", audience: 487, sent: 487, delivered: 478, clicks: 128, optOuts: 2, status: "active", compliance: "A2P 10DLC", cost: 3.82 },
  { id: "sm4", name: "VIP Customer Check-in", audience: 82, sent: 82, delivered: 82, clicks: 34, optOuts: 0, status: "completed", compliance: "A2P 10DLC", cost: 0.66 },
  { id: "sm5", name: "Product Launch Announcement", audience: 8200, sent: 0, delivered: 0, clicks: 0, optOuts: 0, status: "scheduled", compliance: "A2P 10DLC", cost: 0 },
];

export interface SocialPost {
  id: string;
  content: string;
  channels: string[];
  status: "published" | "scheduled" | "draft";
  scheduledFor: string;
  engagement: number;
  impressions: number;
  clicks: number;
}

export const socialPosts: SocialPost[] = [
  { id: "sp1", content: "The best of HubSpot polish + GHL white-label in one platform. See the comparison →", channels: ["LinkedIn", "Twitter"], status: "published", scheduledFor: "2026-04-18 09:00", engagement: 284, impressions: 18400, clicks: 412 },
  { id: "sp2", content: "Voice AI that books meetings while you sleep. Demo this week.", channels: ["LinkedIn"], status: "published", scheduledFor: "2026-04-17 14:00", engagement: 156, impressions: 9200, clicks: 187 },
  { id: "sp3", content: "Q2 Webinar: How 200+ agencies migrated from GHL in a weekend.", channels: ["LinkedIn", "Twitter", "Facebook"], status: "scheduled", scheduledFor: "2026-04-22 10:00", engagement: 0, impressions: 0, clicks: 0 },
  { id: "sp4", content: "New: AI avatar videos personalized at scale. Each lead gets their own.", channels: ["LinkedIn", "Instagram"], status: "scheduled", scheduledFor: "2026-04-23 11:00", engagement: 0, impressions: 0, clicks: 0 },
  { id: "sp5", content: "Customer story: HealthNet cut CAC 42% by consolidating 6 tools → NWM.", channels: ["LinkedIn"], status: "draft", scheduledFor: "-", engagement: 0, impressions: 0, clicks: 0 },
];

export interface AdsCampaign {
  id: string;
  name: string;
  platform: "Google" | "Meta" | "LinkedIn" | "TikTok";
  status: "active" | "paused" | "ended";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
}

export const adsCampaigns: AdsCampaign[] = [
  { id: "ad1", name: "CRM Intent — Search", platform: "Google", status: "active", budget: 12000, spent: 8420, impressions: 184000, clicks: 4820, ctr: 2.6, cpc: 1.75, conversions: 187, roas: 4.2 },
  { id: "ad2", name: "Agency ABM", platform: "LinkedIn", status: "active", budget: 18000, spent: 11200, impressions: 82000, clicks: 1240, ctr: 1.5, cpc: 9.03, conversions: 48, roas: 5.8 },
  { id: "ad3", name: "Retargeting — Site Visitors", platform: "Meta", status: "active", budget: 6500, spent: 4820, impressions: 412000, clicks: 8420, ctr: 2.0, cpc: 0.57, conversions: 162, roas: 6.1 },
  { id: "ad4", name: "Video Factory Launch", platform: "TikTok", status: "active", budget: 4200, spent: 2680, impressions: 248000, clicks: 3400, ctr: 1.4, cpc: 0.79, conversions: 84, roas: 3.8 },
  { id: "ad5", name: "Brand Awareness Q1", platform: "Meta", status: "ended", budget: 8000, spent: 8000, impressions: 620000, clicks: 9800, ctr: 1.6, cpc: 0.82, conversions: 142, roas: 2.9 },
];

export interface LeadScore {
  contactId: string;
  contactName: string;
  score: number;
  tier: "Hot" | "Warm" | "Cold";
  lastAction: string;
  triggers: string[];
  assignedSDR: string;
}

export const leadScoring: LeadScore[] = [
  { contactId: "1", contactName: "Sarah Johnson", score: 92, tier: "Hot", lastAction: "Viewed pricing 3x", triggers: ["Enterprise domain", "Pricing visits", "Demo booked"], assignedSDR: "John Doe" },
  { contactId: "3", contactName: "Emily Davis", score: 88, tier: "Hot", lastAction: "Downloaded case study", triggers: ["Finance vertical", "Whitepaper DL", "Form fill"], assignedSDR: "Jane Smith" },
  { contactId: "6", contactName: "David Brown", score: 76, tier: "Hot", lastAction: "Replied to email", triggers: ["Email reply", "High LTV segment"], assignedSDR: "John Doe" },
  { contactId: "5", contactName: "Lisa Park", score: 68, tier: "Warm", lastAction: "Webinar signup", triggers: ["Event signup", "Agency segment"], assignedSDR: "Jane Smith" },
  { contactId: "2", contactName: "Mike Chen", score: 54, tier: "Warm", lastAction: "Proposal viewed", triggers: ["Proposal view", "Startup segment"], assignedSDR: "John Doe" },
  { contactId: "9", contactName: "Rachel Kim", score: 48, tier: "Warm", lastAction: "Email opened 2x", triggers: ["Engagement", "Education vertical"], assignedSDR: "Jane Smith" },
  { contactId: "10", contactName: "Chris Taylor", score: 32, tier: "Cold", lastAction: "Form submitted", triggers: ["Form fill"], assignedSDR: "John Doe" },
  { contactId: "8", contactName: "Tom Harris", score: 18, tier: "Cold", lastAction: "Unsubscribed", triggers: ["Unsub", "Low engagement"], assignedSDR: "John Doe" },
];

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  category: string;
  status: "published" | "draft" | "scheduled";
  views: number;
  comments: number;
  publishedAt: string;
  readTime: number;
}

export const blogPosts: BlogPost[] = [
  { id: "bp1", title: "How to migrate from HubSpot without losing data", author: "Jane Smith", category: "Migration", status: "published", views: 8420, comments: 32, publishedAt: "2026-04-12", readTime: 8 },
  { id: "bp2", title: "The best of HubSpot + GoHighLevel — why we built both in", author: "John Doe", category: "Product", status: "published", views: 12800, comments: 58, publishedAt: "2026-04-05", readTime: 6 },
  { id: "bp3", title: "Voice AI vs human SDR: cost & conversion breakdown", author: "Jane Smith", category: "AI", status: "published", views: 6200, comments: 24, publishedAt: "2026-03-28", readTime: 10 },
  { id: "bp4", title: "A2P 10DLC compliance for SMS marketing in 2026", author: "Marcus Lee", category: "Compliance", status: "published", views: 3400, comments: 12, publishedAt: "2026-03-18", readTime: 12 },
  { id: "bp5", title: "Agency white-label: pricing strategies that 3x margins", author: "Jane Smith", category: "Agency", status: "published", views: 4820, comments: 19, publishedAt: "2026-03-10", readTime: 9 },
  { id: "bp6", title: "The HubSpot price trap — what nobody tells you", author: "John Doe", category: "Comparison", status: "published", views: 15200, comments: 87, publishedAt: "2026-02-28", readTime: 7 },
  { id: "bp7", title: "Q2 product roadmap: Video Factory, Voice AI v2, and more", author: "Marcus Lee", category: "Product", status: "scheduled", views: 0, comments: 0, publishedAt: "2026-04-25", readTime: 5 },
  { id: "bp8", title: "Why we killed per-contact pricing", author: "John Doe", category: "Company", status: "draft", views: 0, comments: 0, publishedAt: "-", readTime: 4 },
];

// ============ SERVICE HUB ============

export interface Ticket {
  id: string;
  number: string;
  subject: string;
  contactName: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "waiting" | "resolved" | "closed";
  assignedTo: string;
  createdAt: string;
  slaStatus: "on-track" | "at-risk" | "breached";
  category: string;
}

export const tickets: Ticket[] = [
  { id: "t1", number: "T-2026-0842", subject: "Email sync not pulling from Gmail", contactName: "Sarah Johnson", priority: "high", status: "in-progress", assignedTo: "Alex Chen", createdAt: "2026-04-18 09:22", slaStatus: "on-track", category: "Integrations" },
  { id: "t2", number: "T-2026-0843", subject: "Cannot invite team member — permission error", contactName: "Mike Chen", priority: "medium", status: "open", assignedTo: "-", createdAt: "2026-04-19 14:05", slaStatus: "on-track", category: "Account" },
  { id: "t3", number: "T-2026-0841", subject: "Billing invoice doesn't match quote", contactName: "Emily Davis", priority: "urgent", status: "in-progress", assignedTo: "Priya Patel", createdAt: "2026-04-17 11:42", slaStatus: "at-risk", category: "Billing" },
  { id: "t4", number: "T-2026-0840", subject: "SMS sending fails with 401 error", contactName: "David Brown", priority: "high", status: "resolved", assignedTo: "Alex Chen", createdAt: "2026-04-16 08:12", slaStatus: "on-track", category: "SMS" },
  { id: "t5", number: "T-2026-0839", subject: "Feature request: Zapier webhook delay", contactName: "Lisa Park", priority: "low", status: "waiting", assignedTo: "Marcus Lee", createdAt: "2026-04-15 15:30", slaStatus: "on-track", category: "Feature Request" },
  { id: "t6", number: "T-2026-0838", subject: "Export CSV encoding garbled", contactName: "Anna Martinez", priority: "medium", status: "resolved", assignedTo: "Alex Chen", createdAt: "2026-04-14 10:08", slaStatus: "on-track", category: "Data" },
  { id: "t7", number: "T-2026-0837", subject: "Calendar timezone showing UTC", contactName: "Rachel Kim", priority: "medium", status: "in-progress", assignedTo: "Priya Patel", createdAt: "2026-04-13 16:45", slaStatus: "on-track", category: "Calendar" },
  { id: "t8", number: "T-2026-0836", subject: "Phone number not provisioned after A2P approval", contactName: "Chris Taylor", priority: "urgent", status: "open", assignedTo: "-", createdAt: "2026-04-19 08:00", slaStatus: "breached", category: "Telephony" },
];

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  views: number;
  helpful: number;
  notHelpful: number;
  updatedAt: string;
  status: "published" | "draft" | "archived";
}

export const knowledgeBase: KnowledgeArticle[] = [
  { id: "kb1", title: "How to migrate contacts from HubSpot to NWM", category: "Migration", author: "Jane Smith", views: 4820, helpful: 428, notHelpful: 12, updatedAt: "2026-04-01", status: "published" },
  { id: "kb2", title: "Setting up A2P 10DLC for SMS campaigns", category: "SMS", author: "Marcus Lee", views: 3200, helpful: 287, notHelpful: 18, updatedAt: "2026-03-15", status: "published" },
  { id: "kb3", title: "Creating your first automation workflow", category: "Automations", author: "Jane Smith", views: 6420, helpful: 612, notHelpful: 24, updatedAt: "2026-02-20", status: "published" },
  { id: "kb4", title: "Configuring Google Calendar two-way sync", category: "Integrations", author: "Alex Chen", views: 2840, helpful: 248, notHelpful: 22, updatedAt: "2026-03-28", status: "published" },
  { id: "kb5", title: "White-label setup for agency sub-accounts", category: "Agency", author: "Jane Smith", views: 1820, helpful: 184, notHelpful: 6, updatedAt: "2026-04-10", status: "published" },
  { id: "kb6", title: "Using the Voice AI with Twilio provisioned numbers", category: "Voice AI", author: "Marcus Lee", views: 980, helpful: 92, notHelpful: 14, updatedAt: "2026-04-08", status: "published" },
  { id: "kb7", title: "Pipeline stage automation rules reference", category: "Pipeline", author: "John Doe", views: 2120, helpful: 195, notHelpful: 18, updatedAt: "2026-03-05", status: "published" },
  { id: "kb8", title: "GDPR & CCPA data export / delete requests", category: "Compliance", author: "Priya Patel", views: 840, helpful: 84, notHelpful: 4, updatedAt: "2026-02-12", status: "published" },
  { id: "kb9", title: "Connecting Stripe for quote → invoice flow", category: "Billing", author: "Priya Patel", views: 1680, helpful: 162, notHelpful: 12, updatedAt: "2026-03-22", status: "published" },
  { id: "kb10", title: "Troubleshooting email deliverability (SPF / DKIM / DMARC)", category: "Email", author: "Alex Chen", views: 3640, helpful: 342, notHelpful: 28, updatedAt: "2026-04-05", status: "published" },
];

export interface Survey {
  id: string;
  name: string;
  type: "NPS" | "CSAT" | "CES" | "Custom";
  responses: number;
  avgScore: number;
  sent: number;
  status: "active" | "paused" | "completed";
  createdAt: string;
}

export const surveys: Survey[] = [
  { id: "sv1", name: "Post-Purchase NPS", type: "NPS", responses: 842, avgScore: 62, sent: 2400, status: "active", createdAt: "2025-12-01" },
  { id: "sv2", name: "Support Ticket CSAT", type: "CSAT", responses: 1240, avgScore: 4.6, sent: 1480, status: "active", createdAt: "2025-10-15" },
  { id: "sv3", name: "Onboarding Effort (CES)", type: "CES", responses: 287, avgScore: 2.3, sent: 412, status: "active", createdAt: "2026-01-20" },
  { id: "sv4", name: "Quarterly Customer Pulse", type: "Custom", responses: 420, avgScore: 4.2, sent: 980, status: "active", createdAt: "2026-04-01" },
  { id: "sv5", name: "Cancellation Reason", type: "Custom", responses: 48, avgScore: 0, sent: 62, status: "active", createdAt: "2025-11-10" },
];

export interface SLA {
  id: string;
  name: string;
  priority: "low" | "medium" | "high" | "urgent";
  firstResponse: string;
  resolution: string;
  compliance: number;
  ticketsCovered: number;
  active: boolean;
}

export const slas: SLA[] = [
  { id: "sla1", name: "Enterprise — Urgent", priority: "urgent", firstResponse: "15 min", resolution: "4 hours", compliance: 94, ticketsCovered: 42, active: true },
  { id: "sla2", name: "Enterprise — High", priority: "high", firstResponse: "1 hour", resolution: "8 hours", compliance: 92, ticketsCovered: 128, active: true },
  { id: "sla3", name: "Standard — High", priority: "high", firstResponse: "2 hours", resolution: "1 business day", compliance: 88, ticketsCovered: 412, active: true },
  { id: "sla4", name: "Standard — Medium", priority: "medium", firstResponse: "4 hours", resolution: "2 business days", compliance: 91, ticketsCovered: 846, active: true },
  { id: "sla5", name: "Standard — Low", priority: "low", firstResponse: "1 business day", resolution: "5 business days", compliance: 96, ticketsCovered: 284, active: true },
];

export interface CallLog {
  id: string;
  contactName: string;
  direction: "inbound" | "outbound";
  duration: string;
  outcome: "connected" | "voicemail" | "no-answer" | "busy";
  recorded: boolean;
  agent: string;
  timestamp: string;
  aiSummary?: string;
}

export const callsLog: CallLog[] = [
  { id: "cl1", contactName: "Sarah Johnson", direction: "outbound", duration: "14:32", outcome: "connected", recorded: true, agent: "John Doe", timestamp: "2026-04-19 10:14", aiSummary: "Reviewed enterprise pricing. Client wants 3-year deal. Next step: revised quote." },
  { id: "cl2", contactName: "David Brown", direction: "inbound", duration: "08:21", outcome: "connected", recorded: true, agent: "Jane Smith", timestamp: "2026-04-19 14:28", aiSummary: "Technical deep-dive on API limits. Client confident to proceed. Follow-up demo scheduled." },
  { id: "cl3", contactName: "Emily Davis", direction: "outbound", duration: "00:00", outcome: "voicemail", recorded: false, agent: "Jane Smith", timestamp: "2026-04-19 09:45" },
  { id: "cl4", contactName: "Mike Chen", direction: "outbound", duration: "03:12", outcome: "connected", recorded: true, agent: "John Doe", timestamp: "2026-04-18 15:20", aiSummary: "Quick check-in. Mike prefers Thursday call. Rescheduled." },
  { id: "cl5", contactName: "Anna Martinez", direction: "inbound", duration: "22:04", outcome: "connected", recorded: true, agent: "Priya Patel", timestamp: "2026-04-18 11:08", aiSummary: "Renewal discussion. HealthNet signed 2-year. Pushing internal champion." },
  { id: "cl6", contactName: "Chris Taylor", direction: "outbound", duration: "00:00", outcome: "no-answer", recorded: false, agent: "John Doe", timestamp: "2026-04-17 16:00" },
  { id: "cl7", contactName: "Lisa Park", direction: "outbound", duration: "11:45", outcome: "connected", recorded: true, agent: "Jane Smith", timestamp: "2026-04-17 10:30", aiSummary: "Agency partnership discussion. Interested in white-label. Next: sub-account demo." },
];

// ============ CMS & SITES ============

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  type: "landing" | "blog" | "home" | "legal" | "custom";
  status: "published" | "draft" | "scheduled";
  visits: number;
  lastEdited: string;
  author: string;
}

export const cmsPages: CMSPage[] = [
  { id: "cp1", title: "Homepage", slug: "/", type: "home", status: "published", visits: 184000, lastEdited: "2026-04-10", author: "Jane Smith" },
  { id: "cp2", title: "Pricing", slug: "/pricing", type: "landing", status: "published", visits: 48200, lastEdited: "2026-04-15", author: "John Doe" },
  { id: "cp3", title: "About Us", slug: "/about", type: "landing", status: "published", visits: 12400, lastEdited: "2026-03-22", author: "Jane Smith" },
  { id: "cp4", title: "Privacy Policy", slug: "/privacy", type: "legal", status: "published", visits: 3200, lastEdited: "2026-01-15", author: "Priya Patel" },
  { id: "cp5", title: "Terms of Service", slug: "/terms", type: "legal", status: "published", visits: 2800, lastEdited: "2026-01-15", author: "Priya Patel" },
  { id: "cp6", title: "HubSpot Comparison", slug: "/vs-hubspot", type: "landing", status: "published", visits: 18400, lastEdited: "2026-04-19", author: "John Doe" },
  { id: "cp7", title: "GoHighLevel Comparison", slug: "/vs-gohighlevel", type: "landing", status: "published", visits: 9200, lastEdited: "2026-04-19", author: "John Doe" },
  { id: "cp8", title: "Master Compare Hub", slug: "/compare", type: "landing", status: "published", visits: 6800, lastEdited: "2026-04-19", author: "John Doe" },
];

export interface Membership {
  id: string;
  name: string;
  tier: string;
  members: number;
  revenue: number;
  status: "active" | "paused" | "draft";
  benefits: number;
  renewalRate: number;
}

export const memberships: Membership[] = [
  { id: "m1", name: "NWM Insiders", tier: "Free", members: 4820, revenue: 0, status: "active", benefits: 5, renewalRate: 0 },
  { id: "m2", name: "NWM Pro Community", tier: "$29/mo", members: 1240, revenue: 35960, status: "active", benefits: 12, renewalRate: 88 },
  { id: "m3", name: "Agency Inner Circle", tier: "$199/mo", members: 187, revenue: 37213, status: "active", benefits: 24, renewalRate: 94 },
  { id: "m4", name: "Founder's Mastermind", tier: "$999/mo", members: 42, revenue: 41958, status: "active", benefits: 8, renewalRate: 97 },
];

export interface Course {
  id: string;
  title: string;
  instructor: string;
  modules: number;
  enrolled: number;
  completion: number;
  rating: number;
  status: "published" | "draft";
  price: number;
}

export const courses: Course[] = [
  { id: "cr1", title: "NWM Certification — Admin", instructor: "Jane Smith", modules: 12, enrolled: 842, completion: 62, rating: 4.8, status: "published", price: 0 },
  { id: "cr2", title: "NWM Certification — Power User", instructor: "John Doe", modules: 18, enrolled: 487, completion: 48, rating: 4.7, status: "published", price: 0 },
  { id: "cr3", title: "Agency Playbook — Sub-accounts & White-label", instructor: "Jane Smith", modules: 10, enrolled: 284, completion: 72, rating: 4.9, status: "published", price: 299 },
  { id: "cr4", title: "AI Automation Masterclass", instructor: "Marcus Lee", modules: 14, enrolled: 612, completion: 54, rating: 4.6, status: "published", price: 499 },
  { id: "cr5", title: "SMS & A2P Compliance Deep-Dive", instructor: "Marcus Lee", modules: 6, enrolled: 142, completion: 68, rating: 4.5, status: "published", price: 149 },
  { id: "cr6", title: "Migration Bootcamp — HubSpot → NWM", instructor: "Jane Smith", modules: 8, enrolled: 187, completion: 82, rating: 4.9, status: "published", price: 0 },
];

// ============ AI AGENTS ============

export interface AIAgent {
  id: string;
  name: string;
  type: "Copilot" | "SDR" | "Voice" | "Video" | "Content" | "Support";
  status: "active" | "training" | "paused";
  model: string;
  tasksCompleted: number;
  accuracy: number;
  costMonth: number;
  lastActive: string;
}

export const aiAgents: AIAgent[] = [
  { id: "ai1", name: "NWM Copilot", type: "Copilot", status: "active", model: "Claude Sonnet 4.6", tasksCompleted: 48200, accuracy: 94, costMonth: 1240, lastActive: "2 min ago" },
  { id: "ai2", name: "Outbound SDR — Enterprise", type: "SDR", status: "active", model: "GPT-4 Turbo", tasksCompleted: 8420, accuracy: 88, costMonth: 820, lastActive: "12 min ago" },
  { id: "ai3", name: "Outbound SDR — SMB", type: "SDR", status: "active", model: "GPT-4o", tasksCompleted: 14200, accuracy: 82, costMonth: 480, lastActive: "5 min ago" },
  { id: "ai4", name: "Voice Agent — Inbound", type: "Voice", status: "active", model: "Claude + ElevenLabs", tasksCompleted: 2840, accuracy: 91, costMonth: 1620, lastActive: "Now" },
  { id: "ai5", name: "Voice Agent — Appointment Setter", type: "Voice", status: "active", model: "Claude + ElevenLabs", tasksCompleted: 1240, accuracy: 87, costMonth: 720, lastActive: "18 min ago" },
  { id: "ai6", name: "Video Factory — Avatar Gen", type: "Video", status: "active", model: "HeyGen API + Claude", tasksCompleted: 4820, accuracy: 96, costMonth: 2140, lastActive: "34 min ago" },
  { id: "ai7", name: "Content AI — Blog Writer", type: "Content", status: "active", model: "Claude Sonnet 4.6", tasksCompleted: 820, accuracy: 92, costMonth: 320, lastActive: "1 hour ago" },
  { id: "ai8", name: "Support Triage", type: "Support", status: "active", model: "Claude Haiku", tasksCompleted: 6240, accuracy: 89, costMonth: 240, lastActive: "8 min ago" },
];

// ============ OPERATIONS ============

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: "connected" | "available" | "error";
  syncs: number;
  lastSync: string;
  logo: string;
}

export const integrations: Integration[] = [
  { id: "in1", name: "Gmail", category: "Email", status: "connected", syncs: 48200, lastSync: "2 min ago", logo: "G" },
  { id: "in2", name: "Google Calendar", category: "Calendar", status: "connected", syncs: 12400, lastSync: "5 min ago", logo: "C" },
  { id: "in3", name: "Outlook 365", category: "Email", status: "connected", syncs: 8200, lastSync: "3 min ago", logo: "O" },
  { id: "in4", name: "Slack", category: "Messaging", status: "connected", syncs: 2840, lastSync: "1 min ago", logo: "S" },
  { id: "in5", name: "Stripe", category: "Payments", status: "connected", syncs: 1840, lastSync: "8 min ago", logo: "S" },
  { id: "in6", name: "Twilio", category: "SMS / Voice", status: "connected", syncs: 6420, lastSync: "Now", logo: "T" },
  { id: "in7", name: "Zapier", category: "Automation", status: "connected", syncs: 12800, lastSync: "12 min ago", logo: "Z" },
  { id: "in8", name: "Shopify", category: "Commerce", status: "available", syncs: 0, lastSync: "-", logo: "S" },
  { id: "in9", name: "HubSpot (import)", category: "Migration", status: "available", syncs: 0, lastSync: "-", logo: "H" },
  { id: "in10", name: "GoHighLevel (import)", category: "Migration", status: "available", syncs: 0, lastSync: "-", logo: "G" },
  { id: "in11", name: "Salesforce (import)", category: "Migration", status: "available", syncs: 0, lastSync: "-", logo: "S" },
  { id: "in12", name: "QuickBooks", category: "Finance", status: "available", syncs: 0, lastSync: "-", logo: "Q" },
];

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: "active" | "disabled" | "error";
  deliveries: number;
  successRate: number;
  lastDelivery: string;
}

export const webhooks: WebhookEndpoint[] = [
  { id: "wh1", name: "Lead Capture → Slack", url: "https://hooks.slack.com/services/...", events: ["contact.created", "form.submitted"], status: "active", deliveries: 12400, successRate: 99.2, lastDelivery: "3 min ago" },
  { id: "wh2", name: "Deal Won → Revenue DB", url: "https://api.company.com/revenue", events: ["deal.won"], status: "active", deliveries: 1840, successRate: 100, lastDelivery: "2 hours ago" },
  { id: "wh3", name: "Ticket → PagerDuty", url: "https://events.pagerduty.com/...", events: ["ticket.urgent"], status: "active", deliveries: 42, successRate: 100, lastDelivery: "Yesterday" },
  { id: "wh4", name: "Signup → Analytics", url: "https://analytics.example.com/", events: ["user.signup"], status: "error", deliveries: 820, successRate: 84.2, lastDelivery: "Error: timeout" },
  { id: "wh5", name: "Payment → Ledger", url: "https://ledger.internal/", events: ["payment.received", "refund.issued"], status: "active", deliveries: 2400, successRate: 99.8, lastDelivery: "12 min ago" },
];

export interface APIKey {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  lastUsed: string;
  createdAt: string;
  status: "active" | "revoked";
  createdBy: string;
}

export const apiKeys: APIKey[] = [
  { id: "k1", label: "Production Backend", prefix: "nwm_live_a8c2...", scopes: ["contacts:rw", "deals:rw", "automations:read"], lastUsed: "Just now", createdAt: "2025-11-10", status: "active", createdBy: "John Doe" },
  { id: "k2", label: "Zapier Integration", prefix: "nwm_live_7f91...", scopes: ["contacts:rw", "forms:read"], lastUsed: "12 min ago", createdAt: "2026-01-20", status: "active", createdBy: "Jane Smith" },
  { id: "k3", label: "Mobile App", prefix: "nwm_live_b3e5...", scopes: ["contacts:read", "calendar:rw"], lastUsed: "2 hours ago", createdAt: "2026-02-15", status: "active", createdBy: "Jane Smith" },
  { id: "k4", label: "Old Partner Key (deprecated)", prefix: "nwm_test_1c9d...", scopes: ["contacts:read"], lastUsed: "6 months ago", createdAt: "2025-04-01", status: "revoked", createdBy: "John Doe" },
  { id: "k5", label: "Reporting Dashboard", prefix: "nwm_live_4a7b...", scopes: ["reports:read", "analytics:read"], lastUsed: "1 hour ago", createdAt: "2026-03-10", status: "active", createdBy: "Marcus Lee" },
];

export interface CustomCodeScript {
  id: string;
  name: string;
  language: "JavaScript" | "TypeScript" | "Python";
  trigger: string;
  runs: number;
  lastRun: string;
  status: "active" | "disabled" | "error";
  author: string;
}

export const customCode: CustomCodeScript[] = [
  { id: "cc1", name: "Enrich Contact from Clearbit", language: "JavaScript", trigger: "contact.created", runs: 4820, lastRun: "5 min ago", status: "active", author: "Marcus Lee" },
  { id: "cc2", name: "Lead Routing — Round Robin", language: "JavaScript", trigger: "lead.qualified", runs: 1240, lastRun: "12 min ago", status: "active", author: "John Doe" },
  { id: "cc3", name: "Dedupe on Email Domain", language: "TypeScript", trigger: "scheduled:daily", runs: 180, lastRun: "3 hours ago", status: "active", author: "Marcus Lee" },
  { id: "cc4", name: "AI Score Recalculation", language: "Python", trigger: "scheduled:hourly", runs: 4320, lastRun: "15 min ago", status: "active", author: "Marcus Lee" },
  { id: "cc5", name: "Custom Webhook Transformer", language: "JavaScript", trigger: "webhook.received", runs: 820, lastRun: "Error: 2 hours ago", status: "error", author: "John Doe" },
];

// ============ AGENCY / PARTNER ============

export interface SubAccount {
  id: string;
  name: string;
  plan: string;
  users: number;
  mrr: number;
  status: "active" | "trialing" | "past-due" | "cancelled";
  whiteLabel: boolean;
  createdAt: string;
}

export const subAccounts: SubAccount[] = [
  { id: "sa1", name: "Rivera Growth Agency", plan: "Agency", users: 12, mrr: 4990, status: "active", whiteLabel: true, createdAt: "2025-08-15" },
  { id: "sa2", name: "BlueSky Marketing Co.", plan: "Agency", users: 8, mrr: 3490, status: "active", whiteLabel: true, createdAt: "2025-09-22" },
  { id: "sa3", name: "Pinnacle SEO Partners", plan: "Growth", users: 5, mrr: 1990, status: "active", whiteLabel: false, createdAt: "2025-10-10" },
  { id: "sa4", name: "Oakwood Digital", plan: "Agency", users: 15, mrr: 5990, status: "active", whiteLabel: true, createdAt: "2025-11-18" },
  { id: "sa5", name: "New Horizon Consulting", plan: "Growth", users: 3, mrr: 990, status: "trialing", whiteLabel: false, createdAt: "2026-04-10" },
  { id: "sa6", name: "Redwood Marketing", plan: "Agency", users: 9, mrr: 4290, status: "past-due", whiteLabel: true, createdAt: "2025-12-05" },
  { id: "sa7", name: "Summit Strategies", plan: "Growth", users: 6, mrr: 2490, status: "active", whiteLabel: false, createdAt: "2026-01-22" },
  { id: "sa8", name: "Horizon Digital Agency", plan: "Agency", users: 18, mrr: 7490, status: "active", whiteLabel: true, createdAt: "2025-06-30" },
];

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  referrals: number;
  conversions: number;
  earnings: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  pending: number;
  joinedAt: string;
}

export const affiliates: Affiliate[] = [
  { id: "af1", name: "Martín Gutiérrez", email: "martin@creatortips.com", referrals: 142, conversions: 38, earnings: 18400, tier: "Platinum", pending: 2400, joinedAt: "2025-04-10" },
  { id: "af2", name: "Ashley Chen", email: "ashley@growthlab.co", referrals: 98, conversions: 24, earnings: 11200, tier: "Gold", pending: 1800, joinedAt: "2025-06-15" },
  { id: "af3", name: "Renata Silva", email: "renata@digitalsmb.com.br", referrals: 76, conversions: 18, earnings: 8400, tier: "Gold", pending: 1200, joinedAt: "2025-07-22" },
  { id: "af4", name: "James O'Brien", email: "james@saasreview.io", referrals: 54, conversions: 12, earnings: 5600, tier: "Silver", pending: 900, joinedAt: "2025-09-08" },
  { id: "af5", name: "Priyanka Shah", email: "priyanka@crmcompare.net", referrals: 38, conversions: 8, earnings: 3800, tier: "Silver", pending: 600, joinedAt: "2025-11-12" },
  { id: "af6", name: "Diego Hernández", email: "diego@latamconsult.mx", referrals: 22, conversions: 5, earnings: 2200, tier: "Bronze", pending: 400, joinedAt: "2026-01-18" },
  { id: "af7", name: "Sophie Laurent", email: "sophie@eucrmblog.com", referrals: 18, conversions: 4, earnings: 1800, tier: "Bronze", pending: 300, joinedAt: "2026-02-22" },
];

export interface ReputationReview {
  id: string;
  customer: string;
  platform: "Google" | "G2" | "Capterra" | "Trustpilot" | "Facebook";
  rating: number;
  excerpt: string;
  status: "published" | "flagged" | "responded";
  date: string;
}

export const reputationReviews: ReputationReview[] = [
  { id: "rv1", customer: "Sarah Johnson", platform: "G2", rating: 5, excerpt: "Consolidated 6 tools into NWM. Saved $4K/mo and our team actually uses it.", status: "responded", date: "2026-04-12" },
  { id: "rv2", customer: "Mike Chen", platform: "Capterra", rating: 5, excerpt: "Migration from HubSpot took 2 days. Zero data loss. Voice AI is wild.", status: "published", date: "2026-04-08" },
  { id: "rv3", customer: "David Brown", platform: "Google", rating: 5, excerpt: "Best-in-class support. White-label works exactly as advertised.", status: "responded", date: "2026-04-02" },
  { id: "rv4", customer: "Anna Martinez", platform: "G2", rating: 4, excerpt: "Missing a few advanced reports but roadmap looks solid. Great value overall.", status: "published", date: "2026-03-28" },
  { id: "rv5", customer: "Lisa Park", platform: "Trustpilot", rating: 5, excerpt: "Agency mode is chef's kiss. 3x our margins per client.", status: "responded", date: "2026-03-20" },
  { id: "rv6", customer: "Tom Harris", platform: "Google", rating: 2, excerpt: "Pricing was unclear on signup. Had to cancel.", status: "flagged", date: "2026-03-15" },
  { id: "rv7", customer: "Rachel Kim", platform: "Capterra", rating: 5, excerpt: "The AI SDR pays for itself in week 1. Insane ROI.", status: "published", date: "2026-03-10" },
];

// ============ ANALYTICS & REPORTS ============

export interface Report {
  id: string;
  name: string;
  category: "Sales" | "Marketing" | "Service" | "Finance" | "Executive";
  lastRun: string;
  schedule: string;
  recipients: number;
  format: "Dashboard" | "Email" | "CSV" | "PDF";
}

export const reports: Report[] = [
  { id: "r1", name: "Weekly Pipeline Review", category: "Sales", lastRun: "2026-04-19", schedule: "Every Monday", recipients: 8, format: "Email" },
  { id: "r2", name: "Marketing Attribution (30d)", category: "Marketing", lastRun: "2026-04-18", schedule: "Daily", recipients: 4, format: "Dashboard" },
  { id: "r3", name: "Service CSAT & SLA", category: "Service", lastRun: "2026-04-19", schedule: "Daily", recipients: 6, format: "Email" },
  { id: "r4", name: "MRR / ARR Snapshot", category: "Finance", lastRun: "2026-04-19", schedule: "Daily", recipients: 3, format: "Dashboard" },
  { id: "r5", name: "Monthly Board Report", category: "Executive", lastRun: "2026-04-01", schedule: "Monthly", recipients: 12, format: "PDF" },
  { id: "r6", name: "Rep Performance — Quota Attainment", category: "Sales", lastRun: "2026-04-19", schedule: "Weekly", recipients: 5, format: "Email" },
  { id: "r7", name: "Campaign ROI by Channel", category: "Marketing", lastRun: "2026-04-19", schedule: "Weekly", recipients: 4, format: "CSV" },
  { id: "r8", name: "Churn Cohort Analysis", category: "Finance", lastRun: "2026-04-15", schedule: "Monthly", recipients: 4, format: "Dashboard" },
  { id: "r9", name: "Agency Sub-account MRR", category: "Finance", lastRun: "2026-04-19", schedule: "Daily", recipients: 2, format: "Dashboard" },
  { id: "r10", name: "AI Agent Cost & Accuracy", category: "Executive", lastRun: "2026-04-19", schedule: "Daily", recipients: 5, format: "Dashboard" },
];

// ============ CUSTOMER PORTAL ============

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  company: string;
  lastLogin: string;
  ticketsOpen: number;
  invoicesPending: number;
  mrr: number;
}

export const customerPortalUsers: PortalUser[] = [
  { id: "pu1", name: "Sarah Johnson", email: "sarah@acmecorp.com", company: "Acme Corp", lastLogin: "2 hours ago", ticketsOpen: 1, invoicesPending: 0, mrr: 1299 },
  { id: "pu2", name: "Mike Chen", email: "mike@techstart.io", company: "TechStart", lastLogin: "Yesterday", ticketsOpen: 1, invoicesPending: 1, mrr: 199 },
  { id: "pu3", name: "Emily Davis", email: "emily@globalfin.com", company: "GlobalFin", lastLogin: "3 hours ago", ticketsOpen: 1, invoicesPending: 0, mrr: 1299 },
  { id: "pu4", name: "James Wilson", email: "james@retailhub.com", company: "RetailHub", lastLogin: "5 days ago", ticketsOpen: 0, invoicesPending: 0, mrr: 199 },
  { id: "pu5", name: "Anna Martinez", email: "anna@healthnet.org", company: "HealthNet", lastLogin: "1 hour ago", ticketsOpen: 0, invoicesPending: 0, mrr: 1299 },
  { id: "pu6", name: "Rachel Kim", email: "rachel@edulearn.com", company: "EduLearn", lastLogin: "Yesterday", ticketsOpen: 0, invoicesPending: 1, mrr: 199 },
];

// ============ COMMUNITY ============

export interface CommunityPost {
  id: string;
  author: string;
  title: string;
  category: "Q&A" | "Announcement" | "Feature Request" | "Tips & Tricks" | "Show & Tell";
  replies: number;
  views: number;
  likes: number;
  pinned: boolean;
  createdAt: string;
}

export const communityPosts: CommunityPost[] = [
  { id: "cm1", author: "NWM Team", title: "🎉 Voice AI v2 is live — here's what's new", category: "Announcement", replies: 48, views: 2840, likes: 284, pinned: true, createdAt: "2026-04-18" },
  { id: "cm2", author: "Sarah Johnson", title: "Best automation for re-engagement after 60 days?", category: "Q&A", replies: 12, views: 412, likes: 18, pinned: false, createdAt: "2026-04-17" },
  { id: "cm3", author: "Martín Gutiérrez", title: "Agency pricing strategy — what's working in 2026?", category: "Tips & Tricks", replies: 34, views: 1240, likes: 87, pinned: false, createdAt: "2026-04-16" },
  { id: "cm4", author: "Ashley Chen", title: "Would love native QuickBooks sync (not just Stripe)", category: "Feature Request", replies: 22, views: 620, likes: 48, pinned: false, createdAt: "2026-04-15" },
  { id: "cm5", author: "David Brown", title: "Show: Our custom onboarding flow in NWM", category: "Show & Tell", replies: 18, views: 482, likes: 42, pinned: false, createdAt: "2026-04-14" },
  { id: "cm6", author: "NWM Team", title: "Q2 Roadmap AMA — Thursday 2pm ET", category: "Announcement", replies: 87, views: 3240, likes: 342, pinned: true, createdAt: "2026-04-12" },
];
