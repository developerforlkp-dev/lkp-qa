import React, { useState } from "react";
import cn from "classnames";
import styles from "./AccountSettings.module.sass";
import Icon from "../../components/Icon";
import Dropdown from "../../components/Dropdown";
import PersonalInfo from "./PersonalInfo";
import LoginAndSecurity from "./LoginAndSecurity";
import PaymentsMethod from "./PaymentsMethod";
import NotificationSetting from "./NotificationSetting";

const items = [
  {
    title: "Personal info",
    icon: "user",
  },
  {
    title: "Login and security",
    icon: "lock",
  },
  {
    title: "Payments",
    icon: "credit-card",
  },
  {
    title: "Notification",
    icon: "bell",
  },
];

const AccountSettings = () => {
  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <PersonalInfo />
      </div>
    </div>
  );
};

export default AccountSettings;
