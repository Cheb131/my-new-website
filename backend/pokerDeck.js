const suits = [
  { name: "Cơ", symbol: "♥", color: "Đỏ", key: "co" },
  { name: "Rô", symbol: "♦", color: "Đỏ", key: "ro" },
  { name: "Chuồn", symbol: "♣", color: "Đen", key: "chuon" },
  { name: "Bích", symbol: "♠", color: "Đen", key: "bich" }
];

const pokerDeck = []; // Đồng bộ sử dụng một tên biến duy nhất

for (let number = 1; number <= 13; number++) {
  let displayText = number;
  if (number === 1) displayText = "A";
  if (number === 11) displayText = "J";
  if (number === 12) displayText = "Q";
  if (number === 13) displayText = "K";

  suits.forEach(suit => {
    pokerDeck.push({
      number: number,
      text: displayText,
      suit: suit.name,
      symbol: suit.symbol,
      color: suit.color,
      suitKey: suit.key,
      cards: [] 
    });
  });
}

function addCard(num, suitName, cardName, type) {
  const cell = pokerDeck.find(c => c.number === num && c.suit === suitName);
  if (cell) {
    cell.cards.push({ name: cardName, type: type });
  }
}

// Số 1
addCard(1, "Cơ", "Đào Viên Kết Nghĩa", "congcu");
addCard(1, "Cơ", "Vạn Tiễn Tề Phát", "congcu");
addCard(1, "Cơ", "Vô Giải Khả Kích", "congcu");
addCard(1, "Cơ", "Vô Giải Khả Kích", "congcu");
addCard(1, "Cơ", "Quát Cốt Liệu Độc", "congcu");

addCard(1, "Rô", "Chu Tước Vũ Phiến", "trangbi");
addCard(1, "Rô", "Ngũ Hành Hạc Linh Phiến", "trangbi");
addCard(1, "Rô", "Sát", "coban");
addCard(1, "Rô", "Gia Cát Liên Nỏ", "trangbi");
addCard(1, "Rô", "Quyết Đấu", "congcu");

addCard(1, "Chuồn", "Bạch Ngân Sư Tử", "trangbi");
addCard(1, "Chuồn", "Gia Cát Liên Nỏ", "trangbi");
addCard(1, "Chuồn", "Hộ Tâm Kính", "trangbi");
addCard(1, "Chuồn", "Chiết Kích", "trangbi");
addCard(1, "Chuồn", "Quyết Đấu", "congcu");

addCard(1, "Bích", "Quát Cốt Liệu Độc", "congcu");
addCard(1, "Bích", " Thái Công Âm Phù", "trangbi");
addCard(1, "Bích", "Thiểm Điện", "congcu");
addCard(1, "Bích", "Quyết Đấu ", "congcu");
addCard(1, "Bích", "Cổ Đình Đao", "trangbi");

// HÀNG 2
addCard(2, "Cơ", "Hỏa Công", "congcu");
addCard(2, "Cơ", "Xuất Kỳ Bất Ý", "congcu");
addCard(2, "Cơ", "Thiểm", "coban");
addCard(2, "Cơ", "Thiểm", "coban");
addCard(2, "Cơ", "Thiểm", "coban");

addCard(2, "Rô", "Đào", "coban");
addCard(2, "Rô", "Thiểm", "coban");
addCard(2, "Rô", "Thiểm", "coban");
addCard(2, "Rô", "Thiểm", "coban");
addCard(2, "Rô", "Thiểm", "coban");

addCard(2, "Chuồn", "Bát Quái Trận", "trangbi");
addCard(2, "Chuồn", "Đằng Giáp", "trangbi");
addCard(2, "Chuồn", "Nhân Vương Thuẫn", "trangbi");
addCard(2, "Chuồn", "Ám Sát", "coban");
addCard(2, "Chuồn", "Hắc Quang Khải", "trangbi");

