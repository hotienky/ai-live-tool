export const industryTemplates = {
  pharmacy: [
    {
      id: "pharmacy_banner",
      type: "banner",
      enabled: true,
      order: 0,
      params: { height: "lg", autoplay: true, interval: 4000 },
      content: [
        {
          link: "#",
          image: "https://production-cdn.pharmacity.io/digital/1590x0/plain/e-com/images/banners/20260323021629-0-Slidebanner_Desktop.png",
          title: "Sức khỏe vươn xa",
        },
        {
          link: "#",
          image: "https://production-cdn.pharmacity.io/digital/1590x0/plain/e-com/images/banners/20260302094351-0-thangcuanang-web.png",
          title: "Quà tặng phái đẹp",
        }
      ]
    },
    {
      id: "pharmacy_feature_links",
      type: "feature_links",
      enabled: true,
      order: 1,
      params: { columns: 4, style: "card", fullWidth: false },
      content: [
        { url: "#", title: "Tư vấn mua thuốc", icon: "https://cdn-icons-png.flaticon.com/512/3004/3004381.png", bgColor: "#fdf2f8", subtitle: "Trực tuyến 24/7" },
        { url: "#", title: "Chat cùng Dược Sĩ", icon: "https://cdn-icons-png.flaticon.com/512/3008/3008432.png", bgColor: "#eff6ff", subtitle: "Zalo/Hotline" },
        { url: "#", title: "Hệ thống nhà thuốc", icon: "https://cdn-icons-png.flaticon.com/512/4320/4320350.png", bgColor: "#f0fdf4", subtitle: "Gần bạn nhất" },
        { url: "#", title: "Đơn thuốc cá nhân", icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png", bgColor: "#fefce8", subtitle: "Theo dõi dễ dàng" }
      ]
    },
    {
      id: "pharmacy_categories",
      type: "categories",
      enabled: true,
      order: 2,
      params: { title: "Danh mục nổi bật", columns: 6, showCount: false, layoutStyle: "circle_icon" },
      content: []
    },
    {
      id: "pharmacy_flash_sale",
      type: "flash_sale",
      enabled: true,
      order: 3,
      params: { title: "Giờ vàng giá sốc", count: 5, theme: "orange_strip", columns: 5, showTimer: true },
      content: []
    },
    {
      id: "pharmacy_featured_1",
      type: "featured_products",
      enabled: true,
      order: 4,
      params: { title: "Thuốc Giao Nhanh", count: 8, columns: 4, layoutStyle: "carousel", autoplay: false, sortOrder: "bestselling" },
      content: []
    },
    {
      id: "pharmacy_trust_badges",
      type: "trust_badges",
      enabled: true,
      order: 5,
      params: { layout: "grid", background: "#f8f9fa", columns: 3 },
      content: [
        { title: "Thuốc Chính Hãng", icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png", description: "100% thuốc có nguồn gốc rõ ràng" },
        { title: "Giao Hàng 2H", icon: "https://cdn-icons-png.flaticon.com/512/2769/2769339.png", description: "Freeship cho đơn trên 300k" },
        { title: "Đổi Trả 15 Ngày", icon: "https://cdn-icons-png.flaticon.com/512/2313/2313131.png", description: "Đổi thuốc miễn phí tận nơi" }
      ]
    },
    {
      id: "pharmacy_blogs",
      type: "blog_posts",
      enabled: true,
      order: 6,
      params: { title: "Góc Sức Khoẻ", count: 3, layoutView: "grid" },
      content: []
    }
  ],

  fashion: [
    {
      id: "fashion_banner",
      type: "banner",
      enabled: true,
      order: 0,
      params: { height: "fullscreen", autoplay: true, interval: 5000 },
      content: [
        {
          link: "#",
          image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2671&auto=format&fit=crop",
          title: "BỘ SƯU TẬP MÙA HÈ 2026",
          caption: "Khám phá ngay xu hướng mới nhất"
        },
        {
          link: "#",
          image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2670&auto=format&fit=crop",
          title: "SANG TRỌNG & TINH TẾ",
          caption: "Phong cách Minimalism lên ngôi"
        }
      ]
    },
    {
      id: "fashion_feature_links",
      type: "feature_links",
      enabled: true,
      order: 1,
      params: { columns: 3, style: "minimal", fullWidth: true },
      content: [
        { url: "#", title: "MẪU MỚI NHẤT", icon: "https://cdn-icons-png.flaticon.com/512/863/863684.png" },
        { url: "#", title: "BEST SELLERS", icon: "https://cdn-icons-png.flaticon.com/512/411/411763.png" },
        { url: "#", title: "GÓC ƯU ĐÃI", icon: "https://cdn-icons-png.flaticon.com/512/879/879757.png" }
      ]
    },
    {
      id: "fashion_featured_1",
      type: "featured_products",
      enabled: true,
      order: 2,
      params: { title: "SẢN PHẨM NỔI BẬT", count: 8, columns: 4, layoutStyle: "grid", sortOrder: "newest" },
      content: []
    },
    {
      id: "fashion_image_banner",
      type: "image_banner",
      enabled: true,
      order: 3,
      params: { fullWidth: true, desktopImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2670&auto=format&fit=crop" },
      content: []
    },
    {
      id: "fashion_brands",
      type: "brands_slider",
      enabled: true,
      order: 4,
      params: { title: "Thương hiệu nổi bật", slidesPerView: 5 },
      content: [
        { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1200px-Adidas_Logo.svg.png", url: "#" },
        { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png", url: "#" },
        { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Zara_Logo.svg/1200px-Zara_Logo.svg.png", url: "#" },
        { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Lacoste_logo.svg/1200px-Lacoste_logo.svg.png", url: "#" },
        { image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Under_armour_logo.svg/1200px-Under_armour_logo.svg.png", url: "#" }
      ]
    },
    {
      id: "fashion_newsletter",
      type: "newsletter",
      enabled: true,
      order: 5,
      params: { title: "Đăng Ký Nhận Bản Tin", description: "Giảm ngay 10% cho đơn hàng đầu tiên của bạn", buttonText: "Đăng ký" },
      content: []
    }
  ],

  restaurant: [
    {
      id: "res_banner",
      type: "banner",
      enabled: true,
      order: 0,
      params: { height: "fullscreen", autoplay: true, interval: 6000 },
      content: [
        {
          link: "#",
          image: "https://images.unsplash.com/photo-1544025162-8315ea070d40?q=80&w=2574&auto=format&fit=crop",
          title: "HƯƠNG VỊ ĐỈNH CAO",
          caption: "Khám phá ẩm thực tuyệt vời tại nhà hàng của chúng tôi"
        }
      ]
    },
    {
      id: "res_feature_links",
      type: "feature_links",
      enabled: true,
      order: 1,
      params: { columns: 3, style: "card", fullWidth: false },
      content: [
        { url: "#", title: "Đặt Bàn Ngay", icon: "https://cdn-icons-png.flaticon.com/512/2821/2821814.png", bgColor: "#fff1e6", subtitle: "Nhanh chóng & Tiện lợi" },
        { url: "#", title: "Khám Phá Menu", icon: "https://cdn-icons-png.flaticon.com/512/1046/1046772.png", bgColor: "#e0fbfc", subtitle: "Hơn 50+ món ngon" },
        { url: "#", title: "Ưu Đãi", icon: "https://cdn-icons-png.flaticon.com/512/879/879757.png", bgColor: "#ecf39e", subtitle: "Giảm giá đặc biệt" }
      ]
    },
    {
      id: "res_featured",
      type: "featured_products",
      enabled: true,
      order: 2,
      params: { title: "CÁC MÓN SIGNATURE", count: 6, columns: 3, layoutStyle: "grid", sortOrder: "bestselling" },
      content: []
    },
    {
      id: "res_testimonials",
      type: "testimonials",
      enabled: true,
      order: 3,
      params: { title: "Thực Khách Nói Gì Về Chúng Tôi" },
      content: [
        { name: "Anh Nam", role: "Khách hàng thường xuyên", avatar: "https://i.pravatar.cc/150?u=1", comment: "Đồ án rất ngon, không gian ấm cúng. Rất phù hợp cho gia đình cuối tuần." },
        { name: "Chị Hoa", role: "Reviewer", avatar: "https://i.pravatar.cc/150?u=2", comment: "Bò bít tết ở đây tuyệt vời, thịt mềm rụm, sốt tiêu đen đậm đà!" }
      ]
    },
    {
      id: "res_text",
      type: "text_block",
      enabled: true,
      order: 4,
      params: { content: "<h2 style='text-align:center;'>Không Gian Ấm Cúng</h2><p style='text-align:center;color:#666;'>Tọa lạc tại trung tâm thành phố, nhà hàng cung cấp một không gian lý tưởng cho các buổi hẹn hò, họp mặt gia đình hay thiết đãi đối tác.</p>", alignment: "center" },
      content: []
    }
  ],

  spa: [
    {
      id: "spa_banner",
      type: "banner",
      enabled: true,
      order: 0,
      params: { height: "lg", autoplay: true, interval: 5000 },
      content: [
        {
          link: "#",
          image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2670&auto=format&fit=crop",
          title: "THƯ GIÃN ĐÍCH THỰC",
          caption: "Đánh thức vẻ đẹp tiềm ẩn của bạn"
        }
      ]
    },
    {
      id: "spa_feature",
      type: "feature_links",
      enabled: true,
      order: 1,
      params: { columns: 4, style: "minimal", fullWidth: false },
      content: [
        { url: "#", title: "Massage Therapy", icon: "https://cdn-icons-png.flaticon.com/512/3063/3063168.png", bgColor: "#fdf2f8" },
        { url: "#", title: "Skincare Care", icon: "https://cdn-icons-png.flaticon.com/512/2926/2926317.png", bgColor: "#eff6ff" },
        { url: "#", title: "Tắm Trắng Thải Độc", icon: "https://cdn-icons-png.flaticon.com/512/2821/2821814.png", bgColor: "#f0fdf4" },
        { url: "#", title: "Đặt Lịch Ngay", icon: "https://cdn-icons-png.flaticon.com/512/2362/2362366.png", bgColor: "#fefce8" }
      ]
    },
    {
      id: "spa_text",
      type: "text_block",
      enabled: true,
      order: 2,
      params: { content: "<h2 style='text-align:center;'>Không Gian Tĩnh Lặng & Bình Yên</h2><p style='text-align:center;max-width:600px;margin:10px auto;color:#666'>Tận hưởng phút giây thư thái nhất sau những giờ làm việc mệt mỏi tại không gian tràn đầy hương hoa và tiếng nhạc phương đông du dương.</p>", alignment: "center" },
      content: []
    },
    {
      id: "spa_gallery",
      type: "image_gallery",
      enabled: true,
      order: 3,
      params: { title: "Không Gian Trải Nghiệm", columns: 3, gap: 10 },
      content: [
        { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop" },
        { url: "https://images.unsplash.com/photo-1519821172144-4f87d8d16147?q=80&w=800&auto=format&fit=crop" },
        { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop" }
      ]
    },
    {
      id: "spa_testimonials",
      type: "testimonials",
      enabled: true,
      order: 4,
      params: { title: "Cảm nhận khách hàng" },
      content: [
        { name: "Lê Na", role: "Khách Vip", avatar: "https://i.pravatar.cc/150?u=12", comment: "Massage đá nóng rất thoải mái, nhân viên rất kỹ năng, không gian yên tĩnh." },
        { name: "Minh Châu", role: "Khách hàng", avatar: "https://i.pravatar.cc/150?u=15", comment: "Liệu trình trị thâm da rất hiệu quả, sau 3 buổi đã sáng hẳn lên." }
      ]
    }
  ],

  realestate: [
    {
      id: "re_banner",
      type: "image_banner",
      enabled: true,
      order: 0,
      params: { desktopImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop", fullWidth: true, height: "600px" },
      content: []
    },
    {
      id: "re_links",
      type: "feature_links",
      enabled: true,
      order: 1,
      params: { columns: 4, style: "card", fullWidth: false },
      content: [
        { url: "#", title: "Căn Hộ Cao Cấp", icon: "https://cdn-icons-png.flaticon.com/512/2060/2060001.png", bgColor: "#fff" },
        { url: "#", title: "Nhà Phố Yên Tĩnh", icon: "https://cdn-icons-png.flaticon.com/512/2060/2060046.png", bgColor: "#fff" },
        { url: "#", title: "Đất Nền Đầu Tư", icon: "https://cdn-icons-png.flaticon.com/512/2060/2060064.png", bgColor: "#fff" },
        { url: "#", title: "Mặt Bằng Cho Thuê", icon: "https://cdn-icons-png.flaticon.com/512/2060/2060139.png", bgColor: "#fff" }
      ]
    },
    {
      id: "re_featured",
      type: "featured_products",
      enabled: true,
      order: 2,
      params: { title: "Dự Án Nổi Bật", count: 6, columns: 3, layoutStyle: "grid", sortOrder: "newest" },
      content: []
    },
    {
      id: "re_text",
      type: "text_block",
      enabled: true,
      order: 3,
      params: { content: "<h2 style='text-align:center;'>Vì Sao Chọn Chúng Tôi?</h2><div style='display:flex;justify-content:space-around;max-width:800px;margin:20px auto;color:#555;'><div>💼 Pháp lý rõ ràng 100%</div><div>⚡ Khởi thông tính thanh khoản siêu tốc</div><div>🏦 Ngân hàng đối tác hỗ trợ đến 70% giá trị dự án</div></div>", alignment: "center" },
      content: []
    },
    {
      id: "re_blogs",
      type: "blog_posts",
      enabled: true,
      order: 4,
      params: { title: "Tin Tức Thị Trường", count: 3, layoutView: "grid" },
      content: []
    }
  ],

  blog: [
    {
      id: "blog_banner",
      type: "image_banner",
      enabled: true,
      order: 0,
      params: { desktopImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2670&auto=format&fit=crop", fullWidth: true, height: "400px" },
      content: []
    },
    {
      id: "blog_latest",
      type: "blog_posts",
      enabled: true,
      order: 1,
      params: { title: "Bài Viết Mới Nhất", count: 6, layoutView: "grid" },
      content: []
    },
    {
      id: "blog_newsletter",
      type: "newsletter",
      enabled: true,
      order: 2,
      params: { title: "Đăng Ký Nhận Tin", description: "Cập nhật bài viết hay mỗi tuần", buttonText: "Theo dõi" },
      content: []
    }
  ],

  event: [
    {
      id: "event_banner",
      type: "banner",
      enabled: true,
      order: 0,
      params: { height: "fullscreen", autoplay: true, interval: 5000 },
      content: [
        {
          link: "#",
          image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2670&auto=format&fit=crop",
          title: "SỰ KIỆN CÔNG NGHỆ 2026",
          caption: "Hội tụ những chuyên gia hàng đầu"
        }
      ]
    },
    {
      id: "event_flash",
      type: "flash_sale",
      enabled: true,
      order: 1,
      params: { title: "Đếm ngược mở bán vé Early Bird", count: 4, theme: "orange_strip", columns: 4, showTimer: true },
      content: []
    },
    {
      id: "event_testimonials",
      type: "testimonials",
      enabled: true,
      order: 2,
      params: { title: "Người Tham Dự Nói Gì" },
      content: [
        { name: "John Doe", role: "CEO Tech", avatar: "https://i.pravatar.cc/150?u=44", comment: "Sự kiện được tổ chức cực kỳ tuyệt vời và mang lại giá trị cao." }
      ]
    }
  ],

  service: [
    {
      id: "service_banner",
      type: "image_banner",
      enabled: true,
      order: 0,
      params: { desktopImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2669&auto=format&fit=crop", fullWidth: true, height: "500px" },
      content: []
    },
    {
      id: "service_feature",
      type: "feature_links",
      enabled: true,
      order: 1,
      params: { columns: 4, style: "card", fullWidth: false },
      content: [
        { url: "#", title: "Dịch Vụ Tư Vấn", icon: "https://cdn-icons-png.flaticon.com/512/3063/3063168.png", bgColor: "#eff6ff" },
        { url: "#", title: "Triển Khai Phần Mềm", icon: "https://cdn-icons-png.flaticon.com/512/2926/2926317.png", bgColor: "#f0fdf4" },
        { url: "#", title: "Bảo Trì Hệ Thống", icon: "https://cdn-icons-png.flaticon.com/512/2821/2821814.png", bgColor: "#fdf2f8" },
        { url: "#", title: "Đào Tạo Chuyên Sâu", icon: "https://cdn-icons-png.flaticon.com/512/2362/2362366.png", bgColor: "#fcfce8" }
      ]
    },
    {
      id: "service_faq",
      type: "faq",
      enabled: true,
      order: 2,
      params: { title: "Câu Hỏi Thường Gặp" },
      content: [
        { question: "Thời gian triển khai bao lâu?", answer: "Thông thường từ 2-4 tuần." },
        { question: "Chi phí như thế nào?", answer: "Phụ thuộc vào quy mô dự án của bạn." }
      ]
    }
  ]
}
