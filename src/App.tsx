import React from 'react';
import { useCalculator } from './hooks/useCalculator.js'; // Nhớ có đuôi .js nhé
import Display from './components/common/Display.js';
import StandardMode from './components/modes/StandardMode.js';

const App: React.FC = () => {
  // Lấy state và các hàm xử lý từ Custom Hook
  const { state, handleInput, clearAll, backspace, calculateResult } = useCalculator();

  return (
    <div className="calculator">
      {/* --- HEADER --- */}
      <div className="header">
        <div className="left-controls">
          <button className="icon-btn menu-btn">☰</button>
          <span className="mode-title">
            {state.mode.charAt(0).toUpperCase() + state.mode.slice(1)}
          </span>
        </div>
        <button className="icon-btn history-btn" title="History">🕒</button>
      </div>

      {/* --- MÀN HÌNH --- */}
      {/* Truyền dữ liệu state xuống màn hình */}
      <Display expression={state.expression} value={state.displayValue} />

      {/* --- KHU VỰC BÀN PHÍM --- */}
      <div className="body-area">
        {/* Chỉ render StandardMode nếu state.mode đang là 'standard' */}
        {state.mode === 'standard' && (
          <StandardMode 
            onInput={handleInput} 
            onClear={clearAll} 
            onBackspace={backspace} 
            onCalculate={calculateResult} 
          />
        )}
      </div>
    </div>
  );
};

export default App;