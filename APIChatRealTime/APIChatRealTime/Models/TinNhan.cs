using System;
using System.Collections.Generic;

namespace APIChatRealTime.Models;

public partial class TinNhan
{
    public Guid Id { get; set; }

    public Guid PhongChatId { get; set; }

    public Guid NguoiGuiId { get; set; }

    public byte LoaiTinNhan { get; set; }

    public string NoiDung { get; set; } = null!;

    public DateTime? NgayTao { get; set; }

    public virtual NguoiDung NguoiGui { get; set; } = null!;

    public virtual PhongChat PhongChat { get; set; } = null!;
}
