const express = require('express');
const path = require('path');
require('dotenv').config();

// Nhập mảng kỹ năng từ các file dữ liệu tương ứng
const skillDonThe = require('./skillDonThe');
const skillBacLam = require('./skillBacLam');
const skillNguHanh = require('./skillNguHanh');
const skillDiemMac = require('./skillDiemMac');
const skillLongTung = require('./skillLongTung');
const skillBinhTai = require('./skillBinhTai');

const app = express();
app.use(express.json());

// TỰ ĐỘNG ĐỊNH VỊ THƯ MỤC PUBLIC CHUẨN XÁC
const publicPath = __dirname.endsWith('src') 
  ? path.join(__dirname, 'public') 
  : path.join(__dirname, 'src', 'public');

app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Danh sách Võ Tướng hiển thị trên giao diện
const rollGenerals = [
  {
    id: "quan_ninh",
    name: "Quản Ninh",
    title: "Tích Cảnh Quy Nguyên",
    kingdom: "Quần",
    bg_color: "#4a4a4a", 
    skillPool: [
      { name: "Độn Thế", desc: "Mỗi lượt chơi giới hạn một lần, bạn có thể xem như sử dụng hoặc đánh ra một lá [Sát], [Thiểm], [Đào] hoặc [Tửu]. Sau đó khi người chơi đang có lượt gây ra sát thương lần tiếp theo, bạn lựa chọn hai hạng mục: 1. Ngăn chặn sát thương này, lựa chọn một kỹ năng có chứa “Nhân, Nghĩa, Lễ, Trí, Tín” trong tên kỹ năng, lệnh người đó nhận lấy; 2. Tự giảm 1 điểm giới hạn sinh lực đồng thời rút X lá bài (X là số lần bạn đã chọn mục số 3); 3. Xóa bỏ tên lá bài mà bạn vừa xem như sử dụng.." }
    ]
  },
  {
    id: "chung_diem",
    name: "Chung Diễm",
    title: "Thông Tuệ Hoàng Nhã",
    kingdom: "Tấn",
    bg_color: "#5c2d91", 
    skillPool: [
      { name: "Bác Lãm", desc: "Khi bắt đầu giai đoạn hành động hoặc giai đoạn hành động của người khác giới hạn 1 lần, người chơi đang có lượt có thể mất 1 sinh lực (nếu người đang có lượt là bạn thì không cần mất sinh lực), lệnh bạn chọn 1 trong 3 kỹ năng có mô tả giai đoạn hành động giới hạn 1 lần người đang có lượt xem như sở hữu kỹ năng này." }
    ]
  },
  {
    id: "than_ton_quyen",
    name: "Thần Tôn Quyền",
    title: "Ngự Vũ Thần Cơ",
    kingdom: "Thần",
    bg_color: "#cc9900", 
    skillPool: [
      { name: "Ngự Hành", desc: "Tỏa định kĩ Đầu lượt của bạn, bạn bỏ tùy ý bài có chất khác nhau, ngẫu nhiên đạt được lượng kỹ năng tương ứng của thế lực Ngô; Kết thúc lượt, bạn mất toàn bộ kỹ năng đã nhận bằng cách này, sau đó rút lượng bài tương đương." }
    ]
  },
  {
    id: "tran_tho",
    name: "Trần Thọ",
    title: "Chấp Bút Định Sử",
    kingdom: "Thục",
    bg_color: "#b31d1d", 
    skillPool: [
      { name: "Điểm Mặc", desc: "Giai đoạn chuẩn bị hoặc sau khi bạn nhận sát thương lần đầu mỗi lượt, bạn có thể xem 2 kỹ năng cho phép chuyển hóa bài, lựa chọn thu lấy 1 trong số đó (tối đa sở hữu 4 kỹ năng) hoặc thay thế một kỹ năng đã thu bằng cách này, sau đó rút 4-X lá bài (X là số kỹ năng đang có bằng cách này)." }
    ]
  },
  {
    id: "quan_ninh_thuc",
    name: "Quản Ninh",
    title: "Long Tụng Cửu Châu",
    kingdom: "Thục",
    bg_color: "#b31d1d", 
    skillPool: [
      { name: "Long Tụng", desc: "Khi mở đầu giai đoạn hành động, bạn có thể: Giao cho một người chơi khác một lá bài màu Đỏ; Hoặc thu lấy của người chơi khác một lá bài màu Đỏ. Sau đó giai đoạn hiện tại bạn nhận được một kỹ năng Giai đoạn hành động (ưu tiên nhận được kỹ năng của người này, chỉ được phát động một lần)." }
    ]
  },
  {
    id: "hua_thieu",
    name: "Hứa Thiệu",
    title: "Bình Đẳng Thiên Hạ",
    kingdom: "Quần",
    bg_color: "#4a4a4a", 
    skillPool: [
      { name: "Bình Tài", desc: "Bạn có thể phát động “Bình Tiến” vào những thời điểm sau: Giai đoạn hành động giới hạn một lần, khi mở đầu giai đoạn kết thúc, sau khi bạn nhận sát thương. Bạn có thể phát động kỹ năng của bài võ tướng xuất hiện ngẫu nhiên (3 lá trong những võ tướng bạn đã sở hữu) vào những thời điểm này, bạn lựa chọn một võ tướng trong đó và phát động kỹ năng của nó. Mỗi kỹ năng chỉ phát động một lần.." }
    ]
  }
];

