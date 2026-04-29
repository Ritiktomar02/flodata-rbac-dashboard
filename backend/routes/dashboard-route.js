import { Router } from "express";
import {
  getDataset,
  getStats,
  getMyDashboard,
  saveMyDashboard,
  resetMyDashboard,
} from "../controllers/dashboard-controller.js";
import { isUser, requirePermission } from "../middlewares/auth-middleware.js";

const router = Router();

router.get("/me", isUser, requirePermission("dashboard", "read"), getMyDashboard);
router.put("/me", isUser, requirePermission("dashboard", "update"), saveMyDashboard);
router.post("/reset", isUser, requirePermission("dashboard", "update"), resetMyDashboard);

// /stats and /dataset still need dashboard:read (page access) plus the
// per-module read check inside the controller for the actual data.
router.get("/stats", isUser, requirePermission("dashboard", "read"), getStats);
router.get("/dataset/:name", isUser, requirePermission("dashboard", "read"), getDataset);

export default router;
