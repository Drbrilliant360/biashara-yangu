import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Store, Users, CreditCard, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/shops", label: "Shops", icon: Store },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/sales", label: "Sales", icon: ShoppingCart },
];

export const AdminNav: React.FC = () => (
  <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b">
    {items.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )
        }
      >
        <it.icon className="w-4 h-4" />
        {it.label}
      </NavLink>
    ))}
  </div>
);
