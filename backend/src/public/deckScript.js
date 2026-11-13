let fullPokerData = [];
let currentFilter = 'all';

let isNhacPhuMode = false;
let selectedPhuKeys = new Set();
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

// ==========================================
// LOGIC KỸ NĂNG VÕ HỮU CỦA QUAN VŨ (VÕ)
// ==========================================
async function triggerVoHuu() {
    const modal = document.getElementById('voHuuModal');
    const listDiv = document.getElementById('voHuuCardsList');
    if (!modal || !listDiv) return;

    modal.style.display = "block";
    listDiv.innerHTML = '<p style="color: #aaa; font-size: 12px;">Đang rút 5 lá bài phi trang bị từ thiên cơ...</p>';
    modal.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('/api/vohuu-cards');
        const cards = await response.json();

        listDiv.innerHTML = '';
        cards.forEach(card => {
            const suitSymbol = card.suit === 'Cơ' ? '♥' : card.suit === 'Rô' ? '♦' : card.suit === 'Chuồn' ? '♣' : '♠';
            const numText = card.number === 1 ? 'A' : card.number === 11 ? 'J' : card.number === 12 ? 'Q' : card.number === 13 ? 'K' : card.number;

            const cardBtn = document.createElement('div');
            cardBtn.className = `card-tag ${card.type}`;
            cardBtn.style.cursor = "pointer";
            cardBtn.style.padding = "8px 12px";
            cardBtn.style.fontSize = "12px";
            cardBtn.style.border = "1px solid #f87171";
            cardBtn.style.background = "#211916";
            cardBtn.style.color = "#fff";
            
            cardBtn.innerHTML = `🌟 <b>${card.name}</b> <span style="color:#ffcc00">(${numText} ${suitSymbol})</span>`;
            
            // Khi người chơi bấm chọn 1 trong 5 lá
            cardBtn.onclick = () => selectVoHuuCard(card);
            listDiv.appendChild(cardBtn);
        });
    } catch (err) {
        listDiv.innerHTML = '<p style="color: #ff4444;">Lỗi kết nối bốc bài Võ Hữu!</p>';
    }
}

function closeVoHuuModal() {
    const modal = document.getElementById('voHuuModal');
    if (modal) modal.style.display = "none";
}

function selectVoHuuCard(card) {
    const inputElement = document.getElementById('markerNameInput');
    const chosenMarkerName = inputElement ? inputElement.value.trim() : "Võ Hữu";

    if (!chosenMarkerName) {
        alert("Vui lòng nhập tên ấn ký trước nhé!");
        return;
    }

    // Găm ấn ký vào cardKey tương ứng
    cardMarkers[cardKeyOf(card)] = chosenMarkerName;
    
    localStorage.setItem('gameCardMarkers', JSON.stringify(cardMarkers));
    
    updateMarkerFilterTab();
    renderMatrix();
    closeVoHuuModal();
    
    alert(`⚔️ Đã găm ấn ký [${chosenMarkerName}] lên lá [${card.name}] thành công!`);
}

// Hàm hỗ trợ tái tạo cardKey chuẩn xác từ đối tượng card
function cardKeyOf(card) {
    // Tìm index chính xác của lá bài trong ma trận fullPokerData
    const cell = fullPokerData.find(c => c.number === card.number && c.suit === card.suit);
    if (cell && cell.cards) {
        const idx = cell.cards.findIndex(c => c.name === card.name);
        if (idx !== -1) return `${card.number}_${card.suit}_${card.name}_${idx}`;
    }
    return `${card.number}_${card.suit}_${card.name}_0`;
}

// ==========================================
// CÁC HÀM CŨ (NHẠC PHÚ, REROLL, BỘ LỌC)
// ==========================================
function toggleNhacPhuMode() {
    isNhacPhuMode = !isNhacPhuMode;
    const btn = document.getElementById('toggleNhacPhuBtn');
    if (!isNhacPhuMode) selectedPhuKeys.clear();
    
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

function getRandomNonEquipmentCard() {
    const nonEqCards = [];
    fullPokerData.forEach(cell => {
        if (cell.cards && cell.cards.length > 0) {
            cell.cards.forEach(card => {
                // THÊM ĐIỀU KIỆN: card.name !== "Độc"
                if (card.type !== 'trangbi' && card.name !== 'Độc') {
                    nonEqCards.push(card.name);
                }
            });
        }
    });
    if (nonEqCards.length === 0) return "Sát";
    return nonEqCards[Math.floor(Math.random() * nonEqCards.length)];
}

function rerollSelectedPhuCards() {
    if (selectedPhuKeys.size === 0) return;
    selectedPhuKeys.forEach(cardKey => {
        if (cardMarkers[cardKey] && cardMarkers[cardKey].startsWith("Phú:")) {
            cardMarkers[cardKey] = `Phú: ${getRandomNonEquipmentCard()}`;
        }
    });
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
                            
                            let labelBg = isNhacPhu ? "#2563eb" : (isNguy ? "#1e3a8a" : "#ffcc00");
                            let shadowColor = isNhacPhu ? "#38bdf8" : (isNguy ? "#38bdf8" : "#ffcc00");
                            let checkIcon = "";

                            if (isSelectedForReroll) {
                                labelBg = "#9333ea";
                                shadowColor = "#e879f9";
                                cardDiv.style.border = "2px solid #e879f9";
                                checkIcon = " <b style='color:#f43f5e'>✓ [Chọn]</b>";
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

        if (currentFilter !== 'marked' || hasValidCardInRow) tbody.appendChild(tr);
    });
}

function toggleCardMarker(cardKey) {
    if (isNhacPhuMode) {
        if (cardMarkers[cardKey] && cardMarkers[cardKey].startsWith("Phú:")) {
            if (selectedPhuKeys.has(cardKey)) selectedPhuKeys.delete(cardKey);
            else selectedPhuKeys.add(cardKey);
        } else if (!cardMarkers[cardKey]) {
            cardMarkers[cardKey] = `Phú: ${getRandomNonEquipmentCard()}`;
        } else {
            delete cardMarkers[cardKey];
        }
    } else {
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
    if (type !== 'marked' && event) event.target.classList.add('active');
    updateMarkerFilterTab();
    renderMatrix();
}

document.addEventListener('DOMContentLoaded', loadPokerMatrix);