import React from "react";
import cn from "classnames";
import styles from "./GuestDetailsForm.module.sass";
import dropdownStyles from "../Dropdown/Dropdown.module.sass";
import TextInput from "../TextInput";
import Dropdown from "../Dropdown";
import Modal from "../Modal";

const GuestDetailsForm = ({ className, numberOfGuests, guestDetails, setGuestDetails, guestErrors = {} }) => {
  const handlePrimaryChange = (e) => {
    let { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      value = value.replace(/[^a-zA-Z\s]/g, "").substring(0, 50);
    }
    setGuestDetails({ ...guestDetails, [name]: value });
  };

  const handleGstChange = (e) => {
    const { name, value } = e.target;
    setGuestDetails({
      ...guestDetails,
      gstDetails: { ...guestDetails.gstDetails, [name]: value },
    });
  };

  const handleAdditionalGuestChange = (index, e) => {
    let { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      value = value.replace(/[^a-zA-Z\s]/g, "").substring(0, 50);
    }
    const updatedAdditional = [...(guestDetails.additionalGuests || [])];
    if (!updatedAdditional[index]) {
      updatedAdditional[index] = { title: "Mr", firstName: "", lastName: "" };
    }
    updatedAdditional[index] = { ...updatedAdditional[index], [name]: value };
    setGuestDetails({ ...guestDetails, additionalGuests: updatedAdditional });
  };

  const handleAddGuest = () => {
    const updatedAdditional = [...(guestDetails.additionalGuests || [])];
    updatedAdditional.push({ title: "Mr", firstName: "", lastName: "" });
    setGuestDetails({ ...guestDetails, additionalGuests: updatedAdditional });
  };

  const handleRemoveGuest = (index) => {
    const updatedAdditional = [...(guestDetails.additionalGuests || [])];
    updatedAdditional.splice(index, 1);
    setGuestDetails({ ...guestDetails, additionalGuests: updatedAdditional });
  };

  const additionalGuestsForm = (guestDetails.additionalGuests || []).map((ag, i) => (
    <div key={i} className={styles.additionalGuestGroup}>
      <div className={styles.subtitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Guest {i + 2} Details</span>
        <button
          type="button"
          onClick={() => handleRemoveGuest(i)}
          style={{ color: '#E02E2E', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
        >
          Remove
        </button>
      </div>
      <div className={styles.row}>
        <div className={styles.colTitle}>
          <div className={styles.label}>Title</div>
          <Dropdown
            className={cn(styles.dropdown, dropdownStyles.minimalArrow)}
            value={ag.title || "Mr"}
            setValue={(value) => handleAdditionalGuestChange(i, { target: { name: "title", value } })}
            options={["Mr", "Ms", "Mrs"]}
          />
        </div>
        <div className={styles.colField}>
          <TextInput
            id={`guest-field-ag-${i}-firstName`}
            label="First Name"
            name="firstName"
            value={ag.firstName}
            onChange={(e) => handleAdditionalGuestChange(i, e)}
            placeholder="First Name"
            error={guestErrors[`ag-${i}-firstName`]}
          />
        </div>
        <div className={styles.colField}>
          <TextInput
            id={`guest-field-ag-${i}-lastName`}
            label="Last Name"
            name="lastName"
            value={ag.lastName}
            onChange={(e) => handleAdditionalGuestChange(i, e)}
            placeholder="Last Name"
            error={guestErrors[`ag-${i}-lastName`]}
          />
        </div>
      </div>
    </div>
  ));

  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = React.useState(false);
  const [phoneToVerify, setPhoneToVerify] = React.useState("");
  
  const otpFocusTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (showOtpModal) {
      otpFocusTimeoutRef.current = setTimeout(() => {
        const firstInput = document.getElementById("reverify-otp-0");
        if (firstInput) firstInput.focus();
      }, 100);
    }
    return () => clearTimeout(otpFocusTimeoutRef.current);
  }, [showOtpModal]);

  const handleSendOtp = async () => {
    try {
      setIsVerifying(true);
      setOtpError("");
      const { sendReverifyPhoneOTP } = await import("../../utils/api");
      await sendReverifyPhoneOTP(guestDetails.mobileNumber, guestDetails.countryCode || "+91");
      setPhoneToVerify(guestDetails.mobileNumber);
      setShowOtpModal(true);
    } catch (error) {
      alert("Failed to send OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      setIsVerifying(true);
      setOtpError("");
      const { verifyReverifyPhoneOTP } = await import("../../utils/api");
      await verifyReverifyPhoneOTP(phoneToVerify, otpString, guestDetails.countryCode || "+91");
      setIsPhoneVerified(true);
      setShowOtpModal(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      setOtpError("Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`reverify-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reverify-otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  return (
    <div className={cn(className, styles.formWrapper)}>
      <div className={styles.sectionTitle}>Guest Details</div>

      <div className={styles.group}>
        <div className={styles.subtitle}>Primary Guest</div>
        <div className={styles.row}>
          <div className={styles.colTitle}>
            <div className={styles.label}>Title</div>
            <Dropdown
              className={cn(styles.dropdown, dropdownStyles.minimalArrow)}
              value={guestDetails.title || "Mr"}
              setValue={(value) => handlePrimaryChange({ target: { name: "title", value } })}
              options={["Mr", "Ms", "Mrs"]}
            />
          </div>
          <div className={styles.colField}>
            <TextInput
              id="guest-field-firstName"
              label="First Name *"
              name="firstName"
              value={guestDetails.firstName || ""}
              onChange={handlePrimaryChange}
              placeholder="First Name"
              error={guestErrors.firstName}
              required
            />
          </div>
          <div className={styles.colField}>
            <TextInput
              id="guest-field-lastName"
              label="Last Name *"
              name="lastName"
              value={guestDetails.lastName || ""}
              onChange={handlePrimaryChange}
              placeholder="Last Name"
              error={guestErrors.lastName}
              required
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.colFieldHalf}>
            <TextInput
              id="guest-field-email"
              label="Email Address *"
              name="email"
              type="email"
              value={guestDetails.email || ""}
              onChange={handlePrimaryChange}
              placeholder="Email Address"
              error={guestErrors.email}
              required
            />
          </div>
          <div className={styles.colFieldHalf} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={styles.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mobile Number *</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '48px',
                borderRadius: '12px',
                border: `2px solid ${guestErrors.mobileNumber ? '#FF4848' : '#E6E8EC'}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                background: 'transparent'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#B1B5C3'}
              onBlur={(e) => e.currentTarget.style.borderColor = guestErrors.mobileNumber ? '#FF4848' : '#E6E8EC'}
            >
              <div
                className={styles.mobileInputText}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '64px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '0 8px 0 14px',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                  borderRight: '1px solid #E6E8EC',
                  boxSizing: 'border-box'
                }}
              >
                {guestDetails.countryCode || "+91"}
              </div>
              <input
                id="guest-field-mobileNumber"
                name="mobileNumber"
                type="tel"
                value={guestDetails.mobileNumber || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                  setGuestDetails({ ...guestDetails, mobileNumber: val });
                  if (val !== phoneToVerify) setIsPhoneVerified(false);
                }}
                placeholder="Mobile Number"
                required
                className={styles.mobileInputText}
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '0 14px',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none'
                }}
              />
            </div>
            {guestErrors.mobileNumber && <div style={{ marginTop: '8px', fontSize: '12px', color: '#FF4848', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>{guestErrors.mobileNumber}</div>}
          </div>
        </div>
      </div>

      <div className={styles.group}>
        {additionalGuestsForm}

        {numberOfGuests > 1 && (guestDetails.additionalGuests || []).length < (numberOfGuests - 1) && (
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleAddGuest}
              style={{
                color: '#00A4C4',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>+</span> Add Additional Guest (Optional)
            </button>
          </div>
        )}
      </div>

      <Modal visible={showOtpModal} onClose={() => setShowOtpModal(false)}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Verify Mobile Number</h2>
          <p style={{ color: '#777E90', marginBottom: '24px' }}>
            Enter the 6-digit OTP sent to {guestDetails.countryCode} {phoneToVerify}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`reverify-otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  border: '2px solid #E6E8EC',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#00A4C4'}
                onBlur={(e) => e.target.style.borderColor = '#E6E8EC'}
              />
            ))}
          </div>
          {otpError && <div style={{ color: '#FF4848', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>{otpError}</div>}
          <button
            onClick={handleVerifyOtp}
            disabled={isVerifying}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '24px',
              background: '#00A4C4',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              opacity: isVerifying ? 0.7 : 1
            }}
          >
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default GuestDetailsForm;
