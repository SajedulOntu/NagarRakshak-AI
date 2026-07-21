import { 
  Cpu,
  Wifi,
  Database,
  Mail
} from "lucide-react";

const systems = [
  {
    icon: Cpu,
    title:"AI Detection Model",
    value:"YOLOv11 ONLINE",
    color:"#22d3ee"
  },
  {
    icon: Wifi,
    title:"Drone Connection",
    value:"DJI Mini 4K CONNECTED",
    color:"#7cff6b"
  },
  {
    icon: Database,
    title:"Database",
    value:"ONLINE",
    color:"#ffb020"
  },
  {
    icon: Mail,
    title:"Notification Service",
    value:"ACTIVE",
    color:"#ff3b5c"
  }
];


export default function SystemStatus(){

return(

<div className="glass-panel p-6">

<h3 className="font-display text-lg mb-5">
SYSTEM STATUS
</h3>


<div className="grid grid-cols-1 md:grid-cols-2 gap-4">


{
systems.map((item)=>{

const Icon=item.icon;


return(

<div
key={item.title}
className="p-5 rounded-xl bg-white/5 border border-white/10"
>

<div className="flex items-center gap-3">

<Icon
size={28}
style={{color:item.color}}
/>


<div>

<p className="text-gray-400 text-xs">
{item.title}
</p>


<p 
className="font-bold"
style={{color:item.color}}
>
{item.value}
</p>

</div>


</div>


</div>


)

})

}


</div>

</div>


)

}