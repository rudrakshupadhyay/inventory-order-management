import bcrypt from "bcrypt";
import { UserRole } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import generateUniqueSku from "../src/modules/product/product.service.js";

const productData = [
  {
    name: "Wireless Keyboard",
    description: "Wireless keyboard for backend testing",
    price: 49.99,
    stockQuantity: 20,
    lowStockThreshold: 5,
  },
  {
    name: "Wireless Mouse",
    description: "Wireless mouse for backend testing",
    price: 29.99,
    stockQuantity: 15,
    lowStockThreshold: 5,
  },
  {
    name: "USB-C Hub",
    description: "USB-C hub with low stock for inventory testing",
    price: 39.99,
    stockQuantity: 3,
    lowStockThreshold: 5,
  },
];

async function seedUsers() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const customerPasswordHash = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      name: "System Administrator",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "System Administrator",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { username: "customer" },
    update: {
      name: "Test Customer",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
    },
    create: {
      name: "Test Customer",
      username: "customer",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
    },
  });

  return { admin, customer };
}

async function seedProducts() {
  const products = [];

  for (const data of productData) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: data.name },
    });

    const product = existingProduct
      ? await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            description: data.description,
            price: data.price,
            isActive: true,
          },
        })
      : await prisma.product.create({
          data: {
            name: data.name,
            description: data.description,
            price: data.price,
            isActive: true,
            sku: await generateUniqueSku(data.name),
          },
        });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
      },
      create: {
        productId: product.id,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
      },
    });

    products.push(product);
  }

  return products;
}

async function main() {
  const { admin, customer } = await seedUsers();
  const products = await seedProducts();

  console.log("Seed completed successfully.");
  console.log("");
  console.log("Admin login:");
  console.log("username: admin");
  console.log("password: Admin@123");
  console.log("");
  console.log("Customer login:");
  console.log("username: customer");
  console.log("password: Customer@123");
  console.log("");
  console.log("Products:");

  for (const product of products) {
    console.log(`${product.name} | id: ${product.id} | sku: ${product.sku}`);
  }

  console.log("");
  console.log(`Admin ID: ${admin.id}`);
  console.log(`Customer ID: ${customer.id}`);
  console.log("No orders were created.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
