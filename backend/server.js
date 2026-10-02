import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Confianza en el Proxy (Traefik/Dokploy) para Rate Limit real
app.set('trust proxy', 1);

// Seguridad de Headers y Encriptación HSTS (Fuerza TLS/SSL)
app.use(helmet({
    contentSecurityPolicy: false, // Desactivado temporalmente para no bloquear scripts en línea actuales
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS restringido
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://srmartinez.site' : '*',
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Límite de payload para evitar DoS
app.use(cookieParser());

// Limitadores de Tasa (Rate Limiting)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Límite de 200 peticiones por IP por ventana
    message: { error: 'Demasiadas peticiones, intente más tarde.' }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Solo 5 intentos de login fallidos/exitosos por IP cada 15 min (Previene Fuerza Bruta)
    message: { error: 'Demasiados intentos de login. Bloqueado temporalmente.' }
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30, // Solo 30 subidas/ediciones por hora por IP
    message: { error: 'Límite de subida de diseños alcanzado por esta hora.' }
});

// Credenciales
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal';

// Middleware de autenticación
const verifyAuth = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'No autorizado' });

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Autenticación Endpoints
app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('auth_token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production' || process.env.VIRTUAL_HOST !== undefined, 
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

app.get('/api/check-auth', apiLimiter, verifyAuth, (req, res) => {
    res.json({ success: true, user: ADMIN_USER });
});

// Base de datos persistente
const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'designs.json');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(dbPath)) {
    const seedData = [
      {
        "id": "1",
        "title": "Akuma Motors Club",
        "description": "Organización Delictual. Renombre, identidad y respeto en las calles.",
        "gender": "Hombre",
        "videoUrl": "/videos clothes/akuma motors/hombre/Video Project (2).mp4",
        "logoUrl": "/videos clothes/akuma motors/akuma.png",
        "discordUrl": "https://discord.com/users/682328456746631340"
      },
      {
        "id": "2",
        "title": "Benny's Motor Works",
        "description": "Taller Mecánico. Indumentaria que resalta calidad y excelencia en el servicio.",
        "gender": "Hombre",
        "videoUrl": "/videos clothes/benny's/hombre/Video Project (1).mp4",
        "logoUrl": "/videos clothes/benny's/bennys.png",
        "discordUrl": "https://discord.com/users/682328456746631340"
      }
    ];
    fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2), 'utf8');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const title = req.body.title ? req.body.title.toLowerCase().trim() : 'nuevo_diseno';
        const gender = req.body.gender ? req.body.gender.toLowerCase() : 'hombre';
        
        let destPath = path.join(__dirname, 'uploads', title);
        if (file.fieldname === 'videoFile') destPath = path.join(destPath, gender);
        fs.mkdirSync(destPath, { recursive: true });
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.fieldname === 'videoFile' ? `video_${Date.now()}` : `logo_${Date.now()}`;
        cb(null, `${name}${ext}`);
    }
});
const upload = multer({ storage });

// API Endpoints PÚBLICOS
app.get('/api/designs', apiLimiter, (req, res) => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: "Error leyendo la base de datos" });
    }
});

// API Endpoints PRIVADOS
app.post('/api/upload', verifyAuth, uploadLimiter, upload.fields([{ name: 'videoFile' }, { name: 'logoFile' }]), (req, res) => {
    try {
        const { title, description, gender } = req.body;
        const videoFile = req.files['videoFile'][0];
        const logoFile = req.files['logoFile'][0];

        const orgFolder = title.toLowerCase().trim();
        const genderFolder = gender.toLowerCase();
        
        const videoUrl = `/uploads/${orgFolder}/${genderFolder}/${videoFile.filename}`;
        const logoUrl = `/uploads/${orgFolder}/${logoFile.filename}`;

        const newDesign = {
            id: Date.now().toString(), title, description, gender, videoUrl, logoUrl,
            discordUrl: "https://discord.com/users/682328456746631340"
        };

        const currentData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        currentData.unshift(newDesign);
        fs.writeFileSync(dbPath, JSON.stringify(currentData, null, 2));

        res.json({ success: true, design: newDesign });
    } catch (error) {
        res.status(500).json({ error: "Fallo interno al guardar los archivos" });
    }
});

app.delete('/api/designs/:id', verifyAuth, apiLimiter, (req, res) => {
    try {
        const id = req.params.id;
        let currentData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const filteredData = currentData.filter(d => d.id !== id);
        fs.writeFileSync(dbPath, JSON.stringify(filteredData, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Error al borrar el diseño" });
    }
});

app.put('/api/designs/:id', verifyAuth, uploadLimiter, upload.fields([{ name: 'videoFile' }, { name: 'logoFile' }]), (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, gender } = req.body;
        let currentData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const index = currentData.findIndex(d => d.id === id);
        
        if (index > -1) {
            currentData[index].title = title || currentData[index].title;
            currentData[index].description = description || currentData[index].description;
            currentData[index].gender = gender || currentData[index].gender;
            
            if (req.files && req.files['videoFile']) {
                const videoFile = req.files['videoFile'][0];
                const orgFolder = currentData[index].title.toLowerCase().trim();
                const genderFolder = currentData[index].gender.toLowerCase();
                currentData[index].videoUrl = `/uploads/${orgFolder}/${genderFolder}/${videoFile.filename}`;
            }

            if (req.files && req.files['logoFile']) {
                const logoFile = req.files['logoFile'][0];
                const orgFolder = currentData[index].title.toLowerCase().trim();
                currentData[index].logoUrl = `/uploads/${orgFolder}/${logoFile.filename}`;
            }

            fs.writeFileSync(dbPath, JSON.stringify(currentData, null, 2));
            res.json({ success: true, design: currentData[index] });
        } else {
            res.status(404).json({ error: "Diseño no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al editar el diseño" });
    }
});

app.use((req, res, next) => {
    if (req.path === '/design-upload.html' || req.path === '/design-dashboard.html') {
        const token = req.cookies.auth_token;
        if (!token) return res.redirect('/login.html');
        try {
            jwt.verify(token, JWT_SECRET);
            return next();
        } catch (e) {
            return res.redirect('/login.html');
        }
    }
    next();
});

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Backend de SrMartinez corriendo en el puerto ${PORT}`);
});
