<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import CubeLoader from './CubeLoader.vue';
import TypewriterText from './TypewriterText.vue';

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  themeColor: {
    type: String,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'newChat', 'typing']);

const handleTyping = (isTyping) => {
    emit('typing', isTyping);
};

const messagesContainer = ref(null);
const isUserAtBottom = ref(true);
let observer = null;

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

const handleScroll = () => {
    if (!messagesContainer.value) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
    // Check if user is near bottom (within 50px)
    isUserAtBottom.value = scrollHeight - scrollTop - clientHeight < 50;
};

// Watch for new messages to force scroll
watch(() => props.messages.length, async () => {
    await nextTick();
    scrollToBottom();
    isUserAtBottom.value = true;
});

// Watch for loading state changes
watch(() => props.isLoading, async (newVal) => {
    if (newVal) {
        await nextTick();
        scrollToBottom();
        isUserAtBottom.value = true;
    }
});

onMounted(() => {
    // Observe changes in the container (e.g., typing effect growing height)
    if (messagesContainer.value) {
        observer = new MutationObserver(() => {
            if (isUserAtBottom.value) {
                scrollToBottom();
            }
        });
        
        observer.observe(messagesContainer.value, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Initial scroll
        scrollToBottom();
    }
});

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<template>
  <div class="flex-1 flex flex-col bg-gray-50 overflow-hidden">
    <!-- Header -->
    <div class="relative z-10 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shadow-sm shrink-0">
      <button 
          @click="$emit('close')" 
          class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none cursor-pointer"
          aria-label="Collapse chat"
      >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
      </button>
      
      <h2 class="text-sm font-semibold text-gray-800">AI Assistant</h2>
      
      <button 
          @click="$emit('newChat')" 
          class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none cursor-pointer"
          aria-label="New chat"
      >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
      </button>
    </div>

    <!-- Messages List -->
    <div 
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        @scroll="handleScroll"
    >
      <div v-for="msg in messages" :key="msg.id" class="flex flex-col w-full" :class="msg.isUser ? 'items-end' : 'items-start'">
        
        <!-- User Message -->
        <div v-if="msg.isUser" class="max-w-[85%] flex justify-end">
           <div 
              class="py-3 px-5 text-sm leading-relaxed text-white rounded-md rounded-br-none shadow-md"
              :style="{ backgroundColor: themeColor }"
           >
              {{ msg.text }}
           </div>
        </div>

        <!-- Bot Message -->
        <div v-else class="max-w-[90%] w-full flex gap-3">
           <!-- Bot Avatar (Square) -->
           <div class="w-8 h-8 shrink-0 shadow-sm" :style="{ backgroundColor: themeColor }"></div>
           
           <!-- Bot Bubble -->
           <div class="flex flex-col gap-1 w-full">
               <div class="py-1 px-0 text-sm leading-relaxed text-gray-800">
                  <TypewriterText 
                    :text="msg.text" 
                    :skip-animation="msg.skipAnimation"
                    @typing="handleTyping" 
                    @complete="$emit('messageComplete', msg.id)"
                  />
               </div>
               <div 
                   v-if="msg.skipAnimation" 
                   class="text-[10px] text-gray-400 mt-1 leading-tight fade-in"
               >
                   AI Assistant may make mistakes.<br>Please verify from trusted sources.
               </div>
           </div>
        </div>

      </div>

      <!-- Loading Indicator (Pending Message) -->
      <div v-if="isLoading" class="max-w-[90%] w-full flex gap-3">
           <!-- Loader as Avatar -->
           <div class="w-8 h-8 shrink-0 flex items-center justify-center">
                <CubeLoader />
           </div>
           
           <!-- Thinking Bubble -->
           <div class="flex flex-col gap-1 justify-center">
               <div class="py-3 px-0 text-sm leading-relaxed italic shiny-text font-medium">
                  Thinking...
               </div>
           </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shiny-text {
  background: linear-gradient(90deg, #E3572A 0%, #ffb088 50%, #E3572A 100%);
  background-size: 200% auto;
  color: #E3572A;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 1s linear infinite;
}

@keyframes shine {
  to {
    background-position: 200% center;
  }
}

/* Custom Scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: v-bind(themeColor);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #c54e26; /* Keep hover darker or calculate it if possible, but hardcode is acceptable for hover state complexity */
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
