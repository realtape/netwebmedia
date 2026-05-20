/* Calendar Page Logic */
(function () {
  "use strict";

  var weekOffset = 0;
  var activePopover = null;

  var L;
  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      newEvent: "Nuevo Evento", today: "Hoy",
      dayNames: ["Lun", "Mar", "Mié", "Jue", "Vie"],
      monthNames: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
      delete: "Eliminar", cancel: "Cancelar", saving: "Guardando...", deleting: "Eliminando..."
    } : {
      newEvent: "New Event", today: "Today",
      dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      delete: "Delete", cancel: "Cancel", saving: "Saving...", deleting: "Deleting..."
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.calendars'), '<button id="newEventBtn" class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.newEvent + '</button>');
    var todayBtn = document.getElementById("calToday");
    if (todayBtn) todayBtn.textContent = L.today;
    injectModal();
    bindEvents();
    renderCalendar();
  });

  function injectModal() {
    if (document.getElementById("eventModal")) return;
    var div = document.createElement("div");
    div.innerHTML = '<div id="eventModal" class="crm-modal" style="display:none">' +
      '<div class="crm-modal-backdrop"></div>' +
      '<div class="crm-modal-box">' +
        '<h3>' + (L ? L.newEvent : "New Event") + '</h3>' +
        '<form id="eventForm">' +
          '<label>Title *<input name="title" required placeholder="Strategy call"></label>' +
          '<label>Date *<input name="event_date" type="date" required></label>' +
          '<label>Start Hour<select name="start_hour">' +
            '<option value="8">8:00 AM</option><option value="9" selected>9:00 AM</option>' +
            '<option value="10">10:00 AM</option><option value="11">11:00 AM</option>' +
            '<option value="12">12:00 PM</option><option value="13">1:00 PM</option>' +
            '<option value="14">2:00 PM</option><option value="15">3:00 PM</option>' +
            '<option value="16">4:00 PM</option><option value="17">5:00 PM</option>' +
            '<option value="18">6:00 PM</option>' +
          '</select></label>' +
          '<label>Duration<select name="duration">' +
            '<option value="0.5">30 min</option><option value="1" selected>1 hour</option>' +
            '<option value="1.5">1.5 hours</option><option value="2">2 hours</option>' +
          '</select></label>' +
          '<label>Type<select name="type">' +
            '<option value="meeting">Meeting</option><option value="call">Call</option>' +
            '<option value="task">Task</option>' +
          '</select></label>' +
          '<label>Color<input name="color" type="color" value="#FF671F"></label>' +
          '<div class="modal-actions">' +
            '<button type="button" id="eventModalCancel" class="btn btn-secondary">Cancel</button>' +
            '<button type="submit" class="btn btn-primary">Save Event</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>';
    document.body.appendChild(div.firstChild);
  }

  function bindEvents() {
    var prevBtn = document.getElementById("calPrev");
    var nextBtn = document.getElementById("calNext");
    var todayBtn = document.getElementById("calToday");

    if (prevBtn) prevBtn.addEventListener("click", function () { weekOffset--; renderCalendar(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { weekOffset++; renderCalendar(); });
    if (todayBtn) todayBtn.addEventListener("click", function () { weekOffset = 0; renderCalendar(); });

    /* New Event button — rebind after each buildHeader call */
    document.addEventListener("click", function (e) {
      if (e.target && (e.target.id === "newEventBtn" || (e.target.closest && e.target.closest("#newEventBtn")))) {
        openModal();
      }
      if (e.target && (e.target.id === "eventModalCancel" || (e.target.closest && e.target.closest("#eventModalCancel")))) {
        closeModal();
      }
      /* Close popover on outside click */
      if (activePopover && !activePopover.contains(e.target) && !e.target.classList.contains("cal-event")) {
        closePopover();
      }
    });

    /* Modal backdrop click to close */
    document.addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("crm-modal-backdrop")) {
        closeModal();
      }
    });

    /* Form submit */
    document.addEventListener("submit", function (e) {
      if (e.target && e.target.id === "eventForm") {
        e.preventDefault();
        submitNewEvent(e.target);
      }
    });
  }

  function openModal() {
    var modal = document.getElementById("eventModal");
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    var modal = document.getElementById("eventModal");
    if (modal) {
      modal.style.display = "none";
      var form = document.getElementById("eventForm");
      if (form) form.reset();
    }
  }

  function submitNewEvent(form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    var data = {
      title: form.title.value,
      event_date: form.event_date.value,
      start_hour: parseInt(form.start_hour.value, 10),
      duration: parseFloat(form.duration.value),
      type: form.type.value,
      color: form.color.value
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/?r=events");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      if (submitBtn) submitBtn.disabled = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        closeModal();
        renderCalendar();
      } else {
        alert("Error saving event. Please try again.");
      }
    };
    xhr.onerror = function () {
      if (submitBtn) submitBtn.disabled = false;
      alert("Network error. Please try again.");
    };
    xhr.send(JSON.stringify(data));
  }

  function deleteEvent(id) {
    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", "/api/?r=events&id=" + encodeURIComponent(id));
    xhr.onload = function () {
      closePopover();
      if (xhr.status >= 200 && xhr.status < 300) {
        renderCalendar();
      } else {
        alert("Error deleting event.");
      }
    };
    xhr.onerror = function () {
      closePopover();
      alert("Network error.");
    };
    xhr.send();
  }

  function closePopover() {
    if (activePopover && activePopover.parentNode) {
      activePopover.parentNode.removeChild(activePopover);
    }
    activePopover = null;
  }

  function showEventPopover(evtEl, evt) {
    closePopover();

    var pop = document.createElement("div");
    pop.className = "cal-event-popover";
    pop.style.cssText = "position:absolute;z-index:200;background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:180px;";

    var title = document.createElement("div");
    title.style.cssText = "font-weight:600;margin-bottom:4px;";
    title.textContent = evt.title;
    pop.appendChild(title);

    var dateInfo = document.createElement("div");
    dateInfo.style.cssText = "font-size:12px;color:#666;margin-bottom:10px;";
    dateInfo.textContent = evt.event_date + "  " + evt.start_hour + ":00";
    pop.appendChild(dateInfo);

    var delBtn = document.createElement("button");
    delBtn.className = "btn btn-secondary";
    delBtn.style.cssText = "font-size:12px;padding:4px 10px;color:#e74c3c;border-color:#e74c3c;";
    delBtn.textContent = L ? L.delete : "Delete";
    delBtn.addEventListener("click", function () {
      deleteEvent(evt.id);
    });
    pop.appendChild(delBtn);

    evtEl.style.position = "relative";
    evtEl.appendChild(pop);
    activePopover = pop;
  }

  function getWeekDates() {
    var now = new Date();
    var dayOfWeek = now.getDay();
    var monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weekOffset * 7));

    var days = [];
    var dayNames = (L && L.dayNames) || ["Mon", "Tue", "Wed", "Thu", "Fri"];
    var monthNames = (L && L.monthNames) || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (var i = 0; i < 5; i++) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        date: d.getDate(),
        month: monthNames[d.getMonth()],
        full: d.toDateString(),
        isToday: d.toDateString() === new Date().toDateString(),
        isoDate: formatDate(d)
      });
    }

    return {
      days: days,
      monday: monday,
      label: monthNames[monday.getMonth()] + " " + monday.getDate() + " - " + days[4].date + ", " + monday.getFullYear()
    };
  }

  function formatDate(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function loadEvents(week, callback) {
    var from = week.days[0].isoDate;
    var to = week.days[4].isoDate;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/?r=events&from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to));
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        var events = [];
        try { events = JSON.parse(xhr.responseText); } catch (e) { events = []; }
        callback(events);
      } else {
        callback([]);
      }
    };
    xhr.onerror = function () { callback([]); };
    xhr.send();
  }

  function placeEvents(container, events, week) {
    for (var e = 0; e < events.length; e++) {
      var evt = events[e];

      /* Find which day column (0-4) this event belongs to */
      var dayIndex = -1;
      for (var d = 0; d < week.days.length; d++) {
        if (week.days[d].isoDate === evt.event_date) {
          dayIndex = d;
          break;
        }
      }
      if (dayIndex < 0) continue;

      var colDay = dayIndex + 1; /* data-day is 1-based */
      var startHour = parseInt(evt.start_hour, 10);
      var cell = container.querySelector('.cal-cell[data-day="' + colDay + '"][data-hour="' + startHour + '"]');
      if (!cell) continue;

      var topOffset = (evt.start_hour % 1) * 60;
      var height = parseFloat(evt.duration) * 60;
      var color = evt.color || "#6c5ce7";

      var evtEl = document.createElement("div");
      evtEl.className = "cal-event";
      evtEl.style.backgroundColor = color + "22";
      evtEl.style.borderLeft = "3px solid " + color;
      evtEl.style.color = color;
      evtEl.style.top = topOffset + "px";
      evtEl.style.height = height + "px";
      evtEl.style.cursor = "pointer";
      var __esc = (window.CRM_APP && CRM_APP.esc) ? CRM_APP.esc : function(s){ return String(s == null ? '' : s); };
      evtEl.innerHTML = '<div class="cal-event-title">' + __esc(evt.title) + '</div>';

      /* Closure to capture evt */
      (function (el, evtData) {
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          showEventPopover(el, evtData);
        });
      }(evtEl, evt));

      cell.appendChild(evtEl);
    }
  }

  function renderCalendar() {
    var container = document.getElementById("calendarGrid");
    var weekLabel = document.getElementById("weekLabel");
    if (!container) return;

    var week = getWeekDates();
    if (weekLabel) weekLabel.textContent = week.label;

    var hours = [];
    for (var h = 8; h <= 19; h++) {
      var label = h <= 12 ? h + (h < 12 ? " AM" : " PM") : (h - 12) + " PM";
      hours.push({ hour: h, label: label });
    }

    var html = '<div class="cal-header-row">';
    html += '<div class="cal-time-gutter"></div>';
    for (var i = 0; i < week.days.length; i++) {
      var day = week.days[i];
      html += '<div class="cal-day-header' + (day.isToday ? " today" : "") + '">';
      html += '<span class="cal-day-name">' + day.name + '</span>';
      html += '<span class="cal-day-num' + (day.isToday ? " today" : "") + '">' + day.date + '</span>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="cal-body">';
    for (var r = 0; r < hours.length; r++) {
      html += '<div class="cal-row">';
      html += '<div class="cal-time-label">' + hours[r].label + '</div>';
      for (var c = 0; c < 5; c++) {
        html += '<div class="cal-cell" data-day="' + (c + 1) + '" data-hour="' + hours[r].hour + '"></div>';
      }
      html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;

    /* Load events from API and place them */
    loadEvents(week, function (events) {
      placeEvents(container, events, week);
    });
  }

})();
