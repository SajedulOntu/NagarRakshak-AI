import {
  CircleAlert,
  CheckCircle,
  MapPin
} from "lucide-react";


const issues=[
{
type:"Uncovered Manhole",
location:"Mirpur Road",
confidence:"96.8%",
status:"Critical",
color:"#ef4444"
},

{
type:"Damaged Manhole",
location:"Uttara Sector 7",
confidence:"94.2%",
status:"High",
color:"#f59e0b"
},

{
type:"Covered Manhole",
location:"Dhanmondi",
confidence:"98.5%",
status:"Safe",
color:"#22c55e"
}

];


export default function ManholeStatus(){


return(

<div className="glass-panel p-6">


<div className="flex items-center gap-2 mb-5">

<CircleAlert 
className="text-cyan-400"
/>

<h3 className="font-display text-lg">
AI MANHOLE ANALYSIS
</h3>

</div>



<div className="space-y-4">


{
issues.map((item)=>(

<div
key={item.type}
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

<h4 className="font-bold">
{item.type}
</h4>


<div className="flex items-center gap-1 text-xs text-gray-400 mt-1">

<MapPin size={13}/>

{item.location}

</div>


</div>



<div
className="font-bold"
style={{
color:item.color
}}
>

{item.status}

</div>


</div>



<div className="mt-3 text-sm">

AI Confidence:

<span
className="ml-2 font-bold"
style={{
color:item.color
}}
>
{item.confidence}
</span>


</div>



</div>


))

}


</div>


</div>

)

}