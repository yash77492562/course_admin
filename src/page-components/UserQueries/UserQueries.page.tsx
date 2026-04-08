'use client';

import { useState, useEffect } from 'react';
import { contactApi, Contact } from '@/lib/api/contactApi';
import { ContactCard } from '@/components/features/ContactCard/ContactCard';
import { Header } from '@/components/layout/Header';

export function UserQueriesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, [filter]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactApi.getAllContacts(filter || undefined);
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await contactApi.updateContactStatus(id, status);
      loadContacts();
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
          User Queries
        </h1>
        <p style={{ color: '#64748b' }}>Manage contact form submissions</p>
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
          onClick={() => setFilter('NEW')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'NEW' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'NEW' ? '#eff6ff' : 'white',
            color: filter === 'NEW' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'NEW' ? 600 : 400,
          }}
        >
          New
        </button>
        <button
          onClick={() => setFilter('IN_PROGRESS')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'IN_PROGRESS' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'IN_PROGRESS' ? '#eff6ff' : 'white',
            color: filter === 'IN_PROGRESS' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'IN_PROGRESS' ? 600 : 400,
          }}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('RESPONDED')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'RESPONDED' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'RESPONDED' ? '#eff6ff' : 'white',
            color: filter === 'RESPONDED' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'RESPONDED' ? 600 : 400,
          }}
        >
          Responded
        </button>
        <button
          onClick={() => setFilter('CLOSED')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: filter === 'CLOSED' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            background: filter === 'CLOSED' ? '#eff6ff' : 'white',
            color: filter === 'CLOSED' ? '#3b82f6' : '#64748b',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: filter === 'CLOSED' ? 600 : 400,
          }}
        >
          Closed
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading...
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          No contacts found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
