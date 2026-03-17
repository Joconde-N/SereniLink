import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Counselors from "./pages/counselors/Counselors"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/counselors" element={<Counselors />} />
        <Route path="resources" element={<div className="page-section">Resources Page</div>} />
        <Route path="login" element={<div className="page-section">Login Page</div>} />
      </Route>
    </Routes>
  );
}

export default App;