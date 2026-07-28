import React from "react";
import cn from "classnames";
import styles from "./GuestDetailsForm.module.sass";
import dropdownStyles from "../Dropdown/Dropdown.module.sass";
import TextInput from "../TextInput";
import Dropdown from "../Dropdown";

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

    </div>
  );
};

export default GuestDetailsForm;
