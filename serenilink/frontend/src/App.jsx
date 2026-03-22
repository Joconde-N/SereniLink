import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Counselors from "./pages/counselors/Counselors";
import Resources from "./pages/resources/Resources";
import Login from "./pages/Login/Login";
import Register from "./pages/register/Register";
import CounselorApplication from "./pages/counselorApplication/CounselorApplication";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="counselors" element={<Counselors />} />
        <Route path="resources" element={<Resources />} />
      </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/counselor-application" element={<CounselorApplication />} />
    </Routes>
  );
}

export default App;