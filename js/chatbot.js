/**
 * nue — nueCredit AI Chat Widget
 * Drop-in chatbot for all pages.
 */
(function () {
  'use strict';

  /* ── Inject Styles ────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = `
    /* Bubble */
    .nue-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #008601, #00A651);
      box-shadow: 0 4px 20px rgba(0,134,1,.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .2s, box-shadow .2s;
      border: none;
      outline: none;
    }
    .nue-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0,134,1,.45);
    }
    .nue-bubble svg { width: 28px; height: 28px; fill: #fff; }
    .nue-bubble .nue-close { display: none; }
    .nue-bubble.open .nue-chat-icon { display: none; }
    .nue-bubble.open .nue-close { display: block; }

    /* Unread dot */
    .nue-unread {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #D32F2F;
      border: 2px solid #fff;
      display: none;
    }
    .nue-unread.show { display: block; }

    /* Panel */
    .nue-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      z-index: 9998;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 140px);
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: 'DM Sans', -apple-system, sans-serif;
    }
    .nue-panel.open {
      display: flex;
      animation: nueSlideUp .3s ease;
    }
    @keyframes nueSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .nue-header {
      background: linear-gradient(135deg, #0A0A0A, #1a2a1a);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .nue-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #008601, #00A651);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Sora', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    .nue-header-info { flex: 1; }
    .nue-header-name {
      font-family: 'Sora', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .nue-header-status {
      font-size: 12px;
      color: rgba(255,255,255,.5);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .nue-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00A651;
      animation: nuePulse 2s infinite;
    }
    @keyframes nuePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .4; }
    }

    /* Messages area */
    .nue-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F5F7F4;
    }
    .nue-messages::-webkit-scrollbar { width: 4px; }
    .nue-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

    .nue-msg {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.55;
      word-wrap: break-word;
    }
    .nue-msg.bot {
      background: #fff;
      color: #1A1A1A;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .nue-msg.user {
      background: #008601;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    /* Typing indicator */
    .nue-typing {
      display: none;
      align-self: flex-start;
      padding: 12px 18px;
      background: #fff;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .nue-typing.show { display: flex; gap: 5px; align-items: center; }
    .nue-typing span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #aaa;
      animation: nueBounce 1.4s infinite;
    }
    .nue-typing span:nth-child(2) { animation-delay: .2s; }
    .nue-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes nueBounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-5px); }
    }

    /* Input area */
    .nue-input-area {
      padding: 12px 16px;
      background: #fff;
      border-top: 1px solid #E8E8E8;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .nue-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #E8E8E8;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      color: #1A1A1A;
      outline: none;
      transition: border-color .2s;
      background: #F5F7F4;
    }
    .nue-input:focus { border-color: #008601; }
    .nue-input::placeholder { color: #909090; }
    .nue-send {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #008601;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background .2s;
      flex-shrink: 0;
    }
    .nue-send:hover { background: #007301; }
    .nue-send:disabled { opacity: .5; cursor: not-allowed; }
    .nue-send svg { width: 18px; height: 18px; fill: #fff; }

    /* Quick actions */
    .nue-quick {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      padding: 0 16px 12px;
      background: #F5F7F4;
    }
    .nue-quick button {
      padding: 6px 14px;
      border: 1px solid #E8E8E8;
      border-radius: 100px;
      background: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      color: #5A5A5A;
      cursor: pointer;
      transition: all .2s;
    }
    .nue-quick button:hover {
      border-color: #008601;
      color: #008601;
      background: rgba(0,134,1,.04);
    }

    /* Powered-by */
    .nue-powered {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: #909090;
      background: #fff;
    }

    /* Mobile responsive */
    @media (max-width: 500px) {
      .nue-panel {
        bottom: 0;
        right: 0;
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
      .nue-bubble.open { display: none; }
      .nue-header { padding: 16px; }
      .nue-close-mobile {
        display: block !important;
        margin-left: auto;
        background: none;
        border: none;
        color: rgba(255,255,255,.6);
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
      }
    }
    @media (min-width: 501px) {
      .nue-close-mobile { display: none !important; }
    }
  `;
  document.head.appendChild(css);

  /* ── Build DOM ────────────────────────────────── */

  /* Chat bubble */
  var bubble = document.createElement('button');
  bubble.className = 'nue-bubble';
  bubble.setAttribute('aria-label', 'Chat with nue');
  bubble.innerHTML = `
    <svg class="nue-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>
    <svg class="nue-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    <div class="nue-unread show"></div>
  `;

  /* Chat panel */
  var panel = document.createElement('div');
  panel.className = 'nue-panel';
  panel.innerHTML = `
    <div class="nue-header">
      <div class="nue-avatar">n</div>
      <div class="nue-header-info">
        <div class="nue-header-name">nue</div>
        <div class="nue-header-status"><span class="nue-status-dot"></span> nueCredit AI Assistant</div>
      </div>
      <button class="nue-close-mobile" aria-label="Close chat">&times;</button>
    </div>
    <div class="nue-messages" id="nueMessages">
      <div class="nue-msg bot">Hi! I'm <strong>nue</strong>, nueCredit's AI assistant. I can help you understand credit restoration, explore our services, or answer any questions. What can I help you with?</div>
    </div>
    <div class="nue-quick" id="nueQuick">
      <button data-q="How does credit restoration work?">How it works</button>
      <button data-q="What are your pricing plans?">Pricing</button>
      <button data-q="What free tools do you offer?">Free tools</button>
      <button data-q="How do I get started?">Get started</button>
    </div>
    <div class="nue-input-area">
      <input class="nue-input" id="nueInput" type="text" placeholder="Ask nue anything..." maxlength="500" autocomplete="off">
      <button class="nue-send" id="nueSend" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
    <div class="nue-powered">Powered by nueCredit AI</div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  /* ── State ──────────────────────────────────── */
  var isOpen = false;
  var isSending = false;
  var history = [];

  /* ── Elements ──────────────────────────────── */
  var messagesEl = document.getElementById('nueMessages');
  var inputEl = document.getElementById('nueInput');
  var sendBtn = document.getElementById('nueSend');
  var quickEl = document.getElementById('nueQuick');
  var unreadDot = bubble.querySelector('.nue-unread');
  var closeMobile = panel.querySelector('.nue-close-mobile');

  /* ── Toggle Chat ──────────────────────────── */
  function toggleChat() {
    isOpen = !isOpen;
    bubble.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      unreadDot.classList.remove('show');
      setTimeout(function () { inputEl.focus(); }, 100);
    }
  }

  bubble.addEventListener('click', toggleChat);
  closeMobile.addEventListener('click', toggleChat);

  /* ── Quick Action Buttons ─────────────────── */
  quickEl.addEventListener('click', function (e) {
    e.stopPropagation();
    var btn = e.target.closest('button[data-q]');
    if (btn && isOpen) sendMessage(btn.getAttribute('data-q'));
  });

  /* ── Send Message ─────────────────────────── */
  function sendMessage(text) {
    if (isSending || !text || !text.trim()) return;
    text = text.trim();
    isSending = true;
    sendBtn.disabled = true;

    /* Hide quick actions after first message */
    quickEl.style.display = 'none';

    /* Add user message */
    appendMessage('user', text);
    history.push({ role: 'user', content: text });
    inputEl.value = '';

    /* Show typing */
    var typing = document.createElement('div');
    typing.className = 'nue-typing show';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    scrollToBottom();

    /* API call */
    fetch('/api/ai/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        typing.remove();
        var reply = data.reply || data.error || "Sorry, I couldn't process that. Try again!";
        appendMessage('bot', reply);
        history.push({ role: 'assistant', content: reply });
        isSending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      })
      .catch(function () {
        typing.remove();
        var errorDiv = document.createElement('div');
        errorDiv.className = 'nue-msg bot';
        errorDiv.innerHTML = "I'm having trouble connecting right now. Please try again in a moment, or visit our <a href='/pages/contact.html' style='color:#008601;text-decoration:underline;'>contact page</a> for help.";
        messagesEl.appendChild(errorDiv);
        scrollToBottom();
        isSending = false;
        sendBtn.disabled = false;
      });
  }

  /* ── Append Message ───────────────────────── */
  function appendMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'nue-msg ' + (role === 'user' ? 'user' : 'bot');
    /* Allow links in bot messages */
    if (role === 'bot') {
      div.innerHTML = formatLinks(text);
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  /* ── Format Links in Text ─────────────────── */
  function formatLinks(text) {
    /* Escape HTML first */
    var div = document.createElement('div');
    div.textContent = text;
    var escaped = div.innerHTML;
    /* Convert markdown-style links [text](url) */
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#008601;text-decoration:underline;">$1</a>');
    /* Bold text */
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return escaped;
  }

  /* ── Scroll to Bottom ─────────────────────── */
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ── Input Events ─────────────────────────── */
  sendBtn.addEventListener('click', function () {
    sendMessage(inputEl.value);
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  /* ── Auto-open after delay on first visit ── */
  var hasOpened = sessionStorage.getItem('nue_opened');
  if (!hasOpened) {
    setTimeout(function () {
      if (!isOpen) {
        unreadDot.classList.add('show');
      }
    }, 3000);
  }
})();
