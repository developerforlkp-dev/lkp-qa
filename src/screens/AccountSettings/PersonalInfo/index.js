import React, { useState, useEffect } from "react";
import cn from "classnames";
import styles from "./PersonalInfo.module.sass";
import { useHistory } from "react-router-dom";
import TextInput from "../../../components/TextInput";
import Icon from "../../../components/Icon";
import Loader from "../../../components/Loader";
import LoadingSkeleton from "../../../components/LoadingSkeleton";
import Dropdown from "../../../components/Dropdown";
import Modal from "../../../components/Modal";
import {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerAvatar,
  sendReverifyPhoneOTP,
  verifyReverifyPhoneOTP
} from "../../../utils/api";

const COUNTRY_CODE_OPTIONS = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+65", label: "Singapore (+65)" },
  { value: "+971", label: "UAE (+971)" }
];

const PersonalInfo = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [success, setSuccess] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  
  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [activeInput, setActiveInput] = useState(0);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    countryCode: "+91",
    isEmailVerified: false,
    isPhoneVerified: false,
    customerId: null,
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: ""
  });

  const countryCodeOptions = COUNTRY_CODE_OPTIONS.some(
    (option) => option.value === profile.countryCode
  )
    ? COUNTRY_CODE_OPTIONS
    : [{ value: profile.countryCode, label: `Current (${profile.countryCode})` }, ...COUNTRY_CODE_OPTIONS];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getCustomerProfile();
      if (data && data.customer) {
        const {
          firstName,
          lastName,
          email,
          phone,
          avatarUrl,
          countryCode,
          isEmailVerified,
          isPhoneVerified,
          customerId,
          instagram,
          facebook,
          linkedin,
          twitter
        } = data.customer;

        //console.log("✅ Profile loaded:", data.customer);
        setProfile({
          firstName: firstName || "",
          lastName: lastName || "",
          email: email || "",
          phone: phone || "",
          avatarUrl: avatarUrl || "",
          countryCode: countryCode || "+91",
          isEmailVerified: !!isEmailVerified,
          isPhoneVerified: !!isPhoneVerified,
          customerId: customerId || null,
          instagram: instagram || "",
          facebook: facebook || "",
          linkedin: linkedin || "",
          twitter: twitter || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const getPhoneLength = (code) => {
    switch (code) {
      case "+91": return 10;
      case "+1": return 10;
      case "+44": return 10;
      case "+61": return 9;
      case "+65": return 8;
      case "+971": return 9;
      default: return 15;
    }
  };

  const handlePhoneChange = (e) => {
    setPhoneError("");
    let val = e.target.value.replace(/\D/g, "");
    const maxLen = getPhoneLength(profile.countryCode);
    if (val.length > maxLen) {
      val = val.slice(0, maxLen);
    }
    setProfile(prev => ({ ...prev, phone: val, isPhoneVerified: false }));
  };

  const handleCountryCodeChange = (label) => {
    setPhoneError("");
    const option = countryCodeOptions.find(o => o.label === label);
    if (option) {
      setProfile(prev => ({ 
        ...prev, 
        countryCode: option.value,
        phone: prev.phone.slice(0, getPhoneLength(option.value)),
        isPhoneVerified: false
      }));
    }
  };

  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      setOtpError("");
      setPhoneError("");
      await sendReverifyPhoneOTP(profile.phone, profile.countryCode);
      setShowOtpModal(true);
      setOtp(["", "", "", "", "", ""]);
      setActiveInput(0);
    } catch (err) {
      setPhoneError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setOtpError("Please enter a 6-digit code.");
      return;
    }
    
    try {
      setVerifyingOtp(true);
      setOtpError("");
      await verifyReverifyPhoneOTP(profile.phone, otpValue, profile.countryCode);
      setProfile(prev => ({ ...prev, isPhoneVerified: true }));
      setShowOtpModal(false);
    } catch (err) {
      const defaultError = err?.response?.status === 400 ? "Invalid verification code." : "Failed to verify OTP.";
      setOtpError(err?.response?.data?.error || err?.response?.data?.message || defaultError);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasteValue = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pasteValue.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasteValue[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(index + pasteValue.length, 5);
      setActiveInput(nextIndex);
      const nextInput = document.getElementById(`otp-reverify-${nextIndex}`);
      if (nextInput) nextInput.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);
      if (value && index < 5) {
        setActiveInput(index + 1);
        const nextInput = document.getElementById(`otp-reverify-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setActiveInput(index - 1);
      const prevInput = document.getElementById(`otp-reverify-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveInput(index - 1);
      const prevInput = document.getElementById(`otp-reverify-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveInput(index + 1);
      const nextInput = document.getElementById(`otp-reverify-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (profile.phone && !profile.isPhoneVerified) {
      alert("Please verify your new phone number before saving.");
      return;
    }

    try {
      setUpdating(true);
      setAvatarSuccess(false);

      // Strictly only 6 fields as requested by the backend spec
      const requestBody = {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email && profile.email.trim() !== "" ? profile.email : null,
        phone: profile.phone || "",
        countryCode: profile.countryCode || "+91",
        avatarUrl: profile.avatarUrl && profile.avatarUrl.trim() !== "" ? profile.avatarUrl : null,
        instagram: profile.instagram || "",
        facebook: profile.facebook || "",
        linkedin: profile.linkedin || "",
        twitter: profile.twitter || ""
      };

      await updateCustomerProfile(requestBody);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      const fieldErrors = error?.response?.data?.fieldErrors;
      const firstFieldError = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : "";
      const errorMessage =
        firstFieldError ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile.";
      alert(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setAvatarSuccess(false);

      // Local preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      //console.log("⬆️ Uploading avatar file:", file.name);
      const result = await uploadCustomerAvatar(file, {
        hasExistingAvatar: Boolean(profile.avatarUrl && profile.avatarUrl.trim() !== ""),
      });
      //console.log("✅ Avatar upload result:", result);

      // Assuming result contains the new avatarUrl
      if (result && (result.avatarUrl || result.url)) {
        const newUrl = result.avatarUrl || result.url;
        setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
        setPreviewUrl(null); // Clear preview once we have the real URL
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      } else {
        // Fallback or re-fetch
        await fetchProfile();
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return <LoadingSkeleton variant="profile" />;
  }

  return (
    <form className={styles.section} onSubmit={handleSubmit}>
      <div className={styles.head}>
        <div style={{ fontSize: "12px", marginBottom: "8px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0097B2" }}>
          ACCOUNT SETTINGS
        </div>
        <div className={cn("h2", styles.title)} style={{ 
          fontFamily: '"Cormorant Garamond", "Playfair Display", serif',
          fontSize: "48px",
          lineHeight: "1.1",
          marginRight: 0
        }}>
          Personal <span style={{ fontStyle: "italic", color: "#0097B2" }}>info</span>
        </div>
      </div>

      <div className={cn(styles.card, styles.avatarSection)}>
        <div className={styles.avatar}>
          {previewUrl || (profile.avatarUrl && profile.avatarUrl.trim() !== "") ? (
            <img
              src={previewUrl || profile.avatarUrl}
              alt="Avatar"
              onLoad={() => {
                if (previewUrl || profile.avatarUrl) {
                  //console.log("🖼️ Avatar image rendered:", previewUrl || profile.avatarUrl);
                }
              }}
              onError={(e) => {
                console.warn("⚠️ Avatar failed to load, clearing URL to trigger initial fallback:", previewUrl || profile.avatarUrl);
                if (previewUrl) setPreviewUrl(null);
                setProfile(prev => ({ ...prev, avatarUrl: "" }));
              }}
            />
          ) : (
            <div className={styles.initialsAvatar}>
              {profile.firstName ? profile.firstName.charAt(0) : "U"}
            </div>
          )}
        </div>
        <div className={styles.avatarDetails}>
          <div className={styles.category} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '8px' }}>Profile picture</div>
          <div className={styles.note}>PNG, JPEG. Max 5MB.</div>
          <div className={styles.avatarAction}>
            <label className={cn("button-stroke button-small", styles.button)}>
              <span>{uploading ? "Uploading..." : "Upload new picture"}</span>
              <input
                type="file"
                className={styles.avatarInput}
                onChange={handleAvatarChange}
                accept="image/*"
              />
            </label>
          </div>
          {avatarSuccess && (
            <div className={styles.successMessage}>
              <Icon name="check-circle" size="20" />
              <span>Profile picture updated successfully!</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.list}>
        <div className={cn(styles.card, styles.item)}>
          <div className={styles.category}>Account info</div>
          <div className={styles.fieldset}>
            <div className={styles.row}>
              <div className={styles.col}>
                <TextInput
                  className={styles.field}
                  label="First Name"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  type="text"
                  placeholder="Your first name"
                  required
                />
              </div>
              <div className={styles.col}>
                <TextInput
                  className={styles.field}
                  label="Last Name"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  type="text"
                  placeholder="Your last name"
                  required
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.labelWrapper}>
                  <div className={styles.label}>Phone</div>
                  {profile.isPhoneVerified && (
                    <div className={styles.verifiedBadge}>
                      <Icon name="check-circle" size="14" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                <div className={styles.phoneRow}>
                  <div className={styles.countryCodeField} style={{ flexShrink: 0, minWidth: '160px' }}>
                    <Dropdown
                      className={styles.dropdown}
                      value={countryCodeOptions.find(o => o.value === profile.countryCode)?.label || countryCodeOptions[0].label}
                      setValue={handleCountryCodeChange}
                      options={countryCodeOptions.map(o => o.label)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <TextInput
                      className={cn(styles.field, styles.phoneField)}
                      name="phone"
                      value={profile.phone}
                      onChange={handlePhoneChange}
                      type="tel"
                      placeholder="Phone number"
                      required
                    />
                    {!profile.isPhoneVerified && (
                      <>
                        <button 
                          type="button" 
                          className={cn("button", "button-small")} 
                          onClick={handleSendOtp}
                          disabled={sendingOtp || !profile.phone || profile.phone.length < 6}
                          style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                        >
                          {sendingOtp ? "Sending OTP..." : "Verify Number"}
                        </button>
                        {phoneError && (
                          <div style={{ color: "#FF6161", fontSize: "14px", marginTop: "8px", fontWeight: "500" }}>
                            {phoneError}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.col}>
                <div className={styles.labelWrapper}>
                  <div className={styles.label}>Email</div>
                  {profile.isEmailVerified && (
                    <div className={styles.verifiedBadge}>
                      <Icon name="check-circle" size="14" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                <TextInput
                  className={styles.field}
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="Email"
                  disabled={profile.isEmailVerified}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={cn(styles.card, styles.item)}>
          <div className={styles.category}>Social links</div>
          <div className={styles.fieldset}>
            <div className={styles.row}>
              <div className={styles.col}>
                <TextInput
                  className={styles.field}
                  label="Instagram"
                  name="instagram"
                  value={profile.instagram}
                  onChange={handleChange}
                  type="text"
                  placeholder="Instagram profile link"
                />
              </div>
              <div className={styles.col}>
                <TextInput
                  className={styles.field}
                  label="Facebook"
                  name="facebook"
                  value={profile.facebook}
                  onChange={handleChange}
                  type="text"
                  placeholder="Facebook profile link"
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.col}>
                <TextInput
                  className={styles.field}
                  label="LinkedIn"
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleChange}
                  type="text"
                  placeholder="LinkedIn profile link"
                />
              </div>
              <div className={styles.col}>
                <TextInput
                  className={styles.field}
                  label="Twitter / X"
                  name="twitter"
                  value={profile.twitter}
                  onChange={handleChange}
                  type="text"
                  placeholder="Twitter / X profile link"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.btns}>
          <button
            type="submit"
            className={cn("button", styles.button)}
            disabled={updating || !profile.firstName || !profile.lastName || !profile.email || (Boolean(profile.phone) && !profile.isPhoneVerified)}
          >
            {updating ? "Saving..." : "Save changes"}
          </button>
          <button className={styles.clear} type="button" onClick={fetchProfile}>
            <Icon name="close" size="16" />
            Reset changes
          </button>
        </div>
        {success && (
          <div className={styles.successMessage}>
            <Icon name="check-circle" size="20" />
            <span>Profile updated successfully!</span>
          </div>
        )}
      </div>
      <Modal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
      >
        <div className={styles.otpModal}>
          <div className={styles.otpModalTitle}>
            Enter Verification <span>Code</span>
          </div>
          <div className={styles.otpModalText}>
            We sent a code to {profile.countryCode} {profile.phone}
          </div>
          <div className={styles.code}>
            {otp.map((digit, index) => (
              <div key={index} className={styles.number}>
                <input
                  id={`otp-reverify-${index}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onFocus={() => setActiveInput(index)}
                  disabled={verifyingOtp}
                  autoFocus={index === 0}
                  required
                />
              </div>
            ))}
          </div>
          {otpError && <div className={styles.otpError}>{otpError}</div>}
          <div className={styles.btns} style={{ marginTop: "32px", padding: 0 }}>
            <button
              type="button"
              className={cn("button")}
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otp.join("").length !== 6}
              style={{ width: "100%" }}
            >
              {verifyingOtp ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
};

export default PersonalInfo;
