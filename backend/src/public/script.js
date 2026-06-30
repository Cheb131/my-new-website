let currentSkillElement = null; 
let currentSkillName = "";      

// Đã sửa: Đồng bộ chuẩn hóa tên biến chữ T viết hoa
let binhTaiPool = null; 

/**
 * Tải kho bài Bình Tài từ Backend nếu chưa có
 */
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

// HÀM 1: Cơ chế Rút 3 chọn 1 (Giữ nguyên)
async function trigger3pick1(element, originalName, apiUrl) {
    currentSkillElement = element; currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel'); const list = document.getElementById('choicesList'); const titleElement = panel.querySelector('h3');
    panel.style.display = "block"; list.innerHTML = '<p class="status-msg" style="font-size:12px;">Đang bốc 3 quẻ bùa...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
    try {
        const response = await fetch(apiUrl); const skills = await response.json();
        if (titleElement) titleElement.innerText = `🔮 Chọn 1 trong 3 kỹ năng để lĩnh hội 🔮`;
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div'); option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc); list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi kết nối!</p>'; }
}

// HÀM 2: Cơ chế Rút 4 chọn 1 (Giữ nguyên)
async function trigger4pick1(element, originalName, apiUrl) {
    currentSkillElement = element; currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel'); const list = document.getElementById('choicesList'); const titleElement = panel.querySelector('h3');
    panel.style.display = "block"; list.innerHTML = '<p class="status-msg" style="font-size:12px;">Đang triệu gọi 4 quẻ thần bùa...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
    try {
        const response = await fetch(apiUrl); const skills = await response.json();
        if (titleElement) titleElement.innerText = `⚡ Chọn 1 trong 4 bí kỹ tối cao ⚡`;
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div'); option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc); list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi kết nối!</p>'; }
}

// HÀM 3: Cơ chế Rút 1 lấy luôn (Giữ nguyên)
async function trigger1pick1(element, originalName, apiUrl) {
    currentSkillElement = element; currentSkillName = originalName;
    document.getElementById('choicesPanel').style.display = "none";
    try {
        const response = await fetch(apiUrl); const skill = await response.json();
        selectSkill(skill.name, skill.desc);
    } catch (err) { alert("Lỗi kết nối!"); }
}

// HÀM 4: Giao diện Tầng 1 Bình Tài - Chọn Giai đoạn
async function triggerBinhTai(element, originalName) {
    currentSkillElement = element;
    currentSkillName = originalName;
    
    // Đợi nạp dữ liệu từ Backend
    await initBinhTaiPool();

    const panel = document.getElementById('choicesPanel');
    const list = document.getElementById('choicesList');
    const titleElement = panel.querySelector('h3');
    
    panel.style.display = "block";
    if (titleElement) titleElement.innerText = `⚖️ LỰA CHỌN GIAI ĐOẠN BÌNH TÀI ⚖️`;
    
    list.innerHTML = `
        <div class="choice-item" style="text-align:center; border-color:#ff4444;" onclick="fetchBinhTaiPool('actionphase')">
            <span style="color:#ff4444; font-weight:bold; font-size:14px;">⚔️ GIAI ĐOẠN HÀNH ĐỘNG</span><br>
            <span style="color:#888; font-size:11px;">Bốc ngẫu nhiên 3 kỹ năng phát động chủ động trong lượt</span>
        </div>
        <div class="choice-item" style="text-align:center; border-color:#34d399;" onclick="fetchBinhTaiPool('endphase')">
            <span style="color:#34d399; font-weight:bold; font-size:14px;">🛡️ GIAI ĐOẠN KẾT THÚC</span><br>
            <span style="color:#888; font-size:11px;">Bốc ngẫu nhiên 3 kỹ năng kích hoạt khi kết thúc lượt chơi</span>
        </div>
        <div class="choice-item" style="text-align:center; border-color:#38bdf8;" onclick="fetchBinhTaiPool('takedame')">
            <span style="color:#38bdf8; font-weight:bold; font-size:14px;">🩸 SAU KHI NHẬN SÁT THƯƠNG</span><br>
            <span style="color:#888; font-size:11px;">Bốc ngẫu nhiên 3 kỹ năng khi mất máu</span>
        </div>
    `;
    
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);
}

