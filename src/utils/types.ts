// Core Types for Smart Packing App

export interface PackingItem {
  name: string;
  checked: boolean;
  custom: boolean;
}

export interface PackingModule {
  name: string;
  icon: string;
  items: string[];
}

export interface PackingData {
  [moduleKey: string]: PackingItem[];
}

export interface TripData {
  tripName: string;
  tripDays: number;
  selectedModules: string[];
  packingData: PackingData;
  date: string;
}

export interface AppSettings {
  autosave: boolean;
  suggestions: boolean;
  compact: boolean;
  notifications: boolean;
  darkMode: boolean;
}

export interface AppData {
  tripName: string;
  tripDays: number;
  selectedModules: string[];
  packingData: PackingData;
  customModules: { [key: string]: PackingModule };
  tripHistory: TripData[];
  settings: AppSettings;
}

export interface IconOption {
  value: string;
  label: string;
}

export interface ModuleStats {
  total: number;
  default: number;
  custom: number;
  totalItems: number;
}

export interface StorageSize {
  bytes: number;
  characters: number;
  items: {
    tripHistory: number;
    customModules: number;
    packingData: number;
  };
}

export interface ProgressData {
  totalItems: number;
  checkedItems: number;
  percentage: number;
}

// Tab types
export type TabType = 'setup' | 'packing' | 'modules' | 'history' | 'settings';

// Event handler types
export type ToggleHandler = (moduleKey: string) => void;
export type ItemHandler = (moduleKey: string, itemIndex: number) => void;
export type AddItemHandler = (moduleKey: string, itemName: string) => void;
export type EditItemHandler = (moduleKey: string, itemIndex: number, newName: string) => void;
export type DeleteItemHandler = (moduleKey: string, itemIndex: number) => void;

// Module management types
export type CreateModuleHandler = (name: string, icon: string) => void;
export type DeleteModuleHandler = (moduleKey: string) => void;
export type ModuleItemHandler = (moduleKey: string, itemName: string) => void;

// Trip history types
export type DuplicateTripHandler = (tripIndex: number) => void;
export type DeleteTripHandler = (tripIndex: number) => void;
export type ViewTripHandler = (tripIndex: number) => void;

// Settings types
export type SettingUpdateHandler = (setting: keyof AppSettings, value: boolean) => void;

// Storage types
export type ExportHandler = () => void;
export type ImportHandler = (file: File) => void;
export type ClearDataHandler = () => void;

// Constants
export const STORAGE_KEY = 'smartPackingApp';
export const MAX_TRIP_HISTORY = 50;
export const APP_VERSION = '1.0.0';

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  autosave: true,
  suggestions: true,
  compact: false,
  notifications: true,
  darkMode: false
};

// Animation durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SECTION_EXPAND: 300,
  TAB_SWITCH: 200,
  PROGRESS_UPDATE: 300
} as const;

// Platform detection
export const IS_MOBILE = /Mobi|Android/i.test(navigator.userAgent);
export const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
export const IS_ANDROID = /Android/.test(navigator.userAgent);
export const SUPPORTS_TOUCH = 'ontouchstart' in window;
export const SUPPORTS_LOCAL_STORAGE = typeof Storage !== 'undefined';