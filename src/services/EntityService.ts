import { EventEmitter } from 'events';
import { rustPlusService, EntityInfo } from './RustPlusService';
import { notificationService } from './NotificationService';
import { v4 as uuidv4 } from 'uuid';

export interface RustPlusEntity {
  id: string;
  entityId: number;
  serverId: string;
  name: string;
  type: EntityType;
  isSubscribed: boolean;
  lastValue?: any;
  lastUpdated?: Date;
  isOnline?: boolean;
  customName?: string;
  location?: {
    x: number;
    y: number;
  };
}

export enum EntityType {
  SWITCH = 1,
  ALARM = 2,
  STORAGE_MONITOR = 3
}

export interface EntityUpdate {
  entityId: number;
  type: EntityType;
  value?: boolean;
  items?: Array<{
    itemId: number;
    quantity: number;
    itemIsBlueprint?: boolean;
  }>;
  capacity?: number;
  hasProtection?: boolean;
  protectionExpiry?: number;
}

export class EntityService extends EventEmitter {
  private entities: Map<string, RustPlusEntity> = new Map();
  private subscriptions: Set<number> = new Set();

  constructor() {
    super();
    this.loadEntities();
    this.setupRustPlusListeners();
  }

  /**
   * Add a new entity
   */
  async addEntity(
    entityId: number,
    serverId: string,
    name?: string,
    customName?: string
  ): Promise<RustPlusEntity> {
    // Check if entity already exists
    const existingEntity = this.findEntityByEntityId(entityId);
    if (existingEntity) {
      throw new Error(`Entity ${entityId} already exists`);
    }

    // Get entity info from server
    let entityInfo: EntityInfo;
    try {
      entityInfo = await rustPlusService.getEntityInfo(entityId);
    } catch (error) {
      throw new Error(`Failed to get entity info: ${error}`);
    }

    // Create entity object
    const entity: RustPlusEntity = {
      id: uuidv4(),
      entityId,
      serverId,
      name: name || `Entity ${entityId}`,
      type: entityInfo.type as EntityType,
      isSubscribed: false,
      lastValue: this.extractEntityValue(entityInfo),
      lastUpdated: new Date(),
      isOnline: true,
      customName
    };

    // Validate entity type
    if (!Object.values(EntityType).includes(entity.type)) {
      throw new Error(`Unsupported entity type: ${entity.type}`);
    }

    this.entities.set(entity.id, entity);
    this.saveEntities();
    this.emit('entityAdded', entity);

    notificationService.showSuccess(
      'Entity Added',
      `${this.getEntityTypeName(entity.type)} "${entity.customName || entity.name}" has been added`
    );

    return entity;
  }

  /**
   * Remove an entity
   */
  async removeEntity(entityId: string): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Unsubscribe if subscribed
    if (entity.isSubscribed) {
      await this.unsubscribeFromEntity(entityId);
    }

    this.entities.delete(entityId);
    this.saveEntities();
    this.emit('entityRemoved', entity);