// HÀM TẦNG 2: Xử lý bốc 3 kỹ năng ngẫu nhiên cục bộ không trùng lặp và giữ chỉ số gốc
async function fetchBinhTaiPool(type) {
    const list = document.getElementById('choicesList');
    const titleElement = document.getElementById('choicesPanel').querySelector('h3');
    
    if (!binhTaiPool || !binhTaiPool[type] || binhTaiPool[type].length === 0) {
        list.innerHTML = '<p style="color:#ff4444; font-size:12px; text-align:center; padding:10px;">⚠️ Giai đoạn này đã cạn kiệt kỹ năng!</p>';
        return;
    }

    let typeText = 'HÀNH ĐỘNG';
    if (type === 'endphase') typeText = 'KẾT THÚC';
    if (type === 'takedame') typeText = 'NHẬN SÁT THƯƠNG';
    
    if (titleElement) titleElement.innerText = `🔮 Bình Tài [${typeText}]: Chọn 1 quẻ bùa 🔮`;

    const targetPool = binhTaiPool[type];
    const chosenSkills = [];
    
    // Tạo danh sách chỉ số (index) ảo để bốc không trùng
    const indices = Array.from({ length: targetPool.length }, (_, i) => i);
    const countToDraw = Math.min(3, targetPool.length);

    for (let i = 0; i < countToDraw; i++) {
        const randIdx = Math.floor(Math.random() * indices.length);
        const actualIndexInPool = indices.splice(randIdx, 1)[0];
        chosenSkills.push({
            skill: targetPool[actualIndexInPool],
            originalIndex: actualIndexInPool
        });
    }

    list.innerHTML = '';
    chosenSkills.forEach(item => {
        const option = document.createElement('div');
        option.className = 'choice-item';
        option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${item.skill.name}】</span> ${item.skill.desc}`;
        // Gắn sự kiện click kèm theo vị trí gốc phục vụ cho việc xóa
        option.onclick = () => selectBinhTaiSkill(item.skill.name, item.skill.desc, type, item.originalIndex);
        list.appendChild(option);
    });
}

// HÀM MỚI: Đưa kỹ năng Bình Tài vào rương và xóa nó đi vĩnh viễn khỏi pool cục bộ
function selectBinhTaiSkill(name, desc, type, originalIndex) {
    const selectedList = document.getElementById('selectedList');
    const emptyMsg = selectedList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const item = document.createElement('div');
    item.className = 'selected-item';
    item.innerHTML = `
        <span class="skill-name" style="color:var(--theme-color)">【${currentSkillName} ➔ ${name}】</span> ${desc}
        <button class="delete-btn" onclick="deleteSkill(this)">✖</button>
    `;
    selectedList.appendChild(item);
    document.getElementById('choicesPanel').style.display = "none";

    // Thực hiện xóa phần tử khỏi mảng cục bộ
    if (binhTaiPool && binhTaiPool[type]) {
        binhTaiPool[type].splice(originalIndex, 1);
    }
}

// Đưa kỹ năng thường vào Rương chứa bài công cộng
function selectSkill(name, desc) {
    const selectedList = document.getElementById('selectedList');
    const emptyMsg = selectedList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const item = document.createElement('div');
    item.className = 'selected-item';
    item.innerHTML = `
        <span class="skill-name" style="color:var(--theme-color)">【${currentSkillName} ➔ ${name}】</span> ${desc}
        <button class="delete-btn" onclick="deleteSkill(this)">✖</button>
    `;
    selectedList.appendChild(item);
    document.getElementById('choicesPanel').style.display = "none";
}

function deleteSkill(btnElement) {
    btnElement.parentElement.remove();
    const selectedList = document.getElementById('selectedList');
    if (selectedList.children.length === 0) {
        selectedList.innerHTML = '<div class="empty-msg">Chưa có kỹ năng nào được chọn. Hãy nhấn vào các ô kỹ năng đặc biệt phía trên.</div>';
    }
}

// Khởi tạo render danh sách võ tướng
async function loadGenerals() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p class="status-msg" style="font-size:14px;">Đang triệu hồi các võ tướng...</p>';
    try {
        const response = await fetch('/api/generals'); const generals = await response.json();
        resultDiv.innerHTML = '';
        generals.forEach((gen, index) => {
            const card = document.createElement('div'); card.className = 'card donthe-effect';
            const baseColor = gen.bg_color || '#4a3525'; card.style.backgroundColor = baseColor;
            card.style.setProperty('--theme-color', baseColor); card.style.zIndex = generals.length - index; 
            const wrapper = document.createElement('div'); wrapper.className = 'skills-wrapper';
            
            gen.skillPool.forEach(s => {
                const skillBox = document.createElement('div');
                if (s.name === "Độn Thế") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '/api/random-three-skills')`);
                } 
                else if (s.name === "Bác Lãm") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '/api/random-baclam-skills')`);
                } 
                else if (s.name === "Ngự Hành") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger4pick1(this, '${s.name}', '/api/random-nguhanh-skills')`);
                } 
                else if (s.name === "Điểm Mặc") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger4pick1(this, '${s.name}', '/api/random-diemmac-skills')`);
                }
                else if (s.name === "Long Tụng") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger1pick1(this, '${s.name}', '/api/random-longtung-skill')`);
                }
                else if (s.name === "Bình Tài") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `triggerBinhTai(this, '${s.name}')`);
                }
                else { skillBox.className = 'skill-box'; }
                
                skillBox.innerHTML = `<span class="skill-name">【${s.name}】</span>${s.desc}`;
                wrapper.appendChild(skillBox);
            });
            card.innerHTML = `<span class="kingdom">${gen.kingdom}</span><h2>${gen.name}</h2><span class="title-tag">Danh hiệu: ${gen.title}</span>`;
            card.appendChild(wrapper); resultDiv.appendChild(card);
        });
    } catch (error) { resultDiv.innerHTML = '<p style="color: #ff4444; font-weight: bold; font-size:13px;">⚠️ Lỗi kết nối máy chủ local!</p>'; }
}
document.addEventListener('DOMContentLoaded', loadGenerals);