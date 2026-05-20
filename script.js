const STORAGE_KEY = "netwebmedia-leads";

function loadLeads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function saveLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function calculateScore(formData) {
  let score = 45;

  if (["$8k - $15k", "$15k+"].includes(formData.budget)) {
    score += 20;
  }

  if (
    ["Need SaaS product development", "Need custom app development", "Need digital marketing support"].includes(
      formData.serviceNeed,
    )
  ) {
    score += 15;
  }

  if (["United States", "Remote / Multi-country"].includes(formData.geography)) {
    score += 10;
  }

  if (["B2B professional services", "Clinic / healthcare", "Real estate / property"].includes(formData.businessType)) {
    score += 10;
  }

  return Math.min(score, 100);
}

function getPriority(score) {
  if (score >= 80) {
    return {
      stage: "Qualified",
      nextAction: "Reach out within 2 hours and offer a same-week strategy call.",
    };
  }

  if (score >= 65) {
    return {
      stage: "Discovery Call",
      nextAction: "Send audit recap and booking link within 24 hours.",
    };
  }

  return {
    stage: "Lead Captured",
    nextAction: "Send nurture follow-up with a lightweight audit summary.",
  };
}

function buildLeadRecord(formData) {
  const score = calculateScore(formData);
  const priority = getPriority(score);

  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...formData,
    score,
    stage: priority.stage,
    nextAction: priority.nextAction,
  };
}

function handleLeadForm() {
  const form = document.getElementById("lead-form");
  const status = document.getElementById("form-status");

  if (!form || !status) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = Object.fromEntries(new FormData(form).entries());
    const leads = loadLeads();
    leads.unshift(buildLeadRecord(formData));
    saveLeads(leads);

    status.textContent = "Audit request stored. Redirecting to the handoff page...";
    form.reset();

    window.setTimeout(() => {
      window.location.href = "thanks.html";
    }, 700);
  });
}

function renderStats(leads) {
  const statsGrid = document.getElementById("stats-grid");

  if (!statsGrid) {
    return;
  }

  const qualifiedCount = leads.filter((lead) => lead.stage === "Qualified").length;
  const discoveryCount = leads.filter((lead) => lead.stage === "Discovery Call").length;
  const averageScore = leads.length
    ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)
    : 0;

  const stats = [
    { label: "Total leads", value: leads.length },
    { label: "Qualified", value: qualifiedCount },
    { label: "Discovery-ready", value: discoveryCount },
    { label: "Avg. lead score", value: `${averageScore}%` },
  ];

  statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <div class="stats-card">
          <strong>${stat.value}</strong>
          <span>${stat.label}</span>
        </div>
      `,
    )
    .join("");
}

function renderLeadBoard() {
  const leadList = document.getElementById("lead-list");

  if (!leadList) {
    return;
  }

  const leads = loadLeads();
  renderStats(leads);

  if (!leads.length) {
    leadList.innerHTML = `
      <div class="empty-state">
        No demo leads yet. Submit the audit form on the homepage to populate the board.
      </div>
    `;
    return;
  }

  leadList.innerHTML = leads
    .map(
      (lead) => `
        <article class="lead-card">
          <div class="lead-header">
            <div>
              <h3>${lead.company}</h3>
              <p>${lead.name} • ${lead.email}</p>
            </div>
            <div class="lead-meta">
              <span class="lead-stage">${lead.stage}</span>
              <span class="lead-score">${lead.score}% fit</span>
            </div>
          </div>
          <p><strong>Business type:</strong> ${lead.businessType}</p>
          <p><strong>Geography:</strong> ${lead.geography}</p>
          <p><strong>Budget:</strong> ${lead.budget}</p>
          <p><strong>Primary need:</strong> ${lead.serviceNeed}</p>
          <p><strong>Challenge:</strong> ${lead.challenge}</p>
          <ul>
            <li><strong>Next action:</strong> ${lead.nextAction}</li>
            <li><strong>Phone:</strong> ${lead.phone}</li>
            <li><strong>Created:</strong> ${new Date(lead.createdAt).toLocaleString()}</li>
          </ul>
        </article>
      `,
    )
    .join("");
}

function handleLeadReset() {
  const clearButton = document.getElementById("clear-leads");

  if (!clearButton) {
    return;
  }

  clearButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderLeadBoard();
  });
}

handleLeadForm();
renderLeadBoard();
handleLeadReset();
