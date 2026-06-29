let currentSkillElement = null; 
let currentSkillName = "";      

// HÀM 1: Cơ chế Rút 3 chọn 1
async function trigger3pick1(element, originalName, apiUrl) {
    currentSkillElement = element;
    currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel');
    const list = document.getElementById('choicesList');
    const titleElement = panel.querySelector('h3');
    
    panel.style.display = "block";
    list.innerHTML = '<p class="status-msg" style="font-size:12px;">Đang bốc 3 quẻ bùa...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);

    try {
        const response = await fetch(apiUrl);
        const skills = await response.json();
        if (titleElement) titleElement.innerText = `🔮 Chọn 1 trong 3 kỹ năng để lĩnh hội 🔮`;
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div');
            option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc);
            list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi kết nối máy chủ!</p>'; }
}

// HÀM 2: Cơ chế Rút 4 chọn 1
async function trigger4pick1(element, originalName, apiUrl) {
    currentSkillElement = element;
    currentSkillName = originalName; 
    const panel = document.getElementById('choicesPanel');
    const list = document.getElementById('choicesList');
    const titleElement = panel.querySelector('h3');
    
    panel.style.display = "block";
    list.innerHTML = '<p class="status-msg" style="font-size:12px;">Đang triệu gọi 4 quẻ thần bùa...</p>';
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth' }); }, 100);

    try {
        const response = await fetch(apiUrl);
        const skills = await response.json();
        if (titleElement) titleElement.innerText = `⚡ Chọn 1 trong 4 bí kỹ tối cao ⚡`;
        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div');
            option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc);
            list.appendChild(option);
        });
    } catch (err) { list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi triệu hồi thần lực!</p>'; }
}

// HÀM MỚI: Cơ chế Roll 1 lấy luôn (Dành riêng cho Long Tụng - Không hiển thị bảng chọn)
async function trigger1pick1(element, originalName, apiUrl) {
    currentSkillElement = element;
    currentSkillName = originalName;
    
    // Ẩn bảng panel chọn đi (đề phòng người chơi đang mở dở panel từ tướng khác)
    document.getElementById('choicesPanel').style.display = "none";

    try {
        const response = await fetch(apiUrl);
        const skill = await response.json();
        
        // Tự động đẩy thẳng vào Box lưu trữ luôn không cần bấm chọn!
        selectSkill(skill.name, skill.desc);
    } catch (err) {
        alert("Lỗi triệu gọi kỹ năng cưỡng ép!");
    }
}

// Đưa kỹ năng vào Box chứa list lưu trữ
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

// Hàm render thẻ tướng
async function loadGenerals() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p class="status-msg" style="font-size:14px;">Đang triệu hồi các võ tướng...</p>';
    
    try {
        const response = await fetch('/api/generals');
        const generals = await response.json();
        
        resultDiv.innerHTML = '';
        generals.forEach((gen, index) => {
            const card = document.createElement('div');
            card.className = 'card donthe-effect';
            
            const baseColor = gen.bg_color || '#4a3525';
            card.style.backgroundColor = baseColor;
            card.style.setProperty('--theme-color', baseColor);
            card.style.zIndex = generals.length - index; 
            
            const wrapper = document.createElement('div');
            wrapper.className = 'skills-wrapper';
            
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
                // PHÂN PHỐI CHO SKILL MỚI: Long Tụng kích hoạt hàm lấy luôn 1 skill
                else if (s.name === "Long Tụng") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger1pick1(this, '${s.name}', '/api/random-longtung-skill')`);
                }
                else {
                    skillBox.className = 'skill-box';
                }
                
                skillBox.innerHTML = `<span class="skill-name">【${s.name}】</span>${s.desc}`;
                wrapper.appendChild(skillBox);
            });

            card.innerHTML = `
                <span class="kingdom">${gen.kingdom}</span>
                <h2>${gen.name}</h2>
                <span class="title-tag">Danh hiệu: ${gen.title}</span>
            `;
            card.appendChild(wrapper);
            resultDiv.appendChild(card);
        });
    } catch (error) {
        resultDiv.innerHTML = '<p style="color: #ff4444; font-weight: bold; font-size:13px;">⚠️ Lỗi kết nối máy chủ local!</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadGenerals);