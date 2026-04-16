/* Social Planner Page Logic */
(function () {
  "use strict";

  var PLATFORMS = { fb: "F", ig: "I", li: "L", tk: "T" };
  var PLATFORM_NAMES = { fb: "Facebook", ig: "Instagram", li: "LinkedIn", tk: "TikTok" };
  var PLATFORM_CLASSES = { fb: "platform-fb", ig: "platform-ig", li: "platform-li", tk: "platform-tk" };

  var POSTS = [
    { day: 0, platform: "fb", time: "9:00 AM", title: "New blog post: 5 SEO Tips" },
    { day: 0, platform: "ig", time: "12:00 PM", title: "Behind the scenes at the office" },
    { day: 0, platform: "li", time: "2:00 PM", title: "Case study: 300% lead increase" },
    { day: 1, platform: "fb", time: "10:00 AM", title: "Client testimonial video" },
    { day: 1, platform: "tk", time: "3:00 PM", title: "Quick tip: Email subject lines" },
    { day: 1, platform: "ig", time: "6:00 PM", title: "Team spotlight: Meet Sarah" },
    { day: 2, platform: "li", time: "8:00 AM", title: "Industry report highlights" },
    { day: 2, platform: "fb", time: "1:00 PM", title: "Webinar announcement" },
    { day: 3, platform: "ig", time: "11:00 AM", title: "Product feature carousel" },
    { day: 3, platform: "tk", time: "4:00 PM", title: "Day in the life of a marketer" },
    { day: 3, platform: "li", time: "5:00 PM", title: "Hiring: Sales Manager" },
    { day: 4, platform: "fb", time: "9:00 AM", title: "Friday motivation quote" },
    { day: 4, platform: "ig", time: "12:00 PM", title: "Weekend vibes reel" },
    { day: 5, platform: "fb", time: "10:00 AM", title: "Weekend reading list" },
    { day: 5, platform: "ig", time: "2:00 PM", title: "User-generated content" },
    { day: 6, platform: "ig", time: "11:00 AM", title: "Week ahead preview" },
    { day: 6, platform: "li", time: "7:00 PM", title: "Monday motivation prep" }
  ];

  var activeFilter = "all";
  var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  document.addEventListener("DOMContentLoaded", function () {
    CRM_APP.buildHeader("Social Planner", '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' New Post</button>');
    render();
  });

  function render() {
    var body = document.getElementById("socialBody");
    if (!body) return;

    // Generate current week dates
    var today = new Date();
    var monday = new Date(today);
    var dayOfWeek = today.getDay();
    var diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);

    var html = '<div class="filter-group" style="margin-bottom:20px">';
    html += filterBtn("all", "All Platforms");
    html += filterBtn("fb", "Facebook");
    html += filterBtn("ig", "Instagram");
    html += filterBtn("li", "LinkedIn");
    html += filterBtn("tk", "TikTok");
    html += '</div>';

    html += '<div class="social-calendar">';
    for (var d = 0; d < 7; d++) {
      var date = new Date(monday);
      date.setDate(monday.getDate() + d);
      var dateNum = date.getDate();

      html += '<div class="social-day">';
      html += '<div class="social-day-header"><span>' + DAY_NAMES[d] + '</span>' + dateNum + '</div>';
      html += '<div class="social-day-body">';

      var dayPosts = POSTS.filter(function (p) {
        return p.day === d && (activeFilter === "all" || p.platform === activeFilter);
      });

      for (var p = 0; p < dayPosts.length; p++) {
        var post = dayPosts[p];
        html += '<div class="social-post">';
        html += '<div class="social-post-platform ' + PLATFORM_CLASSES[post.platform] + '">' + PLATFORMS[post.platform] + '</div>';
        html += '<div style="flex:1;min-width:0">';
        html += '<div class="social-post-title">' + post.title + '</div>';
        html += '<div class="social-post-time">' + post.time + '</div>';
        html += '</div>';
        html += '</div>';
      }

      if (dayPosts.length === 0) {
        html += '<div style="padding:8px;font-size:11px;color:var(--text-muted);text-align:center">No posts</div>';
      }

      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    body.innerHTML = html;

    // Filter handlers
    var filterBtns = body.querySelectorAll(".filter-btn");
    for (var f = 0; f < filterBtns.length; f++) {
      filterBtns[f].addEventListener("click", function () {
        activeFilter = this.getAttribute("data-filter");
        render();
      });
    }
  }

  function filterBtn(value, label) {
    var cls = value === activeFilter ? " active" : "";
    return '<button class="filter-btn' + cls + '" data-filter="' + value + '">' + label + '</button>';
  }

})();
