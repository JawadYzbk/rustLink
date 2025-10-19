const ElectronStore = new (require('electron-store'))();

const KEY_SERVER_ENTITIES = 'server_entities';

class EntityDataStore {

    /**
     * Get all entities for a specific server
     * @param {string} serverId - The server ID
     * @returns {Array} Array of entities for the server
     */
    static getServerEntities(serverId) {
        if (!serverId) return [];
        const serverEntities = ElectronStore.get(KEY_SERVER_ENTITIES, {});
        return serverEntities[serverId] || [];
    }

    /**
     * Set entities for a specific server
     * @param {string} serverId - The server ID
     * @param {Array} entities - Array of entities to store
     */
    static setServerEntities(serverId, entities) {
        if (!serverId) return;
        const serverEntities = ElectronStore.get(KEY_SERVER_ENTITIES, {});
        serverEntities[serverId] = entities;
        ElectronStore.set(KEY_SERVER_ENTITIES, serverEntities);
    }

    /**
     * Add or update an entity for a specific server
     * @param {string} serverId - The server ID
     * @param {Object} entity - The entity object to add/update
     * @returns {Array} Updated array of entities
     */
    static addOrUpdateServerEntity(serverId, entity) {
        if (!serverId || !entity) return [];
        
        // Get existing entities for this server
        var entities = this.getServerEntities(serverId);
        
        // Add metadata
        entity.serverId = serverId;
        entity.pairedAt = entity.pairedAt || new Date().toISOString();
        entity.lastUpdated = new Date().toISOString();
        
        // Generate unique ID if not present
        if (!entity.id) {
            entity.id = `${serverId}_${entity.entityId}_${Date.now()}`;
        }
        
        // Remove existing entity with same entityId if it exists
        entities = entities.filter(existingEntity => 
            existingEntity.entityId !== entity.entityId
        );
        
        // Add the new/updated entity
        entities.push(entity);
        
        // Sort by pairedAt date (newest first)
        entities.sort((a, b) => new Date(b.pairedAt) - new Date(a.pairedAt));
        
        // Save updated entities
        this.setServerEntities(serverId, entities);
        
        return entities;
    }

    /**
     * Get a specific entity by entityId for a server
     * @param {string} serverId - The server ID
     * @param {string} entityId - The entity ID
     * @returns {Object|null} The entity object or null if not found
     */
    static getServerEntity(serverId, entityId) {
        if (!serverId || !entityId) return null;
        
        const entities = this.getServerEntities(serverId);
        return entities.find(entity => entity.entityId === entityId) || null;
    }

    /**
     * Remove an entity from a specific server
     * @param {string} serverId - The server ID
     * @param {string} entityId - The entity ID to remove
     * @returns {Array} Updated array of entities
     */
    static removeServerEntity(serverId, entityId) {
        if (!serverId || !entityId) return [];
        
        var entities = this.getServerEntities(serverId);
        
        // Filter out the entity to remove
        entities = entities.filter(entity => entity.entityId !== entityId);
        
        // Save updated entities
        this.setServerEntities(serverId, entities);
        
        return entities;
    }

    /**
     * Get entities by type for a specific server
     * @param {string} serverId - The server ID
     * @param {string} entityType - The entity type (1=smart_switch, 2=smart_alarm, 3=storage_monitor)
     * @returns {Array} Array of entities of the specified type
     */
    static getServerEntitiesByType(serverId, entityType) {
        if (!serverId || !entityType) return [];
        
        const entities = this.getServerEntities(serverId);
        return entities.filter(entity => entity.entityType === entityType);
    }

    /**
     * Update entity status (for caching current state)
     * @param {string} serverId - The server ID
     * @param {string} entityId - The entity ID
     * @param {Object} status - Status object containing current state
     * @returns {Object|null} Updated entity or null if not found
     */
    static updateEntityStatus(serverId, entityId, status) {
        if (!serverId || !entityId || !status) return null;
        
        var entities = this.getServerEntities(serverId);
        const entityIndex = entities.findIndex(entity => entity.entityId === entityId);
        
        if (entityIndex === -1) return null;
        
        // Update the entity status
        entities[entityIndex].status = {
            ...entities[entityIndex].status,
            ...status,
            lastStatusUpdate: new Date().toISOString()
        };
        entities[entityIndex].lastUpdated = new Date().toISOString();
        
        // Save updated entities
        this.setServerEntities(serverId, entities);
        
        return entities[entityIndex];
    }

    /**
     * Get all entities across all servers
     * @returns {Object} Object with serverId as keys and entity arrays as values
     */
    static getAllServerEntities() {
        return ElectronStore.get(KEY_SERVER_ENTITIES, {});
    }

    /**
     * Clear all entities for a specific server
     * @param {string} serverId - The server ID
     */
    static clearServerEntities(serverId) {
        if (!serverId) return;
        
        const serverEntities = ElectronStore.get(KEY_SERVER_ENTITIES, {});
        delete serverEntities[serverId];
        ElectronStore.set(KEY_SERVER_ENTITIES, serverEntities);
    }

    /**
     * Clear all entities across all servers
     */
    static clearAllEntities() {
        ElectronStore.delete(KEY_SERVER_ENTITIES);
    }

    /**
     * Update entity name (customName) for a specific entity
     * @param {string} serverId - The server ID
     * @param {string} entityId - The entity ID
     * @param {string} newName - The new custom name
     * @returns {Object|null} Updated entity or null if not found
     */
    static updateEntityName(serverId, entityId, newName) {
        if (!serverId || !entityId) return null;
        
        var entities = this.getServerEntities(serverId);
        const entityIndex = entities.findIndex(entity => entity.entityId === entityId);
        
        if (entityIndex === -1) return null;
        
        // Update the entity name
        entities[entityIndex].customName = newName;
        entities[entityIndex].lastUpdated = new Date().toISOString();
        
        // Save updated entities
        this.setServerEntities(serverId, entities);
        
        return entities[entityIndex];
    }

    /**
     * Get entity statistics for a server
     * @param {string} serverId - The server ID
     * @returns {Object} Statistics object
     */
    static getServerEntityStats(serverId) {
        if (!serverId) return { total: 0, byType: {} };
        
        const entities = this.getServerEntities(serverId);
        const stats = {
            total: entities.length,
            byType: {
                smart_switch: 0,
                smart_alarm: 0,
                storage_monitor: 0,
                unknown: 0
            },
            lastPaired: null
        };
        
        entities.forEach(entity => {
            const typeMap = {
                '1': 'smart_switch',
                '2': 'smart_alarm', 
                '3': 'storage_monitor'
            };
            
            const type = typeMap[entity.entityType] || 'unknown';
            stats.byType[type]++;
            
            // Track most recent pairing
            if (!stats.lastPaired || new Date(entity.pairedAt) > new Date(stats.lastPaired)) {
                stats.lastPaired = entity.pairedAt;
            }
        });
        
        return stats;
    }

}

module.exports = EntityDataStore;