import * as z from "zod";

export const addInventorySchema = z.object({
  stockQuantity: z.number().positive(),
  lowStockThreshold: z.number().positive(),
});

export const adjustInventorySchema = z.object({
  adjustment: z
    .number()
    .int()
    .refine((val) => val !== 0, {
      message: "Adjustment cannot be zero",
    }),
});
