import { prisma } from "../../../lib/prisma.js";

async function generateUniqueSku(name: string): Promise<string> {
  const baseSku = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let sku = baseSku;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { sku } })) {
    sku = `${baseSku}-${counter}`;
    counter++;
  }
  return sku;
}

export default generateUniqueSku;
