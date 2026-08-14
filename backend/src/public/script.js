let currentSkillElement = null; 
let currentSkillName = "";      

let binhTaiPool = null; 
let temporaryCauseName = ""; 

async function initBinhTaiPool() {
    if (!binhTaiPool) {
        try {
            const response = await fetch('/api/binhtai-pool');
            binhTaiPool = await response.json();
        } catch (err) {
            console.error("Không thể nạp kho bài Bình Tài:", err);
        }
    }
}

// HÀM 1: Cơ chế Rút 3 chọn 1 (Cập nhật hiển thị desc nếu có)
async function trigger3pick1(element, originalName, apiUrl) {
    currentSkillElement = element; currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel'); const list = document.getElementById('choicesList');
    panel.style.display = "block"; list.innerHTML = '<p class="status-msg">Đang bốc 3 quẻ bùa...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
    try {
        const response = await fetch(apiUrl); const skills = await response.json();
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div'); option.className = 'choice-item';
            // Cập nhật: Hiển thị mô tả desc bên cạnh tên kỹ năng
            const descText = skill.desc ? ` - ${skill.desc}` : "";
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span>${descText}`;
            option.onclick = () => selectSkill(skill.name, skill.desc || ""); list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444;">Lỗi kết nối!</p>'; }
}

// HÀM 2: Cơ chế Rút 4 chọn 1 (Cập nhật hiển thị desc nếu có)
async function trigger4pick1(element, originalName, apiUrl) {
    currentSkillElement = element; currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel'); const list = document.getElementById('choicesList');
    panel.style.display = "block"; list.innerHTML = '<p class="status-msg">Đang triệu gọi 4 quẻ thần bùa...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
    try {
        const response = await fetch(apiUrl); const skills = await response.json();
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div'); option.className = 'choice-item';
            const descText = skill.desc ? ` - ${skill.desc}` : "";
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span>${descText}`;
            option.onclick = () => selectSkill(skill.name, skill.desc || ""); list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444;">Lỗi kết nối!</p>'; }
}

// HÀM 3: Cơ chế Rút 1 lấy luôn (Dùng cho Long Tụng & Khắc Danh)
async function trigger1pick1(element, originalName, apiUrl) {
    currentSkillElement = element; currentSkillName = originalName;
    document.getElementById('choicesPanel').style.display = "none";
    try {
        const response = await fetch(apiUrl); const skill = await response.json();
        // Cập nhật: Truyền đầy đủ mô tả desc vào rương lưu trữ
        selectSkill(skill.name, skill.desc || "");
    } catch (err) { alert("Lỗi kết nối!"); }
}

async function triggerBinhTai(element, originalName) {
    currentSkillElement = element; currentSkillName = originalName;
    await initBinhTaiPool();
    const panel = document.getElementById('choicesPanel'); const list = document.getElementById('choicesList');
    panel.style.display = "block";
    list.innerHTML = `
        <div class="choice-item" style="text-align:center; border-color:#ff4444;" onclick="fetchBinhTaiPool('actionphase')">
            <span style="color:#ff4444; font-weight:bold; font-size:14px;">⚔️ GIAI ĐOẠN HÀNH ĐỘNG</span>
        </div>
        <div class="choice-item" style="text-align:center; border-color:#34d399;" onclick="fetchBinhTaiPool('endphase')">
            <span style="color:#34d399; font-weight:bold; font-size:14px;">🛡️ GIAI ĐOẠN KẾT THÚC</span>
        </div>
        <div class="choice-item" style="text-align:center; border-color:#38bdf8;" onclick="fetchBinhTaiPool('takedame')">
            <span style="color:#38bdf8; font-weight:bold; font-size:14px;">🩸 SAU KHI NHẬN SÁT THƯƠNG</span>
        </div>
    `;
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
}

async function triggerThienThuCauses(element, originalName) {
    currentSkillElement = element; currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel'); const list = document.getElementById('choicesList');
    const titleElement = panel.querySelector('.choices-title') || panel.querySelector('h3');
    panel.style.display = "block"; list.innerHTML = '<p class="status-msg">🔮 Thiên Thư đang bốc toán Nguyên Nhân...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
    try {
        const response = await fetch('/api/thienthu-causes'); const causes = await response.json();
        if (titleElement) titleElement.innerText = `📖 Thiên Thư: Chọn NGUYÊN NHÂN 📖`;
        list.innerHTML = '';
        causes.forEach(item => {
            const option = document.createElement('div'); option.className = 'choice-item';
            option.style.borderColor = "#ef4444"; 
            const descText = item.desc ? ` - ${item.desc}` : "";
            option.innerHTML = `<span class="skill-name" style="color:#ef4444">【${item.name}】</span>${descText}`;
            option.onclick = () => selectThienThuCause(item.name, item.desc || ""); list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444;">Lỗi kết nối!</p>'; }
}

async function selectThienThuCause(causeName, causeDesc) {
    temporaryCauseName = causeName; 
    const list = document.getElementById('choicesList');
    const titleElement = document.getElementById('choicesPanel').querySelector('.choices-title') || document.getElementById('choicesPanel').querySelector('h3');
    list.innerHTML = '<p class="status-msg">⚡ Nguyên nhân đã định! Đang triệu gọi Hệ Quả...</p>';
    try {
        const response = await fetch('/api/thienthu-effects'); const effects = await response.json();
        if (titleElement) titleElement.innerText = `📜 Thiên Thư: Chọn HỆ QUẢ 📜`;
        list.innerHTML = '';
        effects.forEach(item => {
            const option = document.createElement('div'); option.className = 'choice-item';
            option.style.borderColor = "#34d399"; 
            const descText = item.desc ? ` - ${item.desc}` : "";
            option.innerHTML = `<span class="skill-name" style="color:#34d399">【${item.name}】</span>${descText}`;
            
            // Ghép chuỗi tên và chuỗi mô tả nếu có
            const combinedDesc = item.desc ? `Hệ quả: ${item.desc}` : "";
            option.onclick = () => selectSkill(`Nếu (${temporaryCauseName}) ➔ Sẽ (${item.name})`, combinedDesc); 
            list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444;">Lỗi kết nối!</p>'; }
}

async function triggerTuMaSu() {
    try {
        const response = await fetch('/api/poker-matrix'); const fullDeck = await response.json();
        const suits = ["Cơ", "Rô", "Chuồn", "Bích"]; const autoMarkers = {};
        for (let num = 1; num <= 13; num++) {
            const randomSuit = suits[Math.floor(Math.random() * suits.length)];
            const cellData = fullDeck.find(c => c.number === num && c.suit === randomSuit);
            if (cellData && cellData.cards.length > 0) {
                const randomCardIndex = Math.floor(Math.random() * cellData.cards.length);
                const card = cellData.cards[randomCardIndex];
                const cardKey = `${num}_${randomSuit}_${card.name}_${randomCardIndex}`;
                autoMarkers[cardKey] = "Tán Sĩ";
            }
        }
        localStorage.setItem('tuMaSuMarkers', JSON.stringify(autoMarkers));
        const selectedList = document.getElementById('selectedList');
        const emptyMsg = selectedList.querySelector('.empty-msg'); if (emptyMsg) emptyMsg.remove();
        const item = document.createElement('div'); item.className = 'selected-item'; item.style.borderLeftColor = '#1e3a8a';
        item.innerHTML = `<span class="skill-name" style="color:#38bdf8">【Tán Sĩ ➔ Phát Động】</span> Đã bày trận găm 13 bài vãng lai. <button class="delete-btn" onclick="deleteSkill(this)">✖</button>`;
        selectedList.appendChild(item); alert("🔮 Kích hoạt Tán Sĩ thành công!");
    } catch (err) { alert("Lỗi!"); }
}

async function fetchBinhTaiPool(type) {
    const list = document.getElementById('choicesList');
    if (!binhTaiPool || !binhTaiPool[type] || binhTaiPool[type].length === 0) {
        list.innerHTML = '<p style="color:#ff4444; text-align:center;">⚠️ Giai đoạn này đã cạn kiệt kỹ năng!</p>'; return;
    }
    const targetPool = binhTaiPool[type]; const chosenSkills = [];
    const indices = Array.from({ length: targetPool.length }, (_, i) => i);
    const countToDraw = Math.min(3, targetPool.length);
    for (let i = 0; i < countToDraw; i++) {
        const randIdx = Math.floor(Math.random() * indices.length);
        const actualIndexInPool = indices.splice(randIdx, 1)[0];
        chosenSkills.push({ skill: targetPool[actualIndexInPool], originalIndex: actualIndexInPool });
    }
    list.innerHTML = '';
    chosenSkills.forEach(item => {
        const option = document.createElement('div'); option.className = 'choice-item';
        const descText = item.skill.desc ? ` - ${item.skill.desc}` : "";
        option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${item.skill.name}】</span>${descText}`;
        option.onclick = () => selectBinhTaiSkill(item.skill.name, item.skill.desc || "", type, item.originalIndex); 
        list.appendChild(option);
    });
}

function selectBinhTaiSkill(name, desc, type, originalIndex) {
    selectSkill(name, desc); if (binhTaiPool && binhTaiPool[type]) binhTaiPool[type].splice(originalIndex, 1);
}

// HÀM CHÍNH LƯU VÀO RƯƠNG CHỨA: TỰ ĐỘNG ĐƯA DESC RA MÀN HÌNH BÊN DƯỚI
function selectSkill(name, desc) {
    const selectedList = document.getElementById('selectedList');
    const emptyMsg = selectedList.querySelector('.empty-msg'); if (emptyMsg) emptyMsg.remove();
    const item = document.createElement('div'); item.className = 'selected-item';
    
    // Nếu có nội dung desc thì nối vào sau tên kỹ năng
    const displayDesc = desc ? ` - <span style="color:#cccccc">${desc}</span>` : "";
    
    item.innerHTML = `
        <span class="skill-name" style="color:var(--theme-color)">【${currentSkillName} ➔ ${name}】</span>${displayDesc}
        <button class="delete-btn" onclick="deleteSkill(this)">✖</button>
    `;
    selectedList.appendChild(item); document.getElementById('choicesPanel').style.display = "none";
}

function deleteSkill(btnElement) {
    btnElement.parentElement.remove(); const selectedList = document.getElementById('selectedList');
    if (selectedList.children.length === 0) selectedList.innerHTML = '<div class="empty-msg">Chưa có kỹ năng nào được chọn. Hãy nhấn vào ô phía trên.</div>';
}

async function loadGenerals() {
    const resultDiv = document.getElementById('result');
    try {
        const response = await fetch('/api/generals'); const generals = await response.json();
        resultDiv.innerHTML = '';
        generals.forEach((gen, index) => {
            const card = document.createElement('div'); card.className = 'card';
            const baseColor = gen.bg_color || '#4a3525';
            card.style.setProperty('--theme-color', baseColor); card.style.zIndex = generals.length - index; 
            const wrapper = document.createElement('div'); wrapper.className = 'skills-wrapper';
            
            gen.skillPool.forEach(s => {
                const skillBox = document.createElement('div');
                if (s.name === "Độn Thế") skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '/api/random-three-skills')`);
                else if (s.name === "Bác Lãm") skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '/api/random-baclam-skills')`);
                else if (s.name === "Ngự Hành") skillBox.setAttribute('onclick', `trigger4pick1(this, '${s.name}', '/api/random-nguhanh-skills')`);
                else if (s.name === "Điểm Mặc") skillBox.setAttribute('onclick', `trigger4pick1(this, '${s.name}', '/api/random-diemmac-skills')`);
                else if (s.name === "Long Tụng") skillBox.setAttribute('onclick', `trigger1pick1(this, '${s.name}', '/api/random-longtung-skill')`);
                else if (s.name === "Bình Tài") skillBox.setAttribute('onclick', `triggerBinhTai(this, '${s.name}')`);
                else if (s.name === "Tán Sĩ") skillBox.setAttribute('onclick', `triggerTuMaSu()`);
                else if (s.name === "Thiên Thư") skillBox.setAttribute('onclick', `triggerThienThuCauses(this, '${s.name}')`);
                else if (s.name === "Khắc Danh") skillBox.setAttribute('onclick', `trigger1pick1(this, '${s.name}', '/api/random-khacdanh-skill')`);
                else if (s.name === "Nhạc Phú") skillBox.setAttribute('onclick', `window.location.href='/deck'`);
                
                skillBox.className = 'skill-box clickable-donthe';
                skillBox.innerHTML = `<span class="skill-name">【${s.name}】</span>`;
                wrapper.appendChild(skillBox);
            });
            card.innerHTML = `<span class="kingdom">${gen.kingdom}</span><h2>${gen.name}</h2><span class="title-tag">Danh hiệu: ${gen.title}</span>`;
            card.appendChild(wrapper); resultDiv.appendChild(card);
        });
    } catch (error) { resultDiv.innerHTML = '<p style="color: #ff4444;">⚠️ Lỗi kết nối!</p>'; }
}

document.addEventListener('DOMContentLoaded', loadGenerals);