using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LovePass.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "CouponTemplates",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Other");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "CouponTemplates");
        }
    }
}
