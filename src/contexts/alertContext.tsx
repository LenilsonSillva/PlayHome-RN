import { AlertButtonProps, AlertsModal } from "@/components/Alert/AlertsModal";
import React, { createContext, useState, useContext } from "react";
// Ajuste o caminho de importação abaixo conforme o seu projeto:

interface AlertContextData {
  showAlert: (
    title: string,
    message: string,
    emoji?: string,
    buttons?: AlertButtonProps[]
  ) => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    emoji?: string;
    buttons?: AlertButtonProps[];
  }>({
    title: "",
    message: "",
    emoji: undefined,
    buttons: []
  });

  // Nossa nova super função imitando o Alert.alert nativo!
  const showAlert = (
    title: string,
    message: string,
    emoji?: string,
    buttons?: AlertButtonProps[]
  ) => {
    setAlertData({ title, message, emoji, buttons });
    setVisible(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertsModal
        visible={visible}
        title={alertData.title}
        message={alertData.message}
        emoji={alertData.emoji}
        buttons={alertData.buttons}
        onClose={() => setVisible(false)}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
