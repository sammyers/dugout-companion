import { createContext, useContext } from 'react';

export const networkStatusContext = createContext(false);
export const useNetworkStatus = () => useContext(networkStatusContext);
