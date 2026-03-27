import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GuestChatWidget from "./GuestChatWidget";

function Layout() {
  return (
    <div className="site-wrapper">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <GuestChatWidget />
    </div>
  );
}

export default Layout;