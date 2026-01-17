const Supplier = require("../models/supplier.model");

const supplierController = {
  async getAll(req, res, next) {
    try {
      const suppliers = await Supplier.getAll();

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const supplier = await Supplier.findById(req.params.id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found.",
        });
      }

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, contact_person, email, phone, address } = req.body;
      // handle uploaded file
      const avatarPath = req.file
        ? `/uploads/suppliers/${req.file.filename}`
        : null;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Supplier name is required.",
        });
      }

      const supplierId = await Supplier.create({
        name,
        contact_person,
        email,
        phone,
        address,
        avatar: avatarPath,
      });

      const supplier = await Supplier.findById(supplierId);

      res.status(201).json({
        success: true,
        message: "Supplier created successfully.",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const supplier = await Supplier.findById(req.params.id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found.",
        });
      }

      // handle uploaded file
      const avatarPath = req.file
        ? `/uploads/suppliers/${req.file.filename}`
        : null;
      const updateData = { ...req.body };
      if (avatarPath) updateData.avatar = avatarPath;

      await Supplier.update(req.params.id, updateData);
      const updatedSupplier = await Supplier.findById(req.params.id);

      res.json({
        success: true,
        message: "Supplier updated successfully.",
        data: updatedSupplier,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const supplier = await Supplier.findById(req.params.id);

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found.",
        });
      }

      await Supplier.delete(req.params.id);

      res.json({
        success: true,
        message: "Supplier deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = supplierController;
