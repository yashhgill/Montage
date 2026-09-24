import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImageOverridesProvider } from "@/context/ImageOverridesContext";
import HomePage from "@/pages/HomePage";
import BookingsPage from "@/pages/BookingsPage";
import BookingSuccessPage from "@/pages/BookingSuccessPage";
import AdminNewsletterPage from "@/pages/AdminNewsletterPage";
import AdminExpoGamePage from "@/pages/AdminExpoGamePage";
import PhotoboothPage from "@/pages/PhotoboothPage";
import PhotoboothSharePage from "@/pages/PhotoboothSharePage";
import AdminPhotoboothPage from "@/pages/AdminPhotoboothPage";
import AdminInvoicePage from "@/pages/AdminInvoicePage";
import AdminCustomPackagePage from "@/pages/AdminCustomPackagePage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminSitePhotosPage from "@/pages/AdminSitePhotosPage";
import AdminQuotationPage from "@/pages/AdminQuotationPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import RefundPolicyPage from "@/pages/RefundPolicyPage";
import CookiePolicyPage from "@/pages/CookiePolicyPage";

function App() {
  return (
    <BrowserRouter>
      <ImageOverridesProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/success" element={<BookingSuccessPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/site-photos" element={<AdminSitePhotosPage />} />
        <Route path="/admin/quotation" element={<AdminQuotationPage />} />
        <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
        <Route path="/admin/expo" element={<AdminExpoGamePage />} />
        <Route path="/photobooth" element={<PhotoboothPage />} />
        <Route path="/photobooth/p/:token" element={<PhotoboothSharePage />} />
        <Route path="/admin/photobooth" element={<AdminPhotoboothPage />} />
        <Route path="/admin/invoice" element={<AdminInvoicePage />} />
        <Route path="/admin/custom-package" element={<AdminCustomPackagePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
      </Routes>
      </ImageOverridesProvider>
    </BrowserRouter>
  );
}

export default App;
