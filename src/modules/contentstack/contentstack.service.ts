/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as contentstack from '@contentstack/management';

// Use require for the delivery SDK due to module compatibility issues
const Contentstack = require('contentstack');

export interface ContentstackEntry {
  uid: string;
  [key: string]: unknown;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  includeReference?: string[];
  where?: Record<string, unknown>;
}

@Injectable()
export class ContentstackService implements OnModuleInit {
  private deliveryStack: any;
  private stackInstance: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('CONTENTSTACK_API_KEY') || '';
    const deliveryToken = this.configService.get<string>('CONTENTSTACK_DELIVERY_TOKEN') || '';
    const managementToken = this.configService.get<string>('CONTENTSTACK_MANAGEMENT_TOKEN') || '';
    const environment = this.configService.get<string>('CONTENTSTACK_ENVIRONMENT') || 'development';
    const region = this.configService.get<string>('CONTENTSTACK_REGION') || 'us';

    // Initialize Delivery SDK (for reading data)
    this.deliveryStack = Contentstack.Stack({
      api_key: apiKey,
      delivery_token: deliveryToken,
      environment: environment,
      region: this.getRegion(region),
    });

    // Disable SDK caching - always fetch fresh data from network
    if (this.deliveryStack.setCachePolicy && Contentstack.CachePolicy) {
      this.deliveryStack.setCachePolicy(Contentstack.CachePolicy.NETWORK_ONLY);
    }
    // Clear any existing cache
    if (this.deliveryStack.clearAll) {
      this.deliveryStack.clearAll();
    }

    // Initialize Management SDK (for creating/updating data)
    const managementClient = contentstack.client({
      authtoken: managementToken,
    });

    this.stackInstance = managementClient.stack({
      api_key: apiKey,
      management_token: managementToken,
    });
  }

  private getRegion(region: string): any {
    const regionMap: Record<string, any> = {
      us: Contentstack.Region?.US || 'us',
      eu: Contentstack.Region?.EU || 'eu',
      'azure-na': Contentstack.Region?.AZURE_NA || 'azure-na',
      'azure-eu': Contentstack.Region?.AZURE_EU || 'azure-eu',
    };
    return regionMap[region.toLowerCase()] || Contentstack.Region?.US || 'us';
  }

  /**
   * Fetch entries from a content type using Delivery SDK
   */
  async getEntries<T = ContentstackEntry>(
    contentTypeUid: string,
    options: QueryOptions = {},
  ): Promise<T[]> {
    try {
      let query = this.deliveryStack.ContentType(contentTypeUid).Query();

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.skip) {
        query = query.skip(options.skip);
      }

      if (options.includeReference && options.includeReference.length > 0) {
        query = query.includeReference(options.includeReference);
      }

      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.where(key, value);
        });
      }

      const result = await query.toJSON().find();
      return (result[0] || []) as T[];
    } catch (error) {
      console.error(`Error fetching entries from ${contentTypeUid}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single entry by UID using Delivery SDK
   */
  async getEntryByUid<T = ContentstackEntry>(
    contentTypeUid: string,
    entryUid: string,
    includeReference?: string[],
  ): Promise<T | null> {
    try {
      let entry = this.deliveryStack.ContentType(contentTypeUid).Entry(entryUid);

      if (includeReference && includeReference.length > 0) {
        entry = entry.includeReference(includeReference);
      }

      const result = await entry.toJSON().fetch();
      return result as T;
    } catch (error) {
      console.error(`Error fetching entry ${entryUid} from ${contentTypeUid}:`, error);
      return null;
    }
  }

  /**
   * Find entry by field value using Delivery SDK
   */
  async findEntryByField<T = ContentstackEntry>(
    contentTypeUid: string,
    fieldName: string,
    fieldValue: string | number | boolean,
  ): Promise<T | null> {
    try {
      const query = this.deliveryStack
        .ContentType(contentTypeUid)
        .Query()
        .where(fieldName, fieldValue)
        .limit(1);

      const result = await query.toJSON().find();
      const entries = result[0] || [];
      return entries.length > 0 ? (entries[0] as T) : null;
    } catch (error) {
      console.error(`Error finding entry by ${fieldName} in ${contentTypeUid}:`, error);
      return null;
    }
  }

  /**
   * Create a new entry using Management SDK
   */
  async createEntry<T = ContentstackEntry>(
    contentTypeUid: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    try {
      const entry = await this.stackInstance
        .contentType(contentTypeUid)
        .entry()
        .create({ entry: data });

      // Publish the entry
      const environment = this.configService.get<string>('CONTENTSTACK_ENVIRONMENT') || 'development';
      await entry.publish({
        publishDetails: {
          environments: [environment],
          locales: ['en-us'],
        },
      });

      return entry as unknown as T;
    } catch (error) {
      console.error(`Error creating entry in ${contentTypeUid}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing entry using Management SDK
   */
  async updateEntry<T = ContentstackEntry>(
    contentTypeUid: string,
    entryUid: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    try {
      const entry = await this.stackInstance.contentType(contentTypeUid).entry(entryUid).fetch();

      // Update fields
      Object.assign(entry, data);

      const updatedEntry = await entry.update();

      // Publish the updated entry
      const environment = this.configService.get<string>('CONTENTSTACK_ENVIRONMENT') || 'development';
      await updatedEntry.publish({
        publishDetails: {
          environments: [environment],
          locales: ['en-us'],
        },
      });

      return updatedEntry as unknown as T;
    } catch (error) {
      console.error(`Error updating entry ${entryUid} in ${contentTypeUid}:`, error);
      throw error;
    }
  }

  /**
   * Delete an entry using Management SDK
   */
  async deleteEntry(contentTypeUid: string, entryUid: string): Promise<void> {
    try {
      const entry = await this.stackInstance.contentType(contentTypeUid).entry(entryUid).fetch();
      await entry.delete();
    } catch (error) {
      console.error(`Error deleting entry ${entryUid} from ${contentTypeUid}:`, error);
      throw error;
    }
  }

  /**
   * Get count of entries matching criteria
   */
  async getEntryCount(contentTypeUid: string, where?: Record<string, unknown>): Promise<number> {
    try {
      let query = this.deliveryStack.ContentType(contentTypeUid).Query();

      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          query = query.where(key, value);
        });
      }

      const result = await query.count().find();
      return result[1] || 0;
    } catch (error) {
      console.error(`Error getting count from ${contentTypeUid}:`, error);
      return 0;
    }
  }
}
