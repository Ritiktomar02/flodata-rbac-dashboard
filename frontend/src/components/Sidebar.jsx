import { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import UserContext from "../context/UserContext";

// Side nav items are gated by permissions. The user only sees what they
// can actually access — matches the backend's authorization.
const NAV = [
  { to: "/",       label: "Dashboard", icon: LayoutDashboard, module: "dashboard", action: "read" },
  { to: "/roles",  label: "Roles",     icon: ShieldCheck,     module: "roles",     action: "read" },
  { to: "/users",  label: "Users",     icon: Users,           module: "users",     action: "read" },
  { to: "/audit",  label: "Audit Log", icon: ClipboardList,   module: "audit",     action: "read" },
];

const Avatar = ({ user }) => {
  const initials = user?.picture && !user.picture.startsWith("http")
    ? user.picture
    : user?.username?.charAt(0).toUpperCase() || "?";
  return (
    <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center font-bold text-white shadow-md">
      {initials}
    </div>
  );
};

const Sidebar = () => {
  const { user, logout, can } = useContext(UserContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV.filter((n) => n.module === "dashboard" || can(n.module, n.action));
  const roleNames = user?.roles?.map((r) => r.name).join(", ") || "—";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarBody = (
    <div className="flex flex-col h-full p-4 gap-2">
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white font-bold shadow-lg">
          F
        </div>
        <div>
          <div className="font-bold text-white leading-tight">Flodata</div>
          <div className="text-xs text-slate-400 leading-tight">RBAC Dashboard</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 mt-2">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? "bg-indigo-500/15 text-white border border-indigo-500/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.username}</div>
            <div className="text-xs text-slate-400 truncate" title={roleNames}>
              {roleNames}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-slate-950/80 backdrop-blur border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white font-bold">
            F
          </div>
          <span className="font-semibold">Flodata</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute top-14 left-0 bottom-0 w-72 bg-slate-950 border-r border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 bg-slate-950/60 border-r border-white/10 backdrop-blur">
        {SidebarBody}
      </aside>

      {/* Spacer for mobile top bar */}
      <div className="lg:hidden h-14" />
    </>
  );
};

export default Sidebar;
