import {
 Wrench,
 CheckCircle,
 Clock
} from "lucide-react";


const tasks=[

{
id:"#DNCC-1024",
issue:"Critical Pothole",
team:"Road Team-04",
status:"Working",
color:"#f59e0b"
},

{
id:"#DNCC-1025",
issue:"Small Pothole",
team:"Road Team-02",
status:"Completed",
color:"#22c55e"
},

{
id:"#DNCC-1026",
issue:"Large Pothole",
team:"Road Team-07",
status:"Pending",
color:"#ef4444"
}

];


export default function RepairTracker(){


return(

<div className="glass-panel p-6">


<div className="flex gap-3 items-center mb-5">

<Wrench className="text-orange-400"/>

<h3 className="font-display text-lg">
REPAIR TRACKER
</h3>

</div>



<div className="space-y-3">


{
tasks.map((task)=>(

<div
key={task.id}
className="
p-4
rounded-xl
bg-white/5
border
border-white/10
"
>


<div className="flex justify-between">

<div>

<p className="font-bold">
{task.id}
</p>

<p className="text-sm text-gray-400">
{task.issue}
</p>

</div>


<span
style={{
color:task.color
}}
className="font-bold"
>

{task.status}

</span>


</div>


<p className="text-xs text-gray-500 mt-2">
Assigned: {task.team}
</p>


</div>


))

}


</div>


</div>

)

}