addCard(2, "Bích", "Bát Quái Trận", "trangbi");
addCard(2, "Bích", "Đằng Giáp", "trangbi");
addCard(2, "Bích", "Hàn Băng Kiếm", "trangbi");
addCard(2, "Bích", "Thư Hùng Song Cổ Kiếm", "trangbi");
addCard(2, "Bích", "Thất Tinh Đao", "trangbi");

// HÀNG 3
addCard(3, "Cơ", "Đào", "coban");
addCard(3, "Cơ", "Hỏa Công", "congcu");
addCard(3, "Cơ", "Đào", "coban");
addCard(3, "Cơ", "Ngũ Cốc Phong Đăng", "congcu");
addCard(3, "Cơ", "Xuất Kỳ Phong Đăng", "congcu");

addCard(3, "Rô", "Đào", "coban");
addCard(3, "Rô", "Thiểm", "coban");
addCard(3, "Rô", "Thiểm", "coban");
addCard(3, "Rô", "Thụ Thượng Khai Hoa", "congcu");
addCard(3, "Rô", "Thuận Thủ Khiên Dương", "congcu");

addCard(3, "Chuồn", "Quá Hà Sách Kiều", "congcu");
addCard(3, "Chuồn", "Sát", "coban");
addCard(3, "Chuồn", "Tửu", "coban");
addCard(3, "Chuồn", "Dẫn Phong Giáp", "trangbi");
addCard(3, "Chuồn", "Trục Cận Khí Viễn", "congcu");

addCard(3, "Bích", "Quá Hà Sách Kiều", "congcu");
addCard(3, "Bích", "Thuận Thủ Khiên Dương", "congcu");
addCard(3, "Bích", "Tửu", "coban");
addCard(3, "Bích", "Thủy Yêm Thất Quân", "congcu");
addCard(3, "Bích", "Trục Cận Khí Viễn", "congcu");

// HÀNG 4
addCard(4, "Cơ", "Đào", "coban");
addCard(4, "Cơ", "Sát Hỏa ", "coban");
addCard(4, "Cơ", "Ngũ Cốc Phong Đăng", "congcu");
addCard(4, "Cơ", "Sát Hỏa", "coban");
addCard(4, "Cơ", "Tính Cáp", "trangbi");

addCard(4, "Rô", "Sát Hỏa", "coban");
addCard(4, "Rô", "Thiểm", "coban");
addCard(4, "Rô", "Thuận Thủ Khiên Dương", "congcu");
addCard(4, "Rô", "Sát Hỏa", "coban");
addCard(4, "Rô", "Thụ Thượng Khai Hoa", "congcu");

addCard(4, "Chuồn", "Binh Lương Thốn Đoạn", "congcu");
addCard(4, "Chuồn", "Quá Hà Sách Kiều", "congcu");
addCard(4, "Chuồn", "Sát", "coban");
addCard(4, "Chuồn", "Độc", "coban");
addCard(4, "Chuồn", "Trục Cận Khí Viễn", "congcu");

addCard(4, "Bích", "Sát Lôi", "coban");
addCard(4, "Bích", "Quá Hà Sách Kiều", "congcu");
addCard(4, "Bích", "Thuận Thủ Khiên Dương", "congcu");
addCard(4, "Bích", "Độc", "coban");
addCard(4, "Bích", "Thủy Yêm Thoát Quân", "congcu");

// Số 5
addCard(5, "Bích", "Thanh Long Yển Nguyệt Đao", "trangbi");
addCard(5, "Bích", "Tuyệt Ảnh", "trangbi");
addCard(5, "Bích", "Độc", "coban");
addCard(5, "Bích", "Sát Lôi", "coban");
addCard(5, "Bích", "Sát Lôi", "coban");

addCard(5, "Rô", "Thiểm", "coban");
addCard(5, "Rô", "Quán Thạch Phủ", "trangbi");
addCard(5, "Rô", "Thiểm", "coban");
addCard(5, "Rô", "Mộc Ngưu Lưu Mã", "trangbi");
addCard(5, "Rô", "Sát Hỏa", "coban");

