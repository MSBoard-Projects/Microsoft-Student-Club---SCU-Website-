using MSC.WebAPI.Data;
using MSC.WebAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MSC.WebAPI.Utilities;

public static class SampleDataSeeder
{
    public static async Task SeedSampleData(ApplicationDbContext context)
    {
        Console.WriteLine("\n========================================");
        Console.WriteLine("  Seeding Sample Data");
        Console.WriteLine("========================================\n");

        // Seed Member Types first (if not exists)
        await SeedMemberTypes(context);

        // Seed Sample Members
        await SeedMembers(context);

        // Seed Sample Events
        await SeedEvents(context);

        // Seed Sample Site Content
        await SeedSiteContent(context);

        Console.WriteLine("\n========================================");
        Console.WriteLine("  ✅ Sample Data Seeded Successfully!");
        Console.WriteLine("========================================\n");
    }

    private static async Task SeedMemberTypes(ApplicationDbContext context)
    {
        if (await context.MemberTypes.AnyAsync())
        {
            Console.WriteLine("⏭️  Member types already exist. Skipping...");
            return;
        }

        var memberTypes = new List<MemberType>
        {
            new MemberType { TypeName = "High Board" },
            new MemberType { TypeName = "Board" },
            new MemberType { TypeName = "Golden Member" }
        };

        context.MemberTypes.AddRange(memberTypes);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ Created {memberTypes.Count} member types");
    }

