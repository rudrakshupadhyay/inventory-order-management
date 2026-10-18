import type { Request, Response } from "express";
import type * as inventoryType from "./inventory.types.js";
import { prisma } from "../../../lib/prisma.js";

export const addInventory = async (
  req: Request<{ productId: string }, {}, inventoryType.AddInventory>,
  res: Response,
) => {
  const { productId } = req.params;
  const { stockQuantity, lowStockThreshold } = req.body;
  if (productId === undefined) {
    return res.status(400).json({ message: "Product ID is required" });
  }
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const inventory = await prisma.inventory.create({
      data: {
        productId,
        stockQuantity,
        lowStockThreshold,
      },
    });
    res.json({ message: "Inventory added successfully", inventory });
  } catch (error: unknown) {
    console.error("Error adding inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adjustInventory = async (
  req: Request<{ productId: string }, {}, { adjustment: number }>,
  res: Response,
) => {
  const { productId } = req.params;
  const { adjustment } = req.body;

  if (productId === undefined) {
    return res.status(400).json({ message: "Product ID is required" });
  }
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.isActive === false) {
      return res
        .status(400)
        .json({ message: "Cannot adjust inventory for an inactive product" });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    if (inventory.stockQuantity + adjustment < 0) {
      return res
        .status(400)
        .json({ message: "Insufficient stock for adjustment" });
    }

    const updatedInventory = await prisma.inventory.update({
      where: { productId },
      data: {
        stockQuantity: inventory.stockQuantity + adjustment,
      },
    });

    res.json({ message: "Inventory adjusted successfully", updatedInventory });
  } catch (error: unknown) {
    console.error("Error adjusting inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLowStockProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: true,
      },
    });

    const lowStockProducts = products.filter(
      (product) =>
        product.inventory !== null &&
        product.inventory.stockQuantity < product.inventory.lowStockThreshold,
    );

    res.json({ lowStockProducts });
  } catch (error: unknown) {
    console.error("Error fetching low stock products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
