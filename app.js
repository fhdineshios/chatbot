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
  const MOVE_THRESHOLD = 8;

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

  function clampModalToViewport() {
    if (!fusionModal) return;
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
      clampModalToViewport();
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
      '<div class="chat-msg__bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    chatThread.appendChild(el);
  }

  function botReply(userText) {
    const t = userText.toLowerCase();
    if (/shop open|open\?|^is my/.test(t)) {
      return "Your test store is scheduled **open today** (11:00–22:00). You can change hours under Restaurant → Opening times.";
    }
    if (/order|today'?s/.test(t)) {
      return "You currently have **2 live orders** on the board (ticket 9 and 1). Want prep times or driver status next?";
    }
    if (/close shop|close the shop|mark closed/.test(t)) {
      return "To close for the day: Menu → **Shop status** → Mark as closed. Customers will see you offline immediately.";
    }
    if (/printer/.test(t)) {
      return "Add a printer from **Settings → Printers → Add device**, then pair by IP or cloud. Say “next step” if you want a walkthrough.";
    }
    if (/settings|open settings/.test(t)) {
      return "Use the **Settings** area from the main menu or the 3-dot menu. I can guide you to Payments, Printers, or Notifications.";
    }
    if (/what can you|what you do|^help/.test(t)) {
      return "I can check **hours**, **orders**, **shop status**, and guide **printers**, **menus**, and more. What should we tackle first?";
    }
    return "Thanks — I’m a **demo** Foodhub Bot. Try a quick suggestion above, or ask about hours, orders, or store settings.";
  }

  function formatBold(s) {
    const escaped = s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function appendUserMessage(text) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg chat-msg--user";
    const bubble = document.createElement("div");
    bubble.className = "chat-msg__bubble";
    bubble.textContent = text;
    const meta = document.createElement("span");
    meta.className = "chat-msg__meta";
    meta.textContent = "You";
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    chatThread.appendChild(wrap);
  }

  function appendBotMessage(replyText) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg chat-msg--bot";
    const bubble = document.createElement("div");
    bubble.className = "chat-msg__bubble";
    bubble.innerHTML = formatBold(replyText);
    const meta = document.createElement("span");
    meta.className = "chat-msg__meta";
    meta.textContent = "Foodhub Bot";
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    chatThread.appendChild(wrap);
  }

  function sendMessage(raw) {
    const text = (raw || "").trim();
    if (!text || sending) return;
    sending = true;
    appendUserMessage(text);
    chatInput.value = "";
    syncChatInputHeight();
    fusionModal.classList.add("has-chat");
    scrollChatDown();
    showTyping();
    setBrandTyping(true);
    const delay = 750 + Math.random() * 650;
    setTimeout(function () {
      hideTyping();
      appendBotMessage(botReply(text));
      setBrandTyping(false);
      sending = false;
      scrollChatDown();
    }, delay);
  }

  function resetChat() {
    if (chatThread) chatThread.innerHTML = "";
    fusionModal.classList.remove("has-chat");
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
