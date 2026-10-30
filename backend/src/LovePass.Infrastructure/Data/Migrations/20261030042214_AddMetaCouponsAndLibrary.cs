using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LovePass.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMetaCouponsAndLibrary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TargetIssuedCouponId",
                table: "Redemptions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetSnapshot",
                table: "Redemptions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetTemplateId",
                table: "Redemptions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Effect",
                table: "CouponTemplates",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<bool>(
                name: "MetaLocked",
                table: "CouponTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Redemptions_TargetIssuedCouponId",
                table: "Redemptions",
                column: "TargetIssuedCouponId");

            migrationBuilder.CreateIndex(
                name: "IX_Redemptions_TargetTemplateId",
                table: "Redemptions",
                column: "TargetTemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Redemptions_CouponTemplates_TargetTemplateId",
                table: "Redemptions",
                column: "TargetTemplateId",
                principalTable: "CouponTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Redemptions_IssuedCoupons_TargetIssuedCouponId",
                table: "Redemptions",
                column: "TargetIssuedCouponId",
                principalTable: "IssuedCoupons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            ImportLibrary(migrationBuilder);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            RemoveLibrary(migrationBuilder);

            migrationBuilder.DropForeignKey(
                name: "FK_Redemptions_CouponTemplates_TargetTemplateId",
                table: "Redemptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Redemptions_IssuedCoupons_TargetIssuedCouponId",
                table: "Redemptions");

            migrationBuilder.DropIndex(
                name: "IX_Redemptions_TargetIssuedCouponId",
                table: "Redemptions");

            migrationBuilder.DropIndex(
                name: "IX_Redemptions_TargetTemplateId",
                table: "Redemptions");

            migrationBuilder.DropColumn(
                name: "TargetIssuedCouponId",
                table: "Redemptions");

            migrationBuilder.DropColumn(
                name: "TargetSnapshot",
                table: "Redemptions");

            migrationBuilder.DropColumn(
                name: "TargetTemplateId",
                table: "Redemptions");

            migrationBuilder.DropColumn(
                name: "Effect",
                table: "CouponTemplates");

            migrationBuilder.DropColumn(
                name: "MetaLocked",
                table: "CouponTemplates");
        }
    }
}
