import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import ListItem from './ListItem';

function ShoppingList({ socket, currentUserId, ownedLists }) { // Removed listId prop
  const { listId } = useParams(); // Get listId from URL parameters
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [usernameToShare, setUsernameToShare] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Determine if the currently active list is owned by the logged-in user
  const isOwnedList = ownedLists.some(list => list.id === listId && list.owner_id === currentUserId);

  useEffect(() => {
    if (listId && socket) {
      // Clear previous messages
      setMessage('');
      setIsError(false);

      socket.emit('joinList', listId);

      socket.on('listUpdate', (updatedList) => {
        setItems(updatedList);
      });

      socket.on('error', (msg) => {
        setMessage(`Error: ${msg}`);
        setIsError(true);
      });

      socket.on('shareSuccess', (msg) => {
        setMessage(msg);
        setIsError(false);
        setUsernameToShare(''); // Clear input after successful share
      });

      return () => {
        socket.off('listUpdate');
        socket.off('error');
        socket.off('shareSuccess');
      };
    }
  }, [socket, listId, currentUserId]); // currentUserId added to dependency array

  const handleAddItem = (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    if (newItemText.trim() && listId && socket) {
      socket.emit('addItem', { listId, text: newItemText.trim() });
      setNewItemText('');
    } else {
      setMessage('Please enter an item and ensure you are connected to a list.');
      setIsError(true);
    }
  };

  const handleRemoveItem = (itemId) => {
    setMessage('');
    setIsError(false);
    if (listId && socket) {
      socket.emit('removeItem', { listId, itemId });
    }
  };

  const handleToggleItem = (itemId) => {
    setMessage('');
    setIsError(false);
    if (listId && socket) {
      socket.emit('toggleItem', { listId, itemId });
    }
  };

  const handleShareList = () => {
    setMessage('');
    setIsError(false);
    if (usernameToShare.trim() && listId && socket) {
      socket.emit('shareList', { listId, usernameToShareWith: usernameToShare.trim() });
    } else {
      setMessage('Please enter a username to share with.');
      setIsError(true);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold', marginBottom: '15px' }}>
          {message}
        </p>
      )}

      <form onSubmit={handleAddItem} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add a new item"
          style={{ padding: '10px', flexGrow: 1, borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 18px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>Add Item</button>
      </form>

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {items.length === 0 ? (
          <p style={{ color: '#666' }}>No items in this list yet. Add some!</p>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              onRemove={handleRemoveItem}
              onToggle={handleToggleItem}
            />
          ))
        )}
      </ul>

      {isOwnedList && (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <h3 style={{ color: '#333' }}>Share This List</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={usernameToShare}
              onChange={(e) => setUsernameToShare(e.target.value)}
              placeholder="Enter username to share with"
              style={{ padding: '10px', flexGrow: 1, borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <button onClick={handleShareList} style={{ padding: '10px 18px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}>Share List</button>
          </div>
          <p style={{ fontSize: '0.9em', color: '#888', marginTop: '10px' }}>
            Only users who own this list can share it.
          </p>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;
