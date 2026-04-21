/* Pages list */
(function () {
  "use strict";

  function countBy(list, status) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (list[i].status === status) n++;
    return n;
  }

  function summary(list) {
    var total = list.length;
    var pub = countBy(list, "published");
    var dr = countBy(list, "draft");
    var sc = countBy(list, "scheduled");
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Total pages</div><div class="sc-value">' + total + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Published</div><div class="sc-value">' + pub + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Drafts</div><div class="sc-value">' + dr + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Scheduled</div><div class="sc-value">' + sc + '</div></div>';
    return html;
  }

  function filterBar() {
    var html = '<select class="pipeline-select" data-filter="status">';
    html += '<option value="all">All statuses</option>';
    html += '<option value="published">Published</option>';
    html += '<option value="draft">Draft</option>';
    html += '<option value="scheduled">Scheduled</option>';
    html += '<option value="archived">Archived</option>';
    html += '</select>';
    html += '<input class="pipeline-select" type="text" placeholder="Search pages..." data-filter="q" style="min-width:240px">';
    html += '<button class="btn btn-secondary">' + CMS_APP.ICONS.filter + ' More filters</button>';
    return html;
  }

  function table(list) {
    var html = '<div class="card"><table class="data-table"><thead><tr>';
    html += '<th>Title</th><th>URL</th><th>Status</th><th>Views 30d</th><th>Conv%</th><th>Last Edit</th><th>Author</th><th>Template</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      html += '<tr>';
      html += '<td><strong>' + p.title + '</strong></td>';
      html += '<td><code class="url-code">' + p.url + '</code></td>';
      html += '<td>' + CMS_APP.statusBadge(p.status) + '</td>';
      html += '<td>' + CMS_APP.fmtN(p.views30d) + '</td>';
      html += '<td>' + p.conv30d + '%</td>';
      html += '<td>' + p.lastEdit + '</td>';
      html += '<td>' + p.author + '</td>';
      html += '<td>' + p.template + '</td>';
      html += '<td class="actions-cell">';
      html += '<button class="icon-btn" data-slug="' + p.slug + '" data-act="edit" title="Edit">' + CMS_APP.ICONS.edit + '</button>';
      html += '<button class="icon-btn" data-slug="' + p.slug + '" data-act="open" title="Open">' + CMS_APP.ICONS.external + '</button>';
      html += '<button class="icon-btn danger" data-slug="' + p.slug + '" data-act="del" title="Delete">' + CMS_APP.ICONS.trash + '</button>';
      html += '</td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function render() {
    var fStatus = document.querySelector('[data-filter="status"]').value;
    var q = (document.querySelector('[data-filter="q"]').value || "").toLowerCase();
    var filtered = CMS_DATA.pages.filter(function (p) {
      if (fStatus !== "all" && p.status !== fStatus) return false;
      if (q && p.title.toLowerCase().indexOf(q) < 0 && p.url.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    document.getElementById("pagesTable").innerHTML = table(filtered);
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Pages", '<button class="btn btn-primary" data-action="new">' + CMS_APP.ICONS.plus + ' New Page</button>');
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.pages);
    document.getElementById("filterBar").innerHTML = filterBar();
    render();

    document.querySelector('[data-filter="status"]').addEventListener("change", render);
    document.querySelector('[data-filter="q"]').addEventListener("input", render);
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-act]");
      if (t) { console.log("pages action", t.dataset.act, t.dataset.slug); alert("TODO: " + t.dataset.act + " " + t.dataset.slug); }
    });
  });
})();