addCard(5, "Chuồn", "Sát", "coban");
addCard(5, "Chuồn", "Sát", "coban");
addCard(5, "Chuồn", "Sát Lôi", "coban");
addCard(5, "Chuồn", "Ỷ Thiên Kiếm", "trangbi");
addCard(5, "Chuồn", "Đích Lô", "trangbi");

addCard(5, "Cơ", "Sát", "coban");
addCard(5, "Cơ", "Sát", "coban");
addCard(5, "Cơ", "Kỳ Lân Cung", "trangbi");
addCard(5, "Cơ", "Đào", "coban");
addCard(5, "Cơ", "Xích Thố", "trangbi");

// Số 6
addCard(6, "Bích", "Sát Lôi ", "coban");
addCard(6, "Bích", "Lạc Bất Tư Thục", "congcu");
addCard(6, "Bích", "Sát Lôi ", "coban");
addCard(6, "Bích", "Thanh Công Kiếm", "trangbi");
addCard(6, "Bích", "Ám Sát", "coban");

addCard(7, "Bích", "Ám Sát", "coban");
addCard(7, "Bích", "Sát Lôi", "coban");
addCard(7, "Bích", "Nam Man Nhập Xâm", "congcu");
addCard(7, "Bích", "Sát Băng", "coban");
addCard(7, "Bích", "Sát Băng", "coban");

addCard(8, "Bích", "Sát Băng", "coban");
addCard(8, "Bích", "Sát Băng", "coban");
addCard(8, "Bích", "Ám Sát", "coban");
addCard(8, "Bích", "Sát Băng", "coban");
addCard(8, "Bích", "Sát Lôi", "coban");

addCard(9, "Bích", "Sát", "coban");
addCard(9, "Bích", "Sát", "coban");
addCard(9, "Bích", "Sát", "coban");
addCard(9, "Bích", "Độc", "coban");
addCard(9, "Bích", "Tửu", "coban");

addCard(10, "Bích", "Sát", "coban");
addCard(10, "Bích", "Sát", "coban");
addCard(10, "Bích", "Sát", "coban");
addCard(10, "Bích", "Độc", "coban");
addCard(10, "Bích", "Binh Lương Thốn Đoạn", "congcu");

addCard(11, "Bích", "Thuận Thủ Khiên Dương", "congcu");
addCard(11, "Bích", "Vô Giải Khả Kích", "congcu");
addCard(11, "Bích", "Thiết Tác Liên Hoàn", "congcu");
addCard(11, "Bích", "Vô Giải Khả Kích", "congcu");
addCard(11, "Bích", "Thủy Yêm Thoát Quân", "congcu");

addCard(12, "Bích", "Quá Hà Sách Kiều", "congcu");
addCard(12, "Bích", "Thiết Tác Liên Hoàn", "congcu");
addCard(12, "Bích", "Trượng Bác Xà Mâu", "trangbi");
addCard(12, "Bích", "Sấn Hỏa Đả Kiếp", "congcu");
addCard(12, "Bích", "Trục Cận Khí Viễn", "congcu");

addCard(13, "Bích", "Vô Giải Khả Kích", "congcu");
addCard(13, "Bích", "Vô Giải Khả Kích", "congcu");
addCard(13, "Bích", "Nam Man Nhập Xâm", "congcu");
addCard(13, "Bích", "Đại Uyển", "trangbi");
addCard(13, "Bích", "Sấn Hỏa Đả Kiếp", "congcu");

addCard(6, "Rô", "Thiểm", "coban");
addCard(6, "Rô", "Thiểm", "coban");
addCard(6, "Rô", "Thiểm", "coban");
addCard(6, "Rô", "Thiểm", "coban");
addCard(6, "Rô", "Sát", "coban");

