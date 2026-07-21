import {
 Users,
 Navigation
} from "lucide-react";


export default function TeamStatus(){


return(

<div className="glass-panel p-6">


<h3 className="
font-display
text-lg
flex
gap-2
items-center
">

<Users className="text-green-400"/>

FIELD TEAM STATUS

</h3>



<div className="
mt-5
space-y-3
">


<div className="
bg-white/5
p-4
rounded-xl
">

<p className="text-gray-400 text-sm">
Team Status
</p>

<p className="text-green-400 font-bold">
ONLINE
</p>

</div>



<div className="
bg-white/5
p-4
rounded-xl
">

<p className="text-gray-400 text-sm">
Current Location
</p>

<p className="font-bold">
Mirpur Zone
</p>

</div>



<div className="
bg-white/5
p-4
rounded-xl
">

<p className="text-gray-400 text-sm">
Navigation
</p>

<p className="text-cyan-400 flex gap-2">

<Navigation size={16}/>

2.4 km Away

</p>


</div>



</div>


</div>

)

}