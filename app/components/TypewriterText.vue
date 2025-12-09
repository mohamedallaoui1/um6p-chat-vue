<script setup>
import { ref, watch, onUnmounted, h } from 'vue';
import gsap from 'gsap';
import { formatMessageText } from '@/utils/formatMessage';

const props = defineProps({
    text: {
        type: String,
        required: true,
        default: ''
    },
    speed: {
        type: Number,
        default: 0.015
    },
    isUserMessage: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['complete', 'typing']);

const displayedText = ref('');
const isComplete = ref(false);
let timelineRef = null;
const currentIndex = { current: 0 };

const startTyping = () => {
    if (!props.text) return;

    // Kill any existing animation
    if (timelineRef) {
        timelineRef.kill();
    }

    // Reset
    currentIndex.current = 0;
    displayedText.value = '';
    isComplete.value = false;

    const chars = props.text.split('');
    const totalChars = chars.length;

    // Emit typing started
    emit('typing', true);

    // Create typing animation using GSAP
    timelineRef = gsap.timeline({
        onComplete: () => {
            displayedText.value = props.text; // Ensure full text is shown
            isComplete.value = true;
            emit('typing', false); // Emit typing stopped
            emit('complete');
        }
    });

    // Animate by updating displayedText at intervals
    timelineRef.to(currentIndex, {
        current: totalChars,
        duration: totalChars * props.speed,
        ease: 'none',
        onUpdate: () => {
            const index = Math.floor(currentIndex.current);
            if (index > 0 && index <= totalChars) {
                displayedText.value = chars.slice(0, index).join('');
            }
        }
    });
};

// Watch for text changes
watch(() => props.text, () => {
    startTyping();
}, { immediate: true });

// Cleanup
onUnmounted(() => {
    if (timelineRef) {
        timelineRef.kill();
    }
});
</script>

<template>
    <div style="display: inline; pointer-events: auto;">
        <component 
            v-for="(vnode, index) in formatMessageText(displayedText, isUserMessage)" 
            :key="index" 
            :is="vnode"
        />
        <span v-if="!isComplete" class="inline-block ml-0.5 animate-pulse text-[#E3572A]">▊</span>
    </div>
</template>

<style scoped>
/* Ensure links are clickable */
:deep(a) {
    pointer-events: auto;
}
</style>
