using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MSC.WebAPI.Models;

namespace MSC.WebAPI.Data
{
    public class ApplicationDbContext : IdentityUserContext<AdminUser, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Member> Members { get; set; }
        public DbSet<MemberType> MemberTypes { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<StudentAchievement> StudentAchievements { get; set; }
        public DbSet<CommunityStatistics> CommunityStatistics { get; set; }
        public DbSet<RatingPeriod> RatingPeriods { get; set; }
        public DbSet<MemberRating> MemberRatings { get; set; }
        public DbSet<Sponsor> Sponsors { get; set; }
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
                    .IsRequired(false)
                    .HasMaxLength(500);
                
                entity.Property(e => e.CertificateUrl)
                    .HasMaxLength(500);
                entity.Property(e => e.PublicId).HasMaxLength(120);
                entity.Property(e => e.Bio).HasMaxLength(3000);
                entity.Property(e => e.GithubUrl).HasMaxLength(500);
                entity.Property(e => e.LinkedInUrl).HasMaxLength(500);
                entity.Property(e => e.FacebookUrl).HasMaxLength(500);
                entity.Property(e => e.InstagramUrl).HasMaxLength(500);
                entity.Property(e => e.WebsiteUrl).HasMaxLength(500);
                entity.Property(e => e.PublicEmail).HasMaxLength(254);
                entity.Property(e => e.PublicPhone).HasMaxLength(16);
                entity.HasIndex(e => e.PublicId).IsUnique().HasFilter("[PublicId] IS NOT NULL");

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
                    .IsRequired(false)
                    .HasMaxLength(500);

                entity.HasIndex(e => e.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
                entity.Property(e => e.Gallery).Metadata.SetMaxLength(null);

                entity.HasIndex(e => e.EventDate);
                entity.HasIndex(e => e.IsUpcoming);
                entity.HasIndex(e => e.IsFeatured);
            });

            // SiteContent configuration
            modelBuilder.Entity<CommunityStatistics>().Property(statistics => statistics.Id).ValueGeneratedNever();
            modelBuilder.Entity<StudentAchievement>().Property(achievement => achievement.StudentNames).Metadata.SetMaxLength(null);
            modelBuilder.Entity<RatingPeriod>(entity =>
            {
                entity.HasIndex(period => new { period.StartDate, period.EndDate }).IsUnique();
                entity.Property(period => period.Version).IsConcurrencyToken();
                entity.HasMany(period => period.Entries).WithOne().HasForeignKey(entry => entry.RatingPeriodId).OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<MemberRating>(entity =>
            {
                entity.HasIndex(entry => new { entry.RatingPeriodId, entry.MemberId }).IsUnique();
                entity.HasOne(entry => entry.Member).WithMany().HasForeignKey(entry => entry.MemberId).OnDelete(DeleteBehavior.Cascade);
                foreach (var property in new[] { nameof(MemberRating.Rate), nameof(MemberRating.OnlineAttendance), nameof(MemberRating.OfflineAttendance), nameof(MemberRating.Tasks), nameof(MemberRating.Projects) })
                    entity.Property(property).HasPrecision(5, 2);
            });
                    modelBuilder.Entity<Sponsor>().HasOne(sponsor => sponsor.Event).WithMany().HasForeignKey(sponsor => sponsor.EventId).OnDelete(DeleteBehavior.SetNull);

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
                entity.ToTable("AdminUsers");
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

                entity.HasIndex(e => e.NormalizedEmail)
                    .HasDatabaseName("EmailIndex")
                    .IsUnique()
                    .HasFilter("[NormalizedEmail] IS NOT NULL");
            });

            // Seed data for MemberTypes
            modelBuilder.Entity<MemberType>().HasData(
                new MemberType { Id = 1, TypeName = "High Board" },
                new MemberType { Id = 2, TypeName = "Board" },
                new MemberType { Id = 3, TypeName = "Golden Member" },
                new MemberType { Id = 4, TypeName = "Member" },
                new MemberType { Id = 5, TypeName = "Instructor" }
            );
        }
    }
}
