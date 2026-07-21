import { MapPin, Navigation } from "lucide-react";


export default function MapPanel(){

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
items-center
gap-3
mb-5
">

<MapPin className="text-red-400"/>

<h2 className="
text-xl
font-bold
">

LIVE LOCATION MAP

</h2>

</div>



<div className="
h-80
rounded-2xl
bg-black/40
border
border-cyan-400/20
relative
overflow-hidden
flex
items-center
justify-center
">


{/* Fake map */}

<div className="
absolute
inset-0
opacity-20
"
style={{
backgroundImage:
"linear-gradient(#22d3ee 1px,transparent 1px),linear-gradient(90deg,#22d3ee 1px,transparent 1px)",
backgroundSize:"40px 40px"
}}
>


</div>



<div className="
z-10
text-center
">

<Navigation
size={45}
className="mx-auto text-cyan-400 animate-pulse"
/>


<p className="
mt-3
text-gray-300
">

Drone Location

</p>


<p className="
text-cyan-400
font-bold
">

23.8103° N, 90.4125° E

</p>


</div>



</div>


</div>

)

}