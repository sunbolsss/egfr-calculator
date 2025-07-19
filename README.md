# eGFR Calculator

A React-based medical web application for calculating estimated Glomerular Filtration Rate (eGFR).

## Features

- **Automatic Formula Selection**: Uses CKD-EPI 2021 for adults (≥18 years) and Bedside Schwartz 2009 for children
- **Real-time Validation**: Dynamic input validation with inline error messages
- **Unit Conversion**: Supports both mg/dL and µmol/L for creatinine
- **Clinical Staging**: KDIGO 2024 CKD staging with color-coded risk visualization
- **Professional UI**: Clean, medical-grade interface with print functionality
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Usage

1. Enter patient age, sex, and serum creatinine value
2. For pediatric patients (age < 18), also enter height
3. Click "Calculate eGFR" to see results
4. Results include eGFR value, CKD stage, and risk level

## Deployment

### Quick Deploy with Vercel
```bash
npx vercel --prod
```

### Deploy with Netlify
```bash
npm run build
# Then drag the 'build' folder to netlify.com/drop
```

## Future Features

- Albumin-to-Creatinine Ratio (ACR) integration
- Cystatin C-based eGFR calculation
- Combined CKD-EPI cr-cys equation
- Full CGA classification with risk stratification
- Trend tracking and historical data

## Medical Disclaimer

This calculator is for educational and informational purposes only. Results should be interpreted by qualified healthcare professionals in clinical context.
# Trigger rebuild
