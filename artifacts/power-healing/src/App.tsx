import { Route, Switch, useLocation } from 'wouter';
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Admin from "@/pages/Admin";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import MyCourses from "@/pages/MyCourses";
import MyProfile from "@/pages/MyProfile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import ProductPage from "@/pages/ProductPage";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/signup';
  const isAdminPage = location.startsWith('/admin');
  const isFlowPage = location === '/checkout' || location === '/payment-success';

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/admin" component={Admin} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/my-courses" component={MyCourses} />
          <Route path="/my-profile" component={MyProfile} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsConditions} />
          <Route path="/product" component={ProductPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && !isAdminPage && !isFlowPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
