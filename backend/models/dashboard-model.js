import mongoose from "mongoose";

// One dashboard layout per user. Widgets store both grid coords (for
// react-grid-layout) and a config blob (chart type, dataset, columns, etc.)
const widgetSchema = new mongoose.Schema(
  {
    i: { type: String, required: true }, // unique widget id, used by RGL
    type: { type: String, enum: ["chart", "table", "stat"], required: true },
    title: { type: String, default: "" },
    dataset: { type: String, default: "sales" },
    config: { type: Object, default: {} },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 4 },
    h: { type: Number, default: 4 },
  },
  { _id: false }
);

const dashboardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    widgets: [widgetSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Dashboard", dashboardSchema);
