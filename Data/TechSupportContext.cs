using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace SupportTicketSysterm.Data;

public partial class TechSupportContext : DbContext
{
    public TechSupportContext()
    {
    }

    public TechSupportContext(DbContextOptions<TechSupportContext> options)
        : base(options)
    {
    }

    public virtual DbSet<DanhGium> DanhGia { get; set; }

    public virtual DbSet<DanhMuc> DanhMucs { get; set; }

    public virtual DbSet<DichVu> DichVus { get; set; }

    public virtual DbSet<FileDinhKem> FileDinhKems { get; set; }

    public virtual DbSet<KhachHang> KhachHangs { get; set; }

    public virtual DbSet<LichHen> LichHens { get; set; }

    public virtual DbSet<LichSuHoTro> LichSuHoTros { get; set; }

    public virtual DbSet<LienHe> LienHes { get; set; }

    public virtual DbSet<NhanVien> NhanViens { get; set; }

    public virtual DbSet<PhieuHoTro> PhieuHoTros { get; set; }

    public virtual DbSet<TaiKhoanOtp> TaiKhoanOtps { get; set; }

    public virtual DbSet<TinNhan> TinNhans { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=LAPTOP-EUOBO6JQ;Initial Catalog=TechSupport;Integrated Security=True;Encrypt=True;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DanhGium>(entity =>
        {
            entity.HasKey(e => e.IdDanhGia).HasName("PK__DanhGia__81F722D23D384ECE");

            entity.HasIndex(e => e.IdPhieu, "UQ__DanhGia__48C313843604E870").IsUnique();

            entity.Property(e => e.NgayDanhGia)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.NhanXet).HasMaxLength(1000);

            entity.HasOne(d => d.IdPhieuNavigation).WithOne(p => p.DanhGium)
                .HasForeignKey<DanhGium>(d => d.IdPhieu)
                .HasConstraintName("FK__DanhGia__IdPhieu__66603565");
        });

