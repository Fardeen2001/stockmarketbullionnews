import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #fbbf24 100%)',
          position: 'relative',
          borderRadius: '6px',
        }}
      >
        {/* Stock Chart - Upward Trend Line */}
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '6px',
            left: '6px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '2px',
          }}
        >
          {/* Chart bars representing upward trend */}
          <div style={{ width: '3px', height: '4px', background: 'white', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '7px', background: 'white', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '10px', background: 'white', borderRadius: '1px' }} />
          <div style={{ width: '3px', height: '14px', background: 'white', borderRadius: '1px' }} />
        </div>
        
        {/* Bullion/Gold Coin Symbol */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