addCard(7, "Rô", "Thiểm", "coban");
addCard(7, "Rô", "Thiểm", "coban");
addCard(7, "Rô", "Thiểm", "coban");
addCard(7, "Rô", "Thiểm", "coban");
addCard(7, "Rô", "Sát", "coban");

addCard(8, "Rô", "Sát", "coban");
addCard(8, "Rô", "Sát", "coban");
addCard(8, "Rô", "Thiểm", "coban");
addCard(8, "Rô", "Thiểm", "coban");
addCard(8, "Rô", "Thiểm", "coban");

addCard(9, "Rô", "Sát", "coban");
addCard(9, "Rô", "Tửu", "coban");
addCard(9, "Rô", "Tửu", "coban");
addCard(9, "Rô", "Thiểm", "coban");
addCard(9, "Rô", "Thôi Tâm Tri Phúc", "congcu");

addCard(10, "Rô", "Thiểm", "coban");
addCard(10, "Rô", "Thiểm", "coban");
addCard(10, "Rô", "Sát", "coban");
addCard(10, "Rô", "Thôi Tâm Tri Phúc", "congcu");
addCard(10, "Rô", "Sát Hỏa", "coban");

addCard(11, "Rô", "Thiểm", "coban");
addCard(11, "Rô", "Thiểm", "coban");
addCard(11, "Rô", "Thiểm", "coban");
addCard(11, "Rô", "Thiểm", "coban");
addCard(11, "Rô", "Thiểm", "coban");

addCard(12, "Rô", "Phượng Thiên Họa Kích", "trangbi");
addCard(12, "Rô", "Xuất Kỳ Bất Ý", "congcu");
addCard(12, "Rô", "Hỏa Công", "congcu");
addCard(12, "Rô", "Ô Thiết Tỏa Liên", "trangbi");
addCard(12, "Rô", "Đào", "coban");

addCard(13, "Rô", "Sát", "coban");
addCard(13, "Rô", "Ám Sát", "coban");
addCard(13, "Rô", "Ám Sát", "coban");
addCard(13, "Rô", "Hoa Lư", "trangbi");
addCard(13, "Rô", "Tử Huynh", "trangbi");

addCard(6, "Chuồn", "Sát", "coban");
addCard(6, "Chuồn", "Sát", "coban");
addCard(6, "Chuồn", "Ám Sát", "coban");
addCard(6, "Chuồn", "Sát Lôi", "coban");
addCard(6, "Chuồn", "Lạc Bất Tư Thục", "congcu");

addCard(7, "Chuồn", "Ám Sát", "coban");
addCard(7, "Chuồn", "Nam Man Nhập Xâm", "congcu");
addCard(7, "Chuồn", "Sát", "coban");
addCard(7, "Chuồn", "Sát Lôi", "coban");
addCard(7, "Chuồn", "Sát", "coban");

addCard(8, "Chuồn", "Sát", "coban");
addCard(8, "Chuồn", "Sát", "coban");
addCard(8, "Chuồn", "Sát", "coban");
addCard(8, "Chuồn", "Ám Sát", "coban");
addCard(8, "Chuồn", "Sát Lôi", "coban");

addCard(9, "Chuồn", "Tửu", "coban");
addCard(9, "Chuồn", "Sát Lôi", "coban");
addCard(9, "Chuồn", "Sát Lôi", "coban");
addCard(9, "Chuồn", "Tửu", "coban");
addCard(9, "Chuồn", "Ám Sát", "coban");

addCard(10, "Chuồn", "Ám Sát", "coban");
addCard(10, "Chuồn", "Sát Lôi", "coban");
addCard(10, "Chuồn", "Sát Lôi", "coban");
addCard(10, "Chuồn", "Ám Sát", "coban");
addCard(10, "Chuồn", "Thiết Tác Liên Hoàn", "congcu");