    private static async Task SeedMembers(ApplicationDbContext context)
    {
        if (await context.Members.AnyAsync())
        {
            Console.WriteLine("⏭️  Members already exist. Skipping...");
            return;
        }

        // Get member type IDs
        var highBoardType = await context.MemberTypes.FirstAsync(mt => mt.TypeName == "High Board");
        var boardType = await context.MemberTypes.FirstAsync(mt => mt.TypeName == "Board");
        var goldenMemberType = await context.MemberTypes.FirstAsync(mt => mt.TypeName == "Golden Member");

        var members = new List<Member>
        {
            // High Board Members
            new Member
            {
                FullName = "Sarah Johnson",
                PositionTitle = "President",
                MemberTypeId = highBoardType.Id,
                DisplayOrder = 1,
                ImageUrl = "https://ui-avatars.com/api/?name=Sarah+Johnson&size=200&background=0078d4&color=fff&bold=true"
            },
            new Member
            {
                FullName = "Michael Chen",
                PositionTitle = "Vice President",
                MemberTypeId = highBoardType.Id,
                DisplayOrder = 2,
                ImageUrl = "https://ui-avatars.com/api/?name=Michael+Chen&size=200&background=203a6c&color=fff&bold=true"
            },
            new Member
            {
                FullName = "Emily Rodriguez",
                PositionTitle = "Secretary",
                MemberTypeId = highBoardType.Id,
                DisplayOrder = 3,
                ImageUrl = "https://ui-avatars.com/api/?name=Emily+Rodriguez&size=200&background=50e6ff&color=000&bold=true"
            },

            // Board Members
            new Member
            {
                FullName = "David Kim",
                PositionTitle = "Technical Lead",
                MemberTypeId = boardType.Id,
                DisplayOrder = 4,
                ImageUrl = "https://ui-avatars.com/api/?name=David+Kim&size=200&background=0078d4&color=fff&bold=true"
            },
            new Member
            {
                FullName = "Jessica Thompson",
                PositionTitle = "Events Coordinator",
                MemberTypeId = boardType.Id,
                DisplayOrder = 5,
                ImageUrl = "https://ui-avatars.com/api/?name=Jessica+Thompson&size=200&background=203a6c&color=fff&bold=true"
            },
            new Member
            {
                FullName = "Ahmed Al-Rashid",
                PositionTitle = "Marketing Director",
                MemberTypeId = boardType.Id,
                DisplayOrder = 6,
                ImageUrl = "https://ui-avatars.com/api/?name=Ahmed+AlRashid&size=200&background=50e6ff&color=000&bold=true"
            },
            new Member
            {
                FullName = "Maria Garcia",
                PositionTitle = "Community Manager",
                MemberTypeId = boardType.Id,
                DisplayOrder = 7,
                ImageUrl = "https://ui-avatars.com/api/?name=Maria+Garcia&size=200&background=0078d4&color=fff&bold=true"
            },

            // Golden Members
            new Member
            {
                FullName = "Robert Anderson",
                PositionTitle = "Alumni - Software Engineer at Microsoft",
                MemberTypeId = goldenMemberType.Id,
                DisplayOrder = 8,
                ImageUrl = "https://ui-avatars.com/api/?name=Robert+Anderson&size=200&background=ffd700&color=000&bold=true"
            },
            new Member
            {
                FullName = "Lisa Nguyen",
                PositionTitle = "Alumni - Cloud Architect at Azure",
                MemberTypeId = goldenMemberType.Id,
                DisplayOrder = 9,
                ImageUrl = "https://ui-avatars.com/api/?name=Lisa+Nguyen&size=200&background=ffd700&color=000&bold=true"
            },
            new Member
            {
                FullName = "James Patterson",
                PositionTitle = "Alumni - AI Researcher",
                MemberTypeId = goldenMemberType.Id,
                DisplayOrder = 10,
                ImageUrl = "https://ui-avatars.com/api/?name=James+Patterson&size=200&background=ffd700&color=000&bold=true"
            },
            new Member
            {
                FullName = "Sophia Williams",
                PositionTitle = "Alumni - Data Scientist at Google",
                MemberTypeId = goldenMemberType.Id,
                DisplayOrder = 11,
                ImageUrl = "https://ui-avatars.com/api/?name=Sophia+Williams&size=200&background=ffd700&color=000&bold=true"
            },
            new Member
            {
                FullName = "Daniel Lee",
                PositionTitle = "Alumni - DevOps Engineer",
                MemberTypeId = goldenMemberType.Id,
                DisplayOrder = 12,
                ImageUrl = "https://ui-avatars.com/api/?name=Daniel+Lee&size=200&background=ffd700&color=000&bold=true"
            },
            new Member
            {
                FullName = "Olivia Brown",
                PositionTitle = "Alumni - Product Manager at Microsoft",
                MemberTypeId = goldenMemberType.Id,
                DisplayOrder = 13,
                ImageUrl = "https://ui-avatars.com/api/?name=Olivia+Brown&size=200&background=ffd700&color=000&bold=true"
            }
        };

        context.Members.AddRange(members);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ Created {members.Count} sample members:");
        Console.WriteLine($"   - {members.Count(m => m.MemberTypeId == highBoardType.Id)} High Board");
        Console.WriteLine($"   - {members.Count(m => m.MemberTypeId == boardType.Id)} Board");
        Console.WriteLine($"   - {members.Count(m => m.MemberTypeId == goldenMemberType.Id)} Golden Members");
    }

