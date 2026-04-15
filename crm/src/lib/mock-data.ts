// Mock data for the CRM

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "lead" | "prospect" | "customer" | "churned";
  source: string;
  value: number;
  lastActivity: string;
  avatar?: string;
  tags: string[];
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string;
  assignedTo: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactEmail: string;
  channel: "email" | "sms" | "chat" | "whatsapp";
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messages: { sender: "contact" | "agent"; text: string; time: string }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  contactName: string;
  date: string;
  time: string;
  duration: number;
  type: "call" | "meeting" | "demo" | "follow-up";
  status: "scheduled" | "completed" | "cancelled";
}

export const contacts: Contact[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@acmecorp.com", phone: "+1 (555) 123-4567", company: "Acme Corp", status: "customer", source: "Website", value: 12500, lastActivity: "2 hours ago", tags: ["VIP", "Enterprise"], createdAt: "2025-11-15" },
  { id: "2", name: "Mike Chen", email: "mike@techstart.io", phone: "+1 (555) 234-5678", company: "TechStart", status: "prospect", source: "LinkedIn", value: 8200, lastActivity: "5 hours ago", tags: ["Startup"], createdAt: "2025-12-01" },
  { id: "3", name: "Emily Davis", email: "emily@globalfin.com", phone: "+1 (555) 345-6789", company: "GlobalFin", status: "lead", source: "Referral", value: 25000, lastActivity: "1 day ago", tags: ["Finance", "Enterprise"], createdAt: "2026-01-10" },
  { id: "4", name: "James Wilson", email: "james@retailhub.com", phone: "+1 (555) 456-7890", company: "RetailHub", status: "customer", source: "Google Ads", value: 5800, lastActivity: "3 days ago", tags: ["Retail"], createdAt: "2025-10-20" },
  { id: "5", name: "Lisa Park", email: "lisa@mediapro.co", phone: "+1 (555) 567-8901", company: "MediaPro", status: "prospect", source: "Website", value: 15000, lastActivity: "6 hours ago", tags: ["Media", "VIP"], createdAt: "2026-02-05" },
  { id: "6", name: "David Brown", email: "david@constructx.com", phone: "+1 (555) 678-9012", company: "ConstructX", status: "lead", source: "Cold Outreach", value: 32000, lastActivity: "4 hours ago", tags: ["Construction"], createdAt: "2026-03-01" },
  { id: "7", name: "Anna Martinez", email: "anna@healthnet.org", phone: "+1 (555) 789-0123", company: "HealthNet", status: "customer", source: "Referral", value: 18500, lastActivity: "1 hour ago", tags: ["Healthcare", "Enterprise"], createdAt: "2025-09-15" },
  { id: "8", name: "Tom Harris", email: "tom@autofix.com", phone: "+1 (555) 890-1234", company: "AutoFix", status: "churned", source: "Google Ads", value: 4200, lastActivity: "2 weeks ago", tags: ["Automotive"], createdAt: "2025-08-10" },
  { id: "9", name: "Rachel Kim", email: "rachel@edulearn.com", phone: "+1 (555) 901-2345", company: "EduLearn", status: "prospect", source: "LinkedIn", value: 9800, lastActivity: "12 hours ago", tags: ["Education"], createdAt: "2026-01-20" },
  { id: "10", name: "Chris Taylor", email: "chris@foodchain.co", phone: "+1 (555) 012-3456", company: "FoodChain", status: "lead", source: "Website", value: 7500, lastActivity: "2 days ago", tags: ["F&B"], createdAt: "2026-03-15" },
];

export const pipelineStages = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

export const deals: Deal[] = [
  { id: "d1", title: "Acme Corp - Enterprise Plan", contactId: "1", contactName: "Sarah Johnson", value: 12500, stage: "Negotiation", probability: 80, expectedClose: "2026-04-30", assignedTo: "John Doe", createdAt: "2026-02-10" },
  { id: "d2", title: "TechStart - Starter Package", contactId: "2", contactName: "Mike Chen", value: 8200, stage: "Proposal Sent", probability: 60, expectedClose: "2026-05-15", assignedTo: "John Doe", createdAt: "2026-03-01" },
  { id: "d3", title: "GlobalFin - Custom Solution", contactId: "3", contactName: "Emily Davis", value: 25000, stage: "Qualified", probability: 40, expectedClose: "2026-06-01", assignedTo: "Jane Smith", createdAt: "2026-03-10" },
  { id: "d4", title: "RetailHub - Growth Plan", contactId: "4", contactName: "James Wilson", value: 5800, stage: "Closed Won", probability: 100, expectedClose: "2026-03-20", assignedTo: "John Doe", createdAt: "2026-01-15" },
  { id: "d5", title: "MediaPro - Agency Bundle", contactId: "5", contactName: "Lisa Park", value: 15000, stage: "Contacted", probability: 30, expectedClose: "2026-07-01", assignedTo: "Jane Smith", createdAt: "2026-03-15" },
  { id: "d6", title: "ConstructX - Full Suite", contactId: "6", contactName: "David Brown", value: 32000, stage: "New Lead", probability: 15, expectedClose: "2026-08-01", assignedTo: "John Doe", createdAt: "2026-04-01" },
  { id: "d7", title: "HealthNet - Renewal", contactId: "7", contactName: "Anna Martinez", value: 18500, stage: "Proposal Sent", probability: 70, expectedClose: "2026-05-01", assignedTo: "Jane Smith", createdAt: "2026-02-20" },
  { id: "d8", title: "AutoFix - Basic Plan", contactId: "8", contactName: "Tom Harris", value: 4200, stage: "Closed Lost", probability: 0, expectedClose: "2026-03-01", assignedTo: "John Doe", createdAt: "2025-12-10" },
  { id: "d9", title: "EduLearn - Education License", contactId: "9", contactName: "Rachel Kim", value: 9800, stage: "Qualified", probability: 50, expectedClose: "2026-06-15", assignedTo: "Jane Smith", createdAt: "2026-03-05" },
  { id: "d10", title: "FoodChain - Starter", contactId: "10", contactName: "Chris Taylor", value: 7500, stage: "New Lead", probability: 10, expectedClose: "2026-09-01", assignedTo: "John Doe", createdAt: "2026-04-10" },
];

