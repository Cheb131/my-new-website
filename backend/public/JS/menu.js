
document.addEventListener("DOMContentLoaded", () => {
     divider.style.margin = "8px 0";
     divider.style.opacity = "0.8";
 
     mnavList.appendChild(divider);
 
     if (!user?.username) {
       // Đăng nhập
       const { li: liLogin, a: aLogin } = makeLi("Đăng nhập", "#");
       aLogin.addEventListener("click", (e) => {
         e.preventDefault();
         closeNav();
         openLoginModal();
       });
       mnavList.appendChild(liLogin);
 
       // Đăng ký
       const { li: liReg } = makeLi("Đăng ký", "register.html");
       mnavList.appendChild(liReg);
       return;
     }
 
     const role = user.role || "user";
     const isAdmin = role === "admin";
     const isManager = role === "manager";
 
    mnavList.appendChild(makeLi("Thông tin nhân vật", "character.html").li);

    if (isAdmin) {
      mnavList.appendChild(makeLi("Tạo nhân vật (Admin)", "character-create.html").li);
    }

     if (isAdmin || isManager) {
       mnavList.appendChild(makeLi("Đăng bài viết", "post.html").li);
     }
     if (isAdmin) {
       mnavList.appendChild(makeLi("Quản lý bài viết", "my-posts.html").li);
       // nếu bạn có trang users.html (admin quản lý user) thì mở thêm dòng này:
       // mnavList.appendChild(makeLi("Quản lý tài khoản", "users.html").li);
     }
 
     const { li: liLogout, a: aLogout } = makeLi("Đăng xuất", "#");
     aLogout.addEventListener("click", (e) => {
       e.preventDefault();
       localStorage.removeItem("user");
       localStorage.removeItem("token");
       closeNav();
       // reload để cập nhật UI
       window.location.reload();
     });
     mnavList.appendChild(liLogout);
   });
 
   // ========== OPEN/CLOSE ==========
  const openNav = () => {
     syncAuthItems();
     document.body.classList.add("mnav-open");
   };
  