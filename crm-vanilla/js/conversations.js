/* Conversations Page Logic */
(function () {
  "use strict";

  var activeConversation = null;
  var channelFilter = "all";
  var conversationList = [];
  var L;

  document.addEventListener("DOMContentLoaded", function () {
    var isEs = (window.CRM_APP && CRM_APP.getLang && CRM_APP.getLang() === 'es');
    L = isEs ? {
      empty: "No hay conversaciones", justNow: "Ahora", sending: "Enviando..."
    } : {
      empty: "No conversations found", justNow: "Just now", sending: "Sending..."
    };
    CRM_APP.buildHeader(CRM_APP.t('nav.conversations'));
    bindEvents();
    loadConversations();
  });

  function bindEvents() {
    var channelBtns = document.querySelectorAll(".channel-btn");
    for (var i = 0; i < channelBtns.length; i++) {
      channelBtns[i].addEventListener("click", function () {
        var active = document.querySelector(".channel-btn.active");
        if (active) active.classList.remove("active");
        this.classList.add("active");
        channelFilter = this.getAttribute("data-channel");
        loadConversations();
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

  function loadConversations() {
    var url = "/api/?r=conversations";
    if (channelFilter !== "all") {
      url += "&channel=" + encodeURIComponent(channelFilter);
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      var list = [];
      if (xhr.status >= 200 && xhr.status < 300) {
        try { list = JSON.parse(xhr.responseText); } catch (e) { list = []; }
      }
      conversationList = list;
      renderConversationList();
      if (list.length > 0) {
        selectConversation(list[0].id);
      } else {
        renderEmptyChatPanel();
      }
    };
    xhr.onerror = function () {
      conversationList = [];
      renderConversationList();
      renderEmptyChatPanel();
    };
    xhr.send();
  }

  function formatTime(datetimeStr) {
    if (!datetimeStr) return "";
    /* Extract HH:MM from ISO datetime string or time string */
    var match = datetimeStr.match(/(\d{2}):(\d{2})/);
    if (match) return match[1] + ":" + match[2];
    return datetimeStr;
  }

  function renderConversationList() {
    var container = document.getElementById("conversationList");
    if (!container) return;

    if (conversationList.length === 0) {
      container.innerHTML = '<div class="empty-conv">' + L.empty + '</div>';
      return;
    }

    var esc = (window.CRM_APP && CRM_APP.esc) ? CRM_APP.esc : function(s){ return String(s == null ? '' : s); };
    var html = "";
    for (var i = 0; i < conversationList.length; i++) {
      var c = conversationList[i];
      var isActive = activeConversation && activeConversation.id === c.id ? " active" : "";
      var unreadClass = c.unread ? " unread" : "";
      var timeDisplay = formatTime(c.updated_at);
      html += '<div class="conv-item' + isActive + unreadClass + '" data-id="' + (parseInt(c.id, 10) || 0) + '">';
      html += '<div class="conv-avatar">' + esc(c.avatar || "??") + '</div>';
      html += '<div class="conv-content">';
      html += '<div class="conv-top">';
      html += '<span class="conv-name">' + esc(c.contact_name || "") + '</span>';
      html += '<span class="conv-time">' + esc(timeDisplay) + '</span>';
      html += '</div>';
      html += '<div class="conv-subject">' + esc(c.subject || "") + '</div>';
      html += '<div class="conv-preview">' + esc(c.preview || "") + '</div>';
      html += '</div>';
      html += '<div class="conv-channel">' + CRM_APP.channelIcon(c.channel) + '</div>';
      html += '</div>';
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
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/?r=conversations&id=" + encodeURIComponent(id));
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        var conv = null;
        try { conv = JSON.parse(xhr.responseText); } catch (e) { conv = null; }
        if (conv) {
          activeConversation = conv;
          /* Mark as read locally in the list cache */
          for (var i = 0; i < conversationList.length; i++) {
            if (conversationList[i].id === id) {
              conversationList[i].unread = 0;
              break;
            }
          }
          renderConversationList();
          renderChatPanel();
        }
      }
    };
    xhr.onerror = function () { /* silent */ };
    xhr.send();
  }

  function renderEmptyChatPanel() {
    var header = document.getElementById("chatHeader");
    var messages = document.getElementById("chatMessages");
    if (header) header.innerHTML = "";
    if (messages) messages.innerHTML = '<div class="empty-conv" style="padding:24px;">' + L.empty + '</div>';
  }

  function renderChatPanel() {
    var header = document.getElementById("chatHeader");
    var messages = document.getElementById("chatMessages");
    if (!header || !messages || !activeConversation) return;

    var c = activeConversation;

    var esc = (window.CRM_APP && CRM_APP.esc) ? CRM_APP.esc : function(s){ return String(s == null ? '' : s); };
    var ch = String(c.channel || "");
    var chLabel = ch ? ch.charAt(0).toUpperCase() + ch.slice(1) : "";
    header.innerHTML = '<div class="chat-header-info">' +
      '<div class="conv-avatar">' + esc(c.avatar || "??") + '</div>' +
      '<div><div class="chat-header-name">' + esc(c.contact_name || "") + '</div>' +
      '<div class="chat-header-channel">' + CRM_APP.channelIcon(c.channel) + ' ' + esc(chLabel) + '</div></div>' +
      '</div>';

    var msgs = (c.messages && Array.isArray(c.messages)) ? c.messages : [];
    var html = "";
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      var isMe = m.sender === "me";
      html += '<div class="chat-message ' + (isMe ? "sent" : "received") + '">';
      if (!isMe) {
        html += '<div class="msg-avatar">' + esc(c.avatar || "??") + '</div>';
      }
      html += '<div class="msg-bubble">';
      html += '<div class="msg-text">' + esc(m.body) + '</div>';
      html += '<div class="msg-time">' + esc(formatTime(m.sent_at)) + '</div>';
      html += '</div>';
      html += '</div>';
    }
    messages.innerHTML = html;
    messages.scrollTop = messages.scrollHeight;
  }

  function appendMessage(msg) {
    var messages = document.getElementById("chatMessages");
    if (!messages) return;

    var isMe = msg.sender === "me";
    var div = document.createElement("div");
    div.className = "chat-message " + (isMe ? "sent" : "received");

    var esc = (window.CRM_APP && CRM_APP.esc) ? CRM_APP.esc : function(s){ return String(s == null ? '' : s); };
    var inner = "";
    if (!isMe) {
      inner += '<div class="msg-avatar">' + esc((activeConversation && activeConversation.avatar) || "??") + '</div>';
    }
    inner += '<div class="msg-bubble">';
    inner += '<div class="msg-text">' + esc(msg.body) + '</div>';
    inner += '<div class="msg-time">' + esc(formatTime(msg.sent_at)) + '</div>';
    inner += '</div>';
    div.innerHTML = inner;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    var input = document.getElementById("messageInput");
    if (!input || !activeConversation) return;

    var text = input.value.trim();
    if (!text) return;

    var sendBtn = document.getElementById("sendBtn");
    if (sendBtn) sendBtn.disabled = true;
    input.value = "";

    var payload = {
      conversation_id: activeConversation.id,
      body: text,
      sender: "me"
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/?r=messages");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      if (sendBtn) sendBtn.disabled = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        var msg = null;
        try { msg = JSON.parse(xhr.responseText); } catch (e) { msg = null; }
        if (msg) {
          /* Add to the active conversation's messages array for consistency */
          if (!activeConversation.messages) activeConversation.messages = [];
          activeConversation.messages.push(msg);
          appendMessage(msg);
        }
      } else {
        /* Restore input on failure */
        input.value = text;
        alert("Error sending message. Please try again.");
      }
    };
    xhr.onerror = function () {
      if (sendBtn) sendBtn.disabled = false;
      input.value = text;
      alert("Network error. Please try again.");
    };
    xhr.send(JSON.stringify(payload));
  }

})();
