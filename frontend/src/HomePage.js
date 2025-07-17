import React from 'react';

function HomePage() {
  return (
    <div style={pageStyle}>
      <h2 style={headingStyle}>Welcome to Shared Shopping List!</h2>
      <p style={paragraphStyle}>
        This application allows you to create and manage shopping lists in real-time.
        You can share lists with friends and family to collaborate on your grocery needs.
      </p>
      <p style={paragraphStyle}>
        Get started by creating a new list or joining an existing one from the "My Lists" page.
      </p>
      <div style={featureSectionStyle}>
        <h3 style={subHeadingStyle}>Key Features:</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>Real-time updates for shared lists</li>
          <li style={listItemStyle}>Create and manage your own shopping lists</li>
          <li style={listItemStyle}>Join lists shared by others</li>
          <li style={listItemStyle}>Add, remove, and toggle items as completed</li>
        </ul>
      </div>
    </div>
  );
}

const pageStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  marginTop: '20px',
  textAlign: 'center',
};

const headingStyle = {
  color: '#333',
  fontSize: '2.5em',
  marginBottom: '20px',
};

const paragraphStyle = {
  color: '#555',
  fontSize: '1.1em',
  lineHeight: '1.6',
  marginBottom: '15px',
};

const featureSectionStyle = {
  marginTop: '40px',
  borderTop: '1px solid #eee',
  paddingTop: '30px',
};

const subHeadingStyle = {
  color: '#444',
  fontSize: '1.8em',
  marginBottom: '15px',
};

const listStyle = {
  listStyleType: 'none',
  padding: 0,
  maxWidth: '600px',
  margin: '0 auto',
};

const listItemStyle = {
  backgroundColor: '#f8f9fa',
  padding: '12px 15px',
  marginBottom: '8px',
  borderRadius: '5px',
  border: '1px solid #e2e6ea',
  fontSize: '1.05em',
  color: '#333',
  textAlign: 'left',
};

export default HomePage;
