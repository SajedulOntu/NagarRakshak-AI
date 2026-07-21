import {
  LayoutDashboard,
  Plane,
  ScanLine,
  Map,
  Bell,
  FileText,
  Settings,
  LogOut
} from "lucide-react";

import { Link } from "react-router-dom";


export default function Sidebar({color}){


const menu=[

{
name:"Dashboard",
icon:LayoutDashboard,
path:"#"
},

{
name:"Drone Monitoring",
icon:Plane,
path:"#"
},

{
name:"AI Detection",
icon:ScanLine,
path:"#"
},

{
name:"Live Map",
icon:Map,
path:"#"
},

{
name:"Alerts",
icon:Bell,
path:"#"
},

{
name:"Reports",
icon:FileText,
path:"#"
},

{
name:"Settings",
icon:Settings,
path:"#"
}

];



return(

<div
className="
w-64
min-h-screen
border-r
border-white/10
bg-[#020617]/80
backdrop-blur-xl
p-5
hidden
lg:block
"
>


<h1
className="
font-display
text-xl
bg-gradient-to-r
from-cyan-400
to-blue-400
text-transparent
bg-clip-text
mb-8
"
>

🚁 NAGARRAKSHAK

</h1>



<div className="space-y-2">


{
menu.map((item)=>{


const Icon=item.icon;


return(

<Link

key={item.name}

className="
flex
items-center
gap-3
p-3
rounded-xl
text-gray-400
hover:text-white
hover:bg-white/10
transition
"

to={item.path}

>


<Icon size={18}/>

<span className="text-sm">
{item.name}
</span>


</Link>


)


})

}


</div>



<button

className="
absolute
bottom-6
flex
items-center
gap-2
text-gray-400
hover:text-red-400
"

>

<LogOut size={18}/>

Logout

</button>


</div>

)

}