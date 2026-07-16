import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import BookingsPage from "@/pages/BookingsPage";
import BookingSuccessPage from "@/pages/BookingSuccessPage";
import AdminNewsletterPage from "@/pages/AdminNewsletterPage";
import AdminExpoGamePage from "@/pages/AdminExpoGamePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/success" element={<BookingSuccessPage />} />
        <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
        <Route path="/admin/expo" element={<AdminExpoGamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
