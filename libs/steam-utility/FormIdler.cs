using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace SteamUtility
{
    public partial class FormIdler : Form
    {
        private long appid;
        private DateTime startTime;
        private Timer timer;
        private string appName;

        public FormIdler(long appid)
        {
            this.appid = appid;
            InitializeComponent();
            appHeader.Load(
                $"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header_292x136.jpg"
            );

            startTime = DateTime.Now;
            timer = new Timer();
            timer.Interval = 1000;
            timer.Tick += Timer_Tick;
            timer.Start();
        }

        private async void FormIdler_Load(object sender, EventArgs e)
        {
            await GetAppName(appid);
        }

        private void Timer_Tick(object sender, EventArgs e)
        {
            TimeSpan elapsed = DateTime.Now - startTime;
            string timeString = elapsed.ToString(@"hh\:mm\:ss");
            this.Text = $"{appName} [{appid}] - {timeString}";
        }

        private async Task GetAppName(long appid)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    var response = await client.GetAsync(
                        $"https://store.steampowered.com/api/appdetails?l=english&appids={appid}"
                    );
                    response.EnsureSuccessStatusCode();
                    var responseBody = await response.Content.ReadAsStringAsync();

                    var jsonData = JsonConvert.DeserializeObject<Dictionary<string, JObject>>(
                        responseBody
                    );
                    var data = (JObject)jsonData[appid.ToString()];
                    appName = (string)data["data"]["name"];
                    if (string.IsNullOrWhiteSpace(appName))
                    {
                        appName = "Unknown Game";
                    }
                }
            }
            catch (Exception)
            {
                appName = "Idling";
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);
            timer.Stop();
            timer.Dispose();
        }
    }
}
