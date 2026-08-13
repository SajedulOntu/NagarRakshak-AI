import DashboardLayout from "../component/DashboardLayout";
import { Wrench, ClipboardList, CheckCircle, Clock } from "lucide-react";

export default function Maintenance() {
  const stats = [
    { icon: ClipboardList, label: "Assigned Tasks", value: "45" },
    { icon: CheckCircle, label: "Completed Repairs", value: "132" },
    { icon: Clock, label: "Pending Work Orders", value: "9" },
    { icon: Wrench, label: "Equipment Status", value: "OK" },
  ];

  return (
    <DashboardLayout
      roleName="Maintenance Team"
      color="#7cff6b"
      roleIcon={Wrench}
      stats={stats}
    />
  );
}
