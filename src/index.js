import { app } from "./app.js";
import "dotenv/config";

try {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port: ${process.env.PORT || 8000}`);
  });
  app.on("error", (error) => {
    console.log(`Error on app.on error index.js: ${error}`);
  });
} catch (error) {
  console.log(`error while launching app ${error}`);
}
