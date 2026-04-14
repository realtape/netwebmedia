/* Calendar Page Logic */
(function () {
  "use strict";

  var weekOffset = 0;

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Calendar", '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Event</button>');
    bindEvents();
    renderCalendar();
  });

  function bindEvents() {
    var prevBtn = document.getElementById("calPrev");
    var nextBtn = document.getElementById("calNext");
    var todayBtn = document.getElementById("calToday");

    if (prevBtn) prevBtn.addEventListener("click", function () { weekOffset--; renderCalendar(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { weekOffset++; renderCalendar(); });
    if (todayBtn) todayBtn.addEventListener("click", function () { weekOffset = 0; renderCalendar(); });
  }

  function getWeekDates() {
    var now = new Date();
    var dayOfWeek = now.getDay();
    var monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weekOffset * 7));

    var days = [];
    var dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (var i = 0; i < 5; i++) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        date: d.getDate(),
        month: monthNames[d.getMonth()],
        full: d.toDateString(),
        isToday: d.toDateString() === new Date().toDateString()
      });
    }

    return {
      days: days,
      label: monthNames[monday.getMonth()] + " " + monday.getDate() + " - " + days[4].date + ", " + monday.getFullYear()
    };
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

    /* Place events */
    var events = CRM_DATA.calendarEvents;
    for (var e = 0; e < events.length; e++) {
      var evt = events[e];
      if (evt.day < 1 || evt.day > 5) continue;

      var cell = container.querySelector('.cal-cell[data-day="' + evt.day + '"][data-hour="' + Math.floor(evt.startHour) + '"]');
      if (!cell) continue;

      var topOffset = (evt.startHour % 1) * 60;
      var height = evt.duration * 60;

      var evtEl = document.createElement("div");
      evtEl.className = "cal-event";
      evtEl.style.backgroundColor = evt.color + "22";
      evtEl.style.borderLeft = "3px solid " + evt.color;
      evtEl.style.color = evt.color;
      evtEl.style.top = topOffset + "px";
      evtEl.style.height = height + "px";
      evtEl.innerHTML = '<div class="cal-event-title">' + evt.title + '</div>';
      cell.appendChild(evtEl);
    }
  }

})();
