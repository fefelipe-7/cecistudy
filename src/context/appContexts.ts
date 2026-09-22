import { createContext } from 'react';
import type { AppContextValue } from './AppContext';

export const AppBaseContext = createContext<AppContextValue | undefined>(undefined);
export const DataClientContext = createContext<AppContextValue | undefined>(undefined);
export const MobileAppContext = createContext<AppContextValue | undefined>(undefined);
