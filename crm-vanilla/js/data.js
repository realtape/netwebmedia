/* CRM Mock Data — emptied 2026-05-05 so the dashboard only shows real data
   from /api/?r=contacts, /api/?r=deals, /api/?r=stats, etc.
   The CRM_DATA global is preserved as a no-op so legacy fallback references
   in pipeline.js (and any other module that probes window.CRM_DATA) keep working. */
var CRM_DATA = (function () {

  var stats = {
    totalContacts: 0,
    newLeads: 0,
    activeDeals: 0,
    revenue: 0,
    conversion: 0,
    avgDeal: 0
  };

  var contacts = [];
  var pipelineStages = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"];
  var deals = [];
  var conversations = [];
  var campaigns = [];
  var tasks = [];
  var notes = [];
  var activities = [];

  return {
    stats: stats,
    contacts: contacts,
    pipelineStages: pipelineStages,
    deals: deals,
    conversations: conversations,
    campaigns: campaigns,
    tasks: tasks,
    notes: notes,
    activities: activities
  };

})();
