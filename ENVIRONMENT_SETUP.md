# Environment Setup for Vite and Supabase

This document provides instructions for setting up environment variables for this project, which uses Vite and Supabase.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Vite Environment Variables
VITE_APP_TITLE="HomeReview App"

# Supabase Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Supabase Credentials

1. Log in to your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project
3. Go to Project Settings > API
4. Copy the URL and anon key values
5. Paste them into your `.env` file

## Vite Environment Variables

- All environment variables for Vite must be prefixed with `VITE_`
- Access them in your code with `import.meta.env.VITE_VARIABLE_NAME`

## Development Usage

The environment is already set up to use these variables. Simply run:

```bash
npm run dev
```

## Production Deployment

For production, make sure to set these environment variables in your hosting platform (Vercel, Netlify, etc.).

## Environment Types

You can create different environment files for different environments:

- `.env`: Default environment variables
- `.env.local`: Local overrides (gitignored)
- `.env.development`: Development environment
- `.env.production`: Production environment

Remember to never commit sensitive values to your repository. The `.env` file should be included in your `.gitignore`. 