<template>
  <div class="ai-wrapper">
    <!-- 1. PULSING TOGGLE BUTTON -->
    <button 
      class="ai-toggle" 
      @click="isOpen = !isOpen" 
      :class="{ 'active': isOpen }"
      aria-label="Toggle AI Assistant"
    >
      <div class="glow-ring"></div>
      <span v-if="!isOpen" class="icon"><Icon name="compass" size="28" /></span>
      <span v-else class="icon"><Icon name="x" size="24" /></span>
    </button>

    <!-- 2. HIGH-END GLASSMOPHISM CHAT WINDOW -->
    <Transition name="cyber-reveal">
      <div v-if="isOpen" class="ai-container">
        <!-- Header with Glowing Status -->
        <div class="ai-header">
          <div class="header-main">
            <div class="status-indicator">
              <div class="dot"></div>
              <div class="pulse"></div>
            </div>
            <div class="title-wrap">
              <h3>Sammy's AI Guide</h3>
              <span class="v-tag">v2.0 Beta</span>
            </div>
          </div>
          <button class="clear-btn" @click="clearChat" title="Clear Conversation"><Icon name="trash" size="16" /></button>
        </div>

        <!-- Scrollable Chat Body -->
        <div class="chat-body" ref="chatBox">
          <!-- Quick Suggestion Feature -->
          <div v-if="messages.length === 1" class="quick-actions">
            <p class="hint">Try asking about:</p>
            <div class="action-grid">
              <button @click="quickAction('Top Trending')"><Icon name="flame" size="13" /> Trending</button>
              <button @click="quickAction('New Releases')"><Icon name="film" size="13" /> New</button>
              <button @click="quickAction('Report a Bug')"><Icon name="bug" size="13" /> Report Bug</button>
            </div>
          </div>

          <div v-for="(msg, index) in messages" :key="index" :class="['msg', msg.role]">
            <div class="msg-meta" v-if="msg.role === 'bot'">AI Assistant</div>
            <div class="msg-bubble">
              {{ msg.text }}
              <span class="msg-time">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Enhanced Typing Indicator -->
          <div v-if="isTyping" class="msg bot">
            <div class="msg-bubble typing-glow">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Animated Footer -->
        <div class="chat-footer">
          <div class="input-container">
            <input 
              v-model="userInput" 
              @keyup.enter="sendMessage" 
              placeholder="Query the database..." 
              type="text"
            />
            <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim()">
              <svg viewBox="0 0 24 24" class="send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import apiClient from './apiClient';

const isOpen = ref(false);
const userInput = ref('');
const isTyping = ref(false);
const chatBox = ref(null);

