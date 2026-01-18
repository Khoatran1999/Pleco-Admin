/**
 * Real-time Service using Supabase Realtime
 * Provides WebSocket connections for live updates
 */

const supabase = require("../config/supabase");

class RealtimeService {
  constructor() {
    this.channels = new Map();
  }

  /**
   * Subscribe to inventory changes
   */
  subscribeToInventory(callback) {
    const channel = supabase
      .channel("inventory-realtime")
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
   * Subscribe to new sale orders
   */
  subscribeToSaleOrders(callback) {
    const channel = supabase
      .channel("sale-orders-realtime")
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
   * Subscribe to new import orders
   */
  subscribeToImportOrders(callback) {
    const channel = supabase
      .channel("import-orders-realtime")
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
  subscribeToLowStock(callback) {
    const channel = supabase
      .channel("low-stock-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inventories",
        },
        async (payload) => {
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
            console.log("Low stock alert:", fish.name);
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
  subscribeToPresence(roomId, userId, userInfo, callbacks = {}) {
    const channel = supabase.channel(roomId, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Track presence
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        if (callbacks.onSync) {
          callbacks.onSync(state);
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
        if (callbacks.onJoin) {
          callbacks.onJoin(key, newPresences);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
        if (callbacks.onLeave) {
          callbacks.onLeave(key, leftPresences);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track this user's presence
          await channel.track(userInfo);
          console.log(`Presence subscription status: ${status}`);
        }
      });

    this.channels.set(`presence-${roomId}`, channel);
    return channel;
  }

  /**
   * Broadcast message to a channel
   */
  async broadcast(channelName, event, payload) {
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
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    for (const [name, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      console.log(`Unsubscribed from channel: ${name}`);
    }
    this.channels.clear();
  }

  /**
   * Get all active channels
   */
  getActiveChannels() {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
const realtimeService = new RealtimeService();

module.exports = realtimeService;
