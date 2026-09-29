import { createContext, useContext, useState } from 'react';

const GateContext = createContext();

export const useGate = () => {
  const context = useContext(GateContext);
  if (!context) {
    throw new Error('useGate must be used within a GateProvider');
  }
  return context;
};

export const GateProvider = ({ children }) => {
  const [gateStatus, setGateStatus] = useState('closed'); // 'closed', 'opening', 'open', 'closing'
  const [loading, setLoading] = useState(false);
  const [cameraImage, setCameraImage] = useState(null);

  const updateGateStatus = (status) => {
    setGateStatus(status);
  };

  const setLoadingState = (isLoading) => {
    setLoading(isLoading);
  };

  const setCameraImg = (image) => {
    setCameraImage(image);
  };

  return (
    <GateContext.Provider
      value={{
        gateStatus,
        loading,
        cameraImage,
        updateGateStatus,
        setLoadingState,
        setCameraImg,
      }}
    >
      {children}
    </GateContext.Provider>
  );
};
