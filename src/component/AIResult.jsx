import {
AlertTriangle,
CheckCircle
} from "lucide-react";


export default function AIResult(){

return(

<div className="
bg-white/[0.06]
border
border-white/10
rounded-3xl
p-6
">


<h2 className="
text-xl
font-bold
flex
gap-2
items-center
">

<AlertTriangle
className="text-yellow-400"
/>

AI DETECTION RESULT

</h2>



<div className="
mt-5
bg-red-500/10
border
border-red-500/30
rounded-2xl
p-5
">


<h3 className="
text-red-400
font-bold
text-lg
">

Pipeline Leakage Detected

</h3>


<p className="text-gray-400 mt-2">

Confidence: 

<span className="text-white">

96%

</span>

</p>


<p className="text-gray-400">

Location:

<span className="text-white">

Mirpur Zone-10

</span>

</p>



<div className="
mt-4
flex
items-center
gap-2
text-yellow-400
">

<CheckCircle size={18}/>

Waiting for WASA Team

</div>


</div>


</div>

)

}