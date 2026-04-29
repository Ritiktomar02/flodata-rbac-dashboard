import AuditLog from "../models/audit-model.js";

export const getAuditLogs = async (_req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Audit logs error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};
