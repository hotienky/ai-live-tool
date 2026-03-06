/**
 * Mock comment service để test giao diện mà không cần kết nối TikTok/Gemini
 */

const MOCK_COMMENTS = [
  // HOT comments
  {
    nickname: "Nguyễn Thị Hoa",
    uniqueId: "hoa_nguyen_92",
    comment: "Bình sữa này bé nhà mình 6 tháng dùng size nào? 0901234567 chốt cho mình 2 bình nhé",
    expectedLabel: "[HOT]",
  },
  {
    nickname: "Trần Minh Anh",
    uniqueId: "minhanh_baby",
    comment: "Chốt cho mình 1 bộ quần áo size 80 và 1 bình sữa nhé. SĐT: 0987654321",
    expectedLabel: "[HOT]",
  },
  {
    nickname: "Lê Thùy Trang",
    uniqueId: "trang_le_mom",
    comment: "Mình muốn mua 3 hộp sữa, ship về Đà Nẵng bao nhiêu tiền vậy shop? Chuyển khoản được không?",
    expectedLabel: "[HOT]",
  },
  {
    nickname: "Phạm Thanh Hà",
    uniqueId: "ha_pham_2024",
    comment: "Đặt cho mình bộ đồ sơ sinh nhé, 0912345678, giao nhanh giúp mình",
    expectedLabel: "[HOT]",
  },

  // WARM comments
  {
    nickname: "Vũ Thu Hương",
    uniqueId: "huong_vu_baby",
    comment: "Bình sữa này chất liệu gì vậy mẹ? Có chứa BPA không?",
    expectedLabel: "[WARM]",
  },
  {
    nickname: "Đỗ Ngọc Lan",
    uniqueId: "lan_do_mom",
    comment: "Bé nhà mình 8kg, 5 tháng tuổi thì nên dùng size nào vậy ạ?",
    expectedLabel: "[WARM]",
  },
  {
    nickname: "Hoàng Mai Chi",
    uniqueId: "chi_hoang_95",
    comment: "Tã dán này giá bao nhiêu vậy chị? Có combo nào rẻ hơn không?",
    expectedLabel: "[WARM]",
  },
  {
    nickname: "Ngô Thị Kim",
    uniqueId: "kim_ngo_baby",
    comment: "Sữa này cách pha như thế nào ạ? Bé nhà mình hay bị đầy bụng uống được không?",
    expectedLabel: "[WARM]",
  },
  {
    nickname: "Bùi Thanh Nhàn",
    uniqueId: "nhan_bui_99",
    comment: "Cho mình hỏi bỉm này có mấy size vậy? Bé nhà mình 10kg dùng size nào?",
    expectedLabel: "[WARM]",
  },

  // COLD comments
  {
    nickname: "Lý Minh Đức",
    uniqueId: "duc_ly_fan",
    comment: "Mẹ Bin hôm nay xinh quá ❤️",
    expectedLabel: "[COLD]",
  },
  {
    nickname: "Trương Hồng Nhung",
    uniqueId: "nhung_truong",
    comment: "Chào mọi người 👋 Mới vào live nè",
    expectedLabel: "[COLD]",
  },
  {
    nickname: "Cao Thị Yến",
    uniqueId: "yen_cao_123",
    comment: "🔥🔥🔥 Live hay quá chị ơi",
    expectedLabel: "[COLD]",
  },
  {
    nickname: "Phan Văn Long",
    uniqueId: "long_phan",
    comment: "Hôm nay trời đẹp quá mọi người nhỉ",
    expectedLabel: "[COLD]",
  },
  {
    nickname: "Đinh Thị Hạnh",
    uniqueId: "hanh_dinh_fan",
    comment: "Em follow chị lâu rồi, hôm nay mới vào live được ❤️❤️",
    expectedLabel: "[COLD]",
  },
  {
    nickname: "Mai Quốc Bảo",
    uniqueId: "bao_mai_tv",
    comment: "Chị ơi hôm nay live đến mấy giờ vậy ạ?",
    expectedLabel: "[COLD]",
  },
  {
    nickname: "Lương Thị Thảo",
    uniqueId: "thao_luong_mom",
    comment: "Bé yêu dễ thương quá các mẹ ơi 😍",
    expectedLabel: "[COLD]",
  },
];

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=hoa",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=anh",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=trang",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ha",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=huong",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=lan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=chi",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=kim",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=nhan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=duc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=nhung",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=yen",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=long",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=hanh",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=bao",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=thao",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=mom",
];

let commentIndex = 0;
let mockInterval = null;

/**
 * Bắt đầu phát mock comments mỗi 2-4 giây
 * @param {object} io - Socket.io server instance
 * @param {object} stats - Shared stats object
 */
function startMockComments(io, stats) {
  console.log("🎭 Mock Mode: Bắt đầu phát comment giả lập...");

  io.emit("crawler_status", { status: "connected", mode: "mock" });

  mockInterval = setInterval(() => {
    const mockData = MOCK_COMMENTS[commentIndex % MOCK_COMMENTS.length];
    const avatarUrl = AVATARS[commentIndex % AVATARS.length];

    const commentData = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      platform: "mock",
      nickname: mockData.nickname,
      uniqueId: mockData.uniqueId,
      comment: mockData.comment,
      label: mockData.expectedLabel,
      profileLink: `https://www.tiktok.com/@${mockData.uniqueId}`,
      profilePictureUrl: avatarUrl,
      timestamp: new Date().toISOString(),
    };

    // Update stats
    if (commentData.label === "[HOT]") stats.hot++;
    else if (commentData.label === "[WARM]") stats.warm++;
    else stats.cold++;
    stats.total++;

    // Emit
    io.emit("new_comment", commentData);
    io.emit("stats_update", { ...stats });

    const icon =
      commentData.label === "[HOT]"
        ? "🔥"
        : commentData.label === "[WARM]"
          ? "🟠"
          : "⚪";
    console.log(
      `${icon} ${commentData.label} @${commentData.uniqueId}: ${commentData.comment.substring(0, 50)}...`
    );

    commentIndex++;
  }, 2000 + Math.random() * 2000); // 2-4 giây random
}

/**
 * Dừng phát mock comments
 */
function stopMockComments() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
    console.log("🛑 Mock Mode: Đã dừng phát comment");
  }
}

module.exports = { startMockComments, stopMockComments, MOCK_COMMENTS, AVATARS };
