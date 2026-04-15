//using APIChatRealTime.DTO;
//using APIChatRealTime.Models;
//using APIChatRealTime.Service;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.SignalR;
//using Microsoft.EntityFrameworkCore;

//namespace APIChatRealTime.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class ChatController : ControllerBase
//    {
//        private readonly ChatRealTimeContext _context;
//        private readonly IHubContext<ChatHub> _hubContext;
//        public ChatController(ChatRealTimeContext context, IHubContext<ChatHub> hubContext)
//        {
//            _context = context;
//            _hubContext = hubContext;
//        }

//        [HttpPost("send-text")]
//        public async Task<IActionResult> SendText([FromBody] SendTextDto dto)
//        {
//            var user = await _context.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(u => u.Id == dto.NguoiGuiId);
//            if (user == null) return NotFound("Không tìm thấy người dùng");

//            var tinNhan = new TinNhan
//            {
//                Id = Guid.NewGuid(),
//                PhongChatId = dto.PhongChatId,
//                NguoiGuiId = dto.NguoiGuiId,
//                LoaiTinNhan = 1,
//                NoiDung = dto.NoiDung,
//                NgayTao = DateTime.UtcNow
//            };

//            await ProcessMessageAndBroadcast(tinNhan, user);
//            return Ok(new { Message = "Gửi thành công", MessageId = tinNhan.Id });
//        }

//        [HttpPost("send-image")]
//        public async Task<IActionResult> SendImage([FromForm] Guid phongChatId, [FromForm] Guid nguoiGuiId, IFormFile file)
//        {
//            if (file == null || file.Length == 0) return BadRequest("File không hợp lệ");

//            var user = await _context.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(u => u.Id == nguoiGuiId);
//            if (user == null) return NotFound("Không tìm thấy người dùng");

//            using var memoryStream = new MemoryStream();
//            await file.CopyToAsync(memoryStream);

//            var contentType = file.ContentType;
//            var base64String = $"data:{contentType};base64,{Convert.ToBase64String(memoryStream.ToArray())}";

//            var tinNhan = new TinNhan
//            {
//                Id = Guid.NewGuid(),
//                PhongChatId = phongChatId,
//                NguoiGuiId = nguoiGuiId,
//                LoaiTinNhan = 2,
//                NoiDung = base64String,
//                NgayTao = DateTime.UtcNow
//            };

//            await ProcessMessageAndBroadcast(tinNhan, user);
//            return Ok(new { Message = "Gửi ảnh thành công", MessageId = tinNhan.Id });
//        }

//        [HttpGet("{phongChatId}/history")]
//        public async Task<IActionResult> GetChatHistory(Guid phongChatId, [FromQuery] int skip = 0, [FromQuery] int take = 20)
//        {
//            var messages = await _context.TinNhans
//                .AsNoTracking()
//                .Where(t => t.PhongChatId == phongChatId)
//                .OrderByDescending(t => t.NgayTao)
//                .Skip(skip)
//                .Take(take)
//                .Select(t => new TinNhanDto
//                {
//                    Id = t.Id,
//                    PhongChatId = t.PhongChatId,
//                    NguoiGuiId = t.NguoiGuiId,
//                    TenNguoiGui = t.NguoiGui.Ten, // Lưu ý Navigation property NguoiDung
//                    AnhDaiDien = t.NguoiGui.AnhDaiDien ?? "",
//                    LoaiTinNhan = t.LoaiTinNhan,
//                    NoiDung = t.NoiDung,
//                    NgayTao = t.NgayTao
//                })
//                .ToListAsync();

//            return Ok(messages); // Đã xóa OrderBy
//        }

//        private async Task ProcessMessageAndBroadcast(TinNhan tinNhan, NguoiDung user)
//        {
//            _context.TinNhans.Add(tinNhan);

//            var phongChat = await _context.PhongChats.FindAsync(tinNhan.PhongChatId);
//            if (phongChat != null)
//            {
//                phongChat.TinNhanCuoiId = tinNhan.Id;
//                phongChat.NgayCapNhat = DateTime.UtcNow;
//            }

//            await _context.SaveChangesAsync();

//            var messageDto = new TinNhanDto
//            {
//                Id = tinNhan.Id,
//                PhongChatId = tinNhan.PhongChatId,
//                NguoiGuiId = tinNhan.NguoiGuiId,
//                TenNguoiGui = user.Ten,
//                AnhDaiDien = user.AnhDaiDien ?? "",
//                LoaiTinNhan = tinNhan.LoaiTinNhan,
//                NoiDung = tinNhan.NoiDung,
//                NgayTao = tinNhan.NgayTao
//            };

//            await _hubContext.Clients.Group(tinNhan.PhongChatId.ToString()).SendAsync("ReceiveMessage", messageDto);
//        }

//        // ====================================================================================
//        // 🚀 CÁC HÀM XỬ LÝ PHÒNG CHAT ĐƯỢC VIẾT MỚI 100% THEO ĐÚNG ERD CỦA ÔNG
//        // ====================================================================================

//        public class TaoPhong11Dto
//        {
//            public Guid NguoiTaoId { get; set; }
//            public Guid NguoiNhanId { get; set; }
//        }

