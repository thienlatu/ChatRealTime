using APIChatRealTime.DTO;
using APIChatRealTime.Models;
using APIChatRealTime.Service;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace APIChatRealTime.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ChatRealTimeContext _context;

        public UserController(ChatRealTimeContext context)
        {
            _context = context;
        }

        [HttpPost("dang-ky")]
        public async Task<IActionResult> DangKy([FromBody] DangKyDto dto)
        {
            var emailTonTai = await _context.NguoiDungs.AnyAsync(u => u.Email == dto.Email);
            if (emailTonTai)
                return BadRequest("Email này đã được sử dụng!");

            var userMoi = new NguoiDung
            {
                Id = Guid.NewGuid(),
                Ten = dto.Ten,
                Email = dto.Email,
                MatKhau = dto.MatKhau,
                AnhDaiDien = "https://ui-avatars.com/api/?name=" + dto.Ten,
                DangOnline = true,
                LanCuoiOnline = DateTime.UtcNow,
                TrangThai = true
            };

            _context.NguoiDungs.Add(userMoi);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đăng ký thành công!", UserId = userMoi.Id });
        }

        [HttpPost("dang-nhap")]
        public async Task<IActionResult> DangNhap([FromBody] DangNhapDto dto)
        {
            var user = await _context.NguoiDungs
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.MatKhau == dto.MatKhau);

            if (user == null)
                return Unauthorized("Email hoặc mật khẩu không chính xác.");

            if (user.TrangThai == false)
                return StatusCode(403, "Tài khoản của bạn đã bị khóa.");

            user.DangOnline = true;
            user.LanCuoiOnline = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var returnData = new NguoiDungDto
            {
                Id = user.Id,
                Ten = user.Ten,
                Email = user.Email,
                AnhDaiDien = user.AnhDaiDien,
                DangOnline = user.DangOnline,
                LanCuoiOnline = user.LanCuoiOnline
            };

            return Ok(new { Message = "Đăng nhập thành công", User = returnData });
        }

        [HttpGet("tim-kiem")]
        public async Task<IActionResult> TimKiem(string tuKhoa, Guid nguoiGoiId)
        {
            if (string.IsNullOrWhiteSpace(tuKhoa))
                return Ok(new List<NguoiDungDto>());

            var users = await _context.NguoiDungs
                .AsNoTracking()
                .Where(u => u.Id != nguoiGoiId &&
                           (u.Ten.Contains(tuKhoa) || u.Email.Contains(tuKhoa)) &&
                           u.TrangThai == true)
                .Take(20)
                .Select(u => new NguoiDungDto
                {
                    Id = u.Id,
                    Ten = u.Ten,
                    Email = u.Email,
                    AnhDaiDien = u.AnhDaiDien,
                    DangOnline = u.DangOnline
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(Guid id)
        {
            var user = await _context.NguoiDungs
                .AsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => new NguoiDungDto
                {
                    Id = u.Id,
                    Ten = u.Ten,
                    Email = u.Email,
                    AnhDaiDien = u.AnhDaiDien,
                    DangOnline = u.DangOnline,
                    LanCuoiOnline = u.LanCuoiOnline
                })
                .FirstOrDefaultAsync();

            if (user == null) return NotFound("Không tìm thấy người dùng");

            return Ok(user);
        }

        [HttpPost("cap-nhat-ho-so")]
        public async Task<IActionResult> CapNhatHoSo([FromForm] Guid id, [FromForm] string ten, IFormFile file)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null) return NotFound("Không tìm thấy user");

            user.Ten = ten;

            if (file != null && file.Length > 0)
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                user.AnhDaiDien = $"data:{file.ContentType};base64,{Convert.ToBase64String(memoryStream.ToArray())}";
            }

            await _context.SaveChangesAsync();
            return Ok(new { Id = user.Id, Ten = user.Ten, Email = user.Email, AnhDaiDien = user.AnhDaiDien, DangOnline = user.DangOnline });
        }

        // 🚀 DTO hỗ trợ lấy thông tin
        public class LayUsersDto { public List<string> UserIds { get; set; } = new List<string>(); }

        // 🚀 ĐÃ FIX: Mở comment, nhận đúng param là UserIds list (Khớp 100% với Frontend)
        [HttpPost("lay-thong-tin-users")]
        public async Task<IActionResult> LayThongTinUsers([FromBody] LayUsersDto dto)
        {
            if (dto.UserIds == null || !dto.UserIds.Any()) return Ok(new List<object>());

            var users = await _context.NguoiDungs
                .AsNoTracking()
                .Where(u => dto.UserIds.Contains(u.Id.ToString()))
                .Select(u => new { Id = u.Id, Ten = u.Ten, AnhDaiDien = u.AnhDaiDien })
                .ToListAsync();

            return Ok(users);
        }
    }
}