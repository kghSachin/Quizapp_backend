import { Router } from "express";

import { validate } from "../middleware/validator.middleware.js";
import { LoginSchema, SignUpSchema } from "../validator/auth.validator.js";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();

// Register route

router.route("/register").post(validate(SignUpSchema), AuthController.register);

// Login route
router.post("/login", validate(LoginSchema), AuthController.login);

//verify user
router.post("/verify-user", AuthController.verifyUser);

//forgot password
router.post("/forgot-password", AuthController.forgotPassword);

//verify code and reset password
router.post("/verify-code", AuthController.verifyCodeForForgotPassword);

//regenerate access token
router.post("/generate-token", AuthController.regenerateAccessToken);

//reset password
router.post("/reset-password", AuthController.resetPassword);

export { router as userRoutes };