//        // 🚀 BỔ SUNG: Hàm Xử lý Chat 1-1 chuẩn Telegram
//        [HttpPost("tao-phong-1-1")]
//        public async Task<IActionResult> TaoHoacLayPhong11([FromBody] TaoPhong11Dto dto)
//        {
//            // Kiểm tra phòng 1-1 đã tồn tại chưa (Dựa vào LaNhom == false và bảng ThanhVien)
//            var phongTonTai = await _context.PhongChats
//                .Where(p => p.LaNhom == false &&
//                            p.ThanhViens.Any(tv => tv.NguoiDungId == dto.NguoiTaoId) &&
//                            p.ThanhViens.Any(tv => tv.NguoiDungId == dto.NguoiNhanId))
//                .FirstOrDefaultAsync();

//            if (phongTonTai != null)
//            {
//                return Ok(new { phongChatId = phongTonTai.Id });
//            }

//            // Nếu chưa có thì tạo phòng mới (LaNhom = false)
//            var phongMoi = new PhongChat
//            {
//                Id = Guid.NewGuid(),
//                LaNhom = false,
//                NgayCapNhat = DateTime.UtcNow
//            };

//            _context.PhongChats.Add(phongMoi);

//            // Add 2 ông vào bảng ThanhVien
//            _context.ThanhViens.Add(new ThanhVien { PhongChatId = phongMoi.Id, NguoiDungId = dto.NguoiTaoId, NgayThamGia = DateTime.UtcNow });
//            _context.ThanhViens.Add(new ThanhVien { PhongChatId = phongMoi.Id, NguoiDungId = dto.NguoiNhanId, NgayThamGia = DateTime.UtcNow });

//            await _context.SaveChangesAsync();
//            return Ok(new { phongChatId = phongMoi.Id });
//        }


//        // 🚀 ĐÃ FIX: Chỉ lấy những phòng chat mà User hiện tại nằm trong bảng ThanhVien
//        // Đã tối ưu Tên hiển thị và Avatar tùy theo Chat 1-1 hay Chat Nhóm
//        [HttpGet("danh-sach-phong/{nguoiDungId}")]
//        public async Task<IActionResult> GetDanhSachPhong(Guid nguoiDungId)
//        {
//            var inboxes = await _context.PhongChats
//                .AsNoTracking()
//                .Where(p => p.ThanhViens.Any(tv => tv.NguoiDungId == nguoiDungId)) // Bộ lọc phép thuật
//                .OrderByDescending(p => p.NgayCapNhat)
//                .Select(p => new
//                {
//                    Id = p.Id,
//                    // Nếu là nhóm -> Lấy TenPhong. Nếu 1-1 -> Lấy Tên thằng đối diện
//                    Name = p.LaNhom == true
//                            ? (p.TenPhong ?? "Nhóm Chat")
//                            : p.ThanhViens.Where(tv => tv.NguoiDungId != nguoiDungId).Select(tv => tv.NguoiDung.Ten).FirstOrDefault() ?? "Người dùng",

//                    // Nếu là nhóm -> Lấy Avatar Group. Nếu 1-1 -> Lấy Avatar đối diện
//                    Avatar = p.LaNhom == true
//                            ? "https://ui-avatars.com/api/?name=Group&background=D4AF37&color=fff"
//                            : p.ThanhViens.Where(tv => tv.NguoiDungId != nguoiDungId).Select(tv => tv.NguoiDung.AnhDaiDien).FirstOrDefault() ?? "https://ui-avatars.com/api/?name=U",

//                    // Lấy nội dung tin nhắn cuối
//                    LastMessage = p.TinNhanCuoiId != null
//                            ? _context.TinNhans.Where(t => t.Id == p.TinNhanCuoiId).Select(t => t.NoiDung).FirstOrDefault()
//                            : "Bắt đầu cuộc trò chuyện...",

//                    Time = p.NgayCapNhat != null ? p.NgayCapNhat.Value.ToString("HH:mm") : "",
//                    Unread = 0 // Tạm để 0
//                }).ToListAsync();

//            return Ok(inboxes);
//        }


//        // 🚀 ĐÃ FIX: Xử lý đúng ERD, tạo Nhóm xong phải nạp thành viên vào bảng `ThanhVien`
//        [HttpPost("tao-nhom")]
//        public async Task<IActionResult> TaoNhom([FromForm] string ten, [FromForm] Guid nguoiTaoId, [FromForm] string memberIds, IFormFile file)
//        {
//            var phongMoi = new PhongChat
//            {
//                Id = Guid.NewGuid(),
//                TenPhong = ten,
//                LaNhom = true, // Đánh dấu đây là Nhóm
//                NguoiTaoId = nguoiTaoId,
//                NgayCapNhat = DateTime.UtcNow
//            };

//            // Nếu ông có cột AvatarPhong trong DB thì xử lý upload file ở đây...

//            _context.PhongChats.Add(phongMoi);

//            // 1. Thêm người tạo vào Nhóm
//            _context.ThanhViens.Add(new ThanhVien { PhongChatId = phongMoi.Id, NguoiDungId = nguoiTaoId, NgayThamGia = DateTime.UtcNow });

//            // 2. Thêm các người được chọn vào Nhóm
//            if (!string.IsNullOrWhiteSpace(memberIds))
//            {
//                var idsArray = memberIds.Split(',');
//                foreach (var memIdStr in idsArray)
//                {
//                    if (Guid.TryParse(memIdStr, out Guid memId))
//                    {
//                        _context.ThanhViens.Add(new ThanhVien { PhongChatId = phongMoi.Id, NguoiDungId = memId, NgayThamGia = DateTime.UtcNow });
//                    }
//                }
//            }

//            await _context.SaveChangesAsync();
//            return Ok(new { Id = phongMoi.Id });
//        }
//    }
//}