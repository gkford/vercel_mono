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
  missingEnvVars.forEach(varName => {
    console.error(`Missing required environment variable: ${varName}`);
  });
  throw new Error("Missing required environment variables. Check logs for details.");
}

if (!process.env.VERCEL_ENV) {
  console.log("VERCEL_ENV is not present. If you are developing locally without using vercel dev, you may need to define it explicitly in .env.local (remember it is overridden when vercel env pull is run)");
} else {
  console.log(`VERCEL_ENV is set to: ${process.env.VERCEL_ENV}`);
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000; // Default to 3000 if PORT is not set
let CLIENT_ORIGIN_URL: string;

if (process.env.VERCEL_ENV === 'production') {
  throw new Error("Production environment not yet supported");
} else if (process.env.VERCEL_ENV === 'preview') {
  if (!process.env.PREVIEW_URL_FRONTEND) {
    throw new Error("PREVIEW_URL_FRONTEND is required in preview environment");
  }
  CLIENT_ORIGIN_URL = process.env.PREVIEW_URL_FRONTEND;
} else {
  // Development environment (including when VERCEL_ENV is not set)
  if (!process.env.DEVELOPMENT_URL_FRONTEND) {
    throw new Error("DEVELOPMENT_URL_FRONTEND is required in development environment");
  }
  CLIENT_ORIGIN_URL = process.env.DEVELOPMENT_URL_FRONTEND;
}

console.log(`CLIENT_ORIGIN_URL is set to: ${CLIENT_ORIGIN_URL}`);

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

app.use(
  cors({
    origin: CLIENT_ORIGIN_URL,
    methods: ["GET"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  })
);

app.use("/api", apiRouter);
apiRouter.use("/messages", messagesRouter);
apiRouter.use("/oauth", oauthRouter);

app.use(errorHandler);
app.use(notFoundHandler);

// app.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}`);
// });

export default app
