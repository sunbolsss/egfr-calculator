import React, { useState, useEffect, useContext, createContext } from 'react';
import { AlertCircle, FileText, Printer, Calculator } from 'lucide-react';
import './App.css';

// Context for future scalability
const CalculatorContext = createContext();

// Constants for formulas
const FORMULAS = {
  CKD_EPI_2021: {
    name: 'CKD-EPI 2021',
    constants: {
      female: { kappa: 0.7, alpha: -0.241, sexFactor: 1.012 },
      male: { kappa: 0.9, alpha: -0.302, sexFactor: 1.0 }
    }
  },
  SCHWARTZ_2009: {
    name: 'Bedside Schwartz 2009',
    constant: 0.413
  }
};

// CKD Staging based on KDIGO 2024
const CKD_STAGES = {
  G1: { min: 90, label: 'Normal or high', color: '#10b981', risk: 'Low' },
  G2: { min: 60, max: 89, label: 'Mildly decreased', color: '#34d399', risk: 'Low' },
  G3a: { min: 45, max: 59, label: 'Mild to moderately decreased', color: '#eab308', risk: 'Moderate' },
  G3b: { min: 30, max: 44, label: 'Moderate to severely decreased', color: '#f97316', risk: 'High' },
  G4: { min: 15, max: 29, label: 'Severely decreased', color: '#ef4444', risk: 'Very High' },
  G5: { max: 14, label: 'Kidney failure', color: '#b91c1c', risk: 'Very High' }
};

// Validation schemas
const validateAge = (age) => {
  const numAge = parseFloat(age);
  if (isNaN(numAge) || numAge < 1) return 'Age must be ≥ 1 year';
  if (numAge > 120) return 'Please verify age > 120 years';
  return null;
};

const validateCreatinine = (value, unit) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 'Creatinine must be > 0';
  if (unit === 'mg/dL' && num > 20) return 'Please verify creatinine > 20 mg/dL';
  if (unit === 'µmol/L' && num > 1768) return 'Please verify creatinine > 1768 µmol/L';
  return null;
};

const validateHeight = (height) => {
  const num = parseFloat(height);
  if (isNaN(num) || num < 30 || num > 250) return 'Height must be between 30-250 cm';
  return null;
};

// Calculation functions
const calculateCKDEPI2021 = (creatinine, age, isFemale) => {
  const constants = isFemale ? FORMULAS.CKD_EPI_2021.constants.female : FORMULAS.CKD_EPI_2021.constants.male;
  const { kappa, alpha, sexFactor } = constants;
  
  const ratio = creatinine / kappa;
  const minVal = Math.min(ratio, 1.0);
  const maxVal = Math.max(ratio, 1.0);
  
  const eGFR = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexFactor;
  
  return Math.round(eGFR);
};

const calculateSchwartz2009 = (creatinine, height) => {
  const eGFR = (FORMULAS.SCHWARTZ_2009.constant * height) / creatinine;
  return Math.round(eGFR);
};

// Get CKD Stage
const getCKDStage = (eGFR) => {
  if (eGFR >= 90) return { stage: 'G1', ...CKD_STAGES.G1 };
  if (eGFR >= 60) return { stage: 'G2', ...CKD_STAGES.G2 };
  if (eGFR >= 45) return { stage: 'G3a', ...CKD_STAGES.G3a };
  if (eGFR >= 30) return { stage: 'G3b', ...CKD_STAGES.G3b };
  if (eGFR >= 15) return { stage: 'G4', ...CKD_STAGES.G4 };
  return { stage: 'G5', ...CKD_STAGES.G5 };
};

