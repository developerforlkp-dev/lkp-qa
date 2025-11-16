import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import cn from "classnames";
import styles from "./LoginModal.module.sass";
import Icon from "../Icon";
import { sendPhoneOTP, verifyPhoneOTP } from "../../utils/api";

const LoginModal = ({ visible, onClose, onGoogleLogin, onPhoneLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpStep, setOtpStep] = useState("phone"); // "phone" or "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState(null);
  const countryCode = "+91";

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setPhoneNumber("");
      setOtp("");
      setFirstName("");
      setLastName("");
      setOtpStep("phone");
      setError("");
      setLoading(false);
    }
  }, [visible]);

  // Render Google Sign-In button when modal is visible
  useEffect(() => {
    if (visible && window.google && window.google.accounts && window.google.accounts.id) {
      const buttonContainer = document.getElementById("google-signin-button");
      if (buttonContainer && !buttonContainer.hasChildNodes()) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
        });
      }
    }
  }, [visible]);

  const handleGoogleLogin = () => {
    if (onGoogleLogin) {
      onGoogleLogin();
    } else {
      // Fallback: redirect to Google OAuth
      window.location.href = "/auth/google";
    }
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
      setOtpStep("otp");
      setError("");
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
    
    if (!otp || otp.trim() === "") {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyPhoneOTP(
        phoneNumber.trim(),
        otp.trim(),
        countryCode,
        firstName.trim(),
        lastName.trim()
      );
      
      // Store JWT token if provided in response
      // Check multiple possible response structures
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
      
      // Call parent's onPhoneLogin callback if provided
      if (onPhoneLogin) {
        onPhoneLogin(phoneNumber, response);
      }
      
      // Close modal
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Go back to phone input
  const handleBackToPhone = () => {
    setOtpStep("phone");
    setOtp("");
    setError("");
  };

  if (!visible) return null;

  return createPortal(
    <div className={styles.modal}>
      <div className={styles.content}>
        <button className={styles.close} onClick={onClose}>
          <Icon name="close" size="24" />
        </button>
        
        <div className={styles.header}>
          <div className={styles.illustration}>
            <img src="/images/content/login-illustration.svg" alt="Login" />
          </div>
          <h2 className={styles.title}>LOGIN</h2>
          <p className={styles.subtitle}>
            Login with your phone number or Google account
          </p>
        </div>

        <div className={styles.loginOptions}>
          {/* Phone Number Login */}
          <div className={styles.optionBox}>
            {otpStep === "phone" ? (
              <>
                <h3 className={styles.optionTitle}>
                  Continue with your phone number
                </h3>
                <form onSubmit={handlePhoneSubmit} className={styles.phoneForm}>
                  <div className={styles.phoneInput}>
                    <div className={styles.countryCode}>
                      <img
                        src="/images/flags/in.svg"
                        alt="India"
                        className={styles.flag}
                      />
                      <span className={styles.code}>+91</span>
                      <span className={styles.phoneSeparator}>|</span>
                    </div>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  {error && <div className={styles.error}>{error}</div>}
                  <button 
                    type="submit" 
                    className={styles.continueBtn}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Continue"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3 className={styles.optionTitle}>
                  Enter OTP
                </h3>
                <p className={styles.otpInfo}>
                  We sent a verification code to +91 {phoneNumber}
                </p>
                <form onSubmit={handleOtpSubmit} className={styles.phoneForm}>
                  <div className={styles.otpInput}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className={styles.nameInputs}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="First Name (Optional)"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Last Name (Optional)"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {error && <div className={styles.error}>{error}</div>}
                  <div className={styles.otpActions}>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={handleBackToPhone}
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className={styles.continueBtn}
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Separator */}
          <div className={styles.separator}>
            <div className={styles.separatorLine}></div>
            <span className={styles.separatorText}>OR</span>
            <div className={styles.separatorLine}></div>
          </div>

          {/* Google Login */}
          <div className={styles.optionBox}>
            <h3 className={styles.optionTitle}>
              Continue with your Google account
            </h3>
            <button
              className={styles.googleBtn}
              onClick={handleGoogleLogin}
              type="button"
            >
              <div className={styles.googleAccount}>
                {selectedGoogleAccount ? (
                  <>
                    <div className={styles.googleInfo}>
                      <div className={styles.googleName}>
                        {selectedGoogleAccount.name}
                      </div>
                      <div className={styles.googleEmail}>
                        {selectedGoogleAccount.email}
                      </div>
                    </div>
                    <Icon name="arrow-bottom" size="16" className={styles.arrow} />
                  </>
                ) : (
                  <>
                    <div className={styles.googleInfo}>
                      <div className={styles.googleName}>Sign in with Google</div>
                    </div>
                  </>
                )}
                <img
                  src="/images/content/google-logo.svg"
                  alt="Google"
                  className={styles.googleLogo}
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </button>
            {/* Google Sign-In Button Container */}
            <div id="google-signin-button" className={styles.googleSignInContainer}></div>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.terms}>
            By continuing, you agree to our{" "}
            <a href="/terms" className={styles.link}>
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LoginModal;

