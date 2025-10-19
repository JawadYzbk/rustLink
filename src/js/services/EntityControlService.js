/**
 * EntityControlService - Service for controlling smart switches, alarms, and storage monitors
 * Uses the existing WebSocket connection from RustPlus component
 */
class EntityControlService {
  
  constructor() {
    this.rustPlusComponent = null;
  }

  /**
   * Set the RustPlus component reference to access WebSocket connection
   * @param {Object} rustPlusComponent - Reference to RustPlus.vue component
   */
  setRustPlusComponent(rustPlusComponent) {
    this.rustPlusComponent = rustPlusComponent;
  }

  /**
   * Check if the service is ready to make requests
   * @returns {boolean} - True if WebSocket connection is available
   */
  isReady() {
    return this.rustPlusComponent && 
           this.rustPlusComponent.status === 'connected' && 
           this.rustPlusComponent.websocket;
  }

  /**
   * Get entity information (status, type, etc.)
   * @param {number} entityId - The entity ID to get info for
   * @returns {Promise} - Promise that resolves with entity info
   */
  getEntityInfo(entityId) {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
        reject(new Error('WebSocket connection not available'));
        return;
      }

      this.rustPlusComponent.sendRequest({
        entityId: entityId,
        getEntityInfo: {}
      }, (message) => {
        if (message.response && message.response.error) {
          reject(new Error(message.response.error.error || 'Failed to get entity info'));
        } else if (message.response && message.response.entityInfo) {
          resolve(message.response.entityInfo);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true; // Handled by callback
      });
    });
  }

  /**
   * Set entity value (turn on/off for smart switches)
   * @param {number} entityId - The entity ID to control
   * @param {boolean} value - True to turn on, false to turn off
   * @returns {Promise} - Promise that resolves when operation completes
   */
  setEntityValue(entityId, value) {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
        reject(new Error('WebSocket connection not available'));
        return;
      }

      this.rustPlusComponent.sendRequest({
        entityId: entityId,
        setEntityValue: {
          value: value
        }
      }, (message) => {
        if (message.response && message.response.error) {
          reject(new Error(message.response.error.error || 'Failed to set entity value'));
        } else if (message.response && message.response.success) {
          resolve(message.response.success);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true; // Handled by callback
      });
    });
  }

  /**
   * Toggle entity state (for smart switches)
   * @param {number} entityId - The entity ID to toggle
   * @returns {Promise} - Promise that resolves with new state
   */
  async toggleEntity(entityId) {
    try {
      // First get current state
      const entityInfo = await this.getEntityInfo(entityId);
      const currentValue = entityInfo.payload && entityInfo.payload.value;
      
      // Toggle the value
      const newValue = !currentValue;
      await this.setEntityValue(entityId, newValue);
      
      return newValue;
    } catch (error) {
      throw new Error(`Failed to toggle entity: ${error.message}`);
    }
  }

  /**
   * Get entity type name from type number
   * @param {number} type - Entity type number (1=Switch, 2=Alarm, 3=StorageMonitor)
   * @returns {string} - Human readable type name
   */
  getEntityTypeName(type) {
    switch (type) {
      case 1: return 'Smart Switch';
      case 2: return 'Smart Alarm';
      case 3: return 'Storage Monitor';
      default: return `Unknown Entity (${type})`;
    }
  }

  /**
   * Check if entity type supports control (on/off)
   * @param {number} type - Entity type number
   * @returns {boolean} - True if entity can be controlled
   */
  isControllableEntity(type) {
    return type === 1; // Only smart switches can be controlled (turned on/off)
  }

  /**
   * Get entity status description
   * @param {Object} entityInfo - Entity info from getEntityInfo
   * @returns {string} - Status description
   */
  getEntityStatusDescription(entityInfo) {
    if (!entityInfo || !entityInfo.payload) {
      return 'unknown';
    }

    const type = entityInfo.type;
    const payload = entityInfo.payload;

    switch (type) {
      case 1: // Smart Switch
        return payload.value ? 'on' : 'off';
      
      case 2: // Smart Alarm
        return 'monitoring';
      
      case 3: // Storage Monitor
        if (payload.items && payload.items.length > 0) {
          const totalItems = payload.items.reduce((sum, item) => sum + item.quantity, 0);
          return `${totalItems} items`;
        }
        return 'empty';
      
      default:
        return 'unknown';
    }
  }

  /**
   * Get entity status description with support for custom status
   * @param {Object} entity - Entity object with status property
   * @returns {string} - Status description
   */
  getEntityStatusDescriptionFromEntity(entity) {
    if (!entity) {
      return 'unknown';
    }

    // If entity has a custom status (like 'triggered'), return it
    if (entity.status && entity.status !== 'monitoring') {
      return entity.status;
    }

    // Otherwise use the standard status description
    return this.getEntityStatusDescription(entity);
  }

  /**
   * Subscribe to entity updates
   * @param {number} entityId - The entity ID to subscribe to
   * @returns {Promise} - Promise that resolves when subscription is set
   */
  subscribeToEntity(entityId) {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
        reject(new Error('WebSocket connection not available'));
        return;
      }

      this.rustPlusComponent.sendRequest({
        entityId: entityId,
        setSubscription: {
          value: true
        }
      }, (message) => {
        if (message.response && message.response.error) {
          reject(new Error(message.response.error.error || 'Failed to subscribe to entity'));
        } else if (message.response && message.response.flag) {
          resolve(message.response.flag);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true; // Handled by callback
      });
    });
  }

  /**
   * Unsubscribe from entity updates
   * @param {number} entityId - The entity ID to unsubscribe from
   * @returns {Promise} - Promise that resolves when subscription is removed
   */
  unsubscribeFromEntity(entityId) {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
        reject(new Error('WebSocket connection not available'));
        return;
      }

      this.rustPlusComponent.sendRequest({
        entityId: entityId,
        setSubscription: {
          value: false
        }
      }, (message) => {
        if (message.response && message.response.error) {
          reject(new Error(message.response.error.error || 'Failed to unsubscribe from entity'));
        } else if (message.response && message.response.flag) {
          resolve(message.response.flag);
        } else {
          reject(new Error('Invalid response received'));
        }
        return true; // Handled by callback
      });
    });
  }
}

// Export as singleton
export default new EntityControlService();