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
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #fbbf24 100%)',
          position: 'relative',
          borderRadius: '40px',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern - Subtle grid */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.15,
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent)',
            backgroundSize: '20px 20px',
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
              left: '25px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '70px',
              height: '70px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '8px 6px',
            }}
          >
            {/* Chart bars representing upward trend */}
            <div style={{ width: '8px', height: '15px', background: 'white', borderRadius: '4px', opacity: 0.85 }} />
            <div style={{ width: '8px', height: '25px', background: 'white', borderRadius: '4px', opacity: 0.9 }} />
            <div style={{ width: '8px', height: '35px', background: 'white', borderRadius: '4px', opacity: 0.9 }} />
            <div style={{ width: '8px', height: '45px', background: 'white', borderRadius: '4px', opacity: 0.95 }} />
            <div style={{ width: '8px', height: '55px', background: 'white', borderRadius: '4px', opacity: 1 }} />
            <div style={{ width: '8px', height: '65px', background: 'white', borderRadius: '4px', opacity: 1 }} />
          </div>
          
          {/* Gold Bullion Bar (Right side) */}
          <div
            style={{
              position: 'absolute',
              right: '25px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '55px',
              height: '75px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              borderRadius: '10px',
              border: '4px solid rgba(255,255,255,0.5)',
              boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.4), 0 4px 15px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 5px',
            }}
          >
            {/* Gold bar shine effects */}
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.5)', borderRadius: '2px' }} />
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.4)', borderRadius: '2px' }} />
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.4)', borderRadius: '2px' }} />
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.5)', borderRadius: '2px' }} />
            <div style={{ width: '35px', height: '4px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
