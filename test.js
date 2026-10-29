import express from 'express'; const app = express(); const server = app.listen(3001, () => { console.log('Test server running'); }); console.log(server.listening);
