import { prisma } from "../../../lib/prisma.js";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config/config.js";
import type * as authTypes from "./auth.types.js";

export const register = async (
  req: Request<{}, {}, authTypes.RegisterRequestBody>,
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

export const login = async (
  req: Request<{}, {}, authTypes.LoginRequestBody>,
  res: Response,
): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) {
    res.status(401).json({ message: "Invalid username or password" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid username or password" });
    return;
  }
  const refreshToken: string = jwt.sign(
    { id: user.id },
    config.jwtSecret as string,
    { expiresIn: "7d" },
  );

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  const refreshTokenHash: string = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      ip: req.ip ?? "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    },
  });
  const accessToken: string = jwt.sign(
    { id: user.id, sessionId: session.id },
    config.jwtSecret as string,
    { expiresIn: "15m" },
  );

  res.status(200).json({
    message: "Login successful",
    user,
    accessToken,
  });
};

export const getme = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access token is missing" });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, config.jwtSecret as string);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error: unknown) {
    console.error("Error fetching current user:", error);

    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token is missing" });
    return;
  }

  try {
    const decoded: any = jwt.verify(refreshToken, config.jwtSecret as string);
    const refreshTokenHash: string = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await prisma.session.findFirst({
      where: { refreshTokenHash, revoked: false },
    });

    if (!session) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const accessToken: string = jwt.sign(
      { id: decoded.id, sessionId: session.id },
      config.jwtSecret as string,
      { expiresIn: "15m" },
    );

    const newRefreshToken: string = jwt.sign(
      { id: decoded.id },
      config.jwtSecret as string,
      { expiresIn: "7d" },
    );

    const newRefreshTokenHash: string = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error: unknown) {
    console.error("Error refreshing token:", error);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token is missing" });
    return;
  }

  try {
    const refreshTokenHash: string = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const session = await prisma.session.findFirst({
      where: { refreshTokenHash, revoked: false },
    });
    if (!session) {
      res.status(400).json({ message: "Invalid or expired refresh token" });
      return;
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { revoked: true },
    });

    res.clearCookie("refreshToken", { path: "/" });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Error occurred while logging out" });
  }
};
