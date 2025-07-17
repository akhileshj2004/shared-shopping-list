import React from 'react';

function AboutPage() {
  return (
    <div style={pageStyle}>
      <h2 style={headingStyle}>About Shared Shopping List</h2>
      <p style={paragraphStyle}>
        This application was built as a demonstration of a real-time collaborative web application
        using React for the frontend and Socket.IO for instant communication.
      </p>
      <p style={paragraphStyle}>
        Our goal is to provide a seamless experience for managing shared lists, ensuring
        everyone involved has the most up-to-date information at their fingertips.
      </p>
      <div style={contactSectionStyle}>
        <h3 style={subHeadingStyle}>Contact Us</h3>
        <p style={paragraphStyle}>
          If you have any questions or feedback, please reach out to us at{' '}
          <a href="mailto:support@example.com" style={linkStyle}>support@example.com</a>.
        </p>
      </div>
      <div style={techStackSectionStyle}>
        <h3 style={subHeadingStyle}>Technologies Used:</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}><strong>Frontend:</strong> React.js</li>
          <li style={listItemStyle}><strong>Real-time Communication:</strong> Socket.IO</li>
          <li style={listItemStyle}><strong>Routing:</strong> React Router Dom</li>
          <li style={listItemStyle}><strong>Backend:</strong> (Assumed Node.js/Express with Socket.IO)</li>
          <li style={listItemStyle}><strong>Database:</strong> (Assumed PostgreSQL/MongoDB)</li>
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

const contactSectionStyle = {
  marginTop: '30px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
};

const techStackSectionStyle = {
  marginTop: '30px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
};

const subHeadingStyle = {
  color: '#444',
  fontSize: '1.8em',
  marginBottom: '15px',
};

const linkStyle = {
  color: '#007bff',
  textDecoration: 'none',
};

const listStyle = {
  listStyleType: 'none',
  padding: 0,
  maxWidth: '600px',
  margin: '0 auto',
};

const listItemStyle = {
  backgroundColor: '#f8f9fa',
  padding: '10px 15px',
  marginBottom: '5px',
  borderRadius: '5px',
  border: '1px solid #e2e6ea',
  fontSize: '1.05em',
  color: '#333',
  textAlign: 'left',
};

export default AboutPage;
