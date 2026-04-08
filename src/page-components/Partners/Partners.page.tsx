'use client';

import { useState, useEffect } from 'react';
import { partnerApi, Partner } from '@/lib/api/partnerApi';
import { PartnerCard } from '@/components/features/PartnerCard/PartnerCard';
import { Header } from '@/components/layout/Header';

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadPartners();
  }, [filter]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerApi.getAllPartners(filter || undefined);
      setPartners(data);
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await partnerApi.updatePartnerStatus(id, status);
      loadPartners();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Partner Applications
        </h1>
        <p style={{ color: '#64748b' }}>Manage instructor partnership applications</p>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === '' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === '' ? '#eff6ff' : 'white',
            color: filter === '' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === '' ? 600 : 400,
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'PENDING' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'PENDING' ? '#eff6ff' : 'white',
            color: filter === 'PENDING' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'PENDING' ? 600 : 400,
          }}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('REVIEWED')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'REVIEWED' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'REVIEWED' ? '#eff6ff' : 'white',
            color: filter === 'REVIEWED' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'REVIEWED' ? 600 : 400,
          }}
        >
          Reviewed
        </button>
        <button
          onClick={() => setFilter('APPROVED')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'APPROVED' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'APPROVED' ? '#eff6ff' : 'white',
            color: filter === 'APPROVED' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'APPROVED' ? 600 : 400,
          }}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('REJECTED')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'REJECTED' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'REJECTED' ? '#eff6ff' : 'white',
            color: filter === 'REJECTED' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'REJECTED' ? 600 : 400,
          }}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading...
        </div>
      ) : partners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          No partner applications found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
