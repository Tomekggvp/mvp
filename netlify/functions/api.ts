// Netlify runs the existing Express API as a serverless function.
// The app keeps the same /api/* routes used by the frontend.
import serverless from "serverless-http";
import { app } from "../../backend/src/app.js";

export const handler = serverless(app);