    notificationService.showInfo(
      'Entity Removed',
      `${this.getEntityTypeName(entity.type)} "${entity.customName || entity.name}" has been removed`
    );
  }

  /**
   * Update entity information
   */
  updateEntity(entityId: string, updates: Partial<RustPlusEntity>): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    const updatedEntity = { ...entity, ...updates };
    this.entities.set(entityId, updatedEntity);
    this.saveEntities();
    this.emit('entityUpdated', updatedEntity);
  }

  /**
   * Get all entities
   */
  getEntities(): RustPlusEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities for a specific server
   */
  getEntitiesForServer(serverId: string): RustPlusEntity[] {
    return this.getEntities().filter(entity => entity.serverId === serverId);
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): RustPlusEntity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Find entity by entity ID (from Rust+)
   */
  findEntityByEntityId(entityId: number): RustPlusEntity | undefined {
    return Array.from(this.entities.values()).find(entity => entity.entityId === entityId);
  }

  /**
   * Subscribe to entity updates
   */
  async subscribeToEntity(entityId: string): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    if (entity.isSubscribed) {
      return; // Already subscribed
    }

    try {
      await rustPlusService.subscribeToEntity(entity.entityId);
      entity.isSubscribed = true;
      this.subscriptions.add(entity.entityId);
      this.updateEntity(entityId, { isSubscribed: true });

      notificationService.showSuccess(
        'Subscription Active',
        `Now monitoring ${this.getEntityTypeName(entity.type)} "${entity.customName || entity.name}"`
      );
    } catch (error) {
      throw new Error(`Failed to subscribe to entity: ${error}`);
    }
  }

  /**
   * Unsubscribe from entity updates
   */
  async unsubscribeFromEntity(entityId: string): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    if (!entity.isSubscribed) {
      return; // Not subscribed
    }

    try {
      await rustPlusService.unsubscribeFromEntity(entity.entityId);
      entity.isSubscribed = false;
      this.subscriptions.delete(entity.entityId);
      this.updateEntity(entityId, { isSubscribed: false });

      notificationService.showInfo(
        'Subscription Stopped',
        `No longer monitoring ${this.getEntityTypeName(entity.type)} "${entity.customName || entity.name}"`
      );
    } catch (error) {
      throw new Error(`Failed to unsubscribe from entity: ${error}`);
    }
  }

  /**
   * Toggle entity subscription
   */
  async toggleSubscription(entityId: string): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    if (entity.isSubscribed) {
      await this.unsubscribeFromEntity(entityId);
    } else {
      await this.subscribeToEntity(entityId);
    }
  }

  /**
   * Control entity (for switches)
   */
  async controlEntity(entityId: string, value: boolean): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    if (entity.type !== EntityType.SWITCH) {
      throw new Error('Only smart switches can be controlled');
    }

    try {
      await rustPlusService.setEntityValue(entity.entityId, value);
      
      // Update local state
      entity.lastValue = value;
      entity.lastUpdated = new Date();
      this.updateEntity(entityId, { lastValue: value, lastUpdated: new Date() });

      notificationService.showSuccess(
        'Entity Controlled',
        `${entity.customName || entity.name} turned ${value ? 'ON' : 'OFF'}`
      );
    } catch (error) {
      notificationService.showError(
        'Control Failed',
        `Failed to control ${entity.customName || entity.name}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Toggle entity state (for switches)
   */
  async toggleEntity(entityId: string): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    if (entity.type !== EntityType.SWITCH) {
      throw new Error('Only smart switches can be toggled');
    }

    const currentValue = entity.lastValue as boolean;
    await this.controlEntity(entityId, !currentValue);
  }

  /**
   * Refresh entity information from server
   */
  async refreshEntity(entityId: string): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    try {
      const entityInfo = await rustPlusService.getEntityInfo(entity.entityId);
      const newValue = this.extractEntityValue(entityInfo);
      
      entity.lastValue = newValue;
      entity.lastUpdated = new Date();
      entity.isOnline = true;
      
      this.updateEntity(entityId, {
        lastValue: newValue,
        lastUpdated: new Date(),
        isOnline: true
      });
    } catch (error) {
      entity.isOnline = false;
      this.updateEntity(entityId, { isOnline: false });
      throw new Error(`Failed to refresh entity: ${error}`);
    }
  }

  /**
   * Refresh all entities
   */
  async refreshAllEntities(): Promise<void> {
    const entities = this.getEntities();
    const promises = entities.map(entity => 
      this.refreshEntity(entity.id).catch(error => {
        console.error(`Failed to refresh entity ${entity.id}:`, error);
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Get entity type name
   */
  getEntityTypeName(type: EntityType): string {
    switch (type) {
      case EntityType.SWITCH:
        return 'Smart Switch';
      case EntityType.ALARM:
        return 'Smart Alarm';
      case EntityType.STORAGE_MONITOR:
        return 'Storage Monitor';
      default:
        return 'Unknown Entity';
    }
  }

  /**
   * Get entity status description
   */
  getEntityStatusDescription(entity: RustPlusEntity): string {
    switch (entity.type) {
      case EntityType.SWITCH:
        return entity.lastValue ? 'ON' : 'OFF';
      case EntityType.ALARM:
        return entity.lastValue ? 'Triggered' : 'Normal';
      case EntityType.STORAGE_MONITOR:
        if (typeof entity.lastValue === 'number') {
          return `${entity.lastValue} items`;
        }
        return 'Monitoring';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if entity is controllable
   */
  isControllableEntity(entity: RustPlusEntity): boolean {
    return entity.type === EntityType.SWITCH;
  }

  /**
   * Clear all entities for a server
   */
  clearEntitiesForServer(serverId: string): void {
    const entities = this.getEntitiesForServer(serverId);
    entities.forEach(entity => {
      this.entities.delete(entity.id);
      if (entity.isSubscribed) {
        this.subscriptions.delete(entity.entityId);
      }
    });
    
    this.saveEntities();
    this.emit('entitiesCleared', serverId);
  }

  // Private methods
  private setupRustPlusListeners(): void {
    rustPlusService.on('entityChanged', (entityUpdate: EntityUpdate) => {
      this.handleEntityUpdate(entityUpdate);
    });

    rustPlusService.on('connected', () => {
      // Mark all entities as potentially online
      this.getEntities().forEach(entity => {
        this.updateEntity(entity.id, { isOnline: true });
      });
    });

    rustPlusService.on('disconnected', () => {
      // Mark all entities as offline
      this.getEntities().forEach(entity => {
        this.updateEntity(entity.id, { isOnline: false });
      });
    });
  }

  private handleEntityUpdate(update: EntityUpdate): void {
    const entity = this.findEntityByEntityId(update.entityId);
    if (!entity) {
      return; // Entity not tracked
    }

    const oldValue = entity.lastValue;
    const newValue = this.extractEntityValueFromUpdate(update);

    // Update entity
    entity.lastValue = newValue;
    entity.lastUpdated = new Date();
    entity.isOnline = true;
    
    this.updateEntity(entity.id, {
      lastValue: newValue,
      lastUpdated: new Date(),
      isOnline: true
    });

    // Show notification for value changes
    if (oldValue !== newValue) {
      notificationService.showEntityChange(
        entity.entityId,
        this.getEntityTypeName(entity.type),
        newValue,
        oldValue
      );
    }

    this.emit('entityValueChanged', entity, newValue, oldValue);
  }

  private extractEntityValue(entityInfo: EntityInfo): any {
    if (entityInfo.payload.value !== undefined) {
      return entityInfo.payload.value;
    }
    
    if (entityInfo.payload.items) {
      return entityInfo.payload.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    return null;
  }

  private extractEntityValueFromUpdate(update: EntityUpdate): any {
    if (update.value !== undefined) {
      return update.value;
    }
    
    if (update.items) {
      return update.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    return null;
  }

  private loadEntities(): void {
    try {
      const saved = localStorage.getItem('rustlink-entities');
      if (saved) {
        const entities = JSON.parse(saved) as RustPlusEntity[];
        entities.forEach(entity => {
          // Convert date strings back to Date objects
          if (entity.lastUpdated) {
            entity.lastUpdated = new Date(entity.lastUpdated);
          }
          this.entities.set(entity.id, entity);
        });
      }
    } catch (error) {
      console.error('Failed to load entities:', error);
    }
  }

  private saveEntities(): void {
    try {
      const entities = Array.from(this.entities.values());
      localStorage.setItem('rustlink-entities', JSON.stringify(entities));
    } catch (error) {
      console.error('Failed to save entities:', error);
    }
  }
}

// Export singleton instance
export const entityService = new EntityService();