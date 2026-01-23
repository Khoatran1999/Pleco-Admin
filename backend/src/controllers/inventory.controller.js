const Inventory = require("../models/inventory.model.supabase");

const inventoryController = {
  async getAll(req, res, next) {
    try {
      const result = await Inventory.getAll();
      const inventory = result.data || [];

      res.json({
        success: true,
        data: inventory,
        meta: {
          total: inventory.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getByFishId(req, res, next) {
    try {
      const result = await Inventory.getByFishId(req.params.fishId);
      const inventory = result.data;

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Inventory record not found.",
        });
      }

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  },

  async adjustStock(req, res, next) {
    try {
      const { fish_id, quantity, type, note } = req.body;

      if (!fish_id || quantity === undefined || !type) {
        return res.status(400).json({
          success: false,
          message: "Fish ID, quantity, and type are required.",
        });
      }

      // Load current inventory to calculate new quantity
      const currentResult = await Inventory.getByFishId(fish_id);
      const currentQuantity = currentResult?.data?.quantity || 0;

      let targetQuantity = currentQuantity;
      if (type === "add") {
        targetQuantity = currentQuantity + parseFloat(quantity);
      } else if (type === "reduce") {
        targetQuantity = currentQuantity - parseFloat(quantity);
        if (targetQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: "Resulting quantity cannot be negative.",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Use "add" or "reduce".',
        });
      }

      // Persist new quantity & create log via generic helper
      await Inventory.updateQuantity(
        fish_id,
        targetQuantity,
        "adjustment",
        null,
        req.user.id,
        note,
      );

      res.json({
        success: true,
        message: "Stock adjusted successfully.",
        data: { fish_id, new_quantity: targetQuantity },
      });
    } catch (error) {
      next(error);
    }
  },

  async getLogs(req, res, next) {
    try {
      const { fish_id, limit } = req.query;
      const result = await Inventory.getLogs({
        fish_id,
        limit: parseInt(limit) || 50,
      });
      const logs = result.data || [];

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTotal(req, res, next) {
    try {
      const summary = await Inventory.getSummary();

      res.json({
        success: true,
        data: summary.data,
      });
    } catch (error) {
      next(error);
    }
  },

  // Record fish loss/damage
  async recordLoss(req, res, next) {
    try {
      const { fish_id, quantity, loss_reason } = req.body;

      if (!fish_id || quantity === undefined || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Fish ID and positive quantity are required.",
        });
      }

      const result = await Inventory.recordLoss(
        fish_id,
        quantity,
        loss_reason,
        req.user.id,
      );
      const newQuantity = result?.data?.new_quantity;

      res.json({
        success: true,
        message: "Loss recorded successfully.",
        data: { fish_id, new_quantity: newQuantity },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get loss history
  async getLossLogs(req, res, next) {
    try {
      const { fish_id, limit } = req.query;
      const result = await Inventory.getLogs({
        fish_id: fish_id ? parseInt(fish_id) : undefined,
        type: "loss",
        limit: parseInt(limit) || 50,
      });
      const logs = result.data || [];

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = inventoryController;
