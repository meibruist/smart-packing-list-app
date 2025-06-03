import { PackingModule, IconOption, ModuleStats } from '../utils/types';

// Default packing modules
export const DEFAULT_MODULES: { [key: string]: PackingModule } = {
  essentials: {
    name: 'Essentials',
    icon: 'fas fa-star',
    items: [
      'Passport/ID',
      'Wallet/Credit cards',
      'Phone charger',
      'Medications',
      'Travel insurance docs'
    ]
  },
  electronics: {
    name: 'Electronics',
    icon: 'fas fa-laptop',
    items: [
      'Phone charger',
      'Power bank',
      'Headphones',
      'Laptop/tablet',
      'Camera',
      'Universal adapter'
    ]
  },
  toiletries: {
    name: 'Toiletries',
    icon: 'fas fa-soap',
    items: [
      'Toothbrush & toothpaste',
      'Shampoo & conditioner',
      'Deodorant',
      'Sunscreen',
      'Contact lenses/glasses',
      'Personal hygiene items'
    ]
  },
  clothing: {
    name: 'Clothing',
    icon: 'fas fa-tshirt',
    items: [
      'Underwear',
      'Socks',
      'T-shirts/tops',
      'Pants/shorts',
      'Jacket/sweater',
      'Comfortable shoes'
    ]
  },
  sports: {
    name: 'Sports & Recreation',
    icon: 'fas fa-running',
    items: [
      'Athletic shoes',
      'Workout clothes',
      'Water bottle',
      'Frisbee',
      'Sunglasses',
      'Sports equipment'
    ]
  },
  camping: {
    name: 'Camping',
    icon: 'fas fa-campground',
    items: [
      'Tent',
      'Sleeping bag',
      'Camping pillow',
      'Flashlight/headlamp',
      'First aid kit',
      'Multi-tool',
      'Camping stove',
      'Insect repellent'
    ]
  },
  beach: {
    name: 'Beach',
    icon: 'fas fa-umbrella-beach',
    items: [
      'Swimsuit',
      'Beach towel',
      'Sunscreen (high SPF)',
      'Sunglasses',
      'Hat/cap',
      'Flip-flops',
      'Beach bag',
      'Waterproof phone case'
    ]
  },
  business: {
    name: 'Business',
    icon: 'fas fa-briefcase',
    items: [
      'Business cards',
      'Laptop & charger',
      'Professional attire',
      'Dress shoes',
      'Portfolio/notebook',
      'Presentation materials'
    ]
  },
  wedding: {
    name: 'Wedding/Formal',
    icon: 'fas fa-ring',
    items: [
      'Formal attire',
      'Dress shoes',
      'Accessories (jewelry, etc.)',
      'Gift',
      'Camera',
      'Backup outfit'
    ]
  },
  winter: {
    name: 'Winter Sports',
    icon: 'fas fa-snowflake',
    items: [
      'Winter jacket',
      'Thermal underwear',
      'Gloves/mittens',
      'Winter hat',
      'Snow boots',
      'Ski goggles',
      'Hand warmers'
    ]
  }
};

// Available icons for custom modules
export const AVAILABLE_ICONS: IconOption[] = [
  { value: 'fas fa-star', label: '⭐ Star' },
  { value: 'fas fa-mountain', label: '🏔️ Mountain' },
  { value: 'fas fa-camera', label: '📷 Camera' },
  { value: 'fas fa-music', label: '🎵 Music' },
  { value: 'fas fa-gamepad', label: '🎮 Gaming' },
  { value: 'fas fa-book', label: '📚 Book' },
  { value: 'fas fa-utensils', label: '🍴 Food' },
  { value: 'fas fa-car', label: '🚗 Travel' },
  { value: 'fas fa-home', label: '🏠 Home' },
  { value: 'fas fa-gift', label: '🎁 Gift' },
  { value: 'fas fa-heart', label: '❤️ Heart' },
  { value: 'fas fa-plane', label: '✈️ Plane' },
  { value: 'fas fa-map', label: '🗺️ Map' },
  { value: 'fas fa-compass', label: '🧭 Compass' },
  { value: 'fas fa-binoculars', label: '🔭 Binoculars' },
  { value: 'fas fa-bicycle', label: '🚲 Bicycle' },
  { value: 'fas fa-swimming-pool', label: '🏊 Swimming' },
  { value: 'fas fa-dumbbell', label: '🏋️ Fitness' },
  { value: 'fas fa-paint-brush', label: '🎨 Art' },
  { value: 'fas fa-microphone', label: '🎤 Microphone' }
];

// Module management functions
export class ModuleManager {
  /**
   * Get all available modules (default + custom)
   */
  static getAll(customModules: { [key: string]: PackingModule } = {}): { [key: string]: PackingModule } {
    return { ...DEFAULT_MODULES, ...customModules };
  }

  /**
   * Get a specific module by key
   */
  static get(moduleKey: string, customModules: { [key: string]: PackingModule } = {}): PackingModule | null {
    const allModules = this.getAll(customModules);
    return allModules[moduleKey] || null;
  }

  /**
   * Check if a module exists
   */
  static exists(moduleKey: string, customModules: { [key: string]: PackingModule } = {}): boolean {
    return !!this.get(moduleKey, customModules);
  }

  /**
   * Check if a module is custom (not default)
   */
  static isCustom(moduleKey: string): boolean {
    return !DEFAULT_MODULES.hasOwnProperty(moduleKey);
  }

  /**
   * Create a new custom module
   */
  static create(name: string, icon: string, items: string[] = []): { key: string; module: PackingModule } {
    if (!name?.trim()) {
      throw new Error('Module name is required');
    }

    const key = this.generateKey(name);
    
    const module: PackingModule = {
      name: name.trim(),
      icon: icon || 'fas fa-star',
      items: [...items]
    };

    return { key, module };
  }

