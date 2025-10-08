using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Member> Members { get; set; }
        public DbSet<MemberType> MemberTypes { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<SiteContent> SiteContents { get; set; }
        public DbSet<AdminUser> AdminUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Member configuration
            modelBuilder.Entity<Member>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.FullName)
                    .IsRequired()
                    .HasMaxLength(200);
                
                entity.Property(e => e.PositionTitle)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.ImageUrl)
                    .IsRequired()
                    .HasMaxLength(500);
                
                entity.Property(e => e.CertificateUrl)
                    .HasMaxLength(500);

                // Configure relationship with MemberType
                entity.HasOne(e => e.MemberType)
                    .WithMany(mt => mt.Members)
                    .HasForeignKey(e => e.MemberTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.DisplayOrder);
            });

            // MemberType configuration
            modelBuilder.Entity<MemberType>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.TypeName)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(e => e.TypeName)
                    .IsUnique();
            });

            // Event configuration
            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(200);
                
                entity.Property(e => e.Description)
                    .IsRequired();
                
                entity.Property(e => e.ImageUrl)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.HasIndex(e => e.EventDate);
                entity.HasIndex(e => e.IsUpcoming);
                entity.HasIndex(e => e.IsFeatured);
            });

            // SiteContent configuration
            modelBuilder.Entity<SiteContent>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.ContentKey)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.ContentValue)
                    .IsRequired();

                entity.HasIndex(e => e.ContentKey)
                    .IsUnique();
            });

            // AdminUser configuration
            modelBuilder.Entity<AdminUser>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(256);
                
                entity.Property(e => e.PasswordHash)
                    .IsRequired();

                entity.Property(e => e.Role)
                    .HasConversion<string>(); // Store enum as string

                entity.HasIndex(e => e.Email)
                    .IsUnique();
            });

            // Seed data for MemberTypes
            modelBuilder.Entity<MemberType>().HasData(
                new MemberType { Id = 1, TypeName = "High Board" },
                new MemberType { Id = 2, TypeName = "Board" },
                new MemberType { Id = 3, TypeName = "Golden Member" }
            );
        }
    }
}