addCard(11, "Chuồn", "Sát", "coban");
addCard(11, "Chuồn", "Sát", "coban");
addCard(11, "Chuồn", "Sát", "coban");
addCard(11, "Chuồn", "Thiết Tác Liên Hoàn", "congcu");
addCard(11, "Chuồn", "Vô Giải Khả Kích", "congcu");

addCard(12, "Chuồn", "Vô Giải Khả Kích", "congcu");
addCard(12, "Chuồn", "Thiết Tác Liên Hoàn", "congcu");
addCard(12, "Chuồn", "Vô Giải Khả Kích", "congcu");
addCard(12, "Chuồn", "Tá Đao Sát Nhân", "congcu");
addCard(12, "Chuồn", "Thiên Cơ Đồ", "trangbi");

addCard(13, "Chuồn", "Tá Đao Sát Nhân", "congcu");
addCard(13, "Chuồn", "Nô Mã", "trangbi");
addCard(13, "Chuồn", "Thiết Tác Liên Hoàn", "congcu");
addCard(13, "Chuồn", "Đồng Tước", "trangbi");
addCard(13, "Chuồn", "Vô Giải Khả Kích", "congcu");

addCard(6, "Cơ", "Sấn Hỏa Đả Kiếp", "congcu");
addCard(6, "Cơ", "Đào", "coban");
addCard(6, "Cơ", "Đào", "coban");
addCard(6, "Cơ", "Đào", "coban");
addCard(6, "Cơ", "Lạc Bất Tư Thục", "congcu");

addCard(7, "Cơ", "Đào", "coban");
addCard(7, "Cơ", "Vô Trung Sinh Hữu", "congcu");
addCard(7, "Cơ", "Sát Hỏa", "coban");
addCard(7, "Cơ", "Động Chúc Tiên Cơ", "congcu");
addCard(7, "Cơ", "Đào", "coban");

addCard(8, "Cơ", "Đào", "coban");
addCard(8, "Cơ", "Vô Trung Sinh Hữu", "congcu");
addCard(8, "Cơ", "Động Chúc Tiên Cơ", "congcu");
addCard(8, "Cơ", "Đào", "coban");
addCard(8, "Cơ", "Thiểm", "coban");

addCard(9, "Cơ", "Thiểm", "coban");
addCard(9, "Cơ", "Vô Trung Sinh Hữu", "congcu");
addCard(9, "Cơ", "Đào", "coban");
addCard(9, "Cơ", "Động Chúc Tiên Cơ", "congcu");
addCard(9, "Cơ", "Nữ Trang", "trangbi");

addCard(10, "Cơ", "Sát", "coban");
addCard(10, "Cơ", "Sát", "coban");
addCard(10, "Cơ", "Sát", "coban");
addCard(10, "Cơ", "Sát Hỏa", "coban");
addCard(10, "Cơ", "Sát", "coban");

addCard(11, "Cơ", "Động Chúc Tiên Cơ", "congcu");
addCard(11, "Cơ", "Thiểm", "coban");
addCard(11, "Cơ", "Sát", "coban");
addCard(11, "Cơ", "Vô Trung Sinh Hữu", "congcu");
addCard(11, "Cơ", "Vô Giải Khả Kích", "congcu");

addCard(12, "Cơ", "Thiểm Điện", "congcu");
addCard(12, "Cơ", "Đào", "coban");
addCard(12, "Cơ", "Quá Hà Sách Kiều", "congcu");
addCard(12, "Cơ", "Thiểm", "coban");
addCard(12, "Cơ", "Sát", "coban");

addCard(13, "Cơ", "Vô Giải Khả Kích", "congcu");
addCard(13, "Cơ", "Chiến Tượng", "trangbi");
addCard(13, "Cơ", "Thiểm", "coban");
addCard(13, "Cơ", "Trảo Hoàng Phi Diện", "trangbi");
addCard(13, "Cơ", "Thiểm", "coban");

module.exports = pokerDeck;