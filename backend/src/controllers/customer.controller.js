const Customer = require('../models/customer.model.supabase');

const customerController = {
  async getAll(req, res, next) {
    try {
      const raw = await Customer.getAll();
      const customers = raw?.data ?? raw ?? [];

      res.json({
        success: true,
        data: customers,
        meta: {
          total: customers.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found.',
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  },

  async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required.',
        });
      }

      const customers = await Customer.search(q);

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, email, phone, address, social } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Customer name is required.',
        });
      }

      const customer = await Customer.create({
        name,
        email,
        phone,
        address,
        social,
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully.',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found.',
        });
      }

      await Customer.update(req.params.id, req.body);
      const updatedCustomer = await Customer.findById(req.params.id);

      res.json({
        success: true,
        message: 'Customer updated successfully.',
        data: updatedCustomer,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found.',
        });
      }

      await Customer.delete(req.params.id);

      res.json({
        success: true,
        message: 'Customer deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customerController;
