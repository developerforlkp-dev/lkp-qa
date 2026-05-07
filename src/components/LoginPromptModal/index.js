import React from "react";
import Modal from "../Modal";
import Login from "../Login";

const LoginPromptModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} onClose={onClose}>
      <Login onClose={onClose} />
    </Modal>
  );
};

export default LoginPromptModal;
