import { BrowserRouter, Routes, Route } from "react-router-dom";


import Login from "./pages/Login";
import Register from "./pages/Register";


import Admin from "./pages/Admin";
import Dncc from "./pages/Dncc";
import Wasa from "./pages/Wasa";
import Maintenance from "./pages/Maintenance";


import Drone from "./pages/Drone";
import AI from "./pages/AI";
import Map from "./pages/Map";
import Alerts from "./pages/Alerts";
import Teams from "./pages/Teams";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";



function App() {


return (

<BrowserRouter>


<Routes>


{/* ================= AUTH ================= */}


<Route
path="/"
element={<Login />}
/>


<Route
path="/login"
element={<Login />}
/>


<Route
path="/register"
element={<Register />}
/>



{/* ================= DASHBOARDS ================= */}



<Route
path="/dashboard/super-admin"
element={<Admin />}
/>



<Route
path="/dashboard/dncc"
element={<Dncc />}
/>



<Route
path="/dashboard/wasa"
element={<Wasa />}
/>



<Route
path="/dashboard/maintenance"
element={<Maintenance />}
/>




{/* ================= SIDEBAR MODULES ================= */}



<Route
path="/drone"
element={<Drone />}
/>



<Route
path="/ai"
element={<AI />}
/>



<Route
path="/map"
element={<Map />}
/>



<Route
path="/alerts"
element={<Alerts />}
/>



<Route
path="/teams"
element={<Teams />}
/>



<Route
path="/reports"
element={<Reports />}
/>



<Route
path="/settings"
element={<Settings />}
/>



</Routes>


</BrowserRouter>


);


}


export default App;