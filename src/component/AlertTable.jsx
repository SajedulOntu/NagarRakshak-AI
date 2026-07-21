import {
AlertTriangle
} from "lucide-react";


const alerts=[
{
type:"Pipeline Leakage",
location:"Mirpur-10",
time:"2 min ago",
status:"Pending"
},

{
type:"Road Damage",
location:"Uttara",
time:"15 min ago",
status:"Assigned"
},

{
type:"Open Manhole",
location:"Dhanmondi",
time:"30 min ago",
status:"Resolved"
}

];


export default function AlertTable(){

return(

<div className="
bg-white/[0.06]
border
border-white/10
rounded-3xl
p-6
">


<h2 className="
text-xl
font-bold
flex
gap-2
items-center
mb-5
">

<AlertTriangle className="text-yellow-400"/>

RECENT ALERTS

</h2>



<div className="
space-y-3
">

{

alerts.map((a)=>(

<div
key={a.location}

className="
flex
justify-between
items-center
bg-black/30
p-4
rounded-xl
"

>


<div>

<p className="
font-semibold
">

{a.type}

</p>


<p className="
text-sm
text-gray-400
">

{a.location}

</p>


</div>



<div className="
text-right
">


<p className="
text-xs
text-gray-400
">

{a.time}

</p>


<span className="
text-cyan-400
text-xs
">

{a.status}

</span>


</div>


</div>

))


}


</div>


</div>


)

}