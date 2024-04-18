import prisma from "../../DB/db.config.js";
import { ApiResponse } from "../../utils/api_response.js";
import { ApiError } from "../../utils/api_errors.js";
import bcrypt from "bcrypt";
import { json } from "express";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/genereate-token.js";
import { Resend } from "resend";
import uploadOnCloudinary from "../../utils/cloudinary.config.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export class AuthController {
  static async register(req, res) {
    try {
      let { email, password, username } = req.body;
      const salt = bcrypt.genSaltSync(10);
      password = bcrypt.hashSync(password, salt);
      console.log("working ");
      const userExists = await prisma.user.findFirst({
        where: {
          email: email,
        },
      });
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("user exists");
      console.log(userExists);
      if (userExists) {
        if (userExists.isVerified === false) {
          userExists.password = password;
          userExists.username = username;
          userExists.verifyCode = verifyCode;
          userExists.email = email;
          userExists.updatedAt = new Date();
          userExists.codeExpiryDate = new Date(Date.now() + 60000);
          await prisma.user.update({
            where: {
              id: userExists.id,
            },
            data: userExists,
          });
          await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [userExists.email],
            subject: "VERIFY YOUR IDENTITY",
            text: verifyCode,
          });
          return res
            .status(201)
            .json(
              new ApiResponse(
                201,
                userExists,
                "user created successfully! please verify"
              )
            );
        } else {
          res.status(400).json(new ApiError(400, "user already exists", []));
        }
      }
      const user = await prisma.user.create({
        data: {
          email: email,
          password: password,
          username: username,
          verifyCode: verifyCode,
          codeExpiryDate: new Date(Date.now() + 60000 * 30),
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: [user.email],
        subject: "VERIFY YOUR IDENTITY",
        text: verifyCode,
      });
      return res
        .status(201)
        .json(new ApiResponse(201, user, "user created successfully "));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "unable to create the user", error.message));
    }
  }

  static async login(req, res) {
    try {
      const { email, password, username } = req.body;
      if (!email && !username) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "username or email is required",
              "username or email is required"
            )
          );
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { username: username }],
        },
      });

      if (!user) {
        return res
          .status(404)
          .json(new ApiError(400, "user doesn't exist", []));
      }
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json(new ApiError(400, "invalid password", []));
      }
      console.log(user);
      const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user.id);
      console.log(accessToken, refreshToken);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken: refreshToken,
        },
      });
      return res
        .status(200)
        .cookie("refreshToken", refreshToken)
        .cookie("accessToken", accessToken)
        .json(new ApiResponse(200, { user, accessToken }, "login successful"));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error ", error.message));
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "logout successful"));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error", error.message));
    }
  }

  static async regenerateAccessToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res
          .status(400)
          .json(new ApiError(400, "refreshToken is required", []));
      }
      console.log("refreshToken is ", refreshToken);
      const isTokenValid = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      if (!isTokenValid) {
        return res
          .status(400)
          .json(new ApiError(400, "invalid refreshToken", []));
      }
      const userId = isTokenValid.id;
      console.log("userId is ", userId);
      const accessToken = generateAccessToken({ id: userId });
      return res
        .status(200)
        .cookie("accessToken", accessToken)
        .json(new ApiResponse(200, { accessToken }, "accessToken regenerated"));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "can't generate token", error.message));
    }
  }

  static async self(req, res) {
    try {
      //TODO:write logic for self
    } catch (error) {
      return json.res
        .status(500)
        .json(new ApiError(500, "Can't connect at the moment", error));
    }
  }
  // user verification after registration.
  static async verifyUser(req, res) {
    try {
      const { code } = req.body;
      const user = await prisma.user.findFirst({
        where: {
          verifyCode: code,
        },
      });
      console.log(user);
      if (!user) {
        return res
          .status(400)
          .json(new ApiError(400, "invalid code", ["Create a new code"]));
      }
      console.log(user.codeExpiryDate, new Date());
      if (user.codeExpiryDate < new Date()) {
        return res
          .status(400)
          .json(new ApiError(400, "code expired", ["Create a new code"]));
      }
      user.isVerified = true;
      user.verifyCode = null;
      user.codeExpiryDate = null;
      user.updatedAt = new Date();
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: user,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, user, "user verified successfully"));
    } catch (error) {
      return json.res
        .status(500)
        .json(new ApiError(500, "Can't connect at the moment", error));
    }
  }

  //reset password
  static async resetPassword(req, res) {
    try {
      const { email, password, newPassword } = req.body;
      const user = await prisma.user.findFirst({
        where: {
          email: email,
        },
      });
      if (!user) {
        return res
          .status(400)
          .json(new ApiError(400, "cant find user", ["invalid id or email"]));
      }
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(400)
          .json(
            new ApiError(400, "invalid password", ["Enter a valid password"])
          );
      }
      const salt = bcrypt.genSaltSync(10);
      const newPasswordHashed = bcrypt.hashSync(newPassword, salt);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: newPasswordHashed,
        },
      });
      return res
        .status(200)
        .json(new ApiResponse(200, user, "password reset successfully"));
    } catch (error) {
      return res
        .status(500)
        .json(new ApiError(500, "unable to reset password", error));
    }
  }

  //forgot password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json(new ApiError(400, "email is required", []));
      }
      const user = await prisma.user.findFirst({
        where: {
          email: email,
        },
      });
      if (!user) {
        return res
          .status(400)
          .json(new ApiError(400, "user doesn't exist", []));
      }
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verifyCode = verifyCode;
      user.codeExpiryDate = new Date(Date.now() + 60000 * 30);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: user,
      });
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: [email],
        subject: "CHANGE YOUR PASSWORD",
        text: verifyCode,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "code sent successfully"));
    } catch (error) {
      return res.status(500).json(new ApiError(500, error.message, error));
    }
  }

  // verify and change password for forgot password
  static async verifyCodeForForgotPassword(req, res) {
    try {
      const { code, email, password } = req.body;
      if (!code || !email || !password) {
        return res
          .status(400)
          .json(
            new ApiError(400, "fill all the required fields", [
              "code is required ",
              "email is required ",
              "password is required ",
            ])
          );
      }
      const user = await prisma.user.findFirst({
        where: {
          email: email,
          verifyCode: code,
        },
      });
      if (!user) {
        return res
          .status(400)
          .json(new ApiError(400, "invalid code", ["Create a new code"]));
      }
      if (user.codeExpiryDate < new Date()) {
        return res
          .status(400)
          .json(new ApiError(400, "code expired", ["Create a new code"]));
      }
      const salt = bcrypt.genSaltSync(10);
      const newPassword = bcrypt.hashSync(password, salt);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          verifyCode: null,
          codeExpiryDate: null,
          password: newPassword,
        },
      });
      return res
        .status(200)
        .json(
          new ApiResponse(200, { data: "login to continue" }, "code verified")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(500, error.message, error));
    }
  }

  // upload avatar for user profile
  static async uploadAvatar(req, res) {
    try {
      const file = req.file?.path;
      const user = req.user;

      if (!file) {
        return res.status(400).json(new ApiError(400, "file is required", []));
      }
      if (!user) {
        return res.status(400).json(new ApiError(400, "user not found", []));
      }
      console.log("working");
      const response = await uploadOnCloudinary(file, "avatars");
      console.log(response);
      if (!response) {
        return res
          .status(500)
          .json(new ApiError(400, "unable to upload image", []));
      }
      console.log(response);
      user.profileImage = response.url;
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: user,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, response, "image uploaded successfully"));
    } catch (error) {
      return res.status(500).json(new ApiError(500, error.message, error));
    }
  }
}

const generateAccessAndRefreshTokens = async (userId) => {
  const accessToken = generateAccessToken({ id: userId });
  const refreshToken = generateRefreshToken({ id: userId });
  return { accessToken, refreshToken };
};
