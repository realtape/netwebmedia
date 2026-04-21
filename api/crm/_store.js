/* ============================================
   CRM In-Memory Data Store
   Shared across serverless functions per instance.
   Replace with Vercel Postgres/KV for persistence.
   ============================================ */

const store = {
  companies: [
    { id: 'comp_1', name: 'Acme Corp', website: 'https://acme.com', industry: 'Technology', companySize: '50-200', status: 'customer', owner: 'admin', metadata: {}, createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-04-10T08:00:00Z' },
    { id: 'comp_2', name: 'BlueSky Media', website: 'https://blueskymedia.io', industry: 'Marketing', companySize: '10-50', status: 'prospect', owner: 'admin', metadata: {}, createdAt: '2026-03-15T14:00:00Z', updatedAt: '2026-04-08T12:00:00Z' },
    { id: 'comp_3', name: 'GreenLeaf Health', website: 'https://greenleafhealth.com', industry: 'Healthcare', companySize: '200-500', status: 'active', owner: 'admin', metadata: {}, createdAt: '2026-02-20T09:00:00Z', updatedAt: '2026-04-12T15:00:00Z' },
    { id: 'comp_4', name: 'Nova Legal Partners', website: 'https://novalegal.com', industry: 'Legal', companySize: '10-50', status: 'customer', owner: 'admin', metadata: {}, createdAt: '2026-01-10T11:00:00Z', updatedAt: '2026-04-11T09:00:00Z' },
    { id: 'comp_5', name: 'Pinnacle Realty', website: 'https://pinnaclerealty.com', industry: 'Real Estate', companySize: '10-50', status: 'prospect', owner: 'admin', metadata: {}, createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-12T10:00:00Z' },
  ],

  contacts: [],

  pipelines: [
    {
      id: 'pipe_1', name: 'Sales Pipeline', entityType: 'deal', isDefault: true,
      stages: [
        { id: 'stage_1', name: 'Discovery', order: 0, probability: 10 },
        { id: 'stage_2', name: 'Proposal', order: 1, probability: 30 },
        { id: 'stage_3', name: 'Negotiation', order: 2, probability: 60 },
        { id: 'stage_4', name: 'Closed Won', order: 3, probability: 100 },
        { id: 'stage_5', name: 'Closed Lost', order: 4, probability: 0 },
      ],
    },
    {
      id: 'pipe_2', name: 'Lead Qualification', entityType: 'lead', isDefault: true,
      stages: [
        { id: 'stage_6', name: 'New', order: 0, probability: 5 },
        { id: 'stage_7', name: 'Contacted', order: 1, probability: 20 },
        { id: 'stage_8', name: 'Qualified', order: 2, probability: 50 },
        { id: 'stage_9', name: 'Converted', order: 3, probability: 100 },
      ],
    },
  ],

  leads: [
    { id: 'lead_1', title: 'BlueSky Media - SEO Audit', status: 'open', source: 'website', score: 72, estimatedValue: 5000, companyId: 'comp_2', contactId: 'cont_2', pipelineId: 'pipe_2', stageId: 'stage_7', owner: 'admin', description: 'Interested in full SEO audit and content strategy', createdAt: '2026-03-20T10:00:00Z', updatedAt: '2026-04-08T12:00:00Z' },
    { id: 'lead_2', title: 'GreenLeaf Health - Digital Overhaul', status: 'qualified', source: 'referral', score: 88, estimatedValue: 15000, companyId: 'comp_3', contactId: 'cont_3', pipelineId: 'pipe_2', stageId: 'stage_8', owner: 'admin', description: 'Full digital marketing transformation', createdAt: '2026-03-25T10:00:00Z', updatedAt: '2026-04-12T15:00:00Z' },
    { id: 'lead_3', title: 'Pinnacle Realty - Social Media', status: 'open', source: 'linkedin', score: 45, estimatedValue: 3000, companyId: 'comp_5', contactId: 'cont_5', pipelineId: 'pipe_2', stageId: 'stage_6', owner: 'admin', description: 'Wants help with Instagram and TikTok presence', createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-12T10:00:00Z' },
  ],

  deals: [
    { id: 'deal_1', name: 'Acme Corp - Annual Retainer', status: 'open', value: 48000, expectedCloseDate: '2026-05-01', companyId: 'comp_1', primaryContactId: 'cont_1', pipelineId: 'pipe_1', stageId: 'stage_3', owner: 'admin', description: 'Annual marketing retainer renewal', createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-04-10T08:00:00Z' },
    { id: 'deal_2', name: 'Nova Legal - Website + SEO', status: 'open', value: 25000, expectedCloseDate: '2026-04-30', companyId: 'comp_4', primaryContactId: 'cont_4', pipelineId: 'pipe_1', stageId: 'stage_2', owner: 'admin', description: 'Complete website redesign with SEO', createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-04-11T09:00:00Z' },
    { id: 'deal_3', name: 'GreenLeaf - Content Strategy', status: 'open', value: 18000, expectedCloseDate: '2026-05-15', companyId: 'comp_3', primaryContactId: 'cont_3', pipelineId: 'pipe_1', stageId: 'stage_1', owner: 'admin', description: 'Content marketing strategy and execution', createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-12T15:00:00Z' },
  ],

  tasks: [
    { id: 'task_1', title: 'Send proposal to Nova Legal', status: 'todo', priority: 'high', dueAt: '2026-04-15T17:00:00Z', assignedTo: 'admin', companyId: 'comp_4', contactId: 'cont_4', dealId: 'deal_2', createdAt: '2026-04-10T10:00:00Z' },
    { id: 'task_2', title: 'Schedule discovery call with Pinnacle', status: 'todo', priority: 'medium', dueAt: '2026-04-16T14:00:00Z', assignedTo: 'admin', companyId: 'comp_5', contactId: 'cont_5', leadId: 'lead_3', createdAt: '2026-04-11T10:00:00Z' },
    { id: 'task_3', title: 'Prepare GreenLeaf audit report', status: 'in_progress', priority: 'high', dueAt: '2026-04-14T17:00:00Z', assignedTo: 'admin', companyId: 'comp_3', contactId: 'cont_3', leadId: 'lead_2', createdAt: '2026-04-08T10:00:00Z' },
    { id: 'task_4', title: 'Follow up with Acme on retainer terms', status: 'done', priority: 'medium', dueAt: '2026-04-12T12:00:00Z', assignedTo: 'admin', companyId: 'comp_1', contactId: 'cont_1', dealId: 'deal_1', createdAt: '2026-04-05T10:00:00Z' },
    { id: 'task_5', title: 'Update BlueSky SEO proposal pricing', status: 'todo', priority: 'low', dueAt: '2026-04-18T17:00:00Z', assignedTo: 'admin', companyId: 'comp_2', contactId: 'cont_2', leadId: 'lead_1', createdAt: '2026-04-12T10:00:00Z' },
  ],

  activities: [
    { id: 'act_1', kind: 'call', summary: 'Discovery call with GreenLeaf Health', details: 'Discussed digital marketing needs. Very interested in content strategy.', occurredAt: '2026-04-12T15:00:00Z', companyId: 'comp_3', contactId: 'cont_3', leadId: 'lead_2', actor: 'admin' },
    { id: 'act_2', kind: 'email', summary: 'Sent proposal to Acme Corp', details: 'Annual retainer proposal for $48k/year.', occurredAt: '2026-04-10T08:00:00Z', companyId: 'comp_1', contactId: 'cont_1', dealId: 'deal_1', actor: 'admin' },
    { id: 'act_3', kind: 'meeting', summary: 'Strategy meeting with Nova Legal', details: 'Presented website redesign mockups and SEO roadmap.', occurredAt: '2026-04-11T09:00:00Z', companyId: 'comp_4', contactId: 'cont_4', dealId: 'deal_2', actor: 'admin' },
    { id: 'act_4', kind: 'status_change', summary: 'Lead qualified: GreenLeaf Health', details: 'Moved to Qualified stage after discovery call.', occurredAt: '2026-04-12T16:00:00Z', companyId: 'comp_3', leadId: 'lead_2', actor: 'admin' },
    { id: 'act_5', kind: 'email', summary: 'Follow-up with BlueSky Media', details: 'Sent SEO audit overview and scheduling link.', occurredAt: '2026-04-08T12:00:00Z', companyId: 'comp_2', contactId: 'cont_2', leadId: 'lead_1', actor: 'admin' },
  ],

  notes: [],
};

function generateId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

module.exports = { store, generateId };
