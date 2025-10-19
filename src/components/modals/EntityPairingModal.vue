<template>
  <Transition name="modal">
    <div v-if="isShowing" class="fixed z-modal inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">

        <div @click="$emit('close')" class="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm" aria-hidden="true"></div>

        <!-- Modal Content -->
        <div class="relative inline-block align-middle bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-all max-w-lg w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="modal-headline">

          <!-- Close Button -->
          <button @click="$emit('close')" class="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Entity Header -->
          <div class="relative bg-gradient-to-br from-blue-500 to-purple-600 w-full h-32 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            
            <!-- Entity Type Icon -->
            <div class="absolute top-4 left-4 bg-blue-500 rounded-full p-3 shadow-lg">
              <!-- Smart Switch Icon -->
              <svg v-if="getEntityType() === 'smart_switch'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <!-- Raid Alarm Icon -->
              <svg v-else-if="getEntityType() === 'raid_alarm'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Storage Monitor Icon -->
              <svg v-else-if="getEntityType() === 'storage_monitor'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <!-- Default Entity Icon -->
              <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <!-- Entity Status Badge -->
            <div class="absolute top-4 right-16 bg-gray-800 bg-opacity-80 rounded-full px-3 py-1">
              <span class="text-xs text-white font-medium">{{ getEntityTypeLabel() }}</span>
            </div>
          </div>

          <div class="p-6 text-white">
            <!-- Header -->
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2" id="modal-headline">
                {{ entityData?.entityName || 'Unknown Entity' }}
              </h3>
              <div class="flex items-center justify-center space-x-2 text-blue-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                <span class="text-sm font-medium uppercase tracking-wide">Entity Pairing Request</span>
              </div>
            </div>

            <!-- Server Info -->
            <div class="bg-gray-700 rounded-lg p-4 mb-6 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-300 text-sm">Server:</span>
                <span class="text-white text-sm font-medium">{{ entityData?.serverName || entityData?.name || 'Unknown Server' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300 text-sm">Entity ID:</span>
                <span class="text-white font-mono text-sm">{{ entityData?.entityId || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300 text-sm">Entity Type:</span>
                <span class="text-white text-sm">{{ getEntityTypeLabel() }}</span>
              </div>
            </div>

            <!-- Custom Name Input -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Custom Name (Optional)
              </label>
              <input 
                v-model="customName"
                type="text" 
                :placeholder="entityData?.entityName || 'Enter custom name'"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
              <p class="text-xs text-gray-400 mt-1">
                This name will be used to identify the entity in your dashboard
              </p>
            </div>

            <!-- Description -->
            <div v-if="entityData?.desc" class="bg-gray-700 rounded-lg p-4 mb-6 max-h-32 overflow-y-auto">
              <h4 class="text-sm font-medium text-gray-300 mb-2">Server Description:</h4>
              <div class="text-gray-100 text-sm leading-relaxed" v-html="entityData.desc.replaceAll('\\n', '<br/>')"></div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button @click="pairEntity" type="button" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg">
                <div class="flex items-center justify-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  <span>Pair Entity</span>
                </div>
              </button>
              <button @click="$emit('close')" type="button" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800">
                Cancel
              </button>
            </div>

            <!-- Help Text -->
            <div class="mt-4 text-center">
              <p class="text-xs text-gray-400">
                Pairing will allow you to control and monitor this {{ getEntityTypeLabel().toLowerCase() }} remotely
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

/* Pulse animation for entity icon */
@keyframes pulse-blue {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

.bg-blue-500 {
  animation: pulse-blue 2s infinite;
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

/* Input focus effects */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .max-w-lg {
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
  name: 'EntityPairingModal',
  props: {
    isShowing: Boolean,
    entityData: Object,
  },
  data() {
    return {
      customName: '',
    };
  },
  watch: {
    entityData: {
      handler(newData) {
        if (newData) {
          this.customName = newData.entityName || '';
        }
      },
      immediate: true,
    },
  },
  methods: {
    getEntityType() {
      if (!this.entityData?.entityType) return 'unknown';
      
      // Map entity types based on Rust+ API
      const typeMap = {
        '1': 'smart_switch',
        '2': 'smart_alarm', 
        '3': 'storage_monitor',
      };
      
      return typeMap[this.entityData.entityType] || 'unknown';
    },
    
    getEntityTypeLabel() {
      const typeLabels = {
        'smart_switch': 'Smart Switch',
        'smart_alarm': 'Smart Alarm',
        'raid_alarm': 'Raid Alarm',
        'storage_monitor': 'Storage Monitor',
        'unknown': 'Unknown Entity',
      };
      
      return typeLabels[this.getEntityType()] || 'Unknown Entity';
    },
    
    async pairEntity() {
      try {
        // Store entity in EntityDataStore
        const entityData = {
          entityId: this.entityData?.entityId,
          entityName: this.customName || this.entityData?.entityName || this.entityData?.name,
          entityType: this.entityData?.entityType,
          serverId: this.entityData?.serverId || this.entityData?.playerId,
          customName: this.customName,
          originalData: this.entityData,
          pairedAt: Date.now(),
          status: 'unknown'
        };

        // Save to server-specific storage
        if (window.DataStore && window.DataStore.Entities) {
          window.DataStore.Entities.addOrUpdateServerEntity(entityData.serverId, entityData);
        }

        // Try to get initial entity status if EntityControlService is available
        if (this.$entityControlService && this.$entityControlService.isReady()) {
          try {
            const entityInfo = await this.$entityControlService.getEntityInfo(entityData.entityId);
            const status = this.$entityControlService.getEntityStatusDescription(entityInfo);
            
            // Update entity with current status
            entityData.status = status;
            entityData.lastUpdated = Date.now();
            
            if (window.DataStore && window.DataStore.Entities) {
              window.DataStore.Entities.addOrUpdateServerEntity(entityData.serverId, entityData);
            }

            // Subscribe to entity updates
            await this.$entityControlService.subscribeToEntity(entityData.entityId);
          } catch (error) {
            console.warn('Failed to get initial entity status:', error);
          }
        }

        // Emit pairing success event
        this.$emit('pair-entity', entityData);
        
        // Show success message
        this.$toast?.success(`Successfully paired ${this.getEntityTypeLabel()}: ${entityData.entityName}`);
        
        // Close modal
        this.$emit('close');
      } catch (error) {
        console.error('Failed to pair entity:', error);
        this.$toast?.error(`Failed to pair entity: ${error.message}`);
      }
    },
  },
}
</script>