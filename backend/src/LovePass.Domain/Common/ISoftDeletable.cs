namespace LovePass.Domain.Common;

/// <summary>
/// Soft delete — ข้อมูลถูกซ่อนจากทุก query (global query filter) แต่ยังอยู่ใน DB
/// เพื่อคงประวัติอ้างอิง เช่น คูปองที่มอบไปแล้วของ template ที่ถูกลบ
/// เวลาที่ลบบันทึกที่ UpdatedAt
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
}
