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
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #fbbf24 100%)',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern - Subtle grid */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.1,
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent)',
            backgroundSize: '8px 8px',
          }}
        />
        
        {/* Main Icon Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Stock Chart - Upward Trend (Left side) */}
          <div
            style={{
              position: 'absolute',
              left: '3px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '1px',
            }}
          >
            {/* Chart bars representing upward trend */}
            <div style={{ width: '2px', height: '4px', background: 'white', borderRadius: '1px', opacity: 0.9 }} />
            <div style={{ width: '2px', height: '6px', background: 'white', borderRadius: '1px', opacity: 0.9 }} />
            <div style={{ width: '2px', height: '8px', background: 'white', borderRadius: '1px', opacity: 0.9 }} />
            <div style={{ width: '2px', height: '11px', background: 'white', borderRadius: '1px', opacity: 0.9 }} />
            <div style={{ width: '2px', height: '14px', background: 'white', borderRadius: '1px', opacity: 1 }} />
          </div>
          
          {/* Gold Bullion Bar (Right side) */}
          <div
            style={{
              position: 'absolute',
              right: '3px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '10px',
              height: '14px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              borderRadius: '2px',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5px 1px',
            }}
          >
            {/* Gold bar shine effects */}
            <div style={{ width: '6px', height: '1px', background: 'rgba(255,255,255,0.6)', borderRadius: '0.5px' }} />
            <div style={{ width: '6px', height: '1px', background: 'rgba(255,255,255,0.4)', borderRadius: '0.5px' }} />
            <div style={{ width: '6px', height: '1px', background: 'rgba(255,255,255,0.3)', borderRadius: '0.5px' }} />
            <div style={{ width: '6px', height: '1px', background: 'rgba(255,255,255,0.4)', borderRadius: '0.5px' }} />
            <div style={{ width: '6px', height: '1px', background: 'rgba(255,255,255,0.6)', borderRadius: '0.5px' }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
