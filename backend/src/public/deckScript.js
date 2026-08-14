let fullPokerData = [];
let currentFilter = 'all';

// Biến trạng thái Bật/Tắt chế độ Nhạc Phú
let isNhacPhuMode = false;

// Danh sách lưu các chìa khóa (cardKey) lá Phú đang được chọn để Reroll
let selectedPhuKeys = new Set();

// Đọc dữ liệu ấn ký đã lưu
let cardMarkers = JSON.parse(localStorage.getItem('gameCardMarkers')) || {};

async function loadPokerMatrix() {
    const tbody = document.getElementById('matrixBody');
    if (!tbody) return;
    try {
        const response = await fetch('/api/poker-matrix');
        fullPokerData = await response.json();
        
        const savedSuMarkers = localStorage.getItem('tuMaSuMarkers');
        if (savedSuMarkers) {
            cardMarkers = Object.assign({}, cardMarkers, JSON.parse(savedSuMarkers));
            localStorage.setItem('gameCardMarkers', JSON.stringify(cardMarkers));
            localStorage.removeItem('tuMaSuMarkers');
        }

        updateMarkerFilterTab();
        updateRerollBtn();
        renderMatrix(); 
    } catch (err) { 
        console.error("Lỗi nạp ma trận bài:", err); 
    }
}

// BẬT / TẮT CHẾ ĐỘ NHẠC PHÚ
function toggleNhacPhuMode() {
    isNhacPhuMode = !isNhacPhuMode;
    const btn = document.getElementById('toggleNhacPhuBtn');
    
    // Nếu tắt Nhạc Phú thì xóa sạch danh sách chọn reroll dở dang
    if (!isNhacPhuMode) {
        selectedPhuKeys.clear();
    }
    
    if (btn) {
        if (isNhacPhuMode) {
            btn.innerText = "🎼 Nhạc Phú: BẬT";
            btn.style.background = "#2563eb";
            btn.style.color = "#ffffff";
            btn.style.boxShadow = "0 0 10px #38bdf8";
        } else {
            btn.innerText = "🎼 Nhạc Phú: TẮT";
            btn.style.background = "#1e3a8a";
            btn.style.color = "#38bdf8";
            btn.style.boxShadow = "none";
        }
    }
    updateRerollBtn();
    renderMatrix();
}

// CẬP NHẬT NÚT REROLL TRÊN GIAO DIỆN
function updateRerollBtn() {
    const rerollBtn = document.getElementById('rerollSelectedPhuBtn');
    if (!rerollBtn) return;
    
    if (isNhacPhuMode && selectedPhuKeys.size > 0) {
        rerollBtn.style.display = "inline-block";
        rerollBtn.innerText = `🎲 Reroll Phú đã chọn (${selectedPhuKeys.size})`;
    } else {
        rerollBtn.style.display = "none";
    }
}

// HÀM LẤY NGẪU NHIÊN 1 LÁ BÀI PHI TRANG BỊ
function getRandomNonEquipmentCard() {
    const nonEqCards = [];
    fullPokerData.forEach(cell => {
        if (cell.cards && cell.cards.length > 0) {
            cell.cards.forEach(card => {
                if (card.type !== 'trangbi') {
                    nonEqCards.push(card.name);
                }
            });
        }
    });

    if (nonEqCards.length === 0) return "Sát";
    const randomIndex = Math.floor(Math.random() * nonEqCards.length);
    return nonEqCards[randomIndex];
}

