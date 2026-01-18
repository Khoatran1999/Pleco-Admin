const ImportOrder = require("../models/importOrder.model.supabase");

/**
 * Transform raw order data to include flattened supplier info
 */
function transformOrder(order) {
  if (!order) return order;
  return {
    ...order,
    supplier_name: order.suppliers?.name || null,
    supplier_contact: order.suppliers?.contact_person || null,
    supplier_phone: order.suppliers?.phone || null,
    supplier_email: order.suppliers?.email || null,
    created_by_name: order.users?.full_name || order.users?.username || null,
  };
}

const importOrderController = {
  async getAll(req, res, next) {
    try {
      const { status, supplier_id, limit } = req.query;
      const filters = { status, supplier_id, limit };

      const orders = await ImportOrder.getAll(filters);

      // Transform orders to flatten nested supplier/user data
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
      const order = await ImportOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Import order not found.",
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
      const { supplier_id, expected_delivery, notes, items, total_amount } =
        req.body;

      if (!supplier_id || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Supplier ID and at least one item are required.",
        });
      }

      // Validate items
      for (const item of items) {
        if (!item.fish_id || !item.quantity || !item.unit_price) {
          return res.status(400).json({
            success: false,
            message: "Each item must have fish_id, quantity, and unit_price.",
          });
        }
      }

      const orderId = await ImportOrder.create(
        { supplier_id, expected_delivery, notes, total_amount },
        items,
        req.user.id,
      );

      const order = await ImportOrder.findById(orderId);

      res.status(201).json({
        success: true,
        message: "Import order created successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status, total_amount } = req.body;
      const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Valid status is required (pending, confirmed, delivered, cancelled).",
        });
      }

      const order = await ImportOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Import order not found.",
        });
      }

      await ImportOrder.updateStatus(
        req.params.id,
        status,
        req.user.id,
        total_amount,
      );

      const updatedOrder = await ImportOrder.findById(req.params.id);

      res.json({
        success: true,
        message: `Order status updated to ${status}.`,
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const order = await ImportOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Import order not found.",
        });
      }

      if (order.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending orders can be deleted.",
        });
      }

      await ImportOrder.delete(req.params.id);

      res.json({
        success: true,
        message: "Import order deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = importOrderController;
