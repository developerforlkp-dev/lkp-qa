import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "react-dates/lib/css/_datepicker.css";
import "./styles/app.sass";
import Page from "./components/Page";  //njj
import ExperienceCategory from "./screens/ExperienceCategory";
import ExperienceProduct from "./screens/ExperienceProduct";
import ExperienceCheckout from "./screens/ExperienceCheckout";
import ExperienceCheckoutComplete from "./screens/ExperienceCheckoutComplete";
import EventFlowHome from "./eventFlowTheme/pages/home";
import Checkout from "./screens/Checkout";
import CheckoutComplete from "./screens/CheckoutComplete";
import FullPhoto from "./screens/FullPhoto";
import HostProfile from "./screens/HostProfile";
import AccountSettings from "./screens/AccountSettings";


import MessageCenter from "./screens/MessageCenter";
import Wishlists from "./screens/Wishlists";
import Bookings from "./screens/Bookings";
import FleetHome from "./screens/FleetHome";
import Listings from "./pages/listings";
import Blog from "./pages/Blog";
import BlogDetails from "./pages/BlogDetails";
import ViewDetails from "./screens/ViewDetails";
import PaymentFailed from "./screens/PaymentFailed";
import NotFound from "./screens/NotFound";


import StayProduct from "./screens/StayProduct";
import StayDetails from "./screens/StayDetails";
import FoodDetails from "./screens/FoodDetails";
import PlaceDetails from "./screens/PlaceDetails";
import { ThemeProvider } from "./components/JUI/Theme";
import { ProgressBar } from "./components/JUI/UI";
import ScrollToTop from "./components/ScrollToTop";
import AnalyticsTracker from "./components/AnalyticsTracker";
import TermsOfService from "./screens/TermsOfService";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import MobileBottomNavbar from "./components/MobileBottomNavbar";
import FAQ from "./screens/FAQ";
import About from "./screens/About";
import CancellationPolicy from "./screens/CancellationPolicy";

function App() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    setIsMobileOrTablet(mediaQuery.matches);

    const handler = (e) => setIsMobileOrTablet(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);
  // Get Google Client ID from environment variable
  // Fallback to hardcoded value if env var is not set (for development/testing)
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "876306099009-inkldmfdu3ilqufhr6v9te3jom3u4odh.apps.googleusercontent.com";

  // Log for debugging
  if (process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    //console.log("✅ Google Client ID loaded from environment variable");
  } else {
    console.warn("⚠️ REACT_APP_GOOGLE_CLIENT_ID not found, using fallback value");
    console.warn("⚠️ For production, set REACT_APP_GOOGLE_CLIENT_ID in your deployment platform");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <Router>
          <AnalyticsTracker />
          <ScrollToTop />
          <ProgressBar />
          <Switch>
            <Route
              exact
              path={["/", "/experience", "/experiences", "/events", "/stays", "/food", "/places"]}
              render={(props) => {
                // Check if it's the Stays product page (has id)
                if (props.location.pathname === "/stays" && new URLSearchParams(props.location.search).get("id")) {
                  return (
                    <Page separatorHeader>
                      <StayProduct />
                    </Page>
                  );
                }
                // Default to Homepage with appropriate section
                return (
                  <Page separatorHeader={false} hideHeaderOnMobile={true}>
                    <FleetHome />
                  </Page>
                );
              }}
            />
            <Route
              exact
              path="/experience-category"
              render={() => (
                <Page notAuthorized>
                  <ExperienceCategory />
                </Page>
              )}
            />
            <Route
              exact
              path="/experience/:slugAndId"
              render={() => (
                <ExperienceProduct />
              )}
            />
            <Route
              exact
              path="/experience-product"
              render={() => (
                <ExperienceProduct />
              )}
            />
            <Route
              exact
              path="/experience-checkout"
              render={() => (
                <Page separatorHeader>
                  <ExperienceCheckout />
                </Page>
              )}
            />
            <Route
              exact
              path="/experience-checkout-complete"
              render={() => (
                <Page separatorHeader>
                  <ExperienceCheckoutComplete />
                </Page>
              )}
            />
            <Route
              exact
              path="/full-photo"
              render={() => (
                <Page separatorHeader>
                  <FullPhoto />
                </Page>
              )}
            />

            <Route
              exact
              path="/event"
              render={() => (
                <Page hideBookings fooferHide>
                  <EventFlowHome />
                </Page>
              )}
            />
            <Route
              exact
              path="/checkout"
              render={() => (
                <Page separatorHeader>
                  <Checkout />
                </Page>
              )}
            />
            <Route
              exact
              path="/checkout-complete"
              render={() => (
                <Page separatorHeader>
                  <CheckoutComplete />
                </Page>
              )}
            />
            <Route
              exact
              path="/messages"
              render={() => (
                <Page separatorHeader fooferHide wide>
                  <MessageCenter />
                </Page>
              )}
            />
            <Route
              exact
              path="/wishlists"
              render={() => (
                <Page separatorHeader>
                  <Wishlists />
                </Page>
              )}
            />
            <Route
              exact
              path="/bookings"
              component={Bookings}
            />
            <Route
              exact
              path="/viewdetails"
              render={() => (
                <Page separatorHeader>
                  <ViewDetails />
                </Page>
              )}
            />
            <Route
              exact
              path="/host-profile"
              render={() => (
                <Page>
                  <HostProfile />
                </Page>
              )}
            />
            <Route
              exact
              path="/account-settings"
              render={() => (
                <Page>
                  <AccountSettings />
                </Page>
              )}
            />

            <Route
              exact
              path="/listings"
              render={() => (
                <Page isFilterPage={true}>
                  <Listings />
                </Page>
              )}
            />


            <Route
              exact
              path="/stay-details"
              render={() => (
                <Page separatorHeader>
                  <StayDetails />
                </Page>
              )}
            />
            <Route
              exact
              path="/food-details"
              render={() => (
                <Page separatorHeader fooferHide>
                  <FoodDetails />
                </Page>
              )}
            />
            <Route
              exact
              path="/place-details"
              render={() => (
                <Page separatorHeader fooferHide>
                  <PlaceDetails />
                </Page>
              )}
            />
            <Route
              exact
              path="/terms-of-service"
              render={() => (
                <TermsOfService />
              )}
            />
            <Route
              exact
              path="/cancellation-policy"
              render={() => (
                <CancellationPolicy />
              )}
            />
            <Route
              exact
              path="/privacy-policy"
              render={() => (
                <PrivacyPolicy />
              )}
            />
            <Route
              exact
              path="/blog"
              render={() => (
                <Page separatorHeader>
                  <Blog />
                </Page>
              )}
            />
            <Route
              exact
              path="/faq"
              render={() => (
                <Page separatorHeader>
                  <FAQ />
                </Page>
              )}
            />
            <Route
              exact
              path="/about"
              render={() => (
                <Page separatorHeader>
                  <About />
                </Page>
              )}
            />
            <Route
              exact
              path="/blog/:slug"
              render={() => (
                <Page separatorHeader>
                  <BlogDetails />
                </Page>
              )}
            />
            <Route
              exact
              path="/payment/failed"
              render={() => (
                <Page separatorHeader>
                  <PaymentFailed />
                </Page>
              )}
            />
            <Route
              render={() => (
                <Page>
                  <NotFound />
                </Page>
              )}
            />
          </Switch>
          {isMobileOrTablet && <MobileBottomNavbar />}
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;








