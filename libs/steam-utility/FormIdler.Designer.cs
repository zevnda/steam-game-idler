using System;

namespace SteamUtility
{
    partial class FormIdler
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(FormIdler));
            this.appHeader = new System.Windows.Forms.PictureBox();

            this.SuspendLayout();

            // appHeader
            this.appHeader.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            this.appHeader.Location = new System.Drawing.Point(-1, 0);
            this.appHeader.Name = "appHeader";
            this.appHeader.Size = new System.Drawing.Size(292, 136);
            this.appHeader.TabIndex = 0;
            this.appHeader.TabStop = false;

            // FormIdler
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(291, 136);
            this.Controls.Add(this.appHeader);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.Icon = new System.Drawing.Icon(System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico"));
            this.MaximizeBox = false;
            this.Name = "FormIdler";
            this.Load += new System.EventHandler(this.FormIdler_Load);
            this.ResumeLayout(false);
        }

        #endregion

        private System.Windows.Forms.PictureBox appHeader;
    }
}