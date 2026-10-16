import * as z from "zod";
import { prisma } from "../../../lib/prisma.js";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .refine(async (username) => {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      return !existingUser;
    }, "Username already exists"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