// Input component with validation
const ValidatedInput = ({ label, value, onChange, validation, error, type = 'text', unit, onUnitChange, placeholder, required = true }) => {
  const inputStyle = {
    flex: 1,
    padding: '8px 12px',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: '6px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const selectStyle = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={placeholder}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#d1d5db'}
        />
        {unit && (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            style={selectStyle}
          >
            <option value="mg/dL">mg/dL</option>
            <option value="µmol/L">µmol/L</option>
          </select>
        )}
      </div>
      {error && (
        <p style={{ marginTop: '4px', fontSize: '14px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

// Results display component
const ResultsDisplay = ({ result, formula }) => {
  if (!result) return null;
  
  const stage = getCKDStage(result.eGFR);
  
  return (
    <div style={{ 
      marginTop: '24px', 
      padding: '24px', 
      backgroundColor: '#f9fafb', 
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Results</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>eGFR</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.eGFR} mL/min/1.73 m²</span>
        </div>
        
        <div style={{ 
          height: '8px', 
          borderRadius: '9999px', 
          backgroundColor: stage.color,
          transition: 'background-color 0.3s'
        }}></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
        <div>
          <span style={{ color: '#6b7280' }}>Stage:</span>
          <span style={{ fontWeight: '500', marginLeft: '8px' }}>{stage.stage}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Description:</span>
          <span style={{ fontWeight: '500', marginLeft: '8px' }}>{stage.label}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Risk Level:</span>
          <span style={{ fontWeight: '500', marginLeft: '8px' }}>{stage.risk}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Formula:</span>
          <span style={{ fontWeight: '500', marginLeft: '8px' }}>{formula}</span>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#dbeafe', 
        borderRadius: '6px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>Note:</strong> This result should be interpreted in clinical context. 
        CKD diagnosis requires abnormalities present for >3 months.
      </div>
    </div>
  );
};

// Main calculator component
const EGFRCalculator = () => {
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    creatinine: '',
    creatinineUnit: 'mg/dL',
    height: ''
  });
  
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [formula, setFormula] = useState('');
  
  const isPediatric = formData.age && parseFloat(formData.age) < 18;
  
  // Validation effect
  useEffect(() => {
    const newErrors = {};
    
    if (formData.age) {
      const ageError = validateAge(formData.age);
      if (ageError) newErrors.age = ageError;
    }
    
    if (formData.creatinine) {
      const creatError = validateCreatinine(formData.creatinine, formData.creatinineUnit);
      if (creatError) newErrors.creatinine = creatError;
    }
    
    if (isPediatric && formData.height) {
      const heightError = validateHeight(formData.height);
      if (heightError) newErrors.height = heightError;
    }
    
    setErrors(newErrors);
  }, [formData, isPediatric]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const convertCreatinine = (value, fromUnit) => {
    if (fromUnit === 'µmol/L') {
      return parseFloat(value) / 88.4;
    }
    return parseFloat(value);
  };
  
  const isFormValid = () => {
    const requiredFields = ['age', 'sex', 'creatinine'];
    if (isPediatric) requiredFields.push('height');
    
    return requiredFields.every(field => formData[field]) && 
           Object.keys(errors).length === 0;
  };
  
  const calculate = () => {
    if (!isFormValid()) return;
    
    const age = parseFloat(formData.age);
    const creatinine = convertCreatinine(formData.creatinine, formData.creatinineUnit);
    const isFemale = formData.sex === 'female';
    
    let eGFR;
    let usedFormula;
    
    if (age >= 18) {
      eGFR = calculateCKDEPI2021(creatinine, age, isFemale);
      usedFormula = FORMULAS.CKD_EPI_2021.name;
    } else {
      const height = parseFloat(formData.height);
      eGFR = calculateSchwartz2009(creatinine, height);
      usedFormula = FORMULAS.SCHWARTZ_2009.name;
    }
    
    setResult({ eGFR });
    setFormula(usedFormula);
  };
  
  const reset = () => {
    setFormData({
      age: '',
      sex: '',
      creatinine: '',
      creatinineUnit: 'mg/dL',
      height: ''
    });
    setResult(null);
    setFormula('');
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  };
  
  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', padding: '24px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            eGFR Calculator
          </h1>
          <p style={{ color: '#6b7280' }}>
            Calculate estimated Glomerular Filtration Rate using KDIGO 2024 guidelines
          </p>
        </div>
        
        <div>
          <ValidatedInput
            label="Age"
            value={formData.age}
            onChange={(value) => handleInputChange('age', value)}
            error={errors.age}
            type="number"
            placeholder="Enter age in years"
          />
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Sex <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sex"
                  value="male"
                  checked={formData.sex === 'male'}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Male
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sex"
                  value="female"
                  checked={formData.sex === 'female'}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                Female
              </label>
            </div>
          </div>
          
          <ValidatedInput
            label="Serum Creatinine"
            value={formData.creatinine}
            onChange={(value) => handleInputChange('creatinine', value)}
            error={errors.creatinine}
            type="number"
            unit={formData.creatinineUnit}
            onUnitChange={(value) => handleInputChange('creatinineUnit', value)}
            placeholder="Enter creatinine value"
          />
          
          {isPediatric && (
            <ValidatedInput
              label="Height"
              value={formData.height}
              onChange={(value) => handleInputChange('height', value)}
              error={errors.height}
              type="number"
              placeholder="Enter height in cm"
            />
          )}
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={calculate}
              disabled={!isFormValid()}
              style={{
                ...buttonStyle,
                flex: 1,
                backgroundColor: isFormValid() ? '#2563eb' : '#d1d5db',
                color: isFormValid() ? 'white' : '#6b7280',
                cursor: isFormValid() ? 'pointer' : 'not-allowed'
              }}
              onMouseEnter={(e) => isFormValid() && (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => isFormValid() && (e.target.style.backgroundColor = '#2563eb')}
            >
              <Calculator size={20} />
              Calculate eGFR
            </button>
            
            <button
              onClick={reset}
              style={{
                ...buttonStyle,
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              Reset
            </button>
            
            {result && (
              <button
                onClick={handlePrint}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <Printer size={20} />
                Print
              </button>
            )}
          </div>
        </div>
        
        <ResultsDisplay result={result} formula={formula} />
        
        {/* Future module placeholders */}
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          border: '2px dashed #d1d5db', 
          borderRadius: '8px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <p style={{ fontWeight: '500', marginBottom: '8px' }}>Future Modules (In Development):</p>
          <ul style={{ listStyle: 'disc', listStylePosition: 'inside', lineHeight: '1.5' }}>
            <li>Albumin-to-Creatinine Ratio (ACR) integration</li>
            <li>Cystatin C-based eGFR calculation</li>
            <li>Combined CKD-EPI cr-cys equation</li>
            <li>Full CGA classification with risk stratification</li>
            <li>Trend tracking and historical data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Main App component with context provider
export default function App() {
  return (
    <CalculatorContext.Provider value={{}}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', paddingTop: '32px', paddingBottom: '32px' }}>
        <EGFRCalculator />
      </div>
    </CalculatorContext.Provider>
  );
}
