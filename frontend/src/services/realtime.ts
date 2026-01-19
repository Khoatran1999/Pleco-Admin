/**
 * Frontend Real-time Service for Supabase
 * Manages subscriptions and real-time updates
 * NOTE: Realtime features only work when Supabase env variables are set
 */

import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

type InventoryChangePayload = {
  fish_id: number;
  quantity: number;
  location?: string;
};

type OrderChangePayload = {
  id: number;
  status: string;
  total_amount: number;
};

type LowStockAlert = {
  fish_id: number;
  fish_name: string;
  quantity: number;
  min_stock: number;
};

type PresenceState = {
  [key: string]: Array<{
    user_id: string;
    username: string;
    role: string;
    online_at: string;
  }>;
};

// Dummy channel for when Supabase is not available
const createDummyChannel = (): RealtimeChannel => {
  return {
    subscribe: () => ({ status: "SUBSCRIBED" }),
    unsubscribe: () => Promise.resolve("ok"),
    on: () => ({ subscribe: () => ({}) }),
  } as unknown as RealtimeChannel;
};

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to inventory changes
   */
  subscribeToInventory(callback: (payload: any) => void): RealtimeChannel {
    if (!supabase) {
      console.warn("Supabase not initialized - realtime disabled");
      return createDummyChannel();
    }
    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventories",
        },
        (payload) => {
          console.log("Inventory change:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(`Inventory subscription status: ${status}`);
      });

    this.channels.set("inventory", channel);
    return channel;
  }

  /**
   * Subscribe to sale orders
   */
  subscribeToSaleOrders(callback: (payload: any) => void): RealtimeChannel {
    if (!supabase) {
      return createDummyChannel();
    }
    const channel = supabase
      .channel("sale-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sale_orders",
        },
        (payload) => {
          console.log("Sale order change:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(`Sale orders subscription status: ${status}`);
      });

    this.channels.set("sale_orders", channel);
    return channel;
  }

  /**
   * Subscribe to import orders
   */
  subscribeToImportOrders(callback: (payload: any) => void): RealtimeChannel {
    if (!supabase) {
      return createDummyChannel();
    }
    const channel = supabase
      .channel("import-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "import_orders",
        },
        (payload) => {
          console.log("Import order change:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(`Import orders subscription status: ${status}`);
      });

    this.channels.set("import_orders", channel);
    return channel;
  }

  /**
   * Subscribe to low stock alerts
   */
  subscribeToLowStock(
    callback: (alert: LowStockAlert) => void,
  ): RealtimeChannel {
    if (!supabase) {
      return createDummyChannel();
    }
    const channel = supabase
      .channel("low-stock-alerts")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inventories",
        },
        async (payload: any) => {
          // Check if inventory is now low stock
          const { data: fish } = await supabase
            .from("fishes")
            .select("min_stock, name")
            .eq("id", payload.new.fish_id)
            .single();

          if (
            fish &&
            payload.new.quantity <= fish.min_stock &&
            payload.new.quantity > 0
          ) {
            callback({
              fish_id: payload.new.fish_id,
              fish_name: fish.name,
              quantity: payload.new.quantity,
              min_stock: fish.min_stock,
            });
          }
        },
      )
      .subscribe((status) => {
        console.log(`Low stock subscription status: ${status}`);
      });

    this.channels.set("low_stock", channel);
    return channel;
  }

  /**
   * Subscribe to user presence (who's online)
   */
  subscribeToPresence(
    roomId: string,
    userId: string,
    userInfo: { username: string; role: string },
    callbacks?: {
      onSync?: (state: PresenceState) => void;
      onJoin?: (key: string, currentPresences: any) => void;
      onLeave?: (key: string, leftPresences: any) => void;
    },
  ): RealtimeChannel {
    if (!supabase) {
      return createDummyChannel();
    }
    const channel = supabase.channel(roomId, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        console.log("Presence sync:", state);
        if (callbacks?.onSync) {
          callbacks.onSync(state);
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
        if (callbacks?.onJoin) {
          callbacks.onJoin(key, newPresences);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
        if (callbacks?.onLeave) {
          callbacks.onLeave(key, leftPresences);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            username: userInfo.username,
            role: userInfo.role,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.channels.set(`presence-${roomId}`, channel);
    return channel;
  }

  /**
   * Broadcast a message to a channel
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: any,
  ): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not found`);
    }

    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel && supabase) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    if (!supabase) return;
    for (const [name, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      console.log(`Unsubscribed from channel: ${name}`);
    }
    this.channels.clear();
  }

  /**
   * Get list of active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