app.get('/api/generals', (req, res) => {
  res.json(rollGenerals);
});

// API Độn Thế (Bốc 3)
app.get('/api/random-three-skills', (req, res) => {
  try {
    if (!skillDonThe || skillDonThe.length < 3) return res.status(500).json({ error: "Kho dữ liệu trống!" });
    const chosenSkills = []; const poolCopy = skillDonThe.slice(0);
    while (chosenSkills.length < 3 && poolCopy.length > 0) {
      chosenSkills.push(poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0]);
    }
    res.json(chosenSkills);
  } catch (error) { res.status(500).json({ error: "Lỗi Backend!" }); }
});

// API Bác Lãm (Bốc 3)
app.get('/api/random-baclam-skills', (req, res) => {
  try {
    if (!skillBacLam || skillBacLam.length < 3) return res.status(500).json({ error: "Kho dữ liệu trống!" });
    const chosenSkills = []; const poolCopy = skillBacLam.slice(0);
    while (chosenSkills.length < 3 && poolCopy.length > 0) {
      chosenSkills.push(poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0]);
    }
    res.json(chosenSkills);
  } catch (error) { res.status(500).json({ error: "Lỗi Backend!" }); }
});

// API Ngự Hành (Bốc 4)
app.get('/api/random-nguhanh-skills', (req, res) => {
  try {
    if (!skillNguHanh || skillNguHanh.length < 4) return res.status(500).json({ error: "Kho dữ liệu trống!" });
    const chosenSkills = []; const poolCopy = skillNguHanh.slice(0);
    while (chosenSkills.length < 4 && poolCopy.length > 0) {
      chosenSkills.push(poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0]);
    }
    res.json(chosenSkills);
  } catch (error) { res.status(500).json({ error: "Lỗi Backend!" }); }
});

// API Điểm Mặc (Bốc 4)
app.get('/api/random-diemmac-skills', (req, res) => {
  try {
    if (!skillDiemMac || skillDiemMac.length < 4) return res.status(500).json({ error: "Kho dữ liệu trống!" });
    const chosenSkills = []; const poolCopy = skillDiemMac.slice(0);
    while (chosenSkills.length < 4 && poolCopy.length > 0) {
      chosenSkills.push(poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0]);
    }
    res.json(chosenSkills);
  } catch (error) { res.status(500).json({ error: "Lỗi Backend!" }); }
});

// API Long Tụng (Bốc 1 lấy luôn)
app.get('/api/random-longtung-skill', (req, res) => {
  try {
    if (!skillLongTung || skillLongTung.length === 0) return res.status(500).json({ error: "Kho Long Tụng trống!" });
    const randomIndex = Math.floor(Math.random() * skillLongTung.length);
    res.json(skillLongTung[randomIndex]);
  } catch (error) { res.status(500).json({ error: "Lỗi Backend!" }); }
});

// API Bình Tài: Trả về toàn bộ dữ liệu gốc để Frontend tự bốc/xóa bài cục bộ
app.get('/api/binhtai-pool', (req, res) => {
  try {
    res.json(skillBinhTai);
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống Backend không thể tải kho bài!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});