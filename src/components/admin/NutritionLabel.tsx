'use client';

import React, { forwardRef } from 'react';

// FDA Daily Values (2000 calorie diet)
const FDA_DAILY_VALUES = {
  totalFat: 78,
  saturatedFat: 20,
  transFat: 0,
  cholesterol: 300,
  sodium: 2300,
  totalCarbs: 275,
  dietaryFiber: 28,
  addedSugars: 50,
  vitaminD: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
};

interface NutritionLabelProps {
  servingSize: string;
  calories: number;
  totalFat: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium: number;
  totalCarbs: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars?: number;
  protein: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
}

const calculateDailyValue = (value: number, dailyValue: number): number => {
  return Math.round((value / dailyValue) * 100);
};

export const NutritionLabel = forwardRef<HTMLDivElement, NutritionLabelProps>(
  (
    {
      servingSize,
      calories,
      totalFat,
      saturatedFat = 0,
      transFat = 0,
      cholesterol = 0,
      sodium,
      totalCarbs,
      dietaryFiber,
      totalSugars,
      addedSugars = 0,
      protein,
      vitaminD = 0,
      calcium = 0,
      iron = 0,
      potassium = 0,
    },
    ref
  ) => {
    const fatDV = calculateDailyValue(totalFat, FDA_DAILY_VALUES.totalFat);
    const satFatDV = calculateDailyValue(saturatedFat, FDA_DAILY_VALUES.saturatedFat);
    const cholesterolDV = calculateDailyValue(cholesterol, FDA_DAILY_VALUES.cholesterol);
    const sodiumDV = calculateDailyValue(sodium, FDA_DAILY_VALUES.sodium);
    const carbsDV = calculateDailyValue(totalCarbs, FDA_DAILY_VALUES.totalCarbs);
    const fiberDV = calculateDailyValue(dietaryFiber, FDA_DAILY_VALUES.dietaryFiber);
    const sugarsDV = calculateDailyValue(addedSugars, FDA_DAILY_VALUES.addedSugars);
    const vitaminDDV = calculateDailyValue(vitaminD, FDA_DAILY_VALUES.vitaminD);
    const calciumDV = calculateDailyValue(calcium, FDA_DAILY_VALUES.calcium);
    const ironDV = calculateDailyValue(iron, FDA_DAILY_VALUES.iron);
    const potassiumDV = calculateDailyValue(potassium, FDA_DAILY_VALUES.potassium);

    const otherCarbs = totalCarbs - dietaryFiber - totalSugars;

    return (
      <div
        ref={ref}
        className="w-full max-w-xs bg-white"
        style={{
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.3',
        }}
      >
        {/* Main container with thick border */}
        <div
          style={{
            border: '4px solid #000',
            padding: '8px',
            backgroundColor: '#fff',
          }}
        >
          {/* Header */}
          <div
            style={{
              borderBottom: '8px solid #000',
              paddingBottom: '6px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                letterSpacing: '1px',
              }}
            >
              Nutrition Facts
            </div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              Serving Size: <span style={{ fontWeight: 'bold' }}>{servingSize}</span>
            </div>
          </div>

          {/* Calories Section */}
          <div
            style={{
              borderBottom: '6px solid #000',
              paddingBottom: '4px',
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
            }}
          >
            <span>Calories</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{calories}</span>
          </div>

          {/* Daily Value Notice */}
          <div
            style={{
              borderBottom: '2px solid #000',
              paddingBottom: '2px',
              marginBottom: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            % Daily Value*
          </div>

          {/* Fat Section */}
          <div style={{ paddingBottom: '2px', marginBottom: '2px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                borderBottom: '1px solid #000',
              }}
            >
              <span>Total Fat {totalFat}g</span>
              <span>{fatDV}%</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingLeft: '16px',
                fontSize: '12px',
              }}
            >
              <span>Saturated Fat {saturatedFat}g</span>
              <span>{satFatDV}%</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingLeft: '16px',
                fontSize: '12px',
              }}
            >
              <span>Trans Fat {transFat}g</span>
              <span></span>
            </div>
          </div>

          {/* Cholesterol and Sodium */}
          <div style={{ paddingBottom: '2px', marginBottom: '2px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                borderBottom: '1px solid #000',
              }}
            >
              <span>Cholesterol {cholesterol}mg</span>
              <span>{cholesterolDV}%</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                borderBottom: '1px solid #000',
              }}
            >
              <span>Sodium {sodium}mg</span>
              <span>{sodiumDV}%</span>
            </div>
          </div>

          {/* Carbs Section */}
          <div style={{ paddingBottom: '2px', marginBottom: '2px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                borderBottom: '1px solid #000',
              }}
            >
              <span>Total Carbohydrate {totalCarbs}g</span>
              <span>{carbsDV}%</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingLeft: '16px',
                fontSize: '12px',
              }}
            >
              <span>Dietary Fiber {dietaryFiber}g</span>
              <span>{fiberDV}%</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingLeft: '16px',
                fontSize: '12px',
              }}
            >
              <span>Total Sugars {totalSugars}g</span>
              <span></span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingLeft: '32px',
                fontSize: '11px',
              }}
            >
              <span>Added Sugars {addedSugars}g</span>
              <span>{sugarsDV}%</span>
            </div>
          </div>

          {/* Protein */}
          <div
            style={{
              paddingBottom: '2px',
              marginBottom: '2px',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              borderBottom: '1px solid #000',
            }}
          >
            <span>Protein {protein}g</span>
            <span></span>
          </div>

          {/* Vitamins and Minerals */}
          <div
            style={{
              borderTop: '2px solid #000',
              borderBottom: '4px solid #000',
              paddingTop: '2px',
              paddingBottom: '2px',
              marginBottom: '4px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Vitamin D {vitaminD}mcg</span>
              <span>{vitaminDDV}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Calcium {calcium}mg</span>
              <span>{calciumDV}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Iron {iron}mg</span>
              <span>{ironDV}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Potassium {potassium}mg</span>
              <span>{potassiumDV}%</span>
            </div>
          </div>

          {/* Footer notice */}
          <div style={{ fontSize: '9px', lineHeight: '1.2', color: '#333' }}>
            * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes
            to a daily diet. 2,000 calories a day is used for general nutrition advice.
          </div>
        </div>
      </div>
    );
  }
);

NutritionLabel.displayName = 'NutritionLabel';
