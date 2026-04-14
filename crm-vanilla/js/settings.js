/* Settings Page Logic */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Settings");
    bindTabs();
    renderTeamMembers();
    bindToggles();
  });

  function bindTabs() {
    var tabs = document.querySelectorAll(".settings-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () {
        var active = document.querySelector(".settings-tab.active");
        if (active) active.classList.remove("active");
        this.classList.add("active");

        var target = this.getAttribute("data-tab");
        var panels = document.querySelectorAll(".settings-panel");
        for (var j = 0; j < panels.length; j++) {
          panels[j].classList.remove("active");
        }
        var targetPanel = document.getElementById("tab-" + target);
        if (targetPanel) targetPanel.classList.add("active");
      });
    }
  }

  function renderTeamMembers() {
    var container = document.getElementById("teamList");
    if (!container) return;

    var members = CRM_DATA.teamMembers;
    var html = "";

    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var statusClass = m.status === "active" ? "status-customer" : "status-lead";
      html += '<div class="team-member">';
      html += '<div class="team-member-left">';
      html += '<div class="contact-avatar small">' + m.avatar + '</div>';
      html += '<div>';
      html += '<div class="td-name">' + m.name + '</div>';
      html += '<div class="td-email">' + m.email + '</div>';
      html += '</div>';
      html += '</div>';
      html += '<div class="team-member-right">';
      html += '<span class="team-role">' + m.role + '</span>';
      html += '<span class="status-badge ' + statusClass + '">' + m.status.charAt(0).toUpperCase() + m.status.slice(1) + '</span>';
      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;
  }

  function bindToggles() {
    var toggles = document.querySelectorAll(".toggle-switch input");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("change", function () {
        /* In a real app, save the setting */
      });
    }

    var saveButtons = document.querySelectorAll(".btn-save");
    for (var j = 0; j < saveButtons.length; j++) {
      saveButtons[j].addEventListener("click", function (e) {
        e.preventDefault();
        var btn = this;
        var original = btn.textContent;
        btn.textContent = "Saved!";
        btn.classList.add("saved");
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove("saved");
        }, 2000);
      });
    }
  }

})();
