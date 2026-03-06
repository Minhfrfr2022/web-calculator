import React from 'react';

interface DisplayProps {
  value: string;
  expression?: string;
  isError?: boolean;
}

const Display: React.FC<DisplayProps> = ({ value, expression, isError }) => {
  return (
    <div className="display-container">
      {/* Dòng hiển thị biểu thức nhỏ ở trên */}
      <div className="display-expression" style={{ minHeight: '1.5rem', color: '#888', fontSize: '0.9rem', textAlign: 'right', paddingRight: '10px' }}>
        {expression}
      </div>
      
      {/* Dòng hiển thị số chính */}
      <div className={`display-main ${isError ? 'error-text' : ''}`} id="display">
        {value}
      </div>
    </div>
  );
};

export default Display;