import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/public/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<div className="page-section">About Us Page</div>} />
        <Route path="counselors" element={<div className="page-section">Counselors Page</div>} />
        <Route path="resources" element={<div className="page-section">Resources Page</div>} />
        <Route path="login" element={<div className="page-section">Login Page</div>} />
      </Route>
    </Routes>
  );
}

export default App;