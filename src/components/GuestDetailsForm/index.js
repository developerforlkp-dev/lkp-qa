import React from "react";
import cn from "classnames";
import styles from "./GuestDetailsForm.module.sass";
import TextInput from "../TextInput";

const GuestDetailsForm = ({ className, numberOfGuests, guestDetails, setGuestDetails, guestErrors = {} }) => {
  const handlePrimaryChange = (e) => {
    const { name, value } = e.target;
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
    const { name, value } = e.target;
    const updatedAdditional = [...(guestDetails.additionalGuests || [])];
    if (!updatedAdditional[index]) {
      updatedAdditional[index] = { title: "Mr", firstName: "", lastName: "" };
    }
    updatedAdditional[index] = { ...updatedAdditional[index], [name]: value };
    setGuestDetails({ ...guestDetails, additionalGuests: updatedAdditional });
  };

  // Ensure additional guests array matches the number of extra guests
  const extraGuestsCount = Math.max(0, numberOfGuests - 1);
  const additionalGuestsForm = [];
  for (let i = 0; i < extraGuestsCount; i++) {
    const ag = guestDetails.additionalGuests?.[i] || { title: "Mr", firstName: "", lastName: "" };
    additionalGuestsForm.push(
      <div key={i} className={styles.additionalGuestGroup}>
        <div className={styles.subtitle}>Guest {i + 2} Details</div>
        <div className={styles.row}>
          <div className={styles.colTitle}>
            <div className={styles.label}>Title</div>
            <select
              className={styles.select}
              name="title"
              value={ag.title}
              onChange={(e) => handleAdditionalGuestChange(i, e)}
            >
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Mrs">Mrs</option>
            </select>
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
    );
  }

  return (
    <div className={cn(className, styles.formWrapper)}>
      <div className={styles.sectionTitle}>Guest Details</div>
      
      <div className={styles.group}>
        <div className={styles.subtitle}>Primary Guest</div>
        <div className={styles.row}>
          <div className={styles.colTitle}>
            <div className={styles.label}>Title</div>
            <select
              className={styles.select}
              name="title"
              value={guestDetails.title || "Mr"}
              onChange={handlePrimaryChange}
            >
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Mrs">Mrs</option>
            </select>
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
          <div className={styles.colCode}>
            <TextInput
              label="Code *"
              name="countryCode"
              value={guestDetails.countryCode || "+91"}
              onChange={handlePrimaryChange}
              placeholder="+91"
              required
            />
          </div>
          <div className={styles.colPhone}>
            <TextInput
              id="guest-field-mobileNumber"
              label="Mobile Number *"
              name="mobileNumber"
              type="tel"
              value={guestDetails.mobileNumber || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                setGuestDetails({ ...guestDetails, mobileNumber: val });
              }}
              placeholder="Mobile Number"
              error={guestErrors.mobileNumber}
              required
            />
          </div>
        </div>
      </div>

      {extraGuestsCount > 0 && (
        <div className={styles.group}>
          {additionalGuestsForm}
        </div>
      )}

      <div className={styles.group}>
        <div className={styles.subtitle}>GST Details (Optional)</div>
        <div className={styles.row}>
          <div className={styles.colFieldHalf}>
            <TextInput
              label="Company Name"
              name="companyName"
              value={guestDetails.gstDetails?.companyName || ""}
              onChange={handleGstChange}
              placeholder="Company Name"
            />
          </div>
          <div className={styles.colFieldHalf}>
            <TextInput
              label="GST Number"
              name="gstNumber"
              value={guestDetails.gstDetails?.gstNumber || ""}
              onChange={handleGstChange}
              placeholder="GST Number"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsForm;
