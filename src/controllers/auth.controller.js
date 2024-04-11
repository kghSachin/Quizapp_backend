import { User } from "../models";
import { ApiResponse } from "../../utils/api_response";
import { ApiError } from "../../utils/api_errors";
// import { Prisma } from '@prisma/client';

class AuthController {
  static async register(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.create({ email, password });
      return res
        .status(201)
        .json(new ApiResponse(201, user, "user created successfully "));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "unable to create the user", error));
    }
  }
}
