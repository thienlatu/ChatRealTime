namespace APIChatRealTime.DTO.Chat
{
    public class ChatResponse
    {
        public Guid Id { get; set; }

        public Guid? PhongChatId { get; set; }

        public string? TenPhong { get; set; }
        public Guid NguoiGuiId { get; set; }
        public string TenNguoiGui { get; set; } = null!;
        public string AnhDaiDien { get; set; } = null!;
        public byte LoaiTinNhan { get; set; }
        public string NoiDung { get; set; } = null!;
        public DateTime? NgayTao { get; set; }
  
    }


}
