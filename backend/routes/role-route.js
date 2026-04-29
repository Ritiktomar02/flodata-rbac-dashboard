import { Router } from "express";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/role-controller.js";
import { isUser, requirePermission } from "../middlewares/auth-middleware.js";

const router = Router();

router.get("/all", isUser, requirePermission("roles", "read"), getAllRoles);
router.post("/create", isUser, requirePermission("roles", "create"), createRole);
router.put("/update/:roleId", isUser, requirePermission("roles", "update"), updateRole);
router.delete("/delete/:roleId", isUser, requirePermission("roles", "delete"), deleteRole);

export default router;
