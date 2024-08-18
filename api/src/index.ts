import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import helmet from "helmet";
import nocache from "nocache";
import { messagesRouter } from "./messages/messages.router";
import { oauthRouter } from "./oauth/oauth.router";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";

const requiredEnvVars = ['PORT', 'AUTH0_DOMAIN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 6060; // Default to 6060 if PORT is not set

console.log(`PORT is set to: ${PORT}`);

const app = express();
const apiRouter = express.Router();

app.use(express.json());
app.set("json spaces", 2);

app.use(
  helmet({
    hsts: {
      maxAge: 31536000,
    },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'none'"],
        "frame-ancestors": ["'none'"],
      },
    },
    frameguard: {
      action: "deny",
    },
  })
);

app.use((req, res, next) => {
  res.contentType("application/json; charset=utf-8");
  next();
});
app.use(nocache());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use("/api", apiRouter);
apiRouter.use("/messages", messagesRouter);
apiRouter.use("/oauth", oauthRouter);

app.use(errorHandler);
app.use(notFoundHandler);

// app.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}`);
// });

export default app;
