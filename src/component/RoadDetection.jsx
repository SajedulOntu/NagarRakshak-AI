import {
  TriangleAlert,
  MapPin,
  Camera
} from "lucide-react";


const detections = [

{
type:"Large Pothole",
location:"Uttara Sector 7",
confidence:"97.4%",
severity:"Critical",
color:"#ef4444"
},

{
type:"Medium Pothole",
location:"Mirpur Road",
confidence:"94.6%",
severity:"High",
color:"#f59e0b"
},

{
type:"Small Pothole",
location:"Banani Road 11",
confidence:"91.8%",
severity:"Medium",
color:"#22c55e"
}

];


export default function RoadDetection(){

return (

<div className="glass-panel p-6">


<div className="flex items-center gap-3 mb-5">

<Camera className="text-orange-400"/>

<h3 className="font-display text-lg">
AI ROAD DAMAGE ANALYSIS
</h3>

</div>



<div className="space-y-4">


{
detections.map((item)=>(


<div
key={item.type}
className="
rounded-xl
border
border-white/10
bg-white/5
p-4
"
>


<div className="flex justify-between">


<div>

<h4 className="font-bold">
{item.type}
</h4>


<div className="flex gap-2 items-center text-xs text-gray-400 mt-2">

<MapPin size={13}/>

{item.location}

</div>


</div>


<div
style={{
color:item.color
}}
className="font-bold"
>

{item.severity}

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