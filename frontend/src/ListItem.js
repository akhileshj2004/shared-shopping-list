import React from 'react';

function ListItem({ item, onRemove, onToggle }) {
  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Use toLocaleString for better readability, specifying options for consistency
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 15px',
        borderBottom: '1px solid #eee',
        backgroundColor: item.checked ? '#e6f7ff' : 'white', // Lighter blue for checked
        textDecoration: item.checked ? 'line-through' : 'none',
        color: item.checked ? '#666' : '#333',
        borderRadius: '5px',
        marginBottom: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          style={{ marginRight: '15px', transform: 'scale(1.3)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '1.1em' }}>{item.text}</span>
      </div>
      <div style={{ fontSize: '0.8em', color: '#888', textAlign: 'right', display: 'flex', alignItems: 'center' }}>
        {item.timestamp && (
          <div style={{ marginRight: '10px' }}>
            <small>Updated: {formatTimestamp(item.timestamp)}</small>
          </div>
        )}
        <button
          onClick={() => onRemove(item.id)}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9em',
            transition: 'background-color 0.2s ease',
          }}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export default ListItem;