    private static async Task SeedEvents(ApplicationDbContext context)
    {
        if (await context.Events.AnyAsync())
        {
            Console.WriteLine("⏭️  Events already exist. Skipping...");
            return;
        }

        var events = new List<Event>
        {
            // Event 1: Tech Summit 2025 (Upcoming & Featured)
            new Event
            {
                Title = "Tech Summit 2025",
                Description = "Join us for our biggest event of the year! A full-day conference featuring keynote speakers from Microsoft, hands-on workshops, and networking opportunities with industry professionals.",
                EventDate = new DateTime(2025, 12, 15, 9, 0, 0),
                IsUpcoming = true,
                IsFeatured = true,
                ImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop" // Tech conference
            },

            // Event 2: Cloud Computing Workshop (Upcoming)
            new Event
            {
                Title = "Cloud Computing Workshop",
                Description = "Learn the fundamentals of cloud architecture using Microsoft Azure. This hands-on workshop covers virtual machines, storage solutions, and basic networking concepts.",
                EventDate = new DateTime(2025, 11, 22, 14, 0, 0),
                IsUpcoming = true,
                IsFeatured = false,
                ImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop" // Cloud/technology
            },

            // Event 3: Game Development Hackathon (Upcoming & Featured)
            new Event
            {
                Title = "Game Development Hackathon",
                Description = "A 48-hour hackathon focused on creating innovative games using Unity and Unreal Engine. Teams will compete for prizes and mentorship opportunities. Pizza and energy drinks provided!",
                EventDate = new DateTime(2025, 11, 8, 18, 0, 0),
                IsUpcoming = true,
                IsFeatured = true,
                ImageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop" // People gaming/coding
            },

            // Event 4: Azure AI Bootcamp (Past & Featured)
            new Event
            {
                Title = "Azure AI Bootcamp",
                Description = "An intensive three-day bootcamp covering Azure's AI and Machine Learning services. Certificates were awarded to participants who completed all modules and the final project.",
                EventDate = new DateTime(2025, 4, 20, 9, 0, 0),
                IsUpcoming = false,
                IsFeatured = true,
                ImageUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop" // AI/ML technology
            },

            // Additional Past Events
            new Event
            {
                Title = "Web Development Basics",
                Description = "Introduction to HTML, CSS, and JavaScript for beginners. Students built their first responsive website by the end of the workshop.",
                EventDate = new DateTime(2025, 3, 10, 15, 0, 0),
                IsUpcoming = false,
                IsFeatured = false,
                ImageUrl = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop" // Web development
            },

            new Event
            {
                Title = "Cybersecurity Essentials",
                Description = "Learn about network security, encryption, and best practices for protecting your digital assets. Guest speaker from Microsoft Security team.",
                EventDate = new DateTime(2025, 2, 15, 13, 0, 0),
                IsUpcoming = false,
                IsFeatured = false,
                ImageUrl = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop" // Cybersecurity
            },

            // Additional Upcoming Events
            new Event
            {
                Title = "Introduction to DevOps",
                Description = "Explore CI/CD pipelines, containerization with Docker, and deployment strategies using Azure DevOps. Hands-on labs included.",
                EventDate = new DateTime(2025, 11, 30, 10, 0, 0),
                IsUpcoming = true,
                IsFeatured = false,
                ImageUrl = "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=600&fit=crop" // DevOps/containers
            },

            new Event
            {
                Title = "Mobile App Development with React Native",
                Description = "Build cross-platform mobile applications using React Native. Create your first iOS and Android app in this intensive workshop.",
                EventDate = new DateTime(2025, 12, 5, 14, 0, 0),
                IsUpcoming = true,
                IsFeatured = false,
                ImageUrl = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop" // Mobile development
            }
        };

        context.Events.AddRange(events);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ Created {events.Count} sample events:");
        Console.WriteLine($"   - {events.Count(e => e.IsUpcoming)} Upcoming");
        Console.WriteLine($"   - {events.Count(e => !e.IsUpcoming)} Past");
        Console.WriteLine($"   - {events.Count(e => e.IsFeatured)} Featured");
    }

    private static async Task SeedSiteContent(ApplicationDbContext context)
    {
        if (await context.SiteContent.AnyAsync())
        {
            Console.WriteLine("⏭️  Site content already exists. Skipping...");
            return;
        }

        var siteContent = new List<SiteContent>
        {
            new SiteContent
            {
                ContentKey = "hero_title",
                ContentValue = "Welcome to Microsoft Student Club at SCU"
            },
            new SiteContent
            {
                ContentKey = "hero_subtitle",
                ContentValue = "Empowering students through technology, innovation, and community"
            },
            new SiteContent
            {
                ContentKey = "vision_title",
                ContentValue = "Our Vision"
            },
            new SiteContent
            {
                ContentKey = "vision_description",
                ContentValue = "To create a vibrant community of tech enthusiasts who learn, build, and innovate together while preparing for successful careers in technology."
            },
            new SiteContent
            {
                ContentKey = "mission_title",
                ContentValue = "Our Mission"
            },
            new SiteContent
            {
                ContentKey = "mission_description",
                ContentValue = "We provide hands-on learning experiences, industry connections, and collaborative projects that bridge the gap between academic knowledge and real-world technology skills."
            }
        };

        context.SiteContent.AddRange(siteContent);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ Created {siteContent.Count} site content entries");
    }
}
