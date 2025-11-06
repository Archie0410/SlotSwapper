import { useState, useEffect } from 'react';
import { swapsApi, eventsApi, Event } from '../api/api';
import './Marketplace.css';

export default function Marketplace() {
  const [slots, setSlots] = useState<Event[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Event | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, myEventsRes] = await Promise.all([
        swapsApi.getSwappableSlots(),
        eventsApi.getAll(),
      ]);
      setSlots(slotsRes.data);
      setMySwappableSlots(myEventsRes.data.filter((e) => e.status === 'SWAPPABLE'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot: Event) => {
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleConfirmSwap = async (mySlotId: string) => {
    if (!selectedSlot) return;

    try {
      await swapsApi.createSwapRequest({
        mySlotId,
        theirSlotId: selectedSlot.id,
      });
      setShowModal(false);
      setSelectedSlot(null);
      fetchData(); // Refresh to update statuses
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create swap request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="marketplace">
      <h1>Marketplace - Swappable Slots</h1>
      {error && <div className="error-message">{error}</div>}

      {slots.length === 0 ? (
        <p className="empty-state">No swappable slots available from other users.</p>
      ) : (
        <div className="slots-list">
          {slots.map((slot) => (
            <div key={slot.id} className="slot-card">
              <div className="slot-header">
                <h3>{slot.title}</h3>
                <span className="owner-badge">by {slot.owner?.name || 'Unknown'}</span>
              </div>
              <div className="slot-details">
                <p><strong>Start:</strong> {formatDate(slot.startTime)}</p>
                <p><strong>End:</strong> {formatDate(slot.endTime)}</p>
              </div>
              <button
                onClick={() => handleRequestSwap(slot)}
                className="btn-request"
                disabled={mySwappableSlots.length === 0}
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Select Your Slot to Offer</h2>
            <p>You want to swap for: <strong>{selectedSlot.title}</strong></p>
            {mySwappableSlots.length === 0 ? (
              <p className="error-message">
                You need at least one SWAPPABLE slot to make a request.
              </p>
            ) : (
              <div className="my-slots-list">
                {mySwappableSlots.map((slot) => (
                  <div key={slot.id} className="my-slot-item">
                    <div>
                      <strong>{slot.title}</strong>
                      <p>{formatDate(slot.startTime)} - {formatDate(slot.endTime)}</p>
                    </div>
                    <button
                      onClick={() => handleConfirmSwap(slot.id)}
                      className="btn-confirm"
                    >
                      Offer This Slot
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowModal(false)} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

