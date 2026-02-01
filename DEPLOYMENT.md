# 🚀 Deploy Nuunz to Netlify

Your project is ready to deploy! Follow these simple steps to get Nuunz live with HTTPS.

## ✅ Already Configured

- `netlify.toml` - Build configuration created
- Production build tested and working
- All files ready for deployment

## 🎯 Deployment Options

### Option 1: Netlify Web UI (Easiest - Recommended)

1. **Go to [Netlify](https://app.netlify.com/)**
   - Sign in or create a free account

2. **Click "Add new site" → "Deploy manually"**

3. **Drag and drop your `dist` folder**
   - The `dist` folder is located in your project root
   - Just drag the entire folder into the Netlify UI

4. **Done!**
   - Netlify will give you a URL like: `https://random-name-123.netlify.app`
   - Your app is now live with HTTPS!

### Option 2: Connect Git Repository (Best for Continuous Deployment)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to [Netlify](https://app.netlify.com/)**
   - Click "Add new site" → "Import an existing project"

3. **Connect to GitHub**
   - Select your repository
   - Netlify auto-detects settings from `netlify.toml`

4. **Click "Deploy site"**
   - Netlify builds and deploys automatically
   - Future git pushes auto-deploy!

### Option 3: Netlify CLI (Terminal)

1. **Login to Netlify**
   ```bash
   npx netlify-cli login
   ```
   - This opens your browser to authorize

2. **Deploy**
   ```bash
   npx netlify-cli deploy --prod --dir=dist
   ```
   - Follow prompts to create/select a site

## 📋 After Deployment Checklist

Once your site is live, you need to update a few things:

### 1. Update Google OAuth Redirect URLs

Go to [Google Cloud Console](https://console.cloud.google.com/) → Your Project → Credentials:

**Add these Authorized JavaScript origins:**
```
https://your-app-name.netlify.app
```

**Add these Authorized redirect URIs:**
```
https://your-app-name.netlify.app
https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback
```

### 2. Update Supabase Site URL

Go to [Supabase Dashboard](https://app.supabase.com/) → Your Project → Authentication → URL Configuration:

**Set Site URL to:**
```
https://your-app-name.netlify.app
```

**Add to Redirect URLs:**
```
https://your-app-name.netlify.app/**
```

### 3. Test Google Sign-In on Mobile

1. Open your Netlify URL on your mobile device
2. Click Settings → "Continue with Google"
3. Sign in with Google
4. You should be redirected back and signed in!

## 🔧 Environment Variables

Your `.env` file is NOT deployed (this is correct for security). Netlify needs the environment variables:

**In Netlify Dashboard → Site settings → Environment variables, add:**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then **redeploy** the site for variables to take effect.

## 🎨 Custom Domain (Optional)

Want a custom domain like `nuunz.com`?

1. **In Netlify:** Site settings → Domain management → Add custom domain
2. **Update DNS:** Point your domain to Netlify's nameservers
3. **HTTPS auto-enabled:** Netlify provides free SSL certificates
4. **Update OAuth URLs:** Add your custom domain to Google Console and Supabase

## 🔄 Continuous Deployment

If you connected via Git:
- Every push to `main` branch auto-deploys
- Pull requests get preview URLs
- Rollback to any previous deploy in one click

## 📱 Progressive Web App (PWA)

Your app can be "installed" on mobile:
1. Visit site in mobile browser
2. Click "Add to Home Screen"
3. App opens like a native app!

## 🚨 Troubleshooting

### Build fails on Netlify
- Check environment variables are set
- Verify `netlify.toml` is in repository root
- Check build logs for specific errors

### Google OAuth doesn't work
- Verify redirect URLs in Google Console
- Check Site URL in Supabase matches your Netlify URL
- Clear browser cache and try again

### Environment variables not working
- Must start with `VITE_` prefix
- Must redeploy after adding variables
- Check spelling matches exactly

## 📊 Netlify Features You Get Free

- HTTPS/SSL certificates
- CDN (fast worldwide)
- Continuous deployment
- Instant rollbacks
- Deploy previews
- Form handling
- Serverless functions
- 100GB bandwidth/month

## 🎉 Quick Deploy (30 seconds)

**Fastest way to get live right now:**

1. Open [Netlify Drop](https://app.netlify.com/drop)
2. Drag your `dist` folder
3. Get your HTTPS URL instantly
4. Update Google OAuth and Supabase settings

That's it! Your app is live! 🚀

---

## 📍 Your Project Status

✅ Build tested and working
✅ `netlify.toml` configured
✅ Production files ready in `dist/`
✅ Google Sign-In implemented
✅ Ready to deploy!

Just follow Option 1 above to get live in under 1 minute!
