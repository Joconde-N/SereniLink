import React from "react";
import { Routes, Route } from "react-router-dom";

// Public layout
import Layout from "./components/layout/Layout";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Counselors from "./pages/counselors/Counselors";
import Resources from "./pages/resources/Resources";
import Login from "./pages/Login/Login";
import Register from "./pages/register/Register";
import CounselorApplication from "./pages/counselorApplication/CounselorApplication";
import GuestAiSupport from "./pages/home/GuestAiSupport";

// User dashboard
import DashboardLayout from "./components/user-dashboard/DashboardLayout";
import Overview from "./pages/user-dashboard/Overview";
import MyBookings from "./pages/user-dashboard/MyBookings";
import BookingDetails from "./pages/user-dashboard/BookingDetails";
import SessionChat from "./pages/user-dashboard/SessionChat";
import MoodCheckins from "./pages/user-dashboard/MoodCheckins";
import Progress from "./pages/user-dashboard/Progress";
import Exercises from "./pages/user-dashboard/Exercises";
import Notifications from "./pages/user-dashboard/Notifications";
import Settings from "./pages/user-dashboard/Settings";
import AiSupport from "./pages/user-dashboard/AiSupport";
import FindCounselors from "./pages/user-dashboard/FindCounselors";
import DashboardResources from "./pages/user-dashboard/DashboardResources";
import Messages from "./pages/user-dashboard/Messages";

// Admin dashboard
import AdminLayout from "./components/admin-dashboard/AdminLayout";
import AdminOverview from "./pages/admin-dashboard/AdminOverview";
import CounselorApplications from "./pages/admin-dashboard/CounselorApplications";
import BookingsManagement from "./pages/admin-dashboard/BookingsManagement";
import ContentManagement from "./pages/admin-dashboard/ContentManagement";
import ExercisesManagement from "./pages/admin-dashboard/ExercisesManagement";
import AdminUsers from "./pages/admin-dashboard/AdminUsers";
import AdminCounselors from "./pages/admin-dashboard/AdminCounselors";
import AdminInsights from "./pages/admin-dashboard/AdminInsights";
import AdminProfile from "./pages/admin-dashboard/AdminProfile";
import AdminSettings from "./pages/admin-dashboard/AdminSettings";

// Counselor dashboard
import CounselorLayout from "./components/counselor-dashboard/CounselorLayout";
import CounselorOverview from "./pages/counselor-dashboard/CounselorOverview";
import MyAvailability from "./pages/counselor-dashboard/MyAvailability";
import BookingRequests from "./pages/counselor-dashboard/BookingRequests";
import MySessions from "./pages/counselor-dashboard/MySessions";
import CounselorBookingDetails from "./pages/counselor-dashboard/CounselorBookingDetails";
import CounselorChat from "./pages/counselor-dashboard/CounselorChat";
import CounselorMessages from "./pages/counselor-dashboard/CounselorMessages";
import CounselorNotifications from "./pages/counselor-dashboard/CounselorNotifications";
import CounselorProfile from "./pages/counselor-dashboard/CounselorProfile";
import CounselorSettings from "./pages/counselor-dashboard/CounselorSettings";
import ChangePassword from "./pages/counselor-dashboard/ChangePassword";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="counselors" element={<Counselors />} />
        <Route path="resources" element={<Resources />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/counselor-application" element={<CounselorApplication />} />
      <Route path="/guest-ai" element={<GuestAiSupport />} />

      {/* User Dashboard */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="chat/:bookingId" element={<SessionChat />} />
        <Route path="checkins" element={<MoodCheckins />} />
        <Route path="progress" element={<Progress />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="ai-support" element={<AiSupport />} />
        <Route path="counselors" element={<FindCounselors />} />
        <Route path="resources" element={<DashboardResources />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="applications" element={<CounselorApplications />} />
        <Route path="bookings" element={<BookingsManagement />} />
        <Route path="content" element={<ContentManagement />} />
        <Route path="exercises" element={<ExercisesManagement />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="counselors" element={<AdminCounselors />} />
        <Route path="insights" element={<AdminInsights />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Counselor Dashboard */}
      <Route path="/counselor" element={<CounselorLayout />}>
        <Route index element={<CounselorOverview />} />
        <Route path="availability" element={<MyAvailability />} />
        <Route path="requests" element={<BookingRequests />} />
        <Route path="sessions" element={<MySessions />} />
        <Route path="bookings/:id" element={<CounselorBookingDetails />} />
        <Route path="chat/:bookingId" element={<CounselorChat />} />
        <Route path="messages" element={<CounselorMessages />} />
        <Route path="notifications" element={<CounselorNotifications />} />
        <Route path="profile" element={<CounselorProfile />} />
        <Route path="settings" element={<CounselorSettings />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>
    </Routes>
  );
}

export default App;
