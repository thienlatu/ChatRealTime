namespace APIChatRealTime.DTO.Room
{
    public class CreateRoomRequest
    {
        public string? TenPhong { get; set; }
        public bool LaNhom { get; set; }
        public List<Guid> MemberIds { get; set; } = new List<Guid>();
    }
}
