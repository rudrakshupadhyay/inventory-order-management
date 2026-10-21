import type { Request, Response } from "express";
import type * as orderType from "./order.types.js";
import { prisma } from "../../../lib/prisma.js";

class OrderApprovalError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export const createOrder = async (
  req: Request<{}, {}, orderType.CreateOrderBody>,
  res: Response,
) => {
  try {
    const userId: number = req.user.id;
    const { productList } = req.body;

    // Fetch products and validate availability
    const orderedItems = await Promise.all(
      productList.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (!product.isActive) {
          throw new Error(`Product ${product.name} is inactive`);
        }

        if (!product.inventory) {
          throw new Error(
            `Inventory for product ${product.name} with ID ${item.productId} not found`,
          );
        }

        if (product.inventory.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        return {
          ...product,
          orderQuantity: item.quantity,
        };
      }),
    );

    // Calculate total using database prices
    const totalAmount = orderedItems.reduce(
      (total, item) => total + Number(item.price) * item.orderQuantity,
      0,
    );

    // Create order and order items atomically
    const { order, orderItemList } = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
        },
      });

      const orderItemList = await Promise.all(
        orderedItems.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.id,
              quantity: item.orderQuantity,
            },
          }),
        ),
      );

      return { order, orderItemList };
    });

    return res.status(201).json({
      message: "Order created successfully",
      order,
      orderItemList,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);

    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getPendingOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        OrderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }
    return res.status(200).json({ orders });
  } catch (error: unknown) {
    console.error("Error retrieving orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const approveOrder = async (
  req: Request<{ orderId: string }, {}, {}>,
  res: Response,
) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }
  try {
    const approvedOrder = await prisma.$transaction(async (tx) => {
      const approvedOrder = await tx.order.updateMany({
        where: {
          id: orderId,
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
        },
      });

      if (!approvedOrder || approvedOrder.count === 0) {
        throw new OrderApprovalError(
          "Order not found or already approved",
          409,
        );
      }

      const orderItems = await tx.orderItem.findMany({
        where: {
          orderId,
        },
      });

      if (orderItems.length === 0) {
        throw new OrderApprovalError("No items found for this order", 400);
      }

      for (const item of orderItems) {
        const updated = await tx.inventory.updateMany({
          where: {
            productId: item.productId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new OrderApprovalError(
            `Insufficient stock for product ${item.productId}`,
            409,
          );
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { OrderItems: true },
      });
    });

    return res.status(200).json({
      message: "Order approved and inventory approved successfully",
      approvedOrder,
    });
  } catch (error: unknown) {
    console.error("Error approving order:", error);
    if (error instanceof OrderApprovalError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const rejectOrder = async (
  req: Request<{ orderId: string }, {}, {}>,
  res: Response,
) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }
  try {
    const rejectedOrder = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
      },
      data: {
        status: "REJECTED",
      },
    });

    if (!rejectedOrder) {
      return res
        .status(404)
        .json({ message: "Order not found or already processed" });
    }

    return res.status(200).json({
      message: "Order rejected successfully",
      rejectedOrder,
    });
  } catch (error: unknown) {
    console.error("Error rejecting order:", error);
    if (error instanceof OrderApprovalError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const cancelOrder = async (
  req: Request<{ orderId: string }, {}, {}>,
  res: Response,
) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const canceledOrder = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (!canceledOrder) {
      return res
        .status(404)
        .json({ message: "Order not found or already processed" });
    }

    return res.status(200).json({
      message: "Order cancelled successfully",
      canceledOrder,
    });
  } catch (error: unknown) {
    console.error("Error cancelling order:", error);
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deliverOrder = async (
  req: Request<{ orderId: string }, {}, {}>,
  res: Response,
) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const deliveredOrder = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
      },
      data: {
        status: "DELIVERED",
      },
    });

    if (!deliveredOrder) {
      return res
        .status(404)
        .json({ message: "Order not found or already processed" });
    }

    return res.status(200).json({
      message: "Order delivered successfully",
      deliveredOrder,
    });
  } catch (error: unknown) {
    console.error("Error delivering order:", error);
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
