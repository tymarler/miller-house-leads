const http = require('http');

// Test the leads endpoint
console.log('Testing /api/leads endpoint...');
http.get('http://localhost:3001/api/leads', (res) => {
  let data = '';
  
  // A chunk of data has been received.
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // The whole response has been received.
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Response data:', data);
    
    // Test the appointments endpoint
    console.log('\nTesting /api/appointments endpoint...');
    http.get('http://localhost:3001/api/appointments', (res2) => {
      let data2 = '';
      
      res2.on('data', (chunk) => {
        data2 += chunk;
      });
      
      res2.on('end', () => {
        console.log('Status code:', res2.statusCode);
        console.log('Headers:', JSON.stringify(res2.headers, null, 2));
        
        try {
          const parsedData = JSON.parse(data2);
          console.log('Response data successfully parsed as JSON');
          console.log('Success:', parsedData.success);
          console.log('Data length:', parsedData.data ? parsedData.data.length : 0);
        } catch (e) {
          console.log('Error parsing JSON:', e.message);
          console.log('Raw data:', data2);
        }
      });
    }).on('error', (err) => {
      console.log('Error testing appointments endpoint:', err.message);
    });
  });
}).on('error', (err) => {
  console.log('Error testing leads endpoint:', err.message);
}); 