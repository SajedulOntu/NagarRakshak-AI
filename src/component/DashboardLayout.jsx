import { motion } from "framer-motion";

import {
  Link,
  useLocation
} from "react-router-dom";


import {
  LogOut,
  LayoutDashboard,
  Drone,
  Map,
  AlertTriangle,
  Users,
  Settings,
  FileText,
  Bell,
  Activity
} from "lucide-react";




export default function DashboardLayout({
  roleName,
  color,
  roleIcon: RoleIcon,
  stats,
  children
}){


const location = useLocation();



// Role based dashboard path

const dashboardPath =
roleName==="WASA Authority"
?
"/dashboard/wasa"

:

roleName==="DNCC Authority"
?
"/dashboard/dncc"

:

roleName==="Maintenance Team"
?
"/dashboard/maintenance"

:

"/dashboard/super-admin";




const menu=[

{
name:"Dashboard",
icon:LayoutDashboard,
path:dashboardPath
},


{
name:"Drone Monitoring",
icon:Drone,
path:"/drone"
},


{
name:"AI Detection",
icon:AlertTriangle,
path:"/ai"
},


{
name:"Live Map",
icon:Map,
path:"/map"
},


{
name:"Alerts",
icon:Bell,
path:"/alerts"
},


{
name:"Teams",
icon:Users,
path:"/teams"
},


{
name:"Reports",
icon:FileText,
path:"/reports"
},


{
name:"Settings",
icon:Settings,
path:"/settings"
}


];





return(


<div
className="
min-h-screen
bg-[#020617]
text-white
hud-grid-bg
flex
"
>



{/* ================= SIDEBAR ================= */}



<aside

className="
w-72
hidden
md:flex
flex-col
border-r
border-white/10
bg-black/30
backdrop-blur-xl
p-6
"

>




{/* LOGO */}


<div
className="
flex
items-center
gap-3
mb-10
"
>


<div
className="
text-4xl
"
>
🚁
</div>



<div>


<h1
className="
font-display
text-xl
font-bold
text-cyan-400
"
>

NagarRakshak AI

</h1>


<p
className="
text-[10px]
text-gray-400
tracking-widest
"
>

SMART CITY GUARDIAN

</p>


</div>


</div>






{/* ROLE CARD */}


<div

className="
p-4
rounded-2xl
bg-white/[0.05]
border
border-white/10
mb-8
"

>


<div
className="
flex
items-center
gap-3
"
>



<div
className="
p-3
rounded-xl
bg-white/10
"
>


<RoleIcon

size={30}

style={{
color
}}

/>


</div>




<div>


<p
className="
text-xs
text-gray-400
"
>

ACCESS LEVEL

</p>


<p

className="
font-bold
"

style={{
color
}}

>

{roleName}

</p>


</div>


</div>


</div>







{/* NAVIGATION */}



<nav
className="
space-y-2
"
>



{

menu.map((item)=>{


const Icon=item.icon;


const active =
location.pathname===item.path;



return(


<Link


key={item.name}


to={item.path}


className={`

group

flex
items-center
gap-3

p-3

rounded-xl

transition-all
duration-300


${active

?

"text-white bg-cyan-500/20 border border-cyan-400/30"

:

"text-gray-400 hover:text-white hover:bg-white/10"

}


`}


>



<Icon

size={20}

className="
group-hover:scale-110
transition
"

/>



<span>

{item.name}

</span>



</Link>


)


})


}



</nav>








{/* LOGOUT */}



<div
className="
mt-auto
pt-8
"
>


<Link

to="/login"

className="
flex
items-center
gap-3
text-gray-400
hover:text-red-400
transition
"

>


<LogOut size={18}/>


Logout


</Link>



</div>





</aside>









{/* ================= MAIN ================= */}



<div
className="
flex-1
"
>




{/* TOP BAR */}



<header

className="
h-20
border-b
border-white/10

bg-white/[0.03]

backdrop-blur-xl

flex

items-center

justify-between

px-8

"

>



<div>


<h2

className="
text-2xl
font-bold
"

>

{roleName}

Command Center

</h2>



<p

className="
text-gray-400
text-sm
"

>

AI Powered Urban Infrastructure Monitoring

</p>


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
flex
items-center
gap-2
text-green-400
text-sm
"

>


<span

className="
w-2
h-2
rounded-full
bg-green-400
animate-pulse-dot
"

/>


SYSTEM ONLINE


</div>






<div
className="
relative
cursor-pointer
"
>


<Bell size={22}/>


<span

className="
absolute
- top-2
-right-2
bg-red-500
text-white
text-xs
rounded-full
w-5
h-5
flex
items-center
justify-center
"

>

3

</span>


</div>



</div>




</header>









<main

className="
p-8
"

>





{/* KPI CARDS */}



<div

className="
grid
grid-cols-1
sm:grid-cols-2
xl:grid-cols-4
gap-6
mb-10
"

>



{

stats.map((stat,index)=>{


const Icon=stat.icon;



return(



<motion.div


key={stat.label}


initial={{
opacity:0,
y:20
}}


animate={{
opacity:1,
y:0
}}


transition={{
delay:index*0.1
}}



className="

rounded-3xl

p-6

bg-white/[0.06]

border

border-white/10

backdrop-blur-xl

hover:-translate-y-2

transition

"


>




<div

className="
flex
justify-between
items-center
"

>


<Icon

size={32}

style={{
color
}}

/>


<Activity

size={18}

className="
text-gray-500
"

/>


</div>





<h3

className="
text-4xl
font-bold
mt-5
"

>


{stat.value}


</h3>




<p

className="
text-gray-400
text-xs
uppercase
mt-2
tracking-wider
"

>

{stat.label}

</p>




</motion.div>


)


})


}



</div>







{children}





</main>



</div>




</div>


)


}