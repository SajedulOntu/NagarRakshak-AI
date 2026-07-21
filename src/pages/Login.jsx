import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  Shield,
  Building2,
  Droplets,
  Wrench,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react";


const roles = [
  {
    name: "Super Admin",
    icon: Shield,
    path: "/dashboard/super-admin",
    color: "#ff3b5c",
    tag: "ROOT ACCESS",
  },
  {
    name: "DNCC Authority",
    icon: Building2,
    path: "/dashboard/dncc",
    color: "#ffb020",
    tag: "CIVIC OPS",
  },
  {
    name: "WASA Authority",
    icon: Droplets,
    path: "/dashboard/wasa",
    color: "#22d3ee",
    tag: "WATER GRID",
  },
  {
    name: "Maintenance Team",
    icon: Wrench,
    path: "/dashboard/maintenance",
    color: "#7cff6b",
    tag: "FIELD UNIT",
  },
];


function CornerBrackets({color}){

const base =
"absolute w-8 h-8 border-solid";


return(
<>
<span
className={`${base} top-0 left-0 border-t-2 border-l-2 rounded-tl-xl`}
style={{borderColor:color}}
/>

<span
className={`${base} top-0 right-0 border-t-2 border-r-2 rounded-tr-xl`}
style={{borderColor:color}}
/>

<span
className={`${base} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl`}
style={{borderColor:color}}
/>

<span
className={`${base} bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl`}
style={{borderColor:color}}
/>

</>
)

}



const EMAIL_REGEX=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;



