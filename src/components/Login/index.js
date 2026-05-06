import React, { useState, useEffect, useRef } from "react";
import cn from "classnames";
import styles from "./Login.module.sass";
import Icon from "../Icon";
import { sendPhoneOTP, verifyPhoneOTP, loginWithGoogle } from "../../utils/api";
import { GoogleLogin } from '@react-oauth/google';

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

const Login = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP
  const [, setActiveInput] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [step, setStep] = useState("phone"); // "phone", "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const countryCode = "+91";
  const isMountedRef = useRef(true);
  const otpFocusTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (otpFocusTimeoutRef.current) {
        clearTimeout(otpFocusTimeoutRef.current);
      }
    };
  }, []);

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

      console.log("🔵 Google OAuth token received");
      
      // Send access token to backend
      if (!tokenResponse?.credential) {
        throw new Error("No Google ID token received");
      }
      const response = await loginWithGoogle(tokenResponse.credential);

      // Store JWT token from response
      const token = response?.token;
      if (token) {
        localStorage.setItem("jwtToken", token);
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
      console.error("Google login error:", err);
      if (isMountedRef.current) {
        setError(err.response?.data?.message || err.message || "Google login failed.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }


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
      await sendPhoneOTP(phoneNumber.trim(), countryCode);
      if (!isMountedRef.current) return;
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

    setLoading(true);
    try {
      const response = await verifyPhoneOTP(
        phoneNumber.trim(),
        otpString,
        countryCode,
        firstName.trim(),
        lastName.trim()
      );

      // Store JWT token if provided in response
      const token =
        response.token ||
        response.jwtToken ||
        response.accessToken ||
        response.data?.token ||
        response.data?.jwtToken ||
        response.data?.accessToken;

      if (token) {
        localStorage.setItem("jwtToken", token);
        console.log("✅ JWT token stored in localStorage");
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
      console.log("✅ User info stored in localStorage:", userInfo);

      // Close modal and reload to update header
      if (onClose) {
        onClose();
      }
      window.location.reload();
    } catch (err) {
      if (isMountedRef.current) {
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
          <div className={styles.info}>Use Your OpenID to Sign up</div>
          <div className={styles.btns}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google login failed. Please try again.");
              }}

              theme="outline"
              size="large"
              width="310" // Approximate width to match button
              shape="pill"
            />
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
          <div className={styles.foot}>
            Already have an account?{" "}
            <button type="button" className={styles.link} onClick={onClose}>
              Login
            </button>
          </div>
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
            {error && <div className={styles.error}>{error}</div>}
            <button
              type="submit"
              className={cn("button", styles.button)}
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
          <div className={styles.foot}>
            <button
              type="button"
              className={styles.password}
              onClick={handleBackToPhone}
              disabled={loading}
            >
              Back to phone number
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
