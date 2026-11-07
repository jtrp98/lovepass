using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LovePass.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGiftBatchTitleAndOpenedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OpenedAt",
                table: "GiftBatches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "GiftBatches",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OpenedAt",
                table: "GiftBatches");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "GiftBatches");
        }
    }
}
