import { prisma } from "../../../lib/prisma";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config/config.js";

interface RegisterRequestBody {
  name: string;
  username: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response,
): Promise<void> => {
  const { name, username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash: hashedPassword,
    },
  });

  const refreshToken: string = jwt.sign(
    { id: newUser.id },
    config.jwtSecret as string,
    { expiresIn: "7d" },
  );

  const refreshTokenHash: string = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await prisma.session.create({
    data: {
      userId: newUser.id,
      refreshTokenHash,
      ip: req.ip ?? "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    },
  });

  const accessToken: string = jwt.sign(
    { id: newUser.id, sessionId: session.id },
    config.jwtSecret as string,
    { expiresIn: "15m" },
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.status(201).json({
    message: "User registered successfully",
    user: newUser,
    accessToken,
  });
};
