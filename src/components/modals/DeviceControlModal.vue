<template>
  <div>
    <!-- Main Device Control Modal -->
    <Transition name="modal">
      <div v-if="isShowing" class="fixed z-modal inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">

        <div @click="$emit('close')" class="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm" aria-hidden="true"></div>

        <!-- Modal Content -->
        <div class="relative inline-block align-middle bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-all max-w-2xl w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="modal-headline">

          <!-- Close Button -->
          <button @click="$emit('close')" class="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Header -->
          <div class="relative bg-gradient-to-br from-green-500 to-blue-600 w-full h-24 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            
            <!-- Device Control Icon -->
            <div class="absolute top-4 left-4 bg-green-500 rounded-full p-3 shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>

            <!-- Device Count Badge -->
            <div class="absolute top-4 right-16 bg-gray-800 bg-opacity-80 rounded-full px-3 py-1">
              <span class="text-xs text-white font-medium">{{ allDevices.length }} Devices</span>
            </div>
          </div>

          <div class="p-6 text-white">
            <!-- Header -->
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2" id="modal-headline">
                Device Control Center
              </h3>
              <div class="flex items-center justify-center space-x-2 text-green-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span class="text-sm font-medium uppercase tracking-wide">Manage Paired Devices</span>
              </div>
            </div>

            <!-- Search and Filter -->
            <div class="mb-6">
              <div class="relative">
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search devices..."
                  class="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Device List -->
            <div class="max-h-96 overflow-y-auto space-y-3">
              <div v-if="filteredDevices.length === 0" class="text-center py-8">
                <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306m6 0V7a2 2 0 012 2v4M9 6.306V7a2 2 0 00-2 2v4.294" />
                </svg>
                <p class="text-gray-400">{{ searchQuery ? 'No devices match your search' : 'No paired devices found' }}</p>
              </div>

              <!-- Device Cards -->
              <div v-for="device in filteredDevices" :key="device.id" class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-200">
                <div class="flex items-center justify-between">
                  <!-- Device Info -->
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <!-- Device Type Icon -->
                      <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="getDeviceIconBg(device.entityType)">
                          <!-- Use default avatar images -->
                          <img 
                            v-if="getDeviceAvatarPath(device.entityType)"
                            :src="getDeviceAvatarPath(device.entityType)"
                            :alt="getEntityTypeLabel(device.entityType)"
                            class="w-8 h-8 object-contain"
                          />
                          <!-- Fallback to SVG icons if image not available -->
                          <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path v-if="device.entityType === 'smart_switch'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            <path v-else-if="device.entityType === 'raid_alarm'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path v-else-if="device.entityType === 'storage_monitor'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </div>

                      <!-- Device Details -->
                      <div class="flex-1 min-w-0">
                        <!-- Editable Device Name -->
                        <div class="flex items-center space-x-2">
                          <input 
                            v-if="editingDeviceId === device.id"
                            v-model="editingDeviceName"
                            @keyup.enter="saveDeviceName(device)"
                            @keyup.escape="cancelEditDeviceName"
                            @blur="saveDeviceName(device)"
                            class="bg-gray-600 text-white px-2 py-1 rounded text-sm font-medium flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                            ref="editNameInput"
                          />
                          <h4 v-else class="text-white font-medium truncate cursor-pointer hover:text-green-400 transition-colors" @click="startEditDeviceName(device)">
                            {{ device.customName || device.entityName || 'Unknown Device' }}
                          </h4>
                          <!-- Edit Name Button -->
                          <button 
                            v-if="editingDeviceId !== device.id"
                            @click="startEditDeviceName(device)"
                            class="p-1 rounded hover:bg-gray-600 transition-colors"
                            title="Edit Name"
                          >
                            <svg class="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        <div class="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <span>{{ getEntityTypeLabel(device.entityType) }}</span>
                          <span>ID: {{ device.entityId }}</span>
                          <div class="flex items-center space-x-1">
                            <!-- Status Indicator Dot -->
                            <div class="w-2 h-2 rounded-full" :class="getStatusIndicatorClass(device.status)"></div>
                            <span :class="getStatusColor(device.status)">{{ device.status || 'Unknown' }}</span>
                          </div>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Server: {{ getServerName(device.serverId) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Device Controls -->
                  <div class="flex items-center space-x-3 ml-4">
                    <!-- On/Off Toggle (for controllable devices) -->
                    <div v-if="isControllableDevice(device.entityType)" class="flex items-center">
                      <button 
                        @click="toggleDevice(device)"
                        :disabled="device.status === 'offline' || isTogglingDevice(device.id)"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="getDeviceToggleClass(device)"
                      >
                        <span class="sr-only">Toggle device</span>
                        <span 
                          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          :class="isDeviceOn(device) ? 'translate-x-6' : 'translate-x-1'"
                        ></span>
                      </button>
                    </div>

                    <!-- Refresh Status Button -->
                    <button 
                      @click="refreshDeviceStatus(device)"
                      :disabled="isRefreshingDevice(device.id)"
                      class="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      title="Refresh Status"
                    >
                      <svg class="w-4 h-4 text-white" :class="{ 'animate-spin': isRefreshingDevice(device.id) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    <!-- Delete Button -->
                    <button 
                      @click="confirmDeleteDevice(device)"
                      class="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors duration-200"
                      title="Delete Device"
                    >
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-600">
              <div class="flex space-x-3">
                <button 
                  @click="refreshAllDevices"
                  :disabled="isRefreshingAll"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg class="w-4 h-4" :class="{ 'animate-spin': isRefreshingAll }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh All</span>
                </button>
                
                <!-- Delete Unresponsive Devices Button -->
                <button 
                  v-if="unresponsiveDeviceCount > 0"
                  @click="deleteUnresponsiveDevices"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  :title="`Delete ${unresponsiveDeviceCount} unresponsive device${unresponsiveDeviceCount > 1 ? 's' : ''}`"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Unresponsive ({{ unresponsiveDeviceCount }})</span>
                </button>
              </div>

              <button 
                @click="$emit('close')" 
                class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div v-if="deviceToDelete" class="fixed z-modal inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div @click="deviceToDelete = null" class="fixed inset-0 transition-opacity bg-black bg-opacity-60 backdrop-blur-sm" aria-hidden="true"></div>
        
        <div class="relative inline-block align-middle bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-all max-w-md w-full mx-4">
          <div class="p-6 text-white">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-white mb-2">Delete Device</h3>
              <p class="text-sm text-gray-300 mb-6">
                Are you sure you want to delete "{{ deviceToDelete?.customName || deviceToDelete?.entityName }}"? This action cannot be undone.
              </p>
              <div class="flex space-x-3 justify-center">
                <button 
                  @click="deviceToDelete = null"
                  class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  @click="deleteDevice(deviceToDelete)"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  </div>
</template>

<script>
export default {
  name: 'DeviceControlModal',
  props: {
    isShowing: {
      type: Boolean,
      default: false
    },
    server: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      searchQuery: '',
      allDevices: [],
      deviceToDelete: null,
      refreshingDevices: new Set(),
      togglingDevices: new Set(),
      isRefreshingAll: false,
      servers: {},
      editingDeviceId: null,
      editingDeviceName: '',
      unresponsiveDevices: [] // Track unresponsive device IDs
    }
  },
  computed: {
    filteredDevices() {
      let devices = this.allDevices;
      
      // Filter by selected server if server prop is provided
      if (this.server && this.server.id) {
        devices = devices.filter(device => device.serverId === this.server.id);
      }
      
      // Apply search filter
      if (!this.searchQuery) return devices;
      
      const query = this.searchQuery.toLowerCase();
      return devices.filter(device => {
        const name = (device.customName || device.entityName || '').toLowerCase();
        const type = this.getEntityTypeLabel(device.entityType).toLowerCase();
        const serverId = (device.serverId || '').toLowerCase();
        const serverName = this.getServerName(device.serverId).toLowerCase();
        
        return name.includes(query) || 
               type.includes(query) || 
               serverId.includes(query) ||
               serverName.includes(query);
      });
    },
    
    unresponsiveDeviceCount() {
      // Only count unresponsive devices that are currently shown (filtered)
      const filteredDeviceIds = this.filteredDevices.map(device => device.id);
      return this.unresponsiveDevices.filter(deviceId => 
        filteredDeviceIds.includes(deviceId)
      ).length;
    }
  },
  watch: {
    isShowing(newVal) {
      if (newVal) {
        this.loadDevices();
        this.loadServers();
        // Refresh all device states when modal opens
        this.$nextTick(() => {
          this.refreshAllDevices();
        });
      }
    }
  },
  methods: {
    loadDevices() {
      try {
        if (window.DataStore && window.DataStore.Entities) {
          const allServerEntities = window.DataStore.Entities.getAllServerEntities();
          this.allDevices = [];
          
          // Flatten all server entities into a single array
          Object.keys(allServerEntities).forEach(serverId => {
            const serverEntities = allServerEntities[serverId] || [];
            this.allDevices.push(...serverEntities);
          });
          
          // Check for offline devices and mark them as unresponsive
          this.allDevices.forEach(device => {
            if (device.status === 'offline') {
              if (!this.unresponsiveDevices.includes(device.id)) {
                this.unresponsiveDevices.push(device.id);
              }
            }
          });
          
          // Sort by last updated (newest first)
          this.allDevices.sort((a, b) => {
            const aTime = new Date(a.lastUpdated || a.pairedAt || 0);
            const bTime = new Date(b.lastUpdated || b.pairedAt || 0);
            return bTime - aTime;
          });
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
        this.$toast?.error('Failed to load devices');
      }
    },

    loadServers() {
      try {
        if (window.DataStore && window.DataStore.Servers) {
          const serversArray = window.DataStore.Servers.getServers() || [];
          // Convert array to object indexed by server ID for easier lookup
          this.servers = {};
          serversArray.forEach(server => {
            this.servers[server.id] = server;
          });
        }
      } catch (error) {
        console.error('Failed to load servers:', error);
      }
    },

    getServerName(serverId) {
      if (!serverId) return 'Unknown Server';
      const server = this.servers[serverId];
      return server?.name || server?.serverName || 'Unknown Server';
    },

    getEntityTypeLabel(entityType) {
      const typeLabels = {
        // String types
        'smart_switch': 'Smart Switch',
        'raid_alarm': 'Raid Alarm', 
        'smart_alarm': 'Smart Alarm',
        'storage_monitor': 'Storage Monitor',
        // Numeric types (as strings)
        '1': 'Smart Switch',
        '2': 'Smart Alarm',
        '3': 'Storage Monitor',
        // Numeric types (as numbers)
        1: 'Smart Switch',
        2: 'Smart Alarm', 
        3: 'Storage Monitor'
      };
      return typeLabels[entityType] || 'Unknown Entity';
    },

    getDeviceIconBg(entityType) {
      const bgClasses = {
        // String types
        'smart_switch': 'bg-yellow-500',
        'raid_alarm': 'bg-red-500',
        'smart_alarm': 'bg-red-500',
        'storage_monitor': 'bg-blue-500',
        // Numeric types (as strings)
        '1': 'bg-yellow-500',
        '2': 'bg-red-500', 
        '3': 'bg-blue-500',
        // Numeric types (as numbers)
        1: 'bg-yellow-500',
        2: 'bg-red-500',
        3: 'bg-blue-500'
      };
      return bgClasses[entityType] || 'bg-gray-500';
    },

    getStatusColor(status) {
      const statusColors = {
        'online': 'text-green-400',
        'offline': 'text-red-400',
        'on': 'text-green-400',
        'off': 'text-yellow-400',
        'monitoring': 'text-blue-400',
        'triggered': 'text-red-500',
        'unknown': 'text-gray-400'
      };
      return statusColors[status] || 'text-gray-400';
    },

    getStatusIndicatorClass(status) {
      const indicatorClasses = {
        'online': 'bg-green-400',
        'offline': 'bg-red-400',
        'on': 'bg-green-400',
        'off': 'bg-yellow-400',
        'monitoring': 'bg-blue-400',
        'triggered': 'bg-red-500',
        'unknown': 'bg-gray-400'
      };
      return indicatorClasses[status] || 'bg-gray-400';
    },

    isControllableDevice(entityType) {
      // Only Smart Switches (type 1) can be controlled according to rustplus.js API
      const controllableTypes = [
        'smart_switch', // String type
        '1', // Numeric type as string
        1 // Numeric type as number
      ];
      return controllableTypes.includes(entityType);
    },

    isDeviceOn(device) {
      return device.status === 'on' || device.status === 'online';
    },

    getDeviceToggleClass(device) {
      if (device.status === 'offline') {
        return 'bg-gray-600';
      }
      return this.isDeviceOn(device) ? 'bg-green-600' : 'bg-gray-400';
    },

    isTogglingDevice(deviceId) {
      return this.togglingDevices.has(deviceId);
    },

    isRefreshingDevice(deviceId) {
      return this.refreshingDevices.has(deviceId);
    },

    async toggleDevice(device) {
       if (!this.isControllableDevice(device.entityType) || device.status === 'offline') {
         return;
       }

       this.togglingDevices.add(device.id);
       const originalStatus = device.status;

       try {
         if (this.$entityControlService && this.$entityControlService.isReady()) {
           const newState = !this.isDeviceOn(device);
           // Use setEntityValue method as per rustplus.js API
           await this.$entityControlService.setEntityValue(device.entityId, newState);
           
           // Update local status
           device.status = newState ? 'on' : 'off';
           device.lastUpdated = new Date().toISOString();
           
           // Save to DataStore
           if (window.DataStore && window.DataStore.Entities) {
             window.DataStore.Entities.addOrUpdateServerEntity(device.serverId, device);
           }
           
           // Remove from unresponsive devices if toggle was successful
          const index = this.unresponsiveDevices.indexOf(device.id);
          if (index !== -1) {
            this.unresponsiveDevices.splice(index, 1);
          }
           
           this.$toast?.success(`Device ${newState ? 'turned on' : 'turned off'}`);
         } else {
           this.$toast?.error('Entity control service not available');
         }
       } catch (error) {
         console.error('Failed to toggle device:', error);
         
         // Revert to original status
         device.status = originalStatus;
         device.lastUpdated = new Date().toISOString();
         
         // Check if the device is offline and mark as unresponsive
        if (originalStatus === 'offline' || device.status === 'offline') {
          if (!this.unresponsiveDevices.includes(device.id)) {
            this.unresponsiveDevices.push(device.id);
          }
          this.$toast?.error(`Device ${device.name} is not responsive (offline)`);
        } else {
          // Mark as unresponsive for other failures too
          if (!this.unresponsiveDevices.includes(device.id)) {
            this.unresponsiveDevices.push(device.id);
          }
          this.$toast?.error(`Failed to toggle device ${device.name} - marked as unresponsive`);
        }
         
         // Update DataStore with reverted status
         if (window.DataStore && window.DataStore.Entities) {
           window.DataStore.Entities.addOrUpdateServerEntity(device.serverId, device);
         }
       } finally {
         this.togglingDevices.delete(device.id);
       }
     },

    async refreshDeviceStatus(device) {
       this.refreshingDevices.add(device.id);

       try {
         if (this.$entityControlService && this.$entityControlService.isReady()) {
           const entityInfo = await this.$entityControlService.getEntityInfo(device.entityId);
           const status = this.$entityControlService.getEntityStatusDescription(entityInfo);
           
           // Update device status
           device.status = status;
           device.lastUpdated = new Date().toISOString();
           
           // Mark device as unresponsive if it's offline
        if (status === 'offline') {
          if (!this.unresponsiveDevices.includes(device.id)) {
            this.unresponsiveDevices.push(device.id);
          }
        } else {
          // Remove from unresponsive devices if it's back online
          const index = this.unresponsiveDevices.indexOf(device.id);
          if (index !== -1) {
            this.unresponsiveDevices.splice(index, 1);
          }
        }
           
           // Save to DataStore
           if (window.DataStore && window.DataStore.Entities) {
             window.DataStore.Entities.addOrUpdateServerEntity(device.serverId, device);
           }
           
           this.$toast?.success('Device status refreshed');
         } else {
           this.$toast?.error('Entity control service not available');
         }
       } catch (error) {
         console.error('Failed to refresh device status:', error);
         device.status = 'offline';
         device.lastUpdated = new Date().toISOString();
         
         // Mark device as unresponsive when it fails to respond
        if (!this.unresponsiveDevices.includes(device.id)) {
          this.unresponsiveDevices.push(device.id);
        }
         
         if (window.DataStore && window.DataStore.Entities) {
           window.DataStore.Entities.addOrUpdateServerEntity(device.serverId, device);
         }
         
         this.$toast?.warning('Device appears to be offline - marked as unresponsive');
       } finally {
         this.refreshingDevices.delete(device.id);
       }
     },

    async refreshAllDevices() {
      this.isRefreshingAll = true;
      
      try {
        const refreshPromises = this.allDevices.map(device => this.refreshDeviceStatus(device));
        await Promise.all(refreshPromises);
        this.$toast?.success('All devices refreshed');
      } catch (error) {
        console.error('Failed to refresh all devices:', error);
        this.$toast?.error('Failed to refresh some devices');
      } finally {
        this.isRefreshingAll = false;
      }
    },

    confirmDeleteDevice(device) {
      this.deviceToDelete = device;
    },

    deleteDevice(device) {
      try {
        if (window.DataStore && window.DataStore.Entities) {
          window.DataStore.Entities.removeServerEntity(device.serverId, device.entityId);
          
          // Remove from local array
          const index = this.allDevices.findIndex(d => d.id === device.id);
          if (index !== -1) {
            this.allDevices.splice(index, 1);
          }
          
          this.$toast?.success(`Device "${device.customName || device.entityName}" deleted`);
        }
      } catch (error) {
        console.error('Failed to delete device:', error);
        this.$toast?.error(`Failed to delete device: ${error.message}`);
      } finally {
        this.deviceToDelete = null;
      }
    },

    getDeviceAvatarPath(entityType) {
      const avatarPaths = {
        // String types
        'smart_switch': '/images/items/smart.switch.png',
        'smart_alarm': '/images/items/smart.alarm.png',
        'raid_alarm': '/images/items/smart.alarm.png',
        'storage_monitor': '/images/items/storage.monitor.png',
        // Numeric types (as strings)
        '1': '/images/items/smart.switch.png',
        '2': '/images/items/smart.alarm.png',
        '3': '/images/items/storage.monitor.png',
        // Numeric types (as numbers)
        1: '/images/items/smart.switch.png',
        2: '/images/items/smart.alarm.png',
        3: '/images/items/storage.monitor.png'
      };
      return avatarPaths[entityType] || null;
    },

    startEditDeviceName(device) {
      this.editingDeviceId = device.id;
      this.editingDeviceName = device.customName || device.entityName || '';
      
      // Focus the input field after Vue updates the DOM
      this.$nextTick(() => {
        const input = this.$refs.editNameInput;
        if (input) {
          input.focus();
          input.select();
        }
      });
    },

    cancelEditDeviceName() {
      this.editingDeviceId = null;
      this.editingDeviceName = '';
    },

    async saveDeviceName(device) {
       if (this.editingDeviceId !== device.id) return;
       
       const newName = this.editingDeviceName.trim();
       
       try {
         // Update the device name using EntityDataStore
         if (window.DataStore && window.DataStore.Entities) {
           await window.DataStore.Entities.updateEntityName(device.serverId, device.entityId, newName);
           
           // Update local device object
           device.customName = newName;
           device.lastUpdated = new Date().toISOString();
           
           this.$toast?.success('Device name updated successfully');
         }
       } catch (error) {
         console.error('Failed to update device name:', error);
         this.$toast?.error(`Failed to update device name: ${error.message}`);
       } finally {
         this.cancelEditDeviceName();
       }
     },

     deleteUnresponsiveDevices() {
       if (this.unresponsiveDeviceCount === 0) return;
       
       try {
         let deletedCount = 0;
         const unresponsiveDeviceIds = [...this.unresponsiveDevices];
         
         // Find and delete all unresponsive devices
         unresponsiveDeviceIds.forEach(deviceId => {
           const deviceIndex = this.allDevices.findIndex(device => device.id === deviceId);
           if (deviceIndex !== -1) {
             const device = this.allDevices[deviceIndex];
             
             // Remove from DataStore
             if (window.DataStore && window.DataStore.Entities) {
               window.DataStore.Entities.removeServerEntity(device.serverId, device.entityId);
             }
             
             // Remove from local array
             this.allDevices.splice(deviceIndex, 1);
             deletedCount++;
           }
         });
         
         // Clear the unresponsive devices array
        this.unresponsiveDevices.splice(0, this.unresponsiveDevices.length);
         
         // Reload devices to ensure UI is in sync
         this.loadDevices();
         
         this.$toast?.success(`Deleted ${deletedCount} unresponsive device${deletedCount > 1 ? 's' : ''}`);
       } catch (error) {
         console.error('Failed to delete unresponsive devices:', error);
         this.$toast?.error(`Failed to delete unresponsive devices: ${error.message}`);
       }
     },

     /**
      * Update device state from real-time notification
      * @param {number} entityId - The entity ID that changed
      * @param {Object} entityInfo - The entity info from the notification
      */
     updateDeviceStateFromNotification(entityId, entityInfo) {
       try {
         // Find the device in our local array
         const device = this.allDevices.find(d => d.entityId === entityId);
         
         if (device && this.$entityControlService) {
           // Get the new status from the entity info
           const newStatus = this.$entityControlService.getEntityStatusDescription(entityInfo);
           
           // Update the device status
           device.status = newStatus;
           device.lastUpdated = new Date().toISOString();
           
           // Handle unresponsive device tracking
           if (newStatus === 'offline') {
             // Mark as unresponsive if offline
             if (!this.unresponsiveDevices.includes(device.id)) {
               this.unresponsiveDevices.push(device.id);
             }
           } else {
             // Remove from unresponsive devices if back online
             const index = this.unresponsiveDevices.indexOf(device.id);
             if (index !== -1) {
               this.unresponsiveDevices.splice(index, 1);
             }
           }
           
           // Update DataStore with new status
           if (window.DataStore && window.DataStore.Entities) {
             window.DataStore.Entities.addOrUpdateServerEntity(device.serverId, device);
           }
           
           console.log(`Device ${device.customName || device.entityName} status updated to: ${newStatus}`);
         }
       } catch (error) {
         console.error('Failed to update device state from notification:', error);
       }
     }
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative, .modal-leave-active .relative {
  transition: all 0.3s ease;
}

.modal-enter-from .relative, .modal-leave-to .relative {
  transform: scale(0.95) translateY(-10px);
}

.z-modal {
  z-index: 9999;
}
</style>