const messages = ref([
  { 
    role: 'bot', 
    text: 'System online. How can I assist your cinematic journey today?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
]);

const scrollToBottom = async () => {
  await nextTick();
  if (chatBox.value) {
    chatBox.value.scrollTo({
      top: chatBox.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};

const quickAction = (text) => {
  userInput.value = text;
  sendMessage();
};

const clearChat = () => {
  messages.value = [messages.value[0]];
};

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const userText = userInput.value;
  messages.value.push({ 
    role: 'user', 
    text: userText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  userInput.value = '';
  isTyping.value = true;
  await scrollToBottom();

  // Improved AI Response Logic
  setTimeout(async () => {
    isTyping.value = false;
    const response = await generateAIResponse(userText);
    messages.value.push({ 
      role: 'bot', 
      text: response,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    scrollToBottom();
  }, 1200);
};

const generateAIResponse = async (input) => {
  const history = messages.value.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.text }));
  try {
    const res = await apiClient.post('/ai/chat', { message: input, history });
    return res.data.response || 'I\'m processing your query. Please try again.';
  } catch (error) {
    console.error('AI response error:', error);
    const detail = error.response?.data?.error;
    if (detail === 'AI service not configured') {
      return 'The AI assistant is not configured yet — the site admin needs to add a Gemini API key to server/.env.';
    }
    return 'Sorry, the AI is not responding right now (server error). Ask the admin to check the Gemini API key.';
  }
};
</script>

<style scoped>
/* OKLCH color palette */
:root {
  --neon-primary: oklch(0.7 0.25 20); /* Intense Red-Orange */
  --neon-secondary: oklch(0.65 0.2 300); /* Deep Purple */
  --ai-bg: oklch(0.15 0.02 250 / 0.85);
  --glass-border: oklch(1 0 0 / 0.15);
}

.ai-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 5000;
  font-family: 'Outfit', sans-serif;
}

/* Toggle button evolution */
.ai-toggle {
  width: 65px;
  height: 65px;
  border-radius: 20px; /* Squircle shape */
  background: var(--ai-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  position: relative;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 15px 35px rgba(0,0,0,0.4);
}

.glow-ring {
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  background: linear-gradient(45deg, #ff3c00, #ff00ea, #00d4ff);
  z-index: -1;
  opacity: 0.3;
  filter: blur(8px);
  animation: rotateGlow 4s linear infinite;
}

@keyframes rotateGlow {
  to { filter: hue-rotate(360deg); }
}

.ai-toggle:hover { transform: translateY(-5px) scale(1.05); }
.ai-toggle.active { background: #ff3c00; border-radius: 50%; }

/* Container design */
.ai-container {
  position: absolute;
  bottom: 85px;
  right: 0;
  width: 360px;
  height: 520px;
  background: var(--ai-bg);
  backdrop-filter: blur(25px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6);
  transform-origin: bottom right;
}

/* Header */
.ai-header {
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--glass-border);
}

.header-main { display: flex; align-items: center; gap: 12px; }
.status-indicator { position: relative; width: 12px; height: 12px; }
.dot { width: 100%; height: 100%; background: #00ff88; border-radius: 50%; }
.pulse {
  position: absolute; inset: 0; background: #00ff88; border-radius: 50%;
  animation: ripple 2s infinite;
}

@keyframes ripple {
  from { transform: scale(1); opacity: 0.8; }
  to { transform: scale(3); opacity: 0; }
}

.title-wrap h3 { font-size: 1rem; margin: 0; color: #fff; font-weight: 700; }
.v-tag { font-size: 0.65rem; color: #888; text-transform: uppercase; letter-spacing: 1px; }

.clear-btn { background: transparent; border: none; cursor: pointer; filter: grayscale(1); transition: 0.3s; }
.clear-btn:hover { filter: grayscale(0); transform: scale(1.1); }

/* Chat area */
.chat-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  scrollbar-width: thin;
}

.quick-actions { margin-bottom: 1rem; }
.hint { font-size: 0.75rem; color: #666; margin-bottom: 0.5rem; }
.action-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.action-grid button {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  color: #bbb;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: 0.3s;
}
.action-grid button:hover { background: #ff3c00; color: white; border-color: transparent; }

.msg-meta { font-size: 0.65rem; color: #555; margin-bottom: 4px; text-transform: uppercase; font-weight: 800; }
.msg-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.9rem;
  position: relative;
  line-height: 1.5;
}

.bot .msg-bubble { 
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  color: #e0e0e0;
  border-bottom-left-radius: 4px;
}

.user .msg-bubble {
  background: var(--neon-primary);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  box-shadow: 0 10px 20px rgba(255, 60, 0, 0.2);
}

.msg-time {
  display: block; font-size: 0.6rem; margin-top: 6px; opacity: 0.5; text-align: right;
}

/* ⌨️ TYPING EFFECTS */
.typing-glow { background: rgba(0, 212, 255, 0.1) !important; border: 1px solid rgba(0, 212, 255, 0.2); }
.typing-dots span {
  display: inline-block; width: 6px; height: 6px; background: #00d4ff; 
  border-radius: 50%; margin-right: 4px; animation: wave 1.2s infinite;
}
@keyframes wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

/* ⌨️ FOOTER */
.chat-footer { padding: 1.2rem; background: rgba(0,0,0,0.2); }
.input-container {
  display: flex; background: rgba(255,255,255,0.03); border-radius: 14px;
  padding: 6px; border: 1px solid var(--glass-border);
}
.input-container input {
  flex: 1; background: transparent; border: none; color: white;
  padding: 8px 12px; outline: none; font-size: 0.9rem;
}
.send-btn {
  background: #ff3c00; border: none; border-radius: 10px;
  width: 40px; height: 40px; cursor: pointer; transition: 0.3s;
  display: flex; align-items: center; justify-content: center;
}
.send-btn:hover { background: #ff5500; transform: scale(1.1); }
.send-icon { width: 18px; fill: white; }

/* Reveal animation */
.cyber-reveal-enter-active { animation: cyber-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.cyber-reveal-leave-active { animation: cyber-in 0.3s reverse ease-in; }

@keyframes cyber-in {
  from { opacity: 0; transform: translateY(30px) scale(0.8) rotate(5deg); filter: blur(10px); }
  to { opacity: 1; transform: translateY(0) scale(1) rotate(0); filter: blur(0); }
}
</style>