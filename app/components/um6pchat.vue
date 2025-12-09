<script setup>
import ChatWindow from './ChatWindow.vue';
import { ref } from 'vue';
import { useChatAnimation } from '@/composables/useChatAnimation';

const chatButton = ref(null);
const { isOpen, showChatWindow, openChat, closeChat } = useChatAnimation();

</script>

<template>
    <div
        ref="chatButton"
        @click="!isOpen ? openChat(chatButton) : null"
        class="chat absolute bottom-5 right-0 bg-[#E3572A] w-[60px] h-[58px] rounded-tl-[30px] rounded-bl-[30px] flex items-center justify-center cursor-pointer">
        <img src="@/assets/logo/chat-logo.svg" alt="chat-logo" class="chat-logo">
        <ChatWindow 
            v-if="showChatWindow" 
            class="chat-window absolute inset-0" 
            @close="closeChat(chatButton)"
        />
</div>
</template>