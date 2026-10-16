import { Router } from "express";
import * as authController from "./auth.controller.js";
import validate from "../../middleware/validate.js";
import { registerSchema } from "./auth.validation.js";

const authRouter = Router();

/*
POST /api/auth/register
*/
authRouter.post("/register",validate(registerSchema), authController.register);
