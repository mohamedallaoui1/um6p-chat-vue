import { ref, watch, onUnmounted } from 'vue';
import gsap from 'gsap';

/**
 * GSAP-powered typewriter composable
 * @param {Ref<string>} text - The text to animate
 * @param {number} speed - Characters per second
 * @param {boolean} skipAnimation - Skip animation and show all text immediately
 * @returns {Object} - Returns displayedText ref and isTyping status
 */
export const useTypewriter = (text, speed = 50, skipAnimation = false) => {
    const displayedText = ref('');
    const isTyping = ref(false);
    let tweenInstance = null;

    const clearAnimation = () => {
        if (tweenInstance) {
            tweenInstance.kill();
            tweenInstance = null;
        }
    };

    const animateText = () => {
        clearAnimation();

        const targetText = text.value || '';

        // Skip animation if requested
        if (skipAnimation) {
            displayedText.value = targetText;
            isTyping.value = false;
            return;
        }

        // Reset
        displayedText.value = '';
        isTyping.value = true;

        // Use GSAP to animate a counter from 0 to text length
        const textLength = targetText.length;
        const counter = { value: 0 };

        tweenInstance = gsap.to(counter, {
            value: textLength,
            duration: textLength / speed, // Duration based on speed (chars per second)
            ease: 'none', // Linear progression for typewriter effect
            onUpdate: () => {
                const currentLength = Math.floor(counter.value);
                displayedText.value = targetText.substring(0, currentLength);
            },
            onComplete: () => {
                displayedText.value = targetText; // Ensure we show the full text
                isTyping.value = false;
            }
        });
    };

    // Watch for text changes and trigger animation
    watch(text, animateText, { immediate: true });

    // Cleanup on unmount
    onUnmounted(() => {
        clearAnimation();
    });

    return {
        displayedText,
        isTyping
    };
};
