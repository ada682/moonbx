const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let activeSessions = new Map();

io.on('connection', (socket) => {
    console.log('Client connected');
    
    activeSessions.forEach((session, sessionId) => {
        socket.emit('newCaptcha', {
            sessionId,
            type: session.type,
            captchaImage: session.captchaImage
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
    
    socket.on('captchaSolved', (data) => {
        const { sessionId, solution, type } = data;
        if (activeSessions.has(sessionId)) {
            const session = activeSessions.get(sessionId);
            clearTimeout(session.timeout);
            
            io.emit('captchaSolvedMain', {
                sessionId,
                solution,
                type
            });
            
            activeSessions.delete(sessionId);
            console.log(`Captcha solved for session ${sessionId}. Type: ${type}, Solution: ${solution}`);
        }
    });
});

app.post('/new-captcha', (req, res) => {
    const { securityCheckValidateId, sessionId, type, captchaImage } = req.body;
    
    if (activeSessions.has(sessionId)) {
        const oldSession = activeSessions.get(sessionId);
        clearTimeout(oldSession.timeout);
    }
    
    const timeout = setTimeout(() => {
        if (activeSessions.has(sessionId)) {
            activeSessions.delete(sessionId);
            io.emit('captchaTimeout', { sessionId });
        }
    }, 300000);
    
    activeSessions.set(sessionId, {
        securityCheckValidateId,
        type,
        captchaImage,
        timeout
    });
    
    io.emit('newCaptcha', { 
        sessionId, 
        type, 
        captchaImage 
    });
    
    res.sendStatus(200);
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});