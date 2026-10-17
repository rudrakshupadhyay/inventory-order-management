import type { User } from "../../generated/prisma";
import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      decoded?: JwtPayload;
      user?: User;
    }
  }
}

export {};