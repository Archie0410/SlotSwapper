import { useState, useEffect } from 'react';
import { swapsApi, eventsApi, SwapRequest } from '../api/api';
import './Requests.css';

export default function Requests() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await swapsApi.getRequests();
      setIncoming(response.data.incoming);
      setOutgoing(response.data.outgoing);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, accept: boolean) => {
    try {
      await swapsApi.respondToSwapRequest(requestId, accept);
      // Refresh requests and events
      await Promise.all([fetchRequests(), eventsApi.getAll()]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to respond to request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="requests">
      <h1>Swap Requests</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="requests-section">
        <h2>Incoming Requests</h2>
        {incoming.length === 0 ? (
          <p className="empty-state">No incoming requests.</p>
        ) : (
          <div className="requests-list">
            {incoming.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>Swap Request from {request.fromUser.name}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="request-details">
                  <div className="slot-info">
                    <h4>They want:</h4>
                    <p><strong>{request.theirSlot.title}</strong></p>
                    <p>{formatDate(request.theirSlot.startTime)} - {formatDate(request.theirSlot.endTime)}</p>
                  </div>
                  <div className="slot-info">
                    <h4>They offer:</h4>
                    <p><strong>{request.mySlot.title}</strong></p>
                    <p>{formatDate(request.mySlot.startTime)} - {formatDate(request.mySlot.endTime)}</p>
                  </div>
                </div>
                {request.status === 'PENDING' && (
                  <div className="request-actions">
                    <button
                      onClick={() => handleRespond(request.id, true)}
                      className="btn-accept"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(request.id, false)}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="requests-section">
        <h2>Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <p className="empty-state">No outgoing requests.</p>
        ) : (
          <div className="requests-list">
            {outgoing.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>Request to {request.toUser.name}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="request-details">
                  <div className="slot-info">
                    <h4>You want:</h4>
                    <p><strong>{request.theirSlot.title}</strong></p>
                    <p>{formatDate(request.theirSlot.startTime)} - {formatDate(request.theirSlot.endTime)}</p>
                  </div>
                  <div className="slot-info">
                    <h4>You offer:</h4>
                    <p><strong>{request.mySlot.title}</strong></p>
                    <p>{formatDate(request.mySlot.startTime)} - {formatDate(request.mySlot.endTime)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

