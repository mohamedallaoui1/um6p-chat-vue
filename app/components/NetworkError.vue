<template>
  <div class="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-white">
    <!-- Cute Sad Face SVG -->
    <svg class="w-20 h-20 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
    
    <div class="space-y-2">
        <h3 class="text-lg font-semibold text-gray-700">Oops! Connection Lost</h3>
        <p class="text-sm text-gray-500 max-w-[220px] mx-auto leading-relaxed">
        The chatbot is currently taking a nap. Please come back later!
        </p>
    </div>
    
    <button 
        @click="$emit('retry')" 
        class="mt-4 px-6 py-2 bg-[#E3572A] hover:bg-[#c54e26] text-white text-sm font-medium rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E3572A]/50 cursor-pointer"
    >
        Try Again
    </button>
  </div>
</template>

<script setup>
defineEmits(['retry']);
</script>
