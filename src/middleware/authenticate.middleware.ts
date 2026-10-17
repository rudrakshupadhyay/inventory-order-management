import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { prisma } from "../../lib/prisma.js";
import type { AccessTokenPayload } from "../types/utils.types.js";

async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  try {
    const decoded: AccessTokenPayload = jwt.verify(
      token,
      config.jwtSecret as string,
    ) as AccessTokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid access token" });
    }
    req.decoded = decoded;
    req.user = user;
    next();
  } catch (error: unknown) {
    console.error("Error verifying access token:", error);
    return res.status(401).json({ message: "Invalid access token" });
  }
}

export default authenticate;
