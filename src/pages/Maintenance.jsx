import DashboardLayout from "../component/DashboardLayout";

import {
 Wrench,
 CheckCircle,
 Clock,
 AlertTriangle
} from "lucide-react";


import TaskCard from "../component/TaskCard";
import ProofUpload from "../component/ProofUpload";
import TeamStatus from "../component/TeamStatus";


export default function Maintenance(){


const stats=[

{
icon:AlertTriangle,
label:"Assigned Issues",
value:"12"
},

{
icon:Clock,
label:"Pending Tasks",
value:"5"
},

{
icon:Wrench,
label:"Active Repairs",
value:"4"
},

{
icon:CheckCircle,
label:"Completed",
value:"38"
}

];



return(

<DashboardLayout

roleName="Maintenance Team"

color="#7cff6b"

roleIcon={Wrench}

stats={stats}

>


<div className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
">


<TaskCard/>

<TeamStatus/>


</div>



<div className="mt-6">

<ProofUpload/>

</div>



</DashboardLayout>


)

}