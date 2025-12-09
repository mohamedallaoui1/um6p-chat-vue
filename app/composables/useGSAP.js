import { gsap } from 'gsap';
import { onMounted, onUnmounted, ref } from 'vue';

export function useGSAP(animationCallback, dependencies = []) {
  const context = ref(null);
  const isReady = ref(false);

  onMounted(() => {
    // Create GSAP context for cleanup
    context.value = gsap.context(() => {
      if (typeof animationCallback === 'function') {
        animationCallback();
      }
    });
    
    isReady.value = true;
  });

  onUnmounted(() => {
    // Clean up GSAP animations
    if (context.value) {
      context.value.revert();
    }
  });

  // Helper functions
  const animate = (target, vars) => {
    return gsap.to(target, vars);
  };

  const animateFrom = (target, vars) => {
    return gsap.from(target, vars);
  };

  const animateFromTo = (target, fromVars, toVars) => {
    return gsap.fromTo(target, fromVars, toVars);
  };

  const timeline = (vars) => {
    return gsap.timeline(vars);
  };

  const set = (target, vars) => {
    return gsap.set(target, vars);
  };

  return {
    gsap,
    context,
    isReady,
    animate,
    animateFrom,
    animateFromTo,
    timeline,
    set
  };
}

// Specific animation presets
export function useFadeIn(target, duration = 0.5, delay = 0) {
  return useGSAP(() => {
    gsap.fromTo(target.value, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, delay, ease: "power2.out" }
    );
  });
}

export function useSlideIn(target, direction = 'left', duration = 0.5, delay = 0) {
  const directions = {
    left: { x: -100 },
    right: { x: 100 },
    up: { y: -100 },
    down: { y: 100 }
  };

  return useGSAP(() => {
    gsap.fromTo(target.value,
      { ...directions[direction], opacity: 0 },
      { x: 0, y: 0, opacity: 1, duration, delay, ease: "power2.out" }
    );
  });
}

export function useScale(target, scale = 1.1, duration = 0.3) {
  return useGSAP(() => {
    const element = target.value;
    
    const handleMouseEnter = () => {
      gsap.to(element, { scale, duration, ease: "power2.out" });
    };
    
    const handleMouseLeave = () => {
      gsap.to(element, { scale: 1, duration, ease: "power2.out" });
    };
    
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  });
}