export const conversations: Conversation[] = [
  {
    id: "c1", contactName: "Sarah Johnson", contactEmail: "sarah@acmecorp.com", channel: "email", lastMessage: "Thanks for the proposal, we'll review it this week.", timestamp: "10:30 AM", unread: true,
    messages: [
      { sender: "agent", text: "Hi Sarah, I've attached the updated proposal with the enterprise pricing we discussed.", time: "9:15 AM" },
      { sender: "contact", text: "Thanks for the proposal, we'll review it this week.", time: "10:30 AM" },
    ],
  },
  {
    id: "c2", contactName: "Mike Chen", contactEmail: "mike@techstart.io", channel: "sms", lastMessage: "Can we reschedule our call to Thursday?", timestamp: "9:45 AM", unread: true,
    messages: [
      { sender: "agent", text: "Hi Mike, just confirming our call tomorrow at 2pm.", time: "Yesterday" },
      { sender: "contact", text: "Can we reschedule our call to Thursday?", time: "9:45 AM" },
    ],
  },
  {
    id: "c3", contactName: "Emily Davis", contactEmail: "emily@globalfin.com", channel: "email", lastMessage: "We need a compliance-ready solution. Can you share details?", timestamp: "Yesterday", unread: false,
    messages: [
      { sender: "contact", text: "We need a compliance-ready solution. Can you share details?", time: "Yesterday" },
      { sender: "agent", text: "Absolutely, Emily. I'll prepare a compliance overview and send it over by EOD.", time: "Yesterday" },
    ],
  },
  {
    id: "c4", contactName: "David Brown", contactEmail: "david@constructx.com", channel: "whatsapp", lastMessage: "Interested in the full suite. What's the timeline for onboarding?", timestamp: "Yesterday", unread: false,
    messages: [
      { sender: "contact", text: "Interested in the full suite. What's the timeline for onboarding?", time: "Yesterday" },
      { sender: "agent", text: "Typically 2-3 weeks for full onboarding. I'll send you the detailed plan.", time: "Yesterday" },
    ],
  },
  {
    id: "c5", contactName: "Anna Martinez", contactEmail: "anna@healthnet.org", channel: "email", lastMessage: "Renewal looks good. Sending the signed contract today.", timestamp: "2 days ago", unread: false,
    messages: [
      { sender: "agent", text: "Hi Anna, the renewal proposal is ready. Let me know if you have questions.", time: "3 days ago" },
      { sender: "contact", text: "Renewal looks good. Sending the signed contract today.", time: "2 days ago" },
    ],
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "e1", title: "Discovery Call", contactName: "David Brown", date: "2026-04-14", time: "09:00", duration: 30, type: "call", status: "scheduled" },
  { id: "e2", title: "Product Demo", contactName: "Emily Davis", date: "2026-04-14", time: "11:00", duration: 60, type: "demo", status: "scheduled" },
  { id: "e3", title: "Contract Review", contactName: "Sarah Johnson", date: "2026-04-14", time: "14:00", duration: 45, type: "meeting", status: "scheduled" },
  { id: "e4", title: "Follow-up Call", contactName: "Mike Chen", date: "2026-04-15", time: "10:00", duration: 15, type: "follow-up", status: "scheduled" },
  { id: "e5", title: "Onboarding Kickoff", contactName: "Anna Martinez", date: "2026-04-15", time: "13:00", duration: 60, type: "meeting", status: "scheduled" },
  { id: "e6", title: "Quarterly Review", contactName: "James Wilson", date: "2026-04-16", time: "15:00", duration: 30, type: "meeting", status: "scheduled" },
  { id: "e7", title: "Demo Presentation", contactName: "Rachel Kim", date: "2026-04-17", time: "11:00", duration: 45, type: "demo", status: "scheduled" },
  { id: "e8", title: "Pricing Discussion", contactName: "Lisa Park", date: "2026-04-18", time: "09:30", duration: 30, type: "call", status: "scheduled" },
];

export const dashboardStats = {
  totalContacts: 1248,
  newLeads: 47,
  activeDeals: 23,
  revenue: 142500,
  conversionRate: 32,
  avgDealSize: 11400,
};

export const revenueData = [
  { month: "Oct", revenue: 85000, deals: 12 },
  { month: "Nov", revenue: 92000, deals: 15 },
  { month: "Dec", revenue: 78000, deals: 10 },
  { month: "Jan", revenue: 105000, deals: 18 },
  { month: "Feb", revenue: 118000, deals: 20 },
  { month: "Mar", revenue: 132000, deals: 22 },
  { month: "Apr", revenue: 142500, deals: 23 },
];

export const leadSourceData = [
  { name: "Website", value: 35 },
  { name: "LinkedIn", value: 25 },
  { name: "Referral", value: 20 },
  { name: "Google Ads", value: 15 },
  { name: "Cold Outreach", value: 5 },
];
