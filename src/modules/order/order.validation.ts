import * as z from "zod";

export const createOrderSchema = z.object({
  productList: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, { message: "At least one product is required" })
    .superRefine((products, ctx) => {
      const seenProductIds = new Set<string>();

      products.forEach((product, index) => {
        if (seenProductIds.has(product.productId)) {
          ctx.addIssue({
            code: "custom",
            message: "Product IDs must be unique",
            path: [index, "productId"],
          });
        }

        seenProductIds.add(product.productId);
      });
    }),
});


