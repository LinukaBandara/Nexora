using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexora.Domain.Notifications;

namespace Nexora.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.Property(n => n.Type).HasConversion<string>().HasMaxLength(32);
        builder.Property(n => n.Title).HasMaxLength(256).IsRequired();
        builder.Property(n => n.Message).HasMaxLength(1024).IsRequired();

        // Powers the notification bell's unread count and the notification list, newest first.
        builder.HasIndex(n => new { n.OrganizationId, n.IsRead, n.CreatedAt });

        builder.UseXminAsConcurrencyToken();
    }
}
