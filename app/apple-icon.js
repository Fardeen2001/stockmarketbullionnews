import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '20px',
        }}
      >
        {/* Stock Chart - Upward Trend */}
        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '8px',
          }}
        >
          {/* Chart bars representing upward trend */}
          <div style={{ width: '12px', height: '20px', background: 'white', borderRadius: '3px', opacity: 0.9 }} />
          <div style={{ width: '12px', height: '35px', background: 'white', borderRadius: '3px', opacity: 0.9 }} />
          <div style={{ width: '12px', height: '50px', background: 'white', borderRadius: '3px', opacity: 0.9 }} />
          <div style={{ width: '12px', height: '70px', background: 'white', borderRadius: '3px', opacity: 0.9 }} />
        </div>
        
        {/* Bullion/Gold Coin Symbol */}
        <div
          style={{
            position: 'absolute',
            bottom: '25px',
            right: '25px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            border: '4px solid rgba(255,255,255,0.95)',
            boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
