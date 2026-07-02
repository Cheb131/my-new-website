let fullPokerData = [];
let currentFilter = 'all';

// Đối tượng lưu trữ các lá bài đã được đánh dấu vãng lai trên bộ nhớ Frontend
let cardMarkers = {};

async function loadPokerMatrix() {
    const tbody = document.getElementById('matrixBody');
    if (!tbody) return;
    try {
        const response = await fetch('/api/poker-matrix');
        fullPokerData = await response.json();
        renderMatrix(); // Khởi chạy dựng giao diện[cite: 10]
    } catch (err) { 
        console.error("Lỗi nạp ma trận bài:", err); 
    }
}

/**
 * Hàm dựng giao diện bảng Grid (Đã FIX lỗi cô lập đánh dấu độc lập từng ô)
 */
function renderMatrix() {
    const tbody = document.getElementById('matrixBody'); 
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const rowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const suitOrder = ["Cơ", "Rô", "Chuồn", "Bích"]; // Thứ tự cột cố định

    rowNumbers.forEach(num => {
        const tr = document.createElement('tr');
        let rowText = num === 1 ? "A" : num === 11 ? "J" : num === 12 ? "Q" : num === 13 ? "K" : num;
        
        const tdLabel = document.createElement('td'); 
        tdLabel.className = 'row-label'; 
        tdLabel.innerText = rowText;
        tr.appendChild(tdLabel);

        suitOrder.forEach(suitName => {
            const tdCell = document.createElement('td'); 
            tdCell.className = 'matrix-cell';
            
            const cellData = fullPokerData.find(c => c.number === num && c.suit === suitName);
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'cell-card-wrapper';

            if (cellData && cellData.cards.length > 0) {
                // Duyệt qua từng lá bài và dùng index (vị trí của lá bài đó trong ô) để làm định danh duy nhất
                cellData.cards.forEach((card, index) => {
                    if (currentFilter === 'all' || card.type === currentFilter) {
                        const cardDiv = document.createElement('div');
                        cardDiv.className = `card-tag ${card.type}`; 
                        
                        // FIX TẠI ĐÂY: cardKey bây giờ bao gồm Điểm_Chất_Tên_VịTrí để bảo đảm độc nhất vô nhị
                        const cardKey = `${num}_${suitName}_${card.name}_${index}`;
                        
                        // Kiểm tra trạng thái đánh dấu dựa trên chìa khóa độc nhất này
                        if (cardMarkers[cardKey]) {
                            cardDiv.innerHTML = `🌟 ${card.name} <span class="marker-label" style="background: #ffcc00; color: #000; font-size: 10px; font-weight: bold; padding: 1px 4px; border-radius: 3px; margin-left: 5px; box-shadow: 0 0 8px #ffcc00;">[${cardMarkers[cardKey]}]</span>`;
                            cardDiv.style.borderColor = "#ffcc00";
                            cardDiv.style.boxShadow = "inset 0 0 8px rgba(255, 204, 0, 0.2)";
                        } else {
                            cardDiv.innerText = card.name;
                        }

                        // Sự kiện click truyền cardKey chuẩn xác cô lập phần tử
                        cardDiv.style.cursor = "pointer";
                        cardDiv.onclick = () => toggleCardMarker(cardKey);
                        
                        cardWrapper.appendChild(cardDiv);
                    }
                });
            }
            tdCell.appendChild(cardWrapper);
            tr.appendChild(tdCell);
        });
        tbody.appendChild(tr);
    });
}

/**
 * HÀM XỬ LÝ CHÍNH: Bật/Tắt Đánh dấu theo chìa khóa định danh cô lập
 */
function toggleCardMarker(cardKey) {
    const inputElement = document.getElementById('markerNameInput');
    const chosenMarkerName = inputElement ? inputElement.value.trim() : "Đánh Dấu";

    if (!chosenMarkerName) {
        alert("Vui lòng nhập tên ấn ký cần đánh dấu vào ô phía trên trước nhé!");
        return;
    }

    // Nếu lá bài chính xác này đã được đánh dấu -> Xóa đi
    if (cardMarkers[cardKey]) {
        delete cardMarkers[cardKey];
    } 
    // Nếu chưa -> Gán ấn ký riêng cho nó
    else {
        cardMarkers[cardKey] = chosenMarkerName;
    }

    // Làm mới lại giao diện ma trận bảng ngay lập tức[cite: 10]
    renderMatrix();
}

function filterMatrix(type) {
    currentFilter = type;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderMatrix();
}

document.addEventListener('DOMContentLoaded', loadPokerMatrix);