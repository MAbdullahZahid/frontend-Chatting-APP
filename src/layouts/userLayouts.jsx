import { Route, Routes, Navigate } from "react-router-dom";
import userRoutes from "../routes/userRoutes";

const UserLayout = () => {
  const getRoutes = (userRoutes) => {
    return userRoutes.map((prop, key) => {
      if (prop.layout === "/user") {
        return (
          <Route path={prop.path} element={prop.component} key={key} exact />
        );
      } else {
        return null;
      }
    });
  };
  return (
    <>
    
          <Routes>
            {getRoutes(userRoutes)}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
            
          </Routes>
       
    </>
  );
};

export default UserLayout;
