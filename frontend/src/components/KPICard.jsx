import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const KPICard = ({ title, value, icon, trend, trendValue, metaText, isPrimary = false }) => {
  return (
    <motion.div
      className="kpi-card"
      style={{
        padding: isPrimary ? 'var(--space-3)' : 'var(--space-2)',
        background: isPrimary ? 'var(--bg-surface)' : 'var(--bg-surface)',
        borderColor: isPrimary ? 'var(--primary-200)' : 'var(--border-subtle)',
        boxShadow: isPrimary ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
      }}
    >
      <div className="kpi-title" style={{ fontSize: isPrimary ? '14px' : '13px', color: isPrimary ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        <span style={{ fontWeight: isPrimary ? 600 : 500 }}>{title}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      
      <div className="kpi-value" style={{ 
        fontSize: isPrimary ? '36px' : '28px',
        color: isPrimary ? 'var(--primary-600)' : 'var(--text-primary)',
        margin: isPrimary ? '12px 0' : '8px 0'
      }}>
        {value}
      </div>

      <div className="kpi-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        {trend && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            backgroundColor: trend === 'up' ? 'var(--green-50)' : trend === 'down' ? 'var(--red-50)' : 'var(--bg-surface-hover)',
            color: trend === 'up' ? 'var(--green-600)' : trend === 'down' ? 'var(--red-600)' : 'var(--text-muted)',
          }}>
            {trend === 'up' && <ArrowUp size={12} />}
            {trend === 'down' && <ArrowDown size={12} />}
            {trend === 'neutral' && <Minus size={12} />}
            {trendValue}
          </span>
        )}
        <span style={{ color: 'var(--text-muted)' }}>{metaText}</span>
      </div>
    </motion.div>
  );
};

export default KPICard;
