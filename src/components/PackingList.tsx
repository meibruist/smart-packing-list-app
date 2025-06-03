import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppData,
  TabType,
  PackingItem,
  TripData,
  ProgressData,
  AppSettings
} from '../utils/types';
import {
  loadFromStorage,
  saveToStorage,
  exportData,
  importData,
  clearStorage,
  calculateProgress,
  generateModuleKey,
  formatDate,
  validateTripName,
  validateModuleName,
  debounce,
  deepClone
} from '../utils/helpers';
import { ModuleManager, AVAILABLE_ICONS, getTripSuggestions } from '../modules/suggestions';

const PackingList: React.FC = () => {
  // State management
  const [appData, setAppData] = useState<AppData>(loadFromStorage());
  const [activeTab, setActiveTab] = useState<TabType>('setup');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showCreateModuleForm, setShowCreateModuleForm] = useState(false);
  const [addItemForms, setAddItemForms] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressData>({ totalItems: 0, checkedItems: 0, percentage: 0 });

  // Refs for form inputs
  const tripNameRef = useRef<HTMLInputElement>(null);
  const tripDaysRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newModuleNameRef = useRef<HTMLInputElement>(null);
  const newModuleIconRef = useRef<HTMLSelectElement>(null);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: AppData) => {
      if (data.settings.autosave) {
        saveToStorage(data);
      }
    }, 500),
    []
  );

  // Auto-save effect
  useEffect(() => {
    debouncedSave(appData);
  }, [appData, debouncedSave]);

  // Progress calculation effect
  useEffect(() => {
    setProgress(calculateProgress(appData));
  }, [appData.selectedModules, appData.packingData]);

  // Initialize expanded sections
  useEffect(() => {
    setExpandedSections(new Set(appData.selectedModules));
  }, [appData.selectedModules]);

  // Hide loading screen when component mounts
  useEffect(() => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }, []);

  // Trip management functions
  const updateTripName = useCallback((name: string) => {
    setAppData(prev => ({ ...prev, tripName: name }));
  }, []);

  const updateTripDays = useCallback((days: number) => {
    const validDays = Math.max(1, Math.min(365, days));
    setAppData(prev => ({ ...prev, tripDays: validDays }));
  }, []);

  // Module management functions
  const toggleModule = useCallback((moduleKey: string) => {
    setAppData(prev => {
      const newData = { ...prev };
      const index = newData.selectedModules.indexOf(moduleKey);

      if (index === -1) {
        // Add module
        newData.selectedModules = [...newData.selectedModules, moduleKey];
        
        // Initialize packing data if not exists
        if (!newData.packingData[moduleKey]) {
          const module = ModuleManager.get(moduleKey, newData.customModules);
          if (module) {
            newData.packingData[moduleKey] = module.items.map(item => ({
              name: item,
              checked: false,
              custom: false
            }));
          }
        }
      } else {
        // Remove module
        newData.selectedModules = newData.selectedModules.filter(key => key !== moduleKey);
      }

      return newData;
    });
  }, []);

  const createCustomModule = useCallback((name: string, icon: string) => {
    if (!validateModuleName(name)) {
      alert('Please enter a valid module name');
      return;
    }

    try {
      const result = ModuleManager.create(name, icon);
      setAppData(prev => ({
        ...prev,
        customModules: {
          ...prev.customModules,
          [result.key]: result.module
        }
      }));
      setShowCreateModuleForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create module');
    }
  }, []);

  const deleteCustomModule = useCallback((moduleKey: string) => {
    const module = appData.customModules[moduleKey];
    if (!module) return;

    if (window.confirm(`Are you sure you want to delete the "${module.name}" module?`)) {
      setAppData(prev => {
        const newData = { ...prev };
        
        // Remove custom module
        delete newData.customModules[moduleKey];
        
        // Remove from selected modules
        newData.selectedModules = newData.selectedModules.filter(key => key !== moduleKey);
        
        // Remove packing data
        delete newData.packingData[moduleKey];
        
        return newData;
      });
    }
  }, [appData.customModules]);

  // Item management functions
  const toggleItem = useCallback((moduleKey: string, itemIndex: number) => {
    setAppData(prev => {
      const newData = { ...prev };
      if (newData.packingData[moduleKey]?.[itemIndex]) {
        newData.packingData[moduleKey][itemIndex].checked = 
          !newData.packingData[moduleKey][itemIndex].checked;
      }
      return newData;
    });
  }, []);

  const addCustomItem = useCallback((moduleKey: string, itemName: string) => {
    if (!itemName.trim()) return;

    setAppData(prev => {
      const newData = { ...prev };
      if (!newData.packingData[moduleKey]) {
        newData.packingData[moduleKey] = [];
      }
      
      newData.packingData[moduleKey].push({
        name: itemName.trim(),
        checked: false,
        custom: true
      });
      
      return newData;
    });

    setAddItemForms(prev => {
      const newSet = new Set(prev);
      newSet.delete(moduleKey);
      return newSet;
    });
  }, []);

  const editItem = useCallback((moduleKey: string, itemIndex: number, newName: string) => {
    if (!newName.trim()) return;

    setAppData(prev => {
      const newData = { ...prev };
      if (newData.packingData[moduleKey]?.[itemIndex]) {
        newData.packingData[moduleKey][itemIndex].name = newName.trim();
      }
      return newData;
    });
  }, []);

  const deleteItem = useCallback((moduleKey: string, itemIndex: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setAppData(prev => {
        const newData = { ...prev };
        if (newData.packingData[moduleKey]) {
          newData.packingData[moduleKey].splice(itemIndex, 1);
        }
        return newData;
      });
    }
  }, []);

  // Trip history functions
  const saveCurrentTrip = useCallback(() => {
    if (!validateTripName(appData.tripName)) {
      alert('Please enter a trip name first');
      return;
    }

    const tripData: TripData = {
      tripName: appData.tripName,
      tripDays: appData.tripDays,
      selectedModules: [...appData.selectedModules],
      packingData: deepClone(appData.packingData),
      date: new Date().toISOString()
    };

    setAppData(prev => {
      const newHistory = [tripData, ...prev.tripHistory];
      // Keep only last 50 trips
      if (newHistory.length > 50) {
        newHistory.splice(50);
      }

      return {
        ...prev,
        tripHistory: newHistory
      };
    });

    alert('Trip saved to history!');
  }, [appData.tripName, appData.tripDays, appData.selectedModules, appData.packingData]);

  const duplicateTrip = useCallback((tripIndex: number) => {
    const trip = appData.tripHistory[tripIndex];
    if (!trip) return;

    if (window.confirm(`Duplicate "${trip.tripName}"? This will replace your current trip.`)) {
      const duplicatedData = {
        tripName: `${trip.tripName} (Copy)`,
        tripDays: trip.tripDays,
        selectedModules: [...trip.selectedModules],
        packingData: deepClone(trip.packingData)
      };

      // Reset all items to unchecked
      Object.values(duplicatedData.packingData).forEach(items => {
        items.forEach(item => item.checked = false);
      });

      setAppData(prev => ({
        ...prev,
        ...duplicatedData
      }));

      setActiveTab('setup');
      alert('Trip duplicated! Check the Setup tab.');
    }
  }, [appData.tripHistory]);

  const deleteTripFromHistory = useCallback((tripIndex: number) => {
    const trip = appData.tripHistory[tripIndex];
    if (!trip) return;

    if (window.confirm(`Delete "${trip.tripName}" from history?`)) {
      setAppData(prev => ({
        ...prev,
        tripHistory: prev.tripHistory.filter((_, index) => index !== tripIndex)
      }));
    }
  }, [appData.tripHistory]);

  // Settings functions
  const updateSetting = useCallback((setting: keyof AppSettings, value: boolean) => {
    setAppData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  }, []);

  // Data management functions
  const handleExport = useCallback(() => {
    try {
      exportData(appData);
    } catch (error) {
      alert('Failed to export data. Please try again.');
    }
  }, [appData]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importData(file)
      .then(importedData => {
        if (window.confirm('This will replace all current data. Continue?')) {
          setAppData(importedData);
          window.location.reload();
        }
      })
      .catch(error => {
        alert('Invalid file format. Please select a valid JSON file.');
      });

    // Reset file input
    event.target.value = '';
  }, []);

  const handleClearData = useCallback(() => {
    if (window.confirm('Are you sure? This will permanently delete all your packing lists and settings.')) {
      clearStorage();
      window.location.reload();
    }
  }, []);

  // UI helper functions
  const toggleSection = useCallback((moduleKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey);
      } else {
        newSet.add(moduleKey);
      }
      return newSet;
    });
  }, []);

  const showAddItemForm = useCallback((moduleKey: string) => {
    setAddItemForms(prev => new Set(prev).add(moduleKey));
  }, []);

  const hideAddItemForm = useCallback((moduleKey: string) => {
    setAddItemForms(prev => {
      const newSet = new Set(prev);
      newSet.delete(moduleKey);
      return newSet;
    });
  }, []);

  // Render functions
  const renderModuleCard = (moduleKey: string, module: any, isSelected: boolean) => (
    <div
      key={moduleKey}
      className={`module-card ${isSelected ? 'selected' : ''}`}
      onClick={() => toggleModule(moduleKey)}
    >
      <div className="module-icon">
        <i className={module.icon}></i>
      </div>
      <div className="module-name">{module.name}</div>
    </div>
  );

  const renderPackingItem = (moduleKey: string, item: PackingItem, index: number) => (
    <li key={index} className="packing-item">
      <div
        className={`item-checkbox ${item.checked ? 'checked' : ''}`}
        onClick={() => toggleItem(moduleKey, index)}
      >
        <i className={`fas ${item.checked ? 'fa-check-circle' : 'fa-circle'}`}></i>
      </div>
      <span className={`item-text ${item.checked ? 'checked' : ''}`}>
        {item.name}
      </span>
      <div className="item-actions">
        <button
          className="action-btn edit-btn"
          onClick={() => {
            const newName = prompt('Edit item name:', item.name);
            if (newName?.trim()) {
              editItem(moduleKey, index, newName.trim());
            }
          }}
        >
          <i className="fas fa-edit"></i>
        </button>
        {item.custom && (
          <button
            className="action-btn delete-btn"
            onClick={() => deleteItem(moduleKey, index)}
          >
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </li>
  );

  const renderAddItemForm = (moduleKey: string) => {
    const isVisible = addItemForms.has(moduleKey);
    
    return (
      <div className="add-item-section">
        <button
          className="add-item-btn"
          onClick={() => showAddItemForm(moduleKey)}
        >
          <i className="fas fa-plus"></i> Add Custom Item
        </button>
        {isVisible && (
          <div className="add-item-form" style={{ display: 'flex' }}>
            <input
              type="text"
              className="add-item-input"
              placeholder="Enter item name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    addCustomItem(moduleKey, input.value.trim());
                    input.value = '';
                  }
                }
              }}
            />
            <button
              className="form-btn save-btn"
              onClick={(e) => {
                const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                if (input?.value.trim()) {
                  addCustomItem(moduleKey, input.value.trim());
                  input.value = '';
                }
              }}
            >
              Save
            </button>
            <button
              className="form-btn cancel-btn"
              onClick={() => hideAddItemForm(moduleKey)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const allModules = ModuleManager.getAll(appData.customModules);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1><i className="fas fa-suitcase-rolling"></i> Smart Packing</h1>
        <p>Pack smart, travel light</p>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        {(['setup', 'packing', 'modules', 'history', 'settings'] as TabType[]).map(tab => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div>
            <div className="trip-setup">
              <h2>Plan Your Trip</h2>
              <input
                ref={tripNameRef}
                type="text"
                className="trip-input"
                placeholder="Trip name (e.g., Weekend in Paris)"
                value={appData.tripName}
                onChange={(e) => updateTripName(e.target.value)}
              />
              <input
                ref={tripDaysRef}
                type="number"
                className="trip-input"
                placeholder="Number of days"
                min="1"
                max="365"
                value={appData.tripDays}
                onChange={(e) => updateTripDays(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="trip-setup">
              <h2>Select Packing Modules</h2>
              <div className="modules-grid">
                {Object.entries(allModules).map(([key, module]) =>
                  renderModuleCard(key, module, appData.selectedModules.includes(key))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Packing Tab */}
        {activeTab === 'packing' && (
          <div>
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-text">Packing Progress</span>
                <span className="progress-percent">{progress.percentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>

            {appData.selectedModules.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-box-open"></i>
                <h3>No modules selected</h3>
                <p>Go to Setup tab to select packing modules</p>
              </div>
            ) : (
              appData.selectedModules.map(moduleKey => {
                const module = allModules[moduleKey];
                if (!module) return null;

                const items = appData.packingData[moduleKey] || [];
                const checkedCount = items.filter(item => item.checked).length;
                const isExpanded = expandedSections.has(moduleKey);

                return (
                  <div key={moduleKey} className={`packing-section ${isExpanded ? 'expanded' : ''}`}>
                    <div 
                      className="section-header" 
                      onClick={() => toggleSection(moduleKey)}
                    >
                      <div className="section-title">
                        <i className={`${module.icon} section-icon`}></i>
                        {module.name}
                      </div>
                      <div className="section-stats">{checkedCount}/{items.length}</div>
                      <i className="fas fa-chevron-down expand-icon"></i>
                    </div>
                    <div className="section-content">
                      <ul className="item-list">
                        {items.map((item, index) => renderPackingItem(moduleKey, item, index))}
                      </ul>
                      {renderAddItemForm(moduleKey)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div>
            <div className="settings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Manage Packing Modules</h3>
                <button 
                  className="form-btn save-btn"
                  onClick={() => setShowCreateModuleForm(true)}
                >
                  <i className="fas fa-plus"></i> New Module
                </button>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Edit default items for each packing module. These will be the starting items when you select a module for a trip.
              </p>
            </div>

            {showCreateModuleForm && (
              <div className="settings-section">
                <h3>Create New Module</h3>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    ref={newModuleNameRef}
                    type="text"
                    className="trip-input"
                    placeholder="Module name (e.g., Hiking)"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <select ref={newModuleIconRef} className="trip-input">
                    {AVAILABLE_ICONS.map(icon => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="form-btn save-btn"
                    onClick={() => {
                      const name = newModuleNameRef.current?.value || '';
                      const icon = newModuleIconRef.current?.value || 'fas fa-star';
                      if (name.trim()) {
                        createCustomModule(name.trim(), icon);
                        if (newModuleNameRef.current) newModuleNameRef.current.value = '';
                      }
                    }}
                  >
                    Create
                  </button>
                  <button
                    className="form-btn cancel-btn"
                    onClick={() => {
                      setShowCreateModuleForm(false);
                      if (newModuleNameRef.current) newModuleNameRef.current.value = '';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Module management sections would go here */}
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <i className="fas fa-cog" style={{ fontSize: '48px', marginBottom: '16px', color: '#d1d5db' }}></i>
              <h3>Module Management</h3>
              <p>Advanced module editing features coming soon!</p>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="settings-section">
              <h3>Trip History</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                View and duplicate your past trips to save time planning similar adventures.
              </p>
            </div>

            {appData.tripHistory.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-history"></i>
                <h3>No trip history yet</h3>
                <p>Complete your first trip to see it here</p>
              </div>
            ) : (
              appData.tripHistory.map((trip, index) => {
                const moduleNames = trip.selectedModules.map(key => 
                  allModules[key]?.name || key
                ).filter(Boolean);

                let totalItems = 0;
                let checkedItems = 0;
                Object.values(trip.packingData).forEach(items => {
                  totalItems += items.length;
                  checkedItems += items.filter(item => item.checked).length;
                });
                const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

                return (
                  <div key={index} className="trip-card">
                    <div className="trip-card-header">
                      <div>
                        <div className="trip-title">{trip.tripName || 'Unnamed Trip'}</div>
                        <div className="trip-date">
                          {formatDate(trip.date)} • {trip.tripDays} day{trip.tripDays !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="trip-progress">{progressPercent}% packed</div>
                    </div>
                    <div className="trip-modules">
                      {moduleNames.map(name => (
                        <span key={name} className="trip-module-tag">{name}</span>
                      ))}
                    </div>
                    <div className="trip-actions">
                      <button
                        className="trip-action-btn duplicate-btn"
                        onClick={() => duplicateTrip(index)}
                      >
                        <i className="fas fa-copy"></i> Duplicate
                      </button>
                      <button
                        className="trip-action-btn view-btn"
                        onClick={() => {
                          // Show trip details in alert (could be enhanced with modal)
                          let details = `Trip: ${trip.tripName}\n`;
                          details += `Duration: ${trip.tripDays} day${trip.tripDays !== 1 ? 's' : ''}\n`;
                          details += `Date: ${formatDate(trip.date)}\n\n`;
                          
                          trip.selectedModules.forEach(moduleKey => {
                            const module = allModules[moduleKey];
                            if (module) {
                              details += `${module.name}:\n`;
                              const items = trip.packingData[moduleKey] || [];
                              items.forEach(item => {
                                details += `  ${item.checked ? '✓' : '○'} ${item.name}\n`;
                              });
                              details += '\n';
                            }
                          });
                          
                          alert(details);
                        }}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                      <button
                        className="trip-action-btn delete-trip-btn"
                        onClick={() => deleteTripFromHistory(index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="settings-section">
              <h3>Preferences</h3>
              {Object.entries(appData.settings).map(([key, value]) => (
                <div key={key} className="setting-item">
                  <span style={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <div 
                    className={`setting-toggle ${value ? 'active' : ''}`}
                    onClick={() => updateSetting(key as keyof AppSettings, !value)}
                  ></div>
                </div>
              ))}
            </div>

            <div className="settings-section">
              <h3>Data Management</h3>
              <div className="setting-item">
                <span>Save current trip to history</span>
                <button className="form-btn save-btn" onClick={saveCurrentTrip}>
                  Save Trip
                </button>
              </div>
              <div className="setting-item">
                <span>Export packing list</span>
                <button className="form-btn save-btn" onClick={handleExport}>
                  Export
                </button>
              </div>
              <div className="setting-item">
                <span>Import packing list</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
                <button 
                  className="form-btn save-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import
                </button>
              </div>
              
              <div className="danger-zone">
                <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Danger Zone</h4>
                <p style={{ fontSize: '14px', marginBottom: '12px', color: '#7f1d1d' }}>
                  This will permanently delete all your data.
                </p>
                <button className="danger-btn" onClick={handleClearData}>
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackingList;