// apps/api/server/src/index.ts
// PHASE 2 — Railway Express server (NOT active in Phase 1)
// To activate: set VITE_API_URL=https://your-railway-app.railway.app/api
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: process.env.APP_URL, credentials: true }));
app.use(express.json());

// Routes — same logic as Netlify Functions
// import { handlePatients } from "./routes/patients";
// app.all("/api/patients*", authMiddleware, async (req, res) => { ... });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ConsentsPro API running on port ${PORT}`));

export default app;
