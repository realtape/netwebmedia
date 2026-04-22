export function renderHome(root) {
  root.innerHTML = `
    <div class="topbar">
      <div class="title">Net<span class="brand">Web</span>Media</div>
      <div style="font-size:13px;opacity:0.8">Today</div>
    </div>
    <div class="screen-body">
      <h1 style="margin-bottom:4px">Good morning</h1>
      <div style="color:var(--text-muted);margin-bottom:20px">Here's what moved overnight.</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div class="card" style="margin:0">
          <div class="card-title">New Leads</div>
          <div class="card-big">12</div>
        </div>
        <div class="card" style="margin:0">
          <div class="card-title">Qualified</div>
          <div class="card-big" style="color:var(--orange)">4</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Pipeline</div>
        <div style="font-size:17px;font-weight:600">$48,200 in motion</div>
        <div style="color:var(--text-muted);font-size:13px;margin-top:2px">Up 18% vs last week</div>
      </div>

      <div class="card">
        <div class="card-title">AI Actions Today</div>
        <div style="font-size:15px;line-height:1.6">
          • 23 prospect chats handled<br>
          • 6 audits delivered<br>
          • 14 blog posts drafted
        </div>
      </div>

      <div class="card" style="background:var(--navy);color:#fff;border:none">
        <div style="font-family:'Poppins';font-weight:700;font-size:17px;margin-bottom:6px">Need something done?</div>
        <div style="opacity:0.85;font-size:14px;margin-bottom:14px">Ask the AI in the chat tab — campaigns, content, leads, audits.</div>
      </div>
    </div>
  `;
}
