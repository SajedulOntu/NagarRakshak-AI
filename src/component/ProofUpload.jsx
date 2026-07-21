import {
 Upload,
 CheckCircle
} from "lucide-react";


export default function ProofUpload(){


return(

<div className="glass-panel p-6">


<h3 className="
font-display
text-lg
flex
gap-2
items-center
">

<CheckCircle className="text-green-400"/>

REPAIR COMPLETION

</h3>



<p className="
text-gray-400
text-sm
mt-3
">

Upload after-repair evidence

</p>



<div className="
mt-5
h-40
border-2
border-dashed
border-green-400/30
rounded-xl
flex
items-center
justify-center
">


<div className="text-center text-gray-400">


<Upload
className="mx-auto text-green-400"
/>


<p>
Upload Photo
</p>


</div>


</div>



<button
className="
mt-5
w-full
py-3
rounded-xl
bg-green-400
text-black
font-bold
"
>

SUBMIT COMPLETION REPORT

</button>



</div>

)

}