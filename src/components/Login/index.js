import React, { useState, useEffect, useRef } from "react";
import cn from "classnames";
import styles from "./Login.module.sass";
import Icon from "../Icon";
import { sendPhoneOTP, verifyPhoneOTP, loginWithGoogle, completeCustomerProfile } from "../../utils/api";
import { GoogleLogin } from '@react-oauth/google';
import Dropdown from "../Dropdown";

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return {};
  }
};

const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1));
const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const yearOptions = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - 18 - i));

const isDateOfBirthRequiredError = (err) => {
  const dobErrors = err?.response?.data?.fieldErrors?.dateOfBirth;
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";

  if (Array.isArray(dobErrors) && dobErrors.length > 0) {
    return true;
  }

  const msgLower = String(message).toLowerCase();
  return (
    msgLower.includes("date of birth") ||
    msgLower.includes("dateofbirth") ||
    msgLower.includes("dob") ||
    Boolean(err?.response?.data?.requiresDateOfBirth) ||
    Boolean(err?.response?.data?.requiresProfileCompletion)
  );
};

const getFriendlyOtpError = (err) => {
  const status = err?.response?.status;
  const rawMessage =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";
  const msg = String(rawMessage).toLowerCase();

  if (status === 400 || status === 401) {
    if (msg.includes("expired")) {
      return "Your OTP has expired. Please request a new code.";
    }
    if (msg.includes("invalid") || msg.includes("otp") || msg.includes("code")) {
      return "The code you entered is invalid. Please check and try again.";
    }
    return "We couldn’t verify that code. Please check it and try again.";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (status >= 500) {
    return "Our servers are busy right now. Please try again in a few minutes.";
  }
  return "We couldn’t verify your code right now. Please try again.";
};

const getDateOfBirthValidationError = (dateOfBirth) => {
  if (!dateOfBirth) {
    return "Please enter your date of birth";
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return "Please enter a valid date of birth";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  if (age < 18) {
    return "You must be at least 18 years of age.";
  }

  return "";
};

const Login = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP
  const [, setActiveInput] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dobDay, setDobDay] = useState("Day");
  const [dobMonth, setDobMonth] = useState("Month");
  const [dobYear, setDobYear] = useState("Year");
  const [step, setStep] = useState("phone"); // "phone", "otp", "profile"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresProfileCompletion, setRequiresProfileCompletion] = useState(true);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState("");
  const countryCode = "+91";
  const isMountedRef = useRef(true);
  const otpFocusTimeoutRef = useRef(null);
  const maxDateOfBirth = new Date(
    Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  // Responsive scale for Google Login button
  const [googleScale, setGoogleScale] = useState(
    window.innerWidth < 480 ? Math.min(1, (window.innerWidth - 80) / 350) : 1
  );

  useEffect(() => {
    const handleResize = () => {
      setGoogleScale(
        window.innerWidth < 480 ? Math.min(1, (window.innerWidth - 80) / 350) : 1
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (otpFocusTimeoutRef.current) {
        clearTimeout(otpFocusTimeoutRef.current);
      }
    };
  }, []);

  // Sync the 3 DOB selects into the single dateOfBirth state
  useEffect(() => {
    if (dobYear !== "Year" && dobMonth !== "Month" && dobDay !== "Day") {
      const monthIndex = monthOptions.indexOf(dobMonth) + 1;
      const formattedMonth = String(monthIndex).padStart(2, '0');
      const formattedDay = String(dobDay).padStart(2, '0');
      setDateOfBirth(`${dobYear}-${formattedMonth}-${formattedDay}`);
    } else {
      setDateOfBirth("");
    }
  }, [dobDay, dobMonth, dobYear]);

  // Auto-focus first OTP input when OTP step is shown
  useEffect(() => {
    if (step === "otp") {
      const firstInput = document.getElementById(`otp-login-0`);
      if (firstInput) {
        otpFocusTimeoutRef.current = setTimeout(() => firstInput.focus(), 100);
      }
    }
    return () => {
      if (otpFocusTimeoutRef.current) {
        clearTimeout(otpFocusTimeoutRef.current);
      }
    };
  }, [step]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pasteValue = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      pasteValue.split("").forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pasteValue.length, 5);
      setActiveInput(nextIndex);
      const nextInput = document.getElementById(`otp-login-${nextIndex}`);
      if (nextInput) nextInput.focus();
    } else {
      // Single character input
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);
      if (value && index < 5) {
        setActiveInput(index + 1);
        const nextInput = document.getElementById(`otp-login-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle OTP key down (backspace, arrow keys)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setActiveInput(index - 1);
      const prevInput = document.getElementById(`otp-login-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveInput(index - 1);
      const prevInput = document.getElementById(`otp-login-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveInput(index + 1);
      const nextInput = document.getElementById(`otp-login-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const googleClientId =
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "876306099009-inkldmfdu3ilqufhr6v9te3jom3u4odh.apps.googleusercontent.com";

  // Handle Google login success
  async function handleGoogleSuccess(tokenResponse) {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError("");

      //console.log("🔵 Google OAuth token received");

      // Send access token to backend
      if (!tokenResponse?.credential) {
        throw new Error("No Google ID token received");
      }
      
      const decodedGoogleData = decodeJwt(tokenResponse.credential);
      const googleAvatar = decodedGoogleData.picture || "";
      
      const response = await loginWithGoogle(tokenResponse.credential, "", googleAvatar);

      // Store JWT token from response temporarily
      const token = response?.token;

      if (response?.requiresProfileCompletion) {
        setPendingToken(token);
        setStep("profile");
        return;
      }

      if (token) {
        localStorage.setItem("jwtToken", token);
      }

      const customer = response?.customer || {};
      const userInfo = {
        firstName: customer?.firstName || decodedGoogleData.given_name || "",
        lastName: customer?.lastName || decodedGoogleData.family_name || "",
        email: customer?.email || decodedGoogleData.email || "",
        avatar: customer?.avatar || googleAvatar || "",
        customerId: customer?.customerId,
        loginMethod: 'google'
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      if (onClose) {
        onClose();
      }
      window.location.reload();
    } catch (err) {
      console.error("Google login error:", err);
      if (isMountedRef.current) {
        if (isDateOfBirthRequiredError(err) && tokenResponse?.credential) {
          setPendingGoogleCredential(tokenResponse.credential);
          setPendingToken(null);
          setDateOfBirth("");
          setError("");
          setStep("profile");
          return;
        }
        setError(err.response?.data?.message || err.message || "Google login failed.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  // Handle Profile Completion Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    setError("");

    const dobError = getDateOfBirthValidationError(dateOfBirth);
    if (dobError) {
      setError(dobError);
      return;
    }

    setLoading(true);
    try {
      if (pendingGoogleCredential && !pendingToken) {
        const decodedGoogleData = decodeJwt(pendingGoogleCredential);
        const googleAvatar = decodedGoogleData.picture || "";
        
        const response = await loginWithGoogle(pendingGoogleCredential, dateOfBirth, googleAvatar);
        const token = response?.token;

        if (token) {
          localStorage.setItem("jwtToken", token);
        }

        const customer = response?.customer || {};
        const userInfo = {
          firstName: customer?.firstName || decodedGoogleData.given_name || "",
          lastName: customer?.lastName || decodedGoogleData.family_name || "",
          email: customer?.email || decodedGoogleData.email || "",
          avatar: customer?.avatar || googleAvatar || "",
          customerId: customer?.customerId,
          loginMethod: 'google'
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        if (onClose) {
          onClose();
        }
        window.location.reload();
        return;
      }

      const response = await completeCustomerProfile({
        fullName: `${firstName} ${lastName}`.trim(),
        dateOfBirth,
      }, pendingToken);

      if (pendingToken) {
        localStorage.setItem("jwtToken", pendingToken);
      }

      const customer = response?.customer || {};
      const userInfo = {
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        email: customer?.email || "",
        customerId: customer?.customerId,
        loginMethod: 'google'
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      if (onClose) {
        onClose();
      }
      window.location.reload();
    } catch (err) {
      console.error("Profile completion error:", err);
      if (isMountedRef.current) {
        setError(err.response?.data?.message || err.message || "Failed to complete profile.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };


  // Send OTP when phone number is submitted
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    setError("");

    if (!phoneNumber || phoneNumber.trim() === "") {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await sendPhoneOTP(phoneNumber.trim(), countryCode);
      if (!isMountedRef.current) return;
      
      if (response && response.requiresProfileCompletion !== undefined) {
        setRequiresProfileCompletion(response.requiresProfileCompletion);
      } else {
        setRequiresProfileCompletion(true);
      }
      
      setStep("otp");
      setError("");
      setOtp(["", "", "", "", "", ""]);
      setActiveInput(0);
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.response?.data?.message || err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Verify OTP when OTP is submitted
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!isMountedRef.current) return;
    setError("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    if (requiresProfileCompletion) {
      const dobError = getDateOfBirthValidationError(dateOfBirth);
      if (dobError) {
        setError(dobError);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await verifyPhoneOTP(
        phoneNumber.trim(),
        otpString,
        countryCode,
        firstName.trim(),
        lastName.trim(),
        dateOfBirth
      );

      // Store JWT token if provided in response
      const token =
        response.token ||
        response.jwtToken ||
        response.accessToken ||
        response.data?.token ||
        response.data?.jwtToken ||
        response.data?.accessToken;

      if (response?.requiresProfileCompletion || response?.data?.requiresProfileCompletion) {
        setPendingToken(token);
        setStep("profile");
        const customer = response?.customer || response?.data?.customer || {};
        if (customer?.firstName && !firstName) setFirstName(customer.firstName);
        if (customer?.lastName && !lastName) setLastName(customer.lastName);
        return;
      }

      if (token) {
        localStorage.setItem("jwtToken", token);
        //console.log("✅ JWT token stored in localStorage");
      } else {
        console.warn("⚠️ No JWT token found in response:", response);
      }

      // Store phone number and user info in localStorage
      const userInfo = {
        phone: phoneNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        customerPhone: countryCode + phoneNumber.trim(),
        firstName: firstName.trim() || "",
        lastName: lastName.trim() || "",
        name: firstName.trim() + (lastName.trim() ? " " + lastName.trim() : ""),
        ...(response.user || response.data?.user || {})
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      //console.log("✅ User info stored in localStorage:", userInfo);

      // Close modal and reload to update header
      if (onClose) {
        onClose();
      }
      window.location.reload();
    } catch (err) {
      if (isMountedRef.current) {
        if (isDateOfBirthRequiredError(err)) {
          setRequiresProfileCompletion(true);
          setError(
            err?.response?.data?.message ||
            err?.response?.data?.fieldErrors?.dateOfBirth?.[0] ||
            "Please enter your date of birth to continue."
          );
          return;
        }
        setError(getFriendlyOtpError(err));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Go back to phone input
  const handleBackToPhone = () => {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setActiveInput(0);
    setError("");
  };

  return (
    <div className={cn(styles.login)}>
      {/* Step 1: Phone Number Input */}
      {step === "phone" && (
        <div className={styles.item}>
          <div className={cn("h3", styles.title)}>Sign up on Little Known Planet</div>
          <div className={styles.info}>Login with your Google account</div>

          <div className={styles.btns}>
            <div style={{
              width: '350px',
              maxWidth: '350px',
              transform: `scale(${googleScale})`,
              transformOrigin: 'top center',
              height: `${44 * googleScale}px`,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google login failed. Please try again.");
                }}
                theme="filled_blue"
                size="large"
                shape="pill"
                width="350"
              />
            </div>
          </div>
          <div className={styles.note}>Or continue with phone number</div>
          <form onSubmit={handlePhoneSubmit} className={styles.form}>
            <div className={styles.phoneInput}>
              <div className={styles.countryCode}>
                <div className={styles.flag}>
                  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Saffron stripe */}
                    <rect width="24" height="6" fill="#FF9933" />
                    {/* White stripe with Ashoka Chakra */}
                    <rect y="6" width="24" height="6" fill="#FFFFFF" />
                    {/* Ashoka Chakra circle */}
                    <circle cx="12" cy="9" r="2.5" fill="none" stroke="#000080" strokeWidth="0.35" />
                    {/* 24 spokes of Ashoka Chakra - using simpler approach */}
                    {[...Array(24)].map((_, i) => {
                      const angle = (i * 15) - 90; // Start from top, 15 degrees apart
                      const radian = (angle * Math.PI) / 180;
                      const x1 = 12 + Math.cos(radian) * 0.8;
                      const y1 = 9 + Math.sin(radian) * 0.8;
                      const x2 = 12 + Math.cos(radian) * 2.5;
                      const y2 = 9 + Math.sin(radian) * 2.5;
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#000080"
                          strokeWidth="0.3"
                          strokeLinecap="round"
                        />
                      );
                    })}
                    {/* Green stripe */}
                    <rect y="12" width="24" height="6" fill="#138808" />
                  </svg>
                </div>
                <span className={styles.countryCodeText}>+91</span>
              </div>
              <input
                type="tel"
                className={styles.input}
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                required
              />
              <button
                type="submit"
                className={styles.btn}
                disabled={loading || !phoneNumber.trim()}
              >
                <Icon name="arrow-next" size="14" />
              </button>
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </form>

        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === "otp" && (
        <div className={styles.item}>
          <div className={cn("h3", styles.title)}>Enter your security code</div>
          <div className={styles.info}>We texted your code to +91 {phoneNumber}</div>
          <form onSubmit={handleOtpSubmit} className={styles.form}>
            <div className={styles.code}>
              {otp.map((digit, index) => (
                <div key={index} className={styles.number}>
                  <input
                    id={`otp-login-${index}`}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={() => setActiveInput(index)}
                    disabled={loading}
                    autoFocus={index === 0}
                    required
                  />
                </div>
              ))}
            </div>
            {requiresProfileCompletion && (
              <>
                <div className={styles.nameFields}>
                  <input
                    type="text"
                    className={styles.nameInput}
                    placeholder="First Name (Optional)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                  <input
                    type="text"
                    className={styles.nameInput}
                    placeholder="Last Name (Optional)"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className={styles.dobField}>
                  <label htmlFor="otp-login-dob" className={styles.fieldLabel}>
                    <span>Date of Birth <span className={styles.required}>*</span></span>
                    <span className={styles.ageHint}>(Must be 18+)</span>
                  </label>
                  <input
                    id="otp-login-dob"
                    type="date"
                    className={styles.dateInput}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={loading}
                    max={maxDateOfBirth}
                    required
                  />
                </div>
              </>
            )}
            {error && <div className={styles.error}>{error}</div>}
            <button
              type="submit"
              className={cn("button", styles.button)}
              disabled={loading || otp.join("").length !== 6 || (requiresProfileCompletion && !dateOfBirth)}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Profile Completion */}
      {step === "profile" && (
        <div className={cn(styles.item, styles.profileCompleteItem)}>
          <style>{`
            .Modal-close-btn { display: none !important; }
          `}</style>
          
          <div className={styles.premiumHeader}>
            <div className={styles.iconCircle}>
              <Icon name="user" size="24" />
            </div>
            <div className={cn("h3", styles.title)}>
              {pendingGoogleCredential && !pendingToken ? "Almost there!" : "Welcome aboard"}
            </div>
            <div className={styles.info}>
              {pendingGoogleCredential && !pendingToken
                ? "We just need your date of birth to finish setting up your account."
                : "Please fill in a few details so we can personalize your experience."}
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className={styles.form}>
            {!(pendingGoogleCredential && !pendingToken) && (
              <div className={styles.nameFields}>
                <div className={styles.inputWrap}>
                  <label>First Name</label>
                  <input
                    type="text"
                    className={styles.nameInput}
                    placeholder="e.g. Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className={styles.inputWrap}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    className={styles.nameInput}
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className={styles.dobField}>
              <label className={styles.fieldLabel}>
                <span>Date of Birth <span className={styles.required}>*</span></span>
                <span className={styles.ageHint}>(Must be 18+)</span>
              </label>
              
              <div className={styles.dobDropdowns}>
                <div className={styles.selectWrap}>
                  <Dropdown
                    className={styles.dropdown}
                    value={dobDay}
                    setValue={setDobDay}
                    options={dayOptions}
                  />
                </div>
                
                <div className={styles.selectWrap}>
                  <Dropdown
                    className={styles.dropdown}
                    value={dobMonth}
                    setValue={setDobMonth}
                    options={monthOptions}
                  />
                </div>
                
                <div className={styles.selectWrap}>
                  <Dropdown
                    className={styles.dropdown}
                    value={dobYear}
                    setValue={setDobYear}
                    options={yearOptions}
                  />
                </div>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            
            <button
              type="submit"
              className={cn("button", styles.button, styles.submitBtn)}
              disabled={loading || dobDay === "Day" || dobMonth === "Month" || dobYear === "Year" || (!(pendingGoogleCredential && !pendingToken) && (!firstName || !lastName))}
            >
              {loading ? "Saving..." : pendingGoogleCredential && !pendingToken ? "Continue with Google" : "Complete Profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;
