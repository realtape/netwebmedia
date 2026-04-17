/* Conversations Page Logic */
(function () {
  "use strict";

  var activeConversation = null;
  var channelFilter = "all";
  var L;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      empty: "No hay conversaciones", justNow: "Ahora"
    } : {
      empty: "No conversations found", justNow: "Just now"
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.conversations'));
    bindEvents();
    renderConversationList();
    /* Auto-select first conversation */
    if (CRM_DATA.conversations.length > 0) {
      selectConversation(CRM_DATA.conversations[0].id);
    }
  });

  function bindEvents() {
    var channelBtns = document.querySelectorAll(".channel-btn");
    for (var i = 0; i < channelBtns.length; i++) {
      channelBtns[i].addEventListener("click", function () {
        var active = document.querySelector(".channel-btn.active");
        if (active) active.classList.remove("active");
        this.classList.add("active");
        channelFilter = this.getAttribute("data-channel");
        renderConversationList();
      });
    }

    var sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    var msgInput = document.getElementById("messageInput");
    if (msgInput) {
      msgInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  function renderConversationList() {
    var container = document.getElementById("conversationList");
    if (!container) return;

    var convos = CRM_DATA.conversations.filter(function (c) {
      return channelFilter === "all" || c.channel === channelFilter;
    });

    var html = "";
    for (var i = 0; i < convos.length; i++) {
      var c = convos[i];
      var isActive = activeConversation && activeConversation.id === c.id ? " active" : "";
      var unreadClass = c.unread ? " unread" : "";
      html += '<div class="conv-item' + isActive + unreadClass + '" data-id="' + c.id + '">';
      html += '<div class="conv-avatar">' + c.avatar + '</div>';
      html += '<div class="conv-content">';
      html += '<div class="conv-top">';
      html += '<span class="conv-name">' + c.contact + '</span>';
      html += '<span class="conv-time">' + c.time + '</span>';
      html += '</div>';
      html += '<div class="conv-subject">' + c.subject + '</div>';
      html += '<div class="conv-preview">' + c.preview + '</div>';
      html += '</div>';
      html += '<div class="conv-channel">' + CRM_APP.channelIcon(c.channel) + '</div>';
      html += '</div>';
    }

    if (convos.length === 0) {
      html = '<div class="empty-conv">' + L.empty + '</div>';
    }

    container.innerHTML = html;

    /* Bind clicks */
    var items = container.querySelectorAll(".conv-item");
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener("click", function () {
        var id = parseInt(this.getAttribute("data-id"), 10);
        selectConversation(id);
      });
    }
  }

  function selectConversation(id) {
    for (var i = 0; i < CRM_DATA.conversations.length; i++) {
      if (CRM_DATA.conversations[i].id === id) {
        activeConversation = CRM_DATA.conversations[i];
        activeConversation.unread = false;
        break;
      }
    }

    renderConversationList();
    renderChatPanel();
  }

  function renderChatPanel() {
    var header = document.getElementById("chatHeader");
    var messages = document.getElementById("chatMessages");
    if (!header || !messages || !activeConversation) return;

    var c = activeConversation;

    header.innerHTML = '<div class="chat-header-info">' +
      '<div class="conv-avatar">' + c.avatar + '</div>' +
      '<div><div class="chat-header-name">' + c.contact + '</div>' +
      '<div class="chat-header-channel">' + CRM_APP.channelIcon(c.channel) + ' ' + c.channel.charAt(0).toUpperCase() + c.channel.slice(1) + '</div></div>' +
      '</div>';

    var html = "";
    for (var i = 0; i < c.messages.length; i++) {
      var m = c.messages[i];
      var isYou = m.from === "you";
      html += '<div class="chat-message ' + (isYou ? "sent" : "received") + '">';
      if (!isYou) {
        html += '<div class="msg-avatar">' + c.avatar + '</div>';
      }
      html += '<div class="msg-bubble">';
      html += '<div class="msg-text">' + m.text + '</div>';
      html += '<div class="msg-time">' + m.time + '</div>';
      html += '</div>';
      html += '</div>';
    }
    messages.innerHTML = html;
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    var input = document.getElementById("messageInput");
    if (!input || !activeConversation) return;

    var text = input.value.trim();
    if (!text) return;

    activeConversation.messages.push({
      from: "you",
      text: text,
      time: L.justNow
    });

    input.value = "";
    renderChatPanel();
  }

})();