  /**
   * Generate a unique key from module name
   */
  static generateKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 20);
  }

  /**
   * Validate module data structure
   */
  static validate(moduleData: any): boolean {
    if (!moduleData || typeof moduleData !== 'object') {
      return false;
    }

    const required = ['name', 'icon', 'items'];
    for (const prop of required) {
      if (!(prop in moduleData)) {
        return false;
      }
    }

    if (typeof moduleData.name !== 'string' || !moduleData.name.trim()) {
      return false;
    }

    if (typeof moduleData.icon !== 'string') {
      return false;
    }

    if (!Array.isArray(moduleData.items)) {
      return false;
    }

    return true;
  }

  /**
   * Get module statistics
   */
  static getStats(customModules: { [key: string]: PackingModule } = {}): ModuleStats {
    const allModules = this.getAll(customModules);
    const defaultCount = Object.keys(DEFAULT_MODULES).length;
    const customCount = Object.keys(customModules).length;
    const totalItems = Object.values(allModules).reduce(
      (sum, module) => sum + module.items.length, 
      0
    );

    return {
      total: defaultCount + customCount,
      default: defaultCount,
      custom: customCount,
      totalItems
    };
  }

  /**
   * Add item to module
   */
  static addItem(
    moduleKey: string, 
    itemName: string, 
    customModules: { [key: string]: PackingModule }
  ): { isNewCustom: boolean; module: PackingModule } {
    if (!itemName?.trim()) {
      throw new Error('Item name is required');
    }

    const module = this.get(moduleKey, customModules);
    if (!module) {
      throw new Error('Module not found');
    }

    const updatedItems = [...module.items, itemName.trim()];
    const updatedModule = { ...module, items: updatedItems };

    return {
      isNewCustom: !this.isCustom(moduleKey),
      module: updatedModule
    };
  }

  /**
   * Remove item from module
   */
  static removeItem(
    moduleKey: string, 
    itemIndex: number, 
    customModules: { [key: string]: PackingModule }
  ): { isNewCustom: boolean; module: PackingModule } {
    const module = this.get(moduleKey, customModules);
    if (!module) {
      throw new Error('Module not found');
    }

    if (itemIndex < 0 || itemIndex >= module.items.length) {
      throw new Error('Invalid item index');
    }

    const updatedItems = [...module.items];
    updatedItems.splice(itemIndex, 1);
    const updatedModule = { ...module, items: updatedItems };

    return {
      isNewCustom: !this.isCustom(moduleKey),
      module: updatedModule
    };
  }

  /**
   * Update item in module
   */
  static updateItem(
    moduleKey: string, 
    itemIndex: number, 
    newName: string, 
    customModules: { [key: string]: PackingModule }
  ): { isNewCustom: boolean; module: PackingModule } {
    if (!newName?.trim()) {
      throw new Error('Item name is required');
    }

    const module = this.get(moduleKey, customModules);
    if (!module) {
      throw new Error('Module not found');
    }

    if (itemIndex < 0 || itemIndex >= module.items.length) {
      throw new Error('Invalid item index');
    }

    const updatedItems = [...module.items];
    updatedItems[itemIndex] = newName.trim();
    const updatedModule = { ...module, items: updatedItems };

    return {
      isNewCustom: !this.isCustom(moduleKey),
      module: updatedModule
    };
  }
}

// Trip suggestions based on modules
export const getTripSuggestions = (selectedModules: string[]): string[] => {
  const suggestions: string[] = [];

  // Analyze selected modules and provide suggestions
  if (selectedModules.includes('beach') && !selectedModules.includes('sports')) {
    suggestions.push('Consider adding Sports & Recreation for beach activities');
  }

  if (selectedModules.includes('camping') && !selectedModules.includes('winter')) {
    suggestions.push('Check if you need Winter Sports gear for cold weather camping');
  }

  if (selectedModules.includes('business') && !selectedModules.includes('electronics')) {
    suggestions.push('Electronics module recommended for business trips');
  }

  if (selectedModules.includes('wedding') && !selectedModules.includes('electronics')) {
    suggestions.push('Don\'t forget camera/electronics for capturing memories');
  }

  if (selectedModules.length > 0 && !selectedModules.includes('essentials')) {
    suggestions.push('Always include Essentials module for important documents');
  }

  return suggestions;
};

// Smart packing recommendations based on trip duration
export const getDurationRecommendations = (days: number, selectedModules: string[]): string[] => {
  const recommendations: string[] = [];

  if (days > 7 && selectedModules.includes('clothing')) {
    recommendations.push('For trips over a week, consider packing layers and versatile pieces');
  }

  if (days > 14) {
    recommendations.push('Long trip: Pack laundry essentials and comfortable shoes');
  }

  if (days <= 3 && selectedModules.length > 5) {
    recommendations.push('Short trip: You might be overpacking. Focus on essentials');
  }

  return recommendations;
};

// Weather-based suggestions (could be enhanced with API integration)
export const getWeatherSuggestions = (destination: string): string[] => {
  // This is a simple implementation. In a real app, you'd integrate with a weather API
  const suggestions: string[] = [];
  
  // Basic suggestions based on common knowledge
  if (destination.toLowerCase().includes('beach') || destination.toLowerCase().includes('tropical')) {
    suggestions.push('Pack sun protection: sunscreen, hat, sunglasses');
    suggestions.push('Light, breathable clothing recommended');
  }

  if (destination.toLowerCase().includes('mountain') || destination.toLowerCase().includes('ski')) {
    suggestions.push('Layer clothing for changing mountain weather');
    suggestions.push('Don\'t forget warm accessories: gloves, hat, thermal wear');
  }

  return suggestions;
};