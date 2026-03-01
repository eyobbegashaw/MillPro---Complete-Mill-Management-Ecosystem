import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const Toast = () => {
  const { toast } = useNotification();

  if (!toast) return null;

  const icons = {
    success: <FaCheckCircle />,
    error: <FaExclamationCircle />,
    warning: <FaInfoCircle />
  };

  return (
    <div className={`toast ${toast.type}`}>
      {icons[toast.type]}
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;