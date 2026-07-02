const express = require('express');
const path = require('path');
require('dotenv').config();

const skillDonThe = require('./skillDonThe');
const skillBacLam = require('./skillBacLam');
const skillNguHanh = require('./skillNguHanh');
const skillDiemMac = require('./skillDiemMac');
const skillLongTung = require('./skillLongTung');
const skillBinhTai = require('./skillBinhTai');
const pokerDeck = require('./pokerDeck'); // Khai báo nạp từ file deck gốc

const app = express();
app.use(express.json());

const publicPath = __dirname.endsWith('src') 
  ? path.join(__dirname, 'public') 
  : path.join(__dirname, 'src', 'public');

app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/deck', (req, res) => {
  res.sendFile(path.join(publicPath, 'deck.html'));
});

const rollGenerals = [
  { id: "quan_ninh", name: "Quản Ninh", title: "Tích Cảnh Quy Nguyên", kingdom: "Quần", bg_color: "#4a4a4a", skillPool: [{ name: "Độn Thế" }] },
  { id: "chung_diem", name: "Chung Diễm", title: "Thông Tuệ Hoàng Nhã", kingdom: "Tấn", bg_color: "#5c2d91", skillPool: [{ name: "Bác Lãm" }] },
  { id: "than_ton_quyen", name: "Thần Tôn Quyền", title: "Ngự Vũ Thần Cơ", kingdom: "Thần", bg_color: "#cc9900", skillPool: [{ name: "Ngự Hành" }] },
  { id: "tran_tho", name: "Trần Thọ", title: "Chấp Bút Định Sử", kingdom: "Thục", bg_color: "#b31d1d", skillPool: [{ name: "Điểm Mặc" }] },
  { id: "quan_ninh_thuc", name: "Quản Ninh", title: "Long Tụng Cửu Châu", kingdom: "Thục", bg_color: "#b31d1d", skillPool: [{ name: "Long Tụng" }] },
  { id: "hua_thieu", name: "Hứa Thiệu", title: "Bình Đẳng Thiên Hạ", kingdom: "Quần", bg_color: "#4a4a4a", skillPool: [{ name: "Bình Tài" }] }
];

app.get('/api/generals', (req, res) => { res.json(rollGenerals); });

app.get('/api/random-three-skills', (req, res) => {
  const chosen = []; const pool = skillDonThe.slice(0);
  while (chosen.length < 3 && pool.length > 0) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  res.json(chosen);
});

app.get('/api/random-baclam-skills', (req, res) => {
  const chosen = []; const pool = skillBacLam.slice(0);
  while (chosen.length < 3 && pool.length > 0) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  res.json(chosen);
});

app.get('/api/random-nguhanh-skills', (req, res) => {
  const chosen = []; const pool = skillNguHanh.slice(0);
  while (chosen.length < 4 && pool.length > 0) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  res.json(chosen);
});

app.get('/api/random-diemmac-skills', (req, res) => {
  const chosen = []; const pool = skillDiemMac.slice(0);
  while (chosen.length < 4 && pool.length > 0) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  res.json(chosen);
});

app.get('/api/random-longtung-skill', (req, res) => {
  res.json(skillLongTung[Math.floor(Math.random() * skillLongTung.length)]);
});

app.get('/api/binhtai-pool', (req, res) => { res.json(skillBinhTai); });

// API Ma trận bài: Đã sửa trỏ đúng vào mảng pokerDeck đã export
app.get('/api/poker-matrix', (req, res) => {
  try { 
    res.json(pokerDeck); 
  } catch (error) { 
    res.status(500).json({ error: "Lỗi!" }); 
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server chạy tại: http://localhost:${PORT}`); });