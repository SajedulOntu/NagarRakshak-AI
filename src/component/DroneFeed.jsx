import { Drone, Battery, MapPin } from "lucide-react";


export default function DroneFeed(){

return(

<div className="
bg-white/[0.06]
border
border-white/10
rounded-3xl
p-6
backdrop-blur-xl
">


<div className="
flex
justify-between
items-center
mb-5
">


<h2 className="
text-xl
font-bold
flex
items-center
gap-2
">

<Drone className="text-cyan-400"/>

LIVE DRONE FEED

</h2>


<span className="
text-green-400
text-sm
flex
items-center
gap-2
">

<span className="
w-2
h-2
rounded-full
bg-green-400
animate-pulse
">

</span>

CONNECTED

</span>


</div>



{/* VIDEO PLACEHOLDER */}

<div className="
h-72
rounded-2xl
bg-black/40
border
border-cyan-400/20
flex
items-center
justify-center
relative
overflow-hidden
">


<div className="
text-center
text-gray-400
">


<Drone
size={60}
className="mx-auto text-cyan-400"
/>


<p className="mt-3">

DJI Mini 4K Streaming

</p>


</div>



</div>




<div className="
grid
grid-cols-3
gap-4
mt-5
">


<div className="
bg-black/30
rounded-xl
p-3
">

<Battery 
size={18}
className="text-green-400"
/>

<p className="text-xs text-gray-400 mt-2">

Battery

</p>


<p className="font-bold">

78%

</p>


</div>



<div className="
bg-black/30
rounded-xl
p-3
">

<Drone 
size={18}
className="text-cyan-400"
/>


<p className="text-xs text-gray-400 mt-2">

Altitude

</p>


<p className="font-bold">

45 m

</p>


</div>



<div className="
bg-black/30
rounded-xl
p-3
">

<MapPin 
size={18}
className="text-red-400"
/>


<p className="text-xs text-gray-400 mt-2">

GPS

</p>


<p className="font-bold">

Connected

</p>


</div>



</div>


</div>


)

}