       if (!user) {
         userDropdown.innerHTML = `
           <li><a href="#" id="loginAction">Đăng nhập</a></li>
           <li><a href="#" id="registerAction">Đăng ký</a></li>
         `;
 
         document.getElementById("loginAction")?.addEventListener("click", (e) => {
           e.preventDefault();
           navUserBox.classList.remove("open");
           openModal();
         });
 
         document.getElementById("registerAction")?.addEventListener("click", (e) => {
           e.preventDefault();
           navUserBox.classList.remove("open");
           window.location.href = "register.html";
         });
       } else {
           const role = user.role || "user";
           const isAdmin = role === "admin";
           const isManager = role === "manager";
 
           userDropdown.innerHTML = `
            <li><a href="character.html">Thông tin nhân vật</a></li>
            ${isAdmin ? `<li><a href="character-create.html">Tạo nhân vật (Admin)</a></li>` : ""}
             ${(isAdmin || isManager) ? `<li><a href="post.html">Đăng bài viết</a></li>` : ""}
             ${isAdmin ? `<li><a href="my-posts.html">Quản lý bài viết</a></li>` : ""}
             <li><a href="#" id="logoutAction">Đăng xuất</a></li>
           `;
 
           document.getElementById("logoutAction")?.addEventListener("click", (e) => {
             e.preventDefault();
             clearUser();
             localStorage.removeItem("token");
             navUserBox.classList.remove("open");
             renderDropdown();
           });
         }
     
 
     userToggleBtn.addEventListener("click", (e) => {
       e.preventDefault();
       renderDropdown();
       navUserBox.classList.toggle("open");
     });
 
     document.addEventListener("click", (e) => {
       if (!navUserBox.contains(e.target)) navUserBox.classList.remove("open");
     });
 
