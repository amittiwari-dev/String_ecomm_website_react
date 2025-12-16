function SimpleApp() {
  console.log('SimpleApp rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        color: '#333', 
        fontSize: '2rem', 
        marginBottom: '20px' 
      }}>
        Simple App Test
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p>This is a simple test to check if React is working.</p>
        <p>Current time: {new Date().toLocaleString()}</p>
        <p>If you can see this, React is rendering properly!</p>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <h2>Debug Info:</h2>
        <ul>
          <li>React: Working ✅</li>
          <li>CSS: Working ✅</li>
          <li>JavaScript: Working ✅</li>
        </ul>
      </div>
    </div>
  );
}

export default SimpleApp;