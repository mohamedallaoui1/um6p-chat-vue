import { ref } from 'vue';
import { APP_CONSTANTS } from '@/utils/constants';

export const useChatApi = () => {
    const isLoading = ref(false);
    const conversationId = ref(null);
    const isNetworkError = ref(false);
    const messages = ref([]);

    const initConversation = async () => {
        isNetworkError.value = false;
        try {
            const response = await fetch(`${APP_CONSTANTS.API.BASE_URL}${APP_CONSTANTS.API.ENDPOINTS.INITIALIZE}`, {
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
            isNetworkError.value = true;
        }
    };

    const sendMessage = async (message) => {
        if (!message.trim()) return;

        // Add user message
        messages.value.push({
            id: Date.now(),
            text: message,
            isUser: true,
            skipAnimation: true
        });

        isLoading.value = true;

        try {
            // Ensure conversation is initialized
            if (!conversationId.value) {
                await initConversation();
                if (isNetworkError.value) {
                    isLoading.value = false;
                    return;
                }
            }

            const response = await fetch(`${APP_CONSTANTS.API.BASE_URL}${APP_CONSTANTS.API.ENDPOINTS.QUERY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: message,
                    conversation_id: conversationId.value
                })
            });

            const data = await response.json();
            isLoading.value = false;

            if (data.status === 'success') {
                messages.value.push({
                    id: Date.now() + 1,
                    text: data.response,
                    isUser: false,
                    skipAnimation: false
                });
            } else {
                messages.value.push({
                    id: Date.now() + 1,
                    text: APP_CONSTANTS.MESSAGES.ERROR.GENERIC,
                    isUser: false,
                    skipAnimation: true
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            isLoading.value = false;

            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
                isNetworkError.value = true;
            } else {
                messages.value.push({
                    id: Date.now() + 1,
                    text: APP_CONSTANTS.MESSAGES.ERROR.NETWORK,
                    isUser: false,
                    skipAnimation: true
                });
            }
        }
    };

    const resetChat = () => {
        messages.value = [];
        isLoading.value = false;
        initConversation();
    };

    return {
        isLoading,
        conversationId,
        isNetworkError,
        messages,
        initConversation,
        sendMessage,
        resetChat
    };
};
