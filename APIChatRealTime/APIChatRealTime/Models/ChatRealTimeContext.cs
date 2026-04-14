using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace APIChatRealTime.Models;

public partial class ChatRealTimeContext : DbContext
{
    public ChatRealTimeContext()
    {
    }

    public ChatRealTimeContext(DbContextOptions<ChatRealTimeContext> options)
        : base(options)
    {
    }

    public virtual DbSet<NguoiDung> NguoiDungs { get; set; }

    public virtual DbSet<PhongChat> PhongChats { get; set; }

    public virtual DbSet<ThanhVien> ThanhViens { get; set; }

    public virtual DbSet<TinNhan> TinNhans { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Data Source=.;Initial Catalog=ChatRealTime;Integrated Security=True;Trust Server Certificate=True;Application Intent=ReadWrite;Multi Subnet Failover=False");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__NguoiDun__3214EC07495C9A6D");

            entity.ToTable("NguoiDung");

            entity.HasIndex(e => e.Email, "UQ__NguoiDun__A9D105349718D533").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.DangOnline).HasDefaultValue(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.LanCuoiOnline).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.MatKhau).IsUnicode(false);
            entity.Property(e => e.Ten).HasMaxLength(100);
            entity.Property(e => e.TrangThai).HasDefaultValue(true);
        });

        modelBuilder.Entity<PhongChat>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PhongCha__3214EC07B0D1D4CF");

            entity.ToTable("PhongChat");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.LaNhom).HasDefaultValue(false);
            entity.Property(e => e.NgayCapNhat).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.TenPhong).HasMaxLength(200);

            entity.HasOne(d => d.NguoiTao).WithMany(p => p.PhongChats)
                .HasForeignKey(d => d.NguoiTaoId)
                .HasConstraintName("FK_PhongChat_NguoiDung");
        });

        modelBuilder.Entity<ThanhVien>(entity =>
        {
            entity.HasKey(e => new { e.PhongChatId, e.NguoiDungId }).HasName("PK__ThanhVie__C0E0A4ACB1FEE785");

            entity.ToTable("ThanhVien");

            entity.Property(e => e.NgayThamGia).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.NguoiDung).WithMany(p => p.ThanhViens)
                .HasForeignKey(d => d.NguoiDungId)
                .HasConstraintName("FK_ThanhVien_NguoiDung");

            entity.HasOne(d => d.PhongChat).WithMany(p => p.ThanhViens)
                .HasForeignKey(d => d.PhongChatId)
                .HasConstraintName("FK_ThanhVien_PhongChat");
        });

        modelBuilder.Entity<TinNhan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TinNhan__3214EC0742549855");

            entity.ToTable("TinNhan");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.NgayTao).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.NguoiGui).WithMany(p => p.TinNhans)
                .HasForeignKey(d => d.NguoiGuiId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TinNhan_NguoiDung");

            entity.HasOne(d => d.PhongChat).WithMany(p => p.TinNhans)
                .HasForeignKey(d => d.PhongChatId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TinNhan_PhongChat");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
