import { Router } from "express";
import * as authController from "./auth.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { registerSchema } from "./auth.validation.js";

const authRouter = Router();

/*
POST /api/auth/register
*/
authRouter.post("/register", validate(registerSchema), authController.register);

/*
POST /api/auth/login
*/
authRouter.post("/login", authController.login);

/*
GET /api/auth/getme
*/
authRouter.get("/getme", authController.getme);

/*
GET /api/auth/refreshToken
*/
authRouter.get("/refreshToken", authController.refresh);

/*
GET /api/auth/logout
*/
authRouter.get("/logout", authController.logout);

export default authRouter;
