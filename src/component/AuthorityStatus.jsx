import {
 Building2,
 Droplets,
 Wrench
} from "lucide-react";


const data=[

{
icon:Droplets,
name:"WASA",
issue:"Manhole Problems",
count:23,
color:"#22d3ee"
},

{
icon:Building2,
name:"DNCC",
issue:"Road Potholes",
count:18,
color:"#ffb020"
},

{
icon:Wrench,
name:"Maintenance",
issue:"Pending Tasks",
count:9,
color:"#7cff6b"
}

];


export default function AuthorityStatus(){


return(

<div className="glass-panel p-6">

<h3 className="font-display text-lg mb-5">
AUTHORITY OVERVIEW
</h3>


<div className="space-y-4">


{
data.map((item)=>{


const Icon=item.icon;


return(

<div
key={item.name}
className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10"
>


<div className="flex gap-3 items-center">

<Icon
style={{color:item.color}}
/>


<div>

<p className="font-bold">
{item.name}
</p>

<p className="text-xs text-gray-400">
{item.issue}
</p>

</div>

</div>



<div
className="text-2xl font-bold"
style={{color:item.color}}
>
{item.count}
</div>


</div>


)


})

}


</div>


</div>

)

}