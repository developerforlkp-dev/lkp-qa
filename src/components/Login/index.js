import React, { useState, useEffect } from "react";
import cn from "classnames";
import { GoogleLogin } from '@react-oauth/google';
import styles from "./Login.module.sass";
import Icon from "../Icon";
import { sendPhoneOTP, verifyPhoneOTP, loginWithGoogle } from "../../utils/api";

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

  // Auto-focus first OTP input when OTP step is shown
  useEffect(() => {
    if (step === "otp") {
      const firstInput = document.getElementById(`otp-login-0`);
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
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

  // Handle Google login success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");

      console.log("🔵 Google OAuth credential received:", {
        credential: credentialResponse.credential ? `${credentialResponse.credential.substring(0, 20)}...` : "null",
        select_by: credentialResponse.select_by
      });

      const response = await loginWithGoogle(credentialResponse.credential);

      // Store JWT token from response
      const token = response?.token;
      if (token) {
        localStorage.setItem("jwtToken", token);
        console.log("✅ JWT token stored in localStorage");
      } else {
        console.warn("⚠️ No JWT token found in response:", response);
      }

      // Extract customer data from response
      const customer = response?.customer || {};

      // Store user info: firstName, lastName, email
      const userInfo = {
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        email: customer?.email || "",
        customerId: customer?.customerId,
        loginMethod: 'google'
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      console.log("✅ User info stored in localStorage:", userInfo);

      // Also store individual values for easy access
      if (customer?.firstName) {
        localStorage.setItem("firstName", customer.firstName);
      }
      if (customer?.lastName) {
        localStorage.setItem("lastName", customer.lastName);
      }
      if (customer?.email) {
        localStorage.setItem("email", customer.email);
      }

      // Close modal and reload to update header
      if (onClose) {
        onClose();
      }
      window.location.reload();
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || err.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login error
  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  // Send OTP when phone number is submitted
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber || phoneNumber.trim() === "") {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOTP(phoneNumber.trim(), countryCode);
      setStep("otp");
      setError("");
      setOtp(["", "", "", "", "", ""]);
      setActiveInput(0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP when OTP is submitted
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
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
      setError(err.response?.data?.message || err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
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
          <div className={cn("h3", styles.title)}>Sign up on Fleet</div>
          <div className={styles.info}>Use Your OpenID to Sign up</div>
          <div className={styles.btns}>
            <div className={styles.googleWrapper}>
              <button
                type="button"
                className={cn("button-black", styles.button, styles.googleButton)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  // Trigger the Google login by clicking the hidden button
                  const googleBtn = document.querySelector('[role="button"][aria-labelledby]');
                  if (googleBtn) googleBtn.click();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4" />
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853" />
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82999 3.96409 7.28999V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC04" />
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
                </svg>
                <span style={{ display: 'flex', gap: '0' }}>
                  <span style={{ color: '#4285F4' }}>G</span>
                  <span style={{ color: '#EA4335' }}>o</span>
                  <span style={{ color: '#FBBC04' }}>o</span>
                  <span style={{ color: '#4285F4' }}>g</span>
                  <span style={{ color: '#34A853' }}>l</span>
                  <span style={{ color: '#EA4335' }}>e</span>
                </span>
              </button>
            </div>
            <button type="button" className={cn("button-black", styles.button)}>
              <Icon name="apple" size="16" />
              <span>Apple</span>
            </button>
            {/* Hidden Google OAuth button */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="medium"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
                locale="en"
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