// HÀM THỰC HIỆN REROLL CHO TẤT CẢ CÁC THẺ PHÚ ĐÃ CHỌN
function rerollSelectedPhuCards() {
    if (selectedPhuKeys.size === 0) return;

    selectedPhuKeys.forEach(cardKey => {
        if (cardMarkers[cardKey] && cardMarkers[cardKey].startsWith("Phú:")) {
            const newRandomCard = getRandomNonEquipmentCard();
            cardMarkers[cardKey] = `Phú: ${newRandomCard}`;
        }
    });

    // Reroll xong thì xóa danh sách đã chọn
    selectedPhuKeys.clear();
    localStorage.setItem('gameCardMarkers', JSON.stringify(cardMarkers));
    
    updateRerollBtn();
    renderMatrix();
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
                            const markerText = cardMarkers[cardKey];
                            const isNhacPhu = markerText.startsWith("Phú:");
                            const isNguy = markerText === "Tán Sĩ" || isNhacPhu;
                            const isSelectedForReroll = selectedPhuKeys.has(cardKey);
                            
                            // Tùy biến màu sắc khi thẻ Phú đang được chọn để Reroll
                            let labelBg = isNhacPhu ? "#2563eb" : (isNguy ? "#1e3a8a" : "#ffcc00");
                            let shadowColor = isNhacPhu ? "#38bdf8" : (isNguy ? "#38bdf8" : "#ffcc00");

                            let checkIcon = "";
                            if (isSelectedForReroll) {
                                labelBg = "#9333ea"; // Màu tím nổi bật báo hiệu đang chọn reroll
                                shadowColor = "#e879f9";
                                cardDiv.style.border = "2px solid #e879f9";
                                checkIcon = " <b style='color:#f43f5e'>✓ [Chọn Reroll]</b>";
                            }

                            cardDiv.innerHTML = `🌟 ${card.name} <span class="marker-label" style="background: ${labelBg}; color: #fff; font-size: 10px; font-weight: bold; padding: 1px 4px; border-radius: 3px; margin-left: 5px; box-shadow: 0 0 8px ${shadowColor};">[${markerText}]</span>${checkIcon}`;
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
    // 1. KHI CHẾ ĐỘ NHẠC PHÚ ĐANG BẬT:
    if (isNhacPhuMode) {
        // Nếu lá bài đã mang nhãn Phú: Click vào để Chọn/Bỏ chọn Reroll
        if (cardMarkers[cardKey] && cardMarkers[cardKey].startsWith("Phú:")) {
            if (selectedPhuKeys.has(cardKey)) {
                selectedPhuKeys.delete(cardKey);
            } else {
                selectedPhuKeys.add(cardKey);
            }
        } 
        // Nếu lá bài chưa có ấn ký: Tạo mới một lá Phú
        else if (!cardMarkers[cardKey]) {
            const randomNonEqCard = getRandomNonEquipmentCard();
            cardMarkers[cardKey] = `Phú: ${randomNonEqCard}`;
        }
        // Nếu lá bài đang mang ấn ký khác (không phải Phú): Xóa đi
        else {
            delete cardMarkers[cardKey];
        }
    } 
    // 2. KHI CHẾ ĐỘ NHẠC PHÚ ĐANG TẮT (Chế độ đánh dấu tay bình thường):
    else {
        if (cardMarkers[cardKey]) {
            delete cardMarkers[cardKey];
            selectedPhuKeys.delete(cardKey);
        } else {
            const inputElement = document.getElementById('markerNameInput');
            const chosenMarkerName = inputElement ? inputElement.value.trim() : "Đánh Dấu";
            if (!chosenMarkerName) {
                alert("Vui lòng nhập tên ấn ký trước nhé!");
                return;
            }
            cardMarkers[cardKey] = chosenMarkerName;
        }
    }

    localStorage.setItem('gameCardMarkers', JSON.stringify(cardMarkers));
    updateMarkerFilterTab();
    updateRerollBtn();
    renderMatrix();
}

function clearAllMarkers() {
    if (Object.keys(cardMarkers).length === 0) return;
    
    if (confirm("💥 Bạn có chắc chắn muốn hóa giải toàn bộ ấn ký trên ma trận bài không?")) {
        cardMarkers = {};
        selectedPhuKeys.clear();
        localStorage.removeItem('gameCardMarkers');
        localStorage.removeItem('tuMaSuMarkers');
        
        currentFilter = 'all';
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector(".filter-container button:first-child");
        if (allBtn) allBtn.classList.add('active');

        updateMarkerFilterTab();
        updateRerollBtn();
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