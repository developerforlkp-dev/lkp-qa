import React, { useState } from "react";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./Dropdown.module.sass";
import Icon from "../Icon";

const Dropdown = ({ className, value, setValue, options, empty, searchable }) => {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleClick = (value) => {
    setValue(value);
    setVisible(false);
    setSearchQuery("");
  };

  const filteredOptions = searchable && searchQuery.trim() !== ""
    ? options.filter((x) => String(x).toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <OutsideClickHandler onOutsideClick={() => { setVisible(false); setSearchQuery(""); }}>
      <div
        className={cn(styles.dropdown, { [styles.empty]: empty }, className, {
          [styles.active]: visible,
        })}
      >
        <div className={styles.head} onClick={() => { setVisible(!visible); if (visible) setSearchQuery(""); }}>
          <div className={styles.selection}>
            {searchable && visible ? (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                placeholder={value || "Search..."}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  color: "inherit",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  padding: 0
                }}
              />
            ) : (
              value
            )}
          </div>
          <div className={styles.arrow}>
            <Icon name="arrow-bottom" size="10" />
          </div>
        </div>
        <div className={styles.body}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((x, index) => (
              <div
                className={cn(styles.option, {
                  [styles.selectioned]: x === value,
                })}
                onClick={() => handleClick(x)}
                key={index}
              >
                {x}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default Dropdown;
