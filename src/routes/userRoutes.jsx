  import Dashboard from '../views/Dashboard'
  import ChatPage from "../views/ChatPage";

  
  const userRoutes = [
     {
         path: "/dashboard",
         name: "Dashboard",
         component: <Dashboard />,
         layout: "/user",
       },
         {
    path: "/chat",
    name: "ChatPage",
    component: <ChatPage />,
    layout: "/user",
  }
    
   
  ]
  export default userRoutes;