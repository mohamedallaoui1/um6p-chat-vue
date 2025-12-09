<script setup>
import { ref } from 'vue';
import ThreeScene from './ThreeScene.vue';
import MessageWindow from './MessageWindow.vue';
import CleverlyticsLogo from '@/assets/logo/CleverlyticsLogoWhite.png';

const emit = defineEmits(['close']);

const isChatting = ref(false);
const inputValue = ref('');
const messages = ref([]);

const THEME_COLOR = '#e3572a';

const suggestions = [
  "What academic programs does UM6P offer?",
  "How can I apply to UM6P?",
  "What research opportunities are available?"
];

const handleClose = () => {
  emit('close');
};

const isLoading = ref(false);
const conversationId = ref(null);

const initConversation = async () => {
  try {
    const response = await fetch('https://um6p.cleverlytics.com/api/conversation/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    if (data.status === 'success') {
      conversationId.value = data.conversation_id;
    }
  } catch (error) {
    console.error('Failed to initialize conversation:', error);
  }
};

// Initialize on mount
import { onMounted } from 'vue';
onMounted(() => {
  initConversation();
});

const startChat = async (message) => {
  if (!message.trim()) return;
  
  isChatting.value = true;
  messages.value.push({
    id: Date.now(),
    text: message,
    isUser: true,
    skipAnimation: true
  });
  
  inputValue.value = '';
  isLoading.value = true;

  try {
    // Ensure conversation is initialized
    if (!conversationId.value) {
        await initConversation();
    }

    const response = await fetch('https://um6p.cleverlytics.com/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: message,
        conversation_id: conversationId.value
      })
    });
    
    const data = await response.json();
    
    // Set typing to true immediately to prevent input gap
    isTyping.value = true;
    isLoading.value = false;
    
    if (data.status === 'success') {
        messages.value.push({
          id: Date.now() + 1,
          text: data.response,
          isUser: false,
          skipAnimation: false
        });
    } else {
        // Handle error gracefully
        messages.value.push({
          id: Date.now() + 1,
          text: "Sorry, I encountered an error processing your request.",
          isUser: false,
          skipAnimation: true
        });
    }
  } catch (error) {
    console.error('Chat error:', error);
    isLoading.value = false;
    messages.value.push({
      id: Date.now() + 1,
      text: "Sorry, I'm having trouble connecting to the server.",
      isUser: false,
      skipAnimation: true
    });
  }
};

const handleSuggestionClick = (suggestion) => {
  startChat(suggestion);
};

const handleSubmit = () => {
  startChat(inputValue.value);
};

const isTyping = ref(false);

const handleTyping = (status) => {
    isTyping.value = status;
};

const handleMessageComplete = (messageId) => {
    const message = messages.value.find(m => m.id === messageId);
    if (message) {
        message.skipAnimation = true;
    }
};

const handleNewChat = () => {
  isChatting.value = false;
  messages.value = [];
  inputValue.value = '';
  isLoading.value = false;
  isTyping.value = false;
  // Re-initialize conversation for a fresh context
  initConversation();
};
</script>

<template>
  <div class="chat-window flex flex-col w-full h-full bg-white overflow-hidden cursor-default" @click.stop>
    
    <!-- Global Collapse Button -->
    <button 
        @click="handleClose" 
        class="absolute top-2 right-2 md:top-4 md:left-4 z-50 p-2 md:p-2 bg-gray-800/80 text-white hover:bg-gray-800 rounded-full transition-colors focus:outline-none cursor-pointer shadow-lg"  
        aria-label="Collapse chat"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    </button>

    <!-- Landing View -->
    <div v-if="!isChatting" class="flex-1 flex flex-col overflow-y-auto bg-white no-scrollbar">
      <!-- Hero Section (3D Scene) -->
      <div class="h-[45%] md:h-[55%] relative flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-all duration-300">
        <div class="absolute inset-0">
            <ThreeScene class="absolute inset-0 w-full h-full" />
        </div>
      </div>

      <!-- Suggestions Section -->
      <div class="flex-1 px-2 py-2 flex flex-col items-center gap-2 mx-1">
        <h3 class="text-gray-500 text-xs font-medium mb-2">Try asking me about UM6P:</h3>
        
        <div class="w-full space-y-2">
          <button 
            v-for="suggestion in suggestions" 
            :key="suggestion"
            @click="handleSuggestionClick(suggestion)"
            class="w-full text-left px-5 py-3 md:py-2 rounded-xl text-white text-sm md:text-xs font-medium flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            :style="{ backgroundColor: THEME_COLOR }"
          >
            {{ suggestion }}
            <svg class="w-4 h-4 text-white/80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div class="mt-2 pb-2 text-gray-400 text-xs">
            Or type your own question below
        </div>
      </div>
    </div>

    <!-- Messaging View -->
    <MessageWindow 
      v-else 
      :messages="messages" 
      :is-loading="isLoading"
      :theme-color="THEME_COLOR" 
      @close="handleClose" 
      @new-chat="handleNewChat" 
      @typing="handleTyping"
      @message-complete="handleMessageComplete"
    />

    <!-- Input Area & Footer -->
    <div class="p-2 rounded-t-lg" :style="{ backgroundColor: THEME_COLOR }">
      <div class="flex items-center gap-1 mb-1">
        <input 
          v-model="inputValue"
          @keyup.enter="!isLoading && !isTyping ? handleSubmit() : null"
          type="text" 
          :placeholder="isTyping ? 'AI is typing...' : 'Talk with AI Assistant . . .'" 
          class="flex-1 px-4 py-3 bg-white rounded-lg text-sm text-gray-800 focus:outline-none placeholder-gray-400 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          :disabled="isLoading || isTyping"
        />
        <button 
            @click="handleSubmit"
            class="p-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="!inputValue.trim() || isLoading || isTyping"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      
      <!-- Footer -->
      <div class="flex items-center justify-center gap-2 text-white/90 text-[8px]">
        <span>Developed by</span>
        <img :src="CleverlyticsLogo" alt="Cleverlytics" class="h-4 object-contain" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-window {
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* Custom Scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
