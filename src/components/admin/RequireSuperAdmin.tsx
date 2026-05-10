import React from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

export const RequireSuperAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, loading } = useUserRole();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
