/* CRM Mock Data */
var CRM_DATA = (function () {

  var stats = {
    totalContacts: 1248,
    newLeads: 47,
    activeDeals: 23,
    revenue: 142500,
    conversion: 32,
    avgDeal: 11400
  };

  var contacts = [
    { id: 1, name: "Sarah Chen", email: "sarah.chen@techcorp.io", phone: "+1 (415) 555-0142", company: "TechCorp", role: "VP of Marketing", status: "customer", value: "$24,500", lastContact: "2 hours ago", avatar: "SC", notes: "Interested in premium plan upgrade. Follow up after Q2 review." },
    { id: 2, name: "Marcus Johnson", email: "m.johnson@innovate.co", phone: "+1 (212) 555-0198", company: "Innovate Co", role: "CEO", status: "prospect", value: "$18,000", lastContact: "1 day ago", avatar: "MJ", notes: "Met at SaaS conference. Needs CRM solution for 50-person team." },
    { id: 3, name: "Elena Rodriguez", email: "elena@startupxyz.com", phone: "+1 (305) 555-0167", company: "StartupXYZ", role: "Head of Sales", status: "lead", value: "$12,000", lastContact: "3 days ago", avatar: "ER", notes: "Downloaded whitepaper on sales automation." },
    { id: 4, name: "David Kim", email: "d.kim@globalfin.com", phone: "+1 (312) 555-0134", company: "GlobalFin", role: "CTO", status: "customer", value: "$45,000", lastContact: "5 hours ago", avatar: "DK", notes: "Enterprise client since 2024. Renewal in 3 months." },
    { id: 5, name: "Rachel Foster", email: "rachel@designhub.io", phone: "+1 (503) 555-0156", company: "DesignHub", role: "Founder", status: "prospect", value: "$8,500", lastContact: "2 days ago", avatar: "RF", notes: "Small agency, looking for client management tools." },
    { id: 6, name: "James Mitchell", email: "j.mitchell@corp360.com", phone: "+1 (617) 555-0189", company: "Corp360", role: "Director of Ops", status: "churned", value: "$0", lastContact: "30 days ago", avatar: "JM", notes: "Cancelled due to budget cuts. Re-engage in Q3." },
    { id: 7, name: "Aisha Patel", email: "aisha@nexusgroup.com", phone: "+1 (408) 555-0123", company: "Nexus Group", role: "Marketing Director", status: "customer", value: "$31,200", lastContact: "6 hours ago", avatar: "AP", notes: "Happy customer. Potential case study candidate." },
    { id: 8, name: "Tom Bradley", email: "tom@bradleylaw.com", phone: "+1 (202) 555-0145", company: "Bradley Law", role: "Managing Partner", status: "lead", value: "$15,000", lastContact: "1 week ago", avatar: "TB", notes: "Referred by David Kim. Needs legal practice CRM." },
    { id: 9, name: "Nina Volkov", email: "nina.v@eurotech.de", phone: "+49 30 555-0178", company: "EuroTech GmbH", role: "VP Sales EMEA", status: "prospect", value: "$52,000", lastContact: "4 days ago", avatar: "NV", notes: "Enterprise prospect. Needs multi-language support." },
    { id: 10, name: "Carlos Mendez", email: "carlos@latamretail.com", phone: "+52 55 555-0191", company: "LATAM Retail", role: "COO", status: "customer", value: "$28,750", lastContact: "1 day ago", avatar: "CM", notes: "Expanding to 3 new markets. Upsell opportunity." },
    { id: 11, name: "Lisa Wang", email: "lisa.w@cloudnine.io", phone: "+1 (650) 555-0112", company: "CloudNine", role: "Product Manager", status: "lead", value: "$9,200", lastContact: "5 days ago", avatar: "LW", notes: "Evaluating multiple CRM platforms." },
    { id: 12, name: "Robert Hayes", email: "r.hayes@megacorp.com", phone: "+1 (713) 555-0165", company: "MegaCorp", role: "SVP of Sales", status: "customer", value: "$67,000", lastContact: "3 hours ago", avatar: "RH", notes: "Largest account. Executive sponsor for partnership." }
  ];

  var pipelineStages = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"];

  var deals = [
    { id: 1, title: "TechCorp Enterprise", company: "TechCorp", value: "$24,500", contact: "Sarah Chen", stage: "Negotiation", probability: 75, daysInStage: 5 },
    { id: 2, title: "Innovate Co Platform", company: "Innovate Co", value: "$18,000", contact: "Marcus Johnson", stage: "Proposal Sent", probability: 50, daysInStage: 3 },
    { id: 3, title: "StartupXYZ Starter", company: "StartupXYZ", value: "$12,000", contact: "Elena Rodriguez", stage: "New Lead", probability: 10, daysInStage: 1 },
    { id: 4, title: "GlobalFin Renewal", company: "GlobalFin", value: "$45,000", contact: "David Kim", stage: "Qualified", probability: 60, daysInStage: 7 },
    { id: 5, title: "DesignHub Suite", company: "DesignHub", value: "$8,500", contact: "Rachel Foster", stage: "Contacted", probability: 20, daysInStage: 2 },
    { id: 6, title: "Nexus Expansion", company: "Nexus Group", value: "$31,200", contact: "Aisha Patel", stage: "Closed Won", probability: 100, daysInStage: 0 },
    { id: 7, title: "Bradley Legal CRM", company: "Bradley Law", value: "$15,000", contact: "Tom Bradley", stage: "New Lead", probability: 10, daysInStage: 4 },
    { id: 8, title: "EuroTech Enterprise", company: "EuroTech GmbH", value: "$52,000", contact: "Nina Volkov", stage: "Proposal Sent", probability: 45, daysInStage: 6 },
    { id: 9, title: "LATAM Retail Growth", company: "LATAM Retail", value: "$28,750", contact: "Carlos Mendez", stage: "Negotiation", probability: 80, daysInStage: 2 },
    { id: 10, title: "CloudNine Starter", company: "CloudNine", value: "$9,200", contact: "Lisa Wang", stage: "Contacted", probability: 15, daysInStage: 3 },
    { id: 11, title: "MegaCorp Partnership", company: "MegaCorp", value: "$67,000", contact: "Robert Hayes", stage: "Qualified", probability: 65, daysInStage: 10 },
    { id: 12, title: "TechCorp Add-on", company: "TechCorp", value: "$6,800", contact: "Sarah Chen", stage: "Closed Won", probability: 100, daysInStage: 0 },
    { id: 13, title: "Corp360 Win-back", company: "Corp360", value: "$14,000", contact: "James Mitchell", stage: "Closed Lost", probability: 0, daysInStage: 0 },
    { id: 14, title: "Nexus Analytics", company: "Nexus Group", value: "$22,000", contact: "Aisha Patel", stage: "Proposal Sent", probability: 55, daysInStage: 4 }
  ];

  var conversations = [
    {
      id: 1, contact: "Sarah Chen", avatar: "SC", channel: "email", subject: "Re: Premium Plan Upgrade",
      preview: "Thanks for the proposal. Let me review with my team...", unread: true, time: "10:32 AM",
      messages: [
        { from: "you", text: "Hi Sarah, following up on our call about the premium plan. I have attached the updated proposal with the volume discount we discussed.", time: "Yesterday 3:15 PM" },
        { from: "Sarah Chen", text: "Thanks for the proposal. Let me review with my team and get back to you by end of week. The pricing looks competitive.", time: "10:32 AM" }
      ]
    },
    {
      id: 2, contact: "Marcus Johnson", avatar: "MJ", channel: "whatsapp", subject: "Demo Follow-up",
      preview: "Great demo yesterday! Quick question about integrations...", unread: true, time: "9:15 AM",
      messages: [
        { from: "Marcus Johnson", text: "Great demo yesterday! Quick question about integrations - does your platform connect with Salesforce?", time: "9:15 AM" },
        { from: "you", text: "Yes! We have a native Salesforce integration. I can set up a technical walkthrough if you would like.", time: "9:22 AM" },
        { from: "Marcus Johnson", text: "That would be perfect. How about Thursday at 2pm?", time: "9:28 AM" }
      ]
    },
    {
      id: 3, contact: "David Kim", avatar: "DK", channel: "email", subject: "API Documentation Request",
      preview: "Our dev team needs the latest API docs for the v3 integration...", unread: false, time: "Yesterday",
      messages: [
        { from: "David Kim", text: "Our dev team needs the latest API docs for the v3 integration. Can you send those over?", time: "Yesterday 11:00 AM" },
        { from: "you", text: "Of course! Here is the link to our developer portal: docs.example.com/api/v3. Let me know if your team has any questions.", time: "Yesterday 11:45 AM" },
        { from: "David Kim", text: "Perfect, thanks! I will loop in our lead engineer.", time: "Yesterday 2:30 PM" }
      ]
    },
    {
      id: 4, contact: "Elena Rodriguez", avatar: "ER", channel: "sms", subject: "Whitepaper Download",
      preview: "Thanks for the whitepaper! Would love to chat more...", unread: false, time: "Yesterday",
      messages: [
        { from: "Elena Rodriguez", text: "Thanks for the whitepaper! Would love to chat more about how this could work for our sales team.", time: "Yesterday 4:00 PM" },
        { from: "you", text: "Great to hear you found it useful! I am free tomorrow between 10-12 or 2-4. What works for you?", time: "Yesterday 4:15 PM" }
      ]
    },
    {
      id: 5, contact: "Aisha Patel", avatar: "AP", channel: "email", subject: "Case Study Collaboration",
      preview: "We would be happy to participate in a case study...", unread: true, time: "8:45 AM",
      messages: [
        { from: "you", text: "Hi Aisha, would Nexus Group be interested in collaborating on a customer case study? We have seen great results from your usage.", time: "Yesterday 10:00 AM" },
        { from: "Aisha Patel", text: "We would be happy to participate in a case study. Our marketing team can coordinate. What is the process like?", time: "8:45 AM" }
      ]
    },
    {
      id: 6, contact: "Nina Volkov", avatar: "NV", channel: "whatsapp", subject: "Multi-language Support",
      preview: "Can we schedule a call to discuss EMEA requirements?", unread: false, time: "Mon",
      messages: [
        { from: "Nina Volkov", text: "Can we schedule a call to discuss EMEA requirements? We need support for German, French, and Spanish.", time: "Mon 2:00 PM" },
        { from: "you", text: "Absolutely! Our platform supports 12 languages including all three. How about Wednesday at 10am CET?", time: "Mon 2:30 PM" }
      ]
    }
  ];

  var calendarEvents = [
    { id: 1, title: "Team Standup", day: 1, startHour: 9, duration: 0.5, type: "meeting", color: "#6c5ce7" },
    { id: 2, title: "Sarah Chen - Follow Up", day: 1, startHour: 10, duration: 1, type: "call", color: "#00b894" },
    { id: 3, title: "Pipeline Review", day: 1, startHour: 14, duration: 1.5, type: "meeting", color: "#6c5ce7" },
    { id: 4, title: "Marcus Johnson Demo", day: 2, startHour: 10, duration: 1, type: "call", color: "#00b894" },
    { id: 5, title: "Product Training", day: 2, startHour: 13, duration: 2, type: "training", color: "#fdcb6e" },
    { id: 6, title: "Team Standup", day: 3, startHour: 9, duration: 0.5, type: "meeting", color: "#6c5ce7" },
    { id: 7, title: "Nina Volkov Call", day: 3, startHour: 10, duration: 1, type: "call", color: "#00b894" },
    { id: 8, title: "Quarterly Planning", day: 3, startHour: 14, duration: 2, type: "meeting", color: "#6c5ce7" },
    { id: 9, title: "EuroTech Proposal Review", day: 4, startHour: 11, duration: 1, type: "task", color: "#e17055" },
    { id: 10, title: "David Kim Check-in", day: 4, startHour: 15, duration: 0.5, type: "call", color: "#00b894" },
    { id: 11, title: "Team Standup", day: 5, startHour: 9, duration: 0.5, type: "meeting", color: "#6c5ce7" },
    { id: 12, title: "Week Retrospective", day: 5, startHour: 16, duration: 1, type: "meeting", color: "#6c5ce7" }
  ];

  var revenueData = [
    { month: "Sep", value: 82000 },
    { month: "Oct", value: 95000 },
    { month: "Nov", value: 88000 },
    { month: "Dec", value: 110000 },
    { month: "Jan", value: 105000 },
    { month: "Feb", value: 118000 },
    { month: "Mar", value: 142500 }
  ];

  var scheduleToday = [
    { time: "9:00 AM", title: "Team Standup", type: "meeting" },
    { time: "10:00 AM", title: "Sarah Chen - Follow Up Call", type: "call" },
    { time: "12:00 PM", title: "Lunch with Marcus Johnson", type: "meeting" },
    { time: "2:00 PM", title: "Pipeline Review", type: "meeting" },
    { time: "4:00 PM", title: "Proposal: EuroTech GmbH", type: "task" }
  ];

  var teamMembers = [
    { name: "Alex Rivera", email: "alex@company.com", role: "Admin", avatar: "AR", status: "active" },
    { name: "Jordan Lee", email: "jordan@company.com", role: "Sales Manager", avatar: "JL", status: "active" },
    { name: "Sam Taylor", email: "sam@company.com", role: "Sales Rep", avatar: "ST", status: "active" },
    { name: "Morgan Blake", email: "morgan@company.com", role: "Sales Rep", avatar: "MB", status: "active" },
    { name: "Casey Park", email: "casey@company.com", role: "Support", avatar: "CP", status: "invited" }
  ];

  return {
    stats: stats,
    contacts: contacts,
    pipelineStages: pipelineStages,
    deals: deals,
    conversations: conversations,
    calendarEvents: calendarEvents,
    revenueData: revenueData,
    scheduleToday: scheduleToday,
    teamMembers: teamMembers
  };

})();
