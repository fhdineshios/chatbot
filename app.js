(function () {
  const fab = document.getElementById("fab");
  const modalRoot = document.getElementById("modal-root");
  const backdrop = document.getElementById("modal-backdrop");
  const modalClose = document.getElementById("modal-close");
  const modalMinimize = document.getElementById("modal-minimize");
  const fusionModal = document.getElementById("fusion-modal");
  const chatInput = document.getElementById("chat-input");
  const chips = document.getElementById("chips");
  const chatThread = document.getElementById("chat-thread");
  const modalBodyScroll = document.getElementById("modal-body-scroll");
  const btnNewChat = document.getElementById("btn-new-chat");
  const btnAttach = document.getElementById("btn-attach");
  const btnMic = document.getElementById("btn-mic");
  const toast = document.getElementById("toast");
  const inputRow = document.querySelector(".modal-input-row");
  const modalBrand = fusionModal && fusionModal.querySelector(".modal-brand");
  const statusEl = fusionModal && fusionModal.querySelector(".modal-brand__status");
  const statusDefaultHtml = statusEl ? statusEl.innerHTML : "";

  const botDrawerRoot = document.getElementById("bot-drawer-root");
  const botDrawerBackdrop = document.getElementById("bot-drawer-backdrop");
  const btnBotMenu = document.getElementById("btn-bot-menu");
  const drawerBtnNew = document.getElementById("drawer-btn-new");
  const drawerConversationList = document.getElementById("drawer-conversation-list");
  const drawerEmptyState = document.getElementById("drawer-empty-state");
  const drawerRecentLabel = document.getElementById("drawer-recent-label");
  const drawerListWrap = document.getElementById("drawer-list-wrap");

  function closeBotDrawer(opts) {
    var skipFocus = opts && opts.skipFocus;
    if (!botDrawerRoot) return;
    botDrawerRoot.classList.remove("is-open");
    botDrawerRoot.setAttribute("aria-hidden", "true");
    if (btnBotMenu) btnBotMenu.setAttribute("aria-expanded", "false");
    if (!skipFocus && btnBotMenu) btnBotMenu.focus();
  }

  function openBotDrawer() {
    if (!botDrawerRoot) return;
    renderDrawerList();
    botDrawerRoot.classList.add("is-open");
    botDrawerRoot.setAttribute("aria-hidden", "false");
    if (btnBotMenu) btnBotMenu.setAttribute("aria-expanded", "true");
    if (drawerBtnNew) drawerBtnNew.focus();
  }

  function syncChatInputHeight() {
    if (!chatInput) return;
    chatInput.style.height = "auto";
    var maxPx = 140;
    var h = Math.min(Math.max(chatInput.scrollHeight, 44), maxPx);
    chatInput.style.height = h + "px";
  }

  const STORAGE_POS = "fusionFabPosition";
  const STORAGE_MODAL_POS = "fusionModalPosition";
  const STORAGE_CHAT = "fusionBotChatSessions";
  const MAX_CHAT_SESSIONS = 30;
  const MOVE_THRESHOLD = 8;

  var chatState = { sessions: [], activeId: null };
  var activeSessionId = null;

  function findSession(id) {
    for (var i = 0; i < chatState.sessions.length; i++) {
      if (chatState.sessions[i].id === id) return chatState.sessions[i];
    }
    return null;
  }

  function saveChatState() {
    try {
      localStorage.setItem(
        STORAGE_CHAT,
        JSON.stringify({ sessions: chatState.sessions, activeId: activeSessionId })
      );
    } catch {
      /* ignore */
    }
  }

  function trimSessions() {
    chatState.sessions.sort(function (a, b) {
      return b.updatedAt - a.updatedAt;
    });
    if (chatState.sessions.length > MAX_CHAT_SESSIONS) {
      chatState.sessions = chatState.sessions.slice(0, MAX_CHAT_SESSIONS);
    }
  }

  function truncateTitle(s, maxLen) {
    var max = maxLen || 48;
    var t = (s || "").trim();
    if (!t) return "Chat";
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + "…";
  }

  function formatDrawerTime(ts) {
    var d = new Date(ts);
    var now = new Date();
    var sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) return formatChatTime(d);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[d.getMonth()] + " " + d.getDate();
  }

  function getOrCreateSessionForSend(firstLine) {
    if (activeSessionId) {
      var existing = findSession(activeSessionId);
      if (existing) return existing;
    }
    var id = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    var session = {
      id: id,
      title: truncateTitle(firstLine),
      updatedAt: Date.now(),
      messages: [],
    };
    chatState.sessions.unshift(session);
    activeSessionId = id;
    chatState.activeId = id;
    trimSessions();
    saveChatState();
    return session;
  }

  var DRAWER_RECENT_CHAT_ICON =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8.5z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  function renderDrawerList() {
    if (!drawerConversationList) return;
    drawerConversationList.innerHTML = "";
    var sorted = chatState.sessions.slice().sort(function (a, b) {
      return b.updatedAt - a.updatedAt;
    });
    for (var i = 0; i < sorted.length; i++) {
      var s = sorted[i];
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bot-drawer__item";
      if (s.id === activeSessionId) btn.classList.add("bot-drawer__item--active");
      btn.setAttribute("data-session-id", s.id);
      var iconWrap = document.createElement("span");
      iconWrap.className = "bot-drawer__item-icon";
      iconWrap.setAttribute("aria-hidden", "true");
      iconWrap.innerHTML = DRAWER_RECENT_CHAT_ICON;
      var col = document.createElement("span");
      col.className = "bot-drawer__item-col";
      var titleEl = document.createElement("span");
      titleEl.className = "bot-drawer__item-title";
      titleEl.textContent = s.title || "Chat";
      var meta = document.createElement("span");
      meta.className = "bot-drawer__item-meta";
      meta.textContent = formatDrawerTime(s.updatedAt);
      col.appendChild(titleEl);
      col.appendChild(meta);
      btn.appendChild(iconWrap);
      btn.appendChild(col);
      li.appendChild(btn);
      drawerConversationList.appendChild(li);
    }
    var has = sorted.length > 0;
    if (drawerEmptyState) drawerEmptyState.hidden = has;
    if (drawerRecentLabel) drawerRecentLabel.hidden = !has;
    if (drawerListWrap) drawerListWrap.hidden = !has;
  }

  function loadFabPosition() {
    try {
      const raw = sessionStorage.getItem(STORAGE_POS);
      if (!raw) return;
      const { left, top } = JSON.parse(raw);
      if (typeof left === "number" && typeof top === "number") {
        fab.style.left = `${left}px`;
        fab.style.top = `${top}px`;
        fab.style.right = "auto";
        fab.style.bottom = "auto";
      }
    } catch {
      /* ignore */
    }
  }

  function saveFabPosition(left, top) {
    try {
      sessionStorage.setItem(STORAGE_POS, JSON.stringify({ left, top }));
    } catch {
      /* ignore */
    }
  }

  function defaultFabPosition() {
    fab.style.left = "";
    fab.style.top = "";
    fab.style.right = "24px";
    fab.style.bottom = "24px";
    try {
      sessionStorage.removeItem(STORAGE_POS);
    } catch {
      /* ignore */
    }
  }

  loadFabPosition();
  if (!fab.style.left && !fab.style.top) {
    fab.style.right = "24px";
    fab.style.bottom = "24px";
  }

  const modalHead = fusionModal && fusionModal.querySelector(".modal-head--bot");
  const modalHandle = fusionModal && fusionModal.querySelector(".modal-handle");

  function loadModalPosition() {
    try {
      const raw = sessionStorage.getItem(STORAGE_MODAL_POS);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (typeof o.left === "number" && typeof o.top === "number") {
        return { left: o.left, top: o.top };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function saveModalPosition(left, top) {
    try {
      sessionStorage.setItem(STORAGE_MODAL_POS, JSON.stringify({ left, top }));
    } catch {
      /* ignore */
    }
  }

  function clearModalPosition() {
    try {
      sessionStorage.removeItem(STORAGE_MODAL_POS);
    } catch {
      /* ignore */
    }
  }

  var MODAL_NARROW_MAX_PX = 639;

  function isNarrowModalViewport() {
    return window.matchMedia("(max-width: " + MODAL_NARROW_MAX_PX + "px)").matches;
  }

  function clearModalInlinePosition() {
    if (!fusionModal) return;
    fusionModal.style.left = "";
    fusionModal.style.top = "";
  }

  function clampModalToViewport() {
    if (!fusionModal || isNarrowModalViewport()) return;
    const rect = fusionModal.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    let left = rect.left;
    let top = rect.top;
    const pad = 8;
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));
    fusionModal.style.left = left + "px";
    fusionModal.style.top = top + "px";
  }

  function centerFusionModal() {
    if (!fusionModal) return;
    if (isNarrowModalViewport()) {
      clearModalInlinePosition();
      return;
    }
    const rect = fusionModal.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    let left = (window.innerWidth - w) / 2;
    let top = (window.innerHeight - h) / 2;
    const pad = 16;
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));
    fusionModal.style.left = left + "px";
    fusionModal.style.top = top + "px";
  }

  function applySavedOrCenterModal() {
    if (!fusionModal) return;
    if (isNarrowModalViewport()) {
      clearModalInlinePosition();
      return;
    }
    const saved = loadModalPosition();
    if (saved) {
      fusionModal.style.left = saved.left + "px";
      fusionModal.style.top = saved.top + "px";
      clampModalToViewport();
    } else {
      centerFusionModal();
    }
  }

  const drag = {
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  };

  let suppressNextClick = false;

  fab.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.moved = false;
    const rect = fab.getBoundingClientRect();
    drag.offsetX = e.clientX - rect.left;
    drag.offsetY = e.clientY - rect.top;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    fab.setPointerCapture(e.pointerId);
    fab.style.transition = "none";
  });

  fab.addEventListener("pointermove", function (e) {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (dist > MOVE_THRESHOLD) {
      drag.moved = true;
      fab.classList.add("fab--dragging");
    }
    if (!drag.moved) return;

    fab.style.right = "auto";
    fab.style.bottom = "auto";
    let left = e.clientX - drag.offsetX;
    let top = e.clientY - drag.offsetY;
    const maxL = window.innerWidth - fab.offsetWidth;
    const maxT = window.innerHeight - fab.offsetHeight;
    left = Math.max(8, Math.min(left, maxL - 8));
    top = Math.max(8, Math.min(top, maxT - 8));
    fab.style.left = `${left}px`;
    fab.style.top = `${top}px`;
  });

  function endPointer(e) {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    fab.releasePointerCapture(e.pointerId);
    fab.style.transition = "";
    fab.classList.remove("fab--dragging");
    drag.active = false;

    if (drag.moved) {
      const rect = fab.getBoundingClientRect();
      saveFabPosition(rect.left, rect.top);
      suppressNextClick = true;
    }
  }

  fab.addEventListener("pointerup", endPointer);
  fab.addEventListener("pointercancel", endPointer);

  fab.addEventListener("click", function (e) {
    if (suppressNextClick) {
      suppressNextClick = false;
      e.preventDefault();
      return;
    }
    openModal();
  });

  function openModal() {
    modalRoot.hidden = false;
    modalRoot.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    requestAnimationFrame(function () {
      applySavedOrCenterModal();
      modalRoot.classList.add("is-open");
    });
    modalClose.focus({ preventScroll: true });
    setTimeout(function () {
      if (chatInput) chatInput.focus();
    }, 280);
  }

  function closeModal() {
    closeBotDrawer({ skipFocus: true });
    modalRoot.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    const onEnd = function (ev) {
      if (ev.target !== fusionModal) return;
      modalRoot.hidden = true;
      modalRoot.setAttribute("aria-hidden", "true");
      fusionModal.removeEventListener("transitionend", onEnd);
    };
    fusionModal.addEventListener("transitionend", onEnd);
    fab.focus({ preventScroll: true });
  }

  backdrop.addEventListener("click", closeModal);
  modalClose.addEventListener("click", closeModal);
  if (modalMinimize) {
    modalMinimize.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || modalRoot.hidden) return;
    if (botDrawerRoot && botDrawerRoot.classList.contains("is-open")) {
      e.preventDefault();
      closeBotDrawer();
      return;
    }
    closeModal();
  });

  window.addEventListener("resize", function () {
    const rect = fab.getBoundingClientRect();
    if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
      defaultFabPosition();
    }
    if (fusionModal && !modalRoot.hidden) {
      if (isNarrowModalViewport()) {
        clearModalInlinePosition();
      } else {
        applySavedOrCenterModal();
      }
    }
  });

  const modalDrag = {
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    moved: false,
  };

  function onModalDragStart(e) {
    if (e.button !== 0 || !fusionModal) return;
    if (isNarrowModalViewport()) return;
    if (e.target.closest("button, a, textarea, input, select")) return;
    modalDrag.active = true;
    modalDrag.pointerId = e.pointerId;
    modalDrag.moved = false;
    const rect = fusionModal.getBoundingClientRect();
    modalDrag.offsetX = e.clientX - rect.left;
    modalDrag.offsetY = e.clientY - rect.top;
    fusionModal.setPointerCapture(e.pointerId);
    fusionModal.classList.add("modal--dragging");
    fusionModal.style.transition = "opacity 0.32s ease, box-shadow 0.2s ease";
    e.preventDefault();
  }

  function onModalDragMove(e) {
    if (!fusionModal || !modalDrag.active || e.pointerId !== modalDrag.pointerId) return;
    modalDrag.moved = true;
    let left = e.clientX - modalDrag.offsetX;
    let top = e.clientY - modalDrag.offsetY;
    const rect = fusionModal.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const pad = 8;
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));
    fusionModal.style.left = left + "px";
    fusionModal.style.top = top + "px";
  }

  function onModalDragEnd(e) {
    if (!fusionModal || !modalDrag.active || e.pointerId !== modalDrag.pointerId) return;
    fusionModal.releasePointerCapture(e.pointerId);
    fusionModal.classList.remove("modal--dragging");
    fusionModal.style.transition = "";
    modalDrag.active = false;
    if (modalDrag.moved) {
      const r = fusionModal.getBoundingClientRect();
      saveModalPosition(r.left, r.top);
    }
  }

  if (modalHandle) {
    modalHandle.addEventListener("pointerdown", onModalDragStart);
    modalHandle.addEventListener("dblclick", function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearModalPosition();
      centerFusionModal();
    });
  }
  if (modalHead) {
    modalHead.addEventListener("pointerdown", onModalDragStart);
  }
  if (fusionModal) {
    fusionModal.addEventListener("pointermove", onModalDragMove);
    fusionModal.addEventListener("pointerup", onModalDragEnd);
    fusionModal.addEventListener("pointercancel", onModalDragEnd);
  }

  fab.addEventListener(
    "dblclick",
    function (e) {
      e.preventDefault();
      defaultFabPosition();
    },
    { passive: false }
  );

  /* —— Interactive chat (demo) —— */
  let sending = false;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(function () {
      toast.classList.add("toast--visible");
    });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("toast--visible");
      toast.hidden = true;
    }, 2600);
  }

  function scrollChatDown() {
    if (!modalBodyScroll) return;
    requestAnimationFrame(function () {
      modalBodyScroll.scrollTop = modalBodyScroll.scrollHeight;
    });
  }

  function setBrandTyping(on) {
    if (!statusEl || !modalBrand) return;
    if (on) {
      statusEl.innerHTML =
        '<span class="modal-brand__dot" aria-hidden="true"></span> Typing…';
      modalBrand.classList.add("is-typing");
    } else {
      statusEl.innerHTML = statusDefaultHtml;
      modalBrand.classList.remove("is-typing");
    }
  }

  var BOT_AVATAR_SVG =
    '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="10" y="28" width="28" height="8" rx="2" fill="#fff"/>' +
    '<rect x="8" y="18" width="32" height="8" rx="2" fill="#fff"/>' +
    '<rect x="6" y="8" width="36" height="8" rx="2" fill="#fff"/>' +
    "</svg>";

  function formatChatTime(d) {
    var t = d || new Date();
    var h = t.getHours();
    var m = t.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function hideTyping() {
    const row = document.getElementById("typing-row");
    if (row) row.remove();
  }

  function showTyping() {
    hideTyping();
    const el = document.createElement("div");
    el.id = "typing-row";
    el.className = "chat-msg chat-msg--bot chat-msg--typing";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="chat-msg__row">' +
      '<div class="chat-msg__avatar">' +
      BOT_AVATAR_SVG +
      "</div>" +
      '<div class="chat-msg__content">' +
      '<div class="chat-msg__bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>' +
      "</div></div>";
    chatThread.appendChild(el);
  }

  function botReply(userText) {
    const t = userText.toLowerCase();
    if (/shop open|open\?|^is my/.test(t)) {
      return (
        "Your store is **open** today with normal hours. 🟢\n\n" +
        "• 👥 **47 visitors** in the last hour\n" +
        "• 🧾 **12 new orders** since opening\n" +
        "• 💰 Average order value: **$34.50**"
      );
    }
    if (/order|today'?s/.test(t)) {
      return (
        "📋 You currently have **2 live orders** on the board (ticket 9 and 1). Want prep times or driver status next? 🚗"
      );
    }
    if (/close shop|close the shop|mark closed/.test(t)) {
      return (
        "🔒 To close for the day: Menu → **Shop status** → Mark as closed. Customers will see you offline immediately. 👋"
      );
    }
    if (/printer/.test(t)) {
      return (
        "🖨️ Add a printer from **Settings → Printers → Add device**, then pair by IP or cloud. Say “next step” if you want a walkthrough. ✨"
      );
    }
    if (/settings|open settings/.test(t)) {
      return (
        "⚙️ Use the **Settings** area from the main menu or the 3-dot menu. I can guide you to Payments, Printers, or Notifications. 💳"
      );
    }
    if (/what can you|what you do|^help/.test(t)) {
      return (
        "👋 I can check **hours** ⏰, **orders** 📦, **shop status** 🏪, and guide **printers** 🖨️, **menus** 📋, and more. What should we tackle first? 🙌"
      );
    }
    return (
      "Thanks — I’m a **demo** Foodhub Bot 🤖. Try a quick suggestion above, or ask about hours, orders, or store settings. ✨"
    );
  }

  function formatBold(s) {
    const escaped = s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function formatBotHtml(s) {
    return formatBold(s).replace(/\n/g, "<br>");
  }

  function appendUserMessage(text, timeMs) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg chat-msg--user";
    const bubble = document.createElement("div");
    bubble.className = "chat-msg__bubble";
    bubble.textContent = text;
    const meta = document.createElement("span");
    meta.className = "chat-msg__meta";
    meta.textContent = formatChatTime(timeMs != null ? new Date(timeMs) : undefined);
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    chatThread.appendChild(wrap);
  }

  function appendBotMessage(replyText, timeMs) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg chat-msg--bot";
    const row = document.createElement("div");
    row.className = "chat-msg__row";
    const avatar = document.createElement("div");
    avatar.className = "chat-msg__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.innerHTML = BOT_AVATAR_SVG;
    const content = document.createElement("div");
    content.className = "chat-msg__content";
    const bubble = document.createElement("div");
    bubble.className = "chat-msg__bubble";
    bubble.innerHTML = formatBotHtml(replyText);
    const meta = document.createElement("span");
    meta.className = "chat-msg__meta";
    meta.textContent = formatChatTime(timeMs != null ? new Date(timeMs) : undefined);
    content.appendChild(bubble);
    content.appendChild(meta);
    row.appendChild(avatar);
    row.appendChild(content);
    wrap.appendChild(row);
    chatThread.appendChild(wrap);
  }

  function renderThreadFromSession(session) {
    if (!chatThread || !session || !session.messages) return;
    chatThread.innerHTML = "";
    hideTyping();
    setBrandTyping(false);
    sending = false;
    for (var i = 0; i < session.messages.length; i++) {
      var m = session.messages[i];
      if (m.role === "user") appendUserMessage(m.text, m.at);
      else appendBotMessage(m.text, m.at);
    }
    if (session.messages.length > 0) fusionModal.classList.add("has-chat");
    else fusionModal.classList.remove("has-chat");
    scrollChatDown();
  }

  function initPersistedChat() {
    try {
      var raw = localStorage.getItem(STORAGE_CHAT);
      if (!raw) {
        renderDrawerList();
        return;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.sessions)) {
        renderDrawerList();
        return;
      }
      chatState.sessions = parsed.sessions;
      activeSessionId = parsed.activeId || null;
      chatState.activeId = activeSessionId;
      if (activeSessionId) {
        var s = findSession(activeSessionId);
        if (s && s.messages && s.messages.length > 0) {
          renderThreadFromSession(s);
        }
      }
    } catch {
      /* ignore */
    }
    renderDrawerList();
  }

  function sendMessage(raw) {
    const text = (raw || "").trim();
    if (!text || sending) return;
    sending = true;
    var session = getOrCreateSessionForSend(text);
    appendUserMessage(text);
    session.messages.push({ role: "user", text: text, at: Date.now() });
    session.updatedAt = Date.now();
    saveChatState();
    renderDrawerList();
    chatInput.value = "";
    syncChatInputHeight();
    fusionModal.classList.add("has-chat");
    scrollChatDown();
    showTyping();
    setBrandTyping(true);
    const delay = 750 + Math.random() * 650;
    setTimeout(function () {
      hideTyping();
      var reply = botReply(text);
      appendBotMessage(reply);
      session.messages.push({ role: "bot", text: reply, at: Date.now() });
      session.updatedAt = Date.now();
      saveChatState();
      renderDrawerList();
      setBrandTyping(false);
      sending = false;
      scrollChatDown();
    }, delay);
  }

  function resetChat() {
    if (chatThread) chatThread.innerHTML = "";
    fusionModal.classList.remove("has-chat");
    activeSessionId = null;
    chatState.activeId = null;
    saveChatState();
    renderDrawerList();
    if (chatInput) chatInput.value = "";
    syncChatInputHeight();
    hideTyping();
    setBrandTyping(false);
    sending = false;
  }

  if (btnBotMenu) {
    btnBotMenu.addEventListener("click", function () {
      if (botDrawerRoot && botDrawerRoot.classList.contains("is-open")) {
        closeBotDrawer();
      } else {
        openBotDrawer();
      }
    });
  }

  if (botDrawerBackdrop) {
    botDrawerBackdrop.addEventListener("click", function () {
      closeBotDrawer();
    });
  }

  if (drawerBtnNew) {
    drawerBtnNew.addEventListener("click", function () {
      resetChat();
      closeBotDrawer();
      showToast("Started a new conversation.");
      if (chatInput) chatInput.focus();
    });
  }

  var drawerBtnClose = document.getElementById("drawer-btn-close");
  if (drawerBtnClose) {
    drawerBtnClose.addEventListener("click", function () {
      closeBotDrawer();
    });
  }

  if (drawerConversationList) {
    drawerConversationList.addEventListener("click", function (e) {
      var btn = e.target.closest(".bot-drawer__item");
      if (!btn) return;
      var id = btn.getAttribute("data-session-id");
      if (!id) return;
      var session = findSession(id);
      if (!session) return;
      activeSessionId = id;
      chatState.activeId = id;
      saveChatState();
      renderThreadFromSession(session);
      renderDrawerList();
      closeBotDrawer();
      if (chatInput) chatInput.focus();
    });
  }

  initPersistedChat();

  chips.addEventListener("click", function (e) {
    const btn = e.target.closest(".chip");
    if (!btn || !modalRoot.contains(btn)) return;
    btn.classList.add("is-sending");
    const text = btn.getAttribute("data-text") || btn.textContent.trim();
    setTimeout(function () {
      btn.classList.remove("is-sending");
    }, 450);
    sendMessage(text);
  });

  if (chatInput) {
    chatInput.addEventListener("input", syncChatInputHeight);
    syncChatInputHeight();
    chatInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      sendMessage(chatInput.value);
    });
  }

  if (btnNewChat) {
    btnNewChat.addEventListener("click", function () {
      resetChat();
      showToast("Started a new conversation.");
      if (chatInput) chatInput.focus();
    });
  }

  if (btnAttach && inputRow) {
    btnAttach.addEventListener("click", function () {
      inputRow.classList.add("has-attach-pulse");
      showToast("Attachment picker opens here in the full app.");
      setTimeout(function () {
        inputRow.classList.remove("has-attach-pulse");
      }, 1400);
    });
  }

  if (btnMic && inputRow) {
    btnMic.addEventListener("click", function () {
      if (inputRow.classList.contains("is-listening")) return;
      inputRow.classList.add("is-listening");
      showToast("Listening… speak your question (demo).");
      setTimeout(function () {
        inputRow.classList.remove("is-listening");
        showToast("Demo mode: connect speech-to-text in production.");
      }, 2800);
    });
  }
})();
