let fullPokerData = [];
let currentFilter = 'all';

// Khởi tạo: Đọc thẳng kho lưu trữ vĩnh viễn từ localStorage (nếu có) để tránh mất khi chuyển trang
let cardMarkers = JSON.parse(localStorage.getItem('gameCardMarkers')) || {};

async function loadPokerMatrix() {
    const tbody = document.getElementById('matrixBody');
    if (!tbody) return;
    try {
        const response = await fetch('/api/poker-matrix');
        fullPokerData = await response.json();
        
        // ĐỌC TRẬN PHÁP TỪ TRANG CHỦ: Nếu Tư Mã Sư vừa kích hoạt chiêu Tán Sĩ
        const savedSuMarkers = localStorage.getItem('tuMaSuMarkers');
        if (savedSuMarkers) {
            // Trộn mảng Tán Sĩ vào dữ liệu tổng của hệ thống
            cardMarkers = Object.assign({}, cardMarkers, JSON.parse(savedSuMarkers));
            // Lưu lại vào kho lưu trữ lâu dài của game
            localStorage.setItem('gameCardMarkers', JSON.stringify(cardMarkers));
            // Dọn dẹp cờ kích hoạt tạm thời đi
            localStorage.removeItem('tuMaSuMarkers');
        }

        updateMarkerFilterTab();
        renderMatrix(); 
    } catch (err) { 
        console.error("Lỗi nạp ma trận bài:", err); 
    }
}

function updateMarkerFilterTab() {
    const container = document.getElementById('dynamicMarkerFilterContainer');
    if (!container) return;

    const totalMarkers = Object.keys(cardMarkers).length;

    if (totalMarkers > 0) {
        container.innerHTML = `
            <button id="markerFilterBtn" class="filter-btn ${currentFilter === 'marked' ? 'active' : ''}" 
                onclick="filterMatrix('marked')" style="border-color: #ffcc00; color: #ffcc00;">
                🌟 Đã đánh dấu (${totalMarkers})
            </button>
        `;
    } else {
        container.innerHTML = '';
        if (currentFilter === 'marked') {
            currentFilter = 'all';
            const allBtn = document.querySelector(".filter-container button:first-child");
            if (allBtn) allBtn.classList.add('active');
        }
    }
}

function renderMatrix() {
    const tbody = document.getElementById('matrixBody'); 
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const rowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const suitOrder = ["Cơ", "Rô", "Chuồn", "Bích"];

    rowNumbers.forEach(num => {
        const tr = document.createElement('tr');
        let rowText = num === 1 ? "A" : num === 11 ? "J" : num === 12 ? "Q" : num === 13 ? "K" : num;
        
        const tdLabel = document.createElement('td'); 
        tdLabel.className = 'row-label'; 
        tdLabel.innerText = rowText;
        tr.appendChild(tdLabel);

        let hasValidCardInRow = false; 

        suitOrder.forEach(suitName => {
            const tdCell = document.createElement('td'); 
            tdCell.className = 'matrix-cell';
            
            const cellData = fullPokerData.find(c => c.number === num && c.suit === suitName);
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'cell-card-wrapper';

            if (cellData && cellData.cards.length > 0) {
                cellData.cards.forEach((card, index) => {
                    const cardKey = `${num}_${suitName}_${card.name}_${index}`;
                    
                    let isVisible = false;
                    if (currentFilter === 'all') isVisible = true;
                    else if (currentFilter === 'marked') isVisible = !!cardMarkers[cardKey];
                    else isVisible = (card.type === currentFilter);

                    if (isVisible) {
                        hasValidCardInRow = true;
                        const cardDiv = document.createElement('div');
                        cardDiv.className = `card-tag ${card.type}`; 
                        
                        if (cardMarkers[cardKey]) {
                            // Cập nhật tên chuẩn: Tán Sĩ phe Ngụy đổi viền xanh nước biển
                            const isNguy = cardMarkers[cardKey] === "Tán Sĩ";
                            const labelBg = isNguy ? "#1e3a8a" : "#ffcc00";
                            const labelColor = isNguy ? "#fff" : "#000";
                            const shadowColor = isNguy ? "#38bdf8" : "#ffcc00";

                            cardDiv.innerHTML = `🌟 ${card.name} <span class="marker-label" style="background: ${labelBg}; color: ${labelColor}; font-size: 10px; font-weight: bold; padding: 1px 4px; border-radius: 3px; margin-left: 5px; box-shadow: 0 0 8px ${shadowColor};">[${cardMarkers[cardKey]}]</span>`;
                            cardDiv.style.borderColor = shadowColor;
                            cardDiv.style.boxShadow = `inset 0 0 8px ${labelBg}44`;
                        } else {
                            cardDiv.innerText = card.name;
                        }

                        cardDiv.style.cursor = "pointer";
                        cardDiv.onclick = () => toggleCardMarker(cardKey);
                        cardWrapper.appendChild(cardDiv);
                    }
                });
            }
            tdCell.appendChild(cardWrapper);
            tr.appendChild(tdCell);
        });

        if (currentFilter !== 'marked' || hasValidCardInRow) {
            tbody.appendChild(tr);
        }
    });
}

function toggleCardMarker(cardKey) {
    const inputElement = document.getElementById('markerNameInput');
    const chosenMarkerName = inputElement ? inputElement.value.trim() : "Đánh Dấu";

    if (!chosenMarkerName) {
        alert("Vui lòng nhập tên ấn ký cần đánh dấu vào ô phía trên nhé!");
        return;
    }

    if (cardMarkers[cardKey]) {
        delete cardMarkers[cardKey];
    } else {
        cardMarkers[cardKey] = chosenMarkerName;
    }

    // ĐỒNG BỘ: Ghi đè cập nhật vào bộ nhớ lâu dài để chuyển trang không bị biến mất
    localStorage.setItem('gameCardMarkers', JSON.stringify(cardMarkers));

    updateMarkerFilterTab();
    renderMatrix();
}

/**
 * HÀM MỚI BỔ SUNG: Xóa sạch sành sanh toàn bộ đánh dấu hiện có trên bàn chơi
 */
function clearAllMarkers() {
    if (Object.keys(cardMarkers).length === 0) return;
    
    if (confirm("💥 Bạn có chắc chắn muốn hóa giải toàn bộ Tiêu ký không?")) {
        cardMarkers = {}; // Làm rỗng mảng
        localStorage.removeItem('gameCardMarkers'); // Xóa bộ nhớ lâu dài
        localStorage.removeItem('tuMaSuMarkers'); // Xóa bộ nhớ tạm của Tư Mã Sư
        
        // Ép quay về bộ lọc 'all' để tránh lỗi trống giao diện
        currentFilter = 'all';
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector(".filter-container button:first-child");
        if (allBtn) allBtn.classList.add('active');

        updateMarkerFilterTab();
        renderMatrix();
    }
}

function filterMatrix(type) {
    currentFilter = type;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (type !== 'marked' && event) {
        event.target.classList.add('active');
    }
    
    updateMarkerFilterTab();
    renderMatrix();
}

document.addEventListener('DOMContentLoaded', loadPokerMatrix);