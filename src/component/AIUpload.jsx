import { 
  Upload,
  ScanLine,
  Image as ImageIcon
} from "lucide-react";

import {useState} from "react";


export default function AIUpload(){


const [image,setImage]=useState(null);


function handleImage(e){

const file=e.target.files[0];

if(file){

setImage(URL.createObjectURL(file));

}

}



return (

<div className="
bg-white/[0.06]
border
border-white/10
rounded-3xl
p-6
backdrop-blur-xl
">


<h2 className="
text-xl
font-bold
flex
items-center
gap-2
">

<ScanLine className="text-cyan-400"/>

AI INSPECTION MODULE

</h2>



<div className="
mt-5
border-2
border-dashed
border-cyan-400/30
rounded-2xl
h-60
flex
items-center
justify-center
overflow-hidden
">


{

image ?

<img
src={image}
className="
w-full
h-full
object-cover
"
/>


:

<div className="
text-center
text-gray-400
">


<ImageIcon
size={50}
className="mx-auto text-cyan-400"
/>


<p className="mt-3">

Upload Drone Image

</p>


</div>


}


</div>



<label
className="
mt-5
block
cursor-pointer
bg-cyan-400
text-black
font-bold
text-center
py-3
rounded-xl
hover:scale-105
transition
"
>


<Upload
size={18}
className="inline mr-2"
/>


UPLOAD IMAGE


<input

type="file"

accept="image/*"

onChange={handleImage}

className="hidden"

/>


</label>




<button

className="
mt-4
w-full
py-3
rounded-xl
bg-red-500
text-white
font-bold
hover:scale-105
transition
"

>


RUN AI DETECTION


</button>



</div>


)

}