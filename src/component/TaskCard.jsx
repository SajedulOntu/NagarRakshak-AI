import {
 MapPin,
 Clock,
 AlertTriangle
} from "lucide-react";


const tasks=[

{
id:"#TASK-2041",
issue:"Uncovered Manhole",
authority:"WASA",
location:"Mirpur Road",
priority:"HIGH",
color:"#ef4444"
},

{
id:"#TASK-2042",
issue:"Large Pothole",
authority:"DNCC",
location:"Uttara Sector 7",
priority:"MEDIUM",
color:"#f59e0b"
}

];


export default function TaskCard(){

return(

<div className="glass-panel p-6">


<h3 className="
font-display
text-lg
mb-5
flex
gap-2
items-center
">

<AlertTriangle className="text-green-400"/>

ASSIGNED TASKS

</h3>



<div className="space-y-4">


{
tasks.map((task)=>(

<div
key={task.id}
className="
bg-white/5
border
border-white/10
rounded-xl
p-5
"
>


<div className="flex justify-between">


<div>

<p className="font-bold">

{task.id}

</p>


<p className="text-gray-300 mt-1">

{task.issue}

</p>


<p className="text-xs text-gray-400 mt-1">

Authority: {task.authority}

</p>


</div>



<div
style={{
color:task.color
}}
className="font-bold"
>

{task.priority}

</div>


</div>



<div className="
flex
gap-2
items-center
text-sm
text-gray-400
mt-3
">


<MapPin size={15}/>

{task.location}


</div>



<button

className="
mt-4
w-full
py-2
rounded-lg
bg-green-400
text-black
font-bold
hover:scale-105
transition
"

>

ACCEPT TASK

</button>



</div>


))

}


</div>


</div>

)

}