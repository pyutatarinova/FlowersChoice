import cors from 'cors';

const app = express();
app.use(cors());
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.post('/api/profile', (req, res) => {
  const profile = req.body;
  console.log('Получены данные профиля:', profile);
  if (profile && profile.name) {
    console.log('Имя пользователя:', profile.name);
  }
  const filePath = path.join(__dirname, 'src', 'userProfile.json');
  // Проверяем, есть ли уже профиль
    let profiles = [];
    fs.readFile(filePath, 'utf8', async (err, data) => {
      if (!err && data) {
        try {
          const existing = JSON.parse(data);
          if (Array.isArray(existing)) {
            profiles = existing;
          } else if (existing && typeof existing === 'object' && Object.keys(existing).length > 0) {
            profiles = [existing];
          }
        } catch (e) {
          // Если не удалось распарсить, оставляем profiles пустым
        }
      }
      profiles.push(profile);
      await fs.promises.writeFile(filePath, JSON.stringify(profiles, null, 2));
      res.json({ success: true, message: 'Профиль добавлен' });
    });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
