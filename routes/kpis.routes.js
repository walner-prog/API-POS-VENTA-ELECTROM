import express from "express";
import { getKpis } from "../controllers/kpis.controller.js";
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.get("/", getKpis);

export default router;
