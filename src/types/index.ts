export type CalcMode = 'standard' | 'scientific' | 'programmer' | 'date' | 'graphing';
export type AngleMode = 'deg' | 'rad' | 'grad';
export type BaseMode = '10' | '16' | '8' | '2';
export type WordSize = '64' | '32' | '16' | '8';

export interface HistoryItem {
  id : string;
  expression: string;
  result: string | number;
}

export interface CalculatorState{
    displayValue: string;
    expression: string;
    isNewCalculation: boolean;
    mode: CalcMode;
    angleMode: AngleMode;
    isSecondFunc: boolean;
    isFE: boolean;
    isHyp: boolean;
    base: BaseMode;
    wordSize: WordSize;
}