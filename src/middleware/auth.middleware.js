import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/api_errors";
import { prisma } from "../../DB/db.config.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json(new ApiError(401, "Unauthorized request", []));
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken)
      return res
        .status(401)
        .json(new ApiError(401, "Unauthorized request", []));
    console.log("decoded token is ", decodedToken);
    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken.id,
      },
    });
    if (!user) {
      return res.status(401).json(new ApiError(401, "user not found", []));
    }
    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json(
        new ApiError(
          401,
          "unable to verify the token",
          error.message || "invalid access token"
        )
      );
  }
};
