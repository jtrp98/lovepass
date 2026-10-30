using LovePass.Domain.Entities;
using LovePass.Domain.Enums;

namespace LovePass.Application.UnitTests;

public class CoupleTests
{
    [Fact]
    public void TryDissolve_ChangesStatusOnce_AndKeepsMembers()
    {
        var couple = new Couple { Members = [new CoupleMember { UserId = 1 }, new CoupleMember { UserId = 2 }] };

        Assert.True(couple.TryDissolve());
        Assert.Equal(CoupleStatus.Dissolved, couple.Status);
        Assert.Equal(2, couple.Members.Count);

        Assert.False(couple.TryDissolve());
    }
}
