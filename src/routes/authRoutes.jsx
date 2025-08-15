import Signup from "../views/Signup";
import Login from "../views/Home";

const authRoutes = [
   {
       path: "/login",
       name: "Login",
       component: <Login />,
       layout: "/auth",
     },
  
  {
    path: "/signup",
    name: "Signup",
    component: <Signup />,
    layout: "/auth",
  },
]
export default authRoutes;