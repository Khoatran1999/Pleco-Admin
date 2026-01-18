const Inventory = require("../models/inventory.model.supabase");

const inventoryController = {
  async getAll(req, res, next) {
    try {
      const inventory = await Inventory.getAll();

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
      const inventory = await Inventory.getByFishId(req.params.fishId);

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

      let newQuantity;
      if (type === "add") {
        newQuantity = await Inventory.addStock(
          fish_id,
          quantity,
          req.user.id,
          note,
          "adjustment",
          null,
        );
      } else if (type === "reduce") {
        newQuantity = await Inventory.reduceStock(
          fish_id,
          quantity,
          req.user.id,
          note,
          "adjustment",
          null,
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Use "add" or "reduce".',
        });
      }

      res.json({
        success: true,
        message: "Stock adjusted successfully.",
        data: { fish_id, new_quantity: newQuantity },
      });
    } catch (error) {
      next(error);
    }
  },

  async getLogs(req, res, next) {
    try {
      const { fish_id, limit } = req.query;
      const logs = await Inventory.getLogs(fish_id, parseInt(limit) || 50);

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
      const total = await Inventory.getTotalInventory();

      res.json({
        success: true,
        data: total,
      });
    } catch (error) {
      next(error);
    }
  },

  // Record fish loss/damage
  async recordLoss(req, res, next) {
    try {
      const { fish_id, quantity, loss_reason, note } = req.body;

      if (!fish_id || quantity === undefined || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Fish ID and positive quantity are required.",
        });
      }

      const newQuantity = await Inventory.recordLoss(
        fish_id,
        quantity,
        req.user.id,
        loss_reason,
        note,
      );

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
      const logs = await Inventory.getLossLogs(
        fish_id ? parseInt(fish_id) : null,
        parseInt(limit) || 50,
      );

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
