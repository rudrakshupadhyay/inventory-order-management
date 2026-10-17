import type { Request, Response, NextFunction } from "express";

function authorize(Roles: string[]) {
  const allowedRoles = [...Roles];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

export default authorize;
