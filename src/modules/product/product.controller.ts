import { prisma } from "../../../lib/prisma.js";
import type { Request, Response } from "express";
import generateUniqueSku from "./product.service.js";
import type * as productType from "./product.types.js";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json({ message: "Products retrieved successfully", products });
  } catch (error: unknown) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product retrieved successfully", product });
  } catch (error: unknown) {
    console.error("Error retrieving product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProduct = async (
  req: Request<{}, {}, productType.Product>,
  res: Response,
) => {
  const { name, description, price, isActive } = req.body;
  const sku = await generateUniqueSku(name);
  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        description: description ?? null,
        price,
        isActive,
        sku,
      },
    });
    res
      .status(201)
      .json({ message: "Product created successfully", product: newProduct });
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (
  req: Request<{ id: string }, {}, Partial<productType.Product>>,
  res: Response,
) => {
  const { id } = req.params;
  const { name, description, price, isActive } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const deletedProduct = await prisma.product.delete({
      where: { id },
    });
    res.json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error: unknown) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
