<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/106CKf6Jp8cNW3PniFtPQb13Y9yeq4slG

## Supabase Setup

This app uses Supabase for clinical data storage and authentication.

1. **Create a Supabase Project:** Go to [supabase.com](https://supabase.com) and create a new project.
2. **Configure Environment Variables:** Add your Supabase URL and Anon Key to `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Initialize Database:** Run the contents of [supabase_setup.sql](supabase_setup.sql) in your Supabase SQL Editor. This will create:
   - Tables: `prescriptions`, `lab_reports`, `clinical_insights`
   - Security Policies (RLS)
4. **Create Storage Buckets:** In the Supabase Dashboard, go to **Storage** and create the following buckets:
   - `prescriptions` (Public: No)
   - `reports` (Public: No)
   - `lab_reports` (Public: No)
5. **Enable Google Auth (Optional):** If you want to use Google Login, configure it in **Authentication > Providers**.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
