import { ApiError } from "../../utils/api_errors.js";

export const validate = (schema) => async (req, res, next) => {
  try {
    console.log("validating the request body");
    console.log(req.body);
    await schema.parseAsync(req.body);
    console.log("validation successful");
    next();
  } catch (error) {
    return res
      .status(400)
      .json(
        new ApiError(400, "error validating the request body", error.errors)
      );
  }
};
