/* Templates */
(function () {
  "use strict";

  var activeCat = "all";

  function categories(counts) {
    var total = 0, keys = Object.keys(counts);
    for (var k = 0; k < keys.length; k++) total += counts[keys[k]];
    var label = total >= 200 ? "200+" : String(total);
    var html = '<button class="tpl-cat' + (activeCat === "all" ? " active" : "") + '" data-cat="all">All <span class="tpl-cat-count">' + label + '</span></button>';
    for (var i = 0; i < keys.length; i++) {
      var c = keys[i];
      html += '<button class="tpl-cat' + (activeCat === c ? " active" : "") + '" data-cat="' + c + '">' + c + ' <span class="tpl-cat-count">' + counts[c] + '</span></button>';
    }
    return html;
  }

  function grid(list) {
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (activeCat !== "all" && t.category !== activeCat) continue;
      var tierCls = t.tier === "pro" ? "badge-green" : "badge-gray";
      html += '<div class="tpl-card" data-id="' + t.id + '">';
      html += '<div class="tpl-preview" style="background:' + t.preview + '">';
      html += '<span class="tpl-tier status-badge ' + tierCls + '">' + t.tier + '</span>';
      html += '</div>';
      html += '<div class="tpl-body">';
      html += '<div class="tpl-name">' + t.name + '</div>';
      html += '<div class="tpl-meta"><span class="muted">' + t.category + '</span><span class="tpl-uses">' + CMS_APP.fmtN(t.uses) + ' uses</span></div>';
      html += '<button class="btn btn-primary tpl-use" data-id="' + t.id + '">Use Template</button>';
      html += '</div></div>';
    }
    if (!html) html = '<div class="muted" style="padding:24px">No templates in this category.</div>';
    return html;
  }

  function render() {
    document.getElementById("tplCategories").innerHTML = categories(CMS_DATA.templateCounts);
    document.getElementById("tplGrid").innerHTML = grid(CMS_DATA.templates);
  }

  document.addEventListener("DOMContentLoaded", function () {
    CMS_APP.buildHeader("Templates", '<button class="btn btn-primary">' + CMS_APP.ICONS.plus + ' Create Template</button>', "200+ professionally designed starting points");
    render();

    document.addEventListener("click", function (e) {
      var c = e.target.closest("[data-cat]");
      if (c) { activeCat = c.dataset.cat; render(); return; }
      var u = e.target.closest(".tpl-use");
      if (u) { console.log("use template", u.dataset.id); alert("TODO: use template " + u.dataset.id); }
    });
  });
})();
