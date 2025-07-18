import React, { useState, useEffect, useContext, createContext } from 'react';
import { AlertCircle, FileText, Printer, Calculator } from 'lucide-react';

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
  G1: { min: 90, label: 'Normal or high', color: 'bg-green-500', risk: 'Low' },
  G2: { min: 60, max: 89, label: 'Mildly decreased', color: 'bg-green-400', risk: 'Low' },
  G3a: { min: 45, max: 59, label: 'Mild to moderately decreased', color: 'bg-yellow-500', risk: 'Moderate' },
  G3b: { min: 30, max: 44, label: 'Moderate to severely decreased', color: 'bg-orange-500', risk: 'High' },
  G4: { min: 15, max: 29, label: 'Severely decreased', color: 'bg-red-500', risk: 'Very High' },
  G5: { max: 14, label: 'Kidney failure', color: 'bg-red-700', risk: 'Very High' }
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
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        {unit && (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mg/dL">mg/dL</option>
            <option value="µmol/L">µmol/L</option>
          </select>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
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
    <div className="mt-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Results</h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">eGFR</span>
          <span className="text-2xl font-bold">{result.eGFR} mL/min/1.73 m²</span>
        </div>
        
        <div className={`h-2 rounded-full ${stage.color}`}></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Stage:</span>
          <span className="font-medium ml-2">{stage.stage}</span>
        </div>
        <div>
          <span className="text-gray-600">Description:</span>
          <span className="font-medium ml-2">{stage.label}</span>
        </div>
        <div>
          <span className="text-gray-600">Risk Level:</span>
          <span className="font-medium ml-2">{stage.risk}</span>
        </div>
        <div>
          <span className="text-gray-600">Formula:</span>
          <span className="font-medium ml-2">{formula}</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <p className="text-blue-800">
          <strong>Note:</strong> This result should be interpreted in clinical context. 
          CKD diagnosis requires abnormalities present for >3 months.
        </p>
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
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">eGFR Calculator</h1>
          <p className="text-gray-600">Calculate estimated Glomerular Filtration Rate using KDIGO 2024 guidelines</p>
        </div>
        
        <div className="space-y-4">
          <ValidatedInput
            label="Age"
            value={formData.age}
            onChange={(value) => handleInputChange('age', value)}
            error={errors.age}
            type="number"
            placeholder="Enter age in years"
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sex <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sex"
                  value="male"
                  checked={formData.sex === 'male'}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  className="mr-2"
                />
                Male
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sex"
                  value="female"
                  checked={formData.sex === 'female'}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  className="mr-2"
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
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={calculate}
              disabled={!isFormValid()}
              className={`flex-1 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
                isFormValid() 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calculator size={20} />
              Calculate eGFR
            </button>
            
            <button
              onClick={reset}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
            
            {result && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer size={20} />
                Print
              </button>
            )}
          </div>
        </div>
        
        <ResultsDisplay result={result} formula={formula} />
        
        {/* Future module placeholders */}
        <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
          <p className="font-medium mb-2">Future Modules (In Development):</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Albumin-to-Creatinine Ratio (ACR) integration</li>
            <li>Cystatin C-based eGFR calculation</li>
            <li>Combined CKD-EPI cr-cys equation</li>
            <li>Full CGA classification with risk stratification</li>
            <li>Trend tracking and historical data</li>
          </ul>
        </div>
      </div>
      
      {/* Print styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// Main App component with context provider
export default function App() {
  return (
    <CalculatorContext.Provider value={{}}>
      <div className="min-h-screen bg-gray-100 py-8">
        <EGFRCalculator />
      </div>
    </CalculatorContext.Provider>
  );
}
