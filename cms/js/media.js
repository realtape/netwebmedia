/* Media Library */
(function () {
  "use strict";

  var filter = "all";

  function summary(list) {
    var img = 0, vid = 0, doc = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].type === "image") img++;
      else if (list[i].type === "video") vid++;
      else if (list[i].type === "doc") doc++;
    }
    var html = "";
    html += '<div class="summary-card"><div class="sc-label">Total assets</div><div class="sc-value">' + list.length + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Images</div><div class="sc-value">' + img + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Videos</div><div class="sc-value">' + vid + '</div></div>';
    html += '<div class="summary-card"><div class="sc-label">Documents</div><div class="sc-value">' + doc + '</div></div>';
    return html;
  }

  function filterBar() {
    var opts = [["all", "All types"], ["image", "Images"], ["video", "Videos"], ["doc", "Documents"]];
    var html = '<select class="pipeline-select" data-filter="type">';
    for (var i = 0; i < opts.length; i++) {
      var sel = opts[i][0] === filter ? " selected" : "";
      html += '<option value="' + opts[i][0] + '"' + sel + '>' + opts[i][1] + '</option>';
    }
    html += '</select>';
    html += '<input class="pipeline-select" type="text" placeholder="Search assets..." style="min-width:240px">';
    return html;
  }

  function iconFor(type) {
    if (type === "video") return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    if (type === "doc") return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  }

  function grid(list) {
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (filter !== "all" && m.type !== filter) continue;
      var cls = "media-thumb";
      if (m.type === "video") cls += " video";
      else if (m.type === "doc") cls += " doc";
      html += '<div class="media-item">';
      html += '<div class="' + cls + '">' + iconFor(m.type) + '</div>';
      html += '<div class="media-meta">';
      html += '<div class="media-name" title="' + m.name + '">' + m.name + '</div>';
      html += '<div class="media-sub">' + m.size + ' &middot; ' + m.dim + '</div>';
      html += '<div class="media-sub muted">' + m.uses + ' uses &middot; ' + m.uploaded + '</div>';
      html += '</div></div>';
    }
    if (!html) html = '<div class="muted" style="padding:24px">No assets match the filter.</div>';
    return html;
  }

  function render() {
    document.getElementById("mediaGrid").innerHTML = grid(CMS_DATA.media);
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Media Library", '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' Upload Media</button>');
    document.getElementById("summaryCards").innerHTML = summary(CMS_DATA.media);
    document.getElementById("mediaFilter").innerHTML = filterBar();
    render();
    document.querySelector('[data-filter="type"]').addEventListener("change", function (e) {
      filter = e.target.value; render();
    });
  });
})();