export default function Login(){


const navigate=useNavigate();


const [role,setRole]=useState(roles[0]);

const [email,setEmail]=useState("");

const [password,setPassword]=useState("");

const [passwordVisible,setPasswordVisible]=useState(false);

const [loading,setLoading]=useState(false);

const [errors,setErrors]=useState({});




function validate(){

let e={};


if(!email)
e.email="Official email required";

else if(!EMAIL_REGEX.test(email))
e.email="Invalid email";


if(!password)
e.password="Password required";

else if(password.length<6)
e.password="Minimum 6 characters";


setErrors(e);


return Object.keys(e).length===0;

}





function handleLogin(){


if(!validate())
return;


setLoading(true);


setTimeout(()=>{

setLoading(false);

navigate(role.path);


},1200);


}





return(


<div
className="
min-h-screen
py-10
relative
bg-[#020617]
hud-grid-bg
flex
items-center
justify-center
p-6
overflow-hidden
"
>



<motion.div

animate={{

background:
`radial-gradient(circle, ${role.color}35 0%, transparent 70%)`,

scale:[1,1.2,1]

}}

transition={{
duration:5,
repeat:Infinity
}}

className="
absolute
w-[700px]
h-[700px]
rounded-full
blur-3xl
"

/>





<motion.div

initial={{
opacity:0,
y:40
}}

animate={{
opacity:1,
y:0
}}

transition={{
duration:.7
}}

className="
relative
z-10
w-full
max-w-xl
bg-white/[0.06]
border
border-white/10
backdrop-blur-xl
rounded-3xl
p-8
shadow-2xl
overflow-hidden
"

>


<CornerBrackets color={role.color}/>



{/* LOGO */}

<div className="text-center">


<motion.div

animate={{
y:[0,-10,0]
}}

transition={{
duration:3,
repeat:Infinity
}}

className="
mx-auto
w-24
h-24
rounded-full
flex
items-center
justify-center
"

style={{

background:`${role.color}22`,

boxShadow:
`0 0 45px -8px ${role.color}`

}}

>


<Shield
size={48}
style={{
color:role.color
}}
/>


</motion.div>



<h1
className="
mt-6
text-5xl
font-display
font-black
bg-gradient-to-r
from-cyan-400
via-white
to-blue-400
text-transparent
bg-clip-text
"
>

NAGARRAKSHAK AI

</h1>



<p
className="
mt-3
text-gray-400
text-xs
font-hud
tracking-[0.25em]
uppercase
"
>

SMART CITY SECURITY TERMINAL

</p>


</div>





{/* STATUS */}


<div
className="
mt-7
flex
justify-center
items-center
gap-3
text-green-400
font-hud
"
>


<span
className="
w-3
h-3
rounded-full
bg-green-400
animate-pulse-dot
"
/>


<Activity size={18}/>


SYSTEM ONLINE


</div>





<h3
className="
mt-10
text-gray-400
font-hud
uppercase
tracking-widest
text-sm
"
>

SELECT ACCESS PORTAL

</h3>





{/* ROLES */}


<div
className="
grid
grid-cols-2
gap-4
mt-5
"
>


{

roles.map((item)=>{


const Icon=item.icon;

const selected=role.name===item.name;



return(


<button

key={item.name}

onClick={()=>setRole(item)}

className="
h-28
rounded-2xl
border
transition-all
duration-300
flex
flex-col
items-center
justify-center
gap-2
"

style={{

borderColor:
selected
?
item.color
:
"rgba(255,255,255,.1)",


background:
selected
?
`${item.color}20`
:
"rgba(255,255,255,.03)",


boxShadow:
selected
?
`0 0 25px -8px ${item.color}`
:
"none"

}}

>


<Icon
size={30}
style={{
color:selected?item.color:"#9ca3af"
}}
/>


<p
className="
text-sm
font-bold
"
>

{item.name}

</p>



<p
className="
text-[10px]
font-hud
tracking-widest
"

style={{
color:selected?item.color:"#6b7280"
}}

>

{item.tag}

</p>



</button>



)


})


}



</div>






{/* EMAIL */}



<div className="mt-8 relative">

<Mail
size={22}
className="
absolute
left-6
top-1/2
-translate-y-1/2
text-gray-400
"
/>


<input
value={email}
onChange={(e)=>setEmail(e.target.value)}
placeholder="Official Email"

className="
w-full
h-16
bg-black/40
border
border-white/10
rounded-xl
pl-16
pr-6
text-white
text-sm
outline-none
focus:ring-2
focus:ring-cyan-400/40
"
/>


</div>





{/* PASSWORD */}



<div className="mt-5 relative">


<Lock
size={22}
className="
absolute
left-6
top-1/2
-translate-y-1/2
text-gray-400
"
/>



<input

type={
passwordVisible
?
"text"
:
"password"
}

value={password}

onChange={(e)=>setPassword(e.target.value)}

placeholder="Password"

className="
w-full
h-16
bg-black/40
border
border-white/10
rounded-xl
pl-16
pr-16
text-white
text-sm
outline-none
focus:ring-2
focus:ring-cyan-400/40
"

/>



<button

onClick={()=>setPasswordVisible(!passwordVisible)}

className="
absolute
right-5
top-1/2
-translate-y-1/2
text-gray-400
"

>


{
passwordVisible
?
<EyeOff/>
:
<Eye/>
}


</button>



</div>





<div
className="
mt-6
h-8
flex
items-center
justify-between
text-sm
text-gray-400
"
>


<label>

<input
type="checkbox"
className="
w-4
h-4
accent-cyan-400
"
/>

&nbsp;
Remember device


</label>


<span>
Forgot password?
</span>


</div>







<motion.button

onClick={handleLogin}

whileHover={{
scale:1.03
}}

className="
mt-8
w-full
h-14
rounded-xl
font-bold
tracking-widest
text-black
"

style={{

background:role.color

}}

>


{

loading
?

<Loader2 className="animate-spin mx-auto"/>

:

"ACCESS SYSTEM"

}



</motion.button>







<p
className="
text-center
mt-7
text-gray-400
"
>

No organization account?


<span

onClick={()=>navigate("/register")}

className="
text-cyan-400
ml-2
cursor-pointer
hover:underline
"

>

Create Account

</span>


</p>




<p
className="
text-center
text-gray-600
text-xs
mt-5
font-hud
"
>

Authorized personnel only · All access is logged

</p>



</motion.div>



</div>


)


}