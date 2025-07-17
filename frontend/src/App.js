import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import Router components
import Login from './Login';
import Register from './Register';
import ShoppingList from './ShoppingList';
import HomePage from './HomePage'; // New: Import HomePage
import AboutPage from './AboutPage'; // New: Import AboutPage

// Main App component that handles routing based on authentication state
function AppContent() {
  const { user, socket, authLoading, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentListId, setCurrentListId] = useState('');
  const [inputListId, setInputListId] = useState('');
  const [userMessages, setUserMessages] = useState([]); // For displaying system messages to user
  const [ownedLists, setOwnedLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    if (socket && user) {
      // Request user's lists when socket connects or user logs in
      socket.emit('getUsersLists');

      socket.on('usersLists', ({ owned, shared }) => {
        setOwnedLists(owned);
        setSharedLists(shared);
        // If no list is selected, default to the first owned list if available
        if (!currentListId && owned.length > 0) {
          setCurrentListId(owned[0].id);
        } else if (!currentListId && shared.length > 0) {
          setCurrentListId(shared[0].id);
        }
      });

      socket.on('error', (message) => {
        setUserMessages(prev => [...prev, { text: `Error: ${message}`, type: 'error' }]);
      });

      socket.on('shareSuccess', (message) => {
        setUserMessages(prev => [...prev, { text: message, type: 'success' }]);
        // Re-fetch lists after sharing to update UI
        socket.emit('getUsersLists');
      });

      return () => {
        socket.off('usersLists');
        socket.off('error');
        socket.off('shareSuccess');
      };
    }
  }, [socket, user, currentListId]);

  if (authLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5em' }}>Loading authentication...</div>;
  }

  // If user is not authenticated, show Login or Register pages
  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="*" element={<Login onSwitchToRegister={() => navigate('/register')} />} /> {/* Default to login */}
      </Routes>
    );
  }

  const handleCreateList = () => {
    const listName = prompt("Enter a name for your new shopping list:", "My New List");
    if (listName) {
      if (socket) {
        socket.emit('createList', { listName });
        setUserMessages(prev => [...prev, { text: `Requesting to create list: ${listName}...`, type: 'info' }]);
      } else {
        setUserMessages(prev => [...prev, { text: 'Socket not connected. Please try again.', type: 'error' }]);
      }
    }
  };

  const handleJoinList = () => {
    if (inputListId.trim()) {
      setCurrentListId(inputListId.trim());
      setUserMessages([]); // Clear messages when joining
      navigate(`/list/${inputListId.trim()}`); // Navigate to the specific list
    } else {
      setUserMessages(prev => [...prev, { text: "Please enter a List ID to join.", type: 'error' }]);
    }
  };

  const handleListSelect = (listId) => {
    setCurrentListId(listId);
    navigate(`/list/${listId}`); // Navigate to the selected list
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Shared Shopping List</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '15px', fontWeight: 'bold', color: '#555' }}>Logged in as: {user.username}</span>
          <button onClick={logout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <Link to="/" style={navLinkStyle}>Home</Link>
        <Link to="/lists" style={navLinkStyle}>My Lists</Link>
        <Link to="/about" style={navLinkStyle}>About</Link>
      </nav>
      {/* End Navigation Links */}

      {userMessages.map((msg, index) => (
        <p key={index} style={{ color: msg.type === 'error' ? 'red' : (msg.type === 'success' ? 'green' : 'blue'), fontWeight: 'bold' }}>{msg.text}</p>
      ))}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/lists" element={
          <>
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
              <h2 style={{ marginTop: 0, color: '#444' }}>Manage Lists</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                <button onClick={handleCreateList} style={{ padding: '10px 18px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>Create New List</button>
                <input
                  type="text"
                  placeholder="Enter List ID to join"
                  value={inputListId}
                  onChange={(e) => setInputListId(e.target.value)}
                  style={{ padding: '8px', flexGrow: 1, minWidth: '200px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <button onClick={handleJoinList} style={{ padding: '10px 18px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>Join List</button>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '280px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>Your Owned Lists ({ownedLists.length})</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {ownedLists.length === 0 ? (
                      <p style={{ color: '#666' }}>No lists owned yet.</p>
                    ) : (
                      ownedLists.map(list => (
                        <li key={list.id}
                            onClick={() => handleListSelect(list.id)}
                            style={{
                              padding: '8px 10px',
                              marginBottom: '5px',
                              backgroundColor: currentListId === list.id ? '#e0f7fa' : '#f8f8f8',
                              border: currentListId === list.id ? '1px solid #00bcd4' : '1px solid #eee',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background-color 0.2s ease',
                            }}>
                          <span>{list.name} <small style={{ color: '#888' }}>({list.id.substring(0, 6)}...)</small></span>
                          {list.owner_id === user.id && <span style={{ fontSize: '0.8em', color: '#007bff' }}>(You)</span>}
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div style={{ flex: '1', minWidth: '280px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>Lists Shared With You ({sharedLists.length})</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {sharedLists.length === 0 ? (
                      <p style={{ color: '#666' }}>No lists shared with you.</p>
                    ) : (
                      sharedLists.map(list => (
                        <li key={list.id}
                            onClick={() => handleListSelect(list.id)}
                            style={{
                              padding: '8px 10px',
                              marginBottom: '5px',
                              backgroundColor: currentListId === list.id ? '#e0f7fa' : '#f8f8f8',
                              border: currentListId === list.id ? '1px solid #00bcd4' : '1px solid #eee',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background-color 0.2s ease',
                            }}>
                          <span>{list.name} <small style={{ color: '#888' }}>(by {list.owner_username})</small></span>
                          <span style={{ fontSize: '0.8em', color: '#666' }}>({list.id.substring(0, 6)}...)</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        } />
        {/* Route for a specific shopping list */}
        <Route path="/list/:listId" element={
          currentListId && (
            <>
              <h2 style={{ color: '#333' }}>Active List ID: <span style={{ color: '#007bff' }}>{currentListId}</span></h2>
              {socket ? (
                <ShoppingList socket={socket} listId={currentListId} currentUserId={user.id} ownedLists={ownedLists} />
              ) : (
                <p style={{ color: 'red' }}>Connecting to real-time updates...</p>
              )}
            </>
          )
        } />
      </Routes>
    </div>
  );
}

// Wrapper to provide AuthContext to the entire application
function App() {
  return (
    <AuthProvider>
      <Router> {/* Wrap AppContent with Router */}
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

const navLinkStyle = {
  textDecoration: 'none',
  color: '#007bff',
  fontWeight: 'bold',
  padding: '8px 12px',
  borderRadius: '5px',
  transition: 'background-color 0.3s ease',
};

// You might want to add a hover effect with CSS for navLinkStyle in index.css
// navLinkStyle:hover { background-color: #e9ecef; }

export default App;
