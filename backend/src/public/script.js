let currentSkillElement = null; 
let currentSkillName = "";      

/**
 * HÀM CŨ: Xử lý cơ chế Rút 3 chọn 1 (Cho Độn Thế & Bác Lãm)
 */
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
        
        if (titleElement) {
            titleElement.innerText = `🔮 Chọn 1 trong 3 kỹ năng để lĩnh hội 🔮`;
        }

        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div');
            option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc);
            list.appendChild(option);
        });
    } catch (err) {
        list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi kết nối kho báu!</p>';
    }
}

/**
 * HÀM MỚI TÁCH RIÊNG: Xử lý cơ chế Rút 4 chọn 1 (Dành riêng cho phe Thần)
 */
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
        
        if (titleElement) {
            titleElement.innerText = `⚡ Chọn 1 trong 4 bí kỹ Thần tối cao ⚡`;
        }

        list.innerHTML = '';
        skills.forEach(skill => {
            const option = document.createElement('div');
            option.className = 'choice-item';
            option.innerHTML = `<span class="skill-name" style="color:#ffcc00">【${skill.name}】</span> ${skill.desc}`;
            option.onclick = () => selectSkill(skill.name, skill.desc);
            list.appendChild(option);
        });
    } catch (err) {
        list.innerHTML = '<p style="color:#ff4444; font-size:12px;">Lỗi triệu hồi thần lực!</p>';
    }
}

// Hàm xử lý khi người dùng ấn chọn 1 kỹ năng để đưa vào Box lưu trữ
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteSkill(btnElement) {
    btnElement.parentElement.remove();
    const selectedList = document.getElementById('selectedList');
    if (selectedList.children.length === 0) {
        selectedList.innerHTML = '<div class="empty-msg">Chưa có kỹ năng nào được chọn. Hãy nhấn vào các ô kỹ năng đặc biệt phía trên.</div>';
    }
}

// Hàm khởi tạo tải thông tin các tướng từ Backend
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
                
                // ĐÃ SỬA: Kiểm tra chính xác theo tên kỹ năng thực tế trên DB
                if (s.name === "Độn Thế") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '/api/random-three-skills')`);
                } 
                else if (s.name === "Bác Lãm") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger3pick1(this, '${s.name}', '/api/random-baclam-skills')`);
                } 
                // ĐÃ SỬA: Chuyển từ Quy Tâm thành Ngự Hành và trỏ đúng đường dẫn API mới
                else if (s.name === "Ngự Hành") {
                    skillBox.className = 'skill-box clickable-donthe';
                    skillBox.setAttribute('onclick', `trigger4pick1(this, '${s.name}', '/api/random-nguhanh-skills')`);
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