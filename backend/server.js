const express = require('express');
const path = require('path');
require('dotenv').config();

// Nhập mảng kỹ năng 
const skillDonThe = require('./skillDonThe');
const skillBacLam = require('./skillBacLam');
const skillNguHanh = require('./skillNguHanh');

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


const rollGenerals = [
  {
    id: "quan_ninh",
    name: "Quản Ninh",
    title: "Tích Cảnh Quy Nguyên",
    kingdom: "Quần",
    bg_color: "#4a4a4a", 
    skillPool: [
      { name: "Độn Thế", desc: "Mỗi lượt chơi giới hạn một lần, bạn có thể xem như sử dụng hoặc đánh ra một lá [Sát], [Thiểm], [Đào] hoặc [Tửu]. Sau đó khi người chơi đang có lượt gây ra sát thương lần tiếp theo, bạn lựa chọn hai hạng mục: 1. Ngăn chặn sát thương này, lựa chọn một kỹ năng có chứa “Nhân, Nghĩa, Lễ, Trí, Tín” trong tên kỹ năng, lệnh người đó nhận lấy; 2. Tự giảm 1 điểm giới hạn sinh lực đồng thời rút X lá bài (X là số lần bạn đã chọn mục số 3); 3. Xóa bỏ tên lá bài mà bạn vừa xem như sử dụng." },     
    ]
  },
  {
    id: "chung_diem",
    name: "Chung Diễm",
    title: "Thông Tuệ Hoàng Nhã",
    kingdom: "Tấn",
    bg_color: "#5c2d91", 
    skillPool: [
      { name: "Bác Lãm", desc: "Khi bắt đầu giai đoạn hành động hoặc giai đoạn hành động của người khác giới hạn 1 lần, người chơi đang có lượt có thể mất 1 sinh lực (nếu người đang có lượt là bạn thì không cần mất sinh lực), lệnh bạn chọn 1 trong 3 kỹ năng có mô tả (Một lần trong giai đoạn hành động), người đang có lượt xem như sở hữu kỹ năng này." },     
    ]
  },
  {
    id: "than_ton_quyen",
    name: "Thần Tôn Quyền",
    title: "Tọa Đoạn Đông Nam",
    kingdom: "Thần",
    bg_color: "#cc9900", 
    skillPool: [
      { name: "Ngự Hành", desc: "Tỏa định kĩ Đầu lượt của bạn, bạn bỏ tùy ý bài có chất khác nhau, ngẫu nhiên đạt được lượng kỹ năng tương ứng của thế lực Ngô; Kết thúc lượt, bạn mất toàn bộ kỹ năng đã nhận bằng cách này, sau đó rút lượng bài tương đương." },     
    ]
  }

];

app.get('/api/generals', (req, res) => {
  res.json(rollGenerals);
});

// Hàm skill Độn Thế 
app.get('/api/random-three-skills', (req, res) => {
  try {
    if (!skillDonThe || skillDonThe.length < 3) {
      return res.status(500).json({ error: "Kho dữ liệu phải có ít nhất 3 kỹ năng!" });
    }
    
    const chosenSkills = [];
    const poolCopy = skillDonThe.slice(0); 

    while (chosenSkills.length < 3 && poolCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      const skill = poolCopy.splice(randomIndex, 1)[0];
      chosenSkills.push(skill);
    }

    res.json(chosenSkills);
  } catch (error) {
    console.error("Lỗi xử lý bốc kỹ năng Độn Thế:", error.message);
    res.status(500).json({ error: "Lỗi xử lý hệ thống Backend!" });
  }
});

// Hàm skill Bác Lãm 
app.get('/api/random-baclam-skills', (req, res) => {
  try {
    if (!skillBacLam || skillBacLam.length < 3) {
      return res.status(500).json({ error: "Kho dữ liệu Bác Lãm phải có ít nhất 3 kỹ năng!" });
    }
    
    const chosenSkills = [];
    const poolCopy = skillBacLam.slice(0); 

    while (chosenSkills.length < 3 && poolCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      const skill = poolCopy.splice(randomIndex, 1)[0];
      chosenSkills.push(skill);
    }

    res.json(chosenSkills);
  } catch (error) {
    console.error("Lỗi xử lý bốc kỹ năng Bác Lãm:", error.message);
    res.status(500).json({ error: "Lỗi xử lý hệ thống Backend!" });
  }
});

// Hàm skill Ngự Hành
app.get('/api/random-nguhanh-skills', (req, res) => {
  try {
    if (!skillNguHanh || skillNguHanh.length < 4) {
      return res.status(500).json({ error: "Kho dữ liệu Bác Lãm phải có ít nhất 3 kỹ năng!" });
    }
    
    const chosenSkills = [];
    const poolCopy = skillNguHanh.slice(0); 

    while (chosenSkills.length < 3 && poolCopy.length > 0) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      const skill = poolCopy.splice(randomIndex, 1)[0];
      chosenSkills.push(skill);
    }

    res.json(chosenSkills);
  } catch (error) {
    console.error("Lỗi xử lý bốc kỹ năng Ngự Hành:", error.message);
    res.status(500).json({ error: "Lỗi xử lý hệ thống Backend!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Server chạy thành công tại: http://localhost:${PORT}`);
  console.log(`Thư mục tĩnh đang sử dụng: ${publicPath}`);
  console.log(`==================================================`);
});