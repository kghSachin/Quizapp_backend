import jwt from "jsonwebtoken";

export const generateAccessToken = (payload) => {
  return jwt.sign({ id: payload }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};
export const generateRefreshToken = (payload) => {
  return jwt.sign({ id: payload }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};
