import { Router } from "express";

import { validate } from "../middleware/validator.middleware.js";
import { LoginSchema, SignUpSchema } from "../validator/auth.validator.js";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();

// Register route

router.route("/register").post(validate(SignUpSchema), AuthController.register);

// Login route
// router.post("/login", validate(LoginSchema), AuthController.login);

export { router as userRoutes };
