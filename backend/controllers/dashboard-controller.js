import Dashboard from "../models/dashboard-model.js";

// Demo dataset — in a real app this would be a Mongo query.
// Each row is fully populated; the API filters fields per the user's role.
const datasets = {
  sales: [
    { id: 1, region: "North", product: "Pro Plan", revenue: 24500, cost: 11200, margin: 13300, customer: "Acme Corp", rep: "Riya Sharma", date: "2026-01-12" },
    { id: 2, region: "South", product: "Starter", revenue: 8400, cost: 3100, margin: 5300, customer: "Globex", rep: "Aman Singh", date: "2026-01-19" },
    { id: 3, region: "East", product: "Enterprise", revenue: 62100, cost: 28400, margin: 33700, customer: "Initech", rep: "Priya Patel", date: "2026-02-03" },
    { id: 4, region: "West", product: "Pro Plan", revenue: 17800, cost: 8200, margin: 9600, customer: "Umbrella", rep: "Rohit Verma", date: "2026-02-14" },
    { id: 5, region: "North", product: "Enterprise", revenue: 51200, cost: 23900, margin: 27300, customer: "Wayne Ind.", rep: "Riya Sharma", date: "2026-02-22" },
    { id: 6, region: "South", product: "Pro Plan", revenue: 19400, cost: 9100, margin: 10300, customer: "Stark Co.", rep: "Aman Singh", date: "2026-03-08" },
    { id: 7, region: "East", product: "Starter", revenue: 6200, cost: 2300, margin: 3900, customer: "Hooli", rep: "Priya Patel", date: "2026-03-15" },
    { id: 8, region: "West", product: "Enterprise", revenue: 71500, cost: 31200, margin: 40300, customer: "Pied Piper", rep: "Rohit Verma", date: "2026-04-02" },
  ],
};

const datasetSchemas = {
  sales: {
    fields: ["id", "region", "product", "revenue", "cost", "margin", "customer", "rep", "date"],
    module: "sales",
  },
};

// Strip hidden fields from each row — runs server-side so the API never
// leaks restricted data, even if the UI were bypassed.
const filterRow = (row, hiddenSet) => {
  if (!hiddenSet || hiddenSet.size === 0) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (!hiddenSet.has(k)) out[k] = v;
  }
  return out;
};

export const getDataset = async (req, res) => {
  try {
    const { name } = req.params;
    const schema = datasetSchemas[name];
    if (!schema) return res.status(404).json({ message: "Unknown dataset" });

    // Module-level read check
    const allowed = req.permissions?.[schema.module]?.has("read");
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - missing ${schema.module}:read`,
      });
    }

    // Field-level filtering (server-side enforcement)
    const hidden = req.fieldRules?.[schema.module]?.hidden || new Set();
    const visibleFields = schema.fields.filter((f) => !hidden.has(f));
    const rows = datasets[name].map((r) => filterRow(r, hidden));

    res.status(200).json({
      success: true,
      dataset: name,
      visibleFields,
      hiddenFields: Array.from(hidden),
      rows,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get dataset error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Aggregated stats for stat widgets — also filtered by field rules so a
// "viewer" who can't see margin won't get totalMargin either.
export const getStats = async (req, res) => {
  try {
    const allowed = req.permissions?.sales?.has("read");
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden - missing sales:read" });
    }

    const hidden = req.fieldRules?.sales?.hidden || new Set();
    const rows = datasets.sales;

    const stats = {
      totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
      totalDeals: rows.length,
    };
    if (!hidden.has("margin")) {
      stats.totalMargin = rows.reduce((s, r) => s + r.margin, 0);
    }
    if (!hidden.has("cost")) {
      stats.totalCost = rows.reduce((s, r) => s + r.cost, 0);
    }

    res.status(200).json({ success: true, stats });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stats error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyDashboard = async (req, res) => {
  try {
    let dash = await Dashboard.findOne({ user: req.userId });
    if (!dash) {
      dash = await Dashboard.create({ user: req.userId, widgets: defaultLayout() });
    }
    res.status(200).json({ success: true, dashboard: dash });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get dashboard error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const saveMyDashboard = async (req, res) => {
  try {
    const { widgets } = req.body;
    if (!Array.isArray(widgets)) {
      return res.status(400).json({ message: "widgets must be an array" });
    }

    // Saving a dashboard layout requires dashboard:update.
    const allowed = req.permissions?.dashboard?.has("update");
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden - missing dashboard:update" });
    }

    const dash = await Dashboard.findOneAndUpdate(
      { user: req.userId },
      { widgets },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, dashboard: dash });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Save dashboard error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetMyDashboard = async (req, res) => {
  try {
    const dash = await Dashboard.findOneAndUpdate(
      { user: req.userId },
      { widgets: defaultLayout() },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, dashboard: dash });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Reset dashboard error:", error);
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2x2 grid of stat tiles, then a full-width chart and a full-width table below.
// Roles that hide a field will see "Restricted by your role" in the matching
// tile — that's the demo value of including all four by default.
const defaultLayout = () => [
  { i: "w-revenue", type: "stat",  title: "Total Revenue", dataset: "sales", config: { metric: "totalRevenue", prefix: "$" }, x: 0, y: 0, w: 6, h: 2 },
  { i: "w-deals",   type: "stat",  title: "Deals Closed",  dataset: "sales", config: { metric: "totalDeals" },                 x: 6, y: 0, w: 6, h: 2 },
  { i: "w-cost",    type: "stat",  title: "Total Cost",    dataset: "sales", config: { metric: "totalCost", prefix: "$" },     x: 0, y: 2, w: 6, h: 2 },
  { i: "w-margin",  type: "stat",  title: "Total Margin",  dataset: "sales", config: { metric: "totalMargin", prefix: "$" },   x: 6, y: 2, w: 6, h: 2 },
  { i: "w-chart",   type: "chart", title: "Revenue by Region", dataset: "sales", config: { groupBy: "region", metric: "revenue", chartType: "bar" }, x: 0, y: 4, w: 12, h: 4 },
  { i: "w-table",   type: "table", title: "Recent Sales",      dataset: "sales", config: {},                                                          x: 0, y: 8, w: 12, h: 4 },
];
