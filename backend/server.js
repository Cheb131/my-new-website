const express = require('express');
const path = require('path');
require('dotenv').config();

// Nhập mảng kỹ năng và bộ bài Tây
const skillDonThe = require('./skillDonThe');
const skillBacLam = require('./skillBacLam');
const skillNguHanh = require('./skillNguHanh');
const skillDiemMac = require('./skillDiemMac');
const skillLongTung = require('./skillLongTung');
const skillBinhTai = require('./skillBinhTai');
const skillThienThu = require('./skillThienThu');
const skillKhacDanh = require('./skillKhacDanh');
const pokerDeck = require('./pokerDeck');

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
  { id: "than_ton_quyen", name: "Thần Tôn Quyền", title: "Tọa Đoạn Đông Nam", kingdom: "Thần", bg_color: "#cc9900", skillPool: [{ name: "Ngự Hành" }] },
  { id: "tran_tho", name: "Trần Thọ", title: "Uyên Văn Thành Chương", kingdom: "Thục", bg_color: "#b31d1d", skillPool: [{ name: "Điểm Mặc" }] },
  { id: "quan_ninh_thuc", name: "Quản Ninh", title: "Thừa Nghĩa Bỉnh Văn", kingdom: "Thục", bg_color: "#b31d1d", skillPool: [{ name: "Long Tụng" }] },
  { id: "hua_thieu", name: "Hứa Thiệu", title: "Thức Nhân Độc Tâm", kingdom: "Quần", bg_color: "#4a4a4a", skillPool: [{ name: "Bình Tài" }] },
  { id: "tu_ma_su", name: "Tư Mã Sư", title: "Duy Kỉ Thành Vụ", kingdom: "Ngụy", bg_color: "#1e3a8a", skillPool: [{ name: "Tán Sĩ"}] },
  { id: "nam_hoa_lao_tien", name: "Nam Hoa Lão Tiên", title: "Tiêu Diêu Tiên Du", kingdom: "Quần", bg_color: "#4a4a4a", skillPool: [  { name: "Thiên Thư", desc: "Giai đoạn chuẩn bị, bạn có thể kích hoạt [Thiên Thư] để rút ngẫu nhiên 3 Nguyên nhân không trùng tên, chọn lấy 1; sau đó rút ngẫu nhiên 3 Hệ quả, chọn lấy 1 để tạo thành quẻ mệnh thực thi trong lượt." } ]},
  { id: "than_tao_phi", name: "Thần Tào Phi", title: "Nguyệt Hối Thư Luân Hồi", kingdom: "Thần", bg_color: "#cc9900", skillPool: [{ name: "Khắc Danh" }]},
  { id: "tao_thuc", name: "Tào Thực", title: "Sấu Luật Thành Chương", kingdom: "Ngụy", bg_color: "#1e3a8a", skillPool: [{ name: "Nhạc Phú" }]},,
  { id: "quan_vu_vo", name: "Quan Vũ", title: "Nghĩa Võ Thiên Thu", kingdom: "Thục", bg_color: "#b31d1d",skillPool: [{ name: "Võ Hữu" }]}
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

app.get('/api/poker-matrix', (req, res) => {
  try { res.json(pokerDeck); } catch (error) { res.status(500).json({ error: "Lỗi!" }); }
});

app.get('/api/thienthu-causes', (req, res) => {
  try {
    
    const uniqueCausesPool = Array.from(new Map(skillThienThu.causes.map(item => [item.name, item])).values());

    if (uniqueCausesPool.length < 3) {
      return res.status(500).json({ error: "Kho Nguyên nhân sau khi lọc trùng không đủ 3 phần tử!" });
    }

    const chosenCauses = [];
    const poolCopy = uniqueCausesPool.slice(0);

    while (chosenCauses.length < 3 && poolCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      chosenCauses.push(poolCopy.splice(randomIndex, 1)[0]);
    }
    res.json(chosenCauses);
  } catch (error) {
    res.status(500).json({ error: "Lỗi Backend bốc Nguyên nhân!" });
  }
});

app.get('/api/thienthu-effects', (req, res) => {
  try {
    if (!skillThienThu.effects || skillThienThu.effects.length < 3) {
      return res.status(500).json({ error: "Kho Hệ quả không đủ dữ liệu!" });
    }

    const chosenEffects = [];
    const poolCopy = skillThienThu.effects.slice(0);

    while (chosenEffects.length < 3 && poolCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      chosenEffects.push(poolCopy.splice(randomIndex, 1)[0]);
    }
    res.json(chosenEffects);
  } catch (error) {
    res.status(500).json({ error: "Lỗi Backend bốc Hệ quả!" });
  }
});

app.get('/api/random-khacdanh-skill', (req, res) => {
  try {
    if (!skillKhacDanh || skillKhacDanh.length === 0) return res.status(500).json({ error: "Kho Khắc Danh trống!" });
    const randomIndex = Math.floor(Math.random() * skillKhacDanh.length);
    res.json(skillKhacDanh[randomIndex]);
  } catch (error) {
    res.status(500).json({ error: "Lỗi Backend!" });
  }
});

app.get('/api/vohuu-cards', (req, res) => {
  try {
    const nonEquipmentPool = [];
    
    // Duyệt qua toàn bộ ma trận bài, lọc bỏ loại trang bị (trangbi)
    pokerDeck.forEach(cell => {
      if (cell.cards && cell.cards.length > 0) {
        cell.cards.forEach((card, cardIndex) => {
          if (card.type !== 'trangbi') {
            nonEquipmentPool.push({
              number: cell.number,
              suit: cell.suit,
              name: card.name,
              type: card.type,
              // Tạo định danh duy nhất (cardKey) khớp với định dạng trong deckScript.js
              cardKey: `${cell.number}_${cell.suit}_${card.name}_${cardIndex}`
            });
          }
        });
      }
    });

    if (nonEquipmentPool.length < 5) {
      return res.status(500).json({ error: "Không đủ bài phi trang bị!" });
    }

    // Bốc ngẫu nhiên 5 lá bài không trùng nhau
    const chosenCards = [];
    const poolCopy = nonEquipmentPool.slice(0);
    while (chosenCards.length < 5 && poolCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      chosenCards.push(poolCopy.splice(randomIndex, 1)[0]);
    }

    res.json(chosenCards);
  } catch (error) {
    res.status(500).json({ error: "Lỗi Backend bốc bài Võ Hữu!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server chạy tại: http://localhost:${PORT}`); });