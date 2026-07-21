import DashboardLayout from "../component/DashboardLayout";
import { Shield, PlaneTakeoff, AlertTriangle, Users, Wrench } from "lucide-react";

export default function Admin() {
  const stats = [
    { icon: PlaneTakeoff, label: "Total Drone Missions", value: "2,456" },
    { icon: AlertTriangle, label: "Detected Issues", value: "128" },
    { icon: Users, label: "Active Teams", value: "34" },
    { icon: Wrench, label: "Pending Repairs", value: "17" },
  ];

  return (
    <DashboardLayout
      roleName="Super Admin"
      color="#ff3b5c"
      roleIcon={Shield}
      stats={stats}
    />
  );
}
