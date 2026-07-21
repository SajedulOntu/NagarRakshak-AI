import DashboardLayout from "../component/DashboardLayout";


import {
 Building2,
 TriangleAlert,
 Wrench,
 CheckCircle
} from "lucide-react";


import DroneFeed from "../component/DroneFeed";
import AIResult from "../component/AIResult";
import MapPanel from "../component/MapPanel";
import AlertTable from "../component/AlertTable";

import RoadDetection from "../component/RoadDetection";
import RepairTracker from "../component/RepairTracker";



export default function Dncc(){


const stats=[

{
icon:TriangleAlert,
label:"Potholes Detected",
value:"64"
},

{
icon:Building2,
label:"Critical Roads",
value:"15"
},

{
icon:Wrench,
label:"Repair Teams",
value:"12"
},

{
icon:CheckCircle,
label:"Completed Repairs",
value:"31"
}

];



return(

<DashboardLayout

roleName="DNCC Authority"

color="#ffb020"

roleIcon={Building2}

stats={stats}

>


<div className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
">


<DroneFeed/>

<AIResult/>


</div>




<div className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
mt-6
">


<RoadDetection/>

<RepairTracker/>


</div>




<div className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
mt-6
">


<MapPanel/>

<AlertTable/>


</div>



</DashboardLayout>


)

}