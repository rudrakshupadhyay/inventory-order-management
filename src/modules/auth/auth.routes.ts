import { Router } from "express";
import * as authController from "./auth.controller.js";
import validate from "../../middleware/validate.js";
import { registerSchema } from "./auth.validation.js";

const authRouter = Router();

/*
POST /api/auth/register
*/
authRouter.post("/register",validate(registerSchema), authController.register);

/*
POST /api/auth/login
*/
authRouter.post("/login", authController.login);

/*
GET /api/auth/getme
*/
authRouter.get("/getme", authController.getme);

export default authRouter;