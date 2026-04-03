import React from 'react';

const Skeleton = ({ width, height, borderRadius = '8px', style = {} }) => {
  return (
    <div style={{
      width: width || '100%',
      height: height || '100%',
      borderRadius,
      background: 'linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite linear',
      ...style
    }}>
      <style jsx>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export const CardSkeleton = () => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', paddingBottom: 16 }}>
    <Skeleton height="200px" borderRadius="0" />
    <div style={{ padding: 16 }}>
      <Skeleton width="60%" height="20px" style={{ marginBottom: 12 }} />
      <Skeleton width="40%" height="16px" style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="30%" height="24px" />
        <Skeleton width="20%" height="24px" />
      </div>
    </div>
  </div>
);

export const FlightSkeleton = () => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
        <Skeleton width="48px" height="48px" borderRadius="12px" />
        <div style={{ flex: 1 }}>
          <Skeleton width="120px" height="20px" style={{ marginBottom: 8 }} />
          <Skeleton width="80px" height="14px" />
        </div>
      </div>
      <div style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: 24 }}>
        <Skeleton width="100px" height="40px" />
        <Skeleton width="100px" height="40px" />
      </div>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <Skeleton width="80px" height="24px" style={{ marginLeft: 'auto' }} />
      </div>
    </div>
  </div>
);

export default Skeleton;
