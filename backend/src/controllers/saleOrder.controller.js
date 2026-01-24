const SaleOrder = require('../models/saleOrder.model.supabase');

/**
 * Transform raw order data to include flattened customer info
 */
function transformOrder(order) {
  if (!order) return order;
  return {
    ...order,
    customer_name: order.customers?.name || order.customer_name || null,
    customer_social: order.customers?.social || null,
    customer_phone: order.customers?.phone || null,
    customer_email: order.customers?.email || null,
    customer_address: order.customers?.address || null,
    customer_type: order.customers?.customer_type || null,
    created_by_name: order.users?.full_name || order.users?.username || null,
  };
}

const saleOrderController = {
  async getAll(req, res, next) {
    try {
      const { status, customer_id, date_from, date_to, limit } = req.query;
      const filters = { status, customer_id, date_from, date_to, limit };

      const raw = await SaleOrder.getAll(filters);
      const orders = raw?.data ?? raw ?? [];

      // Transform orders to flatten nested customer/user data
      const transformedOrders = orders.map(transformOrder);

      res.json({
        success: true,
        data: transformedOrders,
        meta: {
          total: transformedOrders.length,
          filtered: transformedOrders.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const order = await SaleOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sale order not found.',
        });
      }

      res.json({
        success: true,
        data: transformOrder(order),
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        customer_id,
        customer_name,
        order_date,
        sale_type,
        status,
        payment_method,
        discount_amount,
        notes,
        items,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one item is required.',
        });
      }

      // Validate items
      for (const item of items) {
        if (!item.fish_id || !item.quantity || !item.unit_price) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have fish_id, quantity, and unit_price.',
          });
        }
      }

      const result = await SaleOrder.create(
        {
          customer_id,
          customer_name,
          order_date,
          sale_type,
          status,
          payment_method,
          discount_amount,
          notes,
          items,
        },
        req.user.id,
      );

      // result is the order object directly from model
      const order = result;

      res.status(201).json({
        success: true,
        message: 'Sale order created successfully.',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (pending, processing, completed, cancelled).',
        });
      }

      const order = await SaleOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sale order not found.',
        });
      }

      if (status === 'cancelled') {
        await SaleOrder.cancel(req.params.id, req.user.id);
      } else {
        await SaleOrder.updateStatus(req.params.id, status, req.user.id);
      }

      const updatedOrder = await SaleOrder.findById(req.params.id);

      res.json({
        success: true,
        message: `Order status updated to ${status}.`,
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { customer_id, customer_name, notes } = req.body;

      const order = await SaleOrder.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Sale order not found.' });
      }

      await SaleOrder.updateOrder(
        req.params.id,
        { customer_id, customer_name, notes },
        req.user.id,
      );

      const updated = await SaleOrder.findById(req.params.id);
      res.json({ success: true, message: 'Order updated.', data: updated });
    } catch (error) {
      next(error);
    }
  },

  async getTodaySales(req, res, next) {
    try {
      const sales = await SaleOrder.getTodaySales();

      res.json({
        success: true,
        data: sales,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = saleOrderController;
