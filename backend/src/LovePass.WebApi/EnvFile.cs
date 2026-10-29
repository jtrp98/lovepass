namespace LovePass.WebApi;

/// <summary>
/// โหลดไฟล์ .env (KEY=VALUE) ใน content root ไปตั้งเป็น process environment variable
/// ก่อนสร้าง WebApplicationBuilder — ค่าที่ตั้งไว้ใน environment จริงอยู่แล้วจะไม่ถูกทับ
/// เพื่อให้ .env มีสถานะเทียบเท่า env var (override appsettings แต่แพ้ env var จริง)
/// </summary>
public static class EnvFile
{
    public static void Load(string path)
    {
        if (!File.Exists(path)) return;

        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();

            if (line.Length == 0 || line.StartsWith('#'))
                continue;

            var separator = line.IndexOf('=');
            if (separator <= 0) continue;

            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim().Trim('"');

            if (value.Length == 0) continue;
            if (Environment.GetEnvironmentVariable(key) is null)
                Environment.SetEnvironmentVariable(key, value);
        }
    }
}
