using System;
using System.Collections.Generic;

namespace APIChatRealTime.Models;

public partial class ThanhVien
{
    public Guid PhongChatId { get; set; }

    public Guid NguoiDungId { get; set; }

    public DateTime? NgayThamGia { get; set; }

    public Guid? TinDaXemCuoiId { get; set; }

    public virtual NguoiDung NguoiDung { get; set; } = null!;

    public virtual PhongChat PhongChat { get; set; } = null!;
}
