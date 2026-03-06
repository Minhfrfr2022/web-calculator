import React from 'react';

// Khai báo các sự kiện mà bàn phím này có thể phát ra
interface StandardModeProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onCalculate: () => void;
}

const StandardMode: React.FC<StandardModeProps> = ({
  onInput,
  onClear,
  onBackspace,
  onCalculate,
}) => {
  return (
    <div className="buttons-grid standard-grid" id="mode-standard">
      {/* Hàng 1 */}
      <button onClick={() => onInput('%')}>%</button>
      <button onClick={onClear}>CE</button>
      <button onClick={onClear}>C</button>
      <button onClick={onBackspace}>⌫</button>

      {/* Hàng 2 (Các hàm 1/x, x², √x tạm thời gọi onInput, ta sẽ cập nhật logic tính toán sau) */}
      <button onClick={() => onInput('1/x')}>¹/x</button>
      <button onClick={() => onInput('x²')}>x²</button>
      <button onClick={() => onInput('√')}>²√x</button>
      <button className="operator" onClick={() => onInput('÷')}>÷</button>

      {/* Hàng 3 */}
      <button className="number" onClick={() => onInput('7')}>7</button>
      <button className="number" onClick={() => onInput('8')}>8</button>
      <button className="number" onClick={() => onInput('9')}>9</button>
      <button className="operator" onClick={() => onInput('×')}>×</button>

      {/* Hàng 4 */}
      <button className="number" onClick={() => onInput('4')}>4</button>
      <button className="number" onClick={() => onInput('5')}>5</button>
      <button className="number" onClick={() => onInput('6')}>6</button>
      <button className="operator" onClick={() => onInput('-')}>−</button>

      {/* Hàng 5 */}
      <button className="number" onClick={() => onInput('1')}>1</button>
      <button className="number" onClick={() => onInput('2')}>2</button>
      <button className="number" onClick={() => onInput('3')}>3</button>
      <button className="operator" onClick={() => onInput('+')}>+</button>

      {/* Hàng 6 */}
      <button onClick={() => onInput('+/-')}>+/-</button>
      <button className="number" onClick={() => onInput('0')}>0</button>
      <button className="number" onClick={() => onInput('.')}>.</button>
      <button className="equals" onClick={onCalculate}>=</button>
    </div>
  );
};

export default StandardMode;