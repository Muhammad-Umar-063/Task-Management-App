// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import Login from "./Pages/Login";
// import SignUp from "./Pages/SignUp";
// import Products from "./Pages/Products";
// import Admin from "./Pages/Admin";
// import Logout from "./Pages/Logout";
// import ProtectedRoute from "./Components/ProtectedRoute";
// import PublicRoute from "./Components/PublicRoute";
// import AddTask from "./Pages/AddTask";
// import EditTask from "./Pages/EditTask";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={
//           <PublicRoute><Login /></PublicRoute>
//         } />
//         <Route path="/register" element={
//           <PublicRoute><SignUp /></PublicRoute>
//         } />
//         <Route path="/dashboard" element={
//           <ProtectedRoute><Products /></ProtectedRoute>
//         } />
//         <Route path="/tasks" element={
//           <ProtectedRoute><AddTask /></ProtectedRoute>
//         } />
//         <Route path="/task/:id" element={
//           <ProtectedRoute><EditTask /></ProtectedRoute>
//         } />
//         <Route path="/admin" element={
//           <ProtectedRoute><Admin /></ProtectedRoute>
//         } />
//         <Route path="/logout" element={
//           <ProtectedRoute><Logout /></ProtectedRoute>
//         } />
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;



import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login                 from "./Pages/Login"
import SignUp                from "./Pages/SignUp"
import Dashboard             from "./Pages/Dashboard"
import GroupPage             from "./Pages/GroupPage"
import SuperAdminDashboard   from "./Pages/SuperAdminDashboard"
import SuperAdminGroupPage   from "./Pages/SuperAdminGroupPage"
import AddTask               from "./Pages/AddTask"
import EditTask              from "./Pages/EditTask"
import Admin                 from "./Pages/Admin"
import ProtectedRoute        from "./Components/ProtectedRoute"
import PublicRoute           from "./Components/PublicRoute"

function App() {
    return (
        <Router>
            <Routes>
                {/* public */}
                <Route path="/"          element={<PublicRoute><Login  /></PublicRoute>} />
                <Route path="/register"  element={<PublicRoute><SignUp /></PublicRoute>} />

                {/* admin + user */}
                <Route path="/dashboard"                   element={<ProtectedRoute roles={["admin","user"]}><Dashboard /></ProtectedRoute>} />
                <Route path="/groups/:id"                  element={<ProtectedRoute roles={["admin","user"]}><GroupPage /></ProtectedRoute>} />
                <Route path="/groups/:groupId/add-task"    element={<ProtectedRoute roles={["admin"]}><AddTask /></ProtectedRoute>} />
                <Route path="/tasks/:id/edit"              element={<ProtectedRoute roles={["admin","user","superadmin"]}><EditTask /></ProtectedRoute>} />

                {/* stats page — admin + superadmin */}
                <Route path="/stats"     element={<ProtectedRoute roles={["admin","superadmin"]}><Admin /></ProtectedRoute>} />

                {/* superadmin */}
                <Route path="/superadmin"                           element={<ProtectedRoute roles={["superadmin"]}><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/superadmin/groups/:id"                element={<ProtectedRoute roles={["superadmin"]}><SuperAdminGroupPage /></ProtectedRoute>} />
                <Route path="/superadmin/groups/:groupId/add-task"  element={<ProtectedRoute roles={["superadmin"]}><AddTask /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    )
}

export default App