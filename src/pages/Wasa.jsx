import DashboardLayout from "../component/DashboardLayout";

import {
 Droplets,
 AlertTriangle,
 CheckCircle,
 MapPin
} from "lucide-react";


import DroneFeed from "../component/DroneFeed";
import AIResult from "../component/AIResult";
import MapPanel from "../component/MapPanel";
import AlertTable from "../component/AlertTable";
import ManholeStatus from "../component/ManholeStatus";


export default function Wasa(){


const stats=[

{
icon:Droplets,
label:"Manhole Inspections",
value:"1250"
},

{
icon:AlertTriangle,
label:"Uncovered Manholes",
value:"23"
},

{
icon:MapPin,
label:"Critical Locations",
value:"17"
},

{
icon:CheckCircle,
label:"Resolved Issues",
value:"42"
}

];



return(

<DashboardLayout

roleName="WASA Authority"

color="#22d3ee"

roleIcon={Droplets}

stats={stats}

>


{/* Drone + AI */}

<div
className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
"
>

<DroneFeed/>

<AIResult/>

</div>



{/* Manhole Analysis */}

<div className="mt-6">

<ManholeStatus/>

</div>



{/* Map + Alerts */}

<div
className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
mt-6
"
>

<MapPanel/>

<AlertTable/>

</div>



</DashboardLayout>


)

}