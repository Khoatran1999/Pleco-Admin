const Fish = require("../models/fish.model");

const fishController = {
  async getAll(req, res, next) {
    try {
      const { category_id, size, status, search, limit, offset } = req.query;
      const filters = { category_id, size, status, search, limit, offset };

      const fishes = await Fish.getAll(filters);
      const total = await Fish.count(filters);

      res.json({
        success: true,
        data: fishes,
        meta: {
          total,
          limit: parseInt(limit) || fishes.length,
          offset: parseInt(offset) || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const fish = await Fish.findById(req.params.id);

      if (!fish) {
        return res.status(404).json({
          success: false,
          message: "Fish not found.",
        });
      }

      res.json({
        success: true,
        data: fish,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        sku,
        name,
        scientific_name,
        category_id,
        size,
        description,
        retail_price,
        wholesale_price,
        cost_price,
        unit,
        image,
        min_stock,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required.",
        });
      }

      const fishId = await Fish.create({
        sku,
        name,
        scientific_name,
        category_id,
        size,
        description,
        retail_price,
        wholesale_price,
        cost_price,
        unit,
        image,
        min_stock,
        stock: req.body.stock,
        userId: req.user?.id,
      });

      const fish = await Fish.findById(fishId);

      res.status(201).json({
        success: true,
        message: "Fish created successfully.",
        data: fish,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const fish = await Fish.findById(req.params.id);

      if (!fish) {
        return res.status(404).json({
          success: false,
          message: "Fish not found.",
        });
      }

      await Fish.update(req.params.id, { ...req.body, userId: req.user?.id });
      const updatedFish = await Fish.findById(req.params.id);

      res.json({
        success: true,
        message: "Fish updated successfully.",
        data: updatedFish,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const fish = await Fish.findById(req.params.id);

      if (!fish) {
        return res.status(404).json({
          success: false,
          message: "Fish not found.",
        });
      }

      await Fish.delete(req.params.id);

      res.json({
        success: true,
        message: "Fish deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = fishController;
