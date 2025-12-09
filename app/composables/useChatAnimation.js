import gsap from 'gsap';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

export const useChatAnimation = () => {
    let duration = 0.5;
    const isOpen = ref(false);
    const showChatWindow = ref(false);

    // Configuration for responsive styles
    const getTargetStyles = () => {
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            return {
                x: 0,
                width: '100vw',
                height: '100dvh', // Use dynamic viewport height for mobile
                bottom: 0,
                right: 0,
                borderTopRightRadius: '0px',
                borderTopLeftRadius: '0px',
                borderBottomLeftRadius: '0px',
            };
        }

        return {
            x: -50,
            width: '350px',
            height: '500px',
            bottom: 0, // Keep it at bottom 0 during open state
            borderTopRightRadius: '12px',
            borderTopLeftRadius: '12px',
            borderBottomLeftRadius: '0px',
        };
    };

    const handleResize = () => {
        if (isOpen.value) {
            const target = getTargetStyles();
            gsap.to('.chat', {
                duration: 0.3, // Faster duration for resize adaptation
                width: target.width,
                height: target.height,
                x: target.x,
                borderTopRightRadius: target.borderTopRightRadius,
                borderTopLeftRadius: target.borderTopLeftRadius,
                borderBottomLeftRadius: target.borderBottomLeftRadius,
                ease: "power2.out"
            });
        }
    };

    onMounted(() => {
        window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
    });

    const openChat = (chatButtonElement) => {
        if (!chatButtonElement) return;

        const target = getTargetStyles();
        const timeline = gsap.timeline();

        timeline
            .to('.chat', {
                duration,
                bottom: 0,
                ease: "easeInOut"
            })
            .to('.chat', {
                x: target.x,
                duration,
                width: target.width,
                height: '60px', // Intermediate height
                borderTopRightRadius: target.borderTopRightRadius,
                borderTopLeftRadius: target.borderTopLeftRadius,
                borderBottomLeftRadius: target.borderBottomLeftRadius,
                ease: "easeInOut"
            }, "-=0.01")
            .to('.chat', {
                height: target.height,
                duration,
                ease: "easeInOut"
            })
            .to('.chat-logo', {
                duration,
                scale: 0,
                opacity: 0,
                ease: "easeInOut",
                onComplete: () => {
                    // Create and animate text after box expansion
                    const textElement = document.createElement('div');
                    textElement.className = 'chat-text absolute inset-0 flex items-center justify-center px-4 text-white text-sm font-medium opacity-0 overflow-hidden whitespace-nowrap';
                    textElement.textContent = 'Hello There, I am your UM6P AI assistant';
                    chatButtonElement.appendChild(textElement);

                    const textTimeline = gsap.timeline({
                        onComplete: () => {
                            textElement.remove();
                            showChatWindow.value = true;

                            nextTick(() => {
                                gsap.fromTo('.chat-window',
                                    { opacity: 0, scale: 0.9 },
                                    {
                                        duration,
                                        opacity: 1,
                                        scale: 1,
                                        ease: "easeInOut"
                                    }
                                );
                            });
                        }
                    });

                    textTimeline
                        .to(textElement, {
                            duration,
                            opacity: 1,
                            ease: "easeInOut"
                        })
                        .to(textElement, {
                            duration: duration * 2, // Hold
                        })
                        .to(textElement, {
                            duration,
                            opacity: 0,
                            ease: "easeInOut"
                        });
                }
            });

        isOpen.value = true;
    }

    const closeChat = (chatButtonElement) => {
        if (!chatButtonElement) return;

        showChatWindow.value = false;

        // Create goodbye text immediately
        const textElement = document.createElement('div');
        textElement.className = 'chat-text absolute inset-0 flex items-center justify-center px-4 text-white text-lg font-medium z-10 opacity-0';
        textElement.textContent = "Goodbye, have a nice day!";
        chatButtonElement.appendChild(textElement);

        const closeTimeline = gsap.timeline({
            onComplete: () => {
                textElement.remove();
                isOpen.value = false;
            }
        });

        closeTimeline
            .to(textElement, {
                duration,
                opacity: 1,
                ease: "easeInOut"
            })
            .to(textElement, {
                duration: duration * 2, // Hold
            })
            .to(textElement, {
                duration,
                opacity: 0,
                ease: "easeInOut"
            })
            .to('.chat', {
                height: '60px',
                duration,
                ease: "easeInOut"
            })
            .to('.chat', {
                x: 0,
                duration,
                width: '60px',
                height: '58px',
                borderTopRightRadius: '0px',
                borderTopLeftRadius: '30px',
                borderBottomLeftRadius: '30px',
                ease: "easeInOut"
            }, "-=0.01")
            .to('.chat', {
                duration,
                bottom: '20px',
                ease: "easeInOut",
            })
            .to('.chat-logo', {
                duration,
                scale: 1,
                opacity: 1,
                ease: "easeInOut"
            });
    }

    return {
        isOpen,
        showChatWindow,
        openChat,
        closeChat
    };
};
