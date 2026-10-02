import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuracion de subida de archivos (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const title = req.body.title ? req.body.title.toLowerCase().trim() : 'nuevo_diseno';
        const gender = req.body.gender ? req.body.gender.toLowerCase() : 'hombre';
        
        // Guardamos en backend/uploads para que no se borren
        let destPath = path.join(__dirname, 'uploads', title);
        
        if (file.fieldname === 'videoFile') {
            destPath = path.join(destPath, gender);
        }

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

// API Endpoints
const dbPath = path.join(__dirname, 'data/designs.json');

app.get('/api/designs', (req, res) => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: "Error leyendo la base de datos" });
    }
});

app.post('/api/upload', upload.fields([{ name: 'videoFile' }, { name: 'logoFile' }]), (req, res) => {
    try {
        const { title, description, gender } = req.body;
        const videoFile = req.files['videoFile'][0];
        const logoFile = req.files['logoFile'][0];

        const orgFolder = title.toLowerCase().trim();
        const genderFolder = gender.toLowerCase();
        
        const videoUrl = `/uploads/${orgFolder}/${genderFolder}/${videoFile.filename}`;
        const logoUrl = `/uploads/${orgFolder}/${logoFile.filename}`;

        const newDesign = {
            id: Date.now().toString(),
            title,
            description,
            gender,
            videoUrl,
            logoUrl,
            discordUrl: "https://discord.com/users/682328456746631340"
        };

        const currentData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        currentData.unshift(newDesign);
        fs.writeFileSync(dbPath, JSON.stringify(currentData, null, 2));

        res.json({ success: true, design: newDesign });
    } catch (error) {
        console.error("Error procesando subida:", error);
        res.status(500).json({ error: "Fallo interno al guardar los archivos" });
    }
});

app.delete('/api/designs/:id', (req, res) => {
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

app.put('/api/designs/:id', (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, gender } = req.body;
        let currentData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const index = currentData.findIndex(d => d.id === id);
        
        if (index > -1) {
            currentData[index].title = title || currentData[index].title;
            currentData[index].description = description || currentData[index].description;
            currentData[index].gender = gender || currentData[index].gender;
            fs.writeFileSync(dbPath, JSON.stringify(currentData, null, 2));
            res.json({ success: true, design: currentData[index] });
        } else {
            res.status(404).json({ error: "Diseño no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al editar el diseño" });
    }
});

// Servir frontend compilado
app.use(express.static(path.join(__dirname, '../dist')));

// Servir carpeta de subidas persistentes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback para SPA routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Backend de SrMartinez corriendo en el puerto ${PORT}`);
});

