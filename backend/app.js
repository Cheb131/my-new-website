const express = require('express');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const publicPath = __dirname.endsWith('src') 
  ? path.join(__dirname, 'public') 
  : path.join(__dirname, 'src', 'public');

app.use(express.static(publicPath));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/api/generals', async (req, res) => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'generals'
      );
    `);

    if (tableCheck.rows[0].exists) {
      const result = await pool.query('SELECT * FROM generals ORDER BY id ASC');
      return res.json(result.rows);
    }

    // Data dự phòng nếu bảng trống
    const mockData = [
      {
        id: "than_hoa_da",
        name: "Thần Hoa Đà",
        title: "Hoàn Đạo",
        kingdom: "Thần",
        bg_color: "#4c1d95",
        skill_pool: [
          { name: "Cấp Cứu", desc: "Trong lượt của nhân vật khác, bạn có thể dùng 1 lá bài Đỏ bất kỳ làm lá [Đào]." }
        ]
      }
    ];
    res.json(mockData);
  } catch (err) {
    res.json([
      {
        id: "than_hoa_da",
        name: "Thần Hoa Đà",
        title: "Hoàn Đạo",
        kingdom: "Thần",
        bg_color: "#4c1d95",
        skill_pool: [{ name: "Cấp Cứu", desc: "Dùng bài đỏ làm Đào." }]
      }
    ]);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🔥 DỰ ÁN NEON DB ĐÃ KHỞI ĐỘNG THÀNH CÔNG!`);
  console.log(`🔗 Link: http://localhost:${PORT}`);
  console.log(`==================================================`);
});