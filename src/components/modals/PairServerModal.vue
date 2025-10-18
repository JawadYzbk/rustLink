<template>
  <Transition name="modal">
    <div v-if="isShowing" class="fixed z-modal inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">

        <div @click="$emit('close')" class="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm" aria-hidden="true"></div>

        <!-- Modal Content -->
        <div class="relative inline-block align-middle bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-all max-w-md w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="modal-headline">

          <!-- Close Button -->
          <button @click="$emit('close')" class="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Server Banner -->
          <div class="relative bg-gradient-to-br from-orange-400 to-red-500 w-full h-48 overflow-hidden">
            <img 
              :src="notification.img || 'images/default_server_banner.jpg'" 
              onerror="if(this.src != 'images/default_server_banner.jpg') this.src = 'images/default_server_banner.jpg';"
              class="w-full h-full object-cover"
              :alt="notification.name || 'Server Banner'"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            
            <!-- Pairing Icon -->
            <div class="absolute top-4 left-4 bg-orange-500 rounded-full p-3 shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
            </div>
          </div>

          <div class="p-6 text-white">
            <!-- Header -->
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2" id="modal-headline">
                {{ notification.name || 'Unknown Server' }}
              </h3>
              <div class="flex items-center justify-center space-x-2 text-orange-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                <span class="text-sm font-medium uppercase tracking-wide">Server Pairing Request</span>
              </div>
            </div>

            <!-- Server Info -->
            <div class="bg-gray-700 rounded-lg p-4 mb-6 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-300 text-sm">Server IP:</span>
                <span class="text-white font-mono text-sm">{{ notification.ip || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300 text-sm">Port:</span>
                <span class="text-white font-mono text-sm">{{ notification.port || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300 text-sm">Player ID:</span>
                <span class="text-white font-mono text-sm">{{ notification.playerId || 'N/A' }}</span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="notification.desc" class="bg-gray-700 rounded-lg p-4 mb-6">
              <h4 class="text-sm font-medium text-gray-300 mb-2">Description:</h4>
              <div class="text-gray-100 text-sm leading-relaxed" v-html="notification.desc.replaceAll('\\n', '<br/>')"></div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button @click="pair" type="button" class="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg">
                <div class="flex items-center justify-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  <span>Pair Server</span>
                </div>
              </button>
              <button @click="$emit('close')" type="button" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                Cancel
              </button>
            </div>

            <!-- Help Text -->
            <div class="mt-4 text-center">
              <p class="text-xs text-gray-400">
                Pairing will connect this server to your Rust+ companion app
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

.modal-enter-to .relative,
.modal-leave-from .relative {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Custom scrollbar for description */
.bg-gray-700::-webkit-scrollbar {
  width: 4px;
}

.bg-gray-700::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.5);
  border-radius: 2px;
}

.bg-gray-700::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.bg-gray-700::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* Pulse animation for pairing icon */
@keyframes pulse-orange {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(249, 115, 22, 0);
  }
}

.bg-orange-500 {
  animation: pulse-orange 2s infinite;
}

/* Hover effects */
button:hover svg {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

/* Focus states */
button:focus {
  outline: none;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .max-w-md {
    max-width: calc(100vw - 2rem);
  }
  
  .p-6 {
    padding: 1.25rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
}
</style>

<script>
export default {
  name: 'PairServerModal',
  props: {
    isShowing: Boolean,
    notification: Object,
  },
  methods: {
    pair: function() {

      // emit data in event
      this.$emit('pair', {
        id: this.notification.id,
        ip: this.notification.ip,
        name: this.notification.name || "No Server Name",
        port: this.notification.port,
        playerId: this.notification.playerId,
        playerToken: this.notification.playerToken,
      });

      // close modal
      this.$emit('close');

    },
  },
}
</script>
