const Category = require("../models/category.model.supabase");

const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await Category.getAll();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Category name is required.",
        });
      }

      // Check if category already exists
      const existing = await Category.findByName(name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists.",
        });
      }

      const categoryId = await Category.create({ name, description });
      const category = await Category.findById(categoryId);

      res.status(201).json({
        success: true,
        message: "Category created successfully.",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      const { name, description } = req.body;

      // Check if name already exists for another category
      if (name && name !== category.name) {
        const existing = await Category.findByName(name);
        if (existing) {
          return res.status(400).json({
            success: false,
            message: "Category with this name already exists.",
          });
        }
      }

      await Category.update(req.params.id, {
        name: name || category.name,
        description:
          description !== undefined ? description : category.description,
      });

      const updatedCategory = await Category.findById(req.params.id);

      res.json({
        success: true,
        message: "Category updated successfully.",
        data: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      await Category.delete(req.params.id);

      res.json({
        success: true,
        message: "Category deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = categoryController;
