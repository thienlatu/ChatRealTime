namespace APIChatRealTime.DTO
{
    public class NguoiDungDto
    {
        public Guid Id { get; set; }
        public string Ten { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? AnhDaiDien { get; set; }
        public bool? DangOnline { get; set; }
        public DateTime? LanCuoiOnline { get; set; }
    }

    // Body cho API Đăng Ký
    public class DangKyDto
    {
        public string Ten { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
    }

    // Body cho API Đăng Nhập
    public class DangNhapDto
    {
        public string Email { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
    }
}
