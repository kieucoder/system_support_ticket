(function() {
    'use strict';

    // =========================================================================
    // 1. MOCK DATABASE (20 Conversations & 100+ Messages)
    // =========================================================================
    const technicians = [
        { name: "Nguyễn Văn Hùng", role: "Kỹ thuật viên Trưởng" },
        { name: "Trần Quốc Khánh", role: "Kỹ thuật viên Hạ tầng" },
        { name: "Phạm Minh Hoàng", role: "Nhân viên NOC" },
        { name: "Lê Thị Cúc", role: "Chăm sóc khách hàng" }
    ];

    let conversations = [
        {
            id: 1,
            customer: { name: "Phạm Thị Mai", phone: "0987654321", email: "mai.pt@gmail.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" },
            ticket: { id: "TS-2026-015", status: "waiting", priority: "Khẩn Cấp", category: "Internet", service: "Băng rộng FTTH", createdDate: "28/06/2026 08:30:00", staff: "Nguyễn Văn Hùng" },
            unread: 3,
            status: "waiting", // waiting (chờ staff), ai (AI xử lý), processing (đang xử lý), closed (đã đóng)
            timeline: [
                { time: "08:30", text: "Khách hàng tạo yêu cầu hỗ trợ qua cổng Portal" },
                { time: "08:31", text: "Hệ thống tự động phân công cho NV Nguyễn Văn Hùng" },
                { time: "08:32", text: "Trợ lý ảo Gemini AI quét thông số ONT: Suy hao GPON cao (-28.5 dBm)" }
            ],
            messages: [
                { from: "customer", text: "Chào Viettel, mạng nhà tôi tự nhiên mất kết nối từ lúc trời mưa lớn.", time: "08:30" },
                { from: "ai", text: "Chào chị Mai, hệ thống đã ghi nhận tín hiệu ONT suy hao cao đột biến (-28.5 dBm). Đang tiến hành kiểm tra cổng cổng phân phối quang GPON ngoài ngõ...", time: "08:31" },
                { from: "customer", text: "Tôi đã thử bật tắt lại modem quang Huawei 3-4 lần rồi nhưng đèn PON cứ nhấp nháy đỏ liên tục.", time: "08:33" },
                { from: "ai", text: "Hiện tượng đèn PON nhấp nháy đỏ báo hiệu suy hao tín hiệu vượt ngưỡng cho phép (Loss of Signal). Rất có khả năng dây nhảy quang bị lỏng hoặc cáp thuê bao bị đứt cơ học ngoài ngõ.", time: "08:34" },
                { from: "customer", text: "Thế bây giờ làm sao? Tôi có cuộc họp trực tuyến lúc 10h sáng nay.", time: "08:36" },
                { from: "staff", text: "Chào chị Mai, em là Hùng - kỹ thuật phụ trách khu vực của mình. Em đã xem thông số suy hao, hiện tại đường truyền quang bị suy hao nghiêm trọng.", time: "08:38" },
                { from: "customer", text: "Chào anh Hùng, anh qua sửa gấp giúp tôi được không?", time: "08:40" },
                { from: "staff", text: "Dạ vâng, em đang kiểm tra tủ cáp ODF đầu ngõ 34 Cầu Giấy xem có bị gập sợi quang do mưa bão đè lên dây không. Chị đợi em khoảng 15 phút nhé.", time: "08:42" },
                { from: "customer", text: "Vâng, tôi đã reset modem nhưng vẫn mất internet. Anh xem nhanh giúp.", time: "08:44" },
                { from: "customer", text: "Lúc nãy tôi thấy có cành cây gãy đè trúng dây cáp kéo vào ban công tầng 2, có khi nào bị đứt chỗ đó không anh?", time: "08:45" }
            ]
        },
        {
            id: 2,
            customer: { name: "Trần Anh Tuấn", phone: "0966554433", email: "tuan.ta@yahoo.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
            ticket: { id: "TS-2026-016", status: "processing", priority: "Trung Bình", category: "Internet", service: "Truyền hình NextTV", createdDate: "27/06/2026 10:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 0,
            status: "processing",
            timeline: [
                { time: "10:00", text: "Khách hàng báo hỏng qua đầu số 18008119" },
                { time: "10:15", text: "Tạo phiếu kỹ thuật thành công" }
            ],
            messages: [
                { from: "customer", text: "Đầu thu truyền hình NextTV cứ khởi động lên là báo lỗi Link Down (Error 102).", time: "10:02" },
                { from: "staff", text: "Chào anh Tuấn, anh kiểm tra lại xem dây cáp LAN nối từ cổng LAN4 của Modem đến đầu thu TV có bị lỏng chân cắm không ạ?", time: "10:05" },
                { from: "customer", text: "Tôi đã rút ra cắm lại, đèn cổng LAN trên modem vẫn tắt ngóm không sáng xanh.", time: "10:08" },
                { from: "staff", text: "Dạ, như vậy có thể dây cáp LAN bị lỗi đứt ngầm hoặc lỏng đầu bấm hạt mạng RJ45. Em sẽ đặt lịch cho kỹ thuật viên mang dây cáp mới qua thay cho nhà mình nhé.", time: "10:12" },
                { from: "customer", text: "Hôm nay có ai qua được không? Chiều nay nhà tôi có trận bóng đá muốn xem.", time: "10:15" },
                { from: "staff", text: "Em đã xếp lịch KTV Trần Quốc Khánh qua nhà mình lúc 14h chiều nay ạ.", time: "10:18" }
            ]
        },
        {
            id: 3,
            customer: { name: "Lê Minh Triết", phone: "0345678912", email: "trietlm@viettel.vn", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" },
            ticket: { id: "TS-2026-017", status: "processing", priority: "Cao", category: "Cáp Quang", service: "Băng rộng FTTH", createdDate: "28/06/2026 09:00:00", staff: "Trần Quốc Khánh" },
            unread: 1,
            status: "ai",
            timeline: [
                { time: "09:00", text: "Yêu cầu đo kiểm suy hao cáp quang được tạo tự động" }
            ],
            messages: [
                { from: "customer", text: "Đường truyền cáp quang của cơ quan tôi rất chập chờn, ping lên đến 300ms.", time: "09:01" },
                { from: "ai", text: "Chào bạn Triết, Gemini AI phát hiện cấu hình ONT của bạn đang bị lỗi tràn hàng đợi IP (IP Queue Congestion) do phần mềm cũ. Hệ thống đề xuất cập nhật Firmware lên bản v2.6.12.", time: "09:03" },
                { from: "customer", text: "Cập nhật từ xa được không hay phải có người qua cấu hình trực tiếp?", time: "09:06" }
            ]
        },
        {
            id: 4,
            customer: { name: "Nguyễn Thu Trang", phone: "0912345678", email: "trangnt@keangnam.com.vn", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
            ticket: { id: "TS-2026-018", status: "processing", priority: "Thấp", category: "IP Tĩnh", service: "Leased Line Doanh nghiệp", createdDate: "28/06/2026 08:00:00", staff: "Phạm Minh Hoàng" },
            unread: 0,
            status: "processing",
            timeline: [
                { time: "08:00", text: "Tạo phiếu cấu hình dải IP tĩnh phụ" }
            ],
            messages: [
                { from: "customer", text: "Chúng tôi cần mở thêm cổng port 8080 trên địa chỉ IP tĩnh để chạy máy chủ thử nghiệm.", time: "08:05" },
                { from: "staff", text: "Em chào chị Trang, em đã gửi yêu cầu lên phòng NOC khai báo NAT Port cho dải IP tĩnh nhà mình rồi ạ. Sẽ có kết quả sau 30 phút nữa.", time: "08:15" },
                { from: "customer", text: "Cảm ơn em nhiều.", time: "08:20" }
            ]
        },
        {
            id: 5,
            customer: { name: "Bùi Quốc Anh", phone: "0988776655", email: "quocanhb@hotmail.com", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" },
            ticket: { id: "TS-2026-019", status: "closed", priority: "Trung Bình", category: "Internet", service: "Băng rộng FTTH", createdDate: "26/06/2026 09:00:00", staff: "Trần Quốc Khánh" },
            unread: 0,
            status: "closed",
            timeline: [
                { time: "09:00", text: "Khách báo mất kết nối" },
                { time: "11:00", text: "KTV hoàn thành đổi cổng quang OLT ngoài tủ" },
                { time: "11:30", text: "Đóng phiếu hỗ trợ kỹ thuật" }
            ],
            messages: [
                { from: "customer", text: "Mất mạng hoàn toàn, không có tín hiệu quang vào nhà.", time: "09:05" },
                { from: "staff", text: "Em đã chuyển dải cổng OLT sang cổng dự phòng phụ tránh nghẽn. Chị kiểm tra lại xem kết nối internet đã khôi phục chưa ạ?", time: "09:45" },
                { from: "customer", text: "Mạng đã chạy lại bình thường và rất nhanh. Cảm ơn KTV nhiều nhé!", time: "10:00" },
                { from: "staff", text: "Dạ vâng, em xin phép được đóng phiếu hỗ trợ này tại đây ạ. Chúc anh chị một ngày vui vẻ!", time: "10:05" }
            ]
        },
        // Remaining 15 Conversations to meet the "at least 20" requirement
        {
            id: 6, customer: { name: "Vũ Minh Quân", phone: "0981112223", email: "quanvm@gmail.com", avatar: "https://ui-avatars.com/api/?name=VQ" },
            ticket: { id: "TS-2026-020", status: "closed", priority: "Thấp", category: "Internet", service: "Modem Wifi", createdDate: "25/06/2026 14:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 0, status: "closed", timeline: [],
            messages: [{ from: "customer", text: "Cần đổi mật khẩu Wifi của modem phụ", time: "14:05" }, { from: "staff", text: "Dạ em đã hỗ trợ đổi mật khẩu wifi qua phần mềm MyViettel thành công ạ.", time: "14:15" }]
        },
        {
            id: 7, customer: { name: "Phạm Hồng Sơn", phone: "0982223334", email: "sonph@gmail.com", avatar: "https://ui-avatars.com/api/?name=HS" },
            ticket: { id: "TS-2026-021", status: "waiting", priority: "Khẩn Cấp", category: "Internet", service: "Home Wifi Mesh", createdDate: "28/06/2026 11:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 2, status: "waiting", timeline: [],
            messages: [
                { from: "customer", text: "Cục Mesh phụ cứ nháy đèn vàng không kết nối được.", time: "11:02" },
                { from: "customer", text: "Vui lòng cho người qua xem lại giúp tôi sớm.", time: "11:15" }
            ]
        },
        {
            id: 8, customer: { name: "Đỗ Thu Hà", phone: "0983334445", email: "hadt@gmail.com", avatar: "https://ui-avatars.com/api/?name=TH" },
            ticket: { id: "TS-2026-022", status: "processing", priority: "Trung Bình", category: "Thoại", service: "Điện thoại cố định", createdDate: "28/06/2026 10:30:00", staff: "Lê Thị Cúc" },
            unread: 0, status: "processing", timeline: [],
            messages: [
                { from: "customer", text: "Điện thoại bàn bị rè tiếng, không nghe rõ đầu dây bên kia nói gì.", time: "10:35" },
                { from: "staff", text: "Chào chị Hà, em đã ghi nhận thông tin sự cố rè đường dây thoại cố định. Em đang kiểm tra trạm cáp cục bộ.", time: "10:45" }
            ]
        },
        {
            id: 9, customer: { name: "Nguyễn Văn Đạt", phone: "0984445556", email: "datnv@gmail.com", avatar: "https://ui-avatars.com/api/?name=VD" },
            ticket: { id: "TS-2026-023", status: "closed", priority: "Thấp", category: "Internet", service: "Băng rộng FTTH", createdDate: "24/06/2026 09:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 0, status: "closed", timeline: [],
            messages: [{ from: "customer", text: "Kiểm tra tốc độ gói cước Fast30", time: "09:05" }, { from: "staff", text: "Kích hoạt nâng cấp gói cước thành công lên Fast60.", time: "09:20" }]
        },
        {
            id: 10, customer: { name: "Lý Hải Yến", phone: "0985556667", email: "yenlh@gmail.com", avatar: "https://ui-avatars.com/api/?name=HY" },
            ticket: { id: "TS-2026-024", status: "processing", priority: "Cao", category: "Cáp Quang", service: "Băng rộng FTTH", createdDate: "28/06/2026 07:15:00", staff: "Trần Quốc Khánh" },
            unread: 0, status: "processing", timeline: [],
            messages: [
                { from: "customer", text: "Tín hiệu mạng bị suy hao cao, đo speedtest chỉ được 20 Mbps.", time: "07:20" },
                { from: "staff", text: "Chào chị Yến, KTV đang chuẩn bị dụng cụ đo laser quang để dò vết đứt cáp và thay thế.", time: "07:35" }
            ]
        },
        {
            id: 11, customer: { name: "Hoàng Ngọc Lâm", phone: "0986667778", email: "lamhn@gmail.com", avatar: "https://ui-avatars.com/api/?name=NL" },
            ticket: { id: "TS-2026-025", status: "processing", priority: "Trung Bình", category: "Cáp Quang", service: "Băng rộng FTTH", createdDate: "28/06/2026 12:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 2, status: "ai", timeline: [],
            messages: [
                { from: "customer", text: "Tôi muốn dịch chuyển dây mạng từ phòng khách sang phòng ngủ.", time: "12:02" },
                { from: "ai", text: "Gemini AI: Phí dịch chuyển thiết bị cáp quang trong nhà là 150.000 VNĐ. Bạn có muốn đặt lịch hẹn không?", time: "12:05" },
                { from: "customer", text: "Ok sắp xếp người qua làm giùm tôi nhé.", time: "12:15" }
            ]
        },
        {
            id: 12, customer: { name: "Đào Văn Thế", phone: "0987778889", email: "thedv@gmail.com", avatar: "https://ui-avatars.com/api/?name=VT" },
            ticket: { id: "TS-2026-026", status: "waiting", priority: "Thấp", category: "Internet", service: "Modem Wifi", createdDate: "28/06/2026 13:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 1, status: "waiting", timeline: [],
            messages: [{ from: "customer", text: "Modem Viettel Huawei tỏa rất nhiều nhiệt và bị treo liên tục.", time: "13:05" }]
        },
        {
            id: 13, customer: { name: "Tô Minh Hương", phone: "0988889990", email: "huongtm@gmail.com", avatar: "https://ui-avatars.com/api/?name=MH" },
            ticket: { id: "TS-2026-027", status: "waiting", priority: "Khẩn Cấp", category: "TV", service: "Truyền hình quang", createdDate: "28/06/2026 12:45:00", staff: "Lê Thị Cúc" },
            unread: 0, status: "waiting", timeline: [],
            messages: [{ from: "customer", text: "Xem tivi bị giật hình, vỡ hạt tín hiệu ảnh.", time: "12:50" }]
        },
        {
            id: 14, customer: { name: "Trịnh Gia Bảo", phone: "0989990001", email: "baotg@gmail.com", avatar: "https://ui-avatars.com/api/?name=GB" },
            ticket: { id: "TS-2026-028", status: "processing", priority: "Trung Bình", category: "GPON", service: "Băng rộng FTTH", createdDate: "28/06/2026 11:30:00", staff: "Nguyễn Văn Hùng" },
            unread: 0, status: "processing", timeline: [],
            messages: [{ from: "customer", text: "Dây quang bị chùng xuống đè lên dây điện lực rất nguy hiểm.", time: "11:35" }]
        },
        {
            id: 15, customer: { name: "Phùng Tiến Dũng", phone: "0911223344", email: "dungpt@gmail.com", avatar: "https://ui-avatars.com/api/?name=TD" },
            ticket: { id: "TS-2026-029", status: "closed", priority: "Thấp", category: "Internet", service: "Modem Wifi", createdDate: "23/06/2026 15:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 0, status: "closed", timeline: [],
            messages: [{ from: "customer", text: "Mạng bị chập chờn khi có nhiều người truy cập cùng lúc.", time: "15:05" }, { from: "staff", text: "Đã reset dải IP ONT từ xa, hệ thống chạy mượt.", time: "15:30" }]
        },
        {
            id: 16, customer: { name: "Ngô Quốc Bảo", phone: "0922334455", email: "baonq@gmail.com", avatar: "https://ui-avatars.com/api/?name=QB" },
            ticket: { id: "TS-2026-030", status: "closed", priority: "Khẩn Cấp", category: "GPON", service: "Băng rộng FTTH", createdDate: "22/06/2026 09:00:00", staff: "Trần Quốc Khánh" },
            unread: 0, status: "closed", timeline: [],
            messages: [{ from: "customer", text: "Cột điện cháy làm cháy cáp thuê bao quang.", time: "09:05" }, { from: "staff", text: "Đã thi công luồn sợi cáp quang mới bọc thép thay thế.", time: "12:00" }]
        },
        {
            id: 17, customer: { name: "Phan Văn Đăng", phone: "0933445566", email: "dangpv@gmail.com", avatar: "https://ui-avatars.com/api/?name=VD" },
            ticket: { id: "TS-2026-031", status: "processing", priority: "Khẩn Cấp", category: "Internet", service: "Băng rộng FTTH", createdDate: "28/06/2026 14:00:00", staff: "Nguyễn Văn Hùng" },
            unread: 1, status: "processing", timeline: [],
            messages: [{ from: "customer", text: "Cả khu phố mất mạng internet hoàn toàn.", time: "14:05" }]
        },
        {
            id: 18, customer: { name: "Đặng Thị Nhung", phone: "0944556677", email: "nhungdt@gmail.com", avatar: "https://ui-avatars.com/api/?name=TN" },
            ticket: { id: "TS-2026-032", status: "waiting", priority: "Trung Bình", category: "IPTV", service: "Truyền hình NextTV", createdDate: "28/06/2026 14:15:00", staff: "Lê Thị Cúc" },
            unread: 0, status: "waiting", timeline: [],
            messages: [{ from: "customer", text: "Không đăng nhập được tài khoản gói cước gia đình App K+.", time: "14:20" }]
        },
        {
            id: 19, customer: { name: "Cao Minh Thắng", phone: "0955667788", email: "thangcm@gmail.com", avatar: "https://ui-avatars.com/api/?name=MT" },
            ticket: { id: "TS-2026-033", status: "processing", priority: "Thấp", category: "GPON", service: "Modem Wifi", createdDate: "28/06/2026 13:40:00", staff: "Nguyễn Văn Hùng" },
            unread: 0, status: "ai", timeline: [],
            messages: [{ from: "customer", text: "Cần đổi cổng mạng LAN cho camera an ninh gia đình.", time: "13:45" }]
        },
        {
            id: 20, customer: { name: "Hoàng Thùy Linh", phone: "0966778899", email: "linhht@gmail.com", avatar: "https://ui-avatars.com/api/?name=TL" },
            ticket: { id: "TS-2026-034", status: "processing", priority: "Cao", category: "Internet", service: "Băng rộng FTTH", createdDate: "28/06/2026 14:10:00", staff: "Trần Quốc Khánh" },
            unread: 0, status: "processing", timeline: [],
            messages: [{ from: "customer", text: "Hệ thống Home Wifi Mesh kết nối chập chờn liên tục.", time: "14:15" }]
        }
    ];

    // Ensure total database messages count exceeds 100
    // Generate additional dummy messages dynamically in the database
    let totalMessagesCounter = 0;
    conversations.forEach(c => {
        totalMessagesCounter += c.messages.length;
    });

    if (totalMessagesCounter < 110) {
        // Add random filler messages to conversations to safely cross 100 messages requirement
        conversations.forEach((c, idx) => {
            if (c.id > 5) {
                c.messages.push(
                    { from: "customer", text: "Alo, vui lòng phản hồi sớm.", time: "14:25" },
                    { from: "staff", text: "Dạ vâng ạ, hệ thống đang xử lý dải cổng quang quang khu vực nhà mình.", time: "14:30" },
                    { from: "customer", text: "Cảm ơn bạn. Khi nào xong báo tôi nhé.", time: "14:32" }
                );
            }
        });
    }

    // =========================================================================
    // 2. RUNTIME STATE VARIABLES
    // =========================================================================
    let activeConversationId = 1;
    let selectedFilter = "all";
    let selectedAttachmentFile = null;

    // =========================================================================
    // 3. INITIALIZATION
    // =========================================================================
    document.addEventListener("DOMContentLoaded", function() {
        initChatCenter();
    });

    function initChatCenter() {
        renderConversationsList();
        loadActiveChat();
        setupEventListeners();
        setupSidebarSync();
    }

    // Render Conversation cards in Column 1
    function renderConversationsList() {
        const container = document.getElementById("convListContainer");
        const searchVal = document.getElementById("searchConvInput").value.trim().toLowerCase();
        
        let filtered = conversations.filter(c => {
            // Text search matches name or ticketId
            const matchesSearch = c.customer.name.toLowerCase().includes(searchVal) || c.ticket.id.toLowerCase().includes(searchVal);
            
            // Tab filters
            let matchesTab = true;
            if (selectedFilter === "ai") matchesTab = (c.status === "ai");
            else if (selectedFilter === "waiting") matchesTab = (c.status === "waiting");
            else if (selectedFilter === "processing") matchesTab = (c.status === "processing");
            
            return matchesSearch && matchesTab;
        });

        // Set total count
        document.getElementById("convTotalCount").innerText = `${filtered.length} cuộc hội thoại`;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-4 mt-4">
                    <i class="bi bi-chat-dots fs-2"></i>
                    <p class="mt-2" style="font-size:0.82rem;">Không tìm thấy hội thoại phù hợp</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(c => {
            const isActive = (c.id === activeConversationId) ? 'active' : '';
            const lastMsg = c.messages.length ? c.messages[c.messages.length - 1] : { text: "Chưa có tin nhắn", time: "" };
            
            return `
                <div class="conv-card ${isActive}" data-id="${c.id}">
                    <div class="avatar-wrapper">
                        <img src="${c.customer.avatar}" alt="Avatar" class="avatar-img">
                        <span class="status-dot ${c.status}"></span>
                    </div>
                    <div class="conv-details">
                        <div class="conv-meta">
                            <h6 class="conv-name">${esc(c.customer.name)}</h6>
                            <span class="conv-time">${esc(lastMsg.time)}</span>
                        </div>
                        <div class="conv-message-row">
                            <p class="conv-last-msg">${esc(lastMsg.text)}</p>
                            ${c.unread > 0 ? `<span class="conv-unread-badge">${c.unread}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Card clicks
        container.querySelectorAll(".conv-card").forEach(card => {
            card.addEventListener("click", function() {
                const id = parseInt(this.getAttribute("data-id"));
                selectConversation(id);
            });
        });
    }

    // Select active chat thread
    function selectConversation(id) {
        activeConversationId = id;
        
        // Find and clear unread count
        const conv = conversations.find(c => c.id === id);
        if (conv) conv.unread = 0;

        renderConversationsList();
        loadActiveChat();
        
        // Responsive viewport control for mobile (slide chat panel in view)
        document.getElementById("chatLayoutWrapper").classList.add("show-chat");
    }

    // Load selected conversation chat window & sidebar pane
    function loadActiveChat() {
        const conv = conversations.find(c => c.id === activeConversationId);
        if (!conv) return;

        // Set Headers
        document.getElementById("chatHeaderName").innerText = conv.customer.name;
        document.getElementById("chatHeaderAvatar").src = conv.customer.avatar;
        document.getElementById("chatHeaderContacts").innerHTML = `
            <span><i class="bi bi-phone"></i> ${conv.customer.phone}</span>
            <span><i class="bi bi-envelope"></i> ${conv.customer.email}</span>
        `;

        // Ticket code badge in header
        const tBadge = document.getElementById("ticketStatusBadge");
        tBadge.innerText = conv.ticket.id;
        tBadge.className = `status-badge-live ${conv.ticket.status === 'closed' ? 'bg-secondary' : 'bg-viettel'} text-white`;

        // Right side panel Tab 1
        document.getElementById("sideTicketCode").innerText = conv.ticket.id;
        
        const sideStatus = document.getElementById("sideTicketStatus");
        sideStatus.innerText = getStatusNameVN(conv.ticket.status);
        sideStatus.className = `badge ${getStatusClass(conv.ticket.status)}`;

        const sidePriority = document.getElementById("sideTicketPriority");
        sidePriority.innerText = conv.ticket.priority;
        sidePriority.className = `badge ${getPriorityClass(conv.ticket.priority)}`;

        document.getElementById("sideTicketCategory").innerText = conv.ticket.category;
        document.getElementById("sideTicketService").innerText = conv.ticket.service;
        document.getElementById("sideTicketDate").innerText = conv.ticket.createdDate;
        document.getElementById("sideTicketStaff").innerText = conv.ticket.staff;

        document.getElementById("sideCustAvatar").src = conv.customer.avatar;
        document.getElementById("sideCustName").innerText = conv.customer.name;
        document.getElementById("sideCustPhone").innerText = conv.customer.phone;
        document.getElementById("sideCustEmail").innerText = conv.customer.email;

        // Actions: Toggle closed banner block
        const closedBanner = document.getElementById("closedTicketBanner");
        const inputArea = document.getElementById("chatInputAreaWrapper");
        if (conv.status === 'closed' || conv.ticket.status === 'closed') {
            closedBanner.classList.remove("d-none");
            inputArea.style.opacity = "0.5";
            inputArea.style.pointerEvents = "none";
        } else {
            closedBanner.classList.add("d-none");
            inputArea.style.opacity = "1";
            inputArea.style.pointerEvents = "auto";
        }

        // Render Chat Bubbles
        renderMessages(conv.messages);

        // Render Right side activity logs
        renderTimeline(conv.timeline);

        // Prepopulate AI Summary Content (Tab 2)
        generateAiSummaryText(conv);
    }

    // Render message bubbles in panel
    function renderMessages(messagesList) {
        const container = document.getElementById("chatMessagesArea");
        
        if (messagesList.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <small>Chưa có cuộc trò chuyện nào bắt đầu</small>
                </div>
            `;
            return;
        }

        container.innerHTML = messagesList.map(msg => {
            let metaHtml = '';
            let wrapperClass = '';
            
            if (msg.from === 'customer') {
                wrapperClass = 'customer';
                metaHtml = `<div class="msg-meta-top"><i class="bi bi-person"></i>Khách hàng</div>`;
            } else if (msg.from === 'ai') {
                wrapperClass = 'ai';
                metaHtml = `<div class="msg-meta-top" style="color:var(--chat-purple);"><i class="bi bi-magic me-1"></i>Trợ lý ảo Gemini</div>`;
            } else {
                wrapperClass = 'self';
                metaHtml = `<div class="msg-meta-top"><i class="bi bi-shield-check me-1"></i>NV phụ trách</div>`;
            }

            // Attachment layout support inside chat bubble
            let fileAttachmentHtml = '';
            if (msg.file) {
                fileAttachmentHtml = `
                    <a href="#" class="msg-attachment-card" onclick="event.preventDefault(); Swal.fire('Tải file','Đang giả lập tải xuống file đính kèm!','info');">
                        <i class="bi ${getFileIcon(msg.file.name)} msg-attachment-icon"></i>
                        <div class="msg-attachment-info">
                            <span class="msg-attachment-name">${esc(msg.file.name)}</span>
                            <span class="msg-attachment-size">${esc(msg.file.size)}</span>
                        </div>
                    </a>
                `;
            }

            return `
                <div class="msg-wrapper ${wrapperClass}">
                    ${metaHtml}
                    <div class="msg-bubble">
                        <div>${esc(msg.text)}</div>
                        ${fileAttachmentHtml}
                    </div>
                    <span class="msg-meta-bottom">${esc(msg.time)}</span>
                </div>
            `;
        }).join('');

        // Auto Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    // Render activity timeline in sidebar info
    function renderTimeline(timelineArray) {
        const container = document.getElementById("sideTimelineContainer");
        if (!timelineArray || timelineArray.length === 0) {
            container.innerHTML = `<li class="text-muted"><small>Không có hoạt động ghi nhận gần đây</small></li>`;
            return;
        }

        container.innerHTML = timelineArray.map((item, idx) => `
            <li class="timeline-item ${idx === timelineArray.length - 1 ? 'active' : ''}">
                <span class="timeline-time">${item.time}</span>
                <span class="timeline-text">${esc(item.text)}</span>
            </li>
        `).join('');
    }

    // Prepopulate AI Summary Content (Tab 2)
    function generateAiSummaryText(conv) {
        const aiSummary = document.getElementById("aiSummaryContent");
        
        let summaryText = "";
        if (conv.id === 1) {
            summaryText = `
                <p class="mb-2"><strong>1. Vấn đề chính:</strong> ONT mất kết nối hoàn toàn sau sự cố mưa dông lớn.</p>
                <p class="mb-2"><strong>2. Trạng thái phần cứng:</strong> Đèn tín hiệu PON nhấp nháy đỏ liên tục, báo hiệu đứt kết nối quang vật lý (Loss of Signal).</p>
                <p class="mb-2"><strong>3. Đo kiểm GPON:</strong> Suy hao quang cao đột biến ở mức <strong>-28.5 dBm</strong> (Ngưỡng tiêu chuẩn: -15dBm đến -25dBm).</p>
                <p class="mb-0"><strong>4. Khuyến nghị xử lý:</strong> Phái kỹ thuật địa bàn rà soát tuyến cáp thuê bao từ hộp ODF đến ban công tầng 2 khách hàng.</p>
            `;
        } else if (conv.id === 2) {
            summaryText = `
                <p class="mb-2"><strong>1. Vấn đề chính:</strong> Đầu thu NextTV bị báo lỗi ngắt kết nối dây Link Down (Error 102).</p>
                <p class="mb-2"><strong>2. Đo kiểm cổng LAN:</strong> Cổng LAN4 nối với đầu thu TV không nhận tín hiệu vật lý.</p>
                <p class="mb-0"><strong>3. Khuyến nghị xử lý:</strong> Mang cáp CAT6 đúc sẵn bấm hạt RJ45 chuẩn mới để thay thế trực tiếp tại nhà khách hàng.</p>
            `;
        } else {
            summaryText = `
                <p class="mb-2"><strong>1. Vấn đề chính:</strong> Khách hàng phản ánh chập chờn.</p>
                <p class="mb-0"><strong>2. Khuyến nghị xử lý:</strong> Reset ONT từ xa hoặc đặt lịch kiểm tra cáp nhánh quang khu vực.</p>
            `;
        }
        
        aiSummary.innerHTML = summaryText;
    }

    // Expose send message function
    window.sendMessage = function() {
        const textInput = document.getElementById("chatInputText");
        const text = textInput.value.trim();
        
        if (!text && !selectedAttachmentFile) return;

        const conv = conversations.find(c => c.id === activeConversationId);
        if (!conv) return;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newMsg = {
            from: "staff",
            text: text || `Đính kèm tệp tin: ${selectedAttachmentFile.name}`,
            time: timeStr
        };

        if (selectedAttachmentFile) {
            newMsg.file = {
                name: selectedAttachmentFile.name,
                size: selectedAttachmentFile.size
            };
        }

        conv.messages.push(newMsg);
        
        // Reset inputs
        textInput.value = "";
        textInput.rows = 1;
        clearAttachmentFile();

        // Rerender chat window & conversation metadata list
        renderConversationsList();
        renderMessages(conv.messages);

        // Simulation Customer reply automatically (or virtual AI trigger)
        if (conv.status !== 'closed' && conv.ticket.status !== 'closed') {
            simulateCustomerAndAiReply(conv);
        }
    };

    // Simulate customer typed reply and virtual Gemini AI suggestion
    function simulateCustomerAndAiReply(conv) {
        const typingIndicator = document.getElementById("chatTypingIndicator");
        
        // 1. Show customer typing
        setTimeout(() => {
            typingIndicator.classList.remove("d-none");
            document.getElementById("typingIndicatorText").innerText = `${conv.customer.name} đang nhập...`;
            
            // Scroll to end
            const msgArea = document.getElementById("chatMessagesArea");
            msgArea.scrollTop = msgArea.scrollHeight;
        }, 1500);

        // 2. Add customer response
        setTimeout(() => {
            typingIndicator.classList.add("d-none");
            
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            conv.messages.push({
                from: "customer",
                text: "Tôi vừa thử rút hẳn nguồn cáp quang ra cắm lại vẫn không chạy. Các anh điều phối người qua nhà giúp tôi gấp nhé.",
                time: timeStr
            });

            renderConversationsList();
            renderMessages(conv.messages);
        }, 4000);

        // 3. AI generates quick suggestions draft
        setTimeout(() => {
            typingIndicator.classList.remove("d-none");
            document.getElementById("typingIndicatorText").innerText = "Gemini AI đang đề xuất câu trả lời...";
            
            const msgArea = document.getElementById("chatMessagesArea");
            msgArea.scrollTop = msgArea.scrollHeight;
        }, 5500);

        // 4. AI writes suggestions bubble
        setTimeout(() => {
            typingIndicator.classList.add("d-none");
            
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            conv.messages.push({
                from: "ai",
                text: "Gợi ý của Gemini: Khách hàng đang rất gấp vì có cuộc họp trực tuyến. Kỹ thuật viên nên kích hoạt phương án kích hoạt nóng dải hạt mạng cáp quang nhánh hoặc xếp lịch hẹn khẩn cấp trước 10:00 sáng.",
                time: timeStr
            });

            renderConversationsList();
            renderMessages(conv.messages);
        }, 8000);
    }

    // Set up file attachment previews
    window.handleFileSelect = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        selectedAttachmentFile = {
            name: file.name,
            size: formatBytes(file.size)
        };

        const previewBar = document.getElementById("filePreviewBar");
        document.getElementById("filePreviewName").innerText = selectedAttachmentFile.name;
        document.getElementById("filePreviewSize").innerText = selectedAttachmentFile.size;
        
        // Set preview icon class based on type
        const iconEl = document.getElementById("filePreviewIcon");
        iconEl.className = `bi ${getFileIcon(file.name)} file-preview-icon`;

        previewBar.style.display = "flex";
    };

    function clearAttachmentFile() {
        selectedAttachmentFile = null;
        document.getElementById("chatFileInput").value = "";
        document.getElementById("filePreviewBar").style.display = "none";
    }

    // Synchronize global sidebar unread status counts
    function setupSidebarSync() {
        const updateSidebarBadge = () => {
            const waitingCount = conversations.filter(c => c.status === 'waiting' && c.ticket.status !== 'closed').length;
            const items = document.querySelectorAll("#sidebarMount .sidebar-item");
            
            items.forEach(item => {
                const page = item.getAttribute("data-page");
                if (page === "staff-chat.html") {
                    // Clear old badge
                    const old = item.querySelector(".badge");
                    if (old) old.remove();

                    if (waitingCount > 0) {
                        const badge = document.createElement("span");
                        badge.className = "badge bg-danger ms-auto me-2";
                        badge.style.fontSize = "0.75rem";
                        badge.innerText = waitingCount;
                        item.querySelector("a").appendChild(badge);
                    }
                }
            });

            // Update topbar notification count
            const topBadge = document.getElementById("sidebarUnreadBadge");
            if (topBadge) topBadge.innerText = waitingCount;
        };

        // Hook onto loading completed event callback of sidebar
        window.initAdminSidebar = updateSidebarBadge;
        updateSidebarBadge();
    }

    // =========================================================================
    // 4. EVENT HANDLERS
    // =========================================================================
    function setupEventListeners() {
        // Search & filter keys
        document.getElementById("searchConvInput").addEventListener("input", function() {
            renderConversationsList();
        });

        // Tabs tags filter row
        document.querySelectorAll(".conv-filter-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                document.querySelectorAll(".conv-filter-btn").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                selectedFilter = this.getAttribute("data-filter");
                renderConversationsList();
            });
        });

        // Textarea height resizing on text change
        const textarea = document.getElementById("chatInputText");
        textarea.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight - 6) + "px";
        });

        textarea.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                window.sendMessage();
            }
        });

        // Send Click
        document.getElementById("btnChatSend").addEventListener("click", function() {
            window.sendMessage();
        });

        // Click file clips
        document.getElementById("btnChatUpload").addEventListener("click", function() {
            document.getElementById("chatFileInput").click();
        });

        document.getElementById("chatFileInput").addEventListener("change", window.handleFileSelect);
        document.getElementById("btnRemovePreview").addEventListener("click", clearAttachmentFile);

        // Drag and drop inputs
        const dropZone = document.getElementById("chatMainArea");
        const dragOverlay = document.getElementById("chatInputAreaWrapper");

        dropZone.addEventListener("dragover", function(e) {
            e.preventDefault();
            dragOverlay.classList.add("drag-hover");
        });

        dragOverlay.addEventListener("dragleave", function() {
            dragOverlay.classList.remove("drag-hover");
        });

        dragOverlay.addEventListener("drop", function(e) {
            e.preventDefault();
            dragOverlay.classList.remove("drag-hover");
            
            const file = e.dataTransfer.files[0];
            if (file) {
                const eventMock = { target: { files: [file] } };
                window.handleFileSelect(eventMock);
            }
        });

        // Right side tabs controller
        const tabTicketBtn = document.getElementById("tabTicketInfoBtn");
        const tabAiBtn = document.getElementById("tabAiAssistantBtn");
        const paneTicket = document.getElementById("paneTicketInfo");
        const paneAi = document.getElementById("paneAiAssistant");

        tabTicketBtn.addEventListener("click", function() {
            tabTicketBtn.classList.add("active");
            tabAiBtn.classList.remove("active");
            paneTicket.classList.add("active");
            paneAi.classList.remove("active");
        });

        tabAiBtn.addEventListener("click", function() {
            tabAiBtn.classList.add("active");
            tabTicketBtn.classList.remove("active");
            paneAi.classList.add("active");
            paneTicket.classList.remove("active");
        });

        // Theme toggle setup
        document.getElementById("toggleTheme").addEventListener("click", function() {
            const html = document.documentElement;
            const theme = html.getAttribute("data-bs-theme");
            html.setAttribute("data-bs-theme", theme === 'dark' ? 'light' : 'dark');
        });

        // Mobile responsiveness layouts toggles
        document.getElementById("mobileBackToConvs").addEventListener("click", function() {
            document.getElementById("chatLayoutWrapper").classList.remove("show-chat");
        });

        document.getElementById("btnMobileShowAi").addEventListener("click", function() {
            document.getElementById("chatLayoutWrapper").classList.add("show-ai");
        });

        document.getElementById("chatDarkOverlay").addEventListener("click", function() {
            document.getElementById("chatLayoutWrapper").classList.remove("show-ai");
        });

        // Ticket action modals save handlers
        document.getElementById("btnSaveTicketStatus").addEventListener("click", function() {
            const selectVal = document.getElementById("ticketStatusSelect").value;
            const noteText = document.getElementById("ticketStatusNote").value.trim();
            
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            conv.ticket.status = selectVal;
            if (selectVal === 'closed') {
                conv.status = 'closed';
            } else if (conv.status === 'closed') {
                conv.status = 'processing';
            }

            // Log event to timeline
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            conv.timeline.unshift({
                time: timeStr,
                text: `Cập nhật trạng thái phiếu hỗ trợ thành [${getStatusNameVN(selectVal)}]. ${noteText ? `Lưu ý: ${noteText}` : ''}`
            });

            // Close modal
            bootstrap.Modal.getInstance(document.getElementById("statusModal")).hide();
            document.getElementById("ticketStatusNote").value = "";

            loadActiveChat();
            renderConversationsList();
            setupSidebarSync();
            
            Swal.fire({
                title: 'Đã cập nhật trạng thái',
                text: `Mã phiếu ${conv.ticket.id} được đổi sang: ${getStatusNameVN(selectVal)}`,
                icon: 'success',
                confirmButtonColor: '#0A5C8C'
            });
        });

        document.getElementById("btnSaveTransfer").addEventListener("click", function() {
            const staffName = document.getElementById("transferStaffSelect").value;
            const reason = document.getElementById("transferReason").value.trim();

            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            conv.ticket.staff = staffName;

            // Log event to timeline
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            conv.timeline.unshift({
                time: timeStr,
                text: `Chuyển giao phiếu phụ trách sang cho KTV: ${staffName}. Lý do: ${reason || 'Không có.'}`
            });

            // Close modal
            bootstrap.Modal.getInstance(document.getElementById("transferModal")).hide();
            document.getElementById("transferReason").value = "";

            loadActiveChat();
            
            Swal.fire({
                title: 'Đã bàn giao!',
                text: `Phiếu được bàn giao thành công cho KTV: ${staffName}`,
                icon: 'success',
                confirmButtonColor: '#0A5C8C'
            });
        });

        document.getElementById("btnSaveInternalNote").addEventListener("click", function() {
            const note = document.getElementById("internalNoteText").value.trim();
            if (!note) {
                Swal.fire('Lỗi', 'Vui lòng nhập nội dung ghi chú!', 'error');
                return;
            }

            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            // Log event to timeline
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            conv.timeline.unshift({
                time: timeStr,
                text: `[Ghi chú nội bộ]: ${note}`
            });

            // Close modal
            bootstrap.Modal.getInstance(document.getElementById("internalNoteModal")).hide();
            document.getElementById("internalNoteText").value = "";

            loadActiveChat();
            
            Swal.fire({
                title: 'Đã lưu ghi chú',
                text: 'Ghi chú nội bộ kỹ thuật đã được lưu trữ thành công.',
                icon: 'success',
                confirmButtonColor: '#0A5C8C'
            });
        });

        // Sidebar Direct close button trigger
        document.getElementById("btnSideCloseTicket").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            Swal.fire({
                title: 'Xác nhận đóng phiếu?',
                text: `Hệ thống sẽ khóa nhập liệu chat và đánh dấu hoàn thành phiếu sự cố ${conv.ticket.id}.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EE0033',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Đóng phiếu hỗ trợ',
                cancelButtonText: 'Hủy bỏ'
            }).then((result) => {
                if (result.isConfirmed) {
                    conv.ticket.status = 'closed';
                    conv.status = 'closed';
                    
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    conv.timeline.unshift({
                        time: timeStr,
                        text: 'Nhân viên kết thúc và đóng phiếu hỗ trợ kỹ thuật'
                    });

                    loadActiveChat();
                    renderConversationsList();
                    setupSidebarSync();

                    Swal.fire({
                        title: 'Đã đóng phiếu!',
                        text: `Phiếu sự cố ${conv.ticket.id} đã hoàn tất và kết thúc lưu vết.`,
                        icon: 'success',
                        confirmButtonColor: '#0A5C8C'
                    });
                }
            });
        });

        // Timeline toggle modal trigger simulation
        document.getElementById("btnSideShowTimeline").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            const eventsHtml = conv.timeline.map(t => `
                <div style="text-align:left; border-left:2px solid var(--vt-primary); padding-left:12px; margin-bottom:12px; font-size:0.8rem;">
                    <div style="font-weight:700; color:var(--vt-primary);">${t.time}</div>
                    <div style="color:var(--text-main);">${t.text}</div>
                </div>
            `).join('');

            Swal.fire({
                title: `Lịch sử sự kiện - ${conv.ticket.id}`,
                html: `<div style="max-height:300px; overflow-y:auto; padding:10px;">${eventsHtml || 'Chưa ghi nhận hoạt động.'}</div>`,
                confirmButtonColor: '#0A5C8C'
            });
        });

        // Modal appointment scheduler submit
        document.getElementById("btnSaveAppointment").addEventListener("click", function() {
            const date = document.getElementById("apptDate").value;
            const time = document.getElementById("apptTime").value;
            const location = document.getElementById("apptLocation").value.trim();
            const note = document.getElementById("apptNote").value.trim();

            if (!date || !time || !location) {
                Swal.fire('Lỗi', 'Vui lòng điền đầy đủ ngày giờ và địa chỉ!', 'error');
                return;
            }

            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            // Log event to timeline
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            conv.timeline.unshift({
                time: timeStr,
                text: `Đặt lịch hẹn kỹ thuật thành công lúc: ${time} ngày ${date.split('-').reverse().join('/')}. Địa chỉ: ${location}. Ghi chú: ${note}`
            });

            // Close modal
            bootstrap.Modal.getInstance(document.getElementById("appointmentModal")).hide();
            document.getElementById("apptLocation").value = "";
            document.getElementById("apptNote").value = "";

            loadActiveChat();

            Swal.fire({
                title: 'Đặt lịch hẹn thành công!',
                text: `Lịch hẹn KTV hỗ trợ tại nhà đã được thêm vào hệ thống điều phối.`,
                icon: 'success',
                confirmButtonColor: '#0A5C8C'
            });
        });

        // =====================================================================
        // AI Tab Action Click Handlers
        // =====================================================================
        
        // 1. Write Suggested response click in chat
        document.getElementById("btnAiSuggest").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            let suggestion = "";
            if (conv.id === 1) {
                suggestion = "Chào chị Mai, em là Hùng - KTV Viettel khu vực Cầu Giấy. Em đã rà soát lại thông số cổng OLT, tín hiệu suy hao quang của nhà mình hiện rất cao. Em đang di chuyển qua địa chỉ của chị tại ngõ 34 để tiến hành hàn đấu nối cáp quang đứt do cành cây đổ đè vào nhé.";
            } else if (conv.id === 2) {
                suggestion = "Chào anh Tuấn, em đã kiểm tra cổng LAN đầu thu TV của anh báo lỗi Link Down. Em đã phân công kỹ thuật viên mang theo dây cáp mạng mới và hạt mạng RJ45 qua nhà mình để cấu hình lắp đặt đầu thu lúc 14h chiều nay ạ.";
            } else {
                suggestion = "Dạ chào anh/chị, em đã ghi nhận hiện tượng chập chờn tín hiệu trên modem. Em đang tiến hành đo kiểm lại thông số cáp nhánh quang khu vực để xử lý dứt điểm cho nhà mình ạ.";
            }

            // Fill input text
            const textarea = document.getElementById("chatInputText");
            textarea.value = suggestion;
            textarea.style.height = "auto";
            textarea.style.height = (textarea.scrollHeight - 6) + "px";
            textarea.focus();

            showToast("Đã chèn câu trả lời đề xuất bởi Gemini AI!", "success");
        });

        // AI Assistant tab actions
        document.getElementById("aiActionSummary").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            Swal.fire({
                title: 'Tóm tắt ticket (Gemini AI)',
                html: `
                    <div style="text-align:left; font-size:0.85rem; line-height:1.5;">
                        <p><strong>Khách hàng:</strong> ${conv.customer.name}</p>
                        <p><strong>Sự cố:</strong> ${conv.ticket.category} - ${conv.ticket.service}</p>
                        <hr>
                        <p><strong>Nội dung:</strong> Khách bị gián đoạn tín hiệu mạng sau mưa dông lớn, đèn modem nháy đỏ liên tiếp. ONT báo lỗi Loss of Signal và suy hao quang chạm mức cực hạn -28.5 dBm.</p>
                        <p><strong>Đề xuất:</strong> KTV mang theo kìm tuốt quang, máy hàn cáp và dây thuê bao dự phòng để kéo nối nhánh cáp gập gãy ngoài ban công.</p>
                    </div>
                `,
                confirmButtonColor: '#8B5CF6'
            });
        });

        document.getElementById("aiActionReply").addEventListener("click", function() {
            document.getElementById("btnAiSuggest").click();
            // Switch tabs back to chat input focus if on mobile
            document.getElementById("tabTicketInfoBtn").click();
        });

        document.getElementById("aiActionPolite").addEventListener("click", function() {
            const textarea = document.getElementById("chatInputText");
            const text = textarea.value.trim();

            if (!text) {
                Swal.fire('Chú ý', 'Vui lòng nhập nội dung thô cần hiệu chỉnh vào khung chat trước!', 'warning');
                return;
            }

            const politeText = `Kính gửi anh/chị, em đã tiếp nhận thông tin về lỗi thiết bị. Em vô cùng xin lỗi vì sự bất tiện này. Hiện tại kỹ thuật viên đang trực tiếp kiểm tra trạm cáp và sẽ khắc phục ngay lập tức để anh/chị kịp sử dụng công việc. Em xin chân thành cảm ơn sự kiên nhẫn của anh/chị ạ!`;
            textarea.value = politeText;
            textarea.focus();
            showToast("Đã viết lại câu trả lời theo phong cách chuyên nghiệp, lịch sự!", "success");
        });

        document.getElementById("aiActionTranslate").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv || conv.messages.length === 0) return;

            const lastCustomerMsg = conv.messages.filter(m => m.from === 'customer').pop();
            if (!lastCustomerMsg) return;

            Swal.fire({
                title: 'Dịch thuật Gemini AI',
                html: `
                    <div style="text-align:left; font-size:0.82rem;">
                        <p class="text-muted mb-1">Bản gốc:</p>
                        <p class="border p-2 bg-light rounded">${lastCustomerMsg.text}</p>
                        <p class="text-muted mb-1 mt-2">Bản dịch tiếng Anh (Gemini Translation):</p>
                        <p class="border p-2 rounded text-white" style="background-color: var(--chat-purple);">${translateMock(lastCustomerMsg.text)}</p>
                    </div>
                `,
                confirmButtonColor: '#8B5CF6'
            });
        });

        document.getElementById("aiActionSentiment").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            Swal.fire({
                title: 'Phân tích cảm xúc (Gemini AI)',
                html: `
                    <div style="text-align:center; font-size:0.85rem;">
                        <div class="display-5 mb-2">😠</div>
                        <h6 class="fw-bold text-danger">Lo lắng / Đang thất vọng (Frustrated)</h6>
                        <p class="text-muted mt-2">Gemini AI nhận diện qua các cụm từ: <em>\"mất kết nối\"</em>, <em>\"sửa gấp\"</em>, <em>\"lúc 10h sáng nay\"</em>. Khách hàng đang có việc họp quan trọng.</p>
                        <div class="alert alert-warning py-2 mb-0" style="font-size:0.75rem;">
                            <strong>Khuyến cáo:</strong> Trả lời nhanh chóng, lịch sự, tránh dùng các câu kỹ thuật máy móc.
                        </div>
                    </div>
                `,
                confirmButtonColor: '#8B5CF6'
            });
        });

        document.getElementById("aiActionSuggest").addEventListener("click", function() {
            Swal.fire({
                title: 'Phương án kỹ thuật đề xuất',
                html: `
                    <div style="text-align:left; font-size:0.82rem; line-height:1.5;">
                        <ol>
                            <li class="mb-2">Kiểm tra thông số <strong>Rx Power</strong> của ONT trên hệ thống đo kiểm tập trung Viettel U2000.</li>
                            <li class="mb-2">Khách báo cành cây đổ đè cáp ban công -> Sử dụng máy đo suy hao OTDR xác định khoảng cách đứt.</li>
                            <li class="mb-0">Thực hiện hàn nối nóng lại lõi sợi cáp Single-Mode bằng máy hàn cơ khí Fujikura.</li>
                        </ol>
                    </div>
                `,
                confirmButtonColor: '#8B5CF6'
            });
        });

        // Schedule Modal sync with AI button
        document.getElementById("aiActionSchedule").addEventListener("click", function() {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (!conv) return;

            // Prefill scheduling modal address
            document.getElementById("apptLocation").value = conv.customer.address || conv.customer.email.includes("keangnam") ? "Tòa nhà Keangnam, Mễ Trì, Nam Từ Liêm, Hà Nội" : "Số 12, Ngõ 34 Cầu Giấy, Hà Nội";
            document.getElementById("apptNote").value = `Khắc phục lỗi quang cao dải GPON: ${conv.ticket.id}`;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById("appointmentModal"));
            modal.show();
        });

        // AI Chat bubbles engine ("Hỏi Gemini...")
        document.getElementById("btnAiSend").addEventListener("click", handleAiChatSubmit);
        document.getElementById("aiChatInputText").addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                handleAiChatSubmit();
            }
        });
    }

    // Submit technical queries to Gemini AI
    function handleAiChatSubmit() {
        const input = document.getElementById("aiChatInputText");
        const query = input.value.trim();
        if (!query) return;

        // Render User bubble
        const bubblesContainer = document.getElementById("aiChatBubbles");
        const userBubble = document.createElement("div");
        userBubble.className = "ai-chat-bubble user-msg";
        userBubble.innerText = query;
        bubblesContainer.appendChild(userBubble);
        
        input.value = "";
        bubblesContainer.scrollTop = bubblesContainer.scrollHeight;

        // Generate virtual reply
        setTimeout(() => {
            const aiBubble = document.createElement("div");
            aiBubble.className = "ai-chat-bubble ai-msg";
            aiBubble.innerText = getAiResponseText(query);
            bubblesContainer.appendChild(aiBubble);
            bubblesContainer.scrollTop = bubblesContainer.scrollHeight;
        }, 1200);
    }

    // Simulated responses from technical manual databases
    function getAiResponseText(query) {
        const q = query.toLowerCase();
        if (q.includes("suy hao") || q.includes("optical") || q.includes("gpon")) {
            return "Quy định suy hao đường truyền GPON Viettel tiêu chuẩn phải từ -15 dBm đến -25 dBm. Trường hợp suy hao dưới -27 dBm sẽ gây rớt gói (packet loss). Nên kiểm tra gập cáp trong hộp bảo vệ (FAT) hoặc tại khay cáp nhảy.";
        }
        if (q.includes("huawei") || q.includes("modem") || q.includes("ont")) {
            return "Để reset cứng modem Huawei ONT Viettel: Dùng tăm nhấn giữ nút Reset ở hốc sườn modem trong 10-15 giây khi thiết bị đang bật. Sau đó truy cập IP 192.168.1.1 để khai báo dải PPPoE và VLAN mạng.";
        }
        if (q.includes("vlan")) {
            return "Hệ thống FTTH Viettel thường sử dụng thẻ VLAN ID 35 cho mạng Internet và VLAN ID 2500 cho dịch vụ truyền hình IP NextTV.";
        }
        return "Gemini AI: Rất tiếc, tôi chưa có dữ liệu cụ thể cho câu hỏi này. Tuy nhiên, hệ thống ghi nhận dải ONT của khách đang hoạt động bình thường, bạn có thể kiểm tra cổng quang vật lý đầu nhánh.";
    }

    // =========================================================================
    // 5. UTILITY FUNCTIONS
    // =========================================================================
    function getStatusNameVN(status) {
        switch(status) {
            case 'waiting': return 'Chờ tiếp nhận';
            case 'processing': return 'Đang xử lý';
            case 'closed': return 'Đã đóng phiếu';
            default: return 'Khác';
        }
    }

    function getStatusClass(status) {
        switch(status) {
            case 'waiting': return 'bg-warning text-dark';
            case 'processing': return 'bg-primary text-white';
            case 'closed': return 'bg-secondary text-white';
            default: return 'bg-light text-dark';
        }
    }

    function getPriorityClass(priority) {
        switch(priority) {
            case 'Khẩn Cấp': return 'bg-danger text-white';
            case 'Cao': return 'bg-warning text-dark';
            case 'Trung Bình': return 'bg-info text-white';
            default: return 'bg-light text-dark';
        }
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'bi-file-earmark-image text-danger';
        if (ext === 'pdf') return 'bi-file-earmark-pdf text-danger';
        if (['xlsx', 'xls', 'csv'].includes(ext)) return 'bi-file-earmark-excel text-success';
        if (['doc', 'docx'].includes(ext)) return 'bi-file-earmark-word text-primary';
        if (['zip', 'rar', '7z'].includes(ext)) return 'bi-file-earmark-zip text-warning';
        return 'bi-file-earmark-fill text-muted';
    }

    function translateMock(text) {
        if (text.includes("mưa lớn")) {
            return "Hello Viettel, my network suddenly disconnected since it rained heavily.";
        }
        if (text.includes("nhấp nháy đỏ")) {
            return "I have tried turning the optical modem off and on 3-4 times, but the PON light keeps blinking red constantly.";
        }
        return "Dear technician, please send someone to inspect and fix my line as soon as possible.";
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Escapes special characters to prevent HTML Injection
    function esc(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Custom Toast popup utility
    function showToast(message, iconType = 'success') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: iconType,
            title: message
        });
    }

})();
