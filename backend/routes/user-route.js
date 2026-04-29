import { Router } from "express";
import {
  login,
  logout,
  profile,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRoles,
} from "../controllers/user-controller.js";
import { isUser, requirePermission } from "../middlewares/auth-middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", isUser, profile);

router.get("/all", isUser, requirePermission("users", "read"), getAllUsers);
router.post("/create", isUser, requirePermission("users", "create"), createUser);
router.put("/update/:userId", isUser, requirePermission("users", "update"), updateUser);
router.delete("/delete/:userId", isUser, requirePermission("users", "delete"), deleteUser);
router.put("/assign-roles", isUser, requirePermission("users", "update"), assignRoles);

export default router;
