import { useState } from 'react';
import type { CalculatorState, CalcMode, BaseMode, WordSize } from '../types/index.js';

// Khởi tạo trạng thái mặc định (giống hệt các biến let ban đầu của bạn)
const initialState: CalculatorState = {
  displayValue: '0',
  expression: '',
  isNewCalculation: false,
  mode: 'standard',
  angleMode: 'deg',
  isSecondFunc: false,
  isFE: false,
  isHyp: false,
  base: 10 as unknown as BaseMode,
  wordSize: 64 as unknown as WordSize,
};

export const useCalculator = () => {
  // Gom toàn bộ biến cục bộ vào 1 State duy nhất
  const [state, setState] = useState<CalculatorState>(initialState);

  // 1. Hàm chuyển đổi chế độ (Thay thế cho switchMode cũ)
  const setMode = (newMode: CalcMode) => {
    setState((prev: CalculatorState) => ({
      ...prev,
      mode: newMode,
      // Khi đổi chế độ, thường ta sẽ reset lại màn hình
      displayValue: '0',
      expression: '',
      isNewCalculation: false,
    }));
  };

  // 2. Hàm xử lý nhập liệu (Thay thế cho appendToDisplay)
  const handleInput = (value: string) => {
    setState((prev: CalculatorState) => {
      // Logic chặn nhập liệu cho Programmer Mode chuyển vào đây
      if (prev.mode === 'programmer') {
        const operators = ["+", "-", "×", "÷", "%", "(", ")", "<<", ">>", "&", "|", "^", "~"];
        if (!operators.includes(value) && value === ".") return prev; // Không cho nhập dấu phẩy
        // (Thêm logic kiểm tra giới hạn bit ở đây sau)
      }

      // Logic ghi đè nếu đang là số 0 hoặc vừa tính xong
      if (prev.displayValue === '0' || prev.displayValue === 'Error' || prev.isNewCalculation) {
        return {
          ...prev,
          displayValue: (value === '.' && !prev.isNewCalculation) ? '0.' : value,
          isNewCalculation: false,
        };
      }

      // Cộng dồn chuỗi bình thường
      return {
        ...prev,
        displayValue: prev.displayValue + value,
      };
    });
  };

  // 3. Hàm xóa (Thay thế clearDisplay, clearEntry, backspace)
  const clearAll = () => setState((prev: CalculatorState) => ({ ...prev, displayValue: '0', expression: '' }));
  
  const backspace = () => {
    setState((prev: CalculatorState) => {
      if (prev.isNewCalculation || prev.displayValue === 'Error') {
        return { ...prev, displayValue: '0', isNewCalculation: false };
      }
      const newValue = prev.displayValue.slice(0, -1) || '0';
      return { ...prev, displayValue: newValue };
    });
  };

  // 4. Hàm tính toán (Sẽ gọi các hàm Pure Function từ src/utils/mathLogic.ts sau)
  const calculateResult = () => {
    // Tạm thời để trống, ta sẽ xử lý logic tính toán phức tạp (eval, regex) ở bước sau
    console.log("Đang tính toán biểu thức:", state.displayValue);
  };

  // Trả về State và các hàm để UI (Components) gọi
  return {
    state,
    setMode,
    handleInput,
    clearAll,
    backspace,
    calculateResult,
  };
};