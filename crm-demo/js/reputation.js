/* Reputation Page Logic */
(function () {
  "use strict";

  var REVIEWS = [
    { name: "John Martinez", platform: "Google", stars: 5, text: "Absolutely fantastic service! The team went above and beyond to deliver our website on time. Highly recommend NetWeb Media for any business looking to grow online.", date: "Apr 12, 2026", responded: true },
    { name: "Lisa Thompson", platform: "Google", stars: 5, text: "Professional, responsive, and creative. They transformed our online presence completely. Our leads have increased by 300% since working with them.", date: "Apr 10, 2026", responded: true },
    { name: "Mike Chen", platform: "Facebook", stars: 4, text: "Great experience overall. The CRM setup was smooth and the team provided excellent training. Only minor issue was a small delay in the initial timeline.", date: "Apr 8, 2026", responded: true },
    { name: "Amanda Rogers", platform: "Google", stars: 5, text: "Best investment we have made for our business. The automation workflows alone have saved us 20+ hours per week. The support team is incredibly helpful.", date: "Apr 5, 2026", responded: false },
    { name: "David Park", platform: "Facebook", stars: 4, text: "Very impressed with the quality of work. The website looks stunning and performs great on mobile. Looking forward to phase two of our project.", date: "Apr 3, 2026", responded: true },
    { name: "Sarah Williams", platform: "Google", stars: 5, text: "From start to finish, the process was seamless. They understood our vision and executed it perfectly. Our conversion rate has doubled!", date: "Apr 1, 2026", responded: true },
    { name: "Robert Kim", platform: "Google", stars: 3, text: "Good service but communication could be improved. The end product was solid but I wish there were more frequent updates during the development process.", date: "Mar 28, 2026", responded: false },
    { name: "Jennifer Lee", platform: "Facebook", stars: 5, text: "Outstanding work on our e-commerce platform. Sales are up 45% since launch. The team is knowledgeable, creative, and a pleasure to work with.", date: "Mar 25, 2026", responded: true }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    var L = isEs ? {
      requestReview: "Solicitar Reseña",
      avgRating: "Calificación Promedio", totalReviews: "Total de Reseñas",
      thisMonth: "Este Mes", responseRate: "Tasa de Respuesta",
      responded: "Respondida", awaiting: "Esperando Respuesta", reply: "Responder"
    } : {
      requestReview: "Request Review",
      avgRating: "Average Rating", totalReviews: "Total Reviews",
      thisMonth: "This Month", responseRate: "Response Rate",
      responded: "Responded", awaiting: "Awaiting Response", reply: "Reply"
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.reputation'), '<button class="btn btn-primary">' + CRM_APP.ICONS.plus + ' ' + L.requestReview + '</button>');
    render(L);
  });

  function render(L) {
    var body = document.getElementById("reputationBody");
    if (!body) return;

    var totalStars = 0, thisMonth = 0, responded = 0;
    for (var i = 0; i < REVIEWS.length; i++) {
      totalStars += REVIEWS[i].stars;
      if (REVIEWS[i].date.indexOf("Apr") !== -1) thisMonth++;
      if (REVIEWS[i].responded) responded++;
    }
    var avgRating = (totalStars / REVIEWS.length).toFixed(1);
    var responseRate = ((responded / REVIEWS.length) * 100).toFixed(0) + "%";

    var html = '<div class="summary-cards">';
    html += '<div class="summary-card"><div class="card-label">' + L.avgRating + '</div><div class="star-rating">' + renderStars(parseFloat(avgRating)) + '</div><div class="card-value" style="font-size:20px;margin-top:4px">' + avgRating + ' / 5.0</div></div>';
    html += '<div class="summary-card"><div class="card-label">' + L.totalReviews + '</div><div class="card-value">' + REVIEWS.length + '</div></div>';
    html += '<div class="summary-card"><div class="card-label">' + L.thisMonth + '</div><div class="card-value green">' + thisMonth + '</div></div>';
    html += '<div class="summary-card"><div class="card-label">' + L.responseRate + '</div><div class="card-value">' + responseRate + '</div></div>';
    html += '</div>';

    html += '<div class="review-list">';
    for (var j = 0; j < REVIEWS.length; j++) {
      var r = REVIEWS[j];
      var platformClass = r.platform === "Google" ? "platform-google" : "platform-facebook";
      html += '<div class="review-item">';
      html += '<div class="review-header">';
      html += '<div class="review-author">';
      html += '<div class="contact-avatar small">' + r.name.split(" ").map(function(n){return n[0];}).join("") + '</div>';
      html += '<div>';
      html += '<div style="font-weight:600;font-size:14px">' + r.name + '</div>';
      html += '<span class="review-platform ' + platformClass + '">' + r.platform + '</span>';
      html += '</div>';
      html += '</div>';
      html += '<div style="font-size:12px;color:var(--text-dim)">' + r.date + '</div>';
      html += '</div>';
      html += '<div class="review-stars">' + renderStars(r.stars) + '</div>';
      html += '<div class="review-text">' + r.text + '</div>';
      html += '<div class="review-footer">';
      html += '<span>' + (r.responded ? '<span style="color:var(--green)">' + L.responded + '</span>' : '<span style="color:var(--orange)">' + L.awaiting + '</span>') + '</span>';
      if (!r.responded) {
        html += '<button class="action-link">' + L.reply + '</button>';
      }
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    body.innerHTML = html;
  }

  function renderStars(count) {
    var full = Math.floor(count);
    var html = "";
    for (var i = 0; i < 5; i++) {
      if (i < full) html += "&#9733;";
      else html += '<span style="opacity:0.3">&#9733;</span>';
    }
    return html;
  }

})();
