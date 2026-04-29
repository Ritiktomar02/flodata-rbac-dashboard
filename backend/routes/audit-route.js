import { Router } from "express";
import { getAuditLogs } from "../controllers/audit-controller.js";
import { isUser, requirePermission } from "../middlewares/auth-middleware.js";

const router = Router();

router.get("/all", isUser, requirePermission("audit", "read"), getAuditLogs);

export default router;
