import { 
  AppData, 
  STORAGE_KEY, 
  DEFAULT_SETTINGS, 
  SUPPORTS_LOCAL_STORAGE,
  StorageSize,
  ProgressData
} from './types';

// Default app data structure
export const getDefaultAppData = (): AppData => ({
  tripName: '',
  tripDays: 1,
  selectedModules: [],
  packingData: {},
  customModules: {},
  tripHistory: [],
  settings: { ...DEFAULT_SETTINGS }
});

// Storage utilities
export const loadFromStorage = (): AppData => {
  try {
    if (!SUPPORTS_LOCAL_STORAGE) {
      console.warn('LocalStorage not supported');
      return getDefaultAppData();
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultAppData();
    }

    const data = JSON.parse(stored);
    
    // Merge with defaults to ensure all properties exist
    const mergedData: AppData = {
      ...getDefaultAppData(),
      ...data,
      settings: {
        ...DEFAULT_SETTINGS,
        ...data.settings
      }
    };

    console.log('Data loaded from storage');
    return mergedData;

  } catch (error) {
    console.error('Error loading data from storage:', error);
    return getDefaultAppData();
  }
};

export const saveToStorage = (data: AppData): boolean => {
  try {
    if (!SUPPORTS_LOCAL_STORAGE) {
      console.warn('LocalStorage not supported');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Data saved to storage');
    return true;

  } catch (error) {
    console.error('Error saving data to storage:', error);
    return false;
  }
};

export const clearStorage = (): boolean => {
  try {
    if (!SUPPORTS_LOCAL_STORAGE) {
      return false;
    }

    localStorage.removeItem(STORAGE_KEY);
    console.log('Storage cleared');
    return true;

  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

export const getStorageSize = (): StorageSize | null => {
  try {
    const data = loadFromStorage();
    const dataString = JSON.stringify(data);
    
    return {
      bytes: new Blob([dataString]).size,
      characters: dataString.length,
      items: {
        tripHistory: data.tripHistory.length,
        customModules: Object.keys(data.customModules).length,
        packingData: Object.keys(data.packingData).length
      }
    };
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return null;
  }
};

// Export/Import utilities
export const exportData = (data: AppData, filename?: string): void => {
  try {
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `packing-list-${data.tripName || 'trip'}-${Date.now()}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log('Data exported successfully');

  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
};

export const importData = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Invalid file content'));
          return;
        }

        const importedData = JSON.parse(result);
        
        if (validateImportData(importedData)) {
          const cleanData = cleanImportData(importedData);
          console.log('Data imported successfully');
          resolve(cleanData);
        } else {
          reject(new Error('Invalid file format'));
        }

      } catch (error) {
        console.error('Error parsing import data:', error);
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

const validateImportData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const requiredProps = ['tripName', 'selectedModules', 'packingData'];
  for (const prop of requiredProps) {
    if (!(prop in data)) return false;
  }
  
  if (typeof data.tripName !== 'string') return false;
  if (!Array.isArray(data.selectedModules)) return false;
  if (typeof data.packingData !== 'object') return false;
  
  return true;
};

const cleanImportData = (data: any): AppData => {
  const defaultData = getDefaultAppData();
  
  return {
    tripName: String(data.tripName || ''),
    tripDays: Number(data.tripDays) || 1,
    selectedModules: Array.isArray(data.selectedModules) ? [...data.selectedModules] : [],
    packingData: data.packingData ? { ...data.packingData } : {},
    customModules: data.customModules ? { ...data.customModules } : {},
    tripHistory: Array.isArray(data.tripHistory) ? [...data.tripHistory] : [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...(data.settings || {})
    }
  };
};

// Progress calculation utilities
export const calculateProgress = (data: AppData): ProgressData => {
  let totalItems = 0;
  let checkedItems = 0;
  
  data.selectedModules.forEach(moduleKey => {
    const items = data.packingData[moduleKey] || [];
    totalItems += items.length;
    checkedItems += items.filter(item => item.checked).length;
  });
  
  const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  
  return {
    totalItems,
    checkedItems,
    percentage
  };
};

// Module utilities
export const generateModuleKey = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20);
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Unknown date';
  }
};

// Validation utilities
export const validateTripName = (name: string): boolean => {
  return name.trim().length > 0;
};

export const validateTripDays = (days: number): boolean => {
  return days >= 1 && days <= 365;
};

export const validateModuleName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 50;
};

export const validateItemName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 100;
};

// Debounce utility for auto-save
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Platform detection utilities
export const isMobile = (): boolean => /Mobi|Android/i.test(navigator.userAgent);
export const isIOS = (): boolean => /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isAndroid = (): boolean => /Android/.test(navigator.userAgent);
export const supportsTouch = (): boolean => 'ontouchstart' in window;

// Error handling utilities
export const handleError = (error: Error, context: string): void => {
  console.error(`Error in ${context}:`, error);
  
  // In production, you might want to send errors to a logging service
  if (process.env.NODE_ENV === 'production') {
    // logErrorToService(error, context);
  }
};

// Local storage size warning
export const checkStorageQuota = (): boolean => {
  try {
    const test = 'storage-test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    console.warn('LocalStorage quota exceeded or unavailable');
    return false;
  }
};