namespace APIChatRealTime.DTO.Room
{
    public class RoomResponse
    {
        public Guid Id { get; set; }
        public string? TenPhong { get; set; }
        public string? AnhDaiDienPhong { get; set; }
        public bool LaNhom { get; set; }
        public Guid? NguoiTaoId { get; set; }
        public DateTime? NgayCapNhat { get; set; }
        public string? TinNhanCuoi { get; set; }
    }
}