        modelBuilder.Entity<DanhMuc>(entity =>
        {
            entity.HasKey(e => e.IdDanhMuc).HasName("PK__DanhMuc__7E5B713D86F9EB57");

            entity.ToTable("DanhMuc");

            entity.Property(e => e.MoTa).HasMaxLength(255);
            entity.Property(e => e.NgayTao).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.TenDanhMuc).HasMaxLength(100);
            entity.Property(e => e.TrangThai).HasMaxLength(100);
        });

        modelBuilder.Entity<DichVu>(entity =>
        {
            entity.HasKey(e => e.IdDichVu).HasName("PK__DichVu__C817D5DC49787F5A");

            entity.ToTable("DichVu");

            entity.Property(e => e.MoTa).HasMaxLength(255);
            entity.Property(e => e.NgayTao).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.TenDichVu).HasMaxLength(100);
            entity.Property(e => e.TrangThai).HasMaxLength(100);

            entity.HasOne(d => d.IdDanhMucNavigation).WithMany(p => p.DichVus)
                .HasForeignKey(d => d.IdDanhMuc)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DichVu__IdDanhMu__47DBAE45");
        });

        modelBuilder.Entity<FileDinhKem>(entity =>
        {
            entity.HasKey(e => e.IdFile).HasName("PK__FileDinh__01E644E13B84DED7");

            entity.ToTable("FileDinhKem");

            entity.Property(e => e.DuongDan).HasMaxLength(500);
            entity.Property(e => e.LoaiFile).HasMaxLength(50);
            entity.Property(e => e.NgayUpload)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TenFile).HasMaxLength(255);

            entity.HasOne(d => d.IdDanhGiaNavigation).WithMany(p => p.FileDinhKems)
                .HasForeignKey(d => d.IdDanhGia)
                .HasConstraintName("FK__FileDinhK__IdDan__6B24EA82");

            entity.HasOne(d => d.IdPhieuNavigation).WithMany(p => p.FileDinhKems)
                .HasForeignKey(d => d.IdPhieu)
                .HasConstraintName("FK__FileDinhK__IdPhi__6A30C649");

            entity.HasOne(d => d.IdTinNhanNavigation).WithMany(p => p.FileDinhKems)
                .HasForeignKey(d => d.IdTinNhan)
                .HasConstraintName("FK__FileDinhK__IdTin__6C190EBB");
        });

        modelBuilder.Entity<KhachHang>(entity =>
        {
            entity.HasKey(e => e.IdKhachHang).HasName("PK__KhachHan__7CF5D836A178D854");

            entity.ToTable("KhachHang");

            entity.HasIndex(e => e.Email, "UQ__KhachHan__A9D10534C8FE3D65")
                .IsUnique()
                .HasFilter("([Email] IS NOT NULL)");

            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.HoTen).HasMaxLength(100);
            entity.Property(e => e.MaKh)
                .HasMaxLength(100)
                .HasColumnName("MaKH");
            entity.Property(e => e.MatKhau)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.SoDienThoai).HasMaxLength(15);
            entity.Property(e => e.TrangThai).HasMaxLength(100);
        });

        modelBuilder.Entity<LichHen>(entity =>
        {
            entity.HasKey(e => e.IdLichHen).HasName("PK__LichHen__C7CECEDC30600A2F");

            entity.ToTable("LichHen");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.TrangThai).HasMaxLength(50);

            entity.HasOne(d => d.IdNhanVienNavigation).WithMany(p => p.LichHens)
                .HasForeignKey(d => d.IdNhanVien)
                .HasConstraintName("FK__LichHen__IdNhanV__5DCAEF64");

            entity.HasOne(d => d.IdPhieuNavigation).WithMany(p => p.LichHens)
                .HasForeignKey(d => d.IdPhieu)
                .HasConstraintName("FK__LichHen__IdPhieu__5EBF139D");
        });

        modelBuilder.Entity<LichSuHoTro>(entity =>
        {
            entity.HasKey(e => e.IdLichSu).HasName("PK__LichSuHo__823B17725F23BBB5");

            entity.ToTable("LichSuHoTro");

            entity.Property(e => e.NgayCapNhat).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.NoiDungCapNhat).HasMaxLength(500);
            entity.Property(e => e.TrangThaiCu).HasMaxLength(100);
            entity.Property(e => e.TrangThaiMoi).HasMaxLength(100);

            entity.HasOne(d => d.IdNhanVienNavigation).WithMany(p => p.LichSuHoTros)
                .HasForeignKey(d => d.IdNhanVien)
                .HasConstraintName("FK__LichSuHoT__IdNha__5441852A");

            entity.HasOne(d => d.IdPhieuNavigation).WithMany(p => p.LichSuHoTros)
                .HasForeignKey(d => d.IdPhieu)
                .HasConstraintName("FK__LichSuHoT__IdPhi__534D60F1");
        });

        modelBuilder.Entity<LienHe>(entity =>
        {
            entity.HasKey(e => e.IdLienHe).HasName("PK__LienHe__03AC912A65747A5D");

            entity.ToTable("LienHe");

            entity.Property(e => e.ThoiGianGui).HasColumnType("datetime");
            entity.Property(e => e.TieuDe).HasMaxLength(255);
            entity.Property(e => e.TrangThai).HasMaxLength(100);

            entity.HasOne(d => d.IdKhachHangNavigation).WithMany(p => p.LienHes)
                .HasForeignKey(d => d.IdKhachHang)
                .HasConstraintName("FK__LienHe__IdKhachH__571DF1D5");

            entity.HasOne(d => d.IdNhanVienNavigation).WithMany(p => p.LienHes)
                .HasForeignKey(d => d.IdNhanVien)
                .HasConstraintName("FK__LienHe__IdNhanVi__5812160E");
        });

        modelBuilder.Entity<NhanVien>(entity =>
        {
            entity.HasKey(e => e.IdNhanVien).HasName("PK__NhanVien__B829484532AC2146");

            entity.ToTable("NhanVien");

            entity.HasIndex(e => e.TenDangNhap, "UQ__NhanVien__55F68FC08DF75591").IsUnique();

            entity.HasIndex(e => e.Email, "UQ__NhanVien__A9D10534C79D90BE").IsUnique();

            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.HoTen).HasMaxLength(100);
            entity.Property(e => e.MatKhau).HasMaxLength(255);
            entity.Property(e => e.NgayTao).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.SoDienThoai).HasMaxLength(15);
            entity.Property(e => e.TenDangNhap).HasMaxLength(100);
            entity.Property(e => e.TrangThai).HasMaxLength(100);
            entity.Property(e => e.VaiTro).HasMaxLength(50);
        });

        modelBuilder.Entity<PhieuHoTro>(entity =>
        {
            entity.HasKey(e => e.IdPhieu).HasName("PK__PhieuHoT__48C313854EE11F2E");

            entity.ToTable("PhieuHoTro");

            entity.HasIndex(e => e.MaPhieu, "UQ__PhieuHoT__2660BFE1A2B28B08").IsUnique();

            entity.Property(e => e.CanLichHen).HasMaxLength(100);
            entity.Property(e => e.LoaiYeuCau).HasMaxLength(100);
            entity.Property(e => e.MaPhieu)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.NgayTao).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.TieuDe).HasMaxLength(255);
            entity.Property(e => e.TrangThai).HasMaxLength(100);

            entity.HasOne(d => d.IdDichVuNavigation).WithMany(p => p.PhieuHoTros)
                .HasForeignKey(d => d.IdDichVu)
                .HasConstraintName("FK__PhieuHoTr__IdDic__4F7CD00D");

            entity.HasOne(d => d.IdKhachHangNavigation).WithMany(p => p.PhieuHoTros)
                .HasForeignKey(d => d.IdKhachHang)
                .HasConstraintName("FK__PhieuHoTr__IdKha__4D94879B");

            entity.HasOne(d => d.IdNhanVienNavigation).WithMany(p => p.PhieuHoTros)
                .HasForeignKey(d => d.IdNhanVien)
                .HasConstraintName("FK__PhieuHoTr__IdNha__4E88ABD4");
        });

        modelBuilder.Entity<TaiKhoanOtp>(entity =>
        {
            entity.HasKey(e => e.IdOtp).HasName("PK__TaiKhoan__2A0AD5FD0DE7C3F3");

            entity.ToTable("TaiKhoan_OTP");

            entity.Property(e => e.IdOtp).HasColumnName("IdOTP");
            entity.Property(e => e.HanSuDung).HasColumnType("datetime");
            entity.Property(e => e.Otp)
                .HasMaxLength(6)
                .IsUnicode(false)
                .HasColumnName("OTP");

            entity.HasOne(d => d.IdKhachHangNavigation).WithMany(p => p.TaiKhoanOtps)
                .HasForeignKey(d => d.IdKhachHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OTP_KhachHang");
        });

        modelBuilder.Entity<TinNhan>(entity =>
        {
            entity.HasKey(e => e.IdTinNhan).HasName("PK__TinNhan__C1329D0D9C4927D0");

            entity.ToTable("TinNhan");

            entity.Property(e => e.LoaiNguoiGui).HasMaxLength(100);
            entity.Property(e => e.ThoiGian).HasColumnType("datetime");
            entity.Property(e => e.TinNhan1).HasColumnName("TinNhan");
            entity.Property(e => e.TrangThai).HasMaxLength(100);

            entity.HasOne(d => d.IdLienHeNavigation).WithMany(p => p.TinNhans)
                .HasForeignKey(d => d.IdLienHe)
                .HasConstraintName("FK__TinNhan__IdLienH__5AEE82B9");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
