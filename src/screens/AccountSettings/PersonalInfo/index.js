import React, { useState, useEffect } from "react";
import cn from "classnames";
import styles from "./PersonalInfo.module.sass";
import { useHistory } from "react-router-dom";
import TextInput from "../../../components/TextInput";
import Icon from "../../../components/Icon";
import Loader from "../../../components/Loader";
import { 
  getCustomerProfile, 
  updateCustomerProfile, 
  uploadCustomerAvatar 
} from "../../../utils/api";

const PersonalInfo = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    countryCode: "+91",
    isEmailVerified: false,
    isPhoneVerified: false,
    customerId: null
  });

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
          customerId 
        } = data.customer;
        
        console.log("✅ Profile loaded:", data.customer);
        setProfile({
          firstName: firstName || "",
          lastName: lastName || "",
          email: email || "",
          phone: phone || "",
          avatarUrl: avatarUrl || "",
          countryCode: countryCode || "+91",
          isEmailVerified: !!isEmailVerified,
          isPhoneVerified: !!isPhoneVerified,
          customerId: customerId || null
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      
      // Strictly only 6 fields as requested by the backend spec
      const requestBody = {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email && profile.email.trim() !== "" ? profile.email : null,
        phone: profile.phone || "",
        countryCode: profile.countryCode || "+91",
        avatarUrl: profile.avatarUrl && profile.avatarUrl.trim() !== "" ? profile.avatarUrl : null
      };

      await updateCustomerProfile(requestBody);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Local preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      
      console.log("⬆️ Uploading avatar file:", file.name);
      const result = await uploadCustomerAvatar(file);
      console.log("✅ Avatar upload result:", result);
      
      // Assuming result contains the new avatarUrl
      if (result && (result.avatarUrl || result.url)) {
        const newUrl = result.avatarUrl || result.url;
        setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
        setPreviewUrl(null); // Clear preview once we have the real URL
      } else {
        // Fallback or re-fetch
        fetchProfile();
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    history.push("/");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <Loader />
      </div>
    );
  }

  return (
    <form className={styles.section} onSubmit={handleSubmit}>
      <div className={styles.head}>
        <div className={cn("h2", styles.title)}>Personal info</div>
        <button
          type="button"
          className={cn("button-stroke button-small", styles.button)}
          onClick={handleLogout}
        >
          <Icon name="close-circle" size="16" />
          <span>Logout</span>
        </button>
      </div>

      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          {previewUrl || (profile.avatarUrl && profile.avatarUrl.trim() !== "") ? (
            <img 
              src={previewUrl || profile.avatarUrl} 
              alt="Avatar" 
              onLoad={() => {
                if (previewUrl || profile.avatarUrl) {
                  console.log("🖼️ Avatar image rendered:", previewUrl || profile.avatarUrl);
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
          <div className={styles.category}>Profile picture</div>
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
        </div>
      </div>

      <div className={styles.list}>
        <div className={styles.item}>
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
                <TextInput
                  className={styles.field}
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="Phone number"
                  required
                />
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.btns}>
          <button className={cn("button", styles.button)} type="submit" disabled={updating}>
            {updating ? "Updating..." : "Update profile"}
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
    </form>
  );
};

export default PersonalInfo;
