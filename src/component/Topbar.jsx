import {
 Bell,
 Activity
} from "lucide-react";


export default function Topbar({roleName,color}){


return(

<div
className="
h-20
border-b
border-white/10
bg-white/[0.03]
backdrop-blur-xl
flex
items-center
justify-between
px-6
"
>


<div
className="
flex
items-center
gap-2
text-green-400
"
>

<Activity size={18}/>

SYSTEM ONLINE

</div>



<div
className="
flex
items-center
gap-6
"
>


<div
className="
relative
"
>

<Bell/>

<span
className="
absolute
-top-2
-right-2
bg-red-500
text-xs
rounded-full
px-1
"
>

3

</span>


</div>



<div>

<p className="text-xs text-gray-400">
Logged in as
</p>


<p
style={{color}}
className="font-bold"
>

{roleName}

</p>


</div>


</div>



</div>

)

}