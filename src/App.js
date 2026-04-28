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
import FullPhoto from "./screens/FullPhoto";
import Flights from "./screens/Flights";
import FlightsCategory from "./screens/FlightsCategory";
import ThingsToDo from "./screens/ThingsToDo";
import Category from "./screens/Category";
import Product from "./screens/Product";
import Checkout from "./screens/Checkout";
import CheckoutComplete from "./screens/CheckoutComplete";
import Cars from "./screens/Cars";
import CarsCategory from "./screens/CarsCategory";
import CarsCategory2 from "./screens/CarsCategory2";
import CarsProduct from "./screens/CarsProduct";
import CarsCheckout from "./screens/CarsCheckout";
import CarsCheckoutComplete from "./screens/CarsCheckoutComplete";
import HostProfile from "./screens/HostProfile";
import ProfileUser from "./screens/ProfileUser";
import AccountSettings from "./screens/AccountSettings";
import Support from "./screens/Support";
import PageList from "./screens/PageList";
import MessageCenter from "./screens/MessageCenter";
import Wishlists from "./screens/Wishlists";
import YourTrips from "./screens/YourTrips";
import Bookings from "./screens/Bookings";
import ViewDetails from "./screens/ViewDetails";
import ListYourProperty from "./screens/ListYourProperty";
import FleetHome from "./screens/FleetHome";
import Listings from "./pages/listings";
import EventProduct from "./screens/EventProduct";
import EventFlowHome from "./eventFlowTheme/pages/home";
import EventDetailsPage from "./eventFlowTheme/pages/event-details";
import StayProduct from "./screens/StayProduct";
import StayDetails from "./screens/StayDetails";
import FoodDetails from "./screens/FoodDetails";
import PlaceDetails from "./screens/PlaceDetails";
import { ThemeProvider } from "./components/JUI/Theme";
import { Cursor, ProgressBar } from "./components/JUI/UI";

function App() {
  // Get Google Client ID from environment variable
  // Fallback to hardcoded value if env var is not set (for development/testing)
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "876306099009-inkldmfdu3ilqufhr6v9te3jom3u4odh.apps.googleusercontent.com";

  // Log for debugging
  if (process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    console.log("✅ Google Client ID loaded from environment variable");
  } else {
    console.warn("⚠️ REACT_APP_GOOGLE_CLIENT_ID not found, using fallback value");
    console.warn("⚠️ For production, set REACT_APP_GOOGLE_CLIENT_ID in your deployment platform");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <Router>
          <Cursor />
          <ProgressBar />
          <Switch>
            <Route
              exact
            path="/"
            render={() => (
              <Page>
                <FleetHome />
              </Page>
            )}
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
            path="/event-product"
            render={() => (
              <Page separatorHeader>
                <EventProduct />
              </Page>
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
            path="/flights"
            render={() => (
              <Page>
                <Flights />
              </Page>
            )}
          />
          <Route
            exact
            path="/flights-category"
            render={() => (
              <Page>
                <FlightsCategory />
              </Page>
            )}
          />
          <Route
            exact
            path="/things-to-do"
            render={() => (
              <Page>
                <ThingsToDo />
              </Page>
            )}
          />
          <Route
            exact
            path="/category"
            render={() => (
              <Page>
                <Category />
              </Page>
            )}
          />
          <Route
            exact
            path="/product"
            render={() => (
              <Page separatorHeader>
                <Product />
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
            path="/cars"
            render={() => (
              <Page>
                <Cars />
              </Page>
            )}
          />
          <Route
            exact
            path="/cars-category"
            render={() => (
              <Page>
                <CarsCategory />
              </Page>
            )}
          />
          <Route
            exact
            path="/cars-category-2"
            render={() => (
              <Page>
                <CarsCategory2 />
              </Page>
            )}
          />
          <Route
            exact
            path="/cars-product"
            render={() => (
              <Page separatorHeader>
                <CarsProduct />
              </Page>
            )}
          />
          <Route
            exact
            path="/cars-checkout"
            render={() => (
              <Page separatorHeader>
                <CarsCheckout />
              </Page>
            )}
          />
          <Route
            exact
            path="/cars-checkout-complete"
            render={() => (
              <Page separatorHeader>
                <CarsCheckoutComplete />
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
            render={() => (
              <Page separatorHeader>
                <Bookings />
              </Page>
            )}
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
            path="/your-trips"
            render={() => (
              <Page separatorHeader>
                <YourTrips />
              </Page>
            )}
          />
          <Route
            exact
            path="/list-your-property"
            render={() => (
              <Page separatorHeader>
                <ListYourProperty />
              </Page>
            )}
          />
          <Route
            exact
            path="/profile"
            render={() => (
              <Page>
                <ProfileUser />
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
            path="/support"
            render={() => (
              <Page>
                <Support />
              </Page>
            )}
          />
          <Route exact path="/pagelist" component={PageList} />
          <Route
            exact
            path="/listings"
            render={() => (
              <Page>
                <Listings />
              </Page>
            )}
          />
          <Route
            exact
            path="/event"
            render={() => (
              <Page separatorHeader fooferHide>
                <EventFlowHome />
              </Page>
            )}
          />
          <Route
            exact
            path="/event-details"
            render={() => <EventDetailsPage />}
          />
          <Route
            exact
            path="/stays"
            render={() => (
              <Page separatorHeader>
                <StayProduct />
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
              <Page separatorHeader>
                <FoodDetails />
              </Page>
            )}
          />
          <Route
            exact
            path="/place-details"
            render={() => (
              <Page separatorHeader>
                <PlaceDetails />
              </Page>
            )}
          />
          </Switch>